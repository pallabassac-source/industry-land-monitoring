import { create } from 'zustand';

// Types representing PRD v1.0 data schemas
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

export interface District {
  id: number;
  name: string;
  code: string;
  geom: string;
}

export interface Circle {
  id: number;
  districtId: number;
  name: string;
  code: string;
  geom: string;
}

export interface Village {
  id: number;
  circleId: number;
  name: string;
  code: string;
  geom: string;
}

export interface IndustrialEstate {
  id: number;
  districtId?: number;
  name: string;
  totalArea: number;
  allocatedArea: number;
  availableArea: number;
  powerCapacity: number;
  waterCapacity: number;
  gasPipeline: boolean;
  drainage: boolean;
  geom: string;
}

export interface LandParcel {
  id: number;
  estateId: number;
  parcelId: string;
  plotNumber: string;
  surveyNumber: string;
  villageId?: number;
  areaAcres: number;
  availabilityStatus: 'Vacan' | 'Occupied' | 'Doubtful' | 'Inner Road' | string;
  landClassification: string;
  ownershipDetails: string;
  infrastructureDetails: any;
  photoUrls: string[];
  geom: string;
}

export interface InfrastructureLayer {
  id: number;
  name: string;
  infraType: string;
  attributes: any;
  geom: string;
}

export interface GisLayer {
  id: number;
  name: string;
  displayName: string;
  category: string;
  layerType: 'Vector' | 'Raster';
  sourceType: 'PostGIS' | 'WMS' | 'MapServer' | 'GeoTIFF';
  isPublished: boolean;
  isVisible: boolean;
  opacity: number;
  styleConfig: any;
  metadata?: any;
}

export interface DroneSurveyLayerItem {
  id: number;
  estate: number | null;
  estate_name: string | null;
  estate_title?: string | null;
  title: string;
  survey_date: string | null;
  tile_directory: string;
  tile_url_pattern: string;
  min_zoom: number;
  max_zoom: number;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  footprint_geojson?: any; // Exact non-rectangular polygon geometry
  raw_file_size_mb: number;
  resolution_cm_per_px: number;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  error_message?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  username: string;
  actionType: string;
  clientIp: string;
  actionDetails: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export interface SystemSettings {
  defaultCrs: string;
  mapCenterLat: number;
  mapCenterLng: number;
  mapDefaultZoom: number;
  maxUploadSizeMb: number;
}

interface PortalState {
  // Auth Session State
  currentUser: User | null;
  currentRole: string;
  token: string | null;
  login: (username: string, password_hash: string) => Promise<boolean>;
  logout: () => void;

  // GIS Workspace Map States
  basemap: 'satellite' | 'drone';
  layers: GisLayer[];
  selectedFeature: any | null;
  measurementMode: 'none' | 'distance' | 'area';
  measurementResult: string | null;
  bookmarks: Bookmark[];
  mapCenter: [number, number];
  mapZoom: number;
  setBasemap: (mapType: 'satellite' | 'drone') => void;
  loadLayers: () => Promise<void>;
  toggleLayerVisibility: (layerId: number) => void;
  setLayerOpacity: (layerId: number, opacity: number) => void;
  deleteLayer: (layerId: number) => Promise<void>;
  updateLayer: (layerId: number, updatedFields: Partial<GisLayer>) => Promise<void>;
  setSelectedFeature: (feature: any | null) => void;
  setMeasurementMode: (mode: 'none' | 'distance' | 'area') => void;
  setMeasurementResult: (res: string | null) => void;
  addBookmark: (name: string) => void;
  deleteBookmark: (id: string) => void;
  zoomToCoordinates: (lng: number, lat: number, zoom?: number) => void;

  // Spatial Query Builder State
  spatialQueryType: 'buffer' | 'intersects' | 'within' | 'contains' | 'touches' | 'overlaps' | 'nearest' | 'distance';
  spatialQueryLayer: string;
  spatialQueryBufferMeters: number;
  spatialQueryResults: any[];
  runSpatialQuery: (geomWkt: string | null, attributeFilters?: any[] | null) => Promise<void>;
  setSpatialQueryType: (type: 'buffer' | 'intersects' | 'within' | 'contains' | 'touches' | 'overlaps' | 'nearest' | 'distance') => void;
  setSpatialQueryLayer: (layer: string) => void;
  setSpatialQueryBufferMeters: (meters: number) => void;

  // Land & Estate Inventory State
  estates: IndustrialEstate[];
  parcels: LandParcel[];
  selectedEstate: IndustrialEstate | null;
  selectedParcel: LandParcel | null;
  searchQuery: string;
  searchResults: any[];
  loadInventory: () => Promise<void>;
  selectEstate: (estate: IndustrialEstate | null) => void;
  selectParcel: (parcel: LandParcel | null) => void;
  triggerSearch: (q: string) => Promise<void>;
  saveParcel: (parcelData: Partial<LandParcel>) => Promise<boolean>;

  // Administrative Boundary States
  districts: District[];
  circles: Circle[];
  villages: Village[];
  loadBoundaries: () => Promise<void>;

  // Infrastructure Layers
  infrastructureLayers: InfrastructureLayer[];
  loadInfrastructure: () => Promise<void>;

  // Dashboard Stats State
  stats: {
    totalEstates: number;
    totalParcels: number;
    availableLandAcres: number;
    occupiedLandAcres: number;
    classifications: Record<string, number>;
  };
  loadDashboardStats: () => Promise<void>;

  // Audit Logs State
  auditLogs: AuditLog[];
  loadAuditLogs: (actionType?: string) => Promise<void>;
  addAuditLogEntry: (actionType: string, details: string) => void;

  // Settings State
  settings: SystemSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;

  // Ingestion Spatial Upload Engine
  uploadGisLayer: (payload: File | { shp?: File; dbf?: File; shx?: File; prj?: File }, layerName: string) => Promise<any>;
  uploadGisLayerChunked: (
    file: File, 
    layerName: string, 
    options?: {
      chunkSizeMB?: number;
      delayMs?: number;
      onProgress?: (progress: ChunkProgressInfo) => void;
    }
  ) => Promise<any>;

  // High-Resolution Drone Imagery State & Actions
  droneLayers: DroneSurveyLayerItem[];
  activeDroneLayerId: number | null;
  droneLayerOpacity: number;
  showDroneLayer: boolean;
  loadDroneLayers: () => Promise<void>;
  pollDroneLayersUntilReady: (targetLayerId?: number) => void;
  uploadDroneImagery: (file: File, estateId?: number, title?: string, surveyDate?: string) => Promise<any>;
  uploadDroneImageryChunked: (
    file: File, 
    estateId?: number, 
    title?: string, 
    surveyDate?: string,
    options?: {
      chunkSizeMB?: number;
      delayMs?: number;
      onProgress?: (progress: ChunkProgressInfo) => void;
    }
  ) => Promise<any>;
  toggleDroneLayer: (id: number | null) => void;
  setShowDroneLayer: (show: boolean) => void;
  setDroneLayerOpacity: (opacity: number) => void;
  deleteDroneLayer: (id: number) => Promise<void>;

  // External Integration framework sync
  adapters: any[];
  syncExternalAdapter: (adapterName: string) => Promise<any>;
}

export interface ChunkProgressInfo {
  percent: number;
  currentChunk: number;
  totalChunks: number;
  uploadedBytes: number;
  totalBytes: number;
  retries: number;
  statusText: string;
  isRetrying?: boolean;
}

// Live Database Datasets
const MOCK_DISTRICTS: District[] = [];
const MOCK_CIRCLES: Circle[] = [];
const MOCK_VILLAGES: Village[] = [];

const MOCK_ESTATES: IndustrialEstate[] = [];
const MOCK_PARCELS: LandParcel[] = [];
const MOCK_INFRA: InfrastructureLayer[] = [];
const MOCK_AUDIT: AuditLog[] = [];

// Core System Layers available in the GIS Control Panel
const CORE_SYSTEM_LAYERS: GisLayer[] = [
  {
    id: 9901,
    name: 'estates',
    displayName: 'Industrial Estate Boundaries',
    category: 'Core Layers',
    layerType: 'Vector',
    sourceType: 'PostGIS',
    isPublished: true,
    isVisible: true,
    opacity: 0.9,
    styleConfig: { outline: '#0284c7', fill: 'rgba(2, 132, 199, 0.12)' }
  },
  {
    id: 9902,
    name: 'parcels',
    displayName: 'Land Parcels & Plot Outlines',
    category: 'Core Layers',
    layerType: 'Vector',
    sourceType: 'PostGIS',
    isPublished: true,
    isVisible: true,
    opacity: 0.85,
    styleConfig: { outline: '#22c55e', fill: 'rgba(34, 197, 94, 0.22)' }
  },
  {
    id: 9903,
    name: 'districts',
    displayName: 'Administrative Boundaries',
    category: 'Core Layers',
    layerType: 'Vector',
    sourceType: 'PostGIS',
    isPublished: true,
    isVisible: true,
    opacity: 0.85,
    styleConfig: { outline: '#475569', fill: 'rgba(30, 41, 59, 0.03)' }
  },
  {
    id: 9904,
    name: 'infrastructure',
    displayName: 'Infrastructure Networks',
    category: 'Core Layers',
    layerType: 'Vector',
    sourceType: 'PostGIS',
    isPublished: true,
    isVisible: true,
    opacity: 0.85,
    styleConfig: { outline: '#eab308', fill: 'rgba(234, 179, 8, 0.2)' }
  }
];

const MOCK_ADAPTERS = [
  { id: 1, name: 'DPIIT National Land Bank Adapter', isEnabled: false, lastSync: 'N/A' },
  { id: 2, name: 'Assam Single Window EoDB Gateway', isEnabled: false, lastSync: 'N/A' },
  { id: 3, name: 'Revenue Dept Land Registry Adapter', isEnabled: false, lastSync: 'N/A' }
];

// Restore session from localStorage if available
const getSavedSession = () => {
  if (typeof window === 'undefined') return { user: null, role: 'General Government User', token: null };
  try {
    const raw = localStorage.getItem('gis_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.currentUser && parsed.token && !parsed.token.startsWith('mock-')) {
        return {
          user: parsed.currentUser,
          role: parsed.currentRole || 'Super Administrator',
          token: parsed.token
        };
      }
    }
  } catch (e) {}
  return { user: null, role: 'General Government User', token: null };
};

const initialSession = getSavedSession();

export const useStore = create<PortalState>((set, get) => ({
  // Auth Store
  currentUser: initialSession.user,
  currentRole: initialSession.role,
  token: initialSession.token,
  login: async (username, password) => {
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        const userObj = {
          id: data.user.id,
          username: data.user.username,
          fullName: data.user.full_name || data.user.username,
          email: data.user.email,
          role: data.user.role_name
        };
        set({
          currentUser: userObj,
          currentRole: data.user.role_name,
          token: data.access
        });
        localStorage.setItem('gis_session', JSON.stringify({
          currentUser: userObj,
          currentRole: data.user.role_name,
          token: data.access
        }));
        get().addAuditLogEntry('LOGIN', `User ${data.user.username} logged in successfully.`);
        return true;
      }
    } catch (e) {
      console.error("Backend auth error:", e);
    }
    return false;
  },
  logout: () => {
    get().addAuditLogEntry('LOGOUT', `User ${get().currentUser?.username} logged out.`);
    localStorage.removeItem('gis_session');
    set({ currentUser: null, currentRole: 'General Government User', token: null });
  },

  // Map settings
  basemap: 'satellite',
  layers: CORE_SYSTEM_LAYERS,
  selectedFeature: null,
  measurementMode: 'none',
  measurementResult: null,
  bookmarks: [],
  mapCenter: [92.465, 26.481],
  mapZoom: 15,
  setBasemap: (mapType) => set({ basemap: mapType }),
  loadLayers: async () => {
    try {
      const res = await fetch('/api/gis/layers/');
      if (res.ok) {
        const data = await res.json();
        const customLayers = data.map((l: any) => ({
          id: l.id,
          name: l.name,
          displayName: l.display_name,
          category: l.category_name || 'Uploaded PostGIS Layers',
          layerType: l.layer_type,
          sourceType: l.source_type,
          isPublished: l.is_published,
          isVisible: true,
          opacity: 0.85,
          styleConfig: l.style_config || { outline: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)' }
        }));
        set({ layers: [...CORE_SYSTEM_LAYERS, ...customLayers] });
      }
    } catch (e) {
      console.error("Error loading layers from database:", e);
    }
  },
  toggleLayerVisibility: (layerId) => set((state) => ({
    layers: state.layers.map((l) => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l)
  })),
  setLayerOpacity: (layerId, opacity) => set((state) => ({
    layers: state.layers.map((l) => l.id === layerId ? { ...l, opacity } : l)
  })),
  deleteLayer: async (layerId) => {
    const targetLayer = get().layers.find(l => l.id === layerId);
    if (layerId < 9000) {
      try {
        await fetch(`/api/gis/layers/${layerId}/`, { method: 'DELETE' });
      } catch (e) {}
    }
    set((state) => ({
      layers: state.layers.filter(l => l.id !== layerId)
    }));
    await get().loadLayers();
    await get().loadInventory();
    await get().loadDashboardStats();
    get().addAuditLogEntry('DELETE_LAYER', `Deleted layer catalog ID ${layerId} (${targetLayer?.displayName || 'Unknown'}).`);
  },
  updateLayer: async (layerId, updatedFields) => {
    try {
      await fetch(`/api/gis/layers/${layerId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (e) {}
    set((state) => ({
      layers: state.layers.map((l) => l.id === layerId ? { ...l, ...updatedFields } : l)
    }));
  },
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  setMeasurementMode: (mode) => set({ measurementMode: mode, measurementResult: null }),
  setMeasurementResult: (res) => set({ measurementResult: res }),
  addBookmark: (name) => set((state) => ({
    bookmarks: [...state.bookmarks, { id: Math.random().toString(), name, center: state.mapCenter, zoom: state.mapZoom }]
  })),
  deleteBookmark: (id) => set((state) => ({
    bookmarks: state.bookmarks.filter((b) => b.id !== id)
  })),
  zoomToCoordinates: (lng, lat, zoom = 14) => set({ mapCenter: [lng, lat], mapZoom: zoom }),

  // Spatial query
  spatialQueryType: 'buffer',
  spatialQueryLayer: 'parcels',
  spatialQueryBufferMeters: 500,
  spatialQueryResults: [],
  runSpatialQuery: async (geomWkt, attributeFilters = null) => {
    // Attempt backend query
    try {
      const res = await fetch('/api/gis/query/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().token}`
        },
        body: JSON.stringify({
          query_type: geomWkt ? get().spatialQueryType : 'intersects',
          layer_name: get().spatialQueryLayer,
          geom_wkt: geomWkt || undefined,
          distance_meters: geomWkt ? get().spatialQueryBufferMeters : undefined,
          attribute_filters: attributeFilters || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        set({ spatialQueryResults: data.features });
        return;
      }
    } catch (e) {
      console.warn("Backend GIS spatial engine offline. Running frontend simulation...");
    }

    // Mock local spatial/attribute filter fallback
    let matches = get().parcels;
    if (attributeFilters && Array.isArray(attributeFilters)) {
      for (const cond of attributeFilters) {
        const { field, operator, value } = cond;
        if (!field || !operator || value === undefined) continue;
        matches = matches.filter(p => {
          // Map snake_case from query field to camelCase in local state
          const camelField = field.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())
                                  .replace('parcelId', 'parcelId')
                                  .replace('areaAcres', 'areaAcres')
                                  .replace('availabilityStatus', 'availabilityStatus')
                                  .replace('landClassification', 'landClassification')
                                  .replace('ownershipDetails', 'ownershipDetails');
          const val = (p as any)[camelField];
          if (val === undefined) return false;
          const strVal = String(val).toLowerCase();
          const targetVal = String(value).toLowerCase();
          if (operator === '=') return strVal === targetVal;
          if (operator === '>') return Number(val) > Number(value);
          if (operator === '<') return Number(val) < Number(value);
          if (operator === '>=') return Number(val) >= Number(value);
          if (operator === '<=') return Number(val) <= Number(value);
          if (operator === 'contains' || operator === 'like') return strVal.includes(targetVal);
          return true;
        });
      }
    } else {
      // Basic spatial mock
      matches = get().parcels.slice(0, 2);
    }

    const bounds = matches.map(p => ({
      id: p.id,
      geojson: { 
        type: 'Feature', 
        geometry: p.geom.startsWith('POLYGON') ? {
          type: 'Polygon',
          coordinates: [p.geom.match(/\(\((.*?)\)\)/)?.[1].split(',').map(pair => pair.trim().split(' ').map(Number)) || []]
        } : JSON.parse('{"type":"Polygon","coordinates":[[[91.761,26.176],[91.768,26.176],[91.768,26.182],[91.761,26.182],[91.761,26.176]]]}')
      },
      parcel_id: p.parcelId,
      plot_number: p.plotNumber,
      area_acres: p.areaAcres,
      availability_status: p.availabilityStatus,
      land_classification: p.landClassification
    }));
    set({ spatialQueryResults: bounds });
  },
  setSpatialQueryType: (type) => set({ spatialQueryType: type }),
  setSpatialQueryLayer: (layer) => set({ spatialQueryLayer: layer }),
  setSpatialQueryBufferMeters: (meters) => set({ spatialQueryBufferMeters: meters }),

  // Land Inventory
  estates: MOCK_ESTATES,
  parcels: MOCK_PARCELS,
  selectedEstate: null,
  selectedParcel: null,
  searchQuery: '',
  searchResults: [],
  loadInventory: async () => {
    try {
      const resEst = await fetch('/api/estates/');
      if (resEst.ok) {
        const estatesData = await resEst.json();
        if (Array.isArray(estatesData)) {
          set({ estates: estatesData.map((e: any) => ({
            id: e.id,
            name: e.name,
            totalArea: parseFloat(e.total_area_acres),
            allocatedArea: parseFloat(e.allocated_area_acres),
            availableArea: parseFloat(e.available_area_acres),
            powerCapacity: parseFloat(e.power_capacity_mw),
            waterCapacity: parseFloat(e.water_capacity_mld),
            gasPipeline: e.gas_pipeline_available,
            drainage: e.drainage_available,
            geom: e.geom
          })) });
        }
      }
      const resPar = await fetch('/api/parcels/');
      if (resPar.ok) {
        const parcelsData = await resPar.json();
        if (Array.isArray(parcelsData)) {
          set({ parcels: parcelsData.map((p: any) => ({
            id: p.id,
            estateId: p.estate,
            parcelId: p.parcel_id,
            plotNumber: p.plot_number,
            surveyNumber: p.survey_number,
            villageId: p.village,
            areaAcres: parseFloat(p.area_acres),
            availabilityStatus: p.availability_status,
            landClassification: p.land_classification,
            ownershipDetails: p.ownership_details,
            infrastructureDetails: p.infrastructure_details,
            photoUrls: p.photo_urls,
            geom: p.geom
          })) });
        }
      }
    } catch (e) {
      console.warn("Backend API offline. Using preloaded inventory state.");
    }
  },
  selectEstate: (estate) => set({ selectedEstate: estate }),
  selectParcel: (parcel) => set({ selectedParcel: parcel }),
  triggerSearch: async (q) => {
    set({ searchQuery: q });
    if (!q.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const res = await fetch(`/api/search/?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          set({ searchResults: data });
          return;
        }
      }
    } catch (e) {}

    // Dynamic search over active loaded inventory state
    const parcels = get().parcels;
    const estates = get().estates;
    const qLower = q.toLowerCase().trim();

    const filtered: any[] = [];

    // Search in parcels
    parcels.forEach(p => {
      const pId = (p.parcelId || '').toLowerCase();
      const plotNo = (p.plotNumber || '').toLowerCase();
      const survNo = (p.surveyNumber || '').toLowerCase();
      const status = (p.availabilityStatus || '').toLowerCase();
      const landClass = (p.landClassification || '').toLowerCase();

      if (pId.includes(qLower) || plotNo.includes(qLower) || survNo.includes(qLower) || status.includes(qLower) || landClass.includes(qLower)) {
        filtered.push({
          id: p.id,
          parcel_id: p.parcelId,
          plot_number: p.plotNumber,
          survey_number: p.surveyNumber,
          title: `${p.parcelId} (${p.plotNumber})`,
          type: 'Parcel',
          status: p.availabilityStatus,
          details: `Area: ${p.areaAcres} Acres | Status: ${p.availabilityStatus} | Survey: ${p.surveyNumber || 'N/A'}`,
          geom: p.geom,
          data: p
        });
      }
    });

    // Search in industrial estates
    estates.forEach(e => {
      const eName = (e.name || '').toLowerCase();
      if (eName.includes(qLower)) {
        filtered.push({
          id: e.id,
          title: e.name,
          type: 'Industrial Estate',
          status: 'Estate',
          details: `Total Area: ${e.totalArea} Acres | Vacan: ${e.availableArea} Acres`,
          geom: e.geom,
          data: e
        });
      }
    });

    set({ searchResults: filtered });
  },
  saveParcel: async (parcelData) => {
    try {
      const method = parcelData.id ? 'PUT' : 'POST';
      const url = parcelData.id ? `/api/parcels/${parcelData.id}/` : '/api/parcels/';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().token}`
        },
        body: JSON.stringify({
          estate: parcelData.estateId,
          parcel_id: parcelData.parcelId,
          plot_number: parcelData.plotNumber,
          survey_number: parcelData.surveyNumber,
          area_acres: parcelData.areaAcres,
          availability_status: parcelData.availabilityStatus,
          land_classification: parcelData.landClassification,
          ownership_details: parcelData.ownershipDetails,
          geom: parcelData.geom || 'POLYGON((91.761 26.176, 91.768 26.176, 91.768 26.182, 91.761 26.182, 91.761 26.176))'
        })
      });
      if (res.ok) {
        await get().loadInventory();
        get().addAuditLogEntry('MODIFY_PARCEL', `Modified land parcel ${parcelData.parcelId}`);
        return true;
      }
    } catch (e) {}

    // Fallback Mock save
    if (parcelData.id) {
      set((state) => ({
        parcels: state.parcels.map((p) => p.id === parcelData.id ? { ...p, ...parcelData } as LandParcel : p)
      }));
    } else {
      const newP: LandParcel = {
        id: Math.floor(Math.random() * 1000),
        estateId: parcelData.estateId || 1,
        parcelId: parcelData.parcelId || 'LP-NEW',
        plotNumber: parcelData.plotNumber || 'Plot New',
        surveyNumber: parcelData.surveyNumber || 'Survey New',
        areaAcres: parcelData.areaAcres || 10,
        availabilityStatus: parcelData.availabilityStatus || 'Vacan',
        landClassification: parcelData.landClassification || 'General',
        ownershipDetails: parcelData.ownershipDetails || 'Government',
        infrastructureDetails: {},
        photoUrls: [],
        geom: parcelData.geom || 'POLYGON((91.761 26.176, 91.768 26.176, 91.768 26.182, 91.761 26.182, 91.761 26.176))'
      };
      set((state) => ({ parcels: [...state.parcels, newP] }));
    }
    get().addAuditLogEntry('MODIFY_PARCEL', `Modified land parcel ${parcelData.parcelId} in local state.`);
    return true;
  },

  // Boundaries
  districts: MOCK_DISTRICTS,
  circles: MOCK_CIRCLES,
  villages: MOCK_VILLAGES,
  loadBoundaries: async () => {
    try {
      const resDist = await fetch('/api/boundaries/?type=district');
      if (resDist.ok) {
        const data = await resDist.json();
        set({ districts: data });
      }
    } catch (e) {}
  },

  // Infrastructure Layers
  infrastructureLayers: MOCK_INFRA,
  loadInfrastructure: async () => {
    try {
      const res = await fetch('/api/infrastructure/');
      if (res.ok) {
        const data = await res.json();
        set({ infrastructureLayers: data.map((i: any) => ({
          id: i.id,
          name: i.name,
          infraType: i.infra_type,
          attributes: i.attributes,
          geom: i.geom
        })) });
      }
    } catch (e) {}
  },

  // Dashboard Stats
  stats: {
    totalEstates: 0,
    totalParcels: 0,
    availableLandAcres: 0,
    occupiedLandAcres: 0,
    classifications: {}
  },
  loadDashboardStats: async () => {
    try {
      const res = await fetch('/api/dashboard/stats/');
      if (res.ok) {
        const data = await res.json();
        set({ stats: {
          totalEstates: data.total_estates || 0,
          totalParcels: data.total_parcels || 0,
          availableLandAcres: data.available_land_acres || 0,
          occupiedLandAcres: data.occupied_land_acres || 0,
          classifications: data.classifications || {}
        }});
        return;
      }
    } catch (e) {}

    // Fallback: Compute dynamic stats from local state inventory
    const parcels = get().parcels;
    const estates = get().estates;
    const available = parcels.filter(p => p.availabilityStatus === 'Vacan').reduce((acc, p) => acc + (p.areaAcres || 0), 0);
    const occupied = parcels.filter(p => p.availabilityStatus === 'Occupied').reduce((acc, p) => acc + (p.areaAcres || 0), 0);
    
    const classifications: Record<string, number> = {};
    parcels.forEach(p => {
      const c = p.landClassification || 'General';
      classifications[c] = (classifications[c] || 0) + 1;
    });

    set({
      stats: {
        totalEstates: estates.length,
        totalParcels: parcels.length,
        availableLandAcres: available,
        occupiedLandAcres: occupied,
        classifications
      }
    });
  },

  // Audit Logs
  auditLogs: MOCK_AUDIT,
  loadAuditLogs: async (actionType) => {
    try {
      let url = '/api/audit-logs/';
      if (actionType) url += `?action=${actionType}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${get().token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ auditLogs: data.map((l: any) => ({
          id: l.id,
          username: l.username,
          actionType: l.action_type,
          clientIp: l.client_ip,
          actionDetails: l.action_details,
          createdAt: l.created_at
        })) });
      }
    } catch (e) {}
  },
  addAuditLogEntry: (actionType, details) => {
    const newEntry: AuditLog = {
      id: Math.floor(Math.random() * 10000),
      username: get().currentUser?.username || 'anonymous',
      actionType,
      clientIp: '127.0.0.1',
      actionDetails: details,
      createdAt: new Date().toISOString()
    };
    set((state) => ({ auditLogs: [newEntry, ...state.auditLogs] }));
  },

  // Settings
  settings: {
    defaultCrs: 'EPSG:4326',
    mapCenterLat: 26.18,
    mapCenterLng: 91.76,
    mapDefaultZoom: 12,
    maxUploadSizeMb: 50
  },
  loadSettings: async () => {
    try {
      const res = await fetch('/api/settings/');
      if (res.ok) {
        const data = await res.json();
        const config: any = {};
        data.forEach((s: any) => {
          config[s.setting_key] = s.setting_value;
        });
        set({ settings: {
          defaultCrs: config.DEFAULT_CRS || 'EPSG:4326',
          mapCenterLat: parseFloat(config.MAP_CENTER_LAT || '26.18'),
          mapCenterLng: parseFloat(config.MAP_CENTER_LNG || '91.76'),
          mapDefaultZoom: parseInt(config.MAP_DEFAULT_ZOOM || '12'),
          maxUploadSizeMb: parseInt(config.MAX_UPLOAD_SIZE_MB || '50')
        }});
      }
    } catch (e) {}
  },
  updateSettings: async (newSettings) => {
    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
    try {
      const payload: any = {};
      if (newSettings.defaultCrs) payload.DEFAULT_CRS = newSettings.defaultCrs;
      if (newSettings.mapCenterLat) payload.MAP_CENTER_LAT = newSettings.mapCenterLat.toString();
      if (newSettings.mapCenterLng) payload.MAP_CENTER_LNG = newSettings.mapCenterLng.toString();
      if (newSettings.mapDefaultZoom) payload.MAP_DEFAULT_ZOOM = newSettings.mapDefaultZoom.toString();
      if (newSettings.maxUploadSizeMb) payload.MAX_UPLOAD_SIZE_MB = newSettings.maxUploadSizeMb.toString();
      
      await fetch('/api/settings/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  },

  // Upload GIS Layer
  uploadGisLayer: async (payload, layerName) => {
    const formData = new FormData();
    formData.append('layer_name', layerName);

    let isComponentUpload = false;
    let fileName = layerName;

    if (payload instanceof File) {
      formData.append('file', payload);
      fileName = payload.name;
    } else {
      isComponentUpload = true;
      if (payload.shp) formData.append('file_shp', payload.shp);
      if (payload.dbf) formData.append('file_dbf', payload.dbf);
      if (payload.shx) formData.append('file_shx', payload.shx);
      if (payload.prj) formData.append('file_prj', payload.prj);
      fileName = payload.shp ? payload.shp.name : `${layerName}.shp`;
    }

    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch('/api/gis/upload/', {
        method: 'POST',
        headers,
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        await get().loadLayers();
        await get().loadInventory();
        await get().loadDashboardStats();
        if (data.center_lng && data.center_lat) {
          set({ mapCenter: [data.center_lng, data.center_lat], mapZoom: 15 });
        }
        get().addAuditLogEntry('UPLOAD_GIS', `Uploaded and registered spatial dataset: ${layerName}`);
        return data;
      }
    } catch (e) {
      console.error("GIS upload request error:", e);
    }

    // Fallback report if backend is offline
    const mockReport = {
      file_name: fileName,
      format: isComponentUpload ? 'SHP (Direct Components)' : fileName.split('.').pop()?.toUpperCase() || 'ZIP',
      crs_detected: 'EPSG:4326',
      geometry_type: 'Polygon',
      total_features: 0,
      valid_features: 0,
      invalid_features_repaired: 0,
      is_valid: false,
      errors: ['Backend spatial ingestion offline'],
      center_lat: 26.49,
      center_lng: 91.15
    };

    get().addAuditLogEntry('UPLOAD_GIS', `Uploaded spatial dataset error: ${layerName}`);
    return mockReport;
  },

  // Integration Sync adapters
  adapters: MOCK_ADAPTERS,
  syncExternalAdapter: async (adapterName) => {
    try {
      const res = await fetch('/api/sync/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().token}`
        },
        body: JSON.stringify({ adapter_name: adapterName })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // Mock sync
    get().addAuditLogEntry('SYNC_EXTERNAL', `Triggered external sync adapter for: ${adapterName} via mock.`);
    return {
      status: 'Completed',
      system: adapterName,
      features_processed: 12,
      details: 'Mock OGC synchronization adapter completed.'
    };
  },

  // High-Resolution Drone Imagery State & Actions
  droneLayers: [],
  activeDroneLayerId: null,
  droneLayerOpacity: 1.0,
  showDroneLayer: true,

  loadDroneLayers: async () => {
    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch('/api/drone-layers/', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          set({ droneLayers: data });
          // If no active layer selected, default to the first READY one
          if (get().activeDroneLayerId === null && data.length > 0) {
            const firstReady = data.find(l => l.status === 'READY' && l.is_active);
            if (firstReady) {
              set({ activeDroneLayerId: firstReady.id });
            }
          }
          // If any layer is currently PENDING or PROCESSING, auto-start background polling
          const hasPending = data.some(l => l.status === 'PENDING' || l.status === 'PROCESSING');
          if (hasPending) {
            get().pollDroneLayersUntilReady();
          }
        }
      }
    } catch (e) {
      console.warn("Could not load drone layers from backend:", e);
    }
  },

  pollDroneLayersUntilReady: (targetLayerId?: number) => {
    if ((window as any).__dronePollInterval && !targetLayerId) {
      return;
    }
    clearInterval((window as any).__dronePollInterval);

    let attempts = 0;
    const maxAttempts = 120; // 5 minutes max

    (window as any).__dronePollInterval = setInterval(async () => {
      attempts++;
      try {
        const headers: Record<string, string> = {};
        if (get().token) headers['Authorization'] = `Bearer ${get().token}`;
        const res = await fetch('/api/drone-layers/', { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            set({ droneLayers: data });

            if (targetLayerId) {
              const target = data.find(l => l.id === targetLayerId);
              if (target && target.status === 'READY') {
                set({ activeDroneLayerId: target.id, showDroneLayer: true });
              }
            }

            const hasPending = data.some(l => l.status === 'PENDING' || l.status === 'PROCESSING');
            if (!hasPending || attempts >= maxAttempts) {
              clearInterval((window as any).__dronePollInterval);
              (window as any).__dronePollInterval = null;
            }
          }
        }
      } catch (e) {
        if (attempts >= maxAttempts) {
          clearInterval((window as any).__dronePollInterval);
          (window as any).__dronePollInterval = null;
        }
      }
    }, 2500);
  },

  uploadDroneImagery: async (file, estateId, title, surveyDate) => {
    const formData = new FormData();
    formData.append('file', file);
    if (estateId) formData.append('estate_id', String(estateId));
    if (title) formData.append('title', title);
    if (surveyDate) formData.append('survey_date', surveyDate);

    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch('/api/upload/drone-imagery/', {
        method: 'POST',
        headers,
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        // Immediately select this new layer and ensure drone survey layer is ON
        if (data.layer_id) {
          set({
            activeDroneLayerId: data.layer_id,
            showDroneLayer: true
          });
        }
        await get().loadDroneLayers();
        get().pollDroneLayersUntilReady(data.layer_id);
        get().addAuditLogEntry('UPLOAD_DRONE_TIFF', `Uploaded GeoTIFF drone survey: ${title || file.name}`);
        return data;
      } else {
        let errorMsg = `Server returned ${res.status} (${res.statusText || 'Error'})`;
        if (res.status === 413) {
          errorMsg = `File exceeds server upload size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
        } else {
          try {
            const errData = await res.json();
            if (errData && errData.error) errorMsg = errData.error;
          } catch {
            const text = await res.text().catch(() => '');
            if (text && text.length < 150 && !text.includes('<html')) errorMsg = text;
          }
        }
        throw new Error(errorMsg);
      }
    } catch (e: any) {
      console.error("Drone GeoTIFF upload error:", e);
      throw e;
    }
  },

  toggleDroneLayer: (id) => {
    set({ activeDroneLayerId: id });
  },

  setShowDroneLayer: (show) => {
    set({ showDroneLayer: show });
  },

  setDroneLayerOpacity: (opacity) => {
    set({ droneLayerOpacity: opacity });
  },

  deleteDroneLayer: async (id) => {
    try {
      const headers: Record<string, string> = {};
      if (get().token) {
        headers['Authorization'] = `Bearer ${get().token}`;
      }
      const res = await fetch(`/api/drone-layers/${id}/`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        const remaining = get().droneLayers.filter(l => l.id !== id);
        const nextActive = remaining.find(l => l.status === 'READY') || remaining[0] || null;
        set({
          droneLayers: remaining,
          activeDroneLayerId: get().activeDroneLayerId === id ? (nextActive ? nextActive.id : null) : get().activeDroneLayerId,
          showDroneLayer: remaining.length === 0 ? false : get().showDroneLayer
        });
        await get().loadDroneLayers();
        get().addAuditLogEntry('DELETE_DRONE_LAYER', `Deleted drone survey layer #${id}`);
      }
    } catch (e) {
      console.error("Error deleting drone survey layer:", e);
    }
  },

  // WAF-Friendly, Rate-Limit Safe Chunked Upload Actions
  uploadDroneImageryChunked: async (file, estateId, title, surveyDate, options) => {
    const data = await uploadFileInChunks(
      file,
      'drone',
      {
        estate_id: estateId,
        title: title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        survey_date: surveyDate || new Date().toISOString().split('T')[0]
      },
      get().token,
      options
    );

    if (data.layer_id) {
      set({
        activeDroneLayerId: data.layer_id,
        showDroneLayer: true
      });
    }
    await get().loadDroneLayers();
    get().pollDroneLayersUntilReady(data.layer_id);
    get().addAuditLogEntry('UPLOAD_DRONE_TIFF_CHUNKED', `Uploaded chunked GeoTIFF drone survey: ${title || file.name}`);
    return data;
  },

  uploadGisLayerChunked: async (file, layerName, options) => {
    const data = await uploadFileInChunks(
      file,
      'vector',
      { layer_name: layerName },
      get().token,
      options
    );

    await get().loadLayers();
    await get().loadInventory();
    await get().loadDashboardStats();
    if (data.center_lng && data.center_lat) {
      set({ mapCenter: [data.center_lng, data.center_lat], mapZoom: 15 });
    }
    get().addAuditLogEntry('UPLOAD_GIS_CHUNKED', `Uploaded chunked spatial dataset: ${layerName}`);
    return data;
  }
}));

// Resilient Chunked Uploader with Exponential Backoff & Anti-DDoS Pacing
async function uploadFileInChunks(
  file: File,
  fileType: 'drone' | 'vector',
  metadata: Record<string, any>,
  token: string | null,
  options?: {
    chunkSizeMB?: number;
    delayMs?: number;
    onProgress?: (progress: ChunkProgressInfo) => void;
  }
) {
  const chunkSizeMB = options?.chunkSizeMB || 25; // Default 25 MB - optimal for WAFs
  const chunkSize = chunkSizeMB * 1024 * 1024;
  const delayMs = options?.delayMs !== undefined ? options.delayMs : 200; // 200ms anti-DDoS pacing
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });

  let uploadedBytes = 0;
  let totalRetries = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append('upload_id', uploadId);
    formData.append('chunk_index', String(chunkIndex));
    formData.append('total_chunks', String(totalChunks));
    formData.append('file_name', file.name);
    formData.append('file_type', fileType);
    formData.append('chunk', chunkBlob, file.name);

    let chunkUploaded = false;
    let retryAttempt = 0;
    const MAX_RETRIES = 4;

    while (!chunkUploaded && retryAttempt <= MAX_RETRIES) {
      try {
        if (options?.onProgress) {
          options.onProgress({
            percent: Math.round((uploadedBytes / file.size) * 100),
            currentChunk: chunkIndex + 1,
            totalChunks,
            uploadedBytes,
            totalBytes: file.size,
            retries: totalRetries,
            statusText: retryAttempt > 0 
              ? `Retrying chunk ${chunkIndex + 1}/${totalChunks} (Attempt ${retryAttempt})...`
              : `Uploading chunk ${chunkIndex + 1} of ${totalChunks} (${(chunkBlob.size / (1024 * 1024)).toFixed(1)} MB)...`,
            isRetrying: retryAttempt > 0
          });
        }

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/upload/chunk/', {
          method: 'POST',
          headers,
          body: formData
        });

        if (res.ok) {
          chunkUploaded = true;
          uploadedBytes += chunkBlob.size;
          if (options?.onProgress) {
            options.onProgress({
              percent: Math.round((uploadedBytes / file.size) * 100),
              currentChunk: chunkIndex + 1,
              totalChunks,
              uploadedBytes,
              totalBytes: file.size,
              retries: totalRetries,
              statusText: `Chunk ${chunkIndex + 1}/${totalChunks} accepted by server.`,
              isRetrying: false
            });
          }
        } else if (res.status === 429 || res.status >= 500) {
          // WAF rate-limit or proxy buffer error: backoff
          retryAttempt++;
          totalRetries++;
          const backoffDelay = Math.min(Math.pow(2, retryAttempt) * 1500, 15000);
          if (options?.onProgress) {
            options.onProgress({
              percent: Math.round((uploadedBytes / file.size) * 100),
              currentChunk: chunkIndex + 1,
              totalChunks,
              uploadedBytes,
              totalBytes: file.size,
              retries: totalRetries,
              statusText: `WAF rate-limit/throttle (HTTP ${res.status}). Pausing ${Math.round(backoffDelay / 1000)}s before resuming...`,
              isRetrying: true
            });
          }
          await new Promise(r => setTimeout(r, backoffDelay));
        } else {
          let errMsg = `Upload failed on chunk ${chunkIndex + 1}`;
          try {
            const errJson = await res.json();
            if (errJson && errJson.error) errMsg = errJson.error;
          } catch {}
          throw new Error(errMsg);
        }
      } catch (err: any) {
        if (retryAttempt < MAX_RETRIES && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
          retryAttempt++;
          totalRetries++;
          const backoffDelay = Math.min(Math.pow(2, retryAttempt) * 1500, 12000);
          if (options?.onProgress) {
            options.onProgress({
              percent: Math.round((uploadedBytes / file.size) * 100),
              currentChunk: chunkIndex + 1,
              totalChunks,
              uploadedBytes,
              totalBytes: file.size,
              retries: totalRetries,
              statusText: `Network drop detected. Auto-resuming in ${Math.round(backoffDelay / 1000)}s...`,
              isRetrying: true
            });
          }
          await new Promise(r => setTimeout(r, backoffDelay));
        } else {
          throw err;
        }
      }
    }

    if (!chunkUploaded) {
      throw new Error(`Failed to upload chunk ${chunkIndex + 1} after ${MAX_RETRIES} attempts.`);
    }

    // Anti-DDoS Pacing Delay
    if (delayMs > 0 && chunkIndex < totalChunks - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Finalize & Assemble
  if (options?.onProgress) {
    options.onProgress({
      percent: 100,
      currentChunk: totalChunks,
      totalChunks,
      uploadedBytes: file.size,
      totalBytes: file.size,
      retries: totalRetries,
      statusText: 'All chunks uploaded! Assembling & verifying on server...',
      isRetrying: false
    });
  }

  const completeData = new FormData();
  completeData.append('upload_id', uploadId);
  completeData.append('file_name', file.name);
  completeData.append('file_type', fileType);
  completeData.append('total_chunks', String(totalChunks));
  for (const [k, v] of Object.entries(metadata)) {
    if (v !== undefined && v !== null) {
      completeData.append(k, String(v));
    }
  }

  const completeHeaders: Record<string, string> = {};
  if (token) completeHeaders['Authorization'] = `Bearer ${token}`;

  const completeRes = await fetch('/api/upload/chunk-complete/', {
    method: 'POST',
    headers: completeHeaders,
    body: completeData
  });

  if (!completeRes.ok) {
    let errMsg = 'Failed to assemble uploaded chunks on server.';
    try {
      const errJson = await completeRes.json();
      if (errJson && errJson.error) errMsg = errJson.error;
    } catch {}
    throw new Error(errMsg);
  }

  return await completeRes.json();
}

