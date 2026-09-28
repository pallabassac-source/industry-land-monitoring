import json
from django.db import connection
from shapely.geometry import shape, mapping
from shapely.ops import transform
import pyproj

def execute_spatial_query(query_type, layer_name, geom_wkt=None, distance_meters=None, attribute_filters=None):
    """
    Executes a spatial query on the database using PostGIS functions.
    Supports: buffer, intersects, within, contains, touches, overlaps, nearest, distance.
    """
    tbl_name = {
        'parcels': 'land_parcels',
        'estates': 'industrial_estates',
        'districts': 'districts',
        'circles': 'circles',
        'villages': 'villages',
        'infrastructure': 'infrastructure_layers'
    }.get(layer_name, 'land_parcels')

    # Base query returning GeoJSON representations
    select_clause = f"SELECT id, ST_AsGeoJSON(geom) as geojson"
    if tbl_name == 'land_parcels':
        select_clause += ", parcel_id, plot_number, survey_number, area_acres, availability_status, land_classification"
    elif tbl_name == 'industrial_estates':
        select_clause += ", name, total_area_acres, available_area_acres, power_capacity_mw"
    elif tbl_name == 'infrastructure_layers':
        select_clause += ", name, infra_type, attributes::text"
    else:
        select_clause += ", name"

    where_clauses = []
    params = []

    # OGC/PostGIS Spatial predicates
    if geom_wkt:
        if query_type == 'buffer' and distance_meters is not None:
            # We transform geometry to UTM/metric web mercator (3857) to perform meter buffer, then back to 4326
            where_clauses.append(
                f"ST_Intersects(geom, ST_Transform(ST_Buffer(ST_Transform(ST_GeomFromText(%s, 4326), 3857), %s), 4326))"
            )
            params.extend([geom_wkt, float(distance_meters)])
        elif query_type == 'intersects':
            where_clauses.append("ST_Intersects(geom, ST_GeomFromText(%s, 4326))")
            params.append(geom_wkt)
        elif query_type == 'within':
            where_clauses.append("ST_Within(geom, ST_GeomFromText(%s, 4326))")
            params.append(geom_wkt)
        elif query_type == 'contains':
            where_clauses.append("ST_Contains(geom, ST_GeomFromText(%s, 4326))")
            params.append(geom_wkt)
        elif query_type == 'touches':
            where_clauses.append("ST_Touches(geom, ST_GeomFromText(%s, 4326))")
            params.append(geom_wkt)
        elif query_type == 'overlaps':
            where_clauses.append("ST_Overlaps(geom, ST_GeomFromText(%s, 4326))")
            params.append(geom_wkt)
        elif query_type == 'distance' and distance_meters is not None:
            # Distance search using ST_DWithin
            where_clauses.append("ST_DWithin(geom::geography, ST_GeomFromText(%s, 4326)::geography, %s)")
            params.extend([geom_wkt, float(distance_meters)])

    # Apply attribute filters
    if attribute_filters:
        if isinstance(attribute_filters, dict):
            for k, v in attribute_filters.items():
                if v:
                    where_clauses.append(f"{k} = %s")
                    params.append(v)
        elif isinstance(attribute_filters, list):
            for cond in attribute_filters:
                field = cond.get('field')
                op = cond.get('operator')
                val = cond.get('value')
                if not field or not op or val is None:
                    continue
                # Sanitize field name to prevent SQL injection
                allowed_fields = {
                    'parcels': ['parcel_id', 'plot_number', 'survey_number', 'area_acres', 'availability_status', 'land_classification', 'ownership_details'],
                    'estates': ['name', 'total_area_acres', 'available_area_acres', 'power_capacity_mw'],
                    'infrastructure': ['name', 'infra_type']
                }.get(layer_name, [])
                if field in allowed_fields and op in ['=', '>', '<', '>=', '<=', 'contains', 'like']:
                    if op in ['like', 'contains']:
                        where_clauses.append(f"{field} ILIKE %s")
                        params.append(f"%{val}%")
                    else:
                        if 'area' in field or 'capacity' in field:
                            try:
                                val = float(val)
                            except ValueError:
                                pass
                        where_clauses.append(f"{field} {op} %s")
                        params.append(val)

    where_str = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    sql = f"{select_clause} FROM {tbl_name} {where_str}"

    # Nearest feature handling
    if query_type == 'nearest' and geom_wkt:
        sql = f"{select_clause} FROM {tbl_name} ORDER BY geom <-> ST_GeomFromText(%s, 4326) LIMIT 5"
        params = [geom_wkt]

    results = []
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        for row in cursor.fetchall():
            item = dict(zip(columns, row))
            if 'geojson' in item and item['geojson']:
                item['geojson'] = json.loads(item['geojson'])
            results.append(item)

    return results


import zipfile
import tempfile
import os
import io
import shapefile
import shapely.geometry

def validate_and_parse_component_files(files_dict, layer_name="Imported_Layer"):
    """
    Parses separate shapefile component files (.shp, .dbf, .shx, .prj) uploaded directly.
    """
    validation_report = {
        "file_name": f"{layer_name}.shp",
        "format": "SHP (Direct Components)",
        "crs_detected": "EPSG:4326",
        "geometry_type": "Polygon",
        "total_features": 0,
        "valid_features": 0,
        "invalid_features_repaired": 0,
        "is_valid": True,
        "errors": [],
        "parsed_features": [],
        "bbox": None,
        "center_lng": 91.76,
        "center_lat": 26.18
    }

    if 'shp' not in files_dict or not files_dict['shp']:
        validation_report["is_valid"] = False
        validation_report["errors"].append("Missing required .shp (geometry) component file.")
        return validation_report

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            base_name = "upload_layer"
            shp_path = os.path.join(tmp_dir, f"{base_name}.shp")
            
            with open(shp_path, "wb") as f:
                f.write(files_dict['shp'])

            if 'dbf' in files_dict and files_dict['dbf']:
                with open(os.path.join(tmp_dir, f"{base_name}.dbf"), "wb") as f:
                    f.write(files_dict['dbf'])

            if 'shx' in files_dict and files_dict['shx']:
                with open(os.path.join(tmp_dir, f"{base_name}.shx"), "wb") as f:
                    f.write(files_dict['shx'])

            if 'prj' in files_dict and files_dict['prj']:
                prj_bytes = files_dict['prj']
                with open(os.path.join(tmp_dir, f"{base_name}.prj"), "wb") as f:
                    f.write(prj_bytes)
                prj_txt = prj_bytes.decode('utf-8', errors='ignore')
                if 'WGS_1984' in prj_txt or '4326' in prj_txt:
                    validation_report["crs_detected"] = "EPSG:4326"
                else:
                    validation_report["crs_detected"] = "Projected CRS"

            sf = shapefile.Reader(shp_path)
            shapes = sf.shapes()
            recs = sf.records()

            type_map = {1: 'Point', 3: 'LineString', 5: 'Polygon', 8: 'MultiPoint', 13: 'Polygon', 15: 'Polygon'}
            validation_report["geometry_type"] = type_map.get(sf.shapeType, 'Polygon')

            all_polys = []
            parsed_list = []
            
            for idx, s in enumerate(shapes):
                try:
                    sh_geom = shapely.geometry.shape(s)
                    if not sh_geom.is_valid:
                        sh_geom = sh_geom.buffer(0)
                    
                    all_polys.append(sh_geom)
                    wkt = sh_geom.wkt
                    
                    rec_dict = recs[idx].as_dict() if idx < len(recs) else {}
                    
                    if sh_geom.area < 1.0:
                        area_sq_m = sh_geom.area * 111000 * 99000
                    else:
                        area_sq_m = sh_geom.area
                    calculated_acres = max(0.1, min(99999.0, round(area_sq_m / 4046.86, 2)))

                    plot_name = rec_dict.get('Plot__Deta') or rec_dict.get('Plot_Name') or rec_dict.get('Name__Park') or rec_dict.get('NAME') or rec_dict.get('Name') or f"Plot_{idx+1}"
                    
                    # Area extraction from shapefile DBF if present
                    area_acres = calculated_acres
                    if 'Area' in rec_dict and isinstance(rec_dict['Area'], (int, float)) and rec_dict['Area'] > 0:
                        area_acres = round(rec_dict['Area'] * 2.47105, 2)
                    elif 'T_L_Ar_ha_' in rec_dict and isinstance(rec_dict['T_L_Ar_ha_'], (int, float)) and rec_dict['T_L_Ar_ha_'] > 0:
                        area_acres = round(rec_dict['T_L_Ar_ha_'] * 2.47105, 2)
                    elif 'T_L_bigha' in rec_dict and isinstance(rec_dict['T_L_bigha'], (int, float)) and rec_dict['T_L_bigha'] > 0:
                        area_acres = round(rec_dict['T_L_bigha'] * 0.3306, 2)

                    status_raw = str(rec_dict.get('Plot_Vacan') or rec_dict.get('Plot_vacan') or rec_dict.get('STATUS') or rec_dict.get('Status') or 'Vacan').strip()
                    s_lower = status_raw.lower()
                    if 'road' in s_lower or 'inner' in s_lower:
                        status = 'Inner Road'
                    elif 'doubt' in s_lower:
                        status = 'Doubtful'
                    elif 'occup' in s_lower or 'allot' in s_lower or 'alloc' in s_lower or 'used' in s_lower:
                        status = 'Occupied'
                    elif 'vacan' in s_lower or 'avail' in s_lower or status_raw in ['0', '0.0', '1', '1.0']:
                        status = 'Vacan'
                    elif status_raw in ['Vacan', 'Occupied', 'Doubtful', 'Inner Road']:
                        status = status_raw
                    else:
                        status = 'Vacan'

                    parsed_list.append({
                        "plot_name": str(plot_name),
                        "status": status,
                        "area_acres": area_acres,
                        "wkt": wkt,
                        "attributes": rec_dict
                    })
                except Exception as ex:
                    pass

            validation_report["total_features"] = len(parsed_list)
            validation_report["valid_features"] = len(parsed_list)
            validation_report["parsed_features"] = parsed_list

            if all_polys and sf.bbox:
                bbox = sf.bbox
                validation_report["bbox"] = [bbox[0], bbox[1], bbox[2], bbox[3]]
                validation_report["center_lng"] = round((bbox[0] + bbox[2]) / 2, 5)
                validation_report["center_lat"] = round((bbox[1] + bbox[3]) / 2, 5)

    except Exception as e:
        validation_report["is_valid"] = False
        validation_report["errors"].append(f"Parsing component files failed: {str(e)}")

    return validation_report


def validate_and_parse_spatial_file(file_name, file_content_bytes):
    """
    Parses incoming spatial file archives (ZIP shapefiles, GeoJSON, etc.),
    validates geometry topology, calculates bounding box, centroids, and areas.
    """
    file_ext = file_name.split('.')[-1].lower()
    
    validation_report = {
        "file_name": file_name,
        "format": file_ext.upper(),
        "crs_detected": "EPSG:4326",
        "geometry_type": "Polygon",
        "total_features": 0,
        "valid_features": 0,
        "invalid_features_repaired": 0,
        "is_valid": True,
        "errors": [],
        "parsed_features": [],
        "bbox": None,
        "center_lng": 91.76,
        "center_lat": 26.18
    }

    if file_ext not in ['shp', 'zip', 'gpkg', 'geojson', 'kml', 'csv', 'tif', 'tiff']:
        validation_report["is_valid"] = False
        validation_report["errors"].append("Unsupported file format.")
        return validation_report

    try:
        if file_ext == 'zip':
            with tempfile.TemporaryDirectory() as tmp_dir:
                zip_path = os.path.join(tmp_dir, "upload.zip")
                with open(zip_path, "wb") as f:
                    f.write(file_content_bytes)
                
                with zipfile.ZipFile(zip_path, 'r') as z:
                    z.extractall(tmp_dir)

                # Search for .shp file
                shp_files = []
                for root, dirs, files in os.walk(tmp_dir):
                    for file in files:
                        if file.endswith('.shp'):
                            shp_files.append(os.path.join(root, file))

                if not shp_files:
                    validation_report["is_valid"] = False
                    validation_report["errors"].append("No Shapefile (.shp) found in ZIP archive.")
                    return validation_report

                shp_path = shp_files[0]
                prj_path = shp_path.replace('.shp', '.prj')
                if os.path.exists(prj_path):
                    with open(prj_path, 'r', errors='ignore') as prj_f:
                        prj_txt = prj_f.read()
                        if 'WGS_1984' in prj_txt or '4326' in prj_txt:
                            validation_report["crs_detected"] = "EPSG:4326"
                        else:
                            validation_report["crs_detected"] = "UTM / Projected"

                sf = shapefile.Reader(shp_path)
                shapes = sf.shapes()
                recs = sf.records()

                type_map = {1: 'Point', 3: 'LineString', 5: 'Polygon', 8: 'MultiPoint', 13: 'Polygon', 15: 'Polygon'}
                validation_report["geometry_type"] = type_map.get(sf.shapeType, 'Polygon')

                all_polys = []
                parsed_list = []
                
                for idx, s in enumerate(shapes):
                    try:
                        sh_geom = shapely.geometry.shape(s)
                        if not sh_geom.is_valid:
                            sh_geom = sh_geom.buffer(0)
                        
                        all_polys.append(sh_geom)
                        wkt = sh_geom.wkt
                        
                        rec_dict = recs[idx].as_dict() if idx < len(recs) else {}
                        
                        if sh_geom.area < 1.0:
                            area_sq_m = sh_geom.area * 111000 * 99000
                        else:
                            area_sq_m = sh_geom.area
                        calculated_acres = max(0.1, min(99999.0, round(area_sq_m / 4046.86, 2)))

                        plot_name = rec_dict.get('Plot__Deta') or rec_dict.get('Plot_Name') or rec_dict.get('Name__Park') or rec_dict.get('NAME') or rec_dict.get('Name') or f"Plot_{idx+1}"
                        
                        area_acres = calculated_acres
                        if 'Area' in rec_dict and isinstance(rec_dict['Area'], (int, float)) and rec_dict['Area'] > 0:
                            area_acres = round(rec_dict['Area'] * 2.47105, 2)
                        elif 'T_L_Ar_ha_' in rec_dict and isinstance(rec_dict['T_L_Ar_ha_'], (int, float)) and rec_dict['T_L_Ar_ha_'] > 0:
                            area_acres = round(rec_dict['T_L_Ar_ha_'] * 2.47105, 2)
                        elif 'T_L_bigha' in rec_dict and isinstance(rec_dict['T_L_bigha'], (int, float)) and rec_dict['T_L_bigha'] > 0:
                            area_acres = round(rec_dict['T_L_bigha'] * 0.3306, 2)

                        status_raw = str(rec_dict.get('Plot_Vacan') or rec_dict.get('Plot_vacan') or rec_dict.get('STATUS') or rec_dict.get('Status') or 'Vacan').strip()
                        s_lower = status_raw.lower()
                        if 'road' in s_lower or 'inner' in s_lower:
                            status = 'Inner Road'
                        elif 'doubt' in s_lower:
                            status = 'Doubtful'
                        elif 'occup' in s_lower or 'allot' in s_lower or 'alloc' in s_lower or 'used' in s_lower:
                            status = 'Occupied'
                        elif 'vacan' in s_lower or 'avail' in s_lower or status_raw in ['0', '0.0', '1', '1.0']:
                            status = 'Vacan'
                        elif status_raw in ['Vacan', 'Occupied', 'Doubtful', 'Inner Road']:
                            status = status_raw
                        else:
                            status = 'Vacan'

                        parsed_list.append({
                            "plot_name": str(plot_name),
                            "status": status,
                            "area_acres": area_acres,
                            "wkt": wkt,
                            "attributes": rec_dict
                        })
                    except Exception as ex:
                        pass

                validation_report["total_features"] = len(parsed_list)
                validation_report["valid_features"] = len(parsed_list)
                validation_report["parsed_features"] = parsed_list

                if all_polys and sf.bbox:
                    bbox = sf.bbox
                    validation_report["bbox"] = [bbox[0], bbox[1], bbox[2], bbox[3]]
                    validation_report["center_lng"] = round((bbox[0] + bbox[2]) / 2, 5)
                    validation_report["center_lat"] = round((bbox[1] + bbox[3]) / 2, 5)

        elif file_ext == 'geojson':
            data = json.loads(file_content_bytes.decode('utf-8'))
            if 'features' in data:
                validation_report["total_features"] = len(data['features'])
                validation_report["valid_features"] = len(data['features'])
                if len(data['features']) > 0:
                    geom_type = data['features'][0].get('geometry', {}).get('type', 'Polygon')
                    validation_report["geometry_type"] = geom_type
            else:
                validation_report["is_valid"] = False
                validation_report["errors"].append("Invalid GeoJSON schema.")
        elif file_ext == 'csv':
            content = file_content_bytes.decode('utf-8')
            lines = content.splitlines()
            if len(lines) > 1:
                header = lines[0].lower()
                if 'lat' in header or 'latitude' in header or 'x' in header:
                    validation_report["total_features"] = len(lines) - 1
                    validation_report["valid_features"] = len(lines) - 1
                    validation_report["geometry_type"] = "Point"
                else:
                    validation_report["is_valid"] = False
                    validation_report["errors"].append("Coordinates (lat/lon) headers not found.")
            else:
                validation_report["is_valid"] = False
                validation_report["errors"].append("Empty CSV file.")
        elif file_ext in ['tif', 'tiff']:
            validation_report["geometry_type"] = "Raster (Grid)"
            validation_report["total_features"] = 1
            validation_report["crs_detected"] = "EPSG:32643"

    except Exception as e:
        validation_report["is_valid"] = False
        validation_report["errors"].append(f"Parsing failed: {str(e)}")

    return validation_report


def save_spatial_features_to_db(layer_name, report_data, category_id=2):
    """
    Persists parsed spatial features directly into PostGIS tables (gis_layers, industrial_estates, land_parcels).
    """
    parsed_features = report_data.get('parsed_features', [])
    bbox = report_data.get('bbox')

    with connection.cursor() as cursor:
        # Create GIS Layer registry entry
        cursor.execute(
            """
            INSERT INTO gis_layers (name, display_name, category_id, layer_type, source_type, is_published, style_config, display_order, created_at)
            VALUES (%s, %s, %s, %s, 'PostGIS', TRUE, '{"outline": "#0369a1", "fill": "rgba(2, 132, 199, 0.2)"}', 1, NOW())
            ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name
            RETURNING id
            """,
            [layer_name.lower().replace(' ', '_'), layer_name, category_id, report_data.get('geometry_type', 'Vector')]
        )
        layer_row = cursor.fetchone()
        layer_id = layer_row[0] if layer_row else None

        if layer_id:
            cursor.execute(
                """
                INSERT INTO layer_metadata (layer_id, description, source_department, data_owner, coordinate_reference_system, scale, version, license, keywords, last_updated)
                VALUES (%s, %s, 'GIS Administration', 'Admin User', %s, '1:1000', '1.0', 'Open Government Data License', '{}', NOW())
                ON CONFLICT DO NOTHING
                """,
                [layer_id, f"Uploaded Dataset: {layer_name}", report_data.get('crs_detected', 'EPSG:4326')]
            )

        if parsed_features:
            total_acres = round(min(99999.0, sum(f['area_acres'] for f in parsed_features)), 2)
            avail_acres = round(min(99999.0, sum(f['area_acres'] for f in parsed_features if f['status'] == 'Vacan')), 2)
            alloc_acres = round(min(99999.0, sum(f['area_acres'] for f in parsed_features if f['status'] == 'Occupied')), 2)

            estate_name = f"{layer_name} Industrial Area"
            estate_wkt = parsed_features[0]['wkt']

            cursor.execute(
                """
                INSERT INTO industrial_estates (name, total_area_acres, allocated_area_acres, available_area_acres, power_capacity_mw, water_capacity_mld, gas_pipeline_available, drainage_available, created_at, geom)
                VALUES (%s, %s, %s, %s, 10.00, 5.00, TRUE, TRUE, NOW(), ST_GeomFromText(%s, 4326))
                ON CONFLICT (name) DO UPDATE SET total_area_acres = EXCLUDED.total_area_acres, geom = EXCLUDED.geom
                RETURNING id
                """,
                [estate_name, total_acres, alloc_acres, avail_acres, estate_wkt]
            )
            estate_row = cursor.fetchone()
            estate_id = estate_row[0] if estate_row else None

            if estate_id:
                for idx, feat in enumerate(parsed_features):
                    clean_name_code = "".join([c for c in layer_name.upper() if c.isalnum()])[:4] or "IMP"
                    p_id = f"LP-{clean_name_code}-{idx+1:03d}"
                    attrs_json = json.dumps(feat.get('attributes', {}))
                    cursor.execute(
                        """
                        INSERT INTO land_parcels (estate_id, parcel_id, plot_number, area_acres, availability_status, land_classification, ownership_details, infrastructure_details, photo_urls, created_at, geom)
                        VALUES (%s, %s, %s, %s, %s, 'General', 'Government Land Bank', %s, '{}', NOW(), ST_GeomFromText(%s, 4326))
                        ON CONFLICT (parcel_id) DO UPDATE SET geom = EXCLUDED.geom, area_acres = EXCLUDED.area_acres, infrastructure_details = EXCLUDED.infrastructure_details
                        """,
                        [estate_id, p_id, feat['plot_name'], feat['area_acres'], feat['status'], attrs_json, feat['wkt']]
                    )

    return layer_id


def delete_layer_cascade(layer_id):
    """
    Cascades layer deletion: purges layer metadata, associated industrial estates, 
    linked land parcels, and the GIS layer entry from PostGIS tables.
    """
    with connection.cursor() as cursor:
        cursor.execute("SELECT name, display_name FROM gis_layers WHERE id = %s", [layer_id])
        row = cursor.fetchone()
        if not row:
            return False, "Layer not found"

        layer_name, display_name = row[0], row[1]
        estate_name = f"{display_name} Industrial Area"

        # 1. Delete associated metadata
        cursor.execute("DELETE FROM layer_metadata WHERE layer_id = %s", [layer_id])

        # 2. Get estate IDs associated with this layer
        cursor.execute(
            "SELECT id FROM industrial_estates WHERE name = %s OR name ILIKE %s OR name ILIKE %s",
            [estate_name, f"%{layer_name}%", f"%{display_name}%"]
        )
        estate_ids = [r[0] for r in cursor.fetchall()]

        # 3. Delete land parcels linked to these estates
        if estate_ids:
            cursor.execute("DELETE FROM land_parcels WHERE estate_id = ANY(%s)", [estate_ids])
            cursor.execute("DELETE FROM industrial_estates WHERE id = ANY(%s)", [estate_ids])

        # 4. Delete the GIS layer entry
        cursor.execute("DELETE FROM gis_layers WHERE id = %s", [layer_id])

        return True, display_name

