import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  XCircle,
  Boxes,
  Truck,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function Alerts() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'near_expiry' | 'expired'>('all');
  const [, setTick] = useState(0);

  useEffect(() => {
    return pharmacyStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const alerts = pharmacyStore.getAlerts();

  const filtered = alerts.filter((a) => {
    if (filter === 'low_stock') return a.type === 'LOW_STOCK' || a.type === 'OUT_OF_STOCK';
    if (filter === 'near_expiry') return a.type === 'NEAR_EXPIRY';
    if (filter === 'expired') return a.type === 'EXPIRED';
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-800 font-display">
            Safety & Clinical Compliance
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            Inventory Alert Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time conditions requiring pharmacist audit: stockouts, reorder triggers, and 30-day expiry deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="danger" size="md" dot>
            {criticalCount} Critical
          </Badge>
          <Badge variant="warning" size="md" dot>
            {warningCount} Warnings
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-slate-800 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('low_stock')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'low_stock'
              ? 'bg-amber-600 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Low & Out of Stock ({alerts.filter((a) => a.type === 'LOW_STOCK' || a.type === 'OUT_OF_STOCK').length})
        </button>
        <button
          onClick={() => setFilter('near_expiry')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'near_expiry'
              ? 'bg-rose-600 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Near Expiry &lt; 30d ({alerts.filter((a) => a.type === 'NEAR_EXPIRY').length})
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'expired'
              ? 'bg-rose-800 text-white font-semibold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Expired Batches ({alerts.filter((a) => a.type === 'EXPIRED').length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-base text-slate-800 font-display">
              No active alerts in this category
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              All inventory levels and batch expiry dates meet healthy clinical standards.
            </p>
          </div>
        ) : (
          filtered.map((alert) => {
            const isCritical = alert.severity === 'critical';

            return (
              <div
                key={alert.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-xs ${
                  isCritical
                    ? 'border-rose-200 hover:border-rose-300'
                    : 'border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {alert.type === 'EXPIRED' ? (
                      <XCircle className="w-5 h-5" />
                    ) : alert.type === 'NEAR_EXPIRY' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                        {alert.medicineName}
                      </h4>
                      <Badge variant={isCritical ? 'danger' : 'warning'} size="sm" dot>
                        {alert.type.replaceAll('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    {alert.batchNumber && (
                      <span className="inline-block mt-2 font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Batch: {alert.batchNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {alert.type === 'LOW_STOCK' || alert.type === 'OUT_OF_STOCK' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/purchases')}
                      icon={<Truck className="w-3.5 h-3.5" />}
                    >
                      Reorder Now
                    </Button>
                  ) : alert.type === 'NEAR_EXPIRY' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/pos')}
                      icon={<ShoppingCart className="w-3.5 h-3.5" />}
                    >
                      Prioritize at POS
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => navigate('/inventory')}
                      icon={<Boxes className="w-3.5 h-3.5" />}
                    >
                      Quarantine Batch
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
