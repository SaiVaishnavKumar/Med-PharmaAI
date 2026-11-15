import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  Plus,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Clock,
  Printer,
  FileText,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { pharmacyStore } from '../services/pharmacyStore';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const medicines = pharmacyStore.getMedicines();
  const alerts = pharmacyStore.getAlerts();
  const sales = pharmacyStore.sales;
  const movements = pharmacyStore.movements;

  const lowStock = medicines.filter((m) => m.stock <= m.reorderLevel);
  const nearExpiryCount = alerts.filter((a) => a.type === 'NEAR_EXPIRY').length;
  const totalUnits = medicines.reduce((sum, m) => sum + m.stock, 0);

  // Today's Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Executive Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
            {formattedDate}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            {getGreeting()}, {user.name.split(' ')[0]}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time pharmacy dispensing velocity, FEFO batch levels, and safety audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-4 h-4" />}
          >
            Print Overview
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/pos')}
            icon={<ShoppingCart className="w-4 h-4" />}
          >
            New Sale
          </Button>
        </div>
      </div>

      {/* Safety & Compliance Announcement */}
      <div className="rounded-xl bg-gradient-to-r from-teal-900 to-teal-800 text-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-teal-700/60 text-teal-200 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base font-display">
              FEFO Dispensing & Audit Trail Enforced
            </h3>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-0.5 max-w-2xl leading-relaxed">
              Stock allocations automatically prioritize earliest expiration batches. Expired batches are segregated from the POS terminal.
            </p>
          </div>
        </div>
        <Link
          to="/inventory"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors self-start sm:self-auto flex items-center gap-1.5 whitespace-nowrap"
        >
          Audit Batches <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Column KPI Grid (1 col on mobile, 2 on tablet, 4 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Catalogue"
          value={medicines.length}
          note="Formulary products"
          icon={<Package className="w-4 h-4" />}
          tone="teal"
        />
        <StatCard
          label="Saleable Units"
          value={totalUnits.toLocaleString()}
          note="In non-expired batches"
          icon={<Boxes className="w-4 h-4" />}
          tone="indigo"
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStock.length}
          note={lowStock.length > 0 ? 'Requires purchase orders' : 'All above reorder level'}
          icon={<AlertTriangle className="w-4 h-4" />}
          tone="amber"
          warning={lowStock.length > 0}
        />
        <StatCard
          label="Near Expiry (30d)"
          value={nearExpiryCount}
          note={nearExpiryCount > 0 ? 'Urgent dispatch priority' : 'No 30-day expirations'}
          icon={<Clock className="w-4 h-4" />}
          tone="rose"
          warning={nearExpiryCount > 0}
        />
      </div>

      {/* Main Content Grid: Stock Health + Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stock Health & Low Inventory Widget (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800 font-display">Stock Replenishment</h3>
                <p className="text-xs text-slate-500">Products at or below designated reorder threshold</p>
              </div>
              <Link
                to="/inventory"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
              >
                View Inventory <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {lowStock.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">All stocks healthy</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Every medicine meets safe inventory levels.</p>
                </div>
              ) : (
                lowStock.slice(0, 5).map((med) => {
                  const percent = Math.min(100, Math.round((med.stock / med.reorderLevel) * 100));
                  return (
                    <div key={med.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center flex-shrink-0 border border-amber-200/60 font-display">
                          {med.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{med.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {med.sku} • {med.category?.name ?? 'General'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-bold text-slate-800">
                            {med.stock} {med.unit}
                          </span>
                          <Badge variant="warning" size="sm">
                            Reorder at {med.reorderLevel}
                          </Badge>
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                          <div
                            className={`h-full rounded-full ${
                              percent <= 25 ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total {lowStock.length} items flagged for replenishment</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/purchases')}
              icon={<Truck className="w-3.5 h-3.5" />}
            >
              Raise Purchase Order
            </Button>
          </div>
        </div>

        {/* Right: Quick Action Hub & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 font-display mb-3">Quick Operations</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/pos"
                className="p-3 rounded-lg border border-slate-200/80 hover:border-teal-500 hover:bg-teal-50/40 transition-all flex flex-col items-start group"
              >
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors mb-2">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-800 font-display">Point of Sale</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Dispense with FEFO</span>
              </Link>

              <Link
                to="/medicines"
                className="p-3 rounded-lg border border-slate-200/80 hover:border-teal-500 hover:bg-teal-50/40 transition-all flex flex-col items-start group"
              >
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors mb-2">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-800 font-display">Add Medicine</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Catalogue entry</span>
              </Link>

              <Link
                to="/purchases"
                className="p-3 rounded-lg border border-slate-200/80 hover:border-teal-500 hover:bg-teal-50/40 transition-all flex flex-col items-start group"
              >
                <div className="p-2 rounded-lg bg-sky-50 text-sky-700 group-hover:bg-sky-700 group-hover:text-white transition-colors mb-2">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-800 font-display">Procurement</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Orders & Receiving</span>
              </Link>

              <Link
                to="/returns"
                className="p-3 rounded-lg border border-slate-200/80 hover:border-teal-500 hover:bg-teal-50/40 transition-all flex flex-col items-start group"
              >
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-colors mb-2">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-800 font-display">Sales Return</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Audit & Restock</span>
              </Link>
            </div>
          </div>

          {/* Recent Dispensing / Audit Stream */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 font-display">Recent Audit Events</h3>
              <Link to="/sales" className="text-xs text-teal-700 hover:underline font-semibold">
                View Log
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {movements.slice(0, 4).map((mov) => (
                <div key={mov.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                  <span
                    className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${
                      mov.type === 'SALE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : mov.type === 'PURCHASE'
                        ? 'bg-teal-50 text-teal-700'
                        : mov.type === 'RETURN'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {mov.type === 'SALE' ? (
                      <ShoppingCart className="w-3.5 h-3.5" />
                    ) : mov.type === 'PURCHASE' ? (
                      <Truck className="w-3.5 h-3.5" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{mov.medicineName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{mov.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-bold ${
                        mov.quantity > 0 ? 'text-emerald-600' : 'text-slate-600'
                      }`}
                    >
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sales Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 border border-teal-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
              Today's Dispensing Turnover
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-800 font-display">
              ₹{todayRevenue.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({todaySales.length} completed transactions)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/sales"
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Review Invoices
          </Link>
          <Link
            to="/reports"
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            Analytics & Valuation <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
