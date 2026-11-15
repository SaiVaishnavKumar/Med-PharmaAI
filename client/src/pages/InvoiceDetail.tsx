import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

export function InvoiceDetail() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();

  const sale = pharmacyStore.sales.find(
    (s) => s.invoiceNumber.toLowerCase() === (invoiceNumber ?? '').toLowerCase()
  );

  if (!sale) {
    return (
      <div className="space-y-4">
        <Link
          to="/sales"
          className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sales History
        </Link>
        <EmptyState
          title="Invoice not found"
          message={`No transaction record found with invoice number "${invoiceNumber}".`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/60 print:hidden">
        <Link
          to="/sales"
          className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sales History
        </Link>

        <div className="flex items-center gap-2">
          <Link to={`/returns?search=${encodeURIComponent(sale.invoiceNumber)}`}>
            <Button variant="outline" size="sm">
              Process Return
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-4 h-4" />}
          >
            Print Tax Invoice
          </Button>
        </div>
      </div>

      {/* Official Tax Invoice Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Pharmacy Official Letterhead */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-extrabold flex items-center justify-center font-display text-lg">
                M
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  MEADOW HEALTH CENTRAL PHARMACY
                </h2>
                <p className="text-xs text-slate-500">Retail & Institutional Pharmacy Dispensing</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Campus Block B, Medical Square, Central Health City</p>
              <p>DL No: 20B/MH-2024-9988 • 21B/MH-2024-9989</p>
              <p>GSTIN: 27AABCM9988P1Z4</p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              ORIGINAL TAX INVOICE
            </span>
            <div className="text-xl font-mono font-bold text-slate-900 pt-1">
              {sale.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500">
              Issued: {new Date(sale.createdAt).toLocaleString()}
            </div>
            <Badge variant="success" size="sm" className="mt-1">
              STATUS: PAID ({sale.paymentMethod})
            </Badge>
          </div>
        </div>

        {/* Patient & Dispenser Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block font-display">
              Billed To Patient
            </span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{sale.customerName ?? 'Walk-in Patient'}</p>
            {sale.customerPhone && <p className="text-slate-500 mt-0.5">Phone: {sale.customerPhone}</p>}
            {sale.notes && (
              <p className="text-slate-500 mt-1 italic">Note: {sale.notes}</p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block font-display">
              Dispensing Pharmacist
            </span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{sale.cashierName}</p>
            <p className="text-slate-500 mt-0.5">Reg. No: PHAR-MH-8921</p>
            <p className="text-slate-400 text-[11px] mt-0.5">FEFO Algorithm Verified</p>
          </div>
        </div>

        {/* Itemized Medications Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] font-display">
                <th className="py-2.5">Medication Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit MRP</th>
                <th className="py-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item) => (
                <tr key={item.id} className="text-slate-800">
                  <td className="py-3">
                    <div className="font-semibold text-slate-900">{item.medicineName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                  </td>
                  <td className="py-3 text-center font-semibold">
                    {item.quantity} {item.unit}s
                  </td>
                  <td className="py-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-bold font-display">
                    ₹{item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Totals */}
        <div className="pt-3 border-t border-slate-200 flex flex-col items-end">
          <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Gross Subtotal</span>
              <span className="font-medium text-slate-800">₹{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Allowed</span>
                <span className="font-medium">- ₹{sale.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (5% SGST 2.5% + CGST 2.5%)</span>
              <span className="font-medium text-slate-800">₹{sale.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t-2 border-slate-800 font-display">
              <span>Grand Total</span>
              <span className="text-teal-800">₹{sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* FEFO Batch Audit Trail */}
        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-700 font-display">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Traceable Batch Allocations (FEFO Dispensing Log)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
            {sale.allocations.map((a, i) => (
              <div key={i} className="p-2 rounded bg-white border border-slate-200/80">
                <span className="font-semibold text-slate-800 block">
                  {a.medicineName ?? a.medicineId}
                </span>
                <span className="font-mono text-slate-500">
                  Batch: {a.batchNumber} • Expiry: {a.expiryDate} • Qty: {a.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer & Signatures */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            <p>Terms: Goods once sold are returnable within 7 days with original invoice.</p>
            <p>Stored under controlled pharmaceutical room temperature.</p>
          </div>

          <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 w-full sm:w-auto">
            <div className="h-10 flex items-center justify-center sm:justify-end text-slate-300 italic font-serif">
              [Authorized Pharmacist Sign]
            </div>
            <p className="font-bold text-slate-700">{sale.cashierName}</p>
            <p className="text-[10px]">Registered Pharmacist</p>
          </div>
        </div>
      </div>
    </div>
  );
}
