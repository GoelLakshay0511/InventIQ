import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Store,
  Sliders,
  ShieldCheck,
  Smartphone,
  Save,
  Lock,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  User,
  Phone,
  MapPin,
  Clock,
  Shield,
  Plus,
  Minus,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const TABS = [
  { id: 'store', label: 'Store', icon: Store },
  { id: 'inventory', label: 'Forecast', icon: Sliders },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'system', label: 'Device', icon: Smartphone },
];

export default function SettingsPage() {
  const { user: authUser, setAuth, accessToken, logout } = useAuthStore();
  const qc = useQueryClient();
  const currentUserId = authUser?._id || authUser?.id;

  const [activeTab, setActiveTab] = useState('store');

  // Form states
  const [form, setForm] = useState({
    storeName: authUser?.storeName || '',
    leadTimeDays: authUser?.settings?.leadTimeDays ?? 3,
    safetyStockDays: authUser?.settings?.safetyStockDays ?? 2,
  });

  // Password state
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  /* ── Fetch current user / settings ───────────────────────────────────────── */
  const { data: fetchedUser, isLoading } = useQuery({
    queryKey: ['me', currentUserId],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me');
      const payload = res.data?.data || res.data;
      return payload?.user || payload;
    },
    enabled: !!currentUserId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const activeUser = fetchedUser || authUser;

  useEffect(() => {
    if (activeUser) {
      setForm({
        storeName: activeUser.storeName ?? '',
        leadTimeDays: activeUser.settings?.leadTimeDays ?? 3,
        safetyStockDays: activeUser.settings?.safetyStockDays ?? 2,
      });
    }
  }, [activeUser]);

  /* ── Save store settings mutation ────────────────────────────────────────── */
  const saveMutation = useMutation({
    mutationFn: (payload) => apiClient.put('/auth/me', payload),
    onSuccess: (res) => {
      const updatedUser = res.data?.data?.user || res.data?.user || res.data;
      setAuth(updatedUser, accessToken);
      qc.invalidateQueries({ queryKey: ['me', currentUserId] });
      toast.success('Settings saved successfully!');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to save settings.'),
  });

  /* ── Change password mutation ────────────────────────────────────────────── */
  const changePasswordMutation = useMutation({
    mutationFn: (payload) => apiClient.put('/auth/change-password', payload),
    onSuccess: () => {
      toast.success('Password updated successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to update password. Check current password.'),
  });

  const handleLeadTimeDelta = (delta) => {
    setForm((prev) => ({
      ...prev,
      leadTimeDays: Math.min(7, Math.max(1, prev.leadTimeDays + delta)),
    }));
  };

  const handleSafetyStockDelta = (delta) => {
    setForm((prev) => ({
      ...prev,
      safetyStockDays: Math.min(5, Math.max(1, prev.safetyStockDays + delta)),
    }));
  };

  const handleSaveStore = (e) => {
    e?.preventDefault();
    saveMutation.mutate({
      storeName: form.storeName,
      settings: {
        leadTimeDays: Number(form.leadTimeDays),
        safetyStockDays: Number(form.safetyStockDays),
      },
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!pwdForm.newPassword || pwdForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword,
    });
  };

  // Live Simulation Calculation for kirana items (e.g. 8 units/day benchmark)
  const simulationData = useMemo(() => {
    const totalDays = Number(form.leadTimeDays) + Number(form.safetyStockDays);
    const avgDailySales = 8;
    const reorderThreshold = totalDays * avgDailySales;
    return {
      totalDays,
      reorderThreshold,
      leadComponent: form.leadTimeDays * avgDailySales,
      bufferComponent: form.safetyStockDays * avgDailySales,
    };
  }, [form.leadTimeDays, form.safetyStockDays]);

  // Password requirements checklist
  const pwdChecks = useMemo(() => {
    const p = pwdForm.newPassword;
    return {
      length: p.length >= 6,
      hasNumberOrSpecial: /[0-9!@#$%^&*]/.test(p),
      match: pwdForm.confirmPassword && p === pwdForm.confirmPassword,
    };
  }, [pwdForm.newPassword, pwdForm.confirmPassword]);

  if (isLoading && !activeUser) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5 truncate font-normal">
            Store profile, forecasting parameters &amp; security
          </p>
        </div>

        {/* Global Cloud Synced Status Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Cloud Synced</span>
        </div>
      </div>

      {/* ── Segmented Tabs Navigation (Equal 4-Column Grid) ──────────────────── */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-gray-200/70 rounded-xl w-full">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-lg font-bold text-xs transition-all duration-150 select-none ${
                isActive
                  ? 'bg-white text-primary-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-primary-600 shrink-0' : 'text-gray-400 shrink-0'} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Store Profile ──────────────────────────────────────────────── */}
      {activeTab === 'store' && (
        <div className="space-y-4 w-full min-w-0">
          {/* Identity & Status Hero Card */}
          <div className="card p-3.5 sm:p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-200/80 w-full min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-xs shrink-0">
                {form.storeName ? form.storeName.charAt(0).toUpperCase() : 'K'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight truncate">
                    {form.storeName || 'My Kirana Store'}
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide shrink-0">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  Owner: <span className="text-gray-700 font-semibold">{activeUser?.name || 'Store Owner'}</span>
                  {activeUser?.phone ? ` · 📞 ${activeUser.phone}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Store Profile Card */}
          <form onSubmit={handleSaveStore} className="card p-3.5 sm:p-5 space-y-3.5 w-full min-w-0">
            <div className="border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Store Identity &amp; Details</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Shown on WhatsApp restock orders and delivery invoices
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
              <div className="w-full min-w-0">
                <label htmlFor="storeName" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Store Display Name *
                </label>
                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  required
                  value={form.storeName}
                  onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
                  placeholder="e.g. Gupta General Store"
                  className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
              </div>

              <div className="w-full min-w-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Registered Owner
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/70 border border-gray-200/80 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 truncate">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{activeUser?.name || 'Store Owner'}</span>
                </div>
              </div>

              <div className="w-full min-w-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Primary Mobile Number
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/70 border border-gray-200/80 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 truncate">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{activeUser?.phone || 'Not configured'}</span>
                </div>
              </div>

              <div className="w-full min-w-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Area Pincode
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/70 border border-gray-200/80 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 truncate">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{activeUser?.pincode || '400001 (Default)'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn-primary w-full sm:w-auto sm:px-6 py-2.5 flex items-center justify-center gap-1.5 font-bold shadow-xs text-xs sm:text-sm"
              >
                <Save size={15} />
                <span>{saveMutation.isPending ? 'Saving Profile…' : 'Save Store Details'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab 2: Forecasting Engine ─────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 w-full min-w-0">
          <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/70 flex items-start gap-2.5">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs shrink-0 mt-0.5">
              <Sparkles size={15} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">Kirana Inventory Forecasting Logic</h4>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Tells the intelligence engine how early to suggest reordering before shelves run out.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full min-w-0">
            {/* Control 1: Lead Time */}
            <div className="card p-3.5 space-y-3 w-full min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Clock size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">Delivery Lead Time</h4>
                    <p className="text-[10px] text-gray-400">Order to shop delivery</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLeadTimeDelta(-1)}
                    disabled={form.leadTimeDays <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition"
                    aria-label="Decrease lead time"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-black text-xs text-gray-900 px-1 min-w-[24px] text-center">
                    {form.leadTimeDays}d
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLeadTimeDelta(1)}
                    disabled={form.leadTimeDays >= 7}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition"
                    aria-label="Increase lead time"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { d: 1, label: '⚡ Next Day', sub: 'Local' },
                  { d: 3, label: '📦 3 Days', sub: 'Standard' },
                  { d: 7, label: '🚚 Weekly', sub: 'Wholesale' },
                ].map(({ d, label, sub }) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, leadTimeDays: d }))}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all ${
                      form.leadTimeDays === d
                        ? 'border-primary-600 bg-primary-50/70 ring-1 ring-primary-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-[10px] sm:text-[11px] text-gray-900 leading-tight truncate">{label}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5 truncate">{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Safety Stock Buffer */}
            <div className="card p-3.5 space-y-3 w-full min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Shield size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">Safety Stock Buffer</h4>
                    <p className="text-[10px] text-gray-400">Demand spike insurance</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSafetyStockDelta(-1)}
                    disabled={form.safetyStockDays <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition"
                    aria-label="Decrease safety buffer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-black text-xs text-gray-900 px-1 min-w-[24px] text-center">
                    {form.safetyStockDays}d
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSafetyStockDelta(1)}
                    disabled={form.safetyStockDays >= 5}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-2xs hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition"
                    aria-label="Increase safety buffer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { d: 1, label: '🍃 Lean (1d)', sub: 'Tight cap' },
                  { d: 2, label: '⚖️ Optimal (2d)', sub: 'Best fit' },
                  { d: 4, label: '🛡️ Fortress (4d)', sub: 'Zero risk' },
                ].map(({ d, label, sub }) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, safetyStockDays: d }))}
                    className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all ${
                      form.safetyStockDays === d
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-[10px] sm:text-[11px] text-gray-900 leading-tight truncate">{label}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5 truncate">{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Simulation Card */}
          <div className="card p-3.5 space-y-3 bg-gray-50/90 border border-gray-200 w-full min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                <span>⚡ Live Simulation Benchmark</span>
              </h4>
              <span className="text-[10px] sm:text-[11px] font-black text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                {simulationData.totalDays} Days Coverage
              </span>
            </div>

            <p className="text-[11px] text-gray-500">
              For a top seller (e.g. <strong>Amul Butter</strong> selling <strong>8 packs/day</strong>):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-gray-200/70">
                <div className="text-[9px] uppercase font-bold text-gray-400">Lead Window</div>
                <div className="text-sm font-black text-gray-900 mt-0.5">
                  {simulationData.leadComponent} packs
                </div>
                <div className="text-[10px] text-gray-400">{form.leadTimeDays} days transit</div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200/70">
                <div className="text-[9px] uppercase font-bold text-emerald-600">Buffer Cushion</div>
                <div className="text-sm font-black text-emerald-700 mt-0.5">
                  {simulationData.bufferComponent} packs
                </div>
                <div className="text-[10px] text-gray-400">{form.safetyStockDays} days buffer</div>
              </div>

              <div className="bg-gradient-to-tr from-primary-600 to-emerald-600 p-2.5 rounded-xl text-white shadow-2xs">
                <div className="text-[9px] uppercase font-bold text-emerald-100">Reorder At</div>
                <div className="text-sm sm:text-base font-black mt-0.5">
                  {simulationData.reorderThreshold} packs
                </div>
                <div className="text-[10px] text-emerald-100">Automatic alert trigger</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveStore}
                disabled={saveMutation.isPending}
                className="btn-primary w-full sm:w-auto sm:px-6 py-2.5 font-bold shadow-xs text-xs sm:text-sm"
              >
                <Save size={15} />
                <span>{saveMutation.isPending ? 'Saving Parameters…' : 'Apply Forecasting Parameters'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Security & Access ──────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-4 w-full min-w-0">
          <form onSubmit={handlePasswordSubmit} className="card p-3.5 sm:p-5 space-y-3.5 max-w-lg w-full min-w-0">
            <div className="border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Change Store Password</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Update credentials for InventIQ mobile app &amp; web
              </p>
            </div>

            <div>
              <label htmlFor="currentPassword" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  className="w-full bg-gray-50/70 border border-gray-200 rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full bg-gray-50/70 border border-gray-200 rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Confirm New Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
                className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
            </div>

            {pwdForm.newPassword && (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs">
                <div className={`flex items-center gap-1.5 font-medium ${pwdChecks.length ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {pwdChecks.length ? <Check size={12} className="text-emerald-600" /> : <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />}
                  <span className="text-[11px]">At least 6 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${pwdChecks.hasNumberOrSpecial ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {pwdChecks.hasNumberOrSpecial ? <Check size={12} className="text-emerald-600" /> : <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />}
                  <span className="text-[11px]">Contains a number or symbol</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${pwdChecks.match ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {pwdChecks.match ? <Check size={12} className="text-emerald-600" /> : <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />}
                  <span className="text-[11px]">Passwords match</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-1.5 font-bold bg-gray-900 hover:bg-black text-white text-xs sm:text-sm"
            >
              <Lock size={14} />
              <span>{changePasswordMutation.isPending ? 'Updating Password…' : 'Update Store Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── Tab 4: App & Device ───────────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="space-y-4 w-full min-w-0">
          <div className="card p-3.5 sm:p-5 space-y-3.5 max-w-lg w-full min-w-0">
            <div className="border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">App &amp; Environment Diagnostics</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">System versions, offline cache &amp; session</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/60">
                <div className="text-gray-400 font-semibold uppercase text-[9px]">Client Build</div>
                <div className="font-black text-gray-900 text-xs mt-0.5">InventIQ v1.0.0</div>
                <div className="text-[9px] text-gray-500 mt-0.5">Capacitor Native APK</div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/60">
                <div className="text-gray-400 font-semibold uppercase text-[9px]">Cloud Database</div>
                <div className="font-black text-emerald-700 text-xs mt-0.5">Render Cloud API</div>
                <div className="text-[9px] text-gray-500 mt-0.5">MongoDB Atlas</div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  qc.clear();
                  toast.success('Offline cache cleared & refreshed!');
                }}
                className="btn-outline text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-bold w-full sm:flex-1"
              >
                <RefreshCw size={13} />
                <span>Clear App Cache</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full sm:flex-1 py-2 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
