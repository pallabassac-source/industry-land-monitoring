import { useState } from 'react';
import { useStore, GisLayer } from '../store/useStore.ts';
import { 
  Eye, EyeOff, Sliders, Trash2, Edit3, Folder, ChevronDown, ChevronRight,
  Search, Plus, MapPin, Table, Layers, AlertCircle, Filter, Sparkles
} from 'lucide-react';

export default function LayersView() {
  const { 
    layers, 
    toggleLayerVisibility, 
    setLayerOpacity, 
    deleteLayer, 
    updateLayer, 
    parcels, 
    estates,
    zoomToCoordinates 
  } = useStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  
  // Tree expansion state (all categories open by default)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Uploaded Shapefile Layers': true,
    'Industrial Assets': true,
    'Administrative Boundaries': true,
    'Infrastructure & Utilities': true
  });

  const [expandedLayers, setExpandedLayers] = useState<Record<number, boolean>>({});

  // Modals state
  const [attributeTableModalLayer, setAttributeTableModalLayer] = useState<GisLayer | null>(null);
  const [editModalLayer, setEditModalLayer] = useState<GisLayer | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const [deleteModalLayer, setDeleteModalLayer] = useState<GisLayer | null>(null);
  const [attributeSearch, setAttributeSearch] = useState('');

  // Group layers by category
  const categories = layers.reduce((acc, layer) => {
    const cat = layer.category || 'Uploaded Shapefile Layers';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(layer);
    return acc;
  }, {} as Record<string, GisLayer[]>);

  // Toggle category expansion
  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Toggle layer child expansion
  const toggleLayerExpand = (layerId: number) => {
    setExpandedLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  // Expand / Collapse all
  const expandAll = () => {
    const allCats: Record<string, boolean> = {};
    Object.keys(categories).forEach(c => allCats[c] = true);
    setExpandedCategories(allCats);
  };

  const collapseAll = () => {
    const allCats: Record<string, boolean> = {};
    Object.keys(categories).forEach(c => allCats[c] = false);
    setExpandedCategories(allCats);
  };

  // Master Category Visibility Toggle
  const toggleCategoryVisibility = (catLayers: GisLayer[]) => {
    const allVisible = catLayers.every(l => l.isVisible);
    catLayers.forEach(l => {
      if (allVisible && l.isVisible) {
        toggleLayerVisibility(l.id);
      } else if (!allVisible && !l.isVisible) {
        toggleLayerVisibility(l.id);
      }
    });
  };

  // Preset Color Palettes for Style Configuration
  const COLOR_PALETTES = [
    { name: 'Sky Blue', hex: '#0284c7', fill: 'rgba(2, 132, 199, 0.2)' },
    { name: 'Emerald', hex: '#10b981', fill: 'rgba(16, 185, 129, 0.2)' },
    { name: 'Purple', hex: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)' },
    { name: 'Rose', hex: '#f43f5e', fill: 'rgba(244, 63, 94, 0.2)' },
    { name: 'Amber', hex: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)' },
    { name: 'Slate', hex: '#475569', fill: 'rgba(71, 85, 105, 0.2)' }
  ];

  // Filtered categories
  const filteredCategoryNames = Object.keys(categories).filter(catName => {
    if (selectedCategoryFilter !== 'ALL' && catName !== selectedCategoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const catLayers = categories[catName];
    const matchCat = catName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLayer = catLayers.some(l => 
      l.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchCat || matchLayer;
  });

  // Total Statistics
  const totalLayersCount = layers.length;
  const visibleLayersCount = layers.filter(l => l.isVisible).length;
  const hiddenLayersCount = totalLayersCount - visibleLayersCount;

  // Zoom to layer coordinates on Map
  const handleZoomToLayer = (layer: GisLayer) => {
    const nameLower = layer.name.toLowerCase();
    const matchingEstate = estates.find(e => e.name.toLowerCase().includes(nameLower) || nameLower.includes(e.name.toLowerCase()));
    if (matchingEstate) {
      zoomToCoordinates(91.15, 26.49, 15);
    } else {
      zoomToCoordinates(91.76, 26.18, 14);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (layer: GisLayer) => {
    setEditModalLayer(layer);
    setEditNameInput(layer.displayName);
    setEditCategoryInput(layer.category || 'Uploaded Shapefile Layers');
  };

  // Save Edit Modal
  const handleSaveEdit = () => {
    if (!editModalLayer) return;
    if (editNameInput.trim()) {
      updateLayer(editModalLayer.id, {
        displayName: editNameInput.trim(),
        category: editCategoryInput.trim() || 'Uploaded Shapefile Layers'
      });
    }
    setEditModalLayer(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deleteModalLayer) {
      deleteLayer(deleteModalLayer.id);
      setDeleteModalLayer(null);
    }
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-slate-50/50">
      
      {/* 1. Header Banner & Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gov-blue" />
            <h1 className="text-lg font-bold text-slate-800">Layers Tree Catalog & Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Hierarchical GIS layer catalog. Expand categories to inspect layers, toggle visibility, adjust opacity, customize outline colors, view DBF attribute tables, or permanently delete layers.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={expandAll}
            className="text-xs px-3 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Expand All
          </button>
          <button 
            onClick={collapseAll}
            className="text-xs px-3 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Collapse All
          </button>
          <a
            href="#/upload"
            className="text-xs px-3.5 py-2 font-bold text-white bg-gov-blue hover:bg-gov-navy rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Upload New Layer
          </a>
        </div>
      </div>

      {/* 2. KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total GIS Layers</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalLayersCount}</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-gov-blue rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active / Visible</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{visibleLayersCount}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hidden / Muted</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{hiddenLayersCount}</div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <EyeOff className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tree Categories</span>
            <div className="text-xl font-black text-purple-600 mt-0.5">{Object.keys(categories).length}</div>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Folder className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search layers by display name, format, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-gov-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:border-gov-blue"
          >
            <option value="ALL">All Categories ({layers.length})</option>
            {Object.keys(categories).map(cat => (
              <option key={cat} value={cat}>{cat} ({categories[cat].length})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Hierarchical Layer Tree Catalog */}
      <div className="space-y-4">
        {filteredCategoryNames.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No GIS Layers Found</h3>
            <p className="text-xs max-w-sm mx-auto">No layer matches your search filter "{searchQuery}". Try clearing the search query or upload a new layer.</p>
          </div>
        ) : (
          filteredCategoryNames.map((catName) => {
            const catLayers = categories[catName];
            const isCatExpanded = expandedCategories[catName] !== false;
            const allCatVisible = catLayers.every(l => l.isVisible);

            return (
              <div key={catName} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition">
                
                {/* Category Folder Header */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleCategoryExpand(catName)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-200 transition"
                    >
                      {isCatExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-gov-blue fill-gov-blue/20" />
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{catName}</h2>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {catLayers.length} {catLayers.length === 1 ? 'Layer' : 'Layers'}
                      </span>
                    </div>
                  </div>

                  {/* Category Master Controls */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={allCatVisible} 
                        onChange={() => toggleCategoryVisibility(catLayers)}
                        className="rounded border-slate-300 text-gov-blue focus:ring-gov-blue"
                      />
                      <span>Toggle Category ({catLayers.filter(l => l.isVisible).length}/{catLayers.length})</span>
                    </label>
                  </div>
                </div>

                {/* Category Body / Layer Rows */}
                {isCatExpanded && (
                  <div className="divide-y divide-slate-100">
                    {catLayers.map((layer) => {
                      const isChildExpanded = expandedLayers[layer.id];
                      const layerColor = layer.styleConfig?.outline || '#0284c7';

                      return (
                        <div key={layer.id} className="p-3.5 hover:bg-slate-50/80 transition space-y-3">
                          
                          {/* Primary Layer Header Row */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            
                            {/* Title & Status */}
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => toggleLayerExpand(layer.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                              >
                                {isChildExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>

                              {/* Visibility Toggle Button */}
                              <button 
                                onClick={() => toggleLayerVisibility(layer.id)} 
                                className={`p-1.5 rounded-lg border transition ${
                                  layer.isVisible 
                                    ? 'bg-blue-50 border-blue-200 text-gov-blue hover:bg-blue-100' 
                                    : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                                }`}
                                title={layer.isVisible ? "Layer Visible - Click to Hide" : "Layer Hidden - Click to Show"}
                              >
                                {layer.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>

                              {/* Style Color Indicator Badge */}
                              <div 
                                className="w-3.5 h-3.5 rounded-full border border-white shadow-sm flex-shrink-0" 
                                style={{ backgroundColor: layerColor }}
                                title={`Layer Outline Color: ${layerColor}`}
                              />

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${layer.isVisible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                    {layer.displayName}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                    {layer.layerType}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 font-medium">
                                  <span>Source: <strong className="text-slate-600">{layer.sourceType}</strong></span>
                                  <span>• CRS: <strong className="text-slate-600">{layer.metadata?.coordinateReferenceSystem || 'EPSG:4326'}</strong></span>
                                  <span>• Extents: <strong className="text-slate-600">Assam Land Bank</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Toolbar Controls */}
                            <div className="flex items-center gap-3 flex-wrap bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
                              
                              {/* Opacity Slider */}
                              <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
                                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 w-8">
                                  {Math.round(layer.opacity * 100)}%
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={layer.opacity}
                                  onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                                  className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gov-blue"
                                  title="Adjust Layer Opacity"
                                />
                              </div>

                              {/* Color Style Selector */}
                              <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
                                {COLOR_PALETTES.map(cp => (
                                  <button
                                    key={cp.name}
                                    onClick={() => updateLayer(layer.id, { styleConfig: { outline: cp.hex, fill: cp.fill } })}
                                    className={`w-3.5 h-3.5 rounded-full border transition ${
                                      layerColor === cp.hex ? 'ring-2 ring-gov-blue scale-110' : 'opacity-70 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: cp.hex }}
                                    title={`Set ${cp.name} Color`}
                                  />
                                ))}
                              </div>

                              {/* Zoom to Extent */}
                              <button
                                onClick={() => handleZoomToLayer(layer)}
                                className="p-1 text-slate-500 hover:text-gov-blue hover:bg-slate-200 rounded transition"
                                title="Zoom to Layer Extent on Map"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </button>

                              {/* Attribute Table */}
                              <button
                                onClick={() => setAttributeTableModalLayer(layer)}
                                className="p-1 text-slate-500 hover:text-gov-blue hover:bg-slate-200 rounded transition flex items-center gap-1 text-[10px] font-semibold"
                                title="Open DBF Attribute Table"
                              >
                                <Table className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Attributes</span>
                              </button>

                              {/* Rename / Modify */}
                              <button
                                onClick={() => handleOpenEditModal(layer)}
                                className="p-1 text-slate-500 hover:text-gov-blue hover:bg-slate-200 rounded transition"
                                title="Modify / Rename Layer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Layer */}
                              <button
                                onClick={() => setDeleteModalLayer(layer)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Permanently Delete Layer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Child Sub-Tree View */}
                          {isChildExpanded && (
                            <div className="ml-8 p-3 bg-slate-100/70 rounded-lg border border-slate-200/60 space-y-2 text-xs">
                              <div className="font-bold text-slate-700 text-[11px] flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-gov-blue" />
                                <span>Layer Files & Component Structure</span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                                <div className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-600">
                                  <strong>.shp</strong>: Geometry vectors
                                </div>
                                <div className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-600">
                                  <strong>.dbf</strong>: Attribute records
                                </div>
                                <div className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-600">
                                  <strong>.shx</strong>: Spatial index
                                </div>
                                <div className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-600">
                                  <strong>.prj</strong>: Projection definition
                                </div>
                              </div>

                              <div className="text-[10px] text-slate-500 pt-1">
                                Description: {layer.metadata?.description || `Registered layer ${layer.displayName}`}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Attribute Table Inspector Modal */}
      {attributeTableModalLayer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-gov-blue" />
                <h3 className="font-bold text-sm">DBF Attribute Table — {attributeTableModalLayer.displayName}</h3>
              </div>
              <button 
                onClick={() => setAttributeTableModalLayer(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-4">
              <input
                type="text"
                placeholder="Search DBF table records..."
                value={attributeSearch}
                onChange={(e) => setAttributeSearch(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:border-gov-blue"
              />
              <span className="text-xs text-slate-500 font-semibold">
                Showing parcels and plots matching layer catalog
              </span>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Parcel ID</th>
                    <th className="p-2">Plot Number / Detail</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Area (Acres)</th>
                    <th className="p-2">Classification</th>
                    <th className="p-2">Ownership</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parcels.filter(p => p.plotNumber.toLowerCase().includes(attributeSearch.toLowerCase()) || p.parcelId.toLowerCase().includes(attributeSearch.toLowerCase())).slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-gov-blue">{p.parcelId}</td>
                      <td className="p-2 font-semibold text-slate-800">{p.plotNumber}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          p.availabilityStatus === 'Vacan' ? 'bg-emerald-100 text-emerald-800' :
                          p.availabilityStatus === 'Doubtful' ? 'bg-yellow-100 text-yellow-800' :
                          p.availabilityStatus === 'Inner Road' ? 'bg-slate-200 text-slate-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {p.availabilityStatus}
                        </span>
                      </td>
                      <td className="p-2 font-medium text-slate-600">{p.areaAcres} Acres</td>
                      <td className="p-2 text-slate-600">{p.landClassification}</td>
                      <td className="p-2 text-slate-500 text-[10px]">{p.ownershipDetails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
              <button
                onClick={() => setAttributeTableModalLayer(null)}
                className="px-4 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
              >
                Close Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rename / Edit Layer Modal */}
      {editModalLayer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-gov-blue" />
              Modify Layer Display Settings
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Display Title</label>
                <input
                  type="text"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-gov-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Tree Category Folder</label>
                <select
                  value={editCategoryInput}
                  onChange={(e) => setEditCategoryInput(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-gov-blue"
                >
                  <option value="Uploaded Shapefile Layers">Uploaded Shapefile Layers</option>
                  <option value="Industrial Assets">Industrial Assets</option>
                  <option value="Administrative Boundaries">Administrative Boundaries</option>
                  <option value="Infrastructure & Utilities">Infrastructure & Utilities</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditModalLayer(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-gov-blue hover:bg-gov-navy rounded-lg shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {deleteModalLayer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-sm font-bold">Remove Layer Catalog Entry?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-normal">
              Are you sure you want to permanently delete layer <strong className="text-slate-900">{deleteModalLayer.displayName}</strong> from the catalog and remove its features from the interactive map?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalLayer(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
