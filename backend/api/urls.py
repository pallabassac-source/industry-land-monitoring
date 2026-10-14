from django.urls import path
from .views import (
    LoginView, DashboardStatsView, LandParcelListView, LandParcelDetailView,
    IndustrialEstateListView, AdministrativeBoundaryListView, InfrastructureLayerListView,
    SpatialQueryView, GisUploadView, LayerCatalogView, LayerMetadataView,
    GlobalSearchView, AuditLogsListView, SystemSettingsView, ExternalSyncTriggerView,
    DroneSurveyLayerListView, DroneSurveyUploadView, DroneSurveyLayerDetailView,
    ChunkUploadView, ChunkStatusView, ChunkCompleteView
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='api-dashboard-stats'),
    
    # Inventory
    path('parcels/', LandParcelListView.as_view(), name='api-parcels-list'),
    path('parcels/<int:pk>/', LandParcelDetailView.as_view(), name='api-parcel-detail'),
    path('estates/', IndustrialEstateListView.as_view(), name='api-estates-list'),
    
    # Boundaries & Infra
    path('boundaries/', AdministrativeBoundaryListView.as_view(), name='api-boundaries-list'),
    path('infrastructure/', InfrastructureLayerListView.as_view(), name='api-infra-list'),
    
    # GIS Operations
    path('gis/query/', SpatialQueryView.as_view(), name='api-spatial-query'),
    path('gis/upload/', GisUploadView.as_view(), name='api-gis-upload'),
    path('gis/layers/', LayerCatalogView.as_view(), name='api-layer-catalog'),
    path('gis/layers/<int:pk>/', LayerCatalogView.as_view(), name='api-layer-modify'),
    path('gis/metadata/<int:layer_id>/', LayerMetadataView.as_view(), name='api-layer-metadata'),
    
    # High-Resolution Drone Survey Imagery
    path('drone-layers/', DroneSurveyLayerListView.as_view(), name='api-drone-layers-list'),
    path('drone-layers/<int:pk>/', DroneSurveyLayerDetailView.as_view(), name='api-drone-layer-detail'),
    path('upload/drone-imagery/', DroneSurveyUploadView.as_view(), name='api-upload-drone-imagery'),

    # Resumable, WAF-Friendly Chunked Ingestion (Anti-DDoS & OWASP Top 10 Hardened)
    path('upload/chunk/', ChunkUploadView.as_view(), name='api-upload-chunk'),
    path('upload/chunk-status/', ChunkStatusView.as_view(), name='api-upload-chunk-status'),
    path('upload/chunk-complete/', ChunkCompleteView.as_view(), name='api-upload-chunk-complete'),

    # Utilities
    path('search/', GlobalSearchView.as_view(), name='api-global-search'),
    path('audit-logs/', AuditLogsListView.as_view(), name='api-audit-logs'),
    path('settings/', SystemSettingsView.as_view(), name='api-settings'),
    path('sync/', ExternalSyncTriggerView.as_view(), name='api-sync-external'),
]

