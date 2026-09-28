-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Authentication and User Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Administrative Boundaries
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE,
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_districts_geom ON districts USING GIST (geom);

CREATE TABLE circles (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, name)
);
CREATE INDEX idx_circles_geom ON circles USING GIST (geom);

CREATE TABLE villages (
    id SERIAL PRIMARY KEY,
    circle_id INTEGER REFERENCES circles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(circle_id, name)
);
CREATE INDEX idx_villages_geom ON villages USING GIST (geom);

-- 3. Industrial Estates
CREATE TABLE industrial_estates (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    name VARCHAR(150) UNIQUE NOT NULL,
    total_area_acres NUMERIC(10, 2) NOT NULL,
    allocated_area_acres NUMERIC(10, 2) DEFAULT 0.00,
    available_area_acres NUMERIC(10, 2) DEFAULT 0.00,
    power_capacity_mw NUMERIC(6, 2) DEFAULT 0.00,
    water_capacity_mld NUMERIC(6, 2) DEFAULT 0.00,
    gas_pipeline_available BOOLEAN DEFAULT FALSE,
    drainage_available BOOLEAN DEFAULT FALSE,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_estates_geom ON industrial_estates USING GIST (geom);

-- 4. Land Parcels
CREATE TABLE land_parcels (
    id SERIAL PRIMARY KEY,
    estate_id INTEGER REFERENCES industrial_estates(id) ON DELETE CASCADE,
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    plot_number VARCHAR(50) NOT NULL,
    survey_number VARCHAR(50),
    village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
    area_acres NUMERIC(10, 2) NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'Available', -- Available, Allocated, Reserved, Dispute
    land_classification VARCHAR(100) DEFAULT 'General', -- Chemical, Food Processing, General, IT, Engineering
    ownership_details VARCHAR(255) DEFAULT 'Government Land Bank',
    infrastructure_details JSONB DEFAULT '{}'::jsonb,
    photo_urls TEXT[],
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_parcels_geom ON land_parcels USING GIST (geom);
CREATE INDEX idx_parcels_status ON land_parcels(availability_status);

-- 5. Infrastructure GIS Layers
CREATE TABLE infrastructure_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    infra_type VARCHAR(50) NOT NULL, -- Road, Railway, PowerLine, GasPipeline, Drainage, WaterLine
    attributes JSONB DEFAULT '{}'::jsonb,
    geom GEOMETRY(LineString, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_infra_geom ON infrastructure_layers USING GIST (geom);

-- 6. Layer Catalog and Metadata Management
CREATE TABLE layer_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE gis_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    category_id INTEGER REFERENCES layer_categories(id) ON DELETE CASCADE,
    layer_type VARCHAR(20) DEFAULT 'Vector', -- Vector, Raster
    source_type VARCHAR(20) DEFAULT 'PostGIS', -- PostGIS, WMS, MapServer, GeoTIFF
    is_published BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    style_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE layer_metadata (
    id SERIAL PRIMARY KEY,
    layer_id INTEGER REFERENCES gis_layers(id) ON DELETE CASCADE,
    description TEXT,
    source_department VARCHAR(150),
    data_owner VARCHAR(150),
    coordinate_reference_system VARCHAR(50) DEFAULT 'EPSG:4326',
    scale VARCHAR(50) DEFAULT '1:5000',
    version VARCHAR(20) DEFAULT '1.0',
    license VARCHAR(100) DEFAULT 'Open Government Data License',
    keywords TEXT[],
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Logging
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action_type VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, CREATE_PARCEL, UPLOAD_GIS, MODIFY_LAYER, SEARCH
    client_ip VARCHAR(45),
    action_details TEXT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_time ON audit_logs(created_at);

-- 8. System & Map Settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT
);

-- 9. External Integration Adapters Framework
CREATE TABLE integration_adapters (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(100) UNIQUE NOT NULL, -- DPIIT, EoDB, Revenue
    endpoint_url TEXT,
    auth_config JSONB DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN DEFAULT FALSE,
    sync_interval_seconds INTEGER DEFAULT 3600,
    last_sync_status VARCHAR(50),
    last_sync_at TIMESTAMP WITH TIME ZONE
);

-- BOOTSTRAP DEFAULT DATA

-- Roles
INSERT INTO roles (name, description) VALUES
('Super Administrator', 'Full system control, settings, user configuration'),
('Department Administrator', 'Manages estates, land inventories, settings'),
('GIS Administrator', 'Controls layers, parses shapefiles, edits spatial records'),
('Data Entry Operator', 'CRUD operations on land registers and parcels'),
('General Government User', 'Read-only access to GIS viewer, maps, dashboard stats');

-- Default Admin User (Password is 'gis_secure_admin_2026' hashed with bcrypt/django standard format mock)
INSERT INTO users (username, password_hash, full_name, email, role_id) VALUES
('gisadmin', 'pbkdf2_sha256$600000$mockedhashvalue$adminpasswordhash2026', 'State GIS Administrator', 'gis.admin@gov.in', 1),
('dataentry', 'pbkdf2_sha256$600000$mockedhashvalue$dataentrypasswordhash', 'Data Entry Officer', 'data.entry@gov.in', 4);

-- Layer Categories
INSERT INTO layer_categories (name, display_order) VALUES
('Administrative Boundaries', 1),
('Industrial Assets', 2),
('Infrastructure & Utilities', 3);

-- GIS Layers
INSERT INTO gis_layers (name, display_name, category_id, layer_type, source_type, is_published, display_order, style_config) VALUES
('districts', 'District Boundaries', 1, 'Vector', 'PostGIS', TRUE, 1, '{"outline": "#1e293b", "fill": "rgba(30, 41, 59, 0.05)"}'),
('estates', 'Industrial Estates', 2, 'Vector', 'PostGIS', TRUE, 2, '{"outline": "#0369a1", "fill": "rgba(2, 132, 199, 0.2)"}'),
('parcels', 'Land Parcels', 2, 'Vector', 'PostGIS', TRUE, 3, '{"outline": "#15803d", "fill": "rgba(22, 163, 74, 0.15)"}'),
('infrastructure', 'Infrastructure Lines', 3, 'Vector', 'PostGIS', TRUE, 4, '{"color": "#ea580c", "width": 2}');

-- Layer Metadata
INSERT INTO layer_metadata (layer_id, description, source_department, data_owner, coordinate_reference_system, scale, version, license, keywords) VALUES
(1, 'All state administrative boundaries', 'Revenue Department', 'Directorate of Land Records', 'EPSG:4326', '1:50000', '1.0', 'Open Govt License', ARRAY['districts', 'boundaries', 'revenue']),
(2, 'Boundaries of industrial estates and corridors', 'Industries Department', 'AIDC', 'EPSG:4326', '1:5000', '1.2', 'Proprietary Govt Internal', ARRAY['estates', 'industrial', 'plots']),
(3, 'Individual land parcels within industrial areas', 'Industries Department', 'AIDC', 'EPSG:4326', '1:1000', '2.0', 'Proprietary Govt Internal', ARRAY['parcels', 'plots', 'allotment']);

-- Default System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('DEFAULT_CRS', 'EPSG:4326', 'Default Coordinate Reference System for spatial queries'),
('MAP_CENTER_LAT', '26.18', 'Map Center Latitude Coordinate'),
('MAP_CENTER_LNG', '91.76', 'Map Center Longitude Coordinate'),
('MAP_DEFAULT_ZOOM', '12', 'Default Zoom level of interactive map'),
('MAX_UPLOAD_SIZE_MB', '50', 'Maximum size of shapefile/geopackage zip files upload');

-- Integration adapters
INSERT INTO integration_adapters (system_name, endpoint_url, is_enabled) VALUES
('DPIIT National Land Bank', 'https://nlbp.dpiit.gov.in/api/v1/sync', FALSE),
('Single Window Clearance Gateway', 'https://eodb.assam.gov.in/api/v1/land', FALSE);
