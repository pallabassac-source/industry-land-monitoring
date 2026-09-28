import shapefile
import os
import psycopg2
from pyproj import Transformer
from shapely.geometry import Polygon

extracted_dir = "/app/Pathsala_extracted"

# Connect to the DB using docker network hostname 'db'
try:
    conn = psycopg2.connect(
        dbname="industrial_land_bank",
        user="gis_admin",
        password="gis_secure_password_2026",
        host="db",
        port="5432"
    )
    cur = conn.cursor()
    print("Database connected successfully.")
except Exception as e:
    print("Failed to connect to database:", e)
    exit(1)

# Transformer UTM zone 46N (32646) to WGS84 (4326)
transformer = Transformer.from_crs("epsg:32646", "epsg:4326", always_xy=True)

def reproject_shape(shape_obj):
    points = [transformer.transform(pt[0], pt[1]) for pt in shape_obj.points]
    parts = list(shape_obj.parts) + [len(points)]
    rings = []
    for i in range(len(parts) - 1):
        rings.append(points[parts[i]:parts[i+1]])
    
    if not rings:
        return None
    
    try:
        poly = Polygon(rings[0], rings[1:])
        return poly.wkt
    except Exception as e:
        try:
            poly = Polygon(rings[0])
            return poly.wkt
        except Exception as e2:
            print("Failed to create polygon:", e2)
            return None

# 1. Insert/Get District: Bajali
district_name = "Bajali"
district_code = "BJL_DIST"
district_geom_wkt = "POLYGON((91.0 26.3, 91.3 26.3, 91.3 26.6, 91.0 26.6, 91.0 26.3))"

cur.execute("SELECT id FROM districts WHERE name = %s;", (district_name,))
row = cur.fetchone()
if row:
    district_id = row[0]
    print(f"District {district_name} already exists (ID: {district_id})")
else:
    cur.execute(
        "INSERT INTO districts (name, code, geom) VALUES (%s, %s, ST_GeomFromText(%s, 4326)) RETURNING id;",
        (district_name, district_code, district_geom_wkt)
    )
    district_id = cur.fetchone()[0]
    print(f"Created District {district_name} (ID: {district_id})")

# 2. Insert/Get Circle: Pathsala Circle
circle_name = "Pathsala Circle"
circle_code = "PT_C"
circle_geom_wkt = "POLYGON((91.1 26.4, 91.2 26.4, 91.2 26.5, 91.1 26.5, 91.1 26.4))"

cur.execute("SELECT id FROM circles WHERE district_id = %s AND name = %s;", (district_id, circle_name))
row = cur.fetchone()
if row:
    circle_id = row[0]
    print(f"Circle {circle_name} already exists (ID: {circle_id})")
else:
    cur.execute(
        "INSERT INTO circles (district_id, name, code, geom) VALUES (%s, %s, %s, ST_GeomFromText(%s, 4326)) RETURNING id;",
        (district_id, circle_name, circle_code, circle_geom_wkt)
    )
    circle_id = cur.fetchone()[0]
    print(f"Created Circle {circle_name} (ID: {circle_id})")

# 3. Insert/Get Village: Titkagaria Village
village_name = "Titkagaria Village"
village_code = "TT_V"
village_geom_wkt = "POLYGON((91.14 26.48, 91.17 26.48, 91.17 26.51, 91.14 26.51, 91.14 26.48))"

cur.execute("SELECT id FROM villages WHERE circle_id = %s AND name = %s;", (circle_id, village_name))
row = cur.fetchone()
if row:
    village_id = row[0]
    print(f"Village {village_name} already exists (ID: {village_id})")
else:
    cur.execute(
        "INSERT INTO villages (circle_id, name, code, geom) VALUES (%s, %s, %s, ST_GeomFromText(%s, 4326)) RETURNING id;",
        (circle_id, village_name, village_code, village_geom_wkt)
    )
    village_id = cur.fetchone()[0]
    print(f"Created Village {village_name} (ID: {village_id})")

# 4. Parse & Insert Industrial Estate Pathsala
sf_estate = shapefile.Reader(os.path.join(extracted_dir, "Industrial Area Pathsala"))
estate_shape = sf_estate.shape(0)
estate_record = sf_estate.record(0).as_dict()
estate_wkt = reproject_shape(estate_shape)

estate_name = "Industrial Area, Pathsala"
tot_area = float(estate_record.get('T_L_Ar_ha_', 6.83)) * 2.47105
allot_area = float(estate_record.get('Alloted_', 2.82)) * 2.47105
vac_area = float(estate_record.get('Tot_Vac_ha', 3.42)) * 2.47105

cur.execute("SELECT id FROM industrial_estates WHERE name = %s;", (estate_name,))
row = cur.fetchone()
if row:
    estate_id = row[0]
    print(f"Industrial Estate '{estate_name}' already exists (ID: {estate_id})")
else:
    cur.execute(
        """
        INSERT INTO industrial_estates (
            district_id, name, total_area_acres, allocated_area_acres, available_area_acres,
            power_capacity_mw, water_capacity_mld, gas_pipeline_available, drainage_available, geom
        ) VALUES (%s, %s, %s, %s, %s, 0.0, 0.0, FALSE, FALSE, ST_GeomFromText(%s, 4326)) RETURNING id;
        """,
        (district_id, estate_name, tot_area, allot_area, vac_area, estate_wkt)
    )
    estate_id = cur.fetchone()[0]
    print(f"Created Industrial Estate '{estate_name}' (ID: {estate_id})")

# 5. Parse & Insert Plots
sf_plots = shapefile.Reader(os.path.join(extracted_dir, "Plots"))
plot_shapes = sf_plots.shapes()
plot_records = sf_plots.records()

print(f"Processing {len(plot_shapes)} plots...")
inserted_count = 0
for idx, (shape_obj, record) in enumerate(zip(plot_shapes, plot_records)):
    rec_dict = record.as_dict()
    plot_deta = rec_dict.get('Plot__Deta', '').strip()
    
    parcel_id = f"LP-PTS-{idx+1:03d}"
    
    if not plot_deta or plot_deta.lower() in ['vacant', 'empty', 'nil', '']:
        availability = "Available"
        plot_number = f"Plot {idx+1}"
        ownership = "Government Land Bank"
    else:
        availability = "Allocated"
        plot_number = plot_deta
        ownership = plot_deta
        
    area_ha = float(rec_dict.get('Area', 0.1))
    area_acres = area_ha * 2.47105
    plot_wkt = reproject_shape(shape_obj)
    
    if not plot_wkt:
        print(f"Skipping plot {parcel_id} due to reprojection issue.")
        continue
        
    cur.execute("SELECT id FROM land_parcels WHERE parcel_id = %s;", (parcel_id,))
    if cur.fetchone():
        # Update existing
        cur.execute(
            """
            UPDATE land_parcels SET
                estate_id = %s, plot_number = %s, village_id = %s, area_acres = %s,
                availability_status = %s, ownership_details = %s, geom = ST_GeomFromText(%s, 4326)
            WHERE parcel_id = %s;
            """,
            (estate_id, plot_number, village_id, area_acres, availability, ownership, plot_wkt, parcel_id)
        )
    else:
        # Insert new
        cur.execute(
            """
            INSERT INTO land_parcels (
                estate_id, parcel_id, plot_number, survey_number, village_id, area_acres,
                availability_status, land_classification, ownership_details, infrastructure_details, geom
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'General', %s, '{}'::jsonb, ST_GeomFromText(%s, 4326));
            """,
            (estate_id, parcel_id, plot_number, f"Survey-PTS-{idx+1}", village_id, area_acres, availability, ownership, plot_wkt)
        )
        inserted_count += 1

conn.commit()
cur.close()
conn.close()
print(f"Successfully finished seeding database! Inserted {inserted_count} new plots.")
