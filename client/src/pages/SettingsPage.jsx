import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Lock, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function SettingsPage() {
  const { user: authUser, setAuth, accessToken } = useAuthStore();
  const qc = useQueryClient();
  const currentUserId = authUser?._id || authUser?.id;

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

  /* ── Fetch current user / settings scoped to active user ────────────────── */
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

  // Populate the form once user data arrives or changes
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
      toast.success('Store settings saved successfully!');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to save settings.'),
  });

  /* ── Change password mutation ────────────────────────────────────────────── */
  const changePasswordMutation = useMutation({
    mutationFn: (payload) => apiClient.put('/auth/change-password', payload),
    onSuccess: () => {
      toast.success('Password changed successfully! You can now use your new password.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to change password. Please verify current password.'),
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSlider = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));

  const handlePwdChange = (e) =>
    setPwdForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
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

  if (isLoading && !activeUser) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 max-w-xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-sm text-gray-500">Manage your store profile, forecasting parameters & security</p>
      </div>

      {/* ── Settings form ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Save size={18} className="text-primary-600" />
          <h3 className="font-semibold text-gray-800 text-base">Store & Forecast Preferences</h3>
        </div>

        {/* Store name */}
        <div>
          <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
            Store Name
          </label>
          <input
            id="storeName"
            name="storeName"
            type="text"
            value={form.storeName}
            onChange={handleChange}
            placeholder="Your store name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Lead time slider (1-7 days) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="leadTimeDays" className="block text-sm font-medium text-gray-700">
              Lead Time
            </label>
            <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-0.5 rounded-full">
              {form.leadTimeDays} day{form.leadTimeDays !== 1 ? 's' : ''}
            </span>
          </div>
          <input
            id="leadTimeDays"
            name="leadTimeDays"
            type="range"
            min="1" max="7" step="1"
            value={form.leadTimeDays}
            onChange={handleSlider}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 day</span>
            <span className="text-gray-500 text-center text-xs">
              How many days before stockout to trigger a reorder alert
            </span>
            <span>7 days</span>
          </div>
        </div>

        {/* Safety stock slider (1-5 days) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="safetyStockDays" className="block text-sm font-medium text-gray-700">
              Safety Stock Buffer
            </label>
            <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-0.5 rounded-full">
              {form.safetyStockDays} day{form.safetyStockDays !== 1 ? 's' : ''}
            </span>
          </div>
          <input
            id="safetyStockDays"
            name="safetyStockDays"
            type="range"
            min="1" max="5" step="1"
            value={form.safetyStockDays}
            onChange={handleSlider}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 day</span>
            <span className="text-gray-500 text-center text-xs">
              Extra buffer stock to keep as insurance against demand spikes
            </span>
            <span>5 days</span>
          </div>
        </div>

        {/* Read-only info */}
        {activeUser && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm text-gray-600 border border-gray-100">
            <p><span className="font-medium text-gray-700">Owner Name:</span> {activeUser.name || 'N/A'}</p>
            <p><span className="font-medium text-gray-700">Registered Phone:</span> {activeUser.phone || 'N/A'}</p>
            {activeUser.pincode && (
              <p><span className="font-medium text-gray-700">Pincode:</span> {activeUser.pincode}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {saveMutation.isPending ? 'Saving…' : 'Save Store Settings'}
        </button>
      </form>

      {/* ── Security & Change Password form ─────────────────────────────────── */}
      <form onSubmit={handlePasswordSubmit} className="card space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary-600" />
            <h3 className="font-semibold text-gray-800 text-base">Change Password</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <ShieldCheck size={12} /> Secure
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Enter your current password followed by your new password to update your account login credentials.
        </p>

        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password *
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              value={pwdForm.currentPassword}
              onChange={handlePwdChange}
              placeholder="Enter your current password"
              className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Toggle current password visibility"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
              onChange={handlePwdChange}
              placeholder="At least 6 characters"
              className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Toggle new password visibility"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={pwdForm.confirmPassword}
            onChange={handlePwdChange}
            placeholder="Re-enter your new password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white"
        >
          <Lock size={16} />
          {changePasswordMutation.isPending ? 'Updating Password…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
