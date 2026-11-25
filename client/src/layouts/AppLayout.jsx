import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  RefreshCw,
  Truck,
  Settings,
  LogOut,
  Zap,
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

/** Returns 1–2 initials from a store name for the avatar */
function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore server errors — still log out client-side
    } finally {
      logout();
      navigate('/login', { replace: true });
      toast.success('Logged out successfully');
    }
  };

  const initials = getInitials(user?.storeName || user?.name || 'U');

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>

      {/* ── Desktop dark sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #111c2b 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Brand / Logo area */}
        <Link
          to="/landing"
          className="flex items-center gap-3 px-5 py-5 hover:opacity-90 transition-opacity"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Logomark: green square with lightning */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              boxShadow: '0 4px 14px rgba(22,163,74,0.4)',
            }}
          >
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <h1
              className="text-base font-bold tracking-tight leading-tight"
              style={{ color: '#f1f5f9', fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
            >
              InventIQ
            </h1>
            {user?.storeName && (
              <p className="text-[11px] truncate font-medium" style={{ color: '#64748b' }}>
                {user.storeName}
              </p>
            )}
          </div>
        </Link>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <span className="section-label">Navigation</span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto scroll-thin">
          {navItems.map(({ to, label, Icon }) => {
            const isActive = to === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User card + Logout pinned to bottom */}
        <div
          className="px-3 pb-4 pt-3 space-y-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* User avatar row */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: '#e2e8f0' }}>
                {user?.storeName || user?.name || 'Store'}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#475569' }}>
                {user?.email || 'Admin'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="sidebar-nav-link w-full hover:!bg-red-900/30 hover:!text-red-400 transition-all"
            style={{ minHeight: '40px' }}
          >
            <LogOut size={16} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">

        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2.5"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(226,232,240,0.7)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Link to="/landing" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}
            >
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <div>
              <h1
                className="text-sm font-bold leading-tight"
                style={{ color: '#0f172a', fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
              >
                InventIQ
              </h1>
              {user?.storeName && (
                <span className="text-[10px] text-gray-400 block truncate max-w-[120px] font-medium">
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
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`
              }
              aria-label="Settings"
            >
              <Settings size={19} />
            </NavLink>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around py-1"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
        }}
      >
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1.5 transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
            style={{ minHeight: '44px' }}
          >
            {({ isActive }) => (
              <>
                <div
                  className="p-1 rounded-lg transition-all duration-150"
                  style={isActive ? { background: '#dcfce7' } : {}}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
