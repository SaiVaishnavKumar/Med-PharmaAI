import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyStore } from '../../services/pharmacyStore';
import { Badge } from '../ui/Badge';

interface TopbarProps {
  onOpenMobile: () => void;
}

export function Topbar({ onOpenMobile }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const alerts = pharmacyStore.getAlerts();
  const unreadAlerts = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'warning'
  );

  const getPageTitle = (pathname: string) => {
    if (pathname === '/') return 'Pharmacy Operations Overview';
    if (pathname === '/pos') return 'Point of Sale (FEFO Terminal)';
    if (pathname === '/medicines') return 'Medicine Catalogue';
    if (pathname === '/inventory') return 'Batch Inventory Tracking';
    if (pathname === '/sales') return 'Sales & Dispensing History';
    if (pathname === '/returns') return 'Sales Returns & Restocking';
    if (pathname === '/purchases') return 'Purchases & Procurement';
    if (pathname === '/suppliers') return 'Supplier Directory';
    if (pathname === '/alerts') return 'Inventory Alerts & Safety';
    if (pathname === '/reports') return 'Analytics & Financial Reports';
    if (pathname === '/copilot') return 'MediFlow AI Copilot';
    if (pathname.startsWith('/invoices/')) return 'Official Tax Invoice';
    return 'Pharmacy Management';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="hidden sm:inline font-medium text-slate-400">Meadow Health</span>
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-300" />
          <h1 className="font-bold text-slate-800 truncate font-display text-sm sm:text-base">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Right: Global Search, Quick Copilot, Alerts & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines, SKU..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 bg-white">
            ↵
          </kbd>
        </form>

        {/* Quick Copilot button */}
        <Link
          to="/copilot"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100/80 rounded-lg border border-teal-200 transition-colors"
          title="Open MediFlow AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Ask AI</span>
        </Link>

        {/* Alerts Notification Button with Popover */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="View inventory alerts"
            title="Inventory alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {/* Alerts Dropdown Modal */}
          {showAlertsDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAlertsDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 font-display">
                      Inventory Alerts
                    </span>
                    <Badge variant={unreadAlerts.length > 0 ? 'warning' : 'success'} size="sm">
                      {unreadAlerts.length} Active
                    </Badge>
                  </div>
                  <Link
                    to="/alerts"
                    onClick={() => setShowAlertsDropdown(false)}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {unreadAlerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="font-semibold text-slate-700">All inventory conditions healthy</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No critical stockouts or expired batches
                      </p>
                    </div>
                  ) : (
                    unreadAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-3 hover:bg-slate-50/80 transition-colors text-xs">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`p-1 rounded-md flex-shrink-0 mt-0.5 ${
                              alert.severity === 'critical'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800">{alert.medicineName}</p>
                            <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-slate-50/80 text-center">
                  <Link
                    to="/pos"
                    onClick={() => setShowAlertsDropdown(false)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                  >
                    Open Point of Sale
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
            title={`${user.name} (${user.role})`}
          >
            {user.avatar || user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
              {user.name}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {user.role.replaceAll('_', ' ').toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
