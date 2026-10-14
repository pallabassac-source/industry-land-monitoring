import os
import re
import uuid
import time
import shutil
import logging
from pathlib import Path
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Allowed file extensions per pipeline type
ALLOWED_DRONE_EXTENSIONS = {'.tif', '.tiff', '.geotiff'}
ALLOWED_VECTOR_EXTENSIONS = {'.zip', '.shp', '.geojson', '.json', '.gpkg', '.kml', '.csv'}

# Maximum permitted limits to prevent resource exhaustion / DoS (OWASP A04)
MAX_CHUNK_SIZE_BYTES = 55 * 1024 * 1024  # 55 MB per chunk
MAX_TOTAL_CHUNKS = 2000                   # Up to 2,000 chunks (~100 GB max)
MAX_TOTAL_FILE_SIZE = 10 * 1024 * 1024 * 1024  # 10 GB total file size


def get_temp_chunks_dir():
    media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'mediafiles'))
    chunks_dir = os.path.join(media_root, 'temp_chunks')
    os.makedirs(chunks_dir, exist_ok=True)
    return chunks_dir


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes filename against Path Traversal (OWASP A01 / A03).
    Strips directory separators, null bytes, and non-whitelisted characters.
    """
    if not filename:
        return f"upload_{int(time.time())}.bin"
    # Take only the basename
    clean_name = os.path.basename(filename).strip()
    # Remove null bytes
    clean_name = clean_name.replace('\x00', '')
    # Replace any path traversal patterns
    clean_name = re.sub(r'\.\.+[/\\Release]*', '', clean_name)
    # Whitelist safe characters: alphanumeric, dots, underscores, dashes, spaces
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', clean_name)
    if not clean_name or clean_name.startswith('.'):
        clean_name = f"file_{int(time.time())}_{clean_name.lstrip('.')}"
    return clean_name[:150]


def validate_upload_params(upload_id: str, chunk_index: int, total_chunks: int, 
                           file_name: str, file_type: str, chunk_file=None):
    """
    Strict validation against OWASP Top 10 vulnerabilities:
    - UUID format validation (prevents directory traversal in upload_id)
    - File extension and MIME type validation
    - Chunk bounds and memory exhaustion validation
    """
    # 1. Validate UUID format
    try:
        uuid_obj = uuid.UUID(upload_id)
        if str(uuid_obj) != upload_id.lower():
            raise ValueError("Malformed UUID")
    except (ValueError, AttributeError, TypeError):
        raise ValidationError({"error": "Invalid upload_id: Must be a standard UUID format."})

    # 2. Validate chunk bounds
    if not isinstance(chunk_index, int) or chunk_index < 0:
        raise ValidationError({"error": "Invalid chunk_index: Must be a non-negative integer."})
    if not isinstance(total_chunks, int) or total_chunks < 1 or total_chunks > MAX_TOTAL_CHUNKS:
        raise ValidationError({"error": f"Invalid total_chunks: Must be between 1 and {MAX_TOTAL_CHUNKS}."})
    if chunk_index >= total_chunks:
        raise ValidationError({"error": f"chunk_index ({chunk_index}) cannot be >= total_chunks ({total_chunks})."})

    # 3. Validate chunk file size
    if chunk_file:
        if chunk_file.size > MAX_CHUNK_SIZE_BYTES:
            raise ValidationError({
                "error": f"Chunk size ({round(chunk_file.size / (1024*1024), 2)} MB) exceeds server limit of {MAX_CHUNK_SIZE_BYTES // (1024*1024)} MB."
            })

    # 4. Validate file type and extension
    file_type = (file_type or '').lower().strip()
    if file_type not in ['drone', 'vector']:
        raise ValidationError({"error": "Invalid file_type: Must be 'drone' or 'vector'."})

    safe_name = sanitize_filename(file_name)
    ext = os.path.splitext(safe_name)[1].lower()

    if file_type == 'drone':
        if ext not in ALLOWED_DRONE_EXTENSIONS:
            raise ValidationError({
                "error": f"Unsupported format '{ext}' for drone survey. Allowed: {', '.join(sorted(ALLOWED_DRONE_EXTENSIONS))}."
            })
    elif file_type == 'vector':
        if ext not in ALLOWED_VECTOR_EXTENSIONS:
            raise ValidationError({
                "error": f"Unsupported format '{ext}' for vector dataset. Allowed: {', '.join(sorted(ALLOWED_VECTOR_EXTENSIONS))}."
            })

    return safe_name, file_type


def save_incoming_chunk(upload_id: str, chunk_index: int, chunk_file):
    """
    Saves an uploaded chunk safely to the session's temporary folder.
    Uses atomic write to prevent partial reads.
    """
    session_dir = os.path.join(get_temp_chunks_dir(), upload_id)
    os.makedirs(session_dir, exist_ok=True)

    final_chunk_path = os.path.join(session_dir, f"part_{chunk_index:05d}.chunk")
    temp_chunk_path = final_chunk_path + ".tmp"

    with open(temp_chunk_path, 'wb+') as dest:
        for chunk in chunk_file.chunks(chunk_size=64 * 1024):
            dest.write(chunk)

    if os.path.exists(final_chunk_path):
        os.remove(final_chunk_path)
    os.rename(temp_chunk_path, final_chunk_path)

    return final_chunk_path


def get_session_status(upload_id: str, total_chunks: int = None):
    """
    Returns the list of already received chunk indices for this upload session.
    Enables automatic resumable uploads if network drops or WAF throttles.
    """
    session_dir = os.path.join(get_temp_chunks_dir(), upload_id)
    if not os.path.isdir(session_dir):
        return {"received_chunks": [], "missing_chunks": list(range(total_chunks or 0))}

    received = []
    chunk_pattern = re.compile(r'^part_(\d{5})\.chunk$')
    for f in os.listdir(session_dir):
        m = chunk_pattern.match(f)
        if m:
            received.append(int(m.group(1)))

    received.sort()
    missing = []
    if total_chunks:
        received_set = set(received)
        missing = [i for i in range(total_chunks) if i not in received_set]

    return {"received_chunks": received, "missing_chunks": missing}


def verify_file_signature(file_path: str, file_type: str, safe_name: str):
    """
    Software and Data Integrity Verification (OWASP A08):
    Validates magic bytes / file signatures to prevent disguised executables.
    """
    ext = os.path.splitext(safe_name)[1].lower()
    with open(file_path, 'rb') as f:
        header = f.read(16)

    if file_type == 'drone' or ext in ['.tif', '.tiff', '.geotiff']:
        # TIFF magic bytes: Little-endian ('II*\x00') or Big-endian ('MM\x00*')
        if not (header.startswith(b'II*\x00') or header.startswith(b'MM\x00*') or header.startswith(b'II+\x00') or header.startswith(b'MM\x00+')):
            raise ValidationError({"error": "File failed integrity verification: Corrupt or invalid TIFF magic header."})

    elif ext == '.zip':
        # ZIP magic bytes: 'PK\x03\x04' or 'PK\x05\x06' (empty)
        if not (header.startswith(b'PK\x03\x04') or header.startswith(b'PK\x05\x06') or header.startswith(b'PK\x07\x08')):
            raise ValidationError({"error": "File failed integrity verification: Corrupt or invalid ZIP archive header."})

    elif ext in ['.geojson', '.json']:
        stripped = header.strip()
        if not (stripped.startswith(b'{') or stripped.startswith(b'[')):
            raise ValidationError({"error": "File failed integrity verification: Invalid JSON format."})

    return True


def assemble_session_chunks(upload_id: str, file_name: str, file_type: str, total_chunks: int) -> str:
    """
    Streams and concatenates all chunk parts into the finalized destination file.
    Validates completeness and integrity, then cleans up temporary chunks.
    """
    session_dir = os.path.join(get_temp_chunks_dir(), upload_id)
    if not os.path.isdir(session_dir):
        raise ValidationError({"error": "Upload session not found or has expired."})

    status = get_session_status(upload_id, total_chunks)
    if status["missing_chunks"]:
        raise ValidationError({
            "error": f"Cannot assemble file: {len(status['missing_chunks'])} chunks are missing.",
            "missing_chunks": status["missing_chunks"][:50]
        })

    safe_name = sanitize_filename(file_name)
    media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'mediafiles'))
    temp_uploads_dir = os.path.join(media_root, 'temp_uploads')
    os.makedirs(temp_uploads_dir, exist_ok=True)

    timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')
    assembled_file_path = os.path.join(temp_uploads_dir, f"assembled_{timestamp_str}_{safe_name}")

    # Stream chunks into destination file (low RAM footprint)
    total_assembled_bytes = 0
    with open(assembled_file_path, 'wb+') as dest_file:
        for idx in range(total_chunks):
            part_path = os.path.join(session_dir, f"part_{idx:05d}.chunk")
            with open(part_path, 'rb') as part_file:
                shutil.copyfileobj(part_file, dest_file, length=64 * 1024)

    # Verify file signature (OWASP A08)
    try:
        verify_file_signature(assembled_file_path, file_type, safe_name)
    except Exception as e:
        if os.path.exists(assembled_file_path):
            os.remove(assembled_file_path)
        raise e

    # Clean up chunk directory once assembled
    try:
        shutil.rmtree(session_dir, ignore_errors=True)
    except Exception as e:
        logger.warning(f"Error removing temp chunk directory {session_dir}: {e}")

    # Periodically clean any abandoned sessions older than 24 hours (OWASP A04)
    cleanup_stale_chunk_sessions()

    return assembled_file_path


def cleanup_stale_chunk_sessions(max_age_hours: int = 24):
    """
    Purges any incomplete upload sessions older than max_age_hours to prevent disk exhaustion.
    """
    try:
        chunks_root = get_temp_chunks_dir()
        now = time.time()
        max_age_seconds = max_age_hours * 3600

        for entry in os.scandir(chunks_root):
            if entry.is_dir():
                mtime = entry.stat().st_mtime
                if (now - mtime) > max_age_seconds:
                    shutil.rmtree(entry.path, ignore_errors=True)
                    logger.info(f"Purged stale upload session: {entry.name}")
    except Exception as e:
        logger.warning(f"Error cleaning stale chunks: {e}")
