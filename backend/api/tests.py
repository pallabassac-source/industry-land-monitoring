import json
from django.test import TestCase, Client
from django.urls import reverse
from .models import Role, User, IndustrialEstate, LandParcel, District, SystemSetting, GisLayer, LayerMetadata, AuditLog
from .utils_gis import validate_and_parse_spatial_file, save_spatial_features_to_db, delete_layer_cascade

class GisEngineTests(TestCase):
    def test_spatial_file_validation_geojson(self):
        """Test validate_and_parse_spatial_file with valid GeoJSON payload"""
        geojson_data = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[91.76, 26.17], [91.78, 26.17], [91.78, 26.19], [91.76, 26.19], [91.76, 26.17]]]
                    },
                    "properties": {"name": "test_parcel"}
                }
            ]
        }
        raw_bytes = json.dumps(geojson_data).encode('utf-8')
        report = validate_and_parse_spatial_file("test.geojson", raw_bytes)
        
        self.assertTrue(report["is_valid"])
        self.assertEqual(report["crs_detected"], "EPSG:4326")
        self.assertEqual(report["geometry_type"], "Polygon")
        self.assertEqual(report["total_features"], 1)

    def test_spatial_file_validation_unsupported(self):
        """Test validation with unsupported format files"""
        report = validate_and_parse_spatial_file("test.txt", b"invalid data")
        self.assertFalse(report["is_valid"])
        self.assertIn("Unsupported file format.", report["errors"])


class WebApiTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    def setUp(self):
        from .models import LayerCategory
        LayerCategory.objects.get_or_create(id=1, defaults={'name': 'Administrative Boundaries'})
        LayerCategory.objects.get_or_create(id=2, defaults={'name': 'Industrial Assets'})

        # Create standard test roles
        self.admin_role = Role.objects.create(name="Super Administrator", description="All permissions")
        
        # Create standard admin user
        self.user = User.objects.create(
            username="gisadmin",
            full_name="State GIS Administrator",
            email="gisadmin@gov.in",
            role=self.admin_role
        )
        self.user.set_password("gisadmin")
        self.user.save()

        # Create basic district
        self.district = District.objects.create(
            name="Guwahati Metro",
            code="GWH",
            geom="POLYGON((91.5 26.1, 91.9 26.1, 91.9 26.3, 91.5 26.3, 91.5 26.1))"
        )

        self.client = Client()

    def test_user_authentication_success(self):
        """Verify JWT login handles credentials matching database profiles"""
        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({"username": "gisadmin", "password": "gisadmin"}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access", data)
        self.assertEqual(data["user"]["username"], "gisadmin")

    def test_user_authentication_invalid_credentials(self):
        """Verify login fails with wrong password"""
        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({"username": "gisadmin", "password": "wrongpassword"}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_estates_list_api(self):
        """Verify Industrial Estates endpoint fetches data properly"""
        estate = IndustrialEstate.objects.create(
            name="Guwahati Estate",
            district=self.district,
            total_area_acres=100.0,
            available_area_acres=80.0,
            geom="POLYGON((91.76 26.17, 91.78 26.17, 91.78 26.19, 91.76 26.19, 91.76 26.17))"
        )
        response = self.client.get('/api/estates/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["name"], "Guwahati Estate")

    def test_system_settings_retrieval(self):
        """Verify settings storage can be listed and retrieved"""
        SystemSetting.objects.create(setting_key="DEFAULT_CRS", setting_value="EPSG:4326")
        response = self.client.get('/api/settings/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data[0]["setting_key"], "DEFAULT_CRS")

    def test_gis_upload_and_persistence(self):
        """Verify GIS shapefile feature ingestion engine persists to PostGIS tables"""
        report_data = {
            "is_valid": True,
            "crs_detected": "EPSG:4326",
            "geometry_type": "Polygon",
            "bbox": [91.76, 26.17, 91.78, 26.19],
            "parsed_features": [
                {
                    "plot_name": "Plot A-1",
                    "status": "Vacan",
                    "area_acres": 12.5,
                    "wkt": "POLYGON((91.76 26.17, 91.78 26.17, 91.78 26.19, 91.76 26.19, 91.76 26.17))"
                },
                {
                    "plot_name": "Plot A-2",
                    "status": "Occupied",
                    "area_acres": 8.0,
                    "wkt": "POLYGON((91.78 26.17, 91.80 26.17, 91.80 26.19, 91.78 26.19, 91.78 26.17))"
                }
            ]
        }
        layer_id = save_spatial_features_to_db("Test_Industrial_Zone", report_data)
        
        self.assertIsNotNone(layer_id)
        self.assertEqual(GisLayer.objects.count(), 1)
        self.assertEqual(IndustrialEstate.objects.count(), 1)
        self.assertEqual(LandParcel.objects.count(), 2)

    def test_cascading_layer_deletion(self):
        """Verify deleting a layer cascades and purges metadata, estates, parcels and stats"""
        report_data = {
            "is_valid": True,
            "crs_detected": "EPSG:4326",
            "geometry_type": "Polygon",
            "bbox": [91.14, 26.48, 91.17, 26.51],
            "parsed_features": [
                {
                    "plot_name": "Plot P-101",
                    "status": "Vacan",
                    "area_acres": 5.0,
                    "wkt": "POLYGON((91.14 26.48, 91.15 26.48, 91.15 26.49, 91.14 26.49, 91.14 26.48))"
                }
            ]
        }
        layer_id = save_spatial_features_to_db("Cascading_Test_Layer", report_data)

        # Pre-deletion assertions
        self.assertEqual(GisLayer.objects.count(), 1)
        self.assertEqual(IndustrialEstate.objects.count(), 1)
        self.assertEqual(LandParcel.objects.count(), 1)
        self.assertEqual(LayerMetadata.objects.count(), 1)

        # Delete layer via API
        response = self.client.delete(f'/api/gis/layers/{layer_id}/')
        self.assertEqual(response.status_code, 204)

        # Post-deletion assertions (100% purged)
        self.assertEqual(GisLayer.objects.count(), 0)
        self.assertEqual(IndustrialEstate.objects.count(), 0)
        self.assertEqual(LandParcel.objects.count(), 0)
        self.assertEqual(LayerMetadata.objects.count(), 0)

        # Verify Dashboard stats report 0
        stats_resp = self.client.get('/api/dashboard/stats/')
        self.assertEqual(stats_resp.status_code, 200)
        stats_data = stats_resp.json()
        self.assertEqual(stats_data["total_estates"], 0)
        self.assertEqual(stats_data["total_parcels"], 0)

    def test_audit_logs_trail(self):
        """Verify audit trail creation and listing API"""
        AuditLog.objects.create(
            user_id=1,
            username="gisadmin",
            action_type="TEST_ACTION",
            action_details="Executed unit test audit action."
        )
        response = self.client.get('/api/audit-logs/?action=TEST_ACTION')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["action_type"], "TEST_ACTION")
