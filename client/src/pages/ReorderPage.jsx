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
      <div className="flex items-center justify-between flex-wrap gap-3 fade-up fade-up-d0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>Reorder Suggestions</h2>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">
            {suggestions.length} item{suggestions.length !== 1 ? 's' : ''} · AI forecast + safety buffer analysis
          </p>
        </div>
        <button
          onClick={() => setShowOcrModal(true)}
          className="btn-primary text-xs"
        >
          <Camera size={16} />
          Scan Invoice (OCR)
        </button>
      </div>

      {/* ── Urgency legend ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400 font-medium mr-1">Urgency Levels:</span>
        {Object.entries(URGENCY).map(([key, cfg]) => (
          <span key={key} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.classes}`}>
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
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <Truck size={18} className="text-primary-600" />
                    {group.distributorName}
                  </h3>
                  {group.distributorPhone && (
                    <p className="text-xs text-gray-400 mt-0.5">📞 {group.distributorPhone}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''} to restock · Est. Order: <strong>₹{totalOrderEst.toLocaleString('en-IN')}</strong>
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleSendWhatsApp(group)}
                    disabled={sendWhatsApp.isPending}
                    className="btn-primary text-xs py-2 px-3 shadow-xs"
                  >
                    <MessageCircle size={15} />
                    Send WhatsApp Order
                  </button>
                  <button
                    onClick={() => markOrdered.mutate(group.distributorId)}
                    disabled={markOrdered.isPending}
                    className="btn-outline text-xs py-2 px-3"
                  >
                    <CheckCheck size={15} />
                    Mark as Ordered
                  </button>
                  <button
                    onClick={() => restockGroup.mutate(group)}
                    disabled={restockGroup.isPending}
                    className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs py-2 px-3 rounded-lg transition"
                    title="Increment inventory stock with ordered quantities"
                  >
                    <PackageCheck size={15} />
                    {restockGroup.isPending ? 'Restocking...' : 'Mark Delivered & Restock (+Stock)'}
                  </button>
                </div>
              </div>

              {/* Wholesale Minimum Order Value (MOV) Optimizer Banner */}
              {mov > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isMovMet
                      ? 'bg-green-50/80 border-green-200 text-green-900'
                      : 'bg-amber-50/90 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isMovMet ? (
                      <ShieldCheck size={16} className="text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        {isMovMet
                          ? 'Free Wholesale Delivery Qualified! 🎉'
                          : `₹${difference.toLocaleString('en-IN')} away from Free Delivery`}
                      </span>
                      <span className="text-gray-500 ml-1.5">
                        (Order: ₹{totalOrderEst.toLocaleString('en-IN')} · Free Delivery Threshold: ₹{mov.toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>

                  {!isMovMet && (
                    <span className="text-[11px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                      💡 Tip: Top-up staples to save delivery charges
                    </span>
                  )}
                </div>
              )}

              {/* Items table */}
              <div className="overflow-x-auto">
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
