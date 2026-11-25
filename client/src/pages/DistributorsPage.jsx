import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Truck,
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Sparkles,
} from 'lucide-react';
import apiClient from '../api/client';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const emptyForm = {
  name: '',
  phone: '',
  minimumOrderValue: 0,
  deliveryDays: 2,
  categories: '',
};

/** Reusable modal shell */
function Modal({ onClose, title, children, maxWidth = 'max-w-md' }) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs"
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[92vh] overflow-y-auto scroll-thin`}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 ml-2"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export default function DistributorsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // Scorecard modal state
  const [scorecardDistributor, setScorecardDistributor] = useState(null);
  const [logTurnaround, setLogTurnaround] = useState(2);
  const [logNote, setLogNote] = useState('');

  /* ── Fetch Distributors ─────────────────────────────────────────────────── */
  const { data: distributors = [], isLoading } = useQuery({
    queryKey: ['distributors'],
    queryFn: async () => {
      const res = await apiClient.get('/distributors');
      const payload = res.data?.data || res.data;
      return payload?.distributors || (Array.isArray(payload) ? payload : []);
    },
  });

  const safeDistributors = Array.isArray(distributors) ? distributors : [];

  /* ── Add / Edit / Delete Mutations ───────────────────────────────────────── */
  const addDistributor = useMutation({
    mutationFn: (payload) => apiClient.post('/distributors', payload),
    onSuccess: () => {
      toast.success('Distributor added!');
      qc.invalidateQueries({ queryKey: ['distributors'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add distributor.'),
  });

  const editDistributor = useMutation({
    mutationFn: ({ id, payload }) => apiClient.put(`/distributors/${id}`, payload),
    onSuccess: () => {
      toast.success('Distributor updated!');
      qc.invalidateQueries({ queryKey: ['distributors'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update distributor.'),
  });

  const deleteDistributor = useMutation({
    mutationFn: (id) => apiClient.delete(`/distributors/${id}`),
    onSuccess: () => {
      toast.success('Distributor deleted!');
      qc.invalidateQueries({ queryKey: ['distributors'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete distributor.'),
  });

  /* ── Delivery Scorecard Mutations ────────────────────────────────────────── */
  const recordDeliveryMutation = useMutation({
    mutationFn: ({ id, turnaroundDays, note }) =>
      apiClient.post(`/distributors/${id}/delivery`, { turnaroundDays, note }),
    onSuccess: (res) => {
      const updated = res.data?.data?.distributor || res.data?.distributor;
      toast.success(res.data?.message || 'Delivery turnaround logged! Lead time updated.');
      qc.invalidateQueries({ queryKey: ['distributors'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      if (updated) {
        setScorecardDistributor(updated);
      }
      setLogNote('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record delivery.'),
  });

  const resetScorecardMutation = useMutation({
    mutationFn: (id) => apiClient.post(`/distributors/${id}/reset-reliability`),
    onSuccess: () => {
      toast.success('Scorecard reset to promised default lead time');
      qc.invalidateQueries({ queryKey: ['distributors'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      setScorecardDistributor(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reset scorecard.'),
  });

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const closeModal = () => {
    setModal(null);
    setForm(emptyForm);
    setEditingId(null);
  };

  const openEdit = (d) => {
    setForm({
      name: d.name,
      phone: d.phone ? d.phone.replace(/\D/g, '').slice(0, 10) : '',
      minimumOrderValue: d.minimumOrderValue ?? 0,
      deliveryDays: d.deliveryDays ?? 2,
      categories: Array.isArray(d.categories) ? d.categories.join(', ') : (d.categories ?? ''),
    });
    setEditingId(d._id);
    setModal('edit');
  };

  const openScorecard = (d) => {
    setScorecardDistributor(d);
    setLogTurnaround(d.effectiveLeadTime || d.deliveryDays || 2);
    setLogNote('');
  };

  const handleDelete = (d) => {
    if (window.confirm(`Are you sure you want to delete distributor "${d.name}"?`)) {
      deleteDistributor.mutate(d._id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    ...form,
    phone: form.phone.trim(),
    minimumOrderValue: Number(form.minimumOrderValue),
    deliveryDays: Number(form.deliveryDays),
    categories: form.categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Distributor name is required');
      return;
    }
    const cleanPhone = (form.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Distributor phone must be exactly 10 digits (e.g. 9876543210)');
      return;
    }
    const payload = buildPayload();
    if (modal === 'edit') {
      editDistributor.mutate({ id: editingId, payload });
    } else {
      addDistributor.mutate(payload);
    }
  };

  const handleLogDeliverySubmit = (e) => {
    e.preventDefault();
    if (!scorecardDistributor) return;
    recordDeliveryMutation.mutate({
      id: scorecardDistributor._id,
      turnaroundDays: Number(logTurnaround),
      note: logNote.trim() || undefined,
    });
  };

  const isPending = addDistributor.isPending || editDistributor.isPending;

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 fade-up fade-up-d0">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
          >
            Distributors &amp; Scorecards
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 font-medium">
            {safeDistributors.length} supplier{safeDistributors.length !== 1 ? 's' : ''} · AI dynamic lead time tracking
          </p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary text-xs sm:text-sm">
          <Plus size={16} /> Add Distributor
        </button>
      </div>

      {/* ── Card grid ───────────────────────────────────────────────────────── */}
      {safeDistributors.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No distributors yet.</p>
          <p className="text-sm mt-1">Add your first distributor to link products and send orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeDistributors.map((d) => {
            const initials = d.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join('');

            const hasHistory = Array.isArray(d.deliveryHistory) && d.deliveryHistory.length > 0;
            const onTime = d.onTimeRate ?? 100;
            const promisedDays = d.deliveryDays || 2;
            const actualDays = d.effectiveLeadTime || promisedDays;
            const delayBuffer = d.delayBufferDays || Math.max(0, Number((actualDays - promisedDays).toFixed(1)));

            // Reliability color styles
            let statusBadge = {
              text: '95%+ On-Time · Reliable',
              bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              dot: '#10b981',
            };
            if (!hasHistory) {
              statusBadge = {
                text: 'New Supplier (Promised)',
                bg: 'bg-gray-50 text-gray-600 border-gray-200',
                dot: '#9ca3af',
              };
            } else if (onTime < 60) {
              statusBadge = {
                text: `${onTime}% On-Time · Frequent Delays`,
                bg: 'bg-red-50 text-red-700 border-red-200',
                dot: '#ef4444',
              };
            } else if (onTime < 85) {
              statusBadge = {
                text: `${onTime}% On-Time · Moderate`,
                bg: 'bg-amber-50 text-amber-700 border-amber-200',
                dot: '#f59e0b',
              };
            }

            return (
              <div key={d._id} className="card card-interactive space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Top: Avatar, Name, Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-xs"
                        style={{
                          background:
                            delayBuffer > 0.5
                              ? 'linear-gradient(135deg,#f97316,#ea580c)'
                              : 'linear-gradient(135deg,#16a34a,#15803d)',
                          color: '#fff',
                        }}
                      >
                        {initials || <Truck size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 leading-tight truncate text-sm sm:text-base">{d.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate font-medium">📞 {d.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit distributor"
                        aria-label="Edit distributor"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete distributor"
                        aria-label="Delete distributor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* ── Reliability Scorecard Badge ────────────────────────────── */}
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Activity size={12} className="text-primary-600" /> Lead Time AI
                      </span>
                      <span
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 ${statusBadge.bg}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                          style={{ backgroundColor: statusBadge.dot }}
                        />
                        {statusBadge.text}
                      </span>
                    </div>

                    {/* Dynamic Lead Time vs Promised Comparison */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/90 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Promised</span>
                        <span className="font-bold text-gray-700">{promisedDays} days</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Actual (AI)</span>
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            delayBuffer > 0.5 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {actualDays}d
                          {delayBuffer > 0.5 && (
                            <span
                              className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.2 rounded"
                              title={`+${delayBuffer} days extra safety stock buffer added`}
                            >
                              +{delayBuffer}d
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Delay Warning Pill */}
                    {delayBuffer > 0.5 && (
                      <div className="flex items-center gap-1 text-[11px] text-red-700 font-semibold bg-red-50 border border-red-200/80 px-2 py-1 rounded-lg">
                        <AlertTriangle size={12} className="shrink-0 text-red-600" />
                        <span className="truncate">Safety buffer expanded by +{delayBuffer}d</span>
                      </div>
                    )}
                  </div>

                  {/* Min order & Categories */}
                  <div className="text-xs text-gray-500 space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Min. wholesale order</span>
                      <strong className="text-gray-800 font-bold">₹{d.minimumOrderValue ?? 0}</strong>
                    </div>
                    {d.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {d.categories.map((cat) => (
                          <span
                            key={cat}
                            className="bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Scorecard CTA */}
                <button
                  type="button"
                  onClick={() => openScorecard(d)}
                  className="w-full py-2 px-3 rounded-xl border border-gray-200 hover:border-primary-500 bg-white hover:bg-primary-50/50 text-gray-700 hover:text-primary-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs mt-1"
                >
                  <Clock size={14} className="text-primary-600 shrink-0" />
                  <span>Scorecard &amp; Delivery Log</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Delivery Scorecard & Turnaround Modal ────────────────────────────── */}
      {scorecardDistributor && (
        <Modal
          title={`Scorecard — ${scorecardDistributor.name}`}
          onClose={() => setScorecardDistributor(null)}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {/* KPI Summary strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Promised</span>
                <span className="text-base sm:text-lg font-bold text-gray-800 mt-0.5 block">
                  {scorecardDistributor.deliveryDays || 2}d
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Wholesale SLA</span>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  (scorecardDistributor.delayBufferDays || 0) > 0.5
                    ? 'bg-red-50/80 border-red-200'
                    : 'bg-emerald-50/80 border-emerald-200'
                }`}
              >
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Actual Turnaround</span>
                <span
                  className={`text-base sm:text-lg font-bold mt-0.5 block ${
                    (scorecardDistributor.delayBufferDays || 0) > 0.5 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {scorecardDistributor.effectiveLeadTime || scorecardDistributor.deliveryDays || 2}d
                </span>
                <span className="text-[10px] font-semibold text-gray-600">Last 3 Deliveries</span>
              </div>
              <div className="p-3 bg-primary-50/70 rounded-xl border border-primary-200">
                <span className="text-[10px] text-primary-700 font-bold block uppercase tracking-wider">Reliability</span>
                <span className="text-base sm:text-lg font-bold text-primary-800 mt-0.5 block">
                  {scorecardDistributor.onTimeRate ?? 100}%
                </span>
                <span className="text-[10px] text-primary-600 font-medium">On-Time Deliveries</span>
              </div>
            </div>

            {/* AI Explanation Banner */}
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                (scorecardDistributor.delayBufferDays || 0) > 0.5
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              }`}
            >
              <Sparkles
                size={16}
                className={
                  (scorecardDistributor.delayBufferDays || 0) > 0.5
                    ? 'text-amber-600 shrink-0 mt-0.5'
                    : 'text-emerald-600 shrink-0 mt-0.5'
                }
              />
              <div className="space-y-0.5 leading-relaxed">
                <p className="font-bold">
                  {(scorecardDistributor.delayBufferDays || 0) > 0.5
                    ? `Adaptive Lead Time Active (+${scorecardDistributor.delayBufferDays} days)`
                    : 'Reliable Supplier Status'}
                </p>
                <p className="text-[11.5px] opacity-90">
                  {(scorecardDistributor.delayBufferDays || 0) > 0.5
                    ? `Because ${scorecardDistributor.name} takes ~${scorecardDistributor.effectiveLeadTime} days instead of ${scorecardDistributor.deliveryDays} days, InventIQ automatically increased safety stock formulas for all their supplied items to prevent out-of-stock shelves.`
                    : `${scorecardDistributor.name} delivers consistently on time. InventIQ keeps safety stock lean to prevent locking excess capital.`}
                </p>
              </div>
            </div>

            {/* ── Form: Log new delivery turnaround ──────────────────────────── */}
            <form onSubmit={handleLogDeliverySubmit} className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-primary-600" />
                  <span>Log Wholesale Delivery Arrival</span>
                </label>
                <span className="text-[11px] text-gray-400 font-medium">1-Tap AI Update</span>
              </div>

              {/* Quick turnaround chips */}
              <div>
                <p className="text-[11px] text-gray-500 mb-1.5 font-medium">How many days did this delivery take?</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setLogTurnaround(d)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        logTurnaround === d
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {d} {d === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional note */}
              <div>
                <input
                  type="text"
                  placeholder="Optional delivery note (e.g. Delayed due to rain, Truck on time)"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={recordDeliveryMutation.isPending}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold"
              >
                <CheckCircle2 size={15} />
                <span>
                  {recordDeliveryMutation.isPending ? 'Recalculating AI Lead Time…' : 'Record Delivery & Update Scorecard'}
                </span>
              </button>
            </form>

            {/* ── Delivery History Log ───────────────────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" />
                  <span>Delivery Turnaround History</span>
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {scorecardDistributor.deliveryHistory?.length || 0} recorded
                </span>
              </div>

              {scorecardDistributor.deliveryHistory?.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-xs">
                  No delivery logs recorded yet. Use the form above to log incoming shipments!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto scroll-thin pr-1">
                  {[...scorecardDistributor.deliveryHistory].reverse().map((h, i) => (
                    <div
                      key={h._id || i}
                      className="p-2.5 bg-white rounded-xl border border-gray-100 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-800">{h.turnaroundDays} days delivery</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              h.onTime ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {h.onTime ? 'On Time' : `+${(h.turnaroundDays - (h.promisedDays || 2)).toFixed(1)}d Late`}
                          </span>
                        </div>
                        {h.note && <p className="text-[11px] text-gray-400 truncate mt-0.5">{h.note}</p>}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(h.deliveredDate || h.orderDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset this scorecard back to default lead time?')) {
                    resetScorecardMutation.mutate(scorecardDistributor._id);
                  }
                }}
                disabled={resetScorecardMutation.isPending}
                className="text-[11px] text-gray-400 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw size={12} /> Reset Scorecard
              </button>
              <button
                type="button"
                onClick={() => setScorecardDistributor(null)}
                className="btn-outline text-xs py-1.5 px-4 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Distributor' : 'Add Distributor'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Sharma Wholesalers"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Phone (10 Digits) *</label>
                <span
                  className={`text-xs ${form.phone.length === 10 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}
                >
                  {form.phone.length}/10 digits
                </span>
              </div>
              <input
                name="phone"
                required
                type="tel"
                maxLength={10}
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="10-digit mobile number (e.g. 9876543210)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order (₹)</label>
                <input
                  name="minimumOrderValue"
                  type="number"
                  min="0"
                  value={form.minimumOrderValue}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promised Days (SLA)</label>
                <input
                  name="deliveryDays"
                  type="number"
                  min="1"
                  max="30"
                  value={form.deliveryDays}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
                <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
              </label>
              <input
                name="categories"
                value={form.categories}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Groceries, Beverages, Snacks"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="btn-primary flex-1">
                {isPending ? 'Saving…' : modal === 'edit' ? 'Update' : 'Add Distributor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
