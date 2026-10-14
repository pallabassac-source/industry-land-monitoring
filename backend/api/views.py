from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import connection
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Role, User, District, Circle, Village, IndustrialEstate,
    LandParcel, InfrastructureLayer, LayerCategory, GisLayer,
    LayerMetadata, AuditLog, SystemSetting, IntegrationAdapter,
    DroneSurveyLayer
)
from .serializers import (
    RoleSerializer, UserSerializer, DistrictSerializer, CircleSerializer,
    VillageSerializer, IndustrialEstateSerializer, LandParcelSerializer,
    InfrastructureLayerSerializer, LayerCategorySerializer, GisLayerSerializer,
    LayerMetadataSerializer, AuditLogSerializer, SystemSettingSerializer,
    IntegrationAdapterSerializer, DroneSurveyLayerSerializer
)
from .utils_gis import (
    execute_spatial_query, validate_and_parse_spatial_file, 
    validate_and_parse_component_files, save_spatial_features_to_db, 
    delete_layer_cascade, auto_repair_projected_geometries
)
from .tasks import dispatch_drone_tiling_job
from .utils_drone import get_geotiff_metadata
import json
import traceback

from .chunked_upload import (
    validate_upload_params, save_incoming_chunk, 
    get_session_status, assemble_session_chunks,
    sanitize_filename
)
from rest_framework.exceptions import ValidationError
import time
import os
import shutil

# In-memory brute force lockout tracking (OWASP A07 & A09)
_FAILED_LOGINS = {}
MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes lockout

def is_login_rate_limited(identifier: str) -> bool:
    if not identifier:
        return False
    now = time.time()
    attempts = _FAILED_LOGINS.get(identifier, [])
    recent_attempts = [t for t in attempts if now - t < LOCKOUT_DURATION_SECONDS]
    _FAILED_LOGINS[identifier] = recent_attempts
    return len(recent_attempts) >= MAX_FAILED_LOGIN_ATTEMPTS

def record_failed_login(identifier: str):
    if not identifier:
        return
    now = time.time()
    attempts = _FAILED_LOGINS.get(identifier, [])
    attempts.append(now)
    _FAILED_LOGINS[identifier] = attempts

def clear_failed_login(identifier: str):
    if identifier and identifier in _FAILED_LOGINS:
        _FAILED_LOGINS.pop(identifier, None)

def log_audit_trail(user_id, username, action_type, details, client_ip='127.0.0.1', old_val=None, new_val=None):
    """
    Creates an immutable audit log entry.
    """
    try:
        AuditLog.objects.create(
            user_id=user_id,
            username=username,
            action_type=action_type,
            client_ip=client_ip,
            action_details=details,
            old_value=old_val,
            new_value=new_val
        )
    except Exception:
        pass


# 1. Authentication View with Brute-Force Protection (OWASP A07)
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        client_ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        username = str(request.data.get('username', '')).strip()
        password = request.data.get('password')
        
        # Check rate limiting / brute force lockout
        if is_login_rate_limited(client_ip) or is_login_rate_limited(username):
            log_audit_trail(
                None, username or 'unknown', 'LOGIN_LOCKED',
                f"Brute-force protection: IP {client_ip} / account {username} locked for 15 minutes.",
                client_ip
            )
            return Response(
                {'error': 'Too many failed login attempts. Account temporarily locked for 15 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            user = User.objects.get(username=username, is_active=True)
            if user.check_password(password):
                clear_failed_login(client_ip)
                clear_failed_login(username)
                refresh = RefreshToken.for_user(user)
                
                # Log login audit trail (OWASP A09)
                log_audit_trail(
                    user.id, user.username, 'LOGIN',
                    f"User {user.username} logged in successfully.",
                    client_ip
                )
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            else:
                record_failed_login(client_ip)
                record_failed_login(username)
                log_audit_trail(
                    user.id, user.username, 'LOGIN_FAILED',
                    f"Failed login attempt (invalid credentials) for user {username}.",
                    client_ip
                )
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            record_failed_login(client_ip)
            record_failed_login(username)
            log_audit_trail(
                None, username or 'unknown', 'LOGIN_FAILED',
                f"Failed login attempt (user not found: {username}).",
                client_ip
            )
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# 2. System Dashboard Stats
class DashboardStatsView(APIView):
    permission_classes = [permissions.AllowAny] # Allow loading initial stats

    def get(self, request):
        try:
            total_estates = IndustrialEstate.objects.count()
            total_parcels = LandParcel.objects.count()
            
            # Sum areas
            with connection.cursor() as cursor:
                cursor.execute("SELECT COALESCE(SUM(area_acres), 0) FROM land_parcels WHERE availability_status = 'Vacan'")
                available_acres = float(cursor.fetchone()[0])
                
                cursor.execute("SELECT COALESCE(SUM(area_acres), 0) FROM land_parcels WHERE availability_status = 'Occupied'")
                occupied_acres = float(cursor.fetchone()[0])

                cursor.execute("SELECT availability_status, COUNT(*), COALESCE(SUM(area_acres), 0) FROM land_parcels GROUP BY availability_status")
                status_rows = cursor.fetchall()
                status_breakdown = {row[0]: {'count': row[1], 'area': float(row[2])} for row in status_rows}

                cursor.execute("SELECT land_classification, COUNT(*) FROM land_parcels GROUP BY land_classification")
                classification_rows = cursor.fetchall()
                classifications = {row[0]: row[1] for row in classification_rows}

            recent_activities = AuditLog.objects.order_by('-created_at')[:10]
            
            return Response({
                'total_estates': total_estates,
                'total_parcels': total_parcels,
                'available_land_acres': available_acres,
                'occupied_land_acres': occupied_acres,
                'status_breakdown': status_breakdown,
                'layer_count': GisLayer.objects.count(),
                'classifications': classifications,
                'recent_activities': AuditLogSerializer(recent_activities, many=True).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 3. Industrial Land Inventory (Parcels) CRUD
class LandParcelListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            auto_repair_projected_geometries()
        except Exception:
            pass
        estate_id = request.query_params.get('estate_id')
        status_filter = request.query_params.get('status')
        parcels = LandParcel.objects.all()
        if estate_id:
            parcels = parcels.filter(estate_id=estate_id)
        if status_filter:
            parcels = parcels.filter(availability_status=status_filter)
        
        serializer = LandParcelSerializer(parcels, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LandParcelSerializer(data=request.data)
        if serializer.is_valid():
            parcel = serializer.save()
            log_audit_trail(
                request.user.id if hasattr(request, 'user') else None,
                request.user.username if hasattr(request, 'user') else 'system',
                'CREATE_PARCEL',
                f"Created land parcel {parcel.parcel_id}.",
                request.META.get('REMOTE_ADDR'),
                new_val=serializer.data
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LandParcelDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        parcel = get_object_or_404(LandParcel, pk=pk)
        return Response(LandParcelSerializer(parcel).data)

    def put(self, request, pk):
        parcel = get_object_or_404(LandParcel, pk=pk)
        old_val = LandParcelSerializer(parcel).data
        serializer = LandParcelSerializer(parcel, data=request.data, partial=True)
        if serializer.is_valid():
            updated_parcel = serializer.save()
            log_audit_trail(
                request.user.id if hasattr(request, 'user') else None,
                request.user.username if hasattr(request, 'user') else 'system',
                'UPDATE_PARCEL',
                f"Updated land parcel {updated_parcel.parcel_id}.",
                request.META.get('REMOTE_ADDR'),
                old_val=old_val,
                new_val=serializer.data
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        parcel = get_object_or_404(LandParcel, pk=pk)
        old_val = LandParcelSerializer(parcel).data
        parcel.delete()
        log_audit_trail(
            request.user.id if hasattr(request, 'user') else None,
            request.user.username if hasattr(request, 'user') else 'system',
            'DELETE_PARCEL',
            f"Deleted land parcel ID {pk}.",
            request.META.get('REMOTE_ADDR'),
            old_val=old_val
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# 4. Estate Management API
class IndustrialEstateListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            auto_repair_projected_geometries()
        except Exception:
            pass
        estates = IndustrialEstate.objects.all()
        return Response(IndustrialEstateSerializer(estates, many=True).data)

    def post(self, request):
        serializer = IndustrialEstateSerializer(data=request.data)
        if serializer.is_valid():
            estate = serializer.save()
            log_audit_trail(
                request.user.id if hasattr(request, 'user') else None,
                request.user.username if hasattr(request, 'user') else 'system',
                'CREATE_ESTATE',
                f"Created Industrial Estate: {estate.name}",
                request.META.get('REMOTE_ADDR'),
                new_val=serializer.data
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 5. Administrative Boundaries
class AdministrativeBoundaryListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        boundary_type = request.query_params.get('type', 'district')
        if boundary_type == 'district':
            districts = District.objects.all()
            return Response(DistrictSerializer(districts, many=True).data)
        elif boundary_type == 'circle':
            circles = Circle.objects.all()
            return Response(CircleSerializer(circles, many=True).data)
        elif boundary_type == 'village':
            villages = Village.objects.all()
            return Response(VillageSerializer(villages, many=True).data)
        return Response({'error': 'Invalid boundary type'}, status=status.HTTP_400_BAD_REQUEST)


# 6. Infrastructure GIS Layers
class InfrastructureLayerListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        infra = InfrastructureLayer.objects.all()
        return Response(InfrastructureLayerSerializer(infra, many=True).data)


# 7. Spatial Query Engine
class SpatialQueryView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        query_type = request.data.get('query_type') # buffer, intersects, within, nearest, distance
        layer_name = request.data.get('layer_name') # parcels, estates, infrastructure
        geom_wkt = request.data.get('geom_wkt')
        distance_meters = request.data.get('distance_meters')
        attribute_filters = request.data.get('attribute_filters', {})

        try:
            results = execute_spatial_query(
                query_type, layer_name, geom_wkt, distance_meters, attribute_filters
            )
            
            # Log spatial query event
            log_audit_trail(
                request.user.id if hasattr(request, 'user') else None,
                request.user.username if hasattr(request, 'user') else 'system',
                'SPATIAL_QUERY',
                f"Ran spatial {query_type} query on layer {layer_name}.",
                request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                'count': len(results),
                'features': results
            })
        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 8. GIS Ingestion Upload Parser Engine
class GisUploadView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        layer_name = request.data.get('layer_name', 'Imported_Layer')
        file_shp = request.FILES.get('file_shp')
        
        if file_shp:
            files_dict = {
                'shp': file_shp.read(),
                'dbf': request.FILES.get('file_dbf').read() if request.FILES.get('file_dbf') else None,
                'shx': request.FILES.get('file_shx').read() if request.FILES.get('file_shx') else None,
                'prj': request.FILES.get('file_prj').read() if request.FILES.get('file_prj') else None,
            }
            report = validate_and_parse_component_files(files_dict, layer_name)
            file_name = file_shp.name
        else:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
            file_name = uploaded_file.name
            file_bytes = uploaded_file.read()
            report = validate_and_parse_spatial_file(file_name, file_bytes)

        if report['is_valid']:
            layer_id = save_spatial_features_to_db(layer_name, report)
            report['layer_id'] = layer_id
            log_audit_trail(
                request.user.id if hasattr(request, 'user') else None,
                request.user.username if hasattr(request, 'user') else 'system',
                'UPLOAD_GIS',
                f"Successfully parsed and published GIS layer: {layer_name} from file {file_name}.",
                request.META.get('REMOTE_ADDR')
            )
            return Response(report, status=status.HTTP_200_OK)
        else:
            return Response(report, status=status.HTTP_400_BAD_REQUEST)


# 9. Layer Management Catalog
class LayerCatalogView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        layers = GisLayer.objects.all().order_by('display_order')
        return Response(GisLayerSerializer(layers, many=True).data)

    def put(self, request, pk=None):
        if not pk:
            return Response({'error': 'Layer ID required'}, status=status.HTTP_400_BAD_REQUEST)
        layer = get_object_or_404(GisLayer, pk=pk)
        old_val = GisLayerSerializer(layer).data
        serializer = GisLayerSerializer(layer, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            log_audit_trail(
                request.user.id if hasattr(request, 'user') else None,
                request.user.username if hasattr(request, 'user') else 'system',
                'MODIFY_LAYER',
                f"Modified GIS Catalog Layer: {updated.display_name}",
                request.META.get('REMOTE_ADDR'),
                old_val=old_val,
                new_val=serializer.data
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if not pk:
            return Response({'error': 'Layer ID required'}, status=status.HTTP_400_BAD_REQUEST)
        success, layer_name = delete_layer_cascade(pk)
        if not success:
            return Response({'error': layer_name}, status=status.HTTP_404_NOT_FOUND)
            
        log_audit_trail(
            request.user.id if hasattr(request, 'user') else None,
            request.user.username if hasattr(request, 'user') else 'system',
            'DELETE_LAYER',
            f"Cascadingly deleted GIS Catalog Layer ID {pk} ({layer_name}) along with associated PostGIS estates and parcels.",
            request.META.get('REMOTE_ADDR')
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# 10. Metadata Management Catalog
class LayerMetadataView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, layer_id):
        metadata = get_object_or_404(LayerMetadata, layer_id=layer_id)
        return Response(LayerMetadataSerializer(metadata).data)

    def put(self, request, layer_id):
        metadata = get_object_or_404(LayerMetadata, layer_id=layer_id)
        serializer = LayerMetadataSerializer(metadata, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 11. Unified Global Search Autocomplete
class GlobalSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])

        results = []

        # Search in land_parcels by parcel_id, plot_number, survey_number, availability_status, land_classification
        parcels = (
            LandParcel.objects.filter(parcel_id__icontains=q) |
            LandParcel.objects.filter(plot_number__icontains=q) |
            LandParcel.objects.filter(survey_number__icontains=q) |
            LandParcel.objects.filter(availability_status__icontains=q) |
            LandParcel.objects.filter(land_classification__icontains=q) |
            LandParcel.objects.filter(ownership_details__icontains=q)
        ).distinct()
        
        for p in parcels[:10]:
            results.append({
                'id': p.id,
                'title': f"{p.parcel_id} - Plot {p.plot_number}",
                'type': 'Parcel',
                'status': p.availability_status,
                'details': f"Area: {p.area_acres} Acres | Status: {p.availability_status} | Survey: {p.survey_number or 'N/A'}",
                'geom': p.geom,
                'parcel_id': p.parcel_id,
                'plot_number': p.plot_number,
                'survey_number': p.survey_number,
                'area_acres': str(p.area_acres),
                'land_classification': p.land_classification,
                'ownership_details': p.ownership_details
            })

        # Search in industrial_estates
        estates = IndustrialEstate.objects.filter(name__icontains=q)
        for es in estates[:5]:
            results.append({
                'id': es.id,
                'title': es.name,
                'type': 'Industrial Estate',
                'status': 'Estate',
                'details': f"Total: {es.total_area_acres} Acres | Vacan: {es.available_area_acres} Acres",
                'geom': es.geom
            })

        # Search in administrative boundary districts
        districts = District.objects.filter(name__icontains=q)
        for d in districts[:5]:
            results.append({
                'id': d.id,
                'title': f"{d.name} District",
                'type': 'District Boundary',
                'status': 'District',
                'details': f"District Code: {d.code}",
                'geom': d.geom
            })

        return Response(results)


# 12. Audit Logs API
class AuditLogsListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        action_type = request.query_params.get('action')
        logs = AuditLog.objects.all().order_by('-created_at')
        if action_type:
            logs = logs.filter(action_type=action_type)
        return Response(AuditLogSerializer(logs[:100], many=True).data)


# 13. System Settings
class SystemSettingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings = SystemSetting.objects.all()
        return Response(SystemSettingSerializer(settings, many=True).data)

    def put(self, request):
        for k, v in request.data.items():
            setting = SystemSetting.objects.filter(setting_key=k).first()
            if setting:
                setting.setting_value = str(v)
                setting.save()
        return Response({'message': 'Settings updated successfully'})


# 14. Integration framework adapter stub
class ExternalSyncTriggerView(APIView):
    def post(self, request):
        adapter_name = request.data.get('adapter_name', 'DPIIT')
        adapter = get_object_or_404(IntegrationAdapter, system_name__icontains=adapter_name)
        
        # Simulate synchronization framework and external adapter trigger
        adapter.last_sync_status = 'Success'
        adapter.last_sync_at = timezone.now()
        adapter.save()
        
        log_audit_trail(
            request.user.id if hasattr(request, 'user') else None,
            request.user.username if hasattr(request, 'user') else 'system',
            'SYNC_EXTERNAL',
            f"Triggered external OGC data exchange sync adapter: {adapter.system_name}.",
            request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            'status': 'Completed',
            'system': adapter.system_name,
            'features_processed': 15,
            'details': 'OGC Web services synchronization and adapters executed successfully.'
        })


def ensure_drone_table_exists():
    """
    Guarantees drone_survey_layers table exists in PostGIS even if migrations weren't run.
    """
    try:
        with connection.cursor() as cursor:
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
                CREATE INDEX IF NOT EXISTS idx_drone_surveys_estate ON drone_survey_layers(estate_id);
            """)
    except Exception as e:
        pass


# 15. Drone Survey Multi-Resolution Layers & Ingestion Views
class DroneSurveyLayerListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ensure_drone_table_exists()
        try:
            estate_id = request.query_params.get('estate_id')
            queryset = DroneSurveyLayer.objects.all()
            if estate_id:
                queryset = queryset.filter(estate_id=estate_id)
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            serializer = DroneSurveyLayerSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response([], status=status.HTTP_200_OK)


class DroneSurveyUploadView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ensure_drone_table_exists()
        try:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response({'error': 'No GeoTIFF file provided in the upload request'}, status=status.HTTP_400_BAD_REQUEST)

            file_name = uploaded_file.name
            ext = file_name.split('.')[-1].lower()
            if ext not in ['tif', 'tiff', 'geotiff']:
                return Response({'error': 'Only .tif, .tiff, or .geotiff formats are supported for drone imagery'}, status=status.HTTP_400_BAD_REQUEST)

            estate_id = request.data.get('estate_id')
            title = request.data.get('title')
            survey_date = request.data.get('survey_date') or timezone.now().date().isoformat()

            estate = None
            estate_name = None
            if estate_id and str(estate_id).strip() not in ['', 'null', 'undefined']:
                try:
                    estate = IndustrialEstate.objects.get(id=int(estate_id))
                    estate_name = estate.name
                except Exception:
                    pass

            if not title:
                base_name = file_name.rsplit('.', 1)[0].replace('_', ' ')
                title = f"{estate_name or base_name} Drone Survey"

            # 1. Save uploaded file to temp disk
            from django.conf import settings
            import os
            media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'mediafiles'))
            temp_dir = os.path.join(media_root, 'temp_uploads')
            os.makedirs(temp_dir, exist_ok=True)
            temp_tif_path = os.path.join(temp_dir, f"upload_{timezone.now().strftime('%Y%m%d_%H%M%S')}_{file_name}")

            with open(temp_tif_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # 2. Extract initial metadata
            meta = get_geotiff_metadata(temp_tif_path)

            # 3. Create DroneSurveyLayer record in PENDING / PROCESSING state
            drone_layer = DroneSurveyLayer.objects.create(
                estate=estate,
                estate_name=estate_name,
                title=title,
                survey_date=survey_date,
                tile_directory='',
                tile_url_pattern='',
                min_zoom=14,
                max_zoom=20,
                bounds=meta.get('bounds') or [91.70, 26.10, 91.85, 26.25],
                footprint_geojson=meta.get('footprint_geojson') or {},
                raw_file_size_mb=meta.get('file_size_mb') or 0.0,
                resolution_cm_per_px=meta.get('resolution_cm') or 5.0,
                status='PROCESSING'
            )

            # 4. Dispatch tiling worker (Celery or background thread)
            dispatch_method = dispatch_drone_tiling_job(
                layer_id=drone_layer.id,
                tif_path=temp_tif_path,
                delete_source=True
            )

            log_audit_trail(
                request.user.id if hasattr(request, 'user') else None,
                request.user.username if hasattr(request, 'user') else 'system',
                'UPLOAD_DRONE_TIFF',
                f"Queued drone GeoTIFF processing for '{title}' (file size: {drone_layer.raw_file_size_mb} MB) via {dispatch_method}.",
                request.META.get('REMOTE_ADDR')
            )

            return Response({
                'message': 'Drone GeoTIFF received and multi-resolution tile processing started.',
                'layer_id': drone_layer.id,
                'title': drone_layer.title,
                'status': drone_layer.status,
                'bounds': drone_layer.bounds,
                'dispatch_method': dispatch_method
            }, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            trace = traceback.format_exc()
            print(f"Drone upload error: {trace}")
            return Response({
                'error': f"Server error processing upload: {str(e)}",
                'details': trace
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DroneSurveyLayerDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        ensure_drone_table_exists()
        layer = get_object_or_404(DroneSurveyLayer, pk=pk)
        return Response(DroneSurveyLayerSerializer(layer).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        ensure_drone_table_exists()
        layer = get_object_or_404(DroneSurveyLayer, pk=pk)
        for field in ['title', 'survey_date', 'is_active', 'min_zoom', 'max_zoom', 'estate_id']:
            if field in request.data:
                setattr(layer, field, request.data[field])
        layer.save()
        return Response(DroneSurveyLayerSerializer(layer).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        ensure_drone_table_exists()
        layer = get_object_or_404(DroneSurveyLayer, pk=pk)
        
        # Remove tiles from disk if directory exists
        from django.conf import settings
        import os
        import shutil
        if layer.tile_directory:
            media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'mediafiles'))
            abs_tile_dir = os.path.join(media_root, layer.tile_directory)
            if os.path.exists(abs_tile_dir):
                try:
                    shutil.rmtree(abs_tile_dir)
                except Exception:
                    pass

        layer_title = layer.title
        layer.delete()

        log_audit_trail(
            request.user.id if hasattr(request, 'user') else None,
            request.user.username if hasattr(request, 'user') else 'system',
            'DELETE_DRONE_LAYER',
            f"Deleted drone survey layer: {layer_title}.",
            request.META.get('REMOTE_ADDR')
        )

        return Response({'message': f"Drone survey layer '{layer_title}' deleted successfully."}, status=status.HTTP_200_OK)


# 16. Chunked Upload REST Services (WAF-Friendly & Anti-DDoS Protected)
class ChunkUploadView(APIView):
    """
    Receives an individual sliced binary chunk (e.g. 10MB - 40MB).
    Validates chunk size, bounds, UUID, and saves to staging directory.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        upload_id = request.data.get('upload_id')
        chunk_index_raw = request.data.get('chunk_index')
        total_chunks_raw = request.data.get('total_chunks')
        file_name = request.data.get('file_name')
        file_type = request.data.get('file_type', 'drone')
        chunk_file = request.FILES.get('chunk')

        if not chunk_file:
            return Response({'error': 'No chunk payload provided in request.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chunk_index = int(chunk_index_raw)
            total_chunks = int(total_chunks_raw)
        except (ValueError, TypeError):
            return Response({'error': 'chunk_index and total_chunks must be valid integers.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            safe_name, f_type = validate_upload_params(
                upload_id=upload_id,
                chunk_index=chunk_index,
                total_chunks=total_chunks,
                file_name=file_name,
                file_type=file_type,
                chunk_file=chunk_file
            )
            save_incoming_chunk(upload_id, chunk_index, chunk_file)

            return Response({
                'status': 'chunk_received',
                'upload_id': upload_id,
                'chunk_index': chunk_index,
                'total_chunks': total_chunks,
                'file_name': safe_name
            }, status=status.HTTP_200_OK)

        except ValidationError as ve:
            return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            trace = traceback.format_exc()
            print(f"Chunk upload error: {trace}")
            return Response({'error': f"Failed to store chunk: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChunkStatusView(APIView):
    """
    Returns received and missing chunks for an active upload_id.
    Enables instant client-side resume after connection drops or WAF rate-limit timeouts.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        upload_id = request.query_params.get('upload_id')
        total_chunks_raw = request.query_params.get('total_chunks')
        if not upload_id:
            return Response({'error': 'upload_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        total_chunks = None
        if total_chunks_raw:
            try:
                total_chunks = int(total_chunks_raw)
            except ValueError:
                pass

        session_status = get_session_status(upload_id, total_chunks)
        return Response(session_status, status=status.HTTP_200_OK)


class ChunkCompleteView(APIView):
    """
    Assembles all received chunks into the final dataset, validates integrity,
    and dispatches the appropriate pipeline (GeoTIFF LOD tiling or Vector DB ingestion).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        upload_id = request.data.get('upload_id')
        file_name = request.data.get('file_name')
        file_type = request.data.get('file_type', 'drone')
        total_chunks_raw = request.data.get('total_chunks')

        try:
            total_chunks = int(total_chunks_raw)
        except (ValueError, TypeError):
            return Response({'error': 'total_chunks must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            safe_name, f_type = validate_upload_params(
                upload_id=upload_id,
                chunk_index=0,
                total_chunks=total_chunks,
                file_name=file_name,
                file_type=file_type
            )

            # Assemble chunks into target file
            assembled_path = assemble_session_chunks(upload_id, safe_name, f_type, total_chunks)

            # PIPELINE 1: DRONE GEOTIFF
            if f_type == 'drone':
                ensure_drone_table_exists()
                estate_id = request.data.get('estate_id')
                title = request.data.get('title')
                survey_date = request.data.get('survey_date') or timezone.now().date().isoformat()

                estate = None
                estate_name = None
                if estate_id and str(estate_id).strip() not in ['', 'null', 'undefined']:
                    try:
                        estate = IndustrialEstate.objects.get(id=int(estate_id))
                        estate_name = estate.name
                    except Exception:
                        pass

                if not title:
                    base_name = safe_name.rsplit('.', 1)[0].replace('_', ' ')
                    title = f"{estate_name or base_name} Drone Survey"

                meta = get_geotiff_metadata(assembled_path)
                drone_layer = DroneSurveyLayer.objects.create(
                    estate=estate,
                    estate_name=estate_name,
                    title=title,
                    survey_date=survey_date,
                    tile_directory='',
                    tile_url_pattern='',
                    min_zoom=14,
                    max_zoom=20,
                    bounds=meta.get('bounds') or [91.70, 26.10, 91.85, 26.25],
                    footprint_geojson=meta.get('footprint_geojson') or {},
                    raw_file_size_mb=meta.get('file_size_mb') or 0.0,
                    resolution_cm_per_px=meta.get('resolution_cm') or 5.0,
                    status='PROCESSING'
                )

                dispatch_method = dispatch_drone_tiling_job(
                    layer_id=drone_layer.id,
                    tif_path=assembled_path,
                    delete_source=True
                )

                log_audit_trail(
                    request.user.id if hasattr(request, 'user') else None,
                    request.user.username if hasattr(request, 'user') else 'system',
                    'UPLOAD_DRONE_TIFF_CHUNKED',
                    f"Successfully assembled and queued chunked drone survey '{title}' ({drone_layer.raw_file_size_mb} MB) via {dispatch_method}.",
                    request.META.get('REMOTE_ADDR')
                )

                return Response({
                    'message': 'Drone GeoTIFF chunks assembled successfully and tiling worker dispatched.',
                    'layer_id': drone_layer.id,
                    'title': drone_layer.title,
                    'status': drone_layer.status,
                    'bounds': drone_layer.bounds,
                    'dispatch_method': dispatch_method
                }, status=status.HTTP_202_ACCEPTED)

            # PIPELINE 2: VECTOR SHAPEFILE / GEOJSON
            elif f_type == 'vector':
                layer_name = request.data.get('layer_name') or safe_name.rsplit('.', 1)[0]
                with open(assembled_path, 'rb') as f:
                    file_bytes = f.read()

                # Clean up assembled temp file
                try:
                    os.remove(assembled_path)
                except Exception:
                    pass

                report = validate_and_parse_spatial_file(safe_name, file_bytes)
                if report.get('is_valid'):
                    layer_id = save_spatial_features_to_db(layer_name, report)
                    report['layer_id'] = layer_id
                    log_audit_trail(
                        request.user.id if hasattr(request, 'user') else None,
                        request.user.username if hasattr(request, 'user') else 'system',
                        'UPLOAD_GIS_CHUNKED',
                        f"Successfully parsed and published GIS layer: {layer_name} from chunked upload {safe_name}.",
                        request.META.get('REMOTE_ADDR')
                    )
                    return Response(report, status=status.HTTP_200_OK)
                else:
                    return Response(report, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as ve:
            return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            trace = traceback.format_exc()
            print(f"Chunk completion error: {trace}")
            return Response({
                'error': f"Failed to assemble file: {str(e)}",
                'details': trace
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



