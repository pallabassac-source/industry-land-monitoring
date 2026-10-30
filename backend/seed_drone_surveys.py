import os
import glob
import json
import psycopg2

print("=" * 60)
print("  Seeding Drone Survey Layers from mediafiles/drone_tiles")
print("=" * 60)

DB_CONFIG = {
    "dbname": "industrial_land_bank",
    "user": "gis_admin",
    "password": "gis_secure_password_2026",
    "host": os.getenv("DB_HOST", "db"),
    "port": int(os.getenv("DB_PORT", "5432"))
}

# Mapping: (estate_id, estate_name, title, tile_folder_name, footprint_filename)
ESTATES_INFO = [
    (2, "Amerigog_inner_boundary Industrial Area", "Amerigog Drone Survey", "estate_2_amerigog", "estate_2_amerigog_footprint.geojson"),
    (3, "Bonda_inner_boundary Industrial Area", "Bonda Drone Survey", "estate_3_bonda", "estate_3_bonda_footprint.geojson"),
    (5, "Chouhdhuripara_inner_boundary Industrial Area", "Chouhdhuripara Drone Survey", "estate_5_choudhipara", "estate_5_choudhipara_footprint.geojson"),
    (7, "Dolai_gaon_part_3_inner_boundary Industrial Area", "Dolai Gaon Drone Survey", "estate_7_dolai_gaon_part_3", "estate_7_dolai_gaon_part_3_footprint.geojson"),
    (8, "Nakhola_Grant_inner_boundary Industrial Area", "Nakhola Grant Drone Survey", "estate_8_nakhola_grant", "estate_8_nakhola_grant_footprint.geojson"),
    (9, "Naltali_inner_boundary Industrial Area", "Naltali Drone Survey", "estate_9_naltali", "estate_9_naltali_footprint.geojson"),
    (10, "Namali_Jalah_inner_boundary Industrial Area", "Namali Jalah Drone Survey", "estate_10_namali_jalah", "estate_10_namali_jalah_footprint.geojson"),
    (11, "No_1_Nowpara_inner_boundary Industrial Area", "No 1 Nowpara Drone Survey", "estate_11_no_1_nowpara", "estate_11_no_1_nowpara_footprint.geojson"),
    (13, "Paschim_Jalukbari_inner_boundary Industrial Area", "Paschim Jalukbari Drone Survey", "estate_13_paschim_jalukbari", "estate_13_paschim_jalukbari_footprint.geojson"),
    (14, "Sarusajai_inner_boundary Industrial Area", "Sarusajai Drone Survey", "sarusajai", "estate_14_sarusajai_footprint.geojson"),
    (15, "No_2_Japorigog_inner_boundary Industrial Area", "No 2 Japorigog Drone Survey", "estate_15_no_2_japarigog", "estate_15_no_2_japarigog_footprint.geojson"),
]

# Base media path (inside backend container: /app/mediafiles/drone_tiles)
base_dir = os.path.join(os.path.dirname(__file__), "mediafiles", "drone_tiles")
if not os.path.isdir(base_dir):
    base_dir = os.path.join("/app", "mediafiles", "drone_tiles")

print(f"[*] Reading tiles from: {base_dir}")

def extract_coords(c):
    pts = []
    if not c:
        return pts
    if isinstance(c[0], (int, float)):
        return [c]
    for item in c:
        pts.extend(extract_coords(item))
    return pts

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    print("[✓] Connected to PostgreSQL database.")
except Exception as e:
    print(f"[!] Error connecting to DB: {e}")
    exit(1)

# Ensure table exists
cur.execute("""
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
    CREATE INDEX IF NOT EXISTS idx_drone_surveys_estate ON drone_survey_layers(estate_id);
""")
conn.commit()

inserted_count = 0

for estate_id, estate_name, title, folder_name, fp_file in ESTATES_INFO:
    fp_path = os.path.join(base_dir, fp_file)
    if not os.path.isfile(fp_path):
        # Fallback check
        alt_files = glob.glob(os.path.join(base_dir, f"*{folder_name}*footprint.geojson"))
        if alt_files:
            fp_path = alt_files[0]

    footprint_geojson = {}
    bounds = []

    if os.path.isfile(fp_path):
        try:
            with open(fp_path, 'r', encoding='utf-8') as f:
                fp_data = json.load(f)
            if fp_data and "features" in fp_data and len(fp_data["features"]) > 0:
                footprint_geojson = fp_data["features"][0].get("geometry", {})
                pts = extract_coords(footprint_geojson.get("coordinates", []))
                if pts:
                    lngs = [p[0] for p in pts]
                    lats = [p[1] for p in pts]
                    bounds = [round(min(lngs), 6), round(min(lats), 6), round(max(lngs), 6), round(max(lats), 6)]
        except Exception as e:
            print(f"[!] Warning reading footprint {fp_file}: {e}")

    tile_directory = f"drone_tiles/{folder_name}"
    tile_url_pattern = f"/media/{tile_directory}/{{z}}/{{x}}/{{y}}.png"

    # Check if record already exists
    cur.execute("SELECT id FROM drone_survey_layers WHERE estate_id = %s OR title = %s;", (estate_id, title))
    row = cur.fetchone()

    if row:
        cur.execute("""
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
                status = 'READY',
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s;
        """, (
            estate_id, estate_name, title, tile_directory, tile_url_pattern,
            json.dumps(bounds), json.dumps(footprint_geojson), row[0]
        ))
        print(f"[✓] Updated: {title} (ID: {row[0]}, Folder: {folder_name})")
    else:
        cur.execute("""
            INSERT INTO drone_survey_layers (
                estate_id, estate_name, title, survey_date,
                tile_directory, tile_url_pattern, min_zoom, max_zoom,
                bounds, footprint_geojson, raw_file_size_mb, resolution_cm_per_px,
                status, is_active
            ) VALUES (
                %s, %s, %s, CURRENT_DATE,
                %s, %s, 14, 18,
                %s, %s, 50.0, 5.0,
                'READY', TRUE
            );
        """, (
            estate_id, estate_name, title,
            tile_directory, tile_url_pattern,
            json.dumps(bounds), json.dumps(footprint_geojson)
        ))
        print(f"[✓] Inserted: {title} (Folder: {folder_name})")

    inserted_count += 1

conn.commit()
cur.close()
conn.close()

print(f"\n[🎉 SUCCESS] Successfully seeded {inserted_count} Drone Survey Layers into database!")
