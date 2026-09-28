import React, { useState } from 'react';
import { useStore } from './store/useStore.ts';
import MapView from './components/MapView.tsx';
import DashboardView from './views/DashboardView.tsx';
import InventoryView from './views/InventoryView.tsx';
import LayersView from './views/LayersView.tsx';
import UploadView from './views/UploadView.tsx';
import SettingsView from './views/SettingsView.tsx';
import AuditLogsView from './views/AuditLogsView.tsx';
import {
  LayoutDashboard, Map, Database, Layers, UploadCloud, Settings, ShieldAlert,
  Search, LogOut, Landmark, User as UserIcon, Lock, X, MapPin
} from 'lucide-react';

const extractWktCenter = (wkt: any): [number, number] => {
  if (!wkt) return [91.76, 26.18];
  if (typeof wkt === 'object' && wkt.coordinates) {
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
      extractCoords(wkt.coordinates);
      if (count > 0) return [sumLng / count, sumLat / count];
    } catch (e) {}
  }
  if (typeof wkt === 'string') {
    const ringMatches = wkt.match(/\(\s*([0-9\.\,\s\-eE]+)\s*\)/g);
    if (ringMatches) {
      let sumLng = 0, sumLat = 0, count = 0;
      ringMatches.forEach(ring => {
        const clean = ring.replace(/[\(\)]/g, '').trim();
        clean.split(',').forEach(pair => {
          const [lng, lat] = pair.trim().split(/\s+/).map(Number);
          if (!isNaN(lng) && !isNaN(lat)) {
            sumLng += lng;
            sumLat += lat;
            count++;
          }
        });
      });
      if (count > 0) return [sumLng / count, sumLat / count];
    }
  }
  return [91.76, 26.18];
};

export default function App() {
  const {
    currentUser,
    currentRole,
    login,
    logout,
    searchResults,
    searchQuery,
    triggerSearch,
    zoomToCoordinates,
    parcels,
    selectParcel,
    setSelectedFeature,
    loadInventory,
    loadBoundaries,
    loadInfrastructure,
    loadDashboardStats,
    loadSettings,
    loadLayers
  } = useStore();

  React.useEffect(() => {
    loadInventory();
    loadBoundaries();
    loadInfrastructure();
    loadDashboardStats();
    loadSettings();
    loadLayers();
  }, [loadInventory, loadBoundaries, loadInfrastructure, loadDashboardStats, loadSettings, loadLayers]);

  const [username, setUsername] = useState('gisadmin');
  const [password, setPassword] = useState('gisadmin');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'inventory' | 'layers' | 'upload' | 'settings' | 'audit'>('dashboard');
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const [authError, setAuthError] = useState('');

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const success = await login(username, password);
    if (!success) {
      setAuthError('Authentication failed. Use gisadmin / gisadmin or operator / operator.');
    }
  };

  // Render Login screen if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Top blue bar */}
          <div className="bg-gov-slate p-6 text-white text-center flex flex-col items-center">
            <Landmark className="w-12 h-12 text-gov-blue mb-2" />
            <h1 className="text-base font-bold uppercase tracking-wider">Industrial Land Bank Portal</h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Government Enterprise GIS Platform (v1.0)</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:border-gov-blue focus:outline-none"
                  placeholder="e.g. gisadmin"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:border-gov-blue focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {authError && (
              <p className="text-[10px] text-red-500 font-semibold text-center">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gov-blue hover:bg-gov-blue/90 text-white font-bold py-2.5 rounded-lg shadow transition"
            >
              Sign In to Registry
            </button>
            
            <div className="text-[9px] text-slate-400 text-center leading-normal pt-2 border-t border-slate-100">
              Authorized personnel only. Sessions and coordinate manipulations are logged under state audit protocols.
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render main application dashboard
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gov-slate text-slate-300 flex flex-col justify-between border-r border-slate-800 flex-shrink-0">
        <div>
          {/* Brand header */}
          <div className="bg-slate-950/60 p-4 flex items-center gap-3 border-b border-slate-800">
            <Landmark className="w-6 h-6 text-gov-blue flex-shrink-0" />
            <div>
              <h2 className="text-xs font-bold text-white leading-tight uppercase tracking-wider">Assam Land Bank</h2>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest text-gov-blue">GIS Portal v1.0</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === 'dashboard' ? 'bg-gov-blue text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === 'map' ? 'bg-gov-blue text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Interactive GIS Map</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === 'inventory' ? 'bg-gov-blue text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Land & Estate Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('layers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === 'layers' ? 'bg-gov-blue text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Layers & Metadata</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === 'upload' ? 'bg-gov-blue text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>GIS Ingestion Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === 'settings' ? 'bg-gov-blue text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings & Sync</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === 'audit' ? 'bg-gov-blue text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Audit Log Trails</span>
            </button>
          </nav>
        </div>

        {/* User Profile Summary */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold flex-shrink-0">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-200 truncate">{currentUser.fullName}</p>
              <span className="text-[9px] font-semibold text-gov-blue uppercase block truncate">{currentRole}</span>
            </div>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded transition" title="Log Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header (Hidden on Map View tab) */}
        {activeTab !== 'map' && (
          <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
            <div className="flex items-center gap-4 flex-1 max-w-3xl">
              {/* Redesigned Global Search Bar for non-map views */}
              <div className="relative w-full">
                <form onSubmit={(e) => { e.preventDefault(); triggerSearch(searchQuery); }} className="flex items-center shadow-xs border border-slate-200 focus-within:border-gov-blue focus-within:ring-4 focus-within:ring-gov-blue/15 rounded-xl overflow-hidden bg-slate-50/80 focus-within:bg-white transition-all duration-200 p-1">
                  <div className="pl-3 text-slate-400">
                    <Search className="w-4 h-4 text-gov-blue/80" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="Search plot number, parcel ID, status (Vacan, Occupied, Doubtful), survey no..."
                    onChange={(e) => triggerSearch(e.target.value)}
                    className="px-3 py-2 text-xs sm:text-sm w-full bg-transparent focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => triggerSearch('')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      title="Clear Search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-gov-blue to-blue-700 hover:from-blue-700 hover:to-gov-blue text-white font-bold px-4 py-2 text-xs rounded-lg flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </form>

                {/* Search result popover dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-14 left-0 right-0 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 rounded-t-xl">
                      <span className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-gov-blue" />
                        Search Results ({searchResults.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Click item to pinpoint feature on map</span>
                    </div>
                    {searchResults.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const targetParcel = parcels.find(p => p.id === Number(res.id) || p.parcelId === res.parcel_id || p.parcelId === res.title);
                          if (targetParcel) {
                            selectParcel(targetParcel);
                            setSelectedFeature({
                              type: 'Parcel',
                              name: targetParcel.parcelId,
                              data: targetParcel
                            });
                          } else if (res.type === 'Parcel' || res.data) {
                            const itemData = res.data || {
                              id: res.id,
                              parcelId: res.parcel_id || res.title,
                              plotNumber: res.plot_number || res.title,
                              surveyNumber: res.survey_number,
                              areaAcres: parseFloat(res.area_acres || '0'),
                              availabilityStatus: res.status,
                              landClassification: res.land_classification,
                              ownershipDetails: res.ownership_details,
                              geom: res.geom
                            };
                            setSelectedFeature({
                              type: 'Parcel',
                              name: itemData.parcelId || res.title,
                              data: itemData
                            });
                          } else {
                            setSelectedFeature({
                              type: res.type,
                              name: res.title,
                              data: res.data || res
                            });
                          }

                          const center = extractWktCenter(res.geom || res.data?.geom || targetParcel?.geom);
                          setActiveTab('map');
                          zoomToCoordinates(center[0], center[1], 17);
                          triggerSearch('');
                        }}
                        className="p-3 hover:bg-slate-50/90 rounded-xl cursor-pointer flex justify-between items-center transition-all duration-150 border border-transparent hover:border-slate-200/70 shadow-none hover:shadow-xs group"
                      >
                        <div className="space-y-1 min-w-0 pr-3 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-sm text-slate-800 group-hover:text-gov-blue transition-colors truncate">{res.title}</p>
                            {res.status && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border tracking-wider ${
                                res.status === 'Vacan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                                res.status === 'Occupied' ? 'bg-rose-50 text-rose-700 border-rose-200/80' :
                                res.status === 'Doubtful' ? 'bg-yellow-50 text-yellow-800 border-yellow-300/80' :
                                res.status === 'Inner Road' ? 'bg-slate-100 text-slate-700 border-slate-300/80' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {res.status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{res.details}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                            {res.type}
                          </span>
                          <div className="flex items-center gap-1 bg-slate-100 group-hover:bg-gov-blue text-slate-600 group-hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 shadow-2xs">
                            <span>Locate</span>
                            <MapPin className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Master Workspace Layout */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'map' ? (
            <>
              {/* GIS Map Workspace */}
              <div className={`transition-all duration-300 ${isMapExpanded ? 'w-full' : 'w-1/2'} h-full`}>
                <MapView isMapExpanded={isMapExpanded} onToggleSplitScreen={() => setIsMapExpanded(!isMapExpanded)} />
              </div>
              {/* Side-by-side Inventory Comparison panel */}
              {!isMapExpanded && (
                <div className="w-1/2 h-full bg-slate-50 overflow-hidden flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
                  <InventoryView onLocateParcel={() => setActiveTab('map')} />
                </div>
              )}
            </>
          ) : (
            /* Non-Map tabs take 100% of workspace width, hiding map and side panels */
            <div className="w-full h-full bg-slate-50 overflow-hidden flex flex-col">
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'inventory' && <InventoryView onLocateParcel={() => setActiveTab('map')} />}
              {activeTab === 'layers' && <LayersView />}
              {activeTab === 'upload' && <UploadView onProceedToMap={() => setActiveTab('map')} />}
              {activeTab === 'settings' && <SettingsView />}
              {activeTab === 'audit' && <AuditLogsView />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
