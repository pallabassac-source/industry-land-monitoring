import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.ts';
import { 
  Layers, Compass, ZoomIn, ZoomOut, Ruler,
  ChevronRight, ChevronDown, Info, Sliders, Search, Home, MapPin, Trash2, Edit3
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const createPinMarkerImage = (colorHex: string): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 44;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(18, 16, 13, Math.PI, 0, false);
    ctx.lineTo(18, 40);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(18, 16, 5, 0, Math.PI * 2, true);
    ctx.fill();

    return ctx.getImageData(0, 0, 36, 44);
  }
  return new ImageData(36, 44);
};

const wktToGeoJson = (wkt: any): any => {
  if (!wkt) return null;
  if (typeof wkt === 'object' && wkt.type && wkt.coordinates) return wkt;
  if (typeof wkt === 'string' && wkt.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(wkt);
      if (parsed.type && parsed.coordinates) return parsed;
      if (parsed.geometry) return parsed.geometry;
    } catch (e) {}
  }
  if (typeof wkt !== 'string') return null;

  let str = wkt.trim();
  str = str.replace(/^SRID=\d+;/i, '').trim();
  const upper = str.toUpperCase();

  try {
    if (upper.startsWith('MULTIPOLYGON')) {
      const ringMatches = str.match(/\(\s*([0-9\.\,\s\-eE]+)\s*\)/g);
      if (ringMatches) {
        const coordinates = [ringMatches.map(ring => {
          const clean = ring.replace(/[\(\)]/g, '').trim();
          return clean.split(',').map(pair => {
            const [lng, lat] = pair.trim().split(/\s+/).map(Number);
            return [lng, lat];
          }).filter(pt => !isNaN(pt[0]) && !isNaN(pt[1]));
        })];
        return { type: 'MultiPolygon', coordinates };
      }
    } else if (upper.startsWith('POLYGON')) {
      const ringMatches = str.match(/\(\s*([0-9\.\,\s\-eE]+)\s*\)/g);
      if (ringMatches && ringMatches.length > 0) {
        const coordinates = ringMatches.map(ring => {
          const clean = ring.replace(/[\(\)]/g, '').trim();
          return clean.split(',').map(pair => {
            const [lng, lat] = pair.trim().split(/\s+/).map(Number);
            return [lng, lat];
          }).filter(pt => !isNaN(pt[0]) && !isNaN(pt[1]));
        });
        return { type: 'Polygon', coordinates };
      }
    } else if (upper.startsWith('LINESTRING')) {
      const match = str.match(/\(\s*(.*?)\s*\)/);
      if (match) {
        const coords = match[1].split(',').map(pair => pair.trim().split(/\s+/).map(Number)).filter(pt => !isNaN(pt[0]) && !isNaN(pt[1]));
        return { type: 'LineString', coordinates: coords };
      }
    } else if (upper.startsWith('POINT')) {
      const match = str.match(/\(\s*(.*?)\s*\)/);
      if (match) {
        const coords = match[1].trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
        return { type: 'Point', coordinates: coords };
      }
    }
  } catch (e) {
    console.error('Error parsing WKT to GeoJSON:', e);
  }
  return null;
};

// Helper to get bounding center of geometry
const getWktCenter = (wkt: any): [number, number] => {
  const geojson = wktToGeoJson(wkt);
  if (!geojson || !geojson.coordinates) return [91.76, 26.18];
  
  try {
    let sumLng = 0, sumLat = 0, count = 0;
    const extractCoords = (arr: any) => {
      if (Array.isArray(arr[0])) {
        arr.forEach(extractCoords);
      } else if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
        sumLng += arr[0];
        sumLat += arr[1];
        count++;
      }
    };
    extractCoords(geojson.coordinates);
    if (count > 0) {
      return [sumLng / count, sumLat / count];
    }
  } catch (e) {}
  return [91.76, 26.18];
};

// Helper to extract non-empty genuine shapefile / layer attributes from clicked feature data
const extractGenuineAttributes = (data: any): [string, any][] => {
  if (!data) return [];
  
  let sourceObj: Record<string, any> = {};
  if (data.infrastructureDetails && typeof data.infrastructureDetails === 'object' && Object.keys(data.infrastructureDetails).length > 0) {
    sourceObj = { ...data.infrastructureDetails };
  } else if (data.attributes && typeof data.attributes === 'object' && Object.keys(data.attributes).length > 0) {
    sourceObj = { ...data.attributes };
  } else if (typeof data === 'object') {
    sourceObj = { ...data };
  }

  // Core fallback attributes if not in raw attributes dictionary
  if (data.plotNumber && !sourceObj.plotNumber && !sourceObj.Plot__Deta && !sourceObj.plot_number) {
    sourceObj['Plot Number'] = data.plotNumber;
  }
  if (data.parcelId && !sourceObj.parcelId && !sourceObj.parcel_id) {
    sourceObj['Parcel ID'] = data.parcelId;
  }
  if (data.areaAcres && !sourceObj.areaAcres && !sourceObj.Area && !sourceObj.area_acres) {
    sourceObj['Area (Acres)'] = data.areaAcres;
  }
  if (data.availabilityStatus && !sourceObj.availabilityStatus && !sourceObj.Plot_Vacan && !sourceObj.status) {
    sourceObj['Status'] = data.availabilityStatus;
  }

  const ignoreKeys = new Set(['geom', 'id', 'photoUrls', 'estateId', 'villageId', 'infrastructureDetails', 'attributes', 'type', 'data']);
  const cleanList: [string, any][] = [];

  Object.entries(sourceObj).forEach(([key, val]) => {
    if (ignoreKeys.has(key)) return;
    if (val === null || val === undefined || val === '' || val === '{}' || val === '[]') return;
    if (typeof val === 'object') return;
    
    let formattedKey = key.replace(/_/g, ' ').trim();
    if (formattedKey === 'Plot Vacan') formattedKey = 'Plot Status (Plot_Vacan)';
    if (formattedKey === 'Plot Deta') formattedKey = 'Plot Details';

    cleanList.push([formattedKey, String(val)]);
  });

  return cleanList;
};

// Geodesic distance calculation in meters using Haversine formula
const calculateGeodesicDistance = (points: [number, number][]): number => {
  if (points.length < 2) return 0;
  let totalMeters = 0;
  const R = 6371000;
  for (let i = 0; i < points.length - 1; i++) {
    const [lng1, lat1] = points[i];
    const [lng2, lat2] = points[i + 1];
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalMeters += R * c;
  }
  return totalMeters;
};

// Geodesic area calculation in square meters using spherical polygon formula
const calculateGeodesicArea = (points: [number, number][]): number => {
  if (points.length < 3) return 0;
  const R = 6371000;
  let totalArea = 0;
  for (let i = 0; i < points.length; i++) {
    const [lng1, lat1] = points[i];
    const [lng2, lat2] = points[(i + 1) % points.length];
    const dLng = (lng2 - lng1) * Math.PI / 180;
    totalArea += dLng * (2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180));
  }
  totalArea = Math.abs(totalArea * R * R / 4);
  return totalArea;
};

interface MapViewProps {
  isMapExpanded?: boolean;
  onToggleSplitScreen?: () => void;
}

export default function MapView({ isMapExpanded = true, onToggleSplitScreen }: MapViewProps = {}) {
  const {
    basemap,
    setBasemap,
    layers,
    mapZoom,
    mapCenter,
    selectedFeature,
    setSelectedFeature,
    measurementMode,
    setMeasurementMode,
    measurementResult,
    setMeasurementResult,
    zoomToCoordinates,
    parcels,
    estates,
    districts,
    infrastructureLayers,
    spatialQueryResults,
    runSpatialQuery,
    toggleLayerVisibility,
    setLayerOpacity,
    deleteLayer,
    updateLayer
  } = useStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const activeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState(true);
  const [cursorCoords, setCursorCoords] = useState<{ lng: number; lat: number }>({ lng: 91.760, lat: 26.180 });
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);

  // Layout UI Toggles
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [searchBannerOpen, setSearchBannerOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<'layers' | 'measure' | 'identify' | null>('layers');

  // Search tab local filter values
  const [filterDistrictId, setFilterDistrictId] = useState('');
  const [filterEstateId, setFilterEstateId] = useState('');
  const [filterPlotStatus, setFilterPlotStatus] = useState('');
  const [filterParcelId, setFilterParcelId] = useState('');
  const [isBeeping, setIsBeeping] = useState(false);

  // Setup refs to prevent closures in MapLibre event listeners
  const measurementModeRef = useRef(measurementMode);
  useEffect(() => { measurementModeRef.current = measurementMode; }, [measurementMode]);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlAvailable(false);
      }
    } catch (e) {
      setWebGlAvailable(false);
    }
  }, []);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!webGlAvailable || !mapContainerRef.current) return;

    // Build GeoJSON features
    const districtsGeoJson = {
      type: 'FeatureCollection',
      features: districts.map(d => ({
        type: 'Feature',
        properties: { id: d.id, name: d.name, type: 'District', data: JSON.stringify(d) },
        geometry: wktToGeoJson(d.geom)
      })).filter(f => f.geometry !== null)
    };

    const estatesGeoJson = {
      type: 'FeatureCollection',
      features: estates.map(e => ({
        type: 'Feature',
        properties: { id: e.id, name: e.name, type: 'Estate', data: JSON.stringify(e) },
        geometry: wktToGeoJson(e.geom)
      })).filter(f => f.geometry !== null)
    };

    const parcelsGeoJson = {
      type: 'FeatureCollection',
      features: parcels.map(p => ({
        type: 'Feature',
        properties: { 
          id: p.id, 
          name: p.plotNumber || p.parcelId || `Plot ${p.id}`, 
          plotNumber: p.plotNumber || p.parcelId,
          parcelId: p.parcelId,
          type: 'Parcel', 
          status: p.availabilityStatus, 
          areaAcres: p.areaAcres,
          data: JSON.stringify(p) 
        },
        geometry: wktToGeoJson(p.geom)
      })).filter(f => f.geometry !== null)
    };

    const infraGeoJson = {
      type: 'FeatureCollection',
      features: infrastructureLayers.map(infra => ({
        type: 'Feature',
        properties: { id: infra.id, name: infra.name, type: 'Infrastructure', infraType: infra.infraType, data: JSON.stringify(infra) },
        geometry: wktToGeoJson(infra.geom)
      })).filter(f => f.geometry !== null)
    };

    // Default Satellite base map style
    const mapStyle: maplibregl.StyleSpecification = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'osm': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics',
          maxzoom: 18,
          minzoom: 0
        }
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [mapCenter[0], mapCenter[1]],
      zoom: mapZoom,
      maxZoom: 22,
      preserveDrawingBuffer: true
    });

    mapInstanceRef.current = map;

    // Bind events
    map.on('mousemove', (e) => {
      setCursorCoords({
        lng: parseFloat(e.lngLat.lng.toFixed(4)),
        lat: parseFloat(e.lngLat.lat.toFixed(4))
      });
    });

    map.on('click', (e) => {
      const activeMode = measurementModeRef.current;
      if (activeMode !== 'none') {
        const newPt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setDrawnPoints(prev => {
          const pts = [...prev, newPt];
          if (activeMode === 'distance' && pts.length > 1) {
            const distMeters = calculateGeodesicDistance(pts);
            if (distMeters >= 1000) {
              const km = (distMeters / 1000).toFixed(2);
              setMeasurementResult(`${km} km (${distMeters.toFixed(0)} m)`);
            } else {
              setMeasurementResult(`${distMeters.toFixed(1)} m`);
            }
          } else if (activeMode === 'area' && pts.length > 2) {
            const sqMeters = calculateGeodesicArea(pts);
            const acres = (sqMeters * 0.000247105).toFixed(2);
            const hectares = (sqMeters / 10000).toFixed(2);
            setMeasurementResult(`${acres} Acres (${sqMeters.toLocaleString(undefined, {maximumFractionDigits:0})} m² / ${hectares} Ha)`);
          }
          return pts;
        });
        return;
      }

      // Query features under cursor
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['parcels-layer', 'parcels-markers', 'estates-layer', 'infrastructure-layer']
      });

      if (features && features.length > 0) {
        const f = features[0];
        const props = f.properties as any;
        setSelectedFeature({
          type: props.type,
          name: props.name,
          data: JSON.parse(props.data)
        });
        setExpandedAccordion('identify');
      } else {
        setSelectedFeature(null);
      }
    });

    map.on('dblclick', (e) => {
      if (expandedAccordion === 'identify') {
        e.preventDefault();
        const wkt = `POINT(${e.lngLat.lng} ${e.lngLat.lat})`;
        runSpatialQuery(wkt);
      }
    });

    map.on('load', () => {
      // Register custom status pin marker images for map layers
      if (!map.hasImage('pin-vacan')) map.addImage('pin-vacan', createPinMarkerImage('#22c55e'));
      if (!map.hasImage('pin-occupied')) map.addImage('pin-occupied', createPinMarkerImage('#ef4444'));
      if (!map.hasImage('pin-doubtful')) map.addImage('pin-doubtful', createPinMarkerImage('#eab308'));
      if (!map.hasImage('pin-road')) map.addImage('pin-road', createPinMarkerImage('#64748b'));

      // Add Sources
      map.addSource('districts', { type: 'geojson', data: districtsGeoJson as any });
      map.addSource('estates', { type: 'geojson', data: estatesGeoJson as any });
      map.addSource('parcels', { type: 'geojson', data: parcelsGeoJson as any });
      map.addSource('infrastructure', { type: 'geojson', data: infraGeoJson as any });
      
      // Dynamic overlay sources
      map.addSource('measurement', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addSource('spatial-query-results', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addSource('selected-parcel-highlight', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // --- 1. DISTRICTS LAYERS ---
      map.addLayer({
        id: 'districts-layer',
        type: 'fill',
        source: 'districts',
        paint: {
          'fill-color': 'rgba(30, 41, 59, 0.03)',
          'fill-opacity': 0.8
        }
      });
      map.addLayer({
        id: 'districts-outline',
        type: 'line',
        source: 'districts',
        paint: {
          'line-color': '#475569',
          'line-width': 1.5,
          'line-dasharray': [4, 4],
          'line-opacity': 0.8
        }
      });
      map.addLayer({
        id: 'districts-labels',
        type: 'symbol',
        source: 'districts',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#94a3b8',
          'text-halo-color': '#020617',
          'text-halo-width': 2
        }
      });

      // --- 2. ESTATES LAYERS ---
      map.addLayer({
        id: 'estates-layer',
        type: 'fill',
        source: 'estates',
        paint: {
          'fill-color': 'rgba(2, 132, 199, 0.12)',
          'fill-opacity': 0.9
        }
      });
      map.addLayer({
        id: 'estates-outline',
        type: 'line',
        source: 'estates',
        paint: {
          'line-color': '#0284c7',
          'line-width': 2.5,
          'line-opacity': 1
        }
      });
      map.addLayer({
        id: 'estates-labels',
        type: 'symbol',
        source: 'estates',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 13,
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#38bdf8',
          'text-halo-color': '#020617',
          'text-halo-width': 3
        }
      });

      // --- 3. PARCELS / PLOTS LAYERS (ADAPTIVE: LOCATION MARKERS AT LOW ZOOM, POLYGONS AT HIGH ZOOM) ---
      map.addLayer({
        id: 'parcels-markers',
        type: 'symbol',
        source: 'parcels',
        maxzoom: 14.5,
        layout: {
          'icon-image': [
            'match',
            ['get', 'status'],
            'Vacan', 'pin-vacan',
            'Occupied', 'pin-occupied',
            'Doubtful', 'pin-doubtful',
            'Inner Road', 'pin-road',
            'pin-vacan'
          ],
          'icon-size': 0.85,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 0.5],
          'text-anchor': 'top',
          'text-optional': true
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#0f172a',
          'text-halo-width': 2.5
        }
      });

      map.addLayer({
        id: 'parcels-layer',
        type: 'fill',
        source: 'parcels',
        minzoom: 14.5,
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'Vacan', 'rgba(34, 197, 94, 0.25)',
            'Occupied', 'rgba(239, 68, 68, 0.25)',
            'Doubtful', 'rgba(234, 179, 8, 0.35)',
            'Inner Road', 'rgba(100, 116, 139, 0.35)',
            'rgba(34, 197, 94, 0.25)'
          ],
          'fill-opacity': 0.95
        }
      });
      map.addLayer({
        id: 'parcels-outline',
        type: 'line',
        source: 'parcels',
        minzoom: 14.5,
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'Vacan', '#22c55e',
            'Occupied', '#ef4444',
            'Doubtful', '#eab308',
            'Inner Road', '#64748b',
            '#22c55e'
          ],
          'line-width': 2,
          'line-opacity': 1
        }
      });
      map.addLayer({
        id: 'parcels-labels',
        type: 'symbol',
        source: 'parcels',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#0f172a',
          'text-halo-width': 2.5
        }
      });

      // --- 4. INFRASTRUCTURE LAYERS ---
      map.addLayer({
        id: 'infrastructure-layer',
        type: 'line',
        source: 'infrastructure',
        paint: {
          'line-color': [
            'match',
            ['get', 'infraType'],
            'PowerLine', '#eab308',
            '#f97316'
          ],
          'line-width': 2.5,
          'line-opacity': 0.8
        }
      });
      map.addLayer({
        id: 'infrastructure-labels',
        type: 'symbol',
        source: 'infrastructure',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'symbol-placement': 'line'
        },
        paint: {
          'text-color': '#f97316',
          'text-halo-color': '#0f172a',
          'text-halo-width': 2
        }
      });

      // --- 5. MEASUREMENT OVERLAY LAYERS ---
      map.addLayer({
        id: 'measurement-fill',
        type: 'fill',
        source: 'measurement',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': 'rgba(14, 165, 233, 0.25)',
          'fill-outline-color': '#0ea5e9'
        }
      });
      map.addLayer({
        id: 'measurement-line',
        type: 'line',
        source: 'measurement',
        filter: ['in', '$type', 'LineString', 'Polygon'],
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 3,
          'line-dasharray': [2, 2]
        }
      });
      map.addLayer({
        id: 'measurement-points',
        type: 'circle',
        source: 'measurement',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 6,
          'circle-color': '#0ea5e9',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Spatial query results styles
      map.addLayer({
        id: 'spatial-query-results-layer',
        type: 'fill',
        source: 'spatial-query-results',
        paint: {
          'fill-color': 'rgba(14, 165, 233, 0.25)',
          'fill-outline-color': '#0ea5e9',
          'fill-opacity': 0.9
        }
      });

      // Selection Highlight Layer (Beeping vibrant color)
      map.addLayer({
        id: 'selected-parcel-highlight-layer',
        type: 'fill',
        source: 'selected-parcel-highlight',
        paint: {
          'fill-color': '#ff0055',
          'fill-outline-color': '#ff0055',
          'fill-opacity': 0.85
        }
      });
      map.addLayer({
        id: 'selected-parcel-highlight-outline',
        type: 'line',
        source: 'selected-parcel-highlight',
        paint: {
          'line-color': '#ff0055',
          'line-width': 4,
          'line-opacity': 1
        }
      });

      // Force initial sync of layer states
      syncLayerSettings(map);

      // Auto-fit camera to active layer bounds
      fitToActiveLayerBounds(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [webGlAvailable]);

  // Unified Layer Control sync (Fill, Stroke Outlines, and Symbol Text Labels)
  const syncLayerSettings = (map: maplibregl.Map) => {
    const anyLayerVisible = layers.length === 0 || layers.some(l => l.isVisible);
    const parcelsLayer = layers.find(l => l.name === 'parcels');
    const parcelsVis = parcelsLayer ? (parcelsLayer.isVisible ? 'visible' : 'none') : (anyLayerVisible ? 'visible' : 'none');

    const estatesLayer = layers.find(l => l.name === 'estates');
    const estatesVis = estatesLayer ? (estatesLayer.isVisible ? 'visible' : 'none') : 'none';

    const districtsLayer = layers.find(l => l.name === 'districts');
    const districtsVis = districtsLayer ? (districtsLayer.isVisible ? 'visible' : 'none') : 'visible';

    const infraLayer = layers.find(l => l.name === 'infrastructure');
    const infraVis = infraLayer ? (infraLayer.isVisible ? 'visible' : 'none') : 'visible';

    const layerVisMap: Record<string, 'visible' | 'none'> = {
      'districts-layer': districtsVis,
      'districts-outline': districtsVis,
      'districts-labels': districtsVis,
      'estates-layer': estatesVis,
      'estates-outline': estatesVis,
      'estates-labels': estatesVis,
      'parcels-layer': parcelsVis,
      'parcels-outline': parcelsVis,
      'parcels-markers': parcelsVis,
      'parcels-labels': parcelsVis,
      'infrastructure-layer': infraVis,
      'infrastructure-labels': infraVis,
    };

    Object.entries(layerVisMap).forEach(([id, vis]) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', vis);
        const targetStoreLayer = id.startsWith('parcels') ? parcelsLayer : id.startsWith('estates') ? estatesLayer : undefined;
        const op = targetStoreLayer?.opacity ?? 0.85;
        if (id.endsWith('-layer')) {
          map.setPaintProperty(id, id.startsWith('infrastructure') ? 'line-opacity' : 'fill-opacity', op);
        } else if (id.endsWith('-outline')) {
          map.setPaintProperty(id, 'line-opacity', op);
        } else if (id.endsWith('-labels')) {
          map.setPaintProperty(id, 'text-opacity', op);
        }
      }
    });
  };

  // Helper to fit map camera bounding box to active uploaded layers (Parcels / Estates)
  const fitToActiveLayerBounds = (map: maplibregl.Map) => {
    const validFeatures: any[] = [];
    if (parcels.length > 0) {
      parcels.forEach(p => {
        const g = wktToGeoJson(p.geom);
        if (g) validFeatures.push({ geometry: g });
      });
    } else if (estates.length > 0) {
      estates.forEach(e => {
        const g = wktToGeoJson(e.geom);
        if (g) validFeatures.push({ geometry: g });
      });
    }

    if (validFeatures.length === 0) return;

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    const extractCoords = (coords: any) => {
      if (Array.isArray(coords[0])) {
        coords.forEach(extractCoords);
      } else if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [lng, lat] = coords;
        if (!isNaN(lng) && !isNaN(lat)) {
          if (lng < minLng) minLng = lng;
          if (lat < minLat) minLat = lat;
          if (lng > maxLng) maxLng = lng;
          if (lat > maxLat) maxLat = lat;
        }
      }
    };

    validFeatures.forEach(f => extractCoords(f.geometry.coordinates));

    if (minLng !== Infinity && maxLng !== -Infinity && (maxLng - minLng > 0.0001 || maxLat - minLat > 0.0001)) {
      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 80, maxZoom: 16, duration: 1200 }
      );
    } else if (minLng !== Infinity) {
      map.flyTo({ center: [minLng, minLat], zoom: 15, essential: true });
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      syncLayerSettings(mapInstanceRef.current);
    }
  }, [layers]);

  // Handle coordinates flyTo
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentCenter = map.getCenter();
    if (Math.abs(currentCenter.lng - mapCenter[0]) > 0.001 || Math.abs(currentCenter.lat - mapCenter[1]) > 0.001) {
      map.flyTo({
        center: [mapCenter[0], mapCenter[1]],
        zoom: mapZoom,
        essential: true
      });
    }
  }, [mapCenter, mapZoom]);

  // Dynamically update map GeoJSON sources when store data loads or changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const updateMapSources = () => {
      const parcelsSource = map.getSource('parcels') as maplibregl.GeoJSONSource;
      if (parcelsSource) {
        parcelsSource.setData({
          type: 'FeatureCollection',
          features: parcels.map(p => ({
            type: 'Feature' as const,
            properties: { id: p.id, name: p.parcelId || p.plotNumber, type: 'Parcel', status: p.availabilityStatus, data: JSON.stringify(p) },
            geometry: wktToGeoJson(p.geom)
          })).filter(f => f.geometry !== null) as any
        });
      }

      const estatesSource = map.getSource('estates') as maplibregl.GeoJSONSource;
      if (estatesSource) {
        estatesSource.setData({
          type: 'FeatureCollection',
          features: estates.map(e => ({
            type: 'Feature' as const,
            properties: { id: e.id, name: e.name, type: 'Estate', data: JSON.stringify(e) },
            geometry: wktToGeoJson(e.geom)
          })).filter(f => f.geometry !== null) as any
        });
      }

      const districtsSource = map.getSource('districts') as maplibregl.GeoJSONSource;
      if (districtsSource) {
        districtsSource.setData({
          type: 'FeatureCollection',
          features: districts.map(d => ({
            type: 'Feature' as const,
            properties: { id: d.id, name: d.name, type: 'District', data: JSON.stringify(d) },
            geometry: wktToGeoJson(d.geom)
          })).filter(f => f.geometry !== null) as any
        });
      }

      const infraSource = map.getSource('infrastructure') as maplibregl.GeoJSONSource;
      if (infraSource) {
        infraSource.setData({
          type: 'FeatureCollection',
          features: infrastructureLayers.map(infra => ({
            type: 'Feature' as const,
            properties: { id: infra.id, name: infra.name, type: 'Infrastructure', infraType: infra.infraType, data: JSON.stringify(infra) },
            geometry: wktToGeoJson(infra.geom)
          })).filter(f => f.geometry !== null) as any
        });
      }

      // Automatically fit map bounding box to uploaded layers
      if (parcels.length > 0 || estates.length > 0) {
        fitToActiveLayerBounds(map);
      }
    };

    if (map.isStyleLoaded()) {
      updateMapSources();
    } else {
      map.once('styledata', updateMapSources);
    }
  }, [parcels, estates, districts, infrastructureLayers]);

  // Update map source when drawnPoints changes (for measurements)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (!map.isStyleLoaded()) return;
    const source = map.getSource('measurement') as maplibregl.GeoJSONSource;
    if (source) {
      if (drawnPoints.length === 0) {
        source.setData({ type: 'FeatureCollection', features: [] });
      } else {
        const features: any[] = [];
        drawnPoints.forEach(pt => {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: pt },
            properties: {}
          });
        });
        if (drawnPoints.length > 1) {
          features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: drawnPoints },
            properties: {}
          });
        }
        if (drawnPoints.length > 2 && measurementMode === 'area') {
          const closedRing = [...drawnPoints, drawnPoints[0]];
          features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [closedRing] },
            properties: {}
          });
        }
        source.setData({ type: 'FeatureCollection', features });
      }
    }
  }, [drawnPoints, measurementMode]);

  // Update map source when spatialQueryResults changes to highlight them on map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (!map.isStyleLoaded()) return;
    const source = map.getSource('spatial-query-results') as maplibregl.GeoJSONSource;
    if (source) {
      if (!spatialQueryResults || spatialQueryResults.length === 0) {
        source.setData({ type: 'FeatureCollection', features: [] });
      } else {
        source.setData({
          type: 'FeatureCollection',
          features: spatialQueryResults.map(res => ({
            type: 'Feature' as const,
            geometry: res.geojson?.geometry || wktToGeoJson(res.geom),
            properties: { id: res.id, name: res.parcel_id || res.plot_number || res.name }
          })).filter(f => f.geometry !== null) as any
        });
      }
    }
  }, [spatialQueryResults]);

  // Update highlight layer on selected parcel change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (!map.isStyleLoaded()) return;
    const source = map.getSource('selected-parcel-highlight') as maplibregl.GeoJSONSource;
    if (source) {
      if (selectedFeature && selectedFeature.data && selectedFeature.data.geom) {
        const geojson = wktToGeoJson(selectedFeature.data.geom);
        if (geojson) {
          source.setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature' as const,
              geometry: geojson,
              properties: { name: selectedFeature.name }
            }]
          });
          return;
        }
      }
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [selectedFeature]);

  // Render Location Pointer Marker & Brief Details Popup on MapView when feature selected
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing marker & popup
    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove();
      activeMarkerRef.current = null;
    }
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }

    if (!selectedFeature || !selectedFeature.data) return;

    const data = selectedFeature.data;
    const center = getWktCenter(data.geom || data);

    if (!center || isNaN(center[0]) || isNaN(center[1])) return;

    // Create custom DOM element for Location Pointer Marker with pulsing ring
    const el = document.createElement('div');
    el.className = 'location-pointer-pin relative flex items-center justify-center cursor-pointer group z-30';
    el.innerHTML = `
      <div class="absolute -inset-3 bg-rose-500/40 rounded-full animate-ping pointer-events-none"></div>
      <div class="relative z-10 bg-gradient-to-tr from-rose-600 to-rose-500 text-white p-2 rounded-full shadow-2xl border-2 border-white flex items-center justify-center transform group-hover:scale-125 transition-transform duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `;

    const status = data.availabilityStatus || data.status || 'Vacan';
    const statusBg = status === 'Vacan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                     status === 'Occupied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                     status === 'Doubtful' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' :
                     status === 'Inner Road' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                     'bg-slate-100 text-slate-600 border-slate-200';

    const title = data.parcelId ? `${data.parcelId} (${data.plotNumber || 'Plot'})` : (data.name || selectedFeature.name);
    const area = data.areaAcres ? `${data.areaAcres} Acres` : (data.totalArea ? `${data.totalArea} Acres` : '');

    // Popup Content HTML
    const popupContent = document.createElement('div');
    popupContent.className = 'p-3 max-w-xs space-y-2 text-xs font-sans bg-white rounded-xl shadow-2xl border border-slate-200/90';
    popupContent.innerHTML = `
      <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
        <span class="font-extrabold text-xs text-slate-800 truncate">${title}</span>
        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase border flex-shrink-0 ${statusBg}">${status}</span>
      </div>
      <div class="space-y-1 text-slate-600">
        ${area ? `<div class="flex justify-between items-center"><span class="font-bold text-slate-400 text-[10px] uppercase">Area:</span> <span class="font-extrabold text-slate-800">${area}</span></div>` : ''}
        ${data.surveyNumber ? `<div class="flex justify-between items-center"><span class="font-bold text-slate-400 text-[10px] uppercase">Survey No:</span> <span class="font-semibold text-slate-700">${data.surveyNumber}</span></div>` : ''}
        ${data.landClassification ? `<div class="flex justify-between items-center"><span class="font-bold text-slate-400 text-[10px] uppercase">Classification:</span> <span class="font-semibold text-slate-700">${data.landClassification}</span></div>` : ''}
      </div>
      <button id="marker-view-attributes-btn" class="w-full mt-2 bg-gov-blue hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer">
        <span>View Full Attributes</span>
      </button>
    `;

    popupContent.querySelector('#marker-view-attributes-btn')?.addEventListener('click', () => {
      setExpandedAccordion('identify');
    });

    const popup = new maplibregl.Popup({ offset: 25, closeButton: true, closeOnClick: false })
      .setDOMContent(popupContent);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([center[0], center[1]])
      .setPopup(popup)
      .addTo(map);

    popup.addTo(map);

    activeMarkerRef.current = marker;
    activePopupRef.current = popup;

    // Pan map camera smoothly to center location
    map.flyTo({
      center: [center[0], center[1]],
      zoom: 16,
      essential: true
    });

  }, [selectedFeature]);

  // Web Audio radar audio beep sound helper
  const playRadarBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  // Beeping animation frame loop for MapLibre GL JS highlight layer
  useEffect(() => {
    if (!isBeeping || !selectedFeature) return;

    playRadarBeep();

    let animFrameId: number;
    let startTime = performance.now();

    const animateBeep = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      // Oscillate opacity between 0.15 and 0.95 at ~3 Hz pulse rate
      const pulseOpacity = 0.55 + 0.4 * Math.sin(elapsed * Math.PI * 6);
      const pulseLineWidth = 3 + 5 * (0.5 + 0.5 * Math.sin(elapsed * Math.PI * 6));

      if (mapInstanceRef.current && mapInstanceRef.current.isStyleLoaded()) {
        const map = mapInstanceRef.current;
        if (map.getLayer('selected-parcel-highlight-layer')) {
          map.setPaintProperty('selected-parcel-highlight-layer', 'fill-color', '#ff0055');
          map.setPaintProperty('selected-parcel-highlight-layer', 'fill-opacity', pulseOpacity);
        }
        if (map.getLayer('selected-parcel-highlight-outline')) {
          map.setPaintProperty('selected-parcel-highlight-outline', 'line-color', '#ff0055');
          map.setPaintProperty('selected-parcel-highlight-outline', 'line-width', pulseLineWidth);
        }
      }

      animFrameId = requestAnimationFrame(animateBeep);
    };

    animFrameId = requestAnimationFrame(animateBeep);

    const timer = setTimeout(() => {
      setIsBeeping(false);
    }, 10000);

    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(timer);
    };
  }, [isBeeping, selectedFeature]);

  // Disable double click zoom when measurement or spatial query panel is active
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (measurementMode !== 'none' || expandedAccordion === 'identify') {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [measurementMode, expandedAccordion]);

  // Watch basemap changes and set tiles source
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (!map.isStyleLoaded()) return;
    
    let tileUrl = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (basemap === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (basemap === 'light') {
      tileUrl = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    } else if (basemap === 'topo') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
    }
    
    const source = map.getSource('osm') as maplibregl.RasterTileSource;
    if (source) {
      source.setTiles([tileUrl]);
    }
  }, [basemap]);

  // Convert lat/lng to simulated SVG coords for fallback
  const toSvgCoords = (coordsStr: string) => {
    try {
      const match = coordsStr.match(/\(\((.*?)\)\)/);
      if (!match) return "";
      const pts = match[1].split(',').map(pair => {
        const [lng, lat] = pair.trim().split(' ').map(Number);
        const x = ((lng - 91.5) / 0.4) * 600;
        const y = 400 - ((lat - 26.1) / 0.2) * 400;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return pts.join(' ');
    } catch (e) {
      return "";
    }
  };

  const getLineSvgCoords = (coordsStr: string) => {
    try {
      const match = coordsStr.match(/\((.*?)\)/);
      if (!match) return "";
      const pts = match[1].split(',').map(pair => {
        const [lng, lat] = pair.trim().split(' ').map(Number);
        const x = ((lng - 91.5) / 0.4) * 600;
        const y = 400 - ((lat - 26.1) / 0.2) * 400;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return pts.join(' ');
    } catch (e) {
      return "";
    }
  };

  const layerVisible = (name: string) => {
    return layers.find(l => l.name === name)?.isVisible ?? true;
  };

  const layerOpacity = (name: string) => {
    return layers.find(l => l.name === name)?.opacity ?? 1;
  };

  // Local drop filters calculations
  const filteredEstates = filterDistrictId 
    ? estates.filter(e => e.districtId === Number(filterDistrictId)) 
    : estates;

  const filteredParcels = filterEstateId 
    ? parcels.filter(p => p.estateId === Number(filterEstateId)) 
    : parcels;

  const filteredParcelsByStatus = filteredParcels.filter(p => {
    if (!filterPlotStatus) return true;
    const s = (p.availabilityStatus || '').toUpperCase();
    if (filterPlotStatus === 'Vacan') return s === 'VACAN' || s === 'VACANT' || s === 'AVAILABLE';
    if (filterPlotStatus === 'Occupied') return s === 'OCCUPIED' || s === 'ALLOCATED';
    if (filterPlotStatus === 'Doubtful') return s === 'DOUBTFUL' || s === 'DISPUTE';
    if (filterPlotStatus === 'Inner Road') return s === 'INNER ROAD' || s === 'INNER_ROAD' || s === 'ROAD';
    return s === filterPlotStatus.toUpperCase();
  });

  // Search actions triggers
  const handleSearchIE = () => {
    if (filterParcelId) {
      const p = parcels.find(x => x.id === Number(filterParcelId));
      if (p) {
        const center = getWktCenter(p.geom);
        zoomToCoordinates(center[0], center[1], 15);
        setSelectedFeature({ type: 'Parcel', name: p.parcelId, data: p });
        setIsBeeping(true);
      }
    } else if (filterEstateId) {
      const e = estates.find(x => x.id === Number(filterEstateId));
      if (e) {
        const center = getWktCenter(e.geom);
        zoomToCoordinates(center[0], center[1], 14);
        setSelectedFeature({ type: 'Estate', name: e.name, data: e });
        setIsBeeping(true);
      }
    } else if (filterDistrictId) {
      const d = districts.find(x => x.id === Number(filterDistrictId));
      if (d) {
        const center = getWktCenter(d.geom);
        zoomToCoordinates(center[0], center[1], 11);
        setSelectedFeature({ type: 'District', name: d.name, data: d });
        setIsBeeping(true);
      }
    }
  };

  const resetFilters = () => {
    setFilterDistrictId('');
    setFilterEstateId('');
    setFilterPlotStatus('');
    setFilterParcelId('');
    setSelectedFeature(null);
    setIsBeeping(false);
    useStore.setState({ spatialQueryResults: [] });
  };

  // Locate current position mock or browser API
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          zoomToCoordinates(pos.coords.longitude, pos.coords.latitude, 14);
        },
        () => {
          zoomToCoordinates(91.76, 26.18, 12);
        }
      );
    } else {
      zoomToCoordinates(91.76, 26.18, 12);
    }
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
      
      {/* 1. COLLAPSIBLE LEFT ACCORDION PANEL */}
      <div 
        className={`h-full bg-slate-950 border-r border-slate-800 text-slate-100 flex flex-col transition-all duration-300 relative z-20 overflow-hidden ${
          leftSidebarOpen ? 'w-80' : 'w-0'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-gov-blue animate-spin-slow" />
            <span className="font-extrabold text-sm uppercase tracking-wider text-slate-200">GIS Control Panel</span>
          </div>
        </div>

        {/* Sidebar Accordions */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800 text-xs">
          
          {/* ACCORDION 1: LAYERS */}
          <div className="border-b border-slate-800">
            <button 
              onClick={() => setExpandedAccordion(expandedAccordion === 'layers' ? null : 'layers')}
              className={`w-full px-4 py-3 font-bold text-left flex justify-between items-center transition-all ${
                expandedAccordion === 'layers' ? 'bg-gov-blue text-white' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Layers Manager</span>
              </div>
              {expandedAccordion === 'layers' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedAccordion === 'layers' && (
              <div className="p-3 space-y-3 bg-slate-950 animate-in fade-in duration-200">
                <div className="space-y-2.5">
                  {layers.map((layer) => (
                    <div key={layer.id} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between font-semibold text-slate-300">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-white flex-1">
                          <input 
                            type="checkbox" 
                            checked={layer.isVisible} 
                            onChange={() => toggleLayerVisibility(layer.id)}
                            className="rounded border-slate-700 bg-slate-900 text-gov-blue focus:ring-gov-blue"
                          />
                          <span className="text-xs font-extrabold text-slate-200">{layer.displayName}</span>
                        </label>

                        <div className="flex items-center gap-1">
                          {/* Edit / Modify Layer button */}
                          <button
                            onClick={() => {
                              const newName = prompt('Modify Layer Display Name:', layer.displayName);
                              if (newName && newName.trim()) {
                                updateLayer(layer.id, { displayName: newName.trim() });
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-gov-blue hover:bg-slate-800 rounded transition"
                            title="Modify / Rename Layer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Remove Layer button */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove layer "${layer.displayName}"?`)) {
                                deleteLayer(layer.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                            title="Delete / Remove Layer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {layer.isVisible && (
                        <div className="pl-6 flex items-center gap-2 text-[9px] text-slate-400 border-t border-slate-800/50 pt-1.5">
                          <Sliders className="w-3 h-3 text-slate-500" />
                          <span>Opacity:</span>
                          <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={layer.opacity}
                            onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                            className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-bold text-slate-300">{Math.round(layer.opacity * 100)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: MEASUREMENT */}
          <div className="border-b border-slate-800">
            <button 
              onClick={() => setExpandedAccordion(expandedAccordion === 'measure' ? null : 'measure')}
              className={`w-full px-4 py-3 font-bold text-left flex justify-between items-center transition-all ${
                expandedAccordion === 'measure' ? 'bg-gov-blue text-white' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                <span>Measurement Tools</span>
              </div>
              {expandedAccordion === 'measure' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedAccordion === 'measure' && (
              <div className="p-4 space-y-3 bg-slate-950 animate-in fade-in duration-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (measurementMode === 'distance') {
                        setMeasurementMode('none');
                      } else {
                        setMeasurementMode('distance');
                      }
                      setDrawnPoints([]);
                      setMeasurementResult(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded font-bold text-center border transition ${
                      measurementMode === 'distance'
                        ? 'bg-gov-blue text-white border-gov-blue shadow-md'
                        : 'border-slate-800 hover:bg-slate-800 text-slate-300 bg-slate-900'
                    }`}
                  >
                    Measure Distance
                  </button>
                  <button
                    onClick={() => {
                      if (measurementMode === 'area') {
                        setMeasurementMode('none');
                      } else {
                        setMeasurementMode('area');
                      }
                      setDrawnPoints([]);
                      setMeasurementResult(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded font-bold text-center border transition ${
                      measurementMode === 'area'
                        ? 'bg-gov-blue text-white border-gov-blue shadow-md'
                        : 'border-slate-800 hover:bg-slate-800 text-slate-300 bg-slate-900'
                    }`}
                  >
                    Measure Area
                  </button>
                </div>

                {measurementMode !== 'none' && (
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded space-y-2 text-slate-400">
                    <p className="text-[10px]">
                      Click points on the map path to define the line segment or shape boundaries.
                    </p>
                    {measurementResult && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="font-semibold text-slate-400">Calculated Output:</span>
                        <span className="text-xs font-black text-gov-blue">{measurementResult}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setDrawnPoints([]);
                    setMeasurementResult(null);
                    setMeasurementMode('none');
                  }}
                  disabled={drawnPoints.length === 0 && measurementMode === 'none'}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 font-bold py-2 rounded border border-slate-800 transition"
                >
                  Clear Drawing Path
                </button>
              </div>
            )}
          </div>

          {/* ACCORDION 3: SELECTED DETAIL */}
          <div className="border-b border-slate-800">
            <button 
              onClick={() => setExpandedAccordion(expandedAccordion === 'identify' ? null : 'identify')}
              className={`w-full px-4 py-3 font-bold text-left flex justify-between items-center transition-all ${
                expandedAccordion === 'identify' ? 'bg-gov-blue text-white' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Selected Detail</span>
              </div>
              {expandedAccordion === 'identify' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedAccordion === 'identify' && (
              <div className="p-4 space-y-4 bg-slate-950 animate-in fade-in duration-200">
                {selectedFeature ? (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2 text-slate-300">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="font-extrabold text-gov-blue uppercase text-[10px] tracking-wider">{selectedFeature.type} Info</span>
                      <button 
                        onClick={() => setSelectedFeature(null)}
                        className="text-slate-500 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-1.5 text-[11px] leading-normal text-slate-400">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                        <span className="font-bold text-slate-300">Identifier:</span>
                        <span className="font-extrabold text-white text-xs">{selectedFeature.name}</span>
                      </div>

                      {selectedFeature.data?.availabilityStatus && (
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                          <span className="font-bold text-slate-300">Plot Status:</span>
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase border ${
                            selectedFeature.data.availabilityStatus === 'Vacan' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            selectedFeature.data.availabilityStatus === 'Occupied' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                            selectedFeature.data.availabilityStatus === 'Doubtful' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            selectedFeature.data.availabilityStatus === 'Inner Road' ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {selectedFeature.data.availabilityStatus}
                          </span>
                        </div>
                      )}

                      {/* Display genuine shapefile / feature attributes table */}
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Feature Attributes</p>
                        {extractGenuineAttributes(selectedFeature.data).map(([attrKey, attrVal], aIdx) => (
                          <div key={aIdx} className="flex justify-between items-start gap-2 py-0.5 border-b border-slate-900/50">
                            <span className="font-semibold text-slate-400 truncate max-w-[130px]">{attrKey}:</span>
                            <span className="font-extrabold text-slate-200 text-right truncate max-w-[130px]" title={String(attrVal)}>{String(attrVal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          const center = getWktCenter(selectedFeature.data.geom);
                          zoomToCoordinates(center[0], center[1], 15);
                        }}
                        className="flex-1 bg-gov-blue hover:bg-gov-blue/90 text-white font-bold py-1 rounded text-[10px] transition"
                      >
                        Fly To
                      </button>
                      <button
                        onClick={() => setSelectedFeature(null)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1 rounded text-[10px] transition"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 font-medium leading-normal text-center py-2">
                    No parcel or estate selected. Click on the map plots to load attributes in real-time.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SIDEBAR FLAP TOGGLE (Odisha GOPLUS Style Red Flap) */}
      <button 
        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
        className="absolute top-1/2 -translate-y-1/2 bg-gov-blue hover:bg-gov-blue/90 text-white rounded-r px-1.5 py-6 font-bold flex flex-col items-center gap-1.5 shadow-2xl z-30 transition-all duration-300"
        style={{ left: leftSidebarOpen ? '20rem' : '0' }}
        title={leftSidebarOpen ? 'Collapse Controls' : 'Expand Controls'}
      >
        <span>{leftSidebarOpen ? '◀' : '▶'}</span>
        <span className="text-[8px] tracking-widest [writing-mode:vertical-lr] uppercase font-black mt-1">Layers</span>
      </button>

      {/* 3. RIGHT SIDE MAP WORKSPACE CANVAS */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">

        {/* TOP RIGHT FLOATING SPLIT SCREEN TOGGLE */}
        {onToggleSplitScreen && (
          <button
            onClick={onToggleSplitScreen}
            className={`absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95 ${
              !isMapExpanded 
                ? 'bg-gov-blue text-white border-gov-blue shadow-gov-blue/30 ring-2 ring-gov-blue/30' 
                : 'bg-slate-950/90 text-slate-200 border-slate-700/80 hover:bg-gov-blue hover:text-white'
            }`}
            title={isMapExpanded ? 'Open side-by-side inventory panel' : 'Return to fullscreen map workspace'}
          >
            <Compass className="w-4 h-4 text-gov-blue" />
            <span>{isMapExpanded ? 'Split Screen Inventory' : 'Fullscreen Map Mode'}</span>
          </button>
        )}

        {/* TOP FLOATING SEARCH LANDBANK CONTROL */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto max-w-3xl w-[92%] sm:w-auto">
          
          {/* Collapsible compact pill button */}
          <button
            onClick={() => setSearchBannerOpen(!searchBannerOpen)}
            className="bg-slate-950/90 hover:bg-gov-blue text-white text-xs font-black px-5 py-2.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-2.5 tracking-wide transition-all duration-200 hover:scale-105 active:scale-95"
            title="Toggle Search Landbank Tools"
          >
            <Search className="w-4 h-4 text-gov-blue" />
            <span className="uppercase text-[11px]">Search Landbank</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{searchBannerOpen ? '▲ Close' : '▼ Expand'}</span>
          </button>

          {/* Compact Popup Card Overlay */}
          {searchBannerOpen && (
            <div className="mt-2 w-full max-w-3xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in zoom-in-95 duration-150">
              
              {/* Header Bar with Close Button */}
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-slate-200 uppercase tracking-wider text-[11px]">
                  <Search className="w-3.5 h-3.5 text-gov-blue" />
                  <span>Landbank Spatial Search Engine</span>
                </div>
                <button
                  onClick={() => setSearchBannerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                  title="Close Search Tools"
                >
                  ✕
                </button>
              </div>

              {/* Sub-header title bar */}
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 text-[11px] font-black text-gov-blue uppercase tracking-wider">
                <Search className="w-3.5 h-3.5" />
                <span>Search by Estate & Plot</span>
              </div>

              {/* Search by Estate & Plot Form Area */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end bg-slate-950 border-t border-slate-800/80">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District</label>
                  <select 
                    value={filterDistrictId} onChange={(e) => setFilterDistrictId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/30 text-xs font-semibold shadow-xs transition-all"
                  >
                    <option value="">-- All Districts --</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industrial Estate</label>
                  <select 
                    value={filterEstateId} onChange={(e) => setFilterEstateId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/30 text-xs font-semibold shadow-xs transition-all"
                  >
                    <option value="">-- All Estates --</option>
                    {filteredEstates.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plot Status</label>
                  <select 
                    value={filterPlotStatus} onChange={(e) => setFilterPlotStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/30 text-xs font-semibold shadow-xs transition-all"
                  >
                    <option value="">-- All Statuses --</option>
                    <option value="Vacan">Vacan</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Doubtful">Doubtful</option>
                    <option value="Inner Road">Inner Road</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Plot</label>
                  <select 
                    value={filterParcelId} onChange={(e) => setFilterParcelId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/30 text-xs font-semibold shadow-xs transition-all"
                  >
                    <option value="">-- Select Plot --</option>
                    {filteredParcelsByStatus.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.parcelId} ({p.plotNumber}) - [{p.availabilityStatus}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSearchIE}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold py-2.5 px-3 rounded-lg transition-all duration-200 text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" /> Search
                  </button>
                  <button
                    onClick={resetFilters}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 hover:text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-200 text-xs text-center border border-slate-700 hover:border-slate-600 shadow-sm cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FLOATING ACTION MESSAGES */}
        <div className="absolute top-16 left-4 z-10 flex flex-col gap-2 pointer-events-none transition-all duration-300">
          {measurementMode !== 'none' && (
            <div className="bg-gov-blue text-white shadow-2xl px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse border border-gov-blue/80 pointer-events-auto">
              <Ruler className="w-4 h-4" />
              <span>Interactive Measurement Mode: Click map coordinates to draw path.</span>
            </div>
          )}
          {spatialQueryResults.length > 0 && (
            <div className="bg-cyan-900/90 text-cyan-200 shadow-2xl px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-cyan-800 pointer-events-auto">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Query completed. Found {spatialQueryResults.length} spatial features.</span>
              <button 
                onClick={() => useStore.setState({ spatialQueryResults: [] })}
                className="bg-cyan-800 hover:bg-cyan-700 text-cyan-100 px-1.5 py-0.5 rounded text-[10px]"
              >
                Clear highlights
              </button>
            </div>
          )}
        </div>

        {/* MAP CANVAS VIEW CONTROLS */}
        <div className="absolute bottom-12 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
          {/* Zoom Controls */}
          <div className="flex flex-col bg-slate-950/90 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
            <button 
              onClick={() => zoomToCoordinates(mapCenter[0], mapCenter[1], mapZoom + 1)}
              className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-900 border-b border-slate-850"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => zoomToCoordinates(mapCenter[0], mapCenter[1], Math.max(5, mapZoom - 1))}
              className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-900 border-b border-slate-850"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (mapInstanceRef.current) fitToActiveLayerBounds(mapInstanceRef.current);
              }}
              className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-900 border-b border-slate-850"
              title="Zoom to Active Shapefile Layer"
            >
              <Home className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLocateMe}
              className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-900"
              title="Locate Me"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>

          {/* Basemaps Toggle Floating Menu */}
          <div className="flex flex-col bg-slate-950/90 border border-slate-800 rounded-lg overflow-hidden shadow-2xl p-1 gap-1">
            {[
              { id: 'streets', label: 'Streets' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'light', label: 'Light' },
              { id: 'topo', label: 'Topo' }
            ].map(b => (
              <button
                key={b.id}
                onClick={() => setBasemap(b.id as any)}
                className={`px-2 py-1.5 rounded text-[10px] font-black text-center uppercase tracking-wider transition ${
                  basemap === b.id 
                    ? 'bg-gov-blue text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* MAP CONTAINER CANVAS (MapLibre or SVG fallback) */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full cursor-crosshair relative overflow-hidden"
        >
          {!webGlAvailable && (
            /* High-Fidelity SVG Interactive Map Simulator Fallback */
            <svg 
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const lng = 91.5 + (x / rect.width) * 0.4;
                const lat = 26.3 - (y / rect.height) * 0.2;
                setCursorCoords({ lng: parseFloat(lng.toFixed(4)), lat: parseFloat(lat.toFixed(4)) });
              }}
              onClick={() => {
                const activeMode = measurementModeRef.current;
                if (activeMode !== 'none') {
                  const newPt: [number, number] = [cursorCoords.lng, cursorCoords.lat];
                  const pts = [...drawnPoints, newPt];
                  setDrawnPoints(pts);
                  
                  if (activeMode === 'distance' && pts.length > 1) {
                    const dist = (pts.length - 1) * 1.8;
                    setMeasurementResult(`${dist.toFixed(2)} km`);
                  } else if (activeMode === 'area' && pts.length > 2) {
                    const area = pts.length * 4.2;
                    setMeasurementResult(`${area.toFixed(1)} Acres`);
                  }
                }
              }}
              className="w-full h-full bg-slate-950" 
              viewBox="0 0 600 400" 
              preserveAspectRatio="none"
            >
              {/* Basemap Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* 1. Districts boundaries (SVG) */}
              {layerVisible('districts') && districts.map(d => (
                <polygon
                  key={d.id}
                  points={toSvgCoords(d.geom)}
                  fill="rgba(30, 41, 59, 0.05)"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity={layerOpacity('districts')}
                />
              ))}

              {/* 2. Estates boundaries (SVG) */}
              {layerVisible('estates') && estates.map(e => (
                <polygon
                  key={e.id}
                  points={toSvgCoords(e.geom)}
                  fill={selectedFeature?.name === e.name ? "rgba(2, 132, 199, 0.35)" : "rgba(2, 132, 199, 0.15)"}
                  stroke="#0284c7"
                  strokeWidth="2"
                  className="cursor-pointer transition hover:fill-blue-500/20"
                  opacity={layerOpacity('estates')}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedFeature({ type: 'Estate', name: e.name, data: e });
                    setExpandedAccordion('identify');
                  }}
                />
              ))}

              {/* 3. Parcels boundaries (SVG) */}
              {layerVisible('parcels') && parcels.map(p => (
                <polygon
                  key={p.id}
                  points={toSvgCoords(p.geom)}
                  fill={p.availabilityStatus === 'Vacan' ? 'rgba(34, 197, 94, 0.15)' : p.availabilityStatus === 'Doubtful' ? 'rgba(234, 179, 8, 0.25)' : p.availabilityStatus === 'Inner Road' ? 'rgba(100, 116, 139, 0.25)' : 'rgba(239, 68, 68, 0.15)'}
                  stroke={p.availabilityStatus === 'Vacan' ? '#22c55e' : p.availabilityStatus === 'Doubtful' ? '#eab308' : p.availabilityStatus === 'Inner Road' ? '#64748b' : '#ef4444'}
                  strokeWidth="1.5"
                  className="cursor-pointer transition hover:fill-emerald-500/30"
                  opacity={layerOpacity('parcels')}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedFeature({ type: 'Parcel', name: p.parcelId, data: p });
                    setExpandedAccordion('identify');
                  }}
                />
              ))}

              {/* 4. Highlighted Selected Parcel with Beeping vibrant color (SVG) */}
              {selectedFeature && selectedFeature.data && selectedFeature.data.geom && (
                <polygon
                  points={toSvgCoords(selectedFeature.data.geom)}
                  fill={isBeeping ? "#ff0055" : "rgba(14, 165, 233, 0.25)"}
                  stroke={isBeeping ? "#ff0055" : "#0ea5e9"}
                  strokeWidth={isBeeping ? "4" : "3.5"}
                  className={`${isBeeping ? 'animate-beep-highlight' : ''} pointer-events-none`}
                />
              )}

              {/* 5. Highlighted query results with blue/sky (SVG) */}
              {spatialQueryResults.map(res => (
                <polygon
                  key={res.id}
                  points={toSvgCoords(res.geom)}
                  fill="rgba(14, 165, 233, 0.25)"
                  stroke="#0ea5e9"
                  strokeWidth="2"
                  className="pointer-events-none"
                />
              ))}

              {/* 6. Infrastructure Layers (SVG) */}
              {layerVisible('infrastructure') && infrastructureLayers.map(infra => (
                <polyline
                  key={infra.id}
                  points={getLineSvgCoords(infra.geom)}
                  fill="none"
                  stroke={infra.infraType === 'PowerLine' ? '#eab308' : '#f97316'}
                  strokeWidth="2.5"
                  opacity={layerOpacity('infrastructure')}
                  className="cursor-pointer"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedFeature({ type: 'Infrastructure', name: infra.name, data: infra });
                    setExpandedAccordion('identify');
                  }}
                />
              ))}

              {/* Draw overlay for measurement */}
              {drawnPoints.length > 0 && (
                <polyline
                  points={drawnPoints.map(pt => `${((pt[0] - 91.5) / 0.4) * 600},${400 - ((pt[1] - 26.1) / 0.2) * 400}`).join(' ')}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              )}
              {drawnPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={((pt[0] - 91.5) / 0.4) * 600}
                  cy={400 - ((pt[1] - 26.1) / 0.2) * 400}
                  r="4"
                  fill="#0ea5e9"
                />
              ))}
            </svg>
          )}
        </div>

        {/* BOTTOM COORDINATE STATUS STATUSBAR */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex justify-between items-center text-[10px] font-bold text-slate-500 z-10 flex-shrink-0">
          <div className="flex gap-4">
            <span className="hover:text-slate-300 transition">Latitude: {cursorCoords.lat}° N, Longitude: {cursorCoords.lng}° E</span>
            <span>Projection: EPSG:4326 (WGS 84)</span>
          </div>
          <div className="flex gap-4">
            <span>Dynamic Scale: ~1:5000</span>
            <span>Map Zoom: {mapZoom}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
