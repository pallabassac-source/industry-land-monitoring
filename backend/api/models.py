from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import json

class SafeJSONField(models.JSONField):
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        if isinstance(value, (dict, list)):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value, cls=self.decoder)
            except Exception:
                return value
        return value

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.name


class User(models.Model):
    username = models.CharField(max_length=50, unique=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        # Allow checking against plain string or Django standard hash
        if self.password_hash.startswith('pbkdf2_') or self.password_hash.startswith('bcrypt'):
            return check_password(raw_password, self.password_hash)
        return self.password_hash == raw_password


class District(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    # Storing geometry as a text string (GeoJSON or WKT) or database representation
    geom = models.TextField() 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'districts'


class Circle(models.Model):
    district = models.ForeignKey(District, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True, null=True)
    geom = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'circles'
        unique_together = ('district', 'name')


class Village(models.Model):
    circle = models.ForeignKey(Circle, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True, null=True)
    geom = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'villages'
        unique_together = ('circle', 'name')


class IndustrialEstate(models.Model):
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=150, unique=True)
    total_area_acres = models.DecimalField(max_length=10, max_digits=10, decimal_places=2)
    allocated_area_acres = models.DecimalField(max_length=10, max_digits=10, decimal_places=2, default=0.00)
    available_area_acres = models.DecimalField(max_length=10, max_digits=10, decimal_places=2, default=0.00)
    power_capacity_mw = models.DecimalField(max_length=6, max_digits=6, decimal_places=2, default=0.00)
    water_capacity_mld = models.DecimalField(max_length=6, max_digits=6, decimal_places=2, default=0.00)
    gas_pipeline_available = models.BooleanField(default=False)
    drainage_available = models.BooleanField(default=False)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    geom = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'industrial_estates'


class LandParcel(models.Model):
    estate = models.ForeignKey(IndustrialEstate, on_delete=models.CASCADE)
    parcel_id = models.CharField(max_length=50, unique=True)
    plot_number = models.CharField(max_length=50)
    survey_number = models.CharField(max_length=50, blank=True, null=True)
    village = models.ForeignKey(Village, on_delete=models.SET_NULL, null=True)
    area_acres = models.DecimalField(max_length=10, max_digits=10, decimal_places=2)
    availability_status = models.CharField(max_length=50, default='Vacan')
    land_classification = models.CharField(max_length=100, default='General')
    ownership_details = models.CharField(max_length=255, default='Government Land Bank')
    infrastructure_details = SafeJSONField(default=dict)
    photo_urls = SafeJSONField(default=list) # Array of URLs
    geom = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'land_parcels'


class InfrastructureLayer(models.Model):
    name = models.CharField(max_length=100)
    infra_type = models.CharField(max_length=50) # Road, PowerLine, GasPipeline, etc.
    attributes = SafeJSONField(default=dict)
    geom = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'infrastructure_layers'


class LayerCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'layer_categories'


class GisLayer(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=150)
    category = models.ForeignKey(LayerCategory, on_delete=models.CASCADE)
    layer_type = models.CharField(max_length=20, default='Vector')
    source_type = models.CharField(max_length=20, default='PostGIS')
    is_published = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    style_config = SafeJSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'gis_layers'


class LayerMetadata(models.Model):
    layer = models.ForeignKey(GisLayer, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    source_department = models.CharField(max_length=150, blank=True, null=True)
    data_owner = models.CharField(max_length=150, blank=True, null=True)
    coordinate_reference_system = models.CharField(max_length=50, default='EPSG:4326')
    scale = models.CharField(max_length=50, default='1:5000')
    version = models.CharField(max_length=20, default='1.0')
    license = models.CharField(max_length=100, default='Open Government Data License')
    keywords = SafeJSONField(default=list)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'layer_metadata'


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    username = models.CharField(max_length=50, blank=True, null=True)
    action_type = models.CharField(max_length=50) # LOGIN, UPLOAD_GIS, etc.
    client_ip = models.CharField(max_length=45, blank=True, null=True)
    action_details = models.TextField(blank=True, null=True)
    old_value = SafeJSONField(blank=True, null=True)
    new_value = SafeJSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'


class SystemSetting(models.Model):
    setting_key = models.CharField(max_length=100, unique=True)
    setting_value = models.TextField()
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'system_settings'


class IntegrationAdapter(models.Model):
    system_name = models.CharField(max_length=100, unique=True)
    endpoint_url = models.TextField(blank=True, null=True)
    auth_config = SafeJSONField(default=dict)
    is_enabled = models.BooleanField(default=False)
    sync_interval_seconds = models.IntegerField(default=3600)
    last_sync_status = models.CharField(max_length=50, blank=True, null=True)
    last_sync_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'integration_adapters'
