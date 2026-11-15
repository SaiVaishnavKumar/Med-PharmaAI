import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';

export function Returns() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState(initialSearch);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [restockFlags, setRestockFlags] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const sales = pharmacyStore.sales;
  const filteredSales = search.trim()
    ? sales.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase()))
      )
    : sales.slice(0, 5);

  const activeSale = sales.find(
    (s) => s.invoiceNumber.toLowerCase() === selectedInvoiceNumber.toLowerCase()
  );

  const handleQuantityChange = (key: string, max: number, val: number) => {
    const clamped = Math.max(0, Math.min(max, val));
    setReturnQuantities((prev) => ({ ...prev, [key]: clamped }));
  };

  const handleRestockToggle = (key: string, checked: boolean) => {
    setRestockFlags((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!activeSale) return;

    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => {
        const [saleItemId, batchId] = key.split('|');
        return {
          saleItemId,
          batchId,
          quantity: qty,
          restock: restockFlags[key] ?? true,
        };
      });

    if (itemsToReturn.length === 0) {
      setError('Please specify a return quantity of at least 1 unit.');
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setError('A mandatory return reason is required for pharmacy audit compliance (min 3 chars).');
      return;
    }

    setBusy(true);

    try {
      pharmacyStore.processReturn({
        items: itemsToReturn,
        reason: reason.trim(),
      });

      setSuccessMessage(
        `Sales return recorded for invoice ${activeSale.invoiceNumber}. Audit trail and stock records updated.`
      );
      setReturnQuantities({});
      setRestockFlags({});
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Return failed to process.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/60">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
          After-Sales & Stock Reversal
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
          Sales Returns & Restocking
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Locate the original dispensing invoice, select returned batches, and designate restock vs. quarantine disposal.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Step 1: Invoice Lookup */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-2">
          <span>1. Select Original Dispensing Invoice</span>
        </h3>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type invoice number (e.g. INV-2026-00101) or customer name..."
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          />
        </div>

        {/* Invoice Candidates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {filteredSales.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedInvoiceNumber(s.invoiceNumber);
                setReturnQuantities({});
                setSuccessMessage('');
              }}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                selectedInvoiceNumber.toLowerCase() === s.invoiceNumber.toLowerCase()
                  ? 'bg-teal-50 border-teal-600 text-teal-900 ring-1 ring-teal-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold">{s.invoiceNumber}</span>
                <span className="font-bold text-slate-900">₹{s.totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>{s.customerName ?? 'Walk-in'}</span>
                <span>{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Return Items from selected invoice */}
      {activeSale && (
        <form
          onSubmit={handleSubmitReturn}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-display">
                2. Select Items & Quantities to Return
              </h3>
              <p className="text-xs text-slate-500">
                Invoice {activeSale.invoiceNumber} • Billed to {activeSale.customerName ?? 'Walk-in'}
              </p>
            </div>
            <Link
              to={`/invoices/${activeSale.invoiceNumber}`}
              target="_blank"
              className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
            >
              View Full Invoice <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Allocations and return quantities */}
          <div className="divide-y divide-slate-100">
            {activeSale.allocations.map((alloc) => {
              const item = activeSale.items.find((i) => i.medicineId === alloc.medicineId);
              const key = `${item?.id ?? alloc.medicineId}|${alloc.batchId}`;
              const qty = returnQuantities[key] || 0;
              const isRestock = restockFlags[key] ?? true;

              return (
                <div key={key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      {alloc.medicineName ?? alloc.medicineId}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Batch Lot: <span className="font-mono font-medium">{alloc.batchNumber}</span> • Expiry: {alloc.expiryDate} • Total Sold: {alloc.quantity} units
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Return Quantity input */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium text-[11px]">Return Qty:</span>
                      <input
                        type="number"
                        min="0"
                        max={alloc.quantity}
                        value={qty}
                        onChange={(e) =>
                          handleQuantityChange(key, alloc.quantity, parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-teal-600"
                      />
                      <span className="text-slate-400 text-[11px]">/ {alloc.quantity}</span>
                    </div>

                    {/* Restock toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isRestock}
                        disabled={qty === 0}
                        onChange={(e) => handleRestockToggle(key, e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          qty > 0
                            ? isRestock
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {isRestock ? 'Restock to Inventory' : 'Quarantine / Discard'}
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mandatory Reason */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            <label className="block font-semibold text-slate-700">
              Mandatory Return Reason *
            </label>
            <textarea
              required
              rows={2}
              minLength={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Patient allergy reported to prescribing physician, incorrect dosage variant dispensed, unopened outer seal verified..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={busy}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Record Return & Update Audit Trail
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
