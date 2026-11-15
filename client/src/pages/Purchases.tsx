import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  PackageCheck,
  Building2,
  Boxes,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import type { PurchaseOrder } from '../types';

export function Purchases() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busyPoId, setBusyPoId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const purchases = pharmacyStore.purchases;
  const suppliers = pharmacyStore.suppliers;
  const medicines = pharmacyStore.medicines;

  const totalProcuredAmount = purchases
    .filter((p) => p.status === 'RECEIVED')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const pendingOrders = purchases.filter((p) => p.status === 'ORDERED' || p.status === 'DRAFT');

  const handleAdvanceStatus = async (po: PurchaseOrder) => {
    setBusyPoId(po.id);
    try {
      if (po.status === 'DRAFT') {
        pharmacyStore.updatePurchaseStatus(po.id, 'ORDERED');
      } else if (po.status === 'ORDERED') {
        pharmacyStore.receivePurchaseOrder(po.id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyPoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
            Procurement & Inward Stock
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            Purchase Orders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Raise procurement orders with suppliers, advance through approval, and receive traceable lot batches into inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/suppliers">
            <Button variant="outline" size="sm" icon={<Building2 className="w-4 h-4" />}>
              Suppliers Directory
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Purchase Orders"
          value={purchases.length}
          note="Lifetime raised orders"
          icon={<ClipboardList className="w-4 h-4" />}
          tone="teal"
        />
        <StatCard
          label="Pending Inward Orders"
          value={pendingOrders.length}
          note="Awaiting delivery / verification"
          icon={<Clock className="w-4 h-4" />}
          tone="amber"
          warning={pendingOrders.length > 0}
        />
        <StatCard
          label="Received Orders"
          value={purchases.filter((p) => p.status === 'RECEIVED').length}
          note="Added to batch stock"
          icon={<CheckCircle2 className="w-4 h-4" />}
          tone="emerald"
        />
        <StatCard
          label="Procured Inventory Value"
          value={`₹${totalProcuredAmount.toLocaleString()}`}
          note="Goods received at cost"
          icon={<Boxes className="w-4 h-4" />}
          tone="indigo"
        />
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {purchases.length === 0 ? (
          <EmptyState
            title="No purchase orders"
            message="No orders have been recorded yet. Create a purchase order to receive stock batches."
            actionText="New Purchase Order"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider font-display">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Items / Lots</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((po) => {
                  const isBusy = busyPoId === po.id;

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {po.purchaseNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{po.supplierName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {po.items.map((i) => `${i.medicineName} (×${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-display">
                        ₹{po.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        {po.status === 'RECEIVED' ? (
                          <Badge variant="success" size="sm" dot>
                            Received & Stocked
                          </Badge>
                        ) : po.status === 'ORDERED' ? (
                          <Badge variant="info" size="sm" dot>
                            Dispatched / Ordered
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Draft PO
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {po.status === 'DRAFT' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={isBusy}
                            onClick={() => handleAdvanceStatus(po)}
                          >
                            Mark Ordered
                          </Button>
                        ) : po.status === 'ORDERED' ? (
                          <Button
                            variant="success"
                            size="sm"
                            loading={isBusy}
                            onClick={() => handleAdvanceStatus(po)}
                            icon={<PackageCheck className="w-3.5 h-3.5" />}
                          >
                            Receive Goods
                          </Button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Stocked
                          </span>
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

      {/* Create Purchase Order Modal */}
      {showCreateModal && (
        <CreatePurchaseOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          suppliers={suppliers}
          medicines={medicines}
        />
      )}
    </div>
  );
}

function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  suppliers,
  medicines,
}: {
  isOpen: boolean;
  onClose: () => void;
  suppliers: { id: string; name: string }[];
  medicines: { id: string; name: string; sku: string; sellingPrice: number }[];
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [medicineId, setMedicineId] = useState(medicines[0]?.id ?? '');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [purchasePrice, setPurchasePrice] = useState('25');
  const [sellingPrice, setSellingPrice] = useState('35');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supplierId) return setError('Please select a supplier.');
    if (!medicineId) return setError('Please select a medicine.');
    if (!batchNumber.trim()) return setError('Batch Lot number is required.');
    if (!expiryDate) return setError('Expiry date is required.');

    try {
      pharmacyStore.createPurchaseOrder({
        supplierId,
        items: [
          {
            medicineId,
            batchNumber: batchNumber.trim().toUpperCase(),
            expiryDate,
            quantity: Number(quantity) || 1,
            purchasePrice: Number(purchasePrice) || 0,
            sellingPrice: Number(sellingPrice) || Number(purchasePrice) * 1.3,
          },
        ],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create purchase order.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Inward Purchase Order"
      subtitle="Issue a procurement order with traceable lot batch numbering."
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
              Select Contracted Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 bg-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Select Medicine Formulary *
            </label>
            <select
              value={medicineId}
              onChange={(e) => {
                setMedicineId(e.target.value);
                const m = medicines.find((x) => x.id === e.target.value);
                if (m) {
                  setSellingPrice(String(m.sellingPrice));
                  setPurchasePrice(String(Math.round(m.sellingPrice * 0.7)));
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 bg-white"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Batch / Lot Number *
            </label>
            <input
              required
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. LOT-2026-X01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Batch Expiry Date *
            </label>
            <input
              required
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quantity (Units) *</label>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Unit Purchase Cost (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Unit Selling MRP (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>
        </div>

        <div className="pt-2 text-right">
          <span className="text-xs text-slate-500">
            Total Purchase Value:{' '}
            <b className="text-slate-900 text-sm font-display">
              ₹{((Number(quantity) || 0) * (Number(purchasePrice) || 0)).toFixed(2)}
            </b>
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Purchase Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
