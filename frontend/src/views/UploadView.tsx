import { useState } from 'react';
import { useStore, ChunkProgressInfo } from '../store/useStore.ts';
import { 
  UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Layers, 
  FileText, Check, Trash2, ArrowRight, Camera, Image, Sparkles, CheckCircle2,
  ShieldCheck, Sliders, RefreshCw, Cpu
} from 'lucide-react';

interface UploadViewProps {
  onProceedToMap?: () => void;
}

export default function UploadView({ onProceedToMap }: UploadViewProps) {
  const { 
    uploadGisLayer, 
    uploadGisLayerChunked,
    uploadDroneImageryChunked,
    loadDroneLayers,
    droneLayers,
    deleteDroneLayer,
    estates, 
    toggleDroneLayer,
    setShowDroneLayer
  } = useStore();

  // Mode: 'vector' (Shapefiles/GeoJSON) vs 'drone' (GeoTIFF)
  const [activeTab, setActiveTab] = useState<'vector' | 'drone'>('vector');

  // WAF Defense & Anti-DDoS Chunking State
  const [chunkSizeMB, setChunkSizeMB] = useState<number>(25); // Default 25 MB - optimal for WAFs
  const [pacingDelayMs, setPacingDelayMs] = useState<number>(200); // 200 ms anti-DDoS pacing
  const [showWafSettings, setShowWafSettings] = useState<boolean>(false);
  const [chunkProgress, setChunkProgress] = useState<ChunkProgressInfo | null>(null);

  // Vector Shapefile states
  const [shpFile, setShpFile] = useState<File | null>(null);
  const [dbfFile, setDbfFile] = useState<File | null>(null);
  const [shxFile, setShxFile] = useState<File | null>(null);
  const [prjFile, setPrjFile] = useState<File | null>(null);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [layerName, setLayerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  // Drone GeoTIFF states
  const [droneTifFile, setDroneTifFile] = useState<File | null>(null);
  const [selectedEstateId, setSelectedEstateId] = useState<string>('');
  const [droneSurveyTitle, setDroneSurveyTitle] = useState('');
  const [droneSurveyDate, setDroneSurveyDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDroneUploading, setIsDroneUploading] = useState(false);
  const [droneUploadReport, setDroneUploadReport] = useState<any | null>(null);
  const [droneUploadError, setDroneUploadError] = useState<string | null>(null);

  // Drag over states
  const [dragOverSlot, setDragOverSlot] = useState<'shp' | 'dbf' | 'shx' | 'prj' | 'container' | 'drone' | null>(null);

  // Auto-assign dropped files based on file extension
  const handleFilesAutoAssign = (files: FileList | File[]) => {
    Array.from(files).forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (['tif', 'tiff', 'geotiff'].includes(ext || '')) {
        setActiveTab('drone');
        setDroneTifFile(f);
        if (!droneSurveyTitle) {
          const baseName = f.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, ' ');
          setDroneSurveyTitle(`${baseName} Drone Survey`);
        }
      } else if (['zip', 'geojson', 'json', 'kml', 'gpkg', 'csv'].includes(ext || '')) {
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

  // Change Handlers for Shapefiles
  const handleShpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFilesAutoAssign(e.target.files);
  };
  const handleDbfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFilesAutoAssign(e.target.files);
  };
  const handleShxFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFilesAutoAssign(e.target.files);
  };
  const handlePrjFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFilesAutoAssign(e.target.files);
  };

  // Change Handler for Drone GeoTIFF
  const handleDroneFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDroneTifFile(file);
      if (!droneSurveyTitle) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, ' ');
        setDroneSurveyTitle(`${baseName} Drone Survey`);
      }
    }
  };

  // Drag Event Handlers
  const handleDragOver = (e: React.DragEvent, slot: 'shp' | 'dbf' | 'shx' | 'prj' | 'container' | 'drone') => {
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

  // Submit Vector Shapefile Upload
  const isVectorFormValid = Boolean((singleFile || (shpFile && dbfFile && shxFile)) && layerName.trim());
  const handleVectorUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVectorFormValid) return;

    setIsProcessing(true);
    setReport(null);
    setChunkProgress(null);

    try {
      if (singleFile) {
        // Chunked upload for single file (e.g. large ZIP or GeoJSON)
        const res = await uploadGisLayerChunked(singleFile, layerName, {
          chunkSizeMB,
          delayMs: pacingDelayMs,
          onProgress: (p) => setChunkProgress(p)
        });
        setReport(res);
      } else {
        const payload = {
          shp: shpFile || undefined,
          dbf: dbfFile || undefined,
          shx: shxFile || undefined,
          prj: prjFile || undefined
        };
        const res = await uploadGisLayer(payload, layerName);
        setReport(res);
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setReport({ is_valid: false, errors: [err.message || "Vector dataset ingestion failed."] });
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Drone GeoTIFF Upload (WAF-Safe & Anti-DDoS Chunked)
  const isDroneFormValid = Boolean(droneTifFile && droneSurveyTitle.trim());
  const handleDroneUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDroneFormValid || !droneTifFile) return;

    setIsDroneUploading(true);
    setDroneUploadReport(null);
    setDroneUploadError(null);
    setChunkProgress({
      percent: 0,
      currentChunk: 1,
      totalChunks: Math.ceil(droneTifFile.size / (chunkSizeMB * 1024 * 1024)),
      uploadedBytes: 0,
      totalBytes: droneTifFile.size,
      retries: 0,
      statusText: 'Initializing rate-limit protected chunked upload...',
      isRetrying: false
    });

    try {
      const estateIdNum = selectedEstateId ? Number(selectedEstateId) : undefined;
      const res = await uploadDroneImageryChunked(
        droneTifFile,
        estateIdNum,
        droneSurveyTitle.trim(),
        droneSurveyDate,
        {
          chunkSizeMB,
          delayMs: pacingDelayMs,
          onProgress: (p) => setChunkProgress(p)
        }
      );
      setDroneUploadReport(res);
      await loadDroneLayers();
    } catch (err: any) {
      setDroneUploadError(err.message || "Failed to process GeoTIFF upload.");
    } finally {
      setIsDroneUploading(false);
    }
  };

  const clearVectorFiles = () => {
    setSingleFile(null);
    setShpFile(null);
    setDbfFile(null);
    setShxFile(null);
    setPrjFile(null);
    setReport(null);
  };

  const clearDroneFile = () => {
    setDroneTifFile(null);
    setDroneUploadReport(null);
    setDroneUploadError(null);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-slate-50/50">
      {/* Page Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">GIS Spatial Data & Imagery Ingestion</h1>
          <p className="text-xs text-slate-500 mt-1">Upload cadastral vector shapefiles or high-resolution GeoTIFF drone orthomosaics with automated multi-resolution pyramid tiling.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl gap-1 self-start">
          <button
            onClick={() => setActiveTab('vector')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'vector' ? 'bg-white text-gov-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vector Shapefiles</span>
          </button>
          <button
            onClick={() => setActiveTab('drone')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'drone' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Drone Orthomosaic (GeoTIFF)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DRONE GEOTIFF UPLOAD */}
      {activeTab === 'drone' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Drone Upload Form Card */}
          <div 
            onDragOver={(e) => handleDragOver(e, 'drone')}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`lg:col-span-7 bg-white p-6 rounded-xl border shadow-sm space-y-5 transition-all duration-200 ${
              dragOverSlot === 'drone' ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-50/10' : 'border-slate-200'
            }`}
          >
            <form onSubmit={handleDroneUploadSubmit} className="space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-600" />
                  <h3 className="font-bold text-slate-800 text-sm">High-Resolution Drone Imagery (GeoTIFF)</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                  LOD Pyramids Z14-Z21
                </span>
              </div>

              {/* Target Estate & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Target Industrial Estate</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <select
                    value={selectedEstateId}
                    onChange={(e) => {
                      setSelectedEstateId(e.target.value);
                      const est = estates.find(es => String(es.id) === e.target.value);
                      if (est && !droneSurveyTitle) {
                        setDroneSurveyTitle(`${est.name} Drone Survey 2026`);
                      }
                    }}
                    className="border border-slate-200 rounded-lg px-3 py-2 w-full focus:border-cyan-500 focus:outline-none bg-white font-medium text-slate-800"
                  >
                    <option value="">-- Independent / Select Estate --</option>
                    {estates.map(est => (
                      <option key={est.id} value={est.id}>{est.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Survey Capture Date</span>
                    <span className="text-[10px] text-slate-400 font-normal">* Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={droneSurveyDate}
                    onChange={(e) => setDroneSurveyDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 w-full focus:border-cyan-500 focus:outline-none bg-white font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Survey Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Drone Survey Title</span>
                  <span className="text-[10px] text-slate-400 font-normal">* Layer Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={droneSurveyTitle}
                  onChange={(e) => setDroneSurveyTitle(e.target.value)}
                  placeholder="e.g. Amerigog Industrial Park High-Res Aerial Survey 2026"
                  className="border border-slate-200 rounded-lg px-3 py-2 w-full focus:border-cyan-500 focus:outline-none bg-white font-medium text-slate-800"
                />
              </div>

              {/* GeoTIFF Drop Slot */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>GeoTIFF Drone File (.tif / .tiff)</span>
                  <span className="text-[10px] text-slate-400 font-normal">WGS84 / UTM</span>
                </label>

                {droneTifFile ? (
                  <div className="flex items-center justify-between p-4 bg-cyan-50/60 border-2 border-cyan-400 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 flex-shrink-0">
                        <Image className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 text-xs truncate max-w-[280px]">{droneTifFile.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {(droneTifFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Multi-Resolution Tiling
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearDroneFile}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-8 bg-slate-50/70 border-2 border-dashed border-slate-300 rounded-xl hover:border-cyan-500 hover:bg-cyan-50/20 transition cursor-pointer text-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-xs">Drag & Drop Drone GeoTIFF file here</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports .tif, .tiff, .geotiff (Up to 2+ GB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept=".tif,.tiff,.geotiff" 
                      onChange={handleDroneFileChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* WAF Shield & Anti-DDoS Defense Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 text-[11px]">WAF Bypass & Anti-DDoS Chunking Active</p>
                      <p className="text-[10px] text-slate-500">Slices files into {chunkSizeMB} MB chunks with {pacingDelayMs}ms flood protection pacing</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWafSettings(!showWafSettings)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-cyan-700 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-xs transition"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>{showWafSettings ? 'Hide Settings' : 'WAF Tuning'}</span>
                  </button>
                </div>

                {showWafSettings && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Slice / Chunk Size:</label>
                      <select
                        value={chunkSizeMB}
                        onChange={(e) => setChunkSizeMB(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-medium focus:border-cyan-500 focus:outline-none"
                      >
                        <option value={10}>10 MB (Ultra-Strict WAF / 10MB Limit)</option>
                        <option value={25}>25 MB (Recommended - Optimal Balance)</option>
                        <option value={40}>40 MB (Intranet / Fast LAN High Throughput)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Anti-DDoS Pacing Delay:</label>
                      <select
                        value={pacingDelayMs}
                        onChange={(e) => setPacingDelayMs(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-medium focus:border-cyan-500 focus:outline-none"
                      >
                        <option value={100}>100 ms (Fast Pacing)</option>
                        <option value={200}>200 ms (Recommended - Anti-Flood Safe)</option>
                        <option value={500}>500 ms (Ultra-Polite for Strict Rate-Limiters)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Real-time Chunk Progress Bar during upload */}
                {chunkProgress && isDroneUploading && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        {chunkProgress.isRetrying ? (
                          <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5 text-cyan-600 animate-pulse flex-shrink-0" />
                        )}
                        <span>Chunk {chunkProgress.currentChunk} of {chunkProgress.totalChunks}</span>
                      </span>
                      <span className="font-mono font-bold text-cyan-700">{chunkProgress.percent}%</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 transition-all duration-300 rounded-full ${
                          chunkProgress.isRetrying ? 'bg-amber-500 animate-pulse' : 'bg-cyan-600'
                        }`}
                        style={{ width: `${chunkProgress.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[280px]">{chunkProgress.statusText}</span>
                      {chunkProgress.retries > 0 && (
                        <span className="text-amber-600 font-bold">Auto-Retried: {chunkProgress.retries}x</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Error display */}
              {droneUploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{droneUploadError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isDroneFormValid || isDroneUploading}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-sm ${
                  isDroneFormValid && !isDroneUploading
                    ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isDroneUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading & Queuing Multi-Resolution Tile Pyramid...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Upload & Generate Drone Tile Pyramids</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Drone Processing Status Banner */}
          <div className="lg:col-span-5 space-y-4">
            {droneUploadReport ? (() => {
              const liveDroneLayer = droneLayers.find(l => l.id === droneUploadReport.layer_id);
              const currentStatus = liveDroneLayer ? liveDroneLayer.status : (droneUploadReport.status || 'PROCESSING');
              const isReady = currentStatus === 'READY';
              const isProcessing = currentStatus === 'PROCESSING' || currentStatus === 'PENDING';

              return (
                <div className={`bg-white p-6 rounded-xl border shadow-sm space-y-4 ${
                  isReady ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 'border-cyan-300 ring-1 ring-cyan-500/20'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isReady ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">
                        {isReady ? 'Drone Survey Ready & Operational' : 'Generating Multi-Resolution Tiles'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {isReady 
                          ? 'Tile pyramids cached for high-speed MapLibre rendering' 
                          : 'GDAL worker is cutting Zoom 14-20 Slippy Map pyramid...'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg space-y-2 text-xs border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Layer Title:</span>
                      <span className="font-bold text-slate-800">{droneUploadReport.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Processing Status:</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                        isReady 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700 animate-pulse'
                      }`}>
                        {currentStatus} {isProcessing ? '(In Progress...)' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Zoom Hierarchy:</span>
                      <span className="font-mono text-slate-700 font-bold">Zoom 14 → Zoom 20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tile Slicing Engine:</span>
                      <span className="font-semibold text-slate-700">Multi-Core gdal2tiles</span>
                    </div>
                  </div>

                  {onProceedToMap && (
                    <button
                      onClick={() => {
                        if (droneUploadReport.layer_id) {
                          toggleDroneLayer(droneUploadReport.layer_id);
                          setShowDroneLayer(true);
                        }
                        onProceedToMap();
                      }}
                      className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                        isReady 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                          : 'bg-gov-blue hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>{isReady ? 'View High-Res Survey on Map' : 'Proceed to Map View'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })() : (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Enterprise Drone Tiling Pipeline</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  When you upload an orthomosaic GeoTIFF, the server uses multi-threaded GDAL processing to automatically slice it into standard Slippy Map pyramid tiles (Zoom 14 to Zoom 20).
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                    <span>Automated background pyramid generation on upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                    <span>0% Server CPU during client browsing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                    <span>Automatic spatial bounds detection & alignment</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Drone Surveys Catalog Table */}
        {droneLayers.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Available Drone Surveys ({droneLayers.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {droneLayers.filter(l => l.status === 'READY').length} Ready • {droneLayers.filter(l => l.status !== 'READY').length} Processing
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200/80 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Title / Estate</th>
                    <th className="py-2.5 px-4">Capture Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Resolution</th>
                    <th className="py-2.5 px-4">File Size</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {droneLayers.map(layer => (
                    <tr key={layer.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-800">{layer.title}</div>
                        {layer.estate_name && (
                          <div className="text-[10px] text-slate-500">{layer.estate_name}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                        {layer.survey_date || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          layer.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : layer.status === 'PROCESSING' || layer.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {layer.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                        {layer.resolution_cm_per_px || 5} cm/px
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                        {layer.raw_file_size_mb ? `${layer.raw_file_size_mb} MB` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-2">
                        {onProceedToMap && (
                          <button
                            onClick={() => {
                              toggleDroneLayer(layer.id);
                              setShowDroneLayer(true);
                              onProceedToMap();
                            }}
                            className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold rounded text-[11px] transition inline-flex items-center gap-1"
                          >
                            <span>View on Map</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently delete drone survey "${layer.title || layer.estate_name}"? This will delete all generated tiles.`)) {
                              deleteDroneLayer(layer.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition inline-flex"
                          title="Delete drone survey"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      )}

      {/* TAB 2: VECTOR SHAPEFILE INGESTION ENGINE */}
      {activeTab === 'vector' && (
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
            <form onSubmit={handleVectorUploadSubmit} className="space-y-5 text-xs">
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
                      onClick={clearVectorFiles}
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
                          <FileSpreadsheet className="w-5 h-5 text-gov-blue" />
                          <span>Drag & Drop or Browse .dbf</span>
                          <input type="file" accept=".dbf" multiple onChange={handleDbfFileChange} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Slot 3: .SHX Shape Index File */}
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
                        <p className="text-[10px] text-slate-400 mt-0.5">Spatial index table file</p>
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
                          <Layers className="w-5 h-5 text-gov-blue" />
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
                      prjFile ? 'bg-emerald-50/50 border-emerald-300 border-solid' : 'bg-slate-50/60 border-dashed border-slate-300 hover:border-gov-blue'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                          <span>Projection File (.PRJ)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">WGS84 or UTM coordinate system</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-700">Optional</span>
                    </div>

                    <div className="mt-3">
                      {prjFile ? (
                        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
                          <FileText className="w-5 h-5 text-gov-blue" />
                          <span>Drag & Drop or Browse .prj</span>
                          <input type="file" accept=".prj" multiple onChange={handlePrjFileChange} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* WAF Shield & Anti-DDoS Progress Bar for Vector uploads */}
              {singleFile && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 text-[11px]">WAF-Safe Chunked Upload Protected</p>
                        <p className="text-[10px] text-slate-500">Auto-sliced in {chunkSizeMB} MB blocks to prevent firewall payload drops</p>
                      </div>
                    </div>
                  </div>

                  {chunkProgress && isProcessing && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          {chunkProgress.isRetrying ? (
                            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
                          ) : (
                            <Cpu className="w-3.5 h-3.5 text-gov-blue animate-pulse flex-shrink-0" />
                          )}
                          <span>Chunk {chunkProgress.currentChunk} of {chunkProgress.totalChunks}</span>
                        </span>
                        <span className="font-mono font-bold text-gov-blue">{chunkProgress.percent}%</span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 bg-gov-blue transition-all duration-300 rounded-full"
                          style={{ width: `${chunkProgress.percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[280px]">{chunkProgress.statusText}</span>
                        {chunkProgress.retries > 0 && (
                          <span className="text-amber-600 font-bold">Retries: {chunkProgress.retries}x</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Ingestion Button */}
              <button
                type="submit"
                disabled={!isVectorFormValid || isProcessing}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-sm ${
                  isVectorFormValid && !isProcessing
                    ? 'bg-gov-blue text-white hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Parsing Topology & Ingesting to PostGIS...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Validate & Publish Shapefile Layer</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Validation Report Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            {report ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="font-bold text-slate-800 text-sm">PostGIS Ingestion Report</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    report.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {report.is_valid ? 'SUCCESS' : 'ERRORS DETECTED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Detected CRS</span>
                    <span className="font-bold text-slate-700">{report.crs_detected}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Total Features</span>
                    <span className="font-bold text-slate-700">{report.total_features}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <span className="text-emerald-600 block text-[10px]">Valid Features</span>
                    <span className="font-bold text-emerald-800">{report.valid_features}</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <span className="text-amber-600 block text-[10px]">Repaired Topology</span>
                    <span className="font-bold text-amber-800">{report.invalid_features_repaired || 0}</span>
                  </div>
                </div>

                {report.is_valid && onProceedToMap && (
                  <button
                    onClick={onProceedToMap}
                    className="w-full py-2.5 bg-gov-blue text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                  >
                    <span>Proceed to Map View</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Spatial Topology Rules</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Uploaded shapefiles are validated against OGC Simple Features specifications. Self-intersecting polygons and invalid rings are automatically repaired with `ST_MakeValid`.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
