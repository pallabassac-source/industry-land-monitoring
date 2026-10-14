import os
import sys
import json
import glob
import subprocess
import shutil
import psycopg2
from pathlib import Path

print("=" * 75)
print("   Industrial Land Bank - High-Resolution Drone Imagery Batch Processor")
print("=" * 75)

SOURCE_DIR = r"D:\LAN_Messenger_Received Files\QGIS IMAGE\QGIS IMAGE"
DEST_TILE_DIR = os.path.join(os.path.dirname(__file__), "mediafiles", "drone_tiles")
os.makedirs(DEST_TILE_DIR, exist_ok=True)

# Database connection settings (gis_portal_db container mapped to port 5435 on host)
DB_CONFIG = {
    "dbname": "industrial_land_bank",
    "user": "gis_admin",
    "password": "gis_secure_password_2026",
    "host": "localhost",
    "port": 5435
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"[!] Warning: Could not connect to host DB on 5435 ({e}).")
        return None

def find_gdalinfo_bin():
    candidates = [
        "gdalinfo",
        r"C:\Program Files\GDAL\gdalinfo.exe",
        r"C:\Program Files\QGIS 3.44.3\bin\gdalinfo.exe"
    ]
    for c in candidates:
        if shutil.which(c) or os.path.isfile(c):
            return c
    return "gdalinfo"

def find_gdal_footprint_bin():
    candidates = [
        "gdal_footprint",
        r"C:\Program Files\GDAL\gdal_footprint.exe",
        r"C:\Program Files\QGIS 3.44.3\bin\gdal_footprint.exe"
    ]
    for c in candidates:
        if shutil.which(c) or os.path.isfile(c):
            return c
    return "gdal_footprint"

def get_gdal2tiles_cmd():
    if shutil.which("gdal2tiles.py"):
        return ["gdal2tiles.py"]
    qgis_python = r"C:\Program Files\QGIS 3.44.3\bin\python-qgis.bat"
    if os.path.isfile(qgis_python):
        return [qgis_python, "-m", "osgeo_utils.gdal2tiles"]
    return [sys.executable, "-m", "osgeo_utils.gdal2tiles"]

gdalinfo_bin = find_gdalinfo_bin()
footprint_bin = find_gdal_footprint_bin()
gdal2tiles_cmd = get_gdal2tiles_cmd()

print(f"[*] GDAL Info:      {gdalinfo_bin}")
print(f"[*] GDAL Footprint: {footprint_bin}")
print(f"[*] GDAL2Tiles:     {' '.join(gdal2tiles_cmd)}\n")

# Mapping of TIFF file basenames to estate lookup keywords
ESTATE_MAPPING = {
    "amerigog": {"id": 2, "name": "Amerigog_inner_boundary Industrial Area"},
    "bonda": {"id": 3, "name": "Bonda_inner_boundary Industrial Area"},
    "choudhipara": {"id": 5, "name": "Chouhdhuripara_inner_boundary Industrial Area"},
    "dolai_gaon_part_3": {"id": 7, "name": "Dolai_gaon_part_3_inner_boundary Industrial Area"},
    "nakhola_grant": {"id": 8, "name": "Nakhola_Grant_inner_boundary Industrial Area"},
    "naltali": {"id": 9, "name": "Naltali_inner_boundary Industrial Area"},
    "namali_jalah": {"id": 10, "name": "Namali_Jalah_inner_boundary Industrial Area"},
    "no_1_nowpara": {"id": 11, "name": "No_1_Nowpara_inner_boundary Industrial Area"},
    "paschim_jalukbari": {"id": 13, "name": "Paschim_Jalukbari_inner_boundary Industrial Area"},
    "sarusajai": {"id": 14, "name": "Sarusajai_inner_boundary Industrial Area"},
    "no_2_japarigog": {"id": 15, "name": "No_2_Japorigog_inner_boundary Industrial Area"},
}

tif_files = glob.glob(os.path.join(SOURCE_DIR, "*.tif"))
print(f"[*] Discovered {len(tif_files)} Drone Orthomosaic TIFFs.\n")

conn = get_db_connection()
cursor = conn.cursor() if conn else None

if cursor:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drone_survey_layers (
            id SERIAL PRIMARY KEY,
            estate_id INTEGER REFERENCES industrial_estates(id) ON DELETE CASCADE,
            estate_name VARCHAR(150),
            title VARCHAR(200) NOT NULL,
            survey_date DATE,
            tile_directory VARCHAR(255) NOT NULL DEFAULT '',
            tile_url_pattern VARCHAR(500) NOT NULL DEFAULT '',
            min_zoom INTEGER DEFAULT 14,
            max_zoom INTEGER DEFAULT 21,
            bounds JSONB DEFAULT '[]'::jsonb,
            footprint_geojson JSONB DEFAULT '{}'::jsonb,
            raw_file_size_mb DOUBLE PRECISION DEFAULT 0.0,
            resolution_cm_per_px DOUBLE PRECISION DEFAULT 5.0,
            status VARCHAR(50) DEFAULT 'READY',
            error_message TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE drone_survey_layers ADD COLUMN IF NOT EXISTS footprint_geojson JSONB DEFAULT '{}'::jsonb;
    """)
    conn.commit()

for idx, tif_path in enumerate(tif_files, 1):
    file_name = os.path.basename(tif_path)
    clean_name = file_name.replace(".tif", "").replace(" ", "_").replace("_tiff", "").lower()
    
    # Match estate info
    matched = None
    for k, v in ESTATE_MAPPING.items():
        if k in clean_name or clean_name in k:
            matched = v
            break
            
    estate_id = matched["id"] if matched else None
    estate_name = matched["name"] if matched else clean_name.replace("_", " ").title()
    title = f"{estate_name.replace(' Industrial Area', '')} Drone Survey"
    slug = f"estate_{estate_id}_{clean_name}" if estate_id else clean_name
    
    file_size_mb = round(os.path.getsize(tif_path) / (1024 * 1024), 2)
    print(f"[{idx}/{len(tif_files)}] Processing {title} ({file_name} - {file_size_mb} MB)...")

    # 1. Extract Exact Footprint Polygon with gdal_footprint
    footprint_geojson = None
    temp_fp = os.path.join(DEST_TILE_DIR, f"{slug}_footprint.geojson")
    try:
        cmd_fp = [footprint_bin, "-t_srs", "EPSG:4326", tif_path, temp_fp]
        proc = subprocess.run(cmd_fp, capture_output=True, text=True)
        if proc.returncode == 0 and os.path.exists(temp_fp):
            with open(temp_fp, 'r', encoding='utf-8') as f:
                fp_data = json.load(f)
            if fp_data and "features" in fp_data and len(fp_data["features"]) > 0:
                footprint_geojson = fp_data["features"][0].get("geometry")
                num_v = len(footprint_geojson.get('coordinates', [[]])[0])
                print(f"    [OK] Extracted exact polygon footprint ({num_v} vertices)")
    except Exception as e:
        print(f"    [!] Warning during footprint extraction: {e}")

    # 2. Extract Bounding Box & Resolution via gdalinfo
    bounds = None
    resolution_cm = 5.0
    try:
        proc = subprocess.run([gdalinfo_bin, "-json", tif_path], capture_output=True, text=True, check=True)
        info = json.loads(proc.stdout)
        if "wgs84Extent" in info and info["wgs84Extent"]:
            coords = info["wgs84Extent"]["coordinates"][0]
            lngs = [pt[0] for pt in coords]
            lats = [pt[1] for pt in coords]
            bounds = [min(lngs), min(lats), max(lngs), max(lats)]
            if not footprint_geojson:
                footprint_geojson = info["wgs84Extent"]
        elif "cornerCoordinates" in info:
            corners = info["cornerCoordinates"]
            ul = corners.get("upperLeft", [0, 0])
            lr = corners.get("lowerRight", [0, 0])
            bounds = [min(ul[0], lr[0]), min(ul[1], lr[1]), max(ul[0], lr[0]), max(ul[1], lr[1])]

        if "geoTransform" in info:
            px_size = abs(info["geoTransform"][1])
            if px_size < 0.01:
                resolution_cm = round(px_size * 111320 * 100, 1)
            else:
                resolution_cm = round(px_size * 100, 1)
    except Exception as e:
        print(f"    [!] Warning during gdalinfo: {e}")

    # 3. Generate Slippy Map Tile Pyramid (Zoom 14-18)
    # Check if a simpler folder name exists first (e.g. drone_tiles/amerigog or drone_tiles/sarusajai)
    tile_rel_path = f"drone_tiles/{slug}"
    output_tiles_dir = os.path.join(DEST_TILE_DIR, slug)
    
    simple_slug = clean_name.replace("estate_", "")
    simple_dir = os.path.join(DEST_TILE_DIR, simple_slug)
    
    if os.path.isdir(simple_dir) and len(glob.glob(os.path.join(simple_dir, "*", "*", "*.png"))) > 10:
        tile_rel_path = f"drone_tiles/{simple_slug}"
        output_tiles_dir = simple_dir
        print(f"    [OK] Reusing existing tiles in: {simple_dir}")
    else:
        existing_tiles = glob.glob(os.path.join(output_tiles_dir, "*", "*", "*.png"))
        if len(existing_tiles) > 10:
            print(f"    [OK] Reusing existing {len(existing_tiles)} tiles in: {output_tiles_dir}")
        else:
            print(f"    [*] Generating XYZ Tile Pyramids (Zoom 14 -> 18, 8 threads)...")
            os.makedirs(output_tiles_dir, exist_ok=True)
            cmd_tile = gdal2tiles_cmd + [
                "--xyz",
                "--processes=8",
                "-z", "14-18",
                "-w", "none",
                "-r", "bilinear",
                tif_path,
                output_tiles_dir
            ]
            tiling_proc = subprocess.run(cmd_tile, capture_output=True, text=True)
            if tiling_proc.returncode == 0:
                print(f"    [OK] Tile pyramid successfully generated.")
            else:
                print(f"    [!] Tiling warning: {tiling_proc.stderr[:150]}")

    tile_url_pattern = f"/media/{tile_rel_path}/{{z}}/{{x}}/{{y}}.png"

    # 4. Insert or Update PostgreSQL Record
    if cursor:
        try:
            cursor.execute("""
                SELECT id FROM drone_survey_layers WHERE estate_id = %s OR title = %s;
            """, (estate_id, title))
            existing_row = cursor.fetchone()
            
            if existing_row:
                cursor.execute("""
                    UPDATE drone_survey_layers
                    SET estate_id = %s,
                        estate_name = %s,
                        title = %s,
                        tile_directory = %s,
                        tile_url_pattern = %s,
                        min_zoom = 14,
                        max_zoom = 18,
                        bounds = %s,
                        footprint_geojson = %s,
                        raw_file_size_mb = %s,
                        resolution_cm_per_px = %s,
                        status = 'READY',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s;
                """, (
                    estate_id,
                    estate_name,
                    title,
                    tile_rel_path,
                    tile_url_pattern,
                    json.dumps(bounds or []),
                    json.dumps(footprint_geojson or {}),
                    file_size_mb,
                    resolution_cm,
                    existing_row[0]
                ))
                print(f"    [OK] Updated PostgreSQL record ID: {existing_row[0]}")
            else:
                cursor.execute("""
                    INSERT INTO drone_survey_layers (
                        estate_id, estate_name, title, survey_date,
                        tile_directory, tile_url_pattern, min_zoom, max_zoom,
                        bounds, footprint_geojson, raw_file_size_mb, resolution_cm_per_px,
                        status
                    ) VALUES (
                        %s, %s, %s, CURRENT_DATE,
                        %s, %s, 14, 18,
                        %s, %s, %s, %s,
                        'READY'
                    );
                """, (
                    estate_id,
                    estate_name,
                    title,
                    tile_rel_path,
                    tile_url_pattern,
                    json.dumps(bounds or []),
                    json.dumps(footprint_geojson or {}),
                    file_size_mb,
                    resolution_cm
                ))
                print(f"    [OK] Inserted new PostgreSQL record for {title}")
            conn.commit()
        except Exception as e:
            print(f"    [!] Database error: {e}")
            conn.rollback()

if conn:
    conn.close()

print("\n" + "=" * 75)
print("All Drone Orthomosaic Surveys Processed and Registered with PostGIS!")
print("=" * 75)
