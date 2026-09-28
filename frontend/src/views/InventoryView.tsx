import { useEffect, useState } from 'react';
import { useStore, LandParcel } from '../store/useStore.ts';
import { Search, Plus, MapPin, Edit3, X } from 'lucide-react';

interface InventoryViewProps {
  onLocateParcel?: (parcel: LandParcel) => void;
}

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

export default function InventoryView({ onLocateParcel }: InventoryViewProps) {
  const {
    parcels,
    estates,
    loadInventory,
    saveParcel,
    selectParcel,
    setSelectedFeature,
    zoomToCoordinates,
    currentRole
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstateFilter, setSelectedEstateFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedParcelForEdit, setSelectedParcelForEdit] = useState<Partial<LandParcel> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<keyof LandParcel>('parcelId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSort = (field: keyof LandParcel) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const isOperator = currentRole === 'Super Administrator' || currentRole === 'Data Entry Operator' || currentRole === 'GIS Administrator';

  // Filtered and sorted dataset
  const processedParcels = parcels
    .filter(p => {
      const matchSearch = p.parcelId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstate = selectedEstateFilter ? p.estateId.toString() === selectedEstateFilter : true;
      const matchStatus = selectedStatusFilter ? p.availabilityStatus === selectedStatusFilter : true;
      return matchSearch && matchEstate && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';
      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB as string) 
          : (valB as string).localeCompare(valA);
      }
      return sortDirection === 'asc' 
        ? (valA as number) - (valB as number) 
        : (valB as number) - (valA as number);
    });

  const getEstateName = (id: number) => {
    return estates.find(e => e.id === id)?.name || `Estate ${id}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParcelForEdit) {
      const success = await saveParcel(selectedParcelForEdit);
      if (success) {
        setIsEditing(false);
        setSelectedParcelForEdit(null);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-hidden flex flex-col">
      {/* View Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Industrial Land Inventory Register</h1>
          <p className="text-xs text-slate-500 mt-1">Browse, filter, edit, and navigate individual spatial land parcels.</p>
        </div>
        {isOperator && (
          <button 
            onClick={() => {
              setSelectedParcelForEdit({
                estateId: estates[0]?.id || 1,
                parcelId: 'LP-BMN-NEW',
                plotNumber: 'Plot New',
                surveyNumber: 'Survey-000',
                areaAcres: 10,
                availabilityStatus: 'Vacan',
                landClassification: 'General',
                ownershipDetails: 'Government Land Bank'
              });
              setIsEditing(true);
            }} 
            className="flex items-center gap-1.5 bg-gov-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-gov-blue/90"
          >
            <Plus className="w-3.5 h-3.5" /> Add Land Parcel
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Parcel ID, Survey No, Plot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:border-gov-blue"
            />
          </div>
          <select
            value={selectedEstateFilter}
            onChange={(e) => setSelectedEstateFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none"
          >
            <option value="">All Estates</option>
            {estates.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none"
          >
            <option value="">All Availability Statuses</option>
            <option value="Vacan">Vacan</option>
            <option value="Occupied">Occupied</option>
            <option value="Doubtful">Doubtful</option>
            <option value="Inner Road">Inner Road</option>
          </select>
        </div>
        <div className="text-xs font-bold text-slate-500">
          Showing {processedParcels.length} of {parcels.length} records
        </div>
      </div>

      {/* High-Performance Table Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase select-none">
                <th onClick={() => handleSort('parcelId')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-100">Parcel ID</th>
                <th onClick={() => handleSort('plotNumber')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">Plot Number</th>
                <th onClick={() => handleSort('surveyNumber')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">Survey No</th>
                <th className="px-4 py-3.5">Industrial Estate</th>
                <th onClick={() => handleSort('areaAcres')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">Area (Acres)</th>
                <th onClick={() => handleSort('availabilityStatus')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">Status</th>
                <th onClick={() => handleSort('landClassification')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">Zoning</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {processedParcels.map((parcel) => (
                <tr key={parcel.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3 font-semibold text-slate-800">{parcel.parcelId}</td>
                  <td className="px-4 py-3 text-slate-600">{parcel.plotNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{parcel.surveyNumber || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-600">{getEstateName(parcel.estateId)}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{parcel.areaAcres.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      parcel.availabilityStatus === 'Vacan' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      parcel.availabilityStatus === 'Occupied' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      parcel.availabilityStatus === 'Doubtful' ? 'bg-yellow-50 text-yellow-800 border border-yellow-300' :
                      parcel.availabilityStatus === 'Inner Road' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {parcel.availabilityStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-semibold">{parcel.landClassification}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => {
                          selectParcel(parcel);
                          setSelectedFeature({
                            type: 'Parcel',
                            name: parcel.parcelId,
                            data: parcel
                          });
                          const center = extractWktCenter(parcel.geom);
                          zoomToCoordinates(center[0], center[1], 17);
                          if (onLocateParcel) {
                            onLocateParcel(parcel);
                          }
                        }} 
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gov-blue hover:bg-gov-blue hover:text-white rounded-lg border border-gov-blue/20 transition shadow-2xs group cursor-pointer" 
                        title="Locate Plot on Map"
                      >
                        <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Locate</span>
                      </button>
                      {isOperator && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedParcelForEdit(parcel);
                              setIsEditing(true);
                            }} 
                            className="p-1 hover:text-amber-600 hover:bg-slate-100 rounded"
                            title="Edit Attributes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {processedParcels.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No spatial land parcels found matching selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Parcel Attributes Modal Panel */}
      {isEditing && selectedParcelForEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-30">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                {selectedParcelForEdit.id ? 'Modify Parcel Attributes' : 'Create New Land Parcel'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Parcel ID</label>
                  <input
                    type="text"
                    required
                    value={selectedParcelForEdit.parcelId || ''}
                    onChange={(e) => setSelectedParcelForEdit({ ...selectedParcelForEdit, parcelId: e.target.value })}
                    className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Plot Number</label>
                  <input
                    type="text"
                    required
                    value={selectedParcelForEdit.plotNumber || ''}
                    onChange={(e) => setSelectedParcelForEdit({ ...selectedParcelForEdit, plotNumber: e.target.value })}
                    className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Survey/Khasra Number</label>
                  <input
                    type="text"
                    value={selectedParcelForEdit.surveyNumber || ''}
                    onChange={(e) => setSelectedParcelForEdit({ ...selectedParcelForEdit, surveyNumber: e.target.value })}
                    className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Area (Acres)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={selectedParcelForEdit.areaAcres || ''}
                    onChange={(e) => setSelectedParcelForEdit({ ...selectedParcelForEdit, areaAcres: parseFloat(e.target.value) })}
                    className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Availability Status</label>
                  <select
                    value={selectedParcelForEdit.availabilityStatus}
                    onChange={(e: any) => setSelectedParcelForEdit({ ...selectedParcelForEdit, availabilityStatus: e.target.value })}
                    className="border border-slate-200 rounded px-2.5 py-1.5 w-full bg-white focus:outline-none"
                  >
                    <option value="Vacan">Vacan</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Doubtful">Doubtful (Yellow)</option>
                    <option value="Inner Road">Inner Road</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Land Classification</label>
                  <input
                    type="text"
                    value={selectedParcelForEdit.landClassification || ''}
                    onChange={(e) => setSelectedParcelForEdit({ ...selectedParcelForEdit, landClassification: e.target.value })}
                    className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Ownership details</label>
                <input
                  type="text"
                  value={selectedParcelForEdit.ownershipDetails || ''}
                  onChange={(e) => setSelectedParcelForEdit({ ...selectedParcelForEdit, ownershipDetails: e.target.value })}
                  className="border border-slate-200 rounded px-2.5 py-1.5 w-full focus:border-gov-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gov-blue text-white rounded hover:bg-gov-blue/90 font-bold shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
