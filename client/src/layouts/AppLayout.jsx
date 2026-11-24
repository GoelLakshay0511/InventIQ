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
  { to: '/dashboard',       label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/sales/quick-tap', label: 'Daily Sales',  Icon: ShoppingCart },
  { to: '/products',        label: 'Products',     Icon: Package },
  { to: '/reorder',         label: 'Reorder',      Icon: RefreshCw },
  { to: '/distributors',    label: 'Suppliers',    Icon: Truck },
  { to: '/settings',        label: 'Settings',     Icon: Settings },
];

/** Shared active-link class factory for desktop sidebar */
const linkClass = ({ isActive }) =>
  `flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-primary-50 text-primary-700 font-semibold px-3 border-l-4 border-primary-600'
      : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-800 px-3 border-l-4 border-transparent'
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
    <div className="flex min-h-screen" style={{ backgroundColor: '#F6F8FA' }}>

      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 glass"
        style={{ borderRight: '1px solid rgba(226,232,240,0.7)' }}
      >
        {/* Logo */}
        <Link
          to="/landing"
          className="block px-5 py-5 hover:bg-gray-50/50 transition-colors"
          style={{ borderBottom: '1px solid rgba(226,232,240,0.6)' }}
        >
          <h1 className="text-xl font-bold text-primary-600 tracking-tight">
            InventIQ 📦
          </h1>
          {user?.storeName && (
            <p className="text-xs text-gray-400 mt-0.5 truncate font-medium">{user.storeName}</p>
          )}
        </Link>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scroll-thin">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end={to === '/dashboard'}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout button pinned to bottom */}
        <div className="px-3 pb-5 pt-3" style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
            style={{ minHeight: '44px' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">

        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-20 glass px-4 py-2.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(226,232,240,0.7)' }}
        >
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

      {/* ── Mobile bottom nav ───────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 glass flex items-center justify-around py-1"
        style={{ borderTop: '1px solid rgba(226,232,240,0.7)', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}
      >
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
            style={{ minHeight: '44px' }}
          >
            <Icon size={19} />
            <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
