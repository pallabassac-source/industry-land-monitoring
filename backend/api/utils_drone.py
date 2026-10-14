import os
import sys
import json
import shutil
import subprocess
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

def find_gdalinfo_executable():
    """
    Locates gdalinfo executable across Linux (Docker/Debian) and Windows environments.
    """
    candidates = [
        "gdalinfo",
        "/usr/bin/gdalinfo",
        r"C:\Program Files\GDAL\gdalinfo.exe",
        r"C:\Program Files\QGIS 3.44.3\bin\gdalinfo.exe"
    ]
    for c in candidates:
        if shutil.which(c) or os.path.isfile(c):
            return c
    return "gdalinfo"


def find_gdal_footprint_executable():
    """
    Locates gdal_footprint executable for extracting exact non-rectangular polygon shapes.
    """
    candidates = [
        "gdal_footprint",
        "/usr/bin/gdal_footprint",
        r"C:\Program Files\GDAL\gdal_footprint.exe",
        r"C:\Program Files\QGIS 3.44.3\bin\gdal_footprint.exe"
    ]
    for c in candidates:
        if shutil.which(c) or os.path.isfile(c):
            return c
    return None


def find_gdal2tiles_command():
    """
    Returns the command prefix list to execute gdal2tiles.
    """
    # 1. Check if gdal2tiles is directly in PATH
    if shutil.which("gdal2tiles.py"):
        return ["gdal2tiles.py"]
    if shutil.which("gdal2tiles"):
        return ["gdal2tiles"]

    # 2. Check QGIS Python wrapper on Windows
    qgis_python_bat = r"C:\Program Files\QGIS 3.44.3\bin\python-qgis.bat"
    if os.path.isfile(qgis_python_bat):
        return [qgis_python_bat, "-m", "osgeo_utils.gdal2tiles"]

    # 3. Check python3 -m osgeo_utils.gdal2tiles
    return [sys.executable, "-m", "osgeo_utils.gdal2tiles"]


def extract_geotiff_footprint(tif_path):
    """
    Extracts the exact non-rectangular vector polygon footprint of valid imagery pixels.
    Uses gdal_footprint when available, with fallback to gdalinfo wgs84Extent.
    """
    footprint_bin = find_gdal_footprint_executable()
    if footprint_bin:
        temp_geojson = str(tif_path) + ".footprint.json"
        try:
            cmd = [footprint_bin, "-t_srs", "EPSG:4326", str(tif_path), temp_geojson]
            proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
            if os.path.exists(temp_geojson):
                with open(temp_geojson, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                try:
                    os.remove(temp_geojson)
                except Exception:
                    pass
                if data and "features" in data and len(data["features"]) > 0:
                    geom = data["features"][0].get("geometry")
                    if geom and geom.get("coordinates"):
                        return geom
        except Exception as e:
            logger.warning(f"gdal_footprint extraction failed: {e}")
            if os.path.exists(temp_geojson):
                try:
                    os.remove(temp_geojson)
                except Exception:
                    pass

    # Fallback to gdalinfo wgs84Extent
    try:
        gdalinfo_bin = find_gdalinfo_executable()
        cmd = [gdalinfo_bin, "-json", str(tif_path)]
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        info = json.loads(proc.stdout)
        if "wgs84Extent" in info and info["wgs84Extent"]:
            return info["wgs84Extent"]
    except Exception as e:
        logger.warning(f"gdalinfo fallback footprint extraction failed: {e}")

    return None


def get_geotiff_metadata(tif_path):
    """
    Extracts spatial bounding box (EPSG:4326), pixel size, dimensions, and exact polygon footprint from GeoTIFF.
    """
    gdalinfo_bin = find_gdalinfo_executable()
    file_size_mb = round(os.path.getsize(tif_path) / (1024 * 1024), 2)
    
    result = {
        "bounds": None,
        "footprint_geojson": None,
        "resolution_cm": 5.0,
        "file_size_mb": file_size_mb,
        "crs": "EPSG:4326",
        "error": None
    }

    try:
        # 1. Extract exact non-rectangular polygon footprint
        footprint_poly = extract_geotiff_footprint(tif_path)
        if footprint_poly:
            result["footprint_geojson"] = footprint_poly

        # 2. Extract bounding box from gdalinfo
        cmd = [gdalinfo_bin, "-json", str(tif_path)]
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        info = json.loads(proc.stdout)

        if "wgs84Extent" in info and info["wgs84Extent"]:
            coords = info["wgs84Extent"]["coordinates"][0]
            lngs = [pt[0] for pt in coords]
            lats = [pt[1] for pt in coords]
            result["bounds"] = [min(lngs), min(lats), max(lngs), max(lats)]
            if not result["footprint_geojson"]:
                result["footprint_geojson"] = info["wgs84Extent"]

        elif "cornerCoordinates" in info:
            corners = info["cornerCoordinates"]
            ul = corners.get("upperLeft", [0, 0])
            lr = corners.get("lowerRight", [0, 0])
            result["bounds"] = [min(ul[0], lr[0]), min(ul[1], lr[1]), max(ul[0], lr[0]), max(ul[1], lr[1])]

        # Approximate resolution in cm if pixel size available
        if "geoTransform" in info:
            px_size = abs(info["geoTransform"][1])
            # If in degrees (approx 1 deg = 111,320m)
            if px_size < 0.01:
                cm = px_size * 111320 * 100
                result["resolution_cm"] = round(cm, 1)
            else:
                result["resolution_cm"] = round(px_size * 100, 1)

    except Exception as e:
        logger.warning(f"gdalinfo inspection error: {e}")
        result["error"] = str(e)

    return result


def generate_drone_tile_pyramid(tif_path, output_dir, min_zoom=10, max_zoom=20, processes=8):
    """
    Executes gdal2tiles to generate standard XYZ Slippy Map tile pyramids.
    """
    os.makedirs(output_dir, exist_ok=True)
    gdal2tiles_cmd = find_gdal2tiles_command()
    
    cmd = gdal2tiles_cmd + [
        "--xyz",
        f"--processes={processes}",
        "-z", f"{min_zoom}-{max_zoom}",
        "-w", "none",
        "-r", "bilinear",
        str(tif_path),
        str(output_dir)
    ]
    
    logger.info(f"Running gdal2tiles command: {' '.join(cmd)}")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    
    if proc.returncode != 0:
        logger.error(f"gdal2tiles failed: {proc.stderr}")
        raise RuntimeError(f"Tile generation failed: {proc.stderr or proc.stdout}")
    
    return True


def process_drone_geotiff(layer_id, tif_path, delete_source=False):
    """
    Orchestrates metadata extraction, tile generation, and DroneSurveyLayer update.
    """
    from .models import DroneSurveyLayer
    try:
        layer = DroneSurveyLayer.objects.get(id=layer_id)
        layer.status = 'PROCESSING'
        layer.error_message = None
        layer.save(update_fields=['status', 'error_message'])

        # 1. Extract metadata and actual polygon footprint
        meta = get_geotiff_metadata(tif_path)
        if meta.get("bounds"):
            layer.bounds = meta["bounds"]
        if meta.get("footprint_geojson"):
            layer.footprint_geojson = meta["footprint_geojson"]
        if meta.get("resolution_cm"):
            layer.resolution_cm_per_px = meta["resolution_cm"]
        if meta.get("file_size_mb"):
            layer.raw_file_size_mb = meta["file_size_mb"]

        # 2. Output directory in mediafiles
        media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'mediafiles'))
        slug = f"estate_{layer.estate_id or 'independent'}_{layer.id}"
        tile_rel_dir = os.path.join('drone_tiles', slug)
        output_abs_dir = os.path.join(media_root, tile_rel_dir)

        # 3. Generate tiles (Zoom 14-20 provides fast generation and crisp ~15cm ground detail with automatic overzooming)
        target_max_zoom = min(layer.max_zoom or 20, 20)
        layer.max_zoom = target_max_zoom

        generate_drone_tile_pyramid(
            tif_path=tif_path,
            output_dir=output_abs_dir,
            min_zoom=layer.min_zoom,
            max_zoom=target_max_zoom,
            processes=8
        )

        layer.tile_directory = tile_rel_dir.replace('\\', '/')
        layer.tile_url_pattern = f"/media/{layer.tile_directory}/{{z}}/{{x}}/{{y}}.png"
        layer.status = 'READY'
        layer.save()

        # Clean up temporary source if requested
        if delete_source and os.path.exists(tif_path):
            try:
                os.remove(tif_path)
            except Exception:
                pass

        return True

    except Exception as e:
        logger.exception(f"Error processing drone geotiff for layer {layer_id}: {e}")
        try:
            layer = DroneSurveyLayer.objects.get(id=layer_id)
            layer.status = 'FAILED'
            layer.error_message = str(e)
            layer.save(update_fields=['status', 'error_message'])
        except Exception:
            pass
        return False
