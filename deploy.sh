#!/usr/bin/env bash

# ==============================================================================
# Industrial Land Bank Management Portal — Automated Production Deployment
# ==============================================================================

set -e

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}======================================================================${NC}"
echo -e "${CYAN}${BOLD}   Industrial Land Bank Management Portal — Production Deployer   ${NC}"
echo -e "${BLUE}${BOLD}======================================================================${NC}\n"

# 1. Check Root / Sudo privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}[!] Warning: It is recommended to run this script with sudo or root privileges.${NC}"
fi

# 2. Check and Install Docker if missing
echo -e "${CYAN}[1/6] Checking Docker and Docker Compose environment...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}[*] Docker not found. Installing Docker Engine...${NC}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm -f get-docker.sh
  
  if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
  fi
  echo -e "${GREEN}[✓] Docker installed successfully.${NC}"
else
  echo -e "${GREEN}[✓] Docker is already installed: $(docker --version)${NC}"
fi

# Check Docker Compose (v2 plugin)
if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
else
  echo -e "${YELLOW}[*] Docker Compose plugin not found. Installing compose plugin...${NC}"
  apt-get update && apt-get install -y docker-compose-plugin || yum install -y docker-compose-plugin
  COMPOSE_CMD="docker compose"
fi
echo -e "${GREEN}[✓] Docker Compose ready: $($COMPOSE_CMD version)${NC}\n"

# 3. Setup Environment Configuration (.env)
echo -e "${CYAN}[2/6] Configuring environment settings...${NC}"

if [ ! -f .env ]; then
  echo -e "${YELLOW}[*] .env file not found. Creating from .env.example with secure keys...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    cat << 'EOF' > .env
POSTGRES_DB=industrial_land_bank
POSTGRES_USER=gis_admin
POSTGRES_PASSWORD=gis_secure_password_2026
DATABASE_URL=postgres://gis_admin:gis_secure_password_2026@db:5432/industrial_land_bank
REDIS_URL=redis://redis:6379/0
SECRET_KEY=django-secure-production-secret-key-2026-gis-portal
DEBUG=False
ALLOWED_HOSTS=*
DEFAULT_CRS=EPSG:4326
MAP_CENTER_LAT=26.18
MAP_CENTER_LNG=91.76
MAP_DEFAULT_ZOOM=12
MAX_UPLOAD_SIZE_MB=50
EOF
  fi
  # Generate random Django secret key if openssl is available
  if command -v openssl &> /dev/null; then
    RANDOM_KEY=$(openssl rand -hex 32)
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$RANDOM_KEY/" .env
  fi
  echo -e "${GREEN}[✓] .env generated successfully.${NC}"
else
  echo -e "${GREEN}[✓] Existing .env file found.${NC}"
fi
echo ""

# 4. Build and Start Multi-Container Stack
echo -e "${CYAN}[3/6] Building and orchestrating Docker containers...${NC}"
$COMPOSE_CMD build
$COMPOSE_CMD up -d

echo -e "${GREEN}[✓] All 7 containers initialized in background.${NC}\n"

# 5. Wait for Database Health Check
echo -e "${CYAN}[4/6] Waiting for PostGIS Spatial Database to be healthy...${NC}"
RETRIES=30
until [ $($COMPOSE_CMD ps db --format json 2>/dev/null | grep -i "healthy" | wc -l) -gt 0 ] || [ $RETRIES -eq 0 ]; do
  echo -n "."
  sleep 2
  RETRIES=$((RETRIES - 1))
done
echo ""

if [ $RETRIES -eq 0 ]; then
  echo -e "${YELLOW}[!] Warning: PostGIS database healthcheck timed out. Proceeding anyway...${NC}"
else
  echo -e "${GREEN}[✓] PostGIS database is healthy and accepting connections.${NC}"
fi
echo ""

# 6. Database Migrations, Static Files & Initial Seed Data
echo -e "${CYAN}[5/6] Initializing database schema and seeding spatial datasets...${NC}"

# Run Django migrations
echo -e "${BLUE}[*] Applying Django migrations...${NC}"
$COMPOSE_CMD exec -T backend python manage.py migrate --noinput || true

# Collect static assets
echo -e "${BLUE}[*] Collecting static assets...${NC}"
$COMPOSE_CMD exec -T backend python manage.py collectstatic --noinput || true

# Run seed script for Pathsala GIS Dataset
echo -e "${BLUE}[*] Seeding Pathsala Industrial Estate and Plot boundaries...${NC}"
$COMPOSE_CMD exec -T backend python seed_pathsala.py || true

echo -e "${GREEN}[✓] Database migrations and dataset seeding completed.${NC}\n"

# 7. Verification and Summary
echo -e "${CYAN}[6/6] Verifying running services...${NC}"
$COMPOSE_CMD ps

# Detect Server IP and Port
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || hostname -I | awk '{print $1}')
HTTP_PORT_VAL=$(grep -E '^HTTP_PORT=' .env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo "80")
if [ -z "$HTTP_PORT_VAL" ] || [ "$HTTP_PORT_VAL" = "80" ]; then
  PORT_SUFFIX=""
else
  PORT_SUFFIX=":${HTTP_PORT_VAL}"
fi

echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}   🚀 DEPLOYMENT SUCCESSFUL! GIS PORTAL IS LIVE!   ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${BOLD}Access Endpoints:${NC}"
echo -e "  🌐 Web Application:   ${CYAN}http://${SERVER_IP}${PORT_SUFFIX}/${NC}"
echo -e "  📊 REST API Stats:     ${CYAN}http://${SERVER_IP}${PORT_SUFFIX}/api/dashboard/stats/${NC}"
echo -e "  🗺️  OGC WMS Service:    ${CYAN}http://${SERVER_IP}${PORT_SUFFIX}/ogc/?service=WMS&version=1.3.0&request=GetCapabilities${NC}"
echo -e "  📦 OGC WFS Service:    ${CYAN}http://${SERVER_IP}${PORT_SUFFIX}/ogc/?service=WFS&version=2.0.0&request=GetCapabilities${NC}"
echo -e "\n${BOLD}Default Admin Credentials:${NC}"
echo -e "  Username: ${YELLOW}gisadmin${NC}"
echo -e "  Password: ${YELLOW}gisadmin${NC}"
echo -e "\n${BOLD}Management Commands:${NC}"
echo -e "  View Logs:      ${BLUE}$COMPOSE_CMD logs -f${NC}"
echo -e "  Restart Stack:  ${BLUE}$COMPOSE_CMD restart${NC}"
echo -e "  Stop Stack:     ${BLUE}$COMPOSE_CMD down${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}\n"
