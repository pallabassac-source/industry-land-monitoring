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
  basemap: 'satellite' | 'streets' | 'light' | 'topo';
  layers: GisLayer[];
  selectedFeature: any | null;
  measurementMode: 'none' | 'distance' | 'area';
  measurementResult: string | null;
  bookmarks: Bookmark[];
  mapCenter: [number, number];
  mapZoom: number;
  setBasemap: (mapType: 'satellite' | 'streets' | 'light' | 'topo') => void;
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

  // External Integration framework sync
  adapters: any[];
  syncExternalAdapter: (adapterName: string) => Promise<any>;
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
  }
}));
