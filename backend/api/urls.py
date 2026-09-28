from django.urls import path
from .views import (
    LoginView, DashboardStatsView, LandParcelListView, LandParcelDetailView,
    IndustrialEstateListView, AdministrativeBoundaryListView, InfrastructureLayerListView,
    SpatialQueryView, GisUploadView, LayerCatalogView, LayerMetadataView,
    GlobalSearchView, AuditLogsListView, SystemSettingsView, ExternalSyncTriggerView
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
    
    # Utilities
    path('search/', GlobalSearchView.as_view(), name='api-global-search'),
    path('audit-logs/', AuditLogsListView.as_view(), name='api-audit-logs'),
    path('settings/', SystemSettingsView.as_view(), name='api-settings'),
    path('sync/', ExternalSyncTriggerView.as_view(), name='api-sync-external'),
]
