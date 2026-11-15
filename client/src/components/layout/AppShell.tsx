import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { ShieldCheck } from 'lucide-react';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0
          ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}
      >
        {/* Responsive Sticky Topbar */}
        <Topbar onOpenMobile={() => setMobileOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* Enterprise Pharmacy Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-4 sm:px-8 text-xs text-slate-500 hidden lg:block">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 font-display">MediFlow AI</span>
              <span>•</span>
              <span>Intelligent FEFO Pharmacy Operations & Dispensing</span>
              <span>•</span>
              <a
                href="https://github.com/SaiVaishnavKumar/Med-PharmaAI"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:underline inline-flex items-center gap-1 font-medium"
              >
                GitHub Repository
              </a>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Compliant with CDSCO & FEFO
              </span>
            </div>
          </div>
        </footer>

        {/* Mobile Thumb Navigation */}
        <MobileNav onOpenMenu={() => setMobileOpen(true)} />
      </div>
    </div>
  );
}
