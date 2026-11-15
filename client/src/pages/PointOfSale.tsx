import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Printer,
  ArrowUpRight,
  User,
  Phone,
  FileCheck,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import type { Medicine, Sale } from '../types';

export function PointOfSale() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'OTHER'>('UPI');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [prescriptionVerified, setPrescriptionVerified] = useState(false);
  const [notes, setNotes] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const categories = pharmacyStore.categories;
  const medicines = pharmacyStore.getMedicines(search, selectedCategory);
  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const totalCartCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);

  // Calculate pricing
  const subtotal = cartEntries.reduce((sum, [id, qty]) => {
    const med = pharmacyStore.getMedicineById(id);
    return sum + (med?.sellingPrice ?? 0) * qty;
  }, 0);

  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const taxable = subtotal - discountAmount;
  const gstAmount = Number((taxable * 0.05).toFixed(2));
  const grandTotal = Number((taxable + gstAmount).toFixed(2));

  // Check if any cart item requires prescription
  const hasRxItem = cartEntries.some(([id]) => {
    const med = pharmacyStore.getMedicineById(id);
    return med?.prescriptionRequired;
  });

  const addToCart = (med: Medicine) => {
    if (med.stock <= 0) return;
    setCart((prev) => {
      const current = prev[med.id] || 0;
      if (current >= med.stock) return prev;
      return { ...prev, [med.id]: current + 1 };
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    const med = pharmacyStore.getMedicineById(id);
    if (!med) return;
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      if (next > med.stock) return prev;
      return { ...prev, [id]: next };
    });
  };

  const clearCart = () => {
    setCart({});
    setError('');
  };

  const handleCheckout = () => {
    if (cartEntries.length === 0) return;
    if (hasRxItem && !prescriptionVerified) {
      setError('Prescription verification is mandatory for Schedule H prescription medicines in cart.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const items = cartEntries.map(([medicineId, quantity]) => ({
        medicineId,
        quantity,
      }));

      const sale = pharmacyStore.executeSale({
        items,
        customerName,
        customerPhone,
        paymentMethod,
        discountPercent,
        notes: notes.trim() || undefined,
      });

      setCompletedSale(sale);
      setCart({});
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercent(0);
      setPrescriptionVerified(false);
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sale could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* POS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
            Dispensing Terminal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            Point of Sale
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automatic FEFO batch allocation: Earliest expiring batches are automatically deducted.
          </p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden rounded-lg bg-slate-200/80 p-1 text-xs font-semibold">
          <button
            onClick={() => setMobileTab('products')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
              mobileTab === 'products' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Medicines ({medicines.length})
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'cart' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Cart</span>
            {totalCartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Products / Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Picker (7 cols) */}
        <div
          className={`lg:col-span-7 space-y-3 ${
            mobileTab === 'cart' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Search & Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan barcode, search medicine name, or SKU..."
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-teal-700 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3 max-h-[600px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {medicines.length === 0 ? (
              <EmptyState
                title="No medicines found"
                message="No products match your search. Verify the barcode or formulary SKU."
              />
            ) : (
              medicines.map((m) => {
                const isOutOfStock = m.stock <= 0;
                const inCartQty = cart[m.id] || 0;
                const remainingAvail = m.stock - inCartQty;

                return (
                  <div
                    key={m.id}
                    className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 font-bold flex items-center justify-center flex-shrink-0 border border-teal-100 font-display text-xs">
                        {m.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                          {m.name}
                          {m.prescriptionRequired && (
                            <span className="text-[10px] font-bold px-1 rounded bg-rose-100 text-rose-700" title="Prescription Required">
                              Rx
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {m.sku} • {m.genericName ?? m.brand} • {m.rackLocation}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 font-display">
                          ₹{m.sellingPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px]">
                          {isOutOfStock ? (
                            <span className="text-rose-600 font-semibold">Out of Stock</span>
                          ) : (
                            <span className="text-slate-400">{remainingAvail} avail</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(m)}
                        disabled={isOutOfStock || remainingAvail <= 0}
                        className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-700 text-teal-700 hover:text-white border border-teal-200 hover:border-teal-700 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                        aria-label={`Add ${m.name} to cart`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Cart & Checkout (5 cols) */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileTab === 'products' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-sm sm:text-base text-slate-800 font-display">
                  Current Dispensing Cart
                </h3>
              </div>
              {cartEntries.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cartEntries.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center">
                <ShoppingCart className="w-10 h-10 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Cart is empty</p>
                <p className="text-[11px] mt-0.5">Select a medicine from the left catalogue.</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 scrollbar-thin">
                {cartEntries.map(([id, qty]) => {
                  const med = pharmacyStore.getMedicineById(id);
                  if (!med) return null;
                  const lineTotal = med.sellingPrice * qty;

                  return (
                    <div key={id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate">{med.name}</p>
                        <p className="text-[11px] text-slate-400">
                          ₹{med.sellingPrice.toFixed(2)} × {qty} {med.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Qty Controls */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateQuantity(id, -1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-slate-800 text-xs">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(id, 1)}
                            disabled={qty >= med.stock}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-slate-900 w-16 text-right font-display">
                          ₹{lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Prescription Warning if required */}
            {hasRxItem && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <FileCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Prescription Medicine Alert</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Cart includes Schedule H / Prescription medications. Pharmacist verification is legally mandated.
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prescriptionVerified}
                    onChange={(e) => setPrescriptionVerified(e.target.checked)}
                    className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-amber-900 text-[11px]">
                    Valid prescription verified by on-duty pharmacist
                  </span>
                </label>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 font-display">
                Customer Details
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Patient Name"
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Mobile (+91)"
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 font-display">
                Payment Mode
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all text-xs ${
                    paymentMethod === 'UPI'
                      ? 'bg-teal-50 border-teal-600 text-teal-800 ring-1 ring-teal-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-600" /> UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all text-xs ${
                    paymentMethod === 'CASH'
                      ? 'bg-teal-50 border-teal-600 text-teal-800 ring-1 ring-teal-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-teal-600" /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all text-xs ${
                    paymentMethod === 'CARD'
                      ? 'bg-teal-50 border-teal-600 text-teal-800 ring-1 ring-teal-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Card
                </button>
              </div>
            </div>

            {/* Discount Selector */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Customer Discount</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      discountPercent === pct
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-medium">- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>GST (5% SGST/CGST)</span>
                <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200 font-display">
                <span>Total Amount Due</span>
                <span className="text-teal-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Checkout Action Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md"
              disabled={cartEntries.length === 0 || busy}
              loading={busy}
              onClick={handleCheckout}
              icon={<CheckCircle2 className="w-5 h-5" />}
            >
              Complete Sale & Dispense
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>FEFO auto-allocation guarantees non-expired batch release</span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal upon Sale Completion */}
      {completedSale && (
        <InvoicePrintModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}

function InvoicePrintModal({
  sale,
  onClose,
}: {
  sale: Sale;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Sale Completed Successfully"
      subtitle={`Tax Invoice ${sale.invoiceNumber} • Ready for thermal or A4 printing`}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Success Banner */}
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-xs sm:text-sm">
              Transaction recorded & stock deducted via FEFO
            </span>
          </div>
          <Badge variant="success" size="sm">
            PAID ({sale.paymentMethod})
          </Badge>
        </div>

        {/* Printable Receipt Card */}
        <div id="printable-receipt" className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-3 font-mono text-xs">
          {/* Pharmacy Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-sm text-slate-900 font-sans">MEADOW HEALTH PHARMACY</h4>
            <p className="text-[11px] text-slate-500 font-sans">Central Healthcare Hospital Campus</p>
            <p className="text-[10px] text-slate-400">GSTIN: 27AABCM9988P1Z4 • D.L. No: 20B/MH-0928</p>
          </div>

          {/* Invoice Meta */}
          <div className="flex justify-between text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-300">
            <div>
              <p>Invoice: <b className="text-slate-800">{sale.invoiceNumber}</b></p>
              <p>Patient: {sale.customerName ?? 'Walk-in'}</p>
            </div>
            <div className="text-right">
              <p>{new Date(sale.createdAt).toLocaleDateString()}</p>
              <p>Cashier: {sale.cashierName.split(' ')[0]}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1 font-sans">{item.medicineName}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-1 text-right">₹{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-right text-[11px]">
            <p>Subtotal: ₹{sale.subtotal.toFixed(2)}</p>
            {sale.discount > 0 && <p>Discount: -₹{sale.discount.toFixed(2)}</p>}
            <p>GST 5%: ₹{sale.taxAmount.toFixed(2)}</p>
            <p className="text-sm font-bold text-slate-900 font-sans pt-1">
              Total Paid: ₹{sale.totalAmount.toFixed(2)}
            </p>
          </div>

          {/* FEFO Batch Traceability Footer */}
          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400">
            <span className="font-bold text-slate-600">Batch Allocations:</span>
            {sale.allocations.map((a, i) => (
              <span key={i} className="block">
                • {a.medicineName ?? a.medicineId} (Lot {a.batchNumber}, Exp {a.expiryDate}): {a.quantity} units
              </span>
            ))}
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400 font-sans">
            Thank you for choosing Meadow Health. Keep medicines in a cool, dry place.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <Link
            to={`/invoices/${sale.invoiceNumber}`}
            className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
          >
            Open Full Invoice Details <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Done
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-4 h-4" />}
            >
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
