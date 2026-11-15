import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Eye,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

export function SalesHistory() {
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const sales = pharmacyStore.sales;

  const filtered = sales.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      s.cashierName.toLowerCase().includes(q)
    );
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
            Dispensing Journal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            Sales & Dispensing History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse completed pharmacy customer transactions, inspect batch allocations, and print invoices.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium block">All-Time Dispensed</span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
            ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, patient name, or cashier..."
            className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> invoices
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No sales transactions found"
            message={
              search
                ? `No invoices match "${search}".`
                : 'No sales have been processed yet. Start dispensing at the Point of Sale.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider font-display">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Patient / Customer</th>
                  <th className="py-3 px-3">Cashier</th>
                  <th className="py-3 px-3">Items Count</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        to={`/invoices/${s.invoiceNumber}`}
                        className="font-mono font-bold text-teal-800 hover:text-teal-950 hover:underline flex items-center gap-1"
                      >
                        {s.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{new Date(s.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {s.customerName ?? 'Walk-in'}
                      </div>
                      {s.customerPhone && (
                        <div className="text-[11px] text-slate-400">{s.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{s.cashierName}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {s.items.reduce((sum, i) => sum + i.quantity, 0)} units ({s.items.length} line items)
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="neutral" size="sm">
                        {s.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 font-display">
                      ₹{s.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/invoices/${s.invoiceNumber}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline p-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
