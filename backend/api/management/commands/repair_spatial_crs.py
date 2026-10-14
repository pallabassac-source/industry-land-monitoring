from django.core.management.base import BaseCommand
from django.db import connection
from api.utils_gis import auto_repair_projected_geometries

class Command(BaseCommand):
    help = 'Inspects and repairs spatial layers with unprojected/UTM coordinates (lat > 90) into standard WGS84 (EPSG:4326)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Checking PostGIS tables for unprojected coordinates...'))
        
        with connection.cursor() as cursor:
            if connection.vendor != 'postgresql':
                self.stdout.write(self.style.WARNING('Database is not PostgreSQL/PostGIS. Skipping.'))
                return

            cursor.execute("SELECT COUNT(*) FROM industrial_estates WHERE ST_YMin(geom) > 90 OR ST_XMin(geom) > 180;")
            bad_estates = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM land_parcels WHERE ST_YMin(geom) > 90 OR ST_XMin(geom) > 180;")
            bad_parcels = cursor.fetchone()[0]

            self.stdout.write(f'Found {bad_estates} industrial estate(s) and {bad_parcels} parcel(s) with projected coordinates.')

        repaired = auto_repair_projected_geometries()
        if repaired > 0:
            self.stdout.write(self.style.SUCCESS(f'Successfully reprojected {repaired} record(s) to EPSG:4326 degrees.'))
        else:
            self.stdout.write(self.style.SUCCESS('All spatial records already conform to valid WGS84 (EPSG:4326).'))
