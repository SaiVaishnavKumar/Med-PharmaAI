import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Menu,
} from 'lucide-react';

interface MobileNavProps {
  onOpenMenu: () => void;
}

export function MobileNav({ onOpenMenu }: MobileNavProps) {
  const navItems = [
    { label: 'Overview', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'POS', path: '/pos', icon: <ShoppingCart className="w-5 h-5" />, highlight: true },
    { label: 'Medicines', path: '/medicines', icon: <Package className="w-5 h-5" /> },
    { label: 'Inventory', path: '/inventory', icon: <Boxes className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 flex items-center justify-around lg:hidden safe-area-pb shadow-lg">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-md transition-colors ${
                  item.highlight
                    ? isActive
                      ? 'bg-teal-700 text-white'
                      : 'bg-teal-50 text-teal-700'
                    : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="mt-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <div className="p-1">
          <Menu className="w-5 h-5" />
        </div>
        <span className="mt-0.5">More</span>
      </button>
    </nav>
  );
}
