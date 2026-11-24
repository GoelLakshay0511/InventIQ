import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MessageCircle, CheckCheck, Truck, ShieldCheck, AlertCircle, Camera, PackageCheck } from 'lucide-react';
import apiClient from '../api/client';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import InvoiceOcrModal from '../components/restock/InvoiceOcrModal';

/* ── Urgency config ─────────────────────────────────────────────────────────── */
const URGENCY = {
  critical: { label: 'Critical', classes: 'bg-red-100 text-red-700 border-red-200' },
  high:     { label: 'High',     classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium:   { label: 'Medium',   classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low:      { label: 'Low',      classes: 'bg-green-100 text-green-700 border-green-200' },
};

function UrgencyBadge({ level }) {
  const cfg = URGENCY[level] ?? URGENCY.low;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

/**
 * Group an array of suggestion objects by their distributorId / distributorName.
 */
function groupByDistributor(suggestions, whatsappMap = {}) {
  const map = new Map();
  for (const s of suggestions) {
    const rawDistId = s.distributorId?._id || s.distributorId;
    const key = rawDistId ? rawDistId.toString() : 'general';
    if (!map.has(key)) {
      const waInfo = whatsappMap[key] || {};
      map.set(key, {
        distributorId: key,
        distributorName: s.distributorName || s.distributorId?.name || waInfo.distributorName || 'Supplier',
        distributorPhone: s.distributorPhone || s.distributorId?.phone || waInfo.phone || '',
        whatsappLink: waInfo.link || null,
        items: [],
      });
    }
    map.get(key).items.push(s);
  }
  return Array.from(map.values());
}

export default function ReorderPage() {
  const qc = useQueryClient();
  const [showOcrModal, setShowOcrModal] = useState(false);

  const { data: suggestionData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: async () => {
      const res = await apiClient.get('/reorder/suggestions');
      const payload = res.data?.data || res.data;
      return payload?.suggestion || payload || null;
    },
  });

  const { data: distributors = [], isLoading: loadingDistributors } = useQuery({
    queryKey: ['distributors'],
    queryFn: async () => {
      const res = await apiClient.get('/distributors');
      const payload = res.data?.data || res.data;
      return payload?.distributors || (Array.isArray(payload) ? payload : []);
    },
  });

  const suggestions = suggestionData?.items || (Array.isArray(suggestionData) ? suggestionData : []);
  const whatsappMessages = suggestionData?.whatsappMessages || {};
  const groups = groupByDistributor(suggestions, whatsappMessages);

  /* ── Send WhatsApp order mutation ─────────────────────────────────────────── */
  const sendWhatsApp = useMutation({
    mutationFn: (distributorId) =>
      apiClient.post('/reorder/whatsapp', { distributorId }),
    onSuccess: (res) => {
      const payload = res.data?.data || res.data;
      const targetLink = payload?.link || Object.values(payload?.links || {})[0]?.link;
      if (targetLink) {
        window.open(targetLink, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No WhatsApp link returned for this supplier.');
      }
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to generate WhatsApp order.'),
  });

  const handleSendWhatsApp = (group) => {
    if (group.whatsappLink) {
      window.open(group.whatsappLink, '_blank', 'noopener,noreferrer');
    } else {
      sendWhatsApp.mutate(group.distributorId);
    }
  };

  /* ── Mark as ordered mutation ─────────────────────────────────────────────── */
  const markOrdered = useMutation({
    mutationFn: (distributorId) =>
      apiClient.patch('/reorder/mark-ordered', { distributorId }),
    onSuccess: () => {
      toast.success('Marked as ordered!');
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to mark as ordered.'),
  });

  /* ── Direct Delivery Fulfillment & Restock ────────────────────────────── */
  const restockGroup = useMutation({
    mutationFn: async (group) => {
      const items = group.items.map((item) => ({
        productId: item.productId || item._id,
        quantityReceived: Number(item.suggestedOrderQty || item.suggestedQty || 1),
        unitCost: item.costPrice || 0,
      }));
      const res = await apiClient.post('/products/restock/confirm', {
        items,
        supplierName: group.distributorName,
        invoiceNumber: `DELIV-${Date.now().toString().slice(-6)}`,
      });
      return res.data;
    },
    onSuccess: (data, group) => {
      toast.success(`🎉 Restocked ${group.items.length} products from ${group.distributorName}! Current stock updated.`);
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to restock delivery.'),
  });

  if (loadingSuggestions || loadingDistributors) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Reorder Suggestions</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-normal">
            {suggestions.length} item{suggestions.length !== 1 ? 's' : ''} needing restock
          </p>
        </div>
        <button
          onClick={() => setShowOcrModal(true)}
          className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3 font-semibold bg-white"
        >
          <Camera size={15} className="text-primary-600" />
          <span className="hidden sm:inline">Scan Delivery Invoice</span>
          <span className="sm:hidden">Scan Bill</span>
        </button>
      </div>

      {/* ── Urgency legend ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-thin">
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider shrink-0 mr-1">Urgency:</span>
        {Object.entries(URGENCY).map(([key, cfg]) => (
          <span key={key} className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold shrink-0 ${cfg.classes}`}>
            {cfg.label}
          </span>
        ))}
      </div>

      {/* ── No suggestions state ────────────────────────────────────────────── */}
      {groups.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-medium text-gray-700">All stock levels are healthy!</p>
          <p className="text-sm mt-1">Head back to the dashboard to run an on-demand forecast whenever you want.</p>
        </div>
      )}

      {/* ── Distributor groups ──────────────────────────────────────────────── */}
      <div className="space-y-5">
        {groups.map((group) => {
          const distributorDoc = distributors.find((d) => d._id?.toString() === group.distributorId);
          const mov = distributorDoc?.minimumOrderValue || 0;
          const totalOrderEst = group.items.reduce(
            (sum, item) => sum + (item.suggestedOrderQty || 0) * (item.costPrice || 0),
            0
          );
          const isMovMet = mov === 0 || totalOrderEst >= mov;
          const difference = Math.max(0, mov - totalOrderEst);

          return (
            <div key={group.distributorId} className="card space-y-4">
              {/* Distributor header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <Truck size={18} className="text-primary-600 shrink-0" />
                    <span>{group.distributorName}</span>
                  </h3>
                  {group.distributorPhone && (
                    <p className="text-xs text-gray-500 mt-0.5 font-medium flex items-center gap-1">
                      <span>📞</span> {group.distributorPhone}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-semibold text-gray-700">{group.items.length} item{group.items.length !== 1 ? 's' : ''} to restock</span>
                    {' · '}
                    <span>Est. Order: <strong className="text-gray-900 font-bold">₹{totalOrderEst.toLocaleString('en-IN')}</strong></span>
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSendWhatsApp(group)}
                    disabled={sendWhatsApp.isPending}
                    className="btn-primary text-xs py-2.5 px-3.5 shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto font-bold"
                  >
                    <MessageCircle size={16} />
                    <span>Send WhatsApp Order</span>
                  </button>
                  <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => markOrdered.mutate(group.distributorId)}
                      disabled={markOrdered.isPending}
                      className="btn-outline text-xs py-2 px-2.5 flex items-center justify-center gap-1 font-semibold"
                    >
                      <CheckCheck size={14} />
                      <span className="truncate">Mark Ordered</span>
                    </button>
                    <button
                      onClick={() => restockGroup.mutate(group)}
                      disabled={restockGroup.isPending}
                      className="flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs py-2 px-2.5 rounded-lg transition"
                      title="Increment inventory stock with ordered quantities"
                    >
                      <PackageCheck size={14} />
                      <span className="truncate">{restockGroup.isPending ? 'Restocking...' : 'Restock (+Stock)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Wholesale Minimum Order Value (MOV) Optimizer Banner */}
              {mov > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isMovMet
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/90 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2">
                    {isMovMet ? (
                      <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <div>
                      <div className="font-bold flex items-center gap-1 flex-wrap">
                        <span>
                          {isMovMet
                            ? 'Free Wholesale Delivery Qualified! 🎉'
                            : `₹${difference.toLocaleString('en-IN')} away from Free Delivery`}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-0.5">
                        Order: ₹{totalOrderEst.toLocaleString('en-IN')} · Free Delivery Threshold: ₹{mov.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {!isMovMet && (
                    <span className="text-[11px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                      💡 Tip: Top-up staples to save delivery charges
                    </span>
                  )}
                </div>
              )}

              {/* ── Desktop Items Table (Hidden on Mobile) ────────────────────────── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                      <th className="pb-2.5 pr-4 text-left">Product</th>
                      <th className="pb-2.5 pr-4 text-left">Stock</th>
                      <th className="pb-2.5 pr-4 text-left">Reorder Point</th>
                      <th className="pb-2.5 pr-4 text-left">Suggested Restock</th>
                      <th className="pb-2.5 pr-4 text-left">Est. Cost</th>
                      <th className="pb-2.5 text-left">Urgency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {group.items.map((item) => {
                      const itemTotal = (item.suggestedOrderQty || 0) * (item.costPrice || 0);
                      const cartons =
                        item.suggestedCartons ||
                        Math.ceil((item.suggestedOrderQty || 1) / (item.packSize || 1));

                      return (
                        <tr key={item.productId ?? item._id} className="hover:bg-gray-50/50">
                          <td className="py-2.5 pr-4 font-semibold text-gray-800">
                            {item.productName}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600 font-medium">
                            {item.currentStock} {item.unit || ''}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-500">
                            {item.reorderPoint} {item.unit || ''}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-900 font-bold">
                            {item.suggestedOrderQty || item.suggestedQty || '—'} {item.unit || ''}
                            <span className="text-gray-400 font-normal ml-1">
                              ({cartons} ctn)
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-gray-700 font-medium">
                            {itemTotal > 0 ? `₹${itemTotal.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2.5">
                            <UrgencyBadge level={item.urgency} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Native Cards List (Visible only on Mobile) ───────────────── */}
              <div className="md:hidden space-y-2.5">
                {group.items.map((item) => {
                  const itemTotal = (item.suggestedOrderQty || 0) * (item.costPrice || 0);
                  const cartons =
                    item.suggestedCartons ||
                    Math.ceil((item.suggestedOrderQty || 1) / (item.packSize || 1));

                  return (
                    <div
                      key={item.productId ?? item._id}
                      className="p-3 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2"
                    >
                      {/* Top row: Title & Urgency */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-gray-900 text-sm leading-tight">
                          {item.productName}
                        </div>
                        <UrgencyBadge level={item.urgency} />
                      </div>

                      {/* Middle row: Stock & Order Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-gray-100/80">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-gray-400">Current Stock</div>
                          <div className="font-bold text-red-600 mt-0.5">
                            {item.currentStock} <span className="font-normal text-gray-500">{item.unit || ''}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Reorder at {item.reorderPoint} {item.unit || ''}
                          </div>
                        </div>

                        <div className="border-l border-gray-100 pl-2">
                          <div className="text-[10px] uppercase font-semibold text-primary-700">Suggested Order</div>
                          <div className="font-extrabold text-primary-900 mt-0.5">
                            +{item.suggestedOrderQty || item.suggestedQty || '—'} {item.unit || ''}
                            <span className="text-[11px] font-normal text-gray-500 ml-1">
                              ({cartons} ctn)
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-gray-700 mt-0.5">
                            Est: {itemTotal > 0 ? `₹${itemTotal.toLocaleString('en-IN')}` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <InvoiceOcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
      />
    </div>
  );
}
