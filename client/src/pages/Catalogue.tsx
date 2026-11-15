import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

export function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const categories = pharmacyStore.categories;
  const medicines = pharmacyStore.getMedicines(search, selectedCategory);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
            Formulary Management
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            Medicine Catalogue
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search products, manage unit prices, reorder levels, and track shelf stock.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Medicine
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, generic, SKU, or brand..."
              className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-slate-700">{medicines.length}</span> products found
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-teal-700 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-teal-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {medicines.length === 0 ? (
          <EmptyState
            title="No medicines found"
            message={
              search
                ? `No medicines match your query "${search}". Try checking for typos or clear filters.`
                : 'Your catalogue is currently empty. Add your first medicine to get started.'
            }
            actionText={search ? 'Clear Search' : 'Add Medicine'}
            onAction={search ? () => handleSearchChange('') : () => setShowAddModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider font-display">
                  <th className="py-3 px-4">Medicine & Generic</th>
                  <th className="py-3 px-3">SKU & Barcode</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Selling Price</th>
                  <th className="py-3 px-3">On Hand Stock</th>
                  <th className="py-3 px-3">Reorder Threshold</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => {
                  const isLow = m.stock <= m.reorderLevel;
                  const isOut = m.stock === 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 font-bold flex items-center justify-center flex-shrink-0 border border-teal-100 font-display">
                            {m.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {m.name}
                              {m.prescriptionRequired && (
                                <span className="text-[10px] font-bold px-1 rounded bg-rose-100 text-rose-700" title="Prescription Required (Schedule H)">
                                  Rx
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {m.genericName ? m.genericName : m.brand ?? 'Medicine'}
                              {m.rackLocation && ` • ${m.rackLocation}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-700">{m.sku}</span>
                        {m.barcode && (
                          <div className="text-[10px] text-slate-400 font-mono">{m.barcode}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {m.category?.name ?? 'General'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 font-display">
                        ₹{m.sellingPrice.toFixed(2)}
                        <span className="text-[10px] font-normal text-slate-400 block">per {m.unit}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {m.stock} {m.unit}s
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m.batchCount} active batch{m.batchCount === 1 ? '' : 'es'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {m.reorderLevel} {m.unit}s
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isOut ? (
                          <Badge variant="danger" size="sm" dot>
                            Out of Stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="warning" size="sm" dot>
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>
                            In Stock
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
      />
    </div>
  );
}

function AddMedicineModal({
  isOpen,
  onClose,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
}) {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [unit, setUnit] = useState('strip');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('15');
  const [rackLocation, setRackLocation] = useState('Rack A-1');
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Medicine name is required.');
    if (!sku.trim()) return setError('Unique SKU identifier is required.');
    if (!sellingPrice || Number(sellingPrice) <= 0)
      return setError('Please enter a valid positive selling price.');

    try {
      pharmacyStore.addMedicine({
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        brand: brand.trim() || undefined,
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        categoryId: categoryId || categories[0]?.id,
        unit,
        sellingPrice: Number(sellingPrice),
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        reorderLevel: Number(reorderLevel) || 10,
        rackLocation: rackLocation.trim() || undefined,
        prescriptionRequired,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create medicine.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Medicine to Catalogue"
      subtitle="Define formulary specifications, unit pricing, and reorder limits."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Medicine Brand Name *
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dolo 650mg Paracetamol"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Generic Chemical Name
            </label>
            <input
              type="text"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="e.g. Paracetamol"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Manufacturer / Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Micro Labs"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Unique SKU *</label>
            <input
              required
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. DOLO-650"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Barcode / EAN</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 8901082001015"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Therapeutic Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispensing Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 bg-white"
            >
              <option value="strip">Strip (Tablets/Capsules)</option>
              <option value="bottle">Bottle (Syrup/Suspension)</option>
              <option value="tube">Tube (Cream/Ointment)</option>
              <option value="vial">Vial / Ampoule (Injection)</option>
              <option value="device">Device (Inhaler/Kit)</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="e.g. 32.50"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="e.g. 22.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reorder Threshold *</label>
            <input
              required
              type="number"
              min="1"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              placeholder="e.g. 20"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Storage / Shelf Location</label>
            <input
              type="text"
              value={rackLocation}
              onChange={(e) => setRackLocation(e.target.value)}
              placeholder="e.g. Rack B-2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={prescriptionRequired}
              onChange={(e) => setPrescriptionRequired(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <span className="font-semibold text-xs sm:text-sm">
              Prescription Required (Schedule H / H1 Drug)
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Medicine
          </Button>
        </div>
      </form>
    </Modal>
  );
}
