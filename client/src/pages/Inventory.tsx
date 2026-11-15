import { useState, useEffect } from 'react';
import {
  Boxes,
  Package,
  Search,
  AlertTriangle,
  Clock,
  Printer,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import type { MedicineBatch } from '../types';

export function Inventory() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'healthy' | 'near_expiry' | 'expired'>('all');
  const [selectedBatchForAdjustment, setSelectedBatchForAdjustment] = useState<MedicineBatch | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const batches = pharmacyStore.getBatches();
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);

  // Filter batches
  let filtered = batches.filter((b) => {
    const medName = b.medicine?.name?.toLowerCase() ?? '';
    const sku = b.medicine?.sku?.toLowerCase() ?? '';
    const batchNum = b.batchNumber.toLowerCase();
    const supName = b.supplier?.name?.toLowerCase() ?? '';
    const q = search.trim().toLowerCase();

    const matchesSearch = !q || medName.includes(q) || sku.includes(q) || batchNum.includes(q) || supName.includes(q);
    if (!matchesSearch) return false;

    const exp = new Date(b.expiryDate);
    if (filter === 'expired') return exp <= today;
    if (filter === 'near_expiry') return exp > today && exp <= thirtyDaysLater;
    if (filter === 'healthy') return exp > thirtyDaysLater;
    return true;
  });

  const saleableUnits = batches
    .filter((b) => new Date(b.expiryDate) > today)
    .reduce((sum, b) => sum + b.availableQuantity, 0);

  const expiredUnits = batches
    .filter((b) => new Date(b.expiryDate) <= today)
    .reduce((sum, b) => sum + b.availableQuantity, 0);

  const nearExpiryCount = batches.filter(
    (b) => new Date(b.expiryDate) > today && new Date(b.expiryDate) <= thirtyDaysLater && b.availableQuantity > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
            Batch Control & Traceability
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            Batch Inventory Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor lot numbers, shelf-life expiration countdowns, and auditable stock count variances.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          icon={<Printer className="w-4 h-4" />}
        >
          Print Inventory Sheet
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Saleable Batch Units"
          value={saleableUnits.toLocaleString()}
          note="Non-expired available"
          icon={<Boxes className="w-4 h-4" />}
          tone="teal"
        />
        <StatCard
          label="Tracked Lot Batches"
          value={batches.length}
          note="Across all suppliers"
          icon={<Package className="w-4 h-4" />}
          tone="indigo"
        />
        <StatCard
          label="Batches Near Expiry"
          value={nearExpiryCount}
          note="Within next 30 days"
          icon={<Clock className="w-4 h-4" />}
          tone="amber"
          warning={nearExpiryCount > 0}
        />
        <StatCard
          label="Expired Batch Stock"
          value={expiredUnits}
          note={expiredUnits > 0 ? 'Requires quarantine disposal' : 'Zero expired units in stock'}
          icon={<AlertTriangle className="w-4 h-4" />}
          tone="rose"
          warning={expiredUnits > 0}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by lot number, medicine name, or supplier..."
              className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {batches.length} batches
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-teal-700 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Batches ({batches.length})
          </button>
          <button
            onClick={() => setFilter('healthy')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'healthy'
                ? 'bg-teal-700 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Healthy Shelf-Life
          </button>
          <button
            onClick={() => setFilter('near_expiry')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'near_expiry'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Near Expiry &lt; 30d ({nearExpiryCount})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'expired'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No batches found"
            message="No stock batches match your current search criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearch('');
              setFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider font-display">
                  <th className="py-3 px-4">Medicine Formulary</th>
                  <th className="py-3 px-3">Batch Lot</th>
                  <th className="py-3 px-3">Contracted Supplier</th>
                  <th className="py-3 px-3">Available</th>
                  <th className="py-3 px-3">Quarantine</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3">Cost / Sell</th>
                  <th className="py-3 px-4 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const expDate = new Date(b.expiryDate);
                  const isExpired = expDate <= today;
                  const isNear = !isExpired && expDate <= thirtyDaysLater;
                  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {b.medicine?.name ?? 'Medicine'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {b.medicine?.sku}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[160px]">
                        {b.supplier?.name ?? 'Direct Procurement'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 font-display">
                          {b.availableQuantity}
                        </span>{' '}
                        <span className="text-slate-400 text-xs">{b.medicine?.unit ?? 'units'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={b.quarantinedQuantity > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                          {b.quarantinedQuantity || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-medium text-slate-800">
                            {new Date(b.expiryDate).toLocaleDateString()}
                          </span>
                          <div className="mt-0.5">
                            {isExpired ? (
                              <Badge variant="danger" size="sm" dot>
                                Expired ({Math.abs(diffDays)}d ago)
                              </Badge>
                            ) : isNear ? (
                              <Badge variant="warning" size="sm" dot>
                                {diffDays} days left
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Healthy
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <span className="text-slate-500">₹{b.purchasePrice.toFixed(2)}</span> /{' '}
                        <span className="font-semibold text-slate-800">₹{b.sellingPrice.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBatchForAdjustment(b)}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedBatchForAdjustment && (
        <StockAdjustmentModal
          batch={selectedBatchForAdjustment}
          onClose={() => setSelectedBatchForAdjustment(null)}
        />
      )}
    </div>
  );
}

function StockAdjustmentModal({
  batch,
  onClose,
}: {
  batch: MedicineBatch;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = Number(delta);
    if (isNaN(d) || d === 0) {
      setError('Please enter a non-zero adjustment amount (+ to add, - to remove).');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setError('A mandatory audit reason is required for compliance (min 3 characters).');
      return;
    }

    setBusy(true);
    setError('');

    try {
      pharmacyStore.adjustStock({
        batchId: batch.id,
        delta: d,
        reason: reason.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adjustment failed.');
    } finally {
      setBusy(false);
    }
  };

  const newProjected = batch.availableQuantity + (Number(delta) || 0);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Audited Stock Adjustment"
      subtitle="Log physical inventory count variances, damaged stock, or returns."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Batch Info Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Medicine:</span>
            <span className="font-semibold text-slate-800">{batch.medicine?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Batch Lot Number:</span>
            <span className="font-mono font-bold text-slate-800">{batch.batchNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Current Available Stock:</span>
            <span className="font-bold text-teal-800">{batch.availableQuantity} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Expiration Date:</span>
            <span className="text-slate-700">{batch.expiryDate}</span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Quantity Delta (+ to add, - to remove) *
          </label>
          <input
            required
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="e.g. -2 for damaged, +5 for recount variance"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          />
          {delta && !isNaN(Number(delta)) && (
            <p className="text-[11px] text-slate-500 mt-1">
              Projected balance after audit: <b>{newProjected}</b> units
            </p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Mandatory Audit Justification *
          </label>
          <textarea
            required
            minLength={3}
            maxLength={500}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Physical inventory variance audit on shelf B-1, bottle seal damage during unpacking..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={busy}>
            Record Stock Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
