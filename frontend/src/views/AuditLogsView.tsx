import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.ts';
import { Calendar } from 'lucide-react';

export default function AuditLogsView() {
  const { auditLogs, loadAuditLogs } = useStore();
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    loadAuditLogs(filterAction || undefined);
  }, [filterAction]);

  return (
    <div className="p-6 space-y-6 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Immutable System Audit Trails</h1>
        <p className="text-xs text-slate-500 mt-1">Audit log register tracking all user logins, GIS uploads, layer configurations, and database changes.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <label className="text-xs font-bold text-slate-500">Filter by Activity:</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-slate-200 rounded-lg text-xs px-3 py-1.5 bg-white focus:outline-none"
        >
          <option value="">All Activities</option>
          <option value="LOGIN">User Logins</option>
          <option value="UPLOAD_GIS">GIS Layer Uploads</option>
          <option value="CREATE_PARCEL">Parcel Creation</option>
          <option value="MODIFY_LAYER">Layer Configurations</option>
          <option value="SYNC_EXTERNAL">External Adapter Syncs</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase select-none">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Client IP Address</th>
                <th className="px-5 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{log.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.actionType === 'LOGIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      log.actionType === 'UPLOAD_GIS' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                      log.actionType === 'CREATE_PARCEL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{log.clientIp}</td>
                  <td className="px-5 py-3 text-slate-800 font-medium">{log.actionDetails}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No matching audit log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
