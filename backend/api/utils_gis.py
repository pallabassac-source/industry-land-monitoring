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

    # Sanitize field names to prevent SQL injection (OWASP A03)
    allowed_fields = {
        'parcels': ['parcel_id', 'plot_number', 'survey_number', 'area_acres', 'availability_status', 'land_classification', 'ownership_details'],
        'estates': ['name', 'total_area_acres', 'available_area_acres', 'power_capacity_mw'],
        'infrastructure': ['name', 'infra_type'],
        'districts': ['name', 'code'],
        'circles': ['name', 'code'],
        'villages': ['name', 'code']
    }.get(layer_name, ['name', 'parcel_id', 'plot_number', 'availability_status'])

    # Apply attribute filters
    if attribute_filters:
        if isinstance(attribute_filters, dict):
            for k, v in attribute_filters.items():
                if k in allowed_fields and v is not None:
                    where_clauses.append(f"{k} = %s")
                    params.append(v)
        elif isinstance(attribute_filters, list):
            for cond in attribute_filters:
                field = cond.get('field')
                op = cond.get('operator')
                val = cond.get('value')
                if not field or not op or val is None:
                    continue
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
import shapely.wkt
from shapely.ops import transform
from pyproj import Transformer


def parse_shapefile_dataset(shp_path, prj_txt=None):
    """
    Parses a shapefile (.shp), detects the source coordinate reference system (CRS),
    and automatically reprojects all geometries into standard WGS84 (EPSG:4326) degrees.
    Returns: (parsed_list, all_polys, crs_detected, geometry_type, bbox, center_lng, center_lat)
    """
    src_crs = None
    transformer = None
    crs_detected = "EPSG:4326"

    if prj_txt and prj_txt.strip():
        clean_prj = prj_txt.strip()
        try:
            src_crs = pyproj.CRS.from_user_input(clean_prj)
            crs_name = src_crs.name or str(src_crs)
            if src_crs.is_projected or (src_crs.to_epsg() and src_crs.to_epsg() != 4326):
                transformer = Transformer.from_crs(src_crs, "EPSG:4326", always_xy=True)
                crs_detected = f"EPSG:4326 (Reprojected from {crs_name})"
            else:
                crs_detected = "EPSG:4326"
        except Exception:
            # Fallback heuristic string check
            if 'UTM' in clean_prj.upper() or 'METER' in clean_prj.upper() or 'PROJCS' in clean_prj.upper():
                crs_detected = "Projected CRS (Auto-Reprojection Pending)"

    sf = shapefile.Reader(shp_path)
    shapes = sf.shapes()
    recs = sf.records()

    type_map = {1: 'Point', 3: 'LineString', 5: 'Polygon', 8: 'MultiPoint', 13: 'Polygon', 15: 'Polygon'}
    geometry_type = type_map.get(sf.shapeType, 'Polygon')

    # Heuristic fallback: if no transformer was set via .prj, but coordinates are projected (> 180 or > 90)
    if not transformer and sf.bbox:
        min_x, min_y, max_x, max_y = sf.bbox
        if abs(min_x) > 180 or abs(max_x) > 180 or abs(min_y) > 90 or abs(max_y) > 90:
            # Assam State Space Application Centre standard UTM Zone is UTM 46N (EPSG:32646)
            try:
                transformer = Transformer.from_crs("EPSG:32646", "EPSG:4326", always_xy=True)
                crs_detected = "EPSG:4326 (Auto-detected UTM Zone 46N Reprojected)"
            except Exception:
                pass

    all_polys = []
    parsed_list = []

    for idx, s in enumerate(shapes):
        try:
            orig_geom = shapely.geometry.shape(s)
            if not orig_geom.is_valid:
                orig_geom = orig_geom.buffer(0)

            # Metric area calculation in acres
            if orig_geom.area < 1.0:
                area_sq_m = orig_geom.area * 111000 * 99000
            else:
                area_sq_m = orig_geom.area
            calculated_acres = max(0.1, min(99999.0, round(area_sq_m / 4046.86, 2)))

            # Reproject geometry to WGS84 (EPSG:4326)
            if transformer:
                try:
                    sh_geom = transform(transformer.transform, orig_geom)
                    if not sh_geom.is_valid:
                        sh_geom = sh_geom.buffer(0)
                except Exception:
                    sh_geom = orig_geom
            else:
                sh_geom = orig_geom

            # Verify geometry bounds are within valid WGS84 coordinates
            gb = sh_geom.bounds
            if abs(gb[1]) > 90 or abs(gb[3]) > 90 or abs(gb[0]) > 180 or abs(gb[2]) > 180:
                try:
                    fb_trans = Transformer.from_crs("EPSG:32646", "EPSG:4326", always_xy=True)
                    sh_geom = transform(fb_trans.transform, orig_geom)
                    if not sh_geom.is_valid:
                        sh_geom = sh_geom.buffer(0)
                except Exception:
                    pass

            all_polys.append(sh_geom)
            wkt = sh_geom.wkt

            rec_dict = recs[idx].as_dict() if idx < len(recs) else {}

            plot_name = (rec_dict.get('Plot__Deta') or rec_dict.get('Plot_Name') or 
                         rec_dict.get('Name__Park') or rec_dict.get('NAME') or 
                         rec_dict.get('Name') or f"Plot_{idx+1}")

            # Area extraction from DBF if present
            area_acres = calculated_acres
            if 'Area' in rec_dict and isinstance(rec_dict['Area'], (int, float)) and rec_dict['Area'] > 0:
                area_acres = round(rec_dict['Area'] * 2.47105, 2)
            elif 'T_L_Ar_ha_' in rec_dict and isinstance(rec_dict['T_L_Ar_ha_'], (int, float)) and rec_dict['T_L_Ar_ha_'] > 0:
                area_acres = round(rec_dict['T_L_Ar_ha_'] * 2.47105, 2)
            elif 'T_L_bigha' in rec_dict and isinstance(rec_dict['T_L_bigha'], (int, float)) and rec_dict['T_L_bigha'] > 0:
                area_acres = round(rec_dict['T_L_bigha'] * 0.3306, 2)

            status_raw = str(rec_dict.get('Plot_Vacan') or rec_dict.get('Plot_vacan') or 
                             rec_dict.get('STATUS') or rec_dict.get('Status') or 'Vacan').strip()
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
        except Exception:
            pass

    if all_polys:
        minx = min(p.bounds[0] for p in all_polys)
        miny = min(p.bounds[1] for p in all_polys)
        maxx = max(p.bounds[2] for p in all_polys)
        maxy = max(p.bounds[3] for p in all_polys)
        bbox = [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]
        center_lng = round((minx + maxx) / 2, 5)
        center_lat = round((miny + maxy) / 2, 5)
    else:
        bbox = None
        center_lng = 91.76
        center_lat = 26.18

    return parsed_list, all_polys, crs_detected, geometry_type, bbox, center_lng, center_lat


def validate_and_parse_component_files(files_dict, layer_name="Imported_Layer"):
    """
    Parses separate shapefile component files (.shp, .dbf, .shx, .prj) uploaded directly,
    ensuring all coordinates are automatically reprojected to EPSG:4326.
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

            prj_txt = None
            if 'prj' in files_dict and files_dict['prj']:
                prj_bytes = files_dict['prj']
                with open(os.path.join(tmp_dir, f"{base_name}.prj"), "wb") as f:
                    f.write(prj_bytes)
                prj_txt = prj_bytes.decode('utf-8', errors='ignore')

            parsed_list, all_polys, crs_det, geom_type, bbox, center_lng, center_lat = parse_shapefile_dataset(shp_path, prj_txt)

            validation_report["crs_detected"] = crs_det
            validation_report["geometry_type"] = geom_type
            validation_report["total_features"] = len(parsed_list)
            validation_report["valid_features"] = len(parsed_list)
            validation_report["parsed_features"] = parsed_list
            validation_report["bbox"] = bbox
            validation_report["center_lng"] = center_lng
            validation_report["center_lat"] = center_lat

    except Exception as e:
        validation_report["is_valid"] = False
        validation_report["errors"].append(f"Parsing component files failed: {str(e)}")

    return validation_report


def validate_and_parse_spatial_file(file_name, file_content_bytes):
    """
    Parses incoming spatial file archives (ZIP shapefiles, GeoJSON, etc.),
    validates geometry topology, calculates bounding box, centroids, and areas,
    and automatically reprojects projected geometries to WGS84 (EPSG:4326).
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
                    for member in z.infolist():
                        target_path = os.path.realpath(os.path.join(tmp_dir, member.filename))
                        if not target_path.startswith(os.path.realpath(tmp_dir) + os.sep):
                            raise ValueError(f"Dangerous path traversal detected in ZIP archive: {member.filename}")
                        z.extract(member, tmp_dir)

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
                prj_txt = None
                if os.path.exists(prj_path):
                    with open(prj_path, 'r', errors='ignore') as prj_f:
                        prj_txt = prj_f.read()

                parsed_list, all_polys, crs_det, geom_type, bbox, center_lng, center_lat = parse_shapefile_dataset(shp_path, prj_txt)

                validation_report["crs_detected"] = crs_det
                validation_report["geometry_type"] = geom_type
                validation_report["total_features"] = len(parsed_list)
                validation_report["valid_features"] = len(parsed_list)
                validation_report["parsed_features"] = parsed_list
                validation_report["bbox"] = bbox
                validation_report["center_lng"] = center_lng
                validation_report["center_lat"] = center_lat

        elif file_ext == 'geojson':
            data = json.loads(file_content_bytes.decode('utf-8'))
            if 'features' in data:
                features = data['features']
                validation_report["total_features"] = len(features)
                validation_report["valid_features"] = len(features)
                if len(features) > 0:
                    geom_type = features[0].get('geometry', {}).get('type', 'Polygon')
                    validation_report["geometry_type"] = geom_type
                
                # Check coordinates and parse features
                parsed_list = []
                transformer = None
                for idx, feat in enumerate(features):
                    try:
                        g_json = feat.get('geometry')
                        if not g_json:
                            continue
                        sh_geom = shapely.geometry.shape(g_json)
                        if not sh_geom.is_valid:
                            sh_geom = sh_geom.buffer(0)
                        
                        gb = sh_geom.bounds
                        if not transformer and (abs(gb[1]) > 90 or abs(gb[3]) > 90 or abs(gb[0]) > 180 or abs(gb[2]) > 180):
                            transformer = Transformer.from_crs("EPSG:32646", "EPSG:4326", always_xy=True)
                            validation_report["crs_detected"] = "EPSG:4326 (Auto-reprojected UTM Zone 46N)"

                        if transformer:
                            sh_geom = transform(transformer.transform, sh_geom)
                            if not sh_geom.is_valid:
                                sh_geom = sh_geom.buffer(0)

                        props = feat.get('properties', {})
                        p_name = props.get('name') or props.get('plot_number') or props.get('parcel_id') or f"Plot_{idx+1}"
                        status = props.get('status') or props.get('availability_status') or 'Vacan'
                        area = float(props.get('area_acres') or max(0.1, round(sh_geom.area * 111000 * 99000 / 4046.86, 2)))

                        parsed_list.append({
                            "plot_name": str(p_name),
                            "status": status,
                            "area_acres": area,
                            "wkt": sh_geom.wkt,
                            "attributes": props
                        })
                    except Exception:
                        pass
                
                validation_report["parsed_features"] = parsed_list
                if parsed_list:
                    all_bounds = [shapely.wkt.loads(f['wkt']).bounds for f in parsed_list]
                    minx = min(b[0] for b in all_bounds)
                    miny = min(b[1] for b in all_bounds)
                    maxx = max(b[2] for b in all_bounds)
                    maxy = max(b[3] for b in all_bounds)
                    validation_report["bbox"] = [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]
                    validation_report["center_lng"] = round((minx + maxx) / 2, 5)
                    validation_report["center_lat"] = round((miny + maxy) / 2, 5)
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
            validation_report["crs_detected"] = "EPSG:32646"

    except Exception as e:
        validation_report["is_valid"] = False
        validation_report["errors"].append(f"Parsing failed: {str(e)}")

    return validation_report


def auto_repair_projected_geometries():
    """
    Scans the database for any land parcels or industrial estates stored with
    unprojected UTM meter coordinates (latitude > 90 degrees), and automatically
    transforms them in-place to standard WGS84 (EPSG:4326).
    """
    repaired_count = 0
    try:
        from django.db import transaction
        with transaction.atomic():
            with connection.cursor() as cursor:
                if connection.vendor == 'postgresql':
                    cursor.execute(
                        "SELECT COUNT(*) FROM industrial_estates WHERE ST_YMin(geom) > 90 OR ST_XMin(geom) > 180;"
                    )
                    bad_estates = cursor.fetchone()[0]
                    if bad_estates > 0:
                        cursor.execute(
                            """
                            UPDATE industrial_estates 
                            SET geom = ST_Transform(ST_SetSRID(geom, 32646), 4326) 
                            WHERE ST_YMin(geom) > 90 OR ST_XMin(geom) > 180;
                            """
                        )
                        repaired_count += bad_estates

                    cursor.execute(
                        "SELECT COUNT(*) FROM land_parcels WHERE ST_YMin(geom) > 90 OR ST_XMin(geom) > 180;"
                    )
                    bad_parcels = cursor.fetchone()[0]
                    if bad_parcels > 0:
                        cursor.execute(
                            """
                            UPDATE land_parcels 
                            SET geom = ST_Transform(ST_SetSRID(geom, 32646), 4326) 
                            WHERE ST_YMin(geom) > 90 OR ST_XMin(geom) > 180;
                            """
                        )
                        repaired_count += bad_parcels
    except Exception as e:
        pass
    return repaired_count


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
            VALUES (%s, %s, %s, %s, 'PostGIS', TRUE, '{"outline": "#0369a1", "fill": "rgba(2, 132, 199, 0.2)"}', 1, CURRENT_TIMESTAMP)
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
                VALUES (%s, %s, 'GIS Administration', 'Admin User', %s, '1:1000', '1.0', 'Open Government Data License', '{}', CURRENT_TIMESTAMP)
                ON CONFLICT DO NOTHING
                """,
                [layer_id, f"Uploaded Dataset: {layer_name}", report_data.get('crs_detected', 'EPSG:4326')]
            )

        if parsed_features:
            # Final sanity check: ensure all WKTs are in EPSG:4326 degrees
            try:
                safe_transformer = Transformer.from_crs("EPSG:32646", "EPSG:4326", always_xy=True)
                for feat in parsed_features:
                    wkt_str = feat.get('wkt', '')
                    if wkt_str:
                        g_obj = shapely.wkt.loads(wkt_str)
                        gb = g_obj.bounds
                        if abs(gb[1]) > 90 or abs(gb[3]) > 90 or abs(gb[0]) > 180 or abs(gb[2]) > 180:
                            reproj_g = transform(safe_transformer.transform, g_obj)
                            feat['wkt'] = reproj_g.wkt
            except Exception:
                pass

            total_acres = round(min(99999.0, sum(f['area_acres'] for f in parsed_features)), 2)
            avail_acres = round(min(99999.0, sum(f['area_acres'] for f in parsed_features if f['status'] == 'Vacan')), 2)
            alloc_acres = round(min(99999.0, sum(f['area_acres'] for f in parsed_features if f['status'] == 'Occupied')), 2)

            estate_name = f"{layer_name} Industrial Area"
            estate_wkt = parsed_features[0]['wkt']

            geom_fn = "ST_GeomFromText(%s, 4326)" if connection.vendor == 'postgresql' else "%s"
            cursor.execute(
                f"""
                INSERT INTO industrial_estates (name, total_area_acres, allocated_area_acres, available_area_acres, power_capacity_mw, water_capacity_mld, gas_pipeline_available, drainage_available, created_at, geom)
                VALUES (%s, %s, %s, %s, 10.00, 5.00, TRUE, TRUE, CURRENT_TIMESTAMP, {geom_fn})
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
                        f"""
                        INSERT INTO land_parcels (estate_id, parcel_id, plot_number, area_acres, availability_status, land_classification, ownership_details, infrastructure_details, photo_urls, created_at, geom)
                        VALUES (%s, %s, %s, %s, %s, 'General', 'Government Land Bank', %s, '{{}}', CURRENT_TIMESTAMP, {geom_fn})
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
        like_op = "ILIKE" if connection.vendor == 'postgresql' else "LIKE"
        cursor.execute(
            f"SELECT id FROM industrial_estates WHERE name = %s OR name {like_op} %s OR name {like_op} %s",
            [estate_name, f"%{layer_name}%", f"%{display_name}%"]
        )
        estate_ids = [r[0] for r in cursor.fetchall()]

        # 3. Delete land parcels linked to these estates
        if estate_ids:
            placeholders = ','.join(['%s'] * len(estate_ids))
            cursor.execute(f"DELETE FROM land_parcels WHERE estate_id IN ({placeholders})", estate_ids)
            cursor.execute(f"DELETE FROM industrial_estates WHERE id IN ({placeholders})", estate_ids)

        # 4. Delete the GIS layer entry
        cursor.execute("DELETE FROM gis_layers WHERE id = %s", [layer_id])

        return True, display_name

