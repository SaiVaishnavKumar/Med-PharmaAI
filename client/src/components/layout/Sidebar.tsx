import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
  Boxes,
  Truck,
  AlertTriangle,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyStore } from '../../services/pharmacyStore';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation();
  const { user, switchRole } = useAuth();
  const alerts = pharmacyStore.getAlerts();
  const alertCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;

  const navGroups = [
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Overview', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Point of Sale', path: '/pos', icon: <ShoppingCart className="w-4 h-4" /> },
        { label: 'Medicine Catalogue', path: '/medicines', icon: <Package className="w-4 h-4" /> },
        { label: 'Batch Inventory', path: '/inventory', icon: <Boxes className="w-4 h-4" /> },
        { label: 'Sales History', path: '/sales', icon: <ClipboardList className="w-4 h-4" /> },
        { label: 'Sales Returns', path: '/returns', icon: <RotateCcw className="w-4 h-4" /> },
      ],
    },
    {
      title: 'PROCUREMENT',
      items: [
        { label: 'Purchases', path: '/purchases', icon: <ClipboardList className="w-4 h-4" /> },
        { label: 'Suppliers', path: '/suppliers', icon: <Truck className="w-4 h-4" /> },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        {
          label: 'Alerts',
          path: '/alerts',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: alertCount > 0 ? alertCount : undefined,
          badgeColor: 'amber',
        },
        { label: 'Reports & Analytics', path: '/reports', icon: <BarChart3 className="w-4 h-4" /> },
        {
          label: 'AI Copilot',
          path: '/copilot',
          icon: <Sparkles className="w-4 h-4 text-teal-600" />,
          highlight: true,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
          <Link
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white font-extrabold font-display shadow-sm shadow-teal-700/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              M
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base text-slate-900 font-display tracking-tight flex items-center gap-1.5 leading-none">
                  MediFlow
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-100/80 text-teal-800">
                    AI
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1 truncate">
                  Pharmacy Ops
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Pharmacy Workspace Pill */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  MH
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Meadow Health</p>
                  <p className="text-[11px] text-slate-500 truncate">Central Pharmacy</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Connected" />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 select-none scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <div className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative
                        ${
                          isActive
                            ? 'bg-teal-50/90 text-teal-800 font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
                        ${collapsed ? 'justify-center px-0' : ''}
                      `}
                    >
                      <span
                        className={`flex-shrink-0 transition-colors ${
                          isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      >
                        {item.icon}
                      </span>

                      {!collapsed && (
                        <span className="truncate flex-1 font-sans">{item.label}</span>
                      )}

                      {!collapsed && item.badge !== undefined && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {item.badge}
                        </span>
                      )}

                      {/* Dot for collapsed with badge */}
                      {collapsed && item.badge !== undefined && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="border-t border-slate-100 p-3 flex-shrink-0 bg-slate-50/50">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Active Role</span>
                <select
                  value={user.role}
                  onChange={(e) => switchRole(e.target.value as any)}
                  className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-teal-600"
                >
                  <option value="PHARMACY_MANAGER">Manager</option>
                  <option value="SUPER_ADMIN">Admin</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="INVENTORY_MANAGER">Inventory</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {user.avatar || user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center"
                title={`${user.name} (${user.role})`}
              >
                {user.avatar || user.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
