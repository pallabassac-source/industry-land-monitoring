import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.ts';
import { 
  Activity, Landmark, MapPin, CheckCircle, Database, Calendar, 
  Search, Eye, X, ArrowUpRight, Building2, Info, Layers, RefreshCw
} from 'lucide-react';

export default function DashboardView() {
  const { 
    stats, 
    loadDashboardStats, 
    auditLogs, 
    loadAuditLogs, 
    parcels, 
    estates, 
    loadInventory 
  } = useStore();

  // Active filter selection state for interactive stats
  // Options: 'all_parcels' | 'available_parcels' | 'occupied_parcels' | 'estates' | classification_name
  const [activeFilter, setActiveFilter] = useState<string>('all_parcels');
  const [activeTab, setActiveTab] = useState<'parcels' | 'estates'>('parcels');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<{ type: 'parcel' | 'estate'; item: any } | null>(null);

  useEffect(() => {
    loadDashboardStats();
    loadInventory();
    loadAuditLogs();
  }, []);

  const totalAcres = stats.availableLandAcres + stats.occupiedLandAcres;
  const availablePercent = totalAcres > 0 ? (stats.availableLandAcres / totalAcres) * 100 : 0;

  // Helper to resolve estate name
  const getEstateName = (estateId: number) => {
    return estates.find(e => e.id === estateId)?.name || `Estate #${estateId}`;
  };

  // Filtered parcels dataset based on active card/chart selection & search term
  const filteredParcels = parcels.filter(p => {
    // Stat filter
    let matchFilter = true;
    if (activeFilter === 'vacan_parcels' || activeFilter === 'available_parcels') {
      matchFilter = p.availabilityStatus === 'Vacan';
    } else if (activeFilter === 'occupied_parcels') {
      matchFilter = p.availabilityStatus === 'Occupied';
    } else if (activeFilter === 'doubtful_parcels') {
      matchFilter = p.availabilityStatus === 'Doubtful';
    } else if (activeFilter === 'inner_road_parcels') {
      matchFilter = p.availabilityStatus === 'Inner Road';
    } else if (activeFilter !== 'all_parcels' && activeFilter !== 'estates') {
      // Classification filter
      matchFilter = p.landClassification?.toLowerCase() === activeFilter.toLowerCase();
    }

    // Search query
    const query = searchQuery.trim().toLowerCase();
    let matchSearch = true;
    if (query) {
      const estateName = getEstateName(p.estateId).toLowerCase();
      matchSearch = p.parcelId.toLowerCase().includes(query) ||
                    p.plotNumber.toLowerCase().includes(query) ||
                    (p.surveyNumber && p.surveyNumber.toLowerCase().includes(query)) ||
                    p.availabilityStatus.toLowerCase().includes(query) ||
                    p.landClassification.toLowerCase().includes(query) ||
                    p.ownershipDetails.toLowerCase().includes(query) ||
                    estateName.includes(query);
    }

    return matchFilter && matchSearch;
  });

  // Filtered estates dataset based on search term
  const filteredEstates = estates.filter(e => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return e.name.toLowerCase().includes(query);
  });

  // Handle KPI Card Clicks
  const handleSelectEstatesCard = () => {
    setActiveFilter('estates');
    setActiveTab('estates');
  };

  const handleSelectAllParcelsCard = () => {
    setActiveFilter('all_parcels');
    setActiveTab('parcels');
  };

  const handleSelectAvailableCard = () => {
    setActiveFilter('vacan_parcels');
    setActiveTab('parcels');
  };

  const handleSelectOccupiedCard = () => {
    setActiveFilter('occupied_parcels');
    setActiveTab('parcels');
  };

  const handleSelectClassification = (classificationName: string) => {
    setActiveFilter(classificationName);
    setActiveTab('parcels');
  };

  // Human friendly label for current filter badge
  const getFilterBadgeLabel = () => {
    if (activeTab === 'estates') return 'All Industrial Estates Catalog';
    if (activeFilter === 'all_parcels') return 'All Land Parcels';
    if (activeFilter === 'vacan_parcels' || activeFilter === 'available_parcels') return 'Vacan Parcels';
    if (activeFilter === 'occupied_parcels') return 'Occupied Parcels';
    if (activeFilter === 'doubtful_parcels') return 'Doubtful Parcels';
    if (activeFilter === 'inner_road_parcels') return 'Inner Road Parcels';
    return `Zoning: ${activeFilter}`;
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-slate-50/50">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">State Industrial Land Bank Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Interactive geospatial summary, asset analytics, and instant detail register.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              loadDashboardStats();
              loadInventory();
              loadAuditLogs();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Interactive KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Industrial Estates */}
        <div 
          onClick={handleSelectEstatesCard}
          className={`p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between cursor-pointer transition-all duration-200 group hover:shadow-md ${
            activeTab === 'estates' 
              ? 'border-gov-blue ring-2 ring-gov-blue/20 bg-blue-50/20' 
              : 'border-slate-200 hover:border-gov-blue/40'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-gov-blue rounded-xl group-hover:scale-105 transition-transform">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Industrial Estates</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalEstates || estates.length}</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gov-blue font-bold flex items-center gap-0.5 group-hover:underline">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Total Land Parcels */}
        <div 
          onClick={handleSelectAllParcelsCard}
          className={`p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between cursor-pointer transition-all duration-200 group hover:shadow-md ${
            activeFilter === 'all_parcels' && activeTab === 'parcels' 
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Land Parcels</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalParcels || parcels.length}</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 group-hover:underline">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Vacan Land (Acres) */}
        <div 
          onClick={handleSelectAvailableCard}
          className={`p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between cursor-pointer transition-all duration-200 group hover:shadow-md ${
            activeFilter === 'vacan_parcels' || activeFilter === 'available_parcels'
              ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20' 
              : 'border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-105 transition-transform">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vacan Land</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.availableLandAcres.toFixed(1)} <span className="text-xs text-slate-500 font-normal">Acres</span></h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-teal-600 font-bold flex items-center gap-0.5 group-hover:underline">
              Filter <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Occupied Land (Acres) */}
        <div 
          onClick={handleSelectOccupiedCard}
          className={`p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between cursor-pointer transition-all duration-200 group hover:shadow-md ${
            activeFilter === 'occupied_parcels' 
              ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/20' 
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Occupied Land</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.occupiedLandAcres.toFixed(1)} <span className="text-xs text-slate-500 font-normal">Acres</span></h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 group-hover:underline">
              Filter <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts & System Logs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Land Occupancy Status Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Land Availability Ratio</h3>
              <span className="text-[10px] text-slate-400 font-medium">Click segment to filter</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Ratio of vacant land vs occupied plots</p>
          </div>
          
          <div className="my-6 flex items-center justify-center relative">
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center relative">
              <div className="text-center">
                <span className="text-2xl font-black text-slate-800">{availablePercent.toFixed(0)}%</span>
                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Vacan Ratio</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div 
              onClick={handleSelectAvailableCard}
              className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition ${
                activeFilter === 'vacan_parcels' || activeFilter === 'available_parcels' ? 'bg-emerald-50 ring-1 ring-emerald-300 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Vacan
              </span>
              <span className="font-bold text-slate-800">{parcels.filter(p => p.availabilityStatus === 'Vacan').length} Plots</span>
            </div>
            <div 
              onClick={handleSelectOccupiedCard}
              className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition ${
                activeFilter === 'occupied_parcels' ? 'bg-rose-50 ring-1 ring-rose-300 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Occupied
              </span>
              <span className="font-bold text-slate-800">{parcels.filter(p => p.availabilityStatus === 'Occupied').length} Plots</span>
            </div>
            <div 
              onClick={() => { setActiveFilter('doubtful_parcels'); setActiveTab('parcels'); }}
              className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition ${
                activeFilter === 'doubtful_parcels' ? 'bg-yellow-50 ring-1 ring-yellow-300 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span> Doubtful
              </span>
              <span className="font-bold text-slate-800">{parcels.filter(p => p.availabilityStatus === 'Doubtful').length} Plots</span>
            </div>
            <div 
              onClick={() => { setActiveFilter('inner_road_parcels'); setActiveTab('parcels'); }}
              className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition ${
                activeFilter === 'inner_road_parcels' ? 'bg-slate-100 ring-1 ring-slate-300 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-2.5 h-2.5 bg-slate-500 rounded-full"></span> Inner Road
              </span>
              <span className="font-bold text-slate-800">{parcels.filter(p => p.availabilityStatus === 'Inner Road').length} Plots</span>
            </div>
          </div>
        </div>

        {/* Land Classification Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Zoning & Classification</h3>
              <span className="text-[10px] text-slate-400 font-medium">Click category to filter</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Industrial category division based on parcel attributes</p>
          </div>

          <div className="my-4 space-y-3">
            {Object.keys(stats.classifications).length > 0 ? (
              Object.entries(stats.classifications).map(([name, count]) => {
                const maxVal = Math.max(...Object.values(stats.classifications));
                const widthPct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                const isSelected = activeFilter.toLowerCase() === name.toLowerCase();
                return (
                  <div 
                    key={name} 
                    onClick={() => handleSelectClassification(name)}
                    className={`space-y-1 cursor-pointer p-1.5 rounded-lg transition ${
                      isSelected ? 'bg-blue-50 ring-1 ring-gov-blue/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className={isSelected ? 'text-gov-blue font-bold' : ''}>{name}</span>
                      <span className="text-slate-500">{count} {count === 1 ? 'Parcel' : 'Parcels'}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-gov-blue' : 'bg-slate-400'}`}
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">No classification categories logged yet.</div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between items-center">
            <span>* Synchronized from GIS attributes</span>
            {activeFilter !== 'all_parcels' && activeFilter !== 'estates' && (
              <button 
                onClick={handleSelectAllParcelsCard}
                className="text-gov-blue font-bold hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* System Activity Audit Trails */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">System Audit Register</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time audit trails of logins, edits and GIS publishes</p>
          </div>

          <div className="my-4 overflow-y-auto max-h-[190px] space-y-3 pr-1">
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-2.5 text-xs">
                  <div className="mt-0.5 text-gov-blue">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-slate-700 font-semibold leading-tight">{log.actionDetails}</p>
                    <div className="flex gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                      <span>IP: {log.clientIp}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">No system audit logs logged yet.</div>
            )}
          </div>

          <div className="text-[10px] text-gov-blue font-bold text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-1 cursor-pointer hover:underline">
            View System Audit Logs <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* DYNAMIC DETAIL REGISTER SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Register Controls Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gov-blue text-white rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">Asset Detail Register</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-gov-blue border border-blue-200">
                  {getFilterBadgeLabel()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'parcels' 
                  ? `Showing ${filteredParcels.length} of ${parcels.length} land parcels` 
                  : `Showing ${filteredEstates.length} of ${estates.length} industrial estates`}
              </p>
            </div>
          </div>

          {/* Action Bar & Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'parcels' ? "Search parcel ID, plot, survey, zoning..." : "Search estate name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:border-gov-blue bg-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('parcels');
                  if (activeFilter === 'estates') setActiveFilter('all_parcels');
                }}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'parcels' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Land Parcels ({parcels.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('estates');
                  setActiveFilter('estates');
                }}
                className={`px-3 py-1.5 rounded-md transition ${
                  activeTab === 'estates' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Estates Catalog ({estates.length})
              </button>
            </div>

            {/* Clear Filter Button */}
            {(activeFilter !== 'all_parcels' || searchQuery) && (
              <button
                onClick={() => {
                  setActiveFilter('all_parcels');
                  setActiveTab('parcels');
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1.5 rounded hover:bg-rose-50"
              >
                <X className="w-3.5 h-3.5" /> Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="overflow-x-auto max-h-[420px]">
          {activeTab === 'parcels' ? (
            /* Land Parcels Table */
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider select-none sticky top-0 z-10">
                  <th className="px-5 py-3">Parcel ID</th>
                  <th className="px-4 py-3">Plot Number</th>
                  <th className="px-4 py-3">Survey / Khasra No</th>
                  <th className="px-4 py-3">Industrial Estate</th>
                  <th className="px-4 py-3">Area (Acres)</th>
                  <th className="px-4 py-3">Availability Status</th>
                  <th className="px-4 py-3">Zoning Category</th>
                  <th className="px-4 py-3">Ownership</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-5 py-3 font-bold text-slate-800">{parcel.parcelId}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{parcel.plotNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{parcel.surveyNumber || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {getEstateName(parcel.estateId)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{parcel.areaAcres.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        parcel.availabilityStatus === 'Vacan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        parcel.availabilityStatus === 'Occupied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        parcel.availabilityStatus === 'Doubtful' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {parcel.availabilityStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{parcel.landClassification}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate" title={parcel.ownershipDetails}>
                      {parcel.ownershipDetails || 'Government'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDetailItem({ type: 'parcel', item: parcel })}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 hover:bg-gov-blue hover:text-white rounded text-[11px] font-semibold transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredParcels.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Info className="w-6 h-6 text-slate-300" />
                        <p className="font-semibold text-slate-600">No land parcels found matching current criteria.</p>
                        <button
                          onClick={() => { setActiveFilter('all_parcels'); setSearchQuery(''); }}
                          className="text-gov-blue font-bold hover:underline text-xs"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Industrial Estates Table */
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider select-none sticky top-0 z-10">
                  <th className="px-5 py-3">Industrial Estate Name</th>
                  <th className="px-4 py-3">Total Area (Acres)</th>
                  <th className="px-4 py-3">Occupied Area</th>
                  <th className="px-4 py-3">Vacan Area</th>
                  <th className="px-4 py-3">Power Grid (MW)</th>
                  <th className="px-4 py-3">Water Line (MLD)</th>
                  <th className="px-4 py-3">Infrastructure Amenities</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstates.map((estate) => (
                  <tr key={estate.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-5 py-3 font-bold text-slate-800 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-gov-blue" />
                      {estate.name}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{estate.totalArea.toFixed(1)}</td>
                    <td className="px-4 py-3 text-amber-700 font-semibold">{estate.allocatedArea.toFixed(1)} Acres</td>
                    <td className="px-4 py-3 text-emerald-700 font-semibold">{estate.availableArea.toFixed(1)} Acres</td>
                    <td className="px-4 py-3 text-slate-700">{estate.powerCapacity} MW</td>
                    <td className="px-4 py-3 text-slate-700">{estate.waterCapacity} MLD</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap text-[10px]">
                        {estate.gasPipeline && <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold border border-teal-100">Gas Pipeline</span>}
                        {estate.drainage && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">Drainage Grid</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDetailItem({ type: 'estate', item: estate })}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 hover:bg-gov-blue hover:text-white rounded text-[11px] font-semibold transition"
                          title="View Estate Summary"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEstates.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      No industrial estates matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>* Click on any KPI summary card above to update register views in real time.</span>
          <span className="font-bold text-slate-700">Total Filtered: {activeTab === 'parcels' ? filteredParcels.length : filteredEstates.length} Records</span>
        </div>
      </div>

      {/* Item Details Modal */}
      {selectedDetailItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedDetailItem.type === 'parcel' ? (
                  <Database className="w-5 h-5 text-gov-blue" />
                ) : (
                  <Landmark className="w-5 h-5 text-gov-blue" />
                )}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {selectedDetailItem.type === 'parcel' ? `Land Parcel ${selectedDetailItem.item.parcelId}` : selectedDetailItem.item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedDetailItem.type === 'parcel' ? `Plot: ${selectedDetailItem.item.plotNumber}` : 'Industrial Estate Details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto text-xs">
              {selectedDetailItem.type === 'parcel' ? (
                /* Parcel Details */
                <>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Survey Number</span>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedDetailItem.item.surveyNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Area</span>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedDetailItem.item.areaAcres} Acres</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Availability Status</span>
                      <div className="mt-1">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          selectedDetailItem.item.availabilityStatus === 'Vacan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          selectedDetailItem.item.availabilityStatus === 'Occupied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          selectedDetailItem.item.availabilityStatus === 'Doubtful' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {selectedDetailItem.item.availabilityStatus}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Zoning Classification</span>
                      <p className="font-semibold text-slate-800 mt-1">{selectedDetailItem.item.landClassification}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Ownership Details</span>
                    <p className="p-2.5 bg-slate-50 rounded border border-slate-100 font-medium text-slate-800 mt-1">
                      {selectedDetailItem.item.ownershipDetails || 'Government Land Bank'}
                    </p>
                  </div>

                  {selectedDetailItem.item.infrastructureDetails && Object.keys(selectedDetailItem.item.infrastructureDetails).length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Infrastructure Connections</span>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                        {Object.entries(selectedDetailItem.item.infrastructureDetails).map(([key, val]: any) => (
                          <div key={key} className="p-2 bg-blue-50/50 rounded border border-blue-100">
                            <span className="font-bold uppercase text-[9px] text-gov-blue">{key}: </span>
                            <span className="text-slate-700 font-semibold">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Spatial Boundary WKT</span>
                    <p className="p-2 bg-slate-100 font-mono text-[10px] text-slate-600 rounded break-all mt-1">
                      {selectedDetailItem.item.geom || 'POLYGON((...))'}
                    </p>
                  </div>
                </>
              ) : (
                /* Estate Details */
                <>
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Area</span>
                      <p className="text-sm font-bold text-slate-800">{selectedDetailItem.item.totalArea} Acres</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 uppercase font-bold">Occupied</span>
                      <p className="text-sm font-bold text-amber-700">{selectedDetailItem.item.allocatedArea} Acres</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold">Vacan</span>
                      <p className="text-sm font-bold text-emerald-700">{selectedDetailItem.item.availableArea} Acres</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50/40 rounded border border-blue-100">
                      <span className="text-[10px] text-gov-blue uppercase font-bold">Power Capacity</span>
                      <p className="text-base font-bold text-slate-800 mt-0.5">{selectedDetailItem.item.powerCapacity} MW Substation</p>
                    </div>
                    <div className="p-3 bg-blue-50/40 rounded border border-blue-100">
                      <span className="text-[10px] text-gov-blue uppercase font-bold">Water Capacity</span>
                      <p className="text-base font-bold text-slate-800 mt-0.5">{selectedDetailItem.item.waterCapacity} MLD Supply</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Utility Infrastructure</span>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-3 py-1 rounded font-bold ${selectedDetailItem.item.gasPipeline ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'}`}>
                        Gas Pipeline: {selectedDetailItem.item.gasPipeline ? 'Available' : 'N/A'}
                      </span>
                      <span className={`px-3 py-1 rounded font-bold ${selectedDetailItem.item.drainage ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                        Drainage: {selectedDetailItem.item.drainage ? 'Available' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-1.5 bg-gov-blue text-white font-bold rounded-lg hover:bg-gov-blue/90"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
