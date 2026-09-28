# Production Deployment Guide — Industrial Land Bank Management Portal (PRD v1.0)

This guide provides step-by-step instructions for deploying the **Industrial Land Bank Management Portal** (Government Enterprise GIS Platform) in a production environment using **Docker Compose** on an **Ubuntu Server LTS** instance.

---

## System Requirements

* **Operating System**: Ubuntu Server 22.04 LTS or newer
* **Processor**: 4 Cores (minimum) / 8 Cores (recommended)
* **Memory (RAM)**: 8GB RAM (minimum) / 16GB RAM (recommended for large spatial parsing)
* **Storage**: 100GB SSD (minimum) / 500GB NVMe (recommended)
* **Software**: Docker Engine v24.0.0+ & Docker Compose v2.20.0+

---

## 1. Directory Structure

Ensure the directory structure matches the repository layout on the server:

```
/var/www/gis-portal/
├── docker-compose.yml
├── DEPLOYMENT.md
├── docker/
│   ├── init_postgis.sql
│   ├── nginx/
│   │   └── nginx.conf
│   └── mapserver/
│       └── mapfile.map
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── celery.py
│   └── api/
│       ├── models.py
│       ├── views.py
│       └── utils_gis.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
```

---

## 2. Environment Configuration

Create a `.env` file in the project root containing key security parameters:

```env
# Database Credentials
POSTGRES_DB=industrial_land_bank
POSTGRES_USER=gis_admin
POSTGRES_PASSWORD=gis_secure_password_2026

# Django Settings
SECRET_KEY=django-secure-production-secret-key-change-me
DEBUG=False
ALLOWED_HOSTS=gis.assam.gov.in,localhost

# Spatial Settings
DEFAULT_CRS=EPSG:4326
MAP_CENTER_LAT=26.18
MAP_CENTER_LNG=91.76
MAP_DEFAULT_ZOOM=12
MAX_UPLOAD_SIZE_MB=50
```

---

## 3. Production Deployment Commands

Follow these command blocks to bootstrap and orchestrate the environment:

### Step A: Pull and Build Containers
```bash
# Clone the repository and navigate to the root directory
cd /var/www/gis-portal

# Build the containers using Docker Compose
docker compose build
```

### Step B: Start services in the background
```bash
docker compose up -d
```

### Step C: Verify Service Health
Check that all containers are up and running:
```bash
docker compose ps
```
Services list:
* `gis_portal_db`: PostgreSQL 16 + PostGIS 3.4 database.
* `gis_portal_backend`: Django REST API service.
* `gis_portal_celery`: Celery worker for spatial ingestion.
* `gis_portal_redis`: Redis broker.
* `gis_portal_mapserver`: MapServer OGC gateway.
* `gis_portal_frontend`: React UI client.
* `gis_portal_nginx`: Reverse proxy routing traffic.

### Step D: Database Migrations
Run the initial Django DB migrations to register standard admin fields:
```bash
docker compose exec backend python manage.py migrate
```

---

## 4. OGC Spatial Operations Verification

Test the OGC compliance endpoints:

### OGC WMS (Web Map Service)
Verify WMS capabilities response:
```bash
curl "http://localhost/ogc/?service=WMS&version=1.3.0&request=GetCapabilities"
```

### OGC WFS (Web Feature Service)
Verify WFS feature lookup:
```bash
curl "http://localhost/ogc/?service=WFS&version=2.0.0&request=GetCapabilities"
```

---

## 5. Security Recommendations

1. **HTTPS Enforcement**: Always set up SSL certificates (Let's Encrypt / Certbot) on Nginx.
2. **Access Control**: Configure strict firewall rules on Ubuntu Server (UFW) only exposing ports `80` and `443`.
3. **Database Backups**: Schedule a nightly `pg_dump` cron job backing up database schemas and geometries to secure remote storage.
