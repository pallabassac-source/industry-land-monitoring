import os
import sys
import json
import glob
import subprocess
import shutil
from pathlib import Path

# Try connecting to PostGIS if running with DB, or write JSON metadata
print("=" * 70)
print("   Industrial Land Bank — High-Resolution Drone Imagery Batch Processor")
print("=" * 70)

SOURCE_DIR = r"D:\LAN_Messenger_Received Files\QGIS IMAGE\QGIS IMAGE"
DEST_TILE_DIR = os.path.join(os.path.dirname(__file__), "mediafiles", "drone_tiles")
os.makedirs(DEST_TILE_DIR, exist_ok=True)

# Discover TIFF files
tif_files = glob.glob(os.path.join(SOURCE_DIR, "*.tif"))
print(f"[*] Found {len(tif_files)} Drone Orthomosaic TIFFs in: {SOURCE_DIR}")

# Find gdal2tiles command
def get_gdal2tiles_cmd():
    if shutil.which("gdal2tiles.py"):
        return ["gdal2tiles.py"]
    qgis_python = r"C:\Program Files\QGIS 3.44.3\bin\python-qgis.bat"
    if os.path.isfile(qgis_python):
        return [qgis_python, "-m", "osgeo_utils.gdal2tiles"]
    return [sys.executable, "-m", "osgeo_utils.gdal2tiles"]

def get_gdalinfo_cmd():
    candidates = [
        "gdalinfo",
        r"C:\Program Files\GDAL\gdalinfo.exe",
        r"C:\Program Files\QGIS 3.44.3\bin\gdalinfo.exe"
    ]
    for c in candidates:
        if shutil.which(c) or os.path.isfile(c):
            return c
    return "gdalinfo"

gdal2tiles_cmd = get_gdal2tiles_cmd()
gdalinfo_bin = get_gdalinfo_cmd()
print(f"[*] GDAL Tiler Command: {' '.join(gdal2tiles_cmd)}")
print(f"[*] GDAL Info Binary: {gdalinfo_bin}\n")

processed_layers = []

for idx, tif_path in enumerate(tif_files, 1):
    file_name = os.path.basename(tif_path)
    estate_slug = file_name.replace(".tif", "").replace(" ", "_").replace("_tiff", "").lower()
    estate_title = estate_slug.replace("_", " ").title()
    output_tiles = os.path.join(DEST_TILE_DIR, estate_slug)
    
    file_size_mb = round(os.path.getsize(tif_path) / (1024 * 1024), 2)
    print(f"[{idx}/{len(tif_files)}] Processing {estate_title} ({file_name} - {file_size_mb} MB)...")

    # 1. Extract Bounds
    bounds = None
    try:
        proc = subprocess.run([gdalinfo_bin, "-json", tif_path], capture_output=True, text=True, check=True)
        info = json.loads(proc.stdout)
        if "wgs84Extent" in info and info["wgs84Extent"]:
            coords = info["wgs84Extent"]["coordinates"][0]
            lngs = [pt[0] for pt in coords]
            lats = [pt[1] for pt in coords]
            bounds = [min(lngs), min(lats), max(lngs), max(lats)]
        elif "cornerCoordinates" in info:
            corners = info["cornerCoordinates"]
            ul = corners.get("upperLeft", [0, 0])
            lr = corners.get("lowerRight", [0, 0])
            bounds = [min(ul[0], lr[0]), min(ul[1], lr[1]), max(ul[0], lr[0]), max(ul[1], lr[1])]
    except Exception as e:
        print(f"    [!] Warning extracting bounds: {e}")

    # 2. Slicing Multi-Resolution Tile Pyramid (Zoom 14-20)
    print(f"    [*] Generating XYZ Tile Pyramids (Zoom 14 -> 20)...")
    cmd = gdal2tiles_cmd + [
        "--xyz",
        "--processes=8",
        "-z", "14-20",
        "-w", "none",
        "-r", "bilinear",
        tif_path,
        output_tiles
    ]
    try:
        tiling_proc = subprocess.run(cmd, capture_output=True, text=True)
        if tiling_proc.returncode == 0:
            print(f"    [✓] Generated tile pyramid at: {output_tiles}")
            processed_layers.append({
                "slug": estate_slug,
                "title": f"{estate_title} Drone Survey",
                "estate_name": estate_title,
                "bounds": bounds or [91.70, 26.10, 91.85, 26.25],
                "min_zoom": 14,
                "max_zoom": 20,
                "tile_directory": f"drone_tiles/{estate_slug}",
                "tile_url_pattern": f"/media/drone_tiles/{estate_slug}/{{z}}/{{x}}/{{y}}.png",
                "raw_file_size_mb": file_size_mb,
                "status": "READY"
            })
        else:
            print(f"    [!] gdal2tiles error: {tiling_proc.stderr[:200]}")
    except Exception as e:
        print(f"    [!] Execution failed: {e}")

print("\n" + "=" * 70)
print(f"Successfully processed {len(processed_layers)} of {len(tif_files)} Drone Orthomosaics!")
print("=" * 70)
