import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, X, Pencil, Trash2, Truck } from 'lucide-react';
import apiClient from '../api/client';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const emptyForm = {
  name: '', phone: '', minimumOrderValue: 0, deliveryDays: 2, categories: '',
};

/** Modal wrapper (shared pattern) */
function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function DistributorsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const { data: distributors = [], isLoading } = useQuery({
    queryKey: ['distributors'],
    queryFn: async () => {
      const res = await apiClient.get('/distributors');
      const payload = res.data?.data || res.data;
      return payload?.distributors || (Array.isArray(payload) ? payload : []);
    },
  });

  const safeDistributors = Array.isArray(distributors) ? distributors : [];

  /* ── Mutations ──────────────────────────────────────────────────────────── */
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

  const closeModal = () => { setModal(null); setForm(emptyForm); setEditingId(null); };

  const openEdit = (d) => {
    setForm({
      name: d.name,
      phone: d.phone ? d.phone.replace(/\D/g, '').slice(0, 10) : '',
      minimumOrderValue: d.minimumOrderValue ?? 0,
      deliveryDays: d.deliveryDays ?? 2,
      // Store categories array as comma-separated string for the text input
      categories: Array.isArray(d.categories) ? d.categories.join(', ') : (d.categories ?? ''),
    });
    setEditingId(d._id);
    setModal('edit');
  };

  const handleDelete = (d) => {
    if (window.confirm(`Are you sure you want to delete distributor "${d.name}"?`)) {
      deleteDistributor.mutate(d._id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Allow only numbers and limit to 10 digits
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
    // Split comma-separated string into an array of trimmed, non-empty strings
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

  const isPending = addDistributor.isPending || editDistributor.isPending;

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 fade-up fade-up-d0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>Distributors</h2>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">{safeDistributors.length} supplier{safeDistributors.length !== 1 ? 's' : ''} linked to your store</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary">
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
            const initials = d.name.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('');
            return (
            <div key={d._id} className="card card-interactive space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}
                  >
                    {initials || <Truck size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 leading-tight">{d.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📞 {d.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
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

              <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span>Min. order</span>
                  <strong className="text-gray-800 font-semibold">₹{d.minimumOrderValue ?? 0}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <strong className="text-gray-800 font-semibold">{d.deliveryDays ?? '—'} day{d.deliveryDays !== 1 ? 's' : ''}</strong>
                </div>
                {d.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {d.categories.map((cat) => (
                      <span key={cat} className="bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full text-[11px] font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {modal && (
        <Modal
          title={modal === 'edit' ? 'Edit Distributor' : 'Add Distributor'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input name="name" required value={form.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Sharma Traders" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Phone (10 Digits) *</label>
                <span className={`text-xs ${form.phone.length === 10 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
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
                <input name="minimumOrderValue" type="number" min="0" value={form.minimumOrderValue}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Days</label>
                <input name="deliveryDays" type="number" min="1" max="30" value={form.deliveryDays}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
                <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
              </label>
              <input name="categories" value={form.categories} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Groceries, Beverages, Snacks" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-outline flex-1">Cancel</button>
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
