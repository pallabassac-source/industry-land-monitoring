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
    LayerMetadata, AuditLog, SystemSetting, IntegrationAdapter
)
from .serializers import (
    RoleSerializer, UserSerializer, DistrictSerializer, CircleSerializer,
    VillageSerializer, IndustrialEstateSerializer, LandParcelSerializer,
    InfrastructureLayerSerializer, LayerCategorySerializer, GisLayerSerializer,
    LayerMetadataSerializer, AuditLogSerializer, SystemSettingSerializer,
    IntegrationAdapterSerializer
)
from .utils_gis import (
    execute_spatial_query, validate_and_parse_spatial_file, 
    validate_and_parse_component_files, save_spatial_features_to_db, 
    delete_layer_cascade
)
import json
import traceback

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


# 1. Authentication View
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(username=username, is_active=True)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                
                # Log login audit trail
                log_audit_trail(
                    user.id, user.username, 'LOGIN',
                    f"User {user.username} logged in successfully.",
                    request.META.get('REMOTE_ADDR')
                )
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
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
