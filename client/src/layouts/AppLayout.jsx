import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  RefreshCw,
  Truck,
  Settings,
  LogOut,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',       label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/sales/quick-tap', label: 'Daily Sales',  Icon: ShoppingCart },
  { to: '/products',        label: 'Products',     Icon: Package },
  { to: '/reorder',         label: 'Reorder',      Icon: RefreshCw },
  { to: '/distributors',    label: 'Suppliers',    Icon: Truck },
  { to: '/settings',        label: 'Settings',     Icon: Settings },
];

/** Shared active-link class factory for desktop sidebar */
const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore server errors — we still log out client-side
    } finally {
      logout();
      navigate('/login', { replace: true });
      toast.success('Logged out successfully');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Desktop sidebar (hidden on mobile) ──────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        {/* Logo — Discreetly links to landing page without any visible giveaway */}
        <Link to="/landing" className="block px-5 py-5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
          <h1 className="text-xl font-bold text-primary-600 tracking-tight">
            InventIQ 📦
          </h1>
          {user?.storeName && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user.storeName}</p>
          )}
        </Link>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end={to === '/dashboard'}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout button pinned to bottom */}
        <div className="px-3 pb-5 border-t border-gray-100 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Top bar visible on mobile only */}
        <header className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <div>
              <h1 className="text-base font-bold text-primary-600 leading-tight">InventIQ</h1>
              {user?.storeName && (
                <span className="text-[11px] text-gray-500 block truncate max-w-[130px]">
                  {user.storeName}
                </span>
              )}
            </div>
          </Link>

          {/* Quick-action buttons on mobile top bar */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
                }`
              }
              aria-label="Settings"
            >
              <Settings size={20} />
            </NavLink>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom navigation bar ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 flex items-center justify-around py-1 shadow-lg">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1.5 transition-colors ${
                isActive ? 'text-primary-600 font-semibold' : 'text-gray-400 hover:text-gray-600 font-medium'
              }`
            }
          >
            <Icon size={19} />
            <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
