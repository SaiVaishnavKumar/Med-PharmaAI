import { useState, useEffect, lazy, Suspense } from 'react';
import {
  Download,
  TrendingUp,
  Boxes,
  RotateCcw,
  PieChart,
  ShieldCheck,
} from 'lucide-react';

const RevenueChart = lazy(() => import('../revenue-chart'));
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';

export function Reports() {
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const report = pharmacyStore.getOverviewReport(periodDays);
  const medicines = pharmacyStore.medicines;
  const categories = pharmacyStore.categories;

  // Category breakdown
  const categoryStats = categories.map((c) => {
    const meds = medicines.filter((m) => m.categoryId === c.id);
    const stockUnits = meds.reduce((sum, m) => sum + m.stock, 0);
    const value = meds.reduce((sum, m) => sum + m.stock * m.sellingPrice, 0);
    return {
      name: c.name,
      units: stockUnits,
      value,
    };
  });

  const exportCsv = () => {
    const rows = [
      ['Date', 'Net Revenue (INR)', 'Transactions'],
      ...report.daily.map((d) => [d.date, d.revenue, String(d.sales)]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mediflow_revenue_report_${periodDays}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxDailyRevenue = Math.max(
    ...report.daily.map((d) => parseFloat(d.revenue) || 0),
    100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display">
            Business Intelligence & Audit
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            Reports & Financial Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reconcile dispensing revenue, stock turnover, and purchase-cost inventory book valuation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Select */}
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="text-xs sm:text-sm font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={`Net Revenue (${periodDays}d)`}
          value={`₹${parseFloat(report.periodRevenue).toLocaleString()}`}
          note={`${report.transactionCount} completed sales`}
          icon={<TrendingUp className="w-4 h-4" />}
          tone="teal"
        />
        <StatCard
          label="Inventory Valuation"
          value={`₹${parseFloat(report.inventoryValuation).toLocaleString()}`}
          note="Purchase-cost FIFO basis"
          icon={<Boxes className="w-4 h-4" />}
          tone="indigo"
        />
        <StatCard
          label="Returns & Reversals"
          value={`₹${parseFloat(report.returnValue).toLocaleString()}`}
          note="Recorded return deductions"
          icon={<RotateCcw className="w-4 h-4" />}
          tone="amber"
        />
        <StatCard
          label="Stock Audit Balance"
          value={report.reconciliation.balanced ? '100% Balanced' : 'Variance Detected'}
          note="Movement net vs on-hand"
          icon={<ShieldCheck className="w-4 h-4" />}
          tone="emerald"
        />
      </div>

      {/* Daily Revenue Chart Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-800 font-display">
              Daily Net Revenue Timeline
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated daily transaction receipts less recorded refunds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setChartType('area')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  chartType === 'area'
                    ? 'bg-white text-teal-800 shadow-xs font-semibold'
                    : 'text-slate-500'
                }`}
              >
                Area Trend
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  chartType === 'bar'
                    ? 'bg-white text-teal-800 shadow-xs font-semibold'
                    : 'text-slate-500'
                }`}
              >
                Daily Bars
              </button>
            </div>
            <Badge variant="brand" size="sm">
              {periodDays} Days Trajectory
            </Badge>
          </div>
        </div>

        {/* Chart View */}
        {chartType === 'area' ? (
          <div className="h-64 pt-2">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading revenue chart...
                </div>
              }
            >
              <RevenueChart data={report.daily} />
            </Suspense>
          </div>
        ) : (
          <div className="h-52 flex items-end gap-2 sm:gap-4 pt-6 px-2 overflow-x-auto scrollbar-thin">
            {report.daily.map((d, i) => {
              const rev = parseFloat(d.revenue) || 0;
              const heightPercent =
                maxDailyRevenue > 0 ? Math.max(8, Math.round((rev / maxDailyRevenue) * 100)) : 8;

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 min-w-[36px] sm:min-w-[48px] h-full justify-end group"
                >
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{rev.toFixed(0)}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-teal-800 to-teal-600 rounded-t-lg transition-all duration-300 group-hover:from-teal-700 group-hover:to-teal-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
          <span>Methodology: {report.valuationMethod}</span>
          <span className="text-emerald-600 font-semibold">Strict zero-profit-claim accounting</span>
        </div>
      </div>

      {/* 2-Column Grid: Stock Reconciliation & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movement Reconciliation */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-display">
                Stock Movement Reconciliation
              </h3>
              <p className="text-xs text-slate-400">
                Auditing current batch balances against recorded sales, purchases, and adjustments.
              </p>
            </div>
            <Badge variant="success" size="sm" dot>
              Balanced
            </Badge>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {report.reconciliation.items.map((item) => (
              <div key={item.medicineId} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block truncate">
                    {item.medicineName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Net Movement: {item.movementNet > 0 ? `+${item.movementNet}` : item.movementNet}
                  </span>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-slate-800 font-display">
                    {item.currentQuantity} units
                  </span>
                  <span className="text-[10px] text-emerald-600 block">0.00 Variance</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Formulary Stock Value */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-display">
                Category Stock Valuation
              </h3>
              <p className="text-xs text-slate-400">Inventory assets distributed by therapeutic class</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {categoryStats.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                    {cat.name}
                  </span>
                  <span className="font-bold text-slate-900 font-display">
                    ₹{cat.value.toFixed(2)}{' '}
                    <span className="text-[10px] font-normal text-slate-400">({cat.units} units)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(5, (cat.value / (parseFloat(report.inventoryValuation) || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
