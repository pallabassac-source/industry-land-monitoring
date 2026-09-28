from rest_framework import serializers
from .models import (
    Role, User, District, Circle, Village, IndustrialEstate,
    LandParcel, InfrastructureLayer, LayerCategory, GisLayer,
    LayerMetadata, AuditLog, SystemSetting, IntegrationAdapter
)
import json

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'role', 'role_name', 'is_active', 'created_at']
        extra_kwargs = {'password': {'write_only': True}}


class BaseGeoSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if hasattr(instance, 'geom') and instance.geom:
            try:
                from django.contrib.gis.geos import GEOSGeometry
                g = GEOSGeometry(instance.geom)
                ret['geom'] = g.geojson
            except Exception:
                pass
        return ret


class DistrictSerializer(BaseGeoSerializer):
    class Meta:
        model = District
        fields = '__all__'


class CircleSerializer(BaseGeoSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = Circle
        fields = '__all__'


class VillageSerializer(BaseGeoSerializer):
    circle_name = serializers.CharField(source='circle.name', read_only=True)

    class Meta:
        model = Village
        fields = '__all__'


class IndustrialEstateSerializer(BaseGeoSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = IndustrialEstate
        fields = '__all__'


class LandParcelSerializer(BaseGeoSerializer):
    estate_name = serializers.CharField(source='estate.name', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True)

    class Meta:
        model = LandParcel
        fields = '__all__'


class InfrastructureLayerSerializer(BaseGeoSerializer):
    class Meta:
        model = InfrastructureLayer
        fields = '__all__'


class LayerCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LayerCategory
        fields = '__all__'


class GisLayerSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = GisLayer
        fields = '__all__'


class LayerMetadataSerializer(serializers.ModelSerializer):
    layer_name = serializers.CharField(source='layer.display_name', read_only=True)

    class Meta:
        model = LayerMetadata
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = '__all__'


class IntegrationAdapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationAdapter
        fields = '__all__'
