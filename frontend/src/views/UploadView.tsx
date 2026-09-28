import { useState } from 'react';
import { useStore } from '../store/useStore.ts';
import { 
  UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Layers, 
  FileText, Check, Trash2, ArrowRight
} from 'lucide-react';

interface UploadViewProps {
  onProceedToMap?: () => void;
}

export default function UploadView({ onProceedToMap }: UploadViewProps) {
  const { uploadGisLayer, loadLayers, loadInventory, loadDashboardStats } = useStore();

  // Component files state for Shapefile upload
  const [shpFile, setShpFile] = useState<File | null>(null);
  const [dbfFile, setDbfFile] = useState<File | null>(null);
  const [shxFile, setShxFile] = useState<File | null>(null);
  const [prjFile, setPrjFile] = useState<File | null>(null);
  const [singleFile, setSingleFile] = useState<File | null>(null);

  // Drag over states
  const [dragOverSlot, setDragOverSlot] = useState<'shp' | 'dbf' | 'shx' | 'prj' | 'container' | null>(null);

  const [layerName, setLayerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  // Auto-assign dropped files based on file extension
  const handleFilesAutoAssign = (files: FileList | File[]) => {
    Array.from(files).forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (['zip', 'geojson', 'json', 'kml', 'gpkg', 'csv'].includes(ext || '')) {
        setSingleFile(f);
        if (!layerName) {
          const baseName = f.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
          setLayerName(baseName);
        }
      } else if (ext === 'shp') {
        setShpFile(f);
        if (!layerName) {
          const baseName = f.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
          setLayerName(baseName);
        }
      } else if (ext === 'dbf') {
        setDbfFile(f);
      } else if (ext === 'shx') {
        setShxFile(f);
      } else if (ext === 'prj') {
        setPrjFile(f);
      }
    });
  };

  // Change Handlers
  const handleShpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAutoAssign(e.target.files);
    }
  };

  const handleDbfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAutoAssign(e.target.files);
    }
  };

  const handleShxFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAutoAssign(e.target.files);
    }
  };

  const handlePrjFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAutoAssign(e.target.files);
    }
  };

  // Drag Event Handlers
  const handleDragOver = (e: React.DragEvent, slot: 'shp' | 'dbf' | 'shx' | 'prj' | 'container') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(slot);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAutoAssign(e.dataTransfer.files);
    }
  };

  // Check if mandatory shapefile components or single archive file are attached
  const isFormValid = Boolean((singleFile || (shpFile && dbfFile && shxFile)) && layerName.trim());

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsProcessing(true);
    setReport(null);

    try {
      const payload = singleFile || {
        shp: shpFile || undefined,
        dbf: dbfFile || undefined,
        shx: shxFile || undefined,
        prj: prjFile || undefined
      };
      const res = await uploadGisLayer(payload, layerName);
      setReport(res);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAllFiles = () => {
    setSingleFile(null);
    setShpFile(null);
    setDbfFile(null);
    setShxFile(null);
    setPrjFile(null);
    setReport(null);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-slate-50/50">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">GIS Shapefile Ingestion Engine</h1>
        <p className="text-xs text-slate-500 mt-1">Drag & drop or select individual Shapefile component files into dedicated slots for validation and PostGIS publishing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Component Upload Card */}
        <div 
          onDragOver={(e) => handleDragOver(e, 'container')}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`lg:col-span-7 bg-white p-6 rounded-xl border shadow-sm space-y-5 transition-all duration-200 ${
            dragOverSlot === 'container' ? 'border-gov-blue ring-2 ring-gov-blue/20 bg-blue-50/10' : 'border-slate-200'
          }`}
        >
          <form onSubmit={handleUploadSubmit} className="space-y-5 text-xs">
            {/* Layer Catalog Name Input */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Layer Catalog Name</span>
                <span className="text-[10px] text-slate-400 font-normal">* Unique layer identifier</span>
              </label>
              <input
                type="text"
                required
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                placeholder="e.g. pathsala_industrial_plots_2026"
                className="border border-slate-200 rounded-lg px-3 py-2 w-full focus:border-gov-blue focus:outline-none bg-white font-medium text-slate-800"
              />
            </div>

            {/* SINGLE FILE ARCHIVE SLOT */}
            {singleFile && (
              <div className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Single Spatial Archive Attached</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSingleFile(null)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate max-w-[280px]">{singleFile.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700">
                    {(singleFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            )}

            {/* DEDICATED SHAPEFILE COMPONENT SLOTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Shapefile Component Upload Slots</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop a single ZIP / GeoJSON file or drop individual .shp, .dbf, .shx files below!</p>
                </div>
                {(shpFile || dbfFile || shxFile || prjFile || singleFile) && (
                  <button 
                    type="button" 
                    onClick={clearAllFiles}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Files
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Slot 1: .SHP Geometry File */}
                <div 
                  onDragOver={(e) => handleDragOver(e, 'shp')}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                    dragOverSlot === 'shp' ? 'border-gov-blue bg-blue-50 ring-2 ring-gov-blue/20' :
                    shpFile ? 'bg-emerald-50/50 border-emerald-300 border-solid' : 'bg-slate-50/60 border-dashed border-slate-300 hover:border-gov-blue'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Geometry File (.SHP)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Spatial polygons, coordinates & lines</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">Required</span>
                  </div>

                  <div className="mt-3">
                    {shpFile ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[130px]">{shpFile.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setShpFile(null); }}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-gov-blue cursor-pointer font-semibold text-[11px] text-center border-dashed">
                        <UploadCloud className="w-5 h-5 text-gov-blue" />
                        <span>Drag & Drop or Browse .shp</span>
                        <input type="file" accept=".shp" multiple onChange={handleShpFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Slot 2: .DBF Attribute Data File */}
                <div 
                  onDragOver={(e) => handleDragOver(e, 'dbf')}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                    dragOverSlot === 'dbf' ? 'border-gov-blue bg-blue-50 ring-2 ring-gov-blue/20' :
                    dbfFile ? 'bg-emerald-50/50 border-emerald-300 border-solid' : 'bg-slate-50/60 border-dashed border-slate-300 hover:border-gov-blue'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Attribute Data (.DBF)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Plot names, area, status table</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">Required</span>
                  </div>

                  <div className="mt-3">
                    {dbfFile ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[130px]">{dbfFile.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setDbfFile(null); }}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-gov-blue cursor-pointer font-semibold text-[11px] text-center border-dashed">
                        <UploadCloud className="w-5 h-5 text-gov-blue" />
                        <span>Drag & Drop or Browse .dbf</span>
                        <input type="file" accept=".dbf" multiple onChange={handleDbfFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Slot 3: .SHX Index File */}
                <div 
                  onDragOver={(e) => handleDragOver(e, 'shx')}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                    dragOverSlot === 'shx' ? 'border-gov-blue bg-blue-50 ring-2 ring-gov-blue/20' :
                    shxFile ? 'bg-emerald-50/50 border-emerald-300 border-solid' : 'bg-slate-50/60 border-dashed border-slate-300 hover:border-gov-blue'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Shape Index (.SHX)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Spatial index lookup structure</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">Required</span>
                  </div>

                  <div className="mt-3">
                    {shxFile ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[130px]">{shxFile.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setShxFile(null); }}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-gov-blue cursor-pointer font-semibold text-[11px] text-center border-dashed">
                        <UploadCloud className="w-5 h-5 text-gov-blue" />
                        <span>Drag & Drop or Browse .shx</span>
                        <input type="file" accept=".shx" multiple onChange={handleShxFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Slot 4: .PRJ Projection File */}
                <div 
                  onDragOver={(e) => handleDragOver(e, 'prj')}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                    dragOverSlot === 'prj' ? 'border-gov-blue bg-blue-50 ring-2 ring-gov-blue/20' :
                    prjFile ? 'bg-teal-50/50 border-teal-300 border-solid' : 'bg-slate-50/60 border-dashed border-slate-300 hover:border-gov-blue'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                        <span>Projection (.PRJ)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Coordinate reference system definition</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-gov-blue">Recommended</span>
                  </div>

                  <div className="mt-3">
                    {prjFile ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-teal-200">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[130px]">{prjFile.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setPrjFile(null); }}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-gov-blue cursor-pointer font-semibold text-[11px] text-center border-dashed">
                        <UploadCloud className="w-5 h-5 text-gov-blue" />
                        <span>Drag & Drop or Browse .prj</span>
                        <input type="file" accept=".prj" multiple onChange={handlePrjFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Validation Status Checklist */}
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isFormValid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  {isFormValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span className="font-semibold">
                    {isFormValid 
                      ? 'All mandatory component files attached! Ready for spatial parsing.' 
                      : 'Attach all 3 mandatory component files (.shp, .dbf, .shx) and set layer name.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Process Button */}
            <button
              type="submit"
              disabled={isProcessing || !isFormValid}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow transition ${
                isProcessing || !isFormValid 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-gov-blue hover:bg-gov-blue/90 cursor-pointer'
              }`}
            >
              {isProcessing ? (
                <>
                  <Layers className="w-4 h-4 animate-spin text-white" />
                  Processing Geometry Topologies & Publishing...
                </>
              ) : (
                <>
                  Process and Publish Layer to PostGIS <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Validation & Publishing Report Panel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[360px]">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-gov-blue" />
            Validation & OGC Publishing Report
          </h2>

          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-12">
              <Layers className="w-10 h-10 mb-3 text-gov-blue animate-bounce" />
              <p className="text-xs font-semibold text-slate-700">Validating shapefile topologies & reprojecting to WGS84...</p>
              <p className="text-[10px] text-slate-400 mt-1">Calculating spatial centroids, area in acres, and PostGIS GIST indexes.</p>
            </div>
          )}

          {!isProcessing && report && (
            <div className="space-y-4 text-xs">
              {report.is_valid ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Layer validation passed and published to PostGIS database!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 divide-y divide-slate-100 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="pt-2 col-span-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Layer Register Name</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{layerName}</p>
                    </div>
                    <div className="pt-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">CRS Projection</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{report.crs_detected}</p>
                    </div>
                    <div className="pt-2">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Input Format</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{report.format}</p>
                    </div>
                    <div className="pt-3">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Geometry Type</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{report.geometry_type}</p>
                    </div>
                    <div className="pt-3">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">Total Spatial Plots</span>
                      <p className="font-bold text-emerald-700 mt-0.5">{report.total_features} features parsed</p>
                    </div>
                    {report.center_lat && (
                      <div className="pt-3 col-span-2">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Calculated Spatial Centroid</span>
                        <p className="font-mono font-semibold text-slate-800 mt-0.5">{report.center_lat}° N, {report.center_lng}° E</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2 text-gov-blue">
                    <AlertTriangle className="w-4 h-4 text-gov-blue flex-shrink-0" />
                    <span className="text-[11px] leading-normal font-medium">
                      OGC Web Services (WMS/WFS) published. Features synchronized with Inventory & Dashboard registers.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await loadLayers();
                      await loadInventory();
                      await loadDashboardStats();
                      if (onProceedToMap) onProceedToMap();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow cursor-pointer text-xs"
                  >
                    Proceed to View Layer on GIS Map & Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-rose-700 font-bold bg-rose-50 border border-rose-200 p-3 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-800">Spatial Validation Failed</h4>
                      <ul className="mt-1 list-disc list-inside text-[11px] font-medium text-rose-700 space-y-1">
                        {report.errors && report.errors.length > 0 ? (
                          report.errors.map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))
                        ) : (
                          <li>Missing mandatory component files (.shp, .dbf, .shx).</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isProcessing && !report && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-12">
              <FileText className="w-10 h-10 mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No active dataset processed yet</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
                Drag and drop your shapefile component files on the left and click process to inspect validation report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
