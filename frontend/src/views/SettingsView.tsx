import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.ts';
import { Settings as SettingsIcon, RefreshCw, CheckCircle2, Database } from 'lucide-react';

export default function SettingsView() {
  const {
    settings,
    loadSettings,
    updateSettings,
    adapters,
    syncExternalAdapter,
    currentRole
  } = useStore();

  const [crs, setCrs] = useState(settings.defaultCrs);
  const [centerLat, setCenterLat] = useState(settings.mapCenterLat.toString());
  const [centerLng, setCenterLng] = useState(settings.mapCenterLng.toString());
  const [zoom, setZoom] = useState(settings.mapDefaultZoom.toString());
  
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      defaultCrs: crs,
      mapCenterLat: parseFloat(centerLat),
      mapCenterLng: parseFloat(centerLng),
      mapDefaultZoom: parseInt(zoom)
    });
    setSuccessMessage('System settings updated successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleSyncTrigger = async (adapterName: string) => {
    setIsSyncing(prev => ({ ...prev, [adapterName]: true }));
    setSyncStatus(prev => ({ ...prev, [adapterName]: '' }));
    
    // Simulate adapter connection
    setTimeout(async () => {
      const res = await syncExternalAdapter(adapterName);
      setIsSyncing(prev => ({ ...prev, [adapterName]: false }));
      setSyncStatus(prev => ({ ...prev, [adapterName]: `Success: Sync completed. Mapped ${res.features_processed} external OGC entities.` }));
    }, 1500);
  };

  const isAdmin = currentRole === 'Super Administrator' || currentRole === 'Department Administrator';

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">System settings & integrations</h1>
        <p className="text-xs text-slate-500 mt-1">Configure map defaults, coordinate parameters, and manage external OGC integration adapters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Core settings form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <SettingsIcon className="w-5 h-5 text-gov-blue" />
            <h2 className="text-sm font-bold text-slate-800">GIS Engine parameters</h2>
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Default CRS / Projection</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={crs}
                  onChange={(e) => setCrs(e.target.value)}
                  className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Default Zoom Level</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={zoom}
                  onChange={(e) => setZoom(e.target.value)}
                  className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Center Latitude</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={centerLat}
                  onChange={(e) => setCenterLat(e.target.value)}
                  className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Center Longitude</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={centerLng}
                  onChange={(e) => setCenterLng(e.target.value)}
                  className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                />
              </div>
            </div>

            {isAdmin && (
              <button
                type="submit"
                className="bg-gov-blue text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-gov-blue/90"
              >
                Save Settings
              </button>
            )}
          </form>
        </div>

        {/* Integration adapters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-5 h-5 text-gov-blue" />
            <h2 className="text-sm font-bold text-slate-800">External Integration adapters</h2>
          </div>

          <div className="space-y-4">
            {adapters.map((adapter) => (
              <div key={adapter.id} className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">{adapter.name}</h4>
                    <span className="text-[9px] font-semibold text-slate-400">Standard: OGC WFS / REST API Interoperable</span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleSyncTrigger(adapter.name)}
                      disabled={isSyncing[adapter.name]}
                      className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 hover:text-gov-blue px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing[adapter.name] ? 'animate-spin' : ''}`} />
                      Sync
                    </button>
                  )}
                </div>

                {isSyncing[adapter.name] && (
                  <p className="text-[10px] text-slate-400 animate-pulse">Connecting to external OGC Registry...</p>
                )}

                {syncStatus[adapter.name] && (
                  <div className="flex items-start gap-1 text-[10px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                    <span>{syncStatus[adapter.name]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
