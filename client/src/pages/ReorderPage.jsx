import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  CheckCheck,
  Truck,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Camera,
  PackageCheck,
  Clock,
  CheckCircle2,
  Sparkles,
  X,
  Plus,
  Minus,
  Activity,
} from 'lucide-react';
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

  // Delivery confirmation modal state
  const [deliveryModalGroup, setDeliveryModalGroup] = useState(null);
  const [turnaroundDays, setTurnaroundDays] = useState(2);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [restockStockCheck, setRestockStockCheck] = useState(true);

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
      toast.success('Marked as ordered! Tracking delivery turnaround.');
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

  /* ── Confirm Delivery & Update Reliability Scorecard ────────────────────── */
  const confirmDelivery = useMutation({
    mutationFn: async ({ distributorId, daysTaken, note, restockItems }) => {
      const res = await apiClient.post('/reorder/mark-delivered', {
        distributorId,
        daysTaken,
        note,
        restockItems,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || '🎉 Delivery confirmed and reliability scorecard updated!');
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      qc.invalidateQueries({ queryKey: ['distributors'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      setDeliveryModalGroup(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to confirm delivery.');
    },
  });

  const openDeliveryModal = (group, distributorDoc, elapsedDays) => {
    const defaultTurnaround =
      elapsedDays && elapsedDays > 0
        ? elapsedDays
        : distributorDoc?.effectiveLeadTime || distributorDoc?.deliveryDays || 2;
    setTurnaroundDays(defaultTurnaround);
    setDeliveryNote('');
    setRestockStockCheck(true);
    setDeliveryModalGroup({ group, distributorDoc });
  };

  const handleConfirmDeliverySubmit = () => {
    if (!deliveryModalGroup) return;
    const { group } = deliveryModalGroup;
    const restockItems = restockStockCheck
      ? group.items.map((item) => ({
          productId: item.productId || item._id,
          quantityReceived: Number(item.suggestedOrderQty || item.suggestedQty || 1),
          unitCost: item.costPrice || 0,
        }))
      : [];

    confirmDelivery.mutate({
      distributorId: group.distributorId,
      daysTaken: Number(turnaroundDays),
      note: deliveryNote || `Delivery confirmed via Reorder Page (${turnaroundDays}d turnaround)`,
      restockItems,
    });
  };

  if (loadingSuggestions || loadingDistributors) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 fade-up fade-up-d0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
            Reorder Suggestions
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
            <span>{suggestions.length} item{suggestions.length !== 1 ? 's' : ''} to reorder</span>
            <span>·</span>
            <span className="text-primary-700 font-semibold flex items-center gap-1">
              <Sparkles size={13} className="text-primary-600" />
              Dynamic AI Lead Times &amp; Safety Buffers
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowOcrModal(true)}
          className="btn-primary text-xs"
        >
          <Camera size={16} />
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

          // Reliability Scorecard metrics
          const promisedDays = distributorDoc?.deliveryDays ?? group.items[0]?.promisedLeadTime ?? 2;
          const effectiveLeadTime = distributorDoc?.effectiveLeadTime ?? group.items[0]?.effectiveLeadTime ?? promisedDays;
          const onTimeRate = distributorDoc?.onTimeRate ?? group.items[0]?.distributorOnTimeRate ?? 100;
          const delayBuffer = distributorDoc?.delayBufferDays ?? group.items[0]?.delayBufferDays ?? Math.max(0, Number((effectiveLeadTime - promisedDays).toFixed(1)));
          const isDelayed = delayBuffer >= 0.4 || onTimeRate < 75;
          const isHighReliability = onTimeRate >= 85 && delayBuffer < 0.4;

          // Order tracking state
          const ordersMap = suggestionData?.distributorOrders;
          const orderInfo = ordersMap instanceof Map
            ? ordersMap.get(group.distributorId)
            : (ordersMap?.[group.distributorId] || null);
          const isOrdered = orderInfo?.status === 'ordered';
          const orderDate = orderInfo?.orderedAt ? new Date(orderInfo.orderedAt) : null;
          const elapsedDays = orderDate
            ? Math.max(0.5, Number(((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)))
            : null;

          return (
            <div key={group.distributorId} className="card space-y-4">
              {/* Distributor header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Truck size={18} className="text-primary-600 shrink-0" />
                      <span>{group.distributorName}</span>
                    </h3>

                    {/* Reliability Pill */}
                    {isDelayed ? (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span>Avg {effectiveLeadTime}d · {onTimeRate}% On-Time</span>
                      </span>
                    ) : isHighReliability ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{onTimeRate}% On-Time · {effectiveLeadTime}d Avg</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {onTimeRate}% On-Time · {effectiveLeadTime}d Avg
                      </span>
                    )}
                  </div>

                  {group.distributorPhone && (
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <span>📞</span> {group.distributorPhone}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
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
                      disabled={markOrdered.isPending || isOrdered}
                      className={`btn-outline text-xs py-2 px-2.5 flex items-center justify-center gap-1 font-semibold ${
                        isOrdered ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                      }`}
                      title={isOrdered ? 'Order is already marked in progress' : 'Mark this order as placed with distributor'}
                    >
                      <CheckCheck size={14} className={isOrdered ? 'text-blue-600' : ''} />
                      <span className="truncate">{isOrdered ? 'Ordered ✓' : 'Mark Ordered'}</span>
                    </button>

                    <button
                      onClick={() => openDeliveryModal(group, distributorDoc, elapsedDays)}
                      disabled={confirmDelivery.isPending}
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition shadow-xs"
                      title="Confirm delivery arrival, log actual turnaround, and update inventory"
                    >
                      <PackageCheck size={14} />
                      <span className="truncate">Confirm Delivery</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Order in Progress Tracker Banner ────────────────────────── */}
              {isOrdered && (
                <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-blue-950">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span>Order In Progress</span>
                        <span className="text-[10px] bg-blue-200 text-blue-900 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          Awaiting Delivery
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        {orderDate
                          ? `Placed on ${orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} (${elapsedDays}d ago).`
                          : 'Order placed.'}{' '}
                        Expected turnaround is ~<strong>{effectiveLeadTime} days</strong> based on supplier delivery history.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openDeliveryModal(group, distributorDoc, elapsedDays)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition shadow-xs flex items-center justify-center gap-1 shrink-0 self-stretch sm:self-auto"
                  >
                    <PackageCheck size={14} />
                    <span>Stock Received? Log Turnaround</span>
                  </button>
                </div>
              )}

              {/* ── AI Reliability & Safety Buffer Alert Banner ─────────────── */}
              {isDelayed ? (
                <div className="p-3 bg-red-50/90 border border-red-200/90 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-950 flex items-center gap-1.5 flex-wrap">
                        <span>Supplier Delay Warning · Dynamic Safety Buffer</span>
                        <span className="text-[10px] bg-red-200/90 text-red-900 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          +{delayBuffer}d Buffer Added
                        </span>
                      </div>
                      <p className="text-red-900/90 text-[11px] mt-0.5 leading-relaxed">
                        <strong>{group.distributorName}</strong> takes <strong>{effectiveLeadTime} days</strong> on average (promised <strong>{promisedDays} days</strong>).
                        InventIQ automatically expanded your safety stock buffer to trigger reorders <strong>{delayBuffer} days earlier</strong>, preventing empty shelves!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openDeliveryModal(group, distributorDoc, elapsedDays)}
                    className="self-stretch sm:self-auto shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <PackageCheck size={14} />
                    <span>Log Delivery</span>
                  </button>
                </div>
              ) : isHighReliability ? (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-emerald-950">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={17} className="text-emerald-600 shrink-0" />
                    <span className="text-[11px]">
                      <strong>Fast &amp; Reliable Supplier:</strong> Consistent turnaround (~{effectiveLeadTime}d vs {promisedDays}d promised, {onTimeRate}% on-time). Lean safety buffers active.
                    </span>
                  </div>
                  <button
                    onClick={() => openDeliveryModal(group, distributorDoc, elapsedDays)}
                    className="self-stretch sm:self-auto text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 font-semibold text-[11px] py-1.5 px-3 rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1"
                  >
                    <PackageCheck size={13} />
                    <span>Log Arrival</span>
                  </button>
                </div>
              ) : null}

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
                      <th className="pb-2.5 pr-4 text-left">Lead Time &amp; Buffer</th>
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
                      const itemBuffer = item.delayBufferDays || delayBuffer || 0;

                      return (
                        <tr key={item.productId ?? item._id} className="hover:bg-gray-50/50">
                          <td className="py-2.5 pr-4 font-semibold text-gray-800">
                            {item.productName}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600 font-medium">
                            {item.currentStock} {item.unit || ''}
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="font-semibold text-gray-800">
                              {item.effectiveLeadTime || effectiveLeadTime}d actual
                            </div>
                            {itemBuffer > 0.3 ? (
                              <span className="text-[10px] text-red-600 font-bold block">
                                +{itemBuffer}d delay buffer
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 block">
                                promised {item.promisedLeadTime || promisedDays}d
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-700">
                            <span className="font-bold">{item.reorderPoint} {item.unit || ''}</span>
                            <span className="text-[10px] text-gray-400 block">
                              (SS: {item.safetyStock} {item.unit || ''})
                            </span>
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
                  const itemBuffer = item.delayBufferDays || delayBuffer || 0;

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
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Reorder at <strong className="text-gray-800">{item.reorderPoint}</strong> {item.unit || ''}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            SS: {item.safetyStock} {item.unit || ''}
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

                      {/* Dynamic Lead Time note on mobile card */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 px-0.5 pt-0.5">
                        <span>Lead Time: <strong>{item.effectiveLeadTime || effectiveLeadTime}d</strong> (promised {item.promisedLeadTime || promisedDays}d)</span>
                        {itemBuffer > 0.3 && (
                          <span className="text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded">
                            +{itemBuffer}d buffer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Confirm Delivery & Update Scorecard Modal ───────────────────────── */}
      {deliveryModalGroup && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeliveryModalGroup(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto scroll-thin">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PackageCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                    Confirm Delivery &amp; Turnaround
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {deliveryModalGroup.group.distributorName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeliveryModalGroup(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 ml-2"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Scorecard quick stats */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Promised</div>
                  <div className="text-sm font-bold text-gray-800 mt-0.5">
                    {deliveryModalGroup.distributorDoc?.deliveryDays || 2}d
                  </div>
                </div>
                <div className="border-x border-gray-200">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">AI Lead Time</div>
                  <div className="text-sm font-extrabold text-primary-700 mt-0.5">
                    {deliveryModalGroup.distributorDoc?.effectiveLeadTime || 2}d
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">On-Time Rate</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">
                    {deliveryModalGroup.distributorDoc?.onTimeRate ?? 100}%
                  </div>
                </div>
              </div>

              {/* Turnaround picker */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  How many days did this delivery actually take to arrive?
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setTurnaroundDays((prev) => Math.max(0.5, Number((prev - 0.5).toFixed(1))))}
                    className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition"
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="30"
                    value={turnaroundDays}
                    onChange={(e) => setTurnaroundDays(Math.max(0.5, Number(e.target.value) || 0.5))}
                    className="input-field text-center font-extrabold text-base text-gray-900 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => setTurnaroundDays((prev) => Number((prev + 0.5).toFixed(1)))}
                    className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* 1-tap quick pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTurnaroundDays(d)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        Number(turnaroundDays) === d
                          ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {d} Day{d > 1 ? 's' : ''} {d === (deliveryModalGroup.distributorDoc?.deliveryDays || 2) ? '🎯' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic preview message */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2 ${
                  Number(turnaroundDays) > (deliveryModalGroup.distributorDoc?.deliveryDays || 2)
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <Activity size={16} className="shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  {Number(turnaroundDays) > (deliveryModalGroup.distributorDoc?.deliveryDays || 2) ? (
                    <span>
                      Logging <strong>{turnaroundDays} days</strong> (slower than promised {deliveryModalGroup.distributorDoc?.deliveryDays || 2}d) will update this supplier&apos;s AI rolling lead time and expand safety stock buffers so reorders trigger earlier.
                    </span>
                  ) : (
                    <span>
                      Logging <strong>{turnaroundDays} days</strong> (on time!) will improve this supplier&apos;s on-time scorecard and optimize reorder timing with lean safety stock.
                    </span>
                  )}
                </p>
              </div>

              {/* Delivery note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Delivery Note (optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon delivery, full carton condition"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>

              {/* Stock update checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200/80 cursor-pointer hover:bg-gray-100/60 transition">
                <input
                  type="checkbox"
                  checked={restockStockCheck}
                  onChange={(e) => setRestockStockCheck(e.target.checked)}
                  className="mt-0.5 rounded text-primary-600 focus:ring-primary-500 h-4 w-4 shrink-0"
                />
                <div>
                  <span className="font-bold text-gray-800 text-xs block">
                    Update Inventory Stock Count (+Units)
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    Automatically adds the suggested quantities (+{deliveryModalGroup.group.items.reduce((s, i) => s + (i.suggestedOrderQty || 0), 0)} units across {deliveryModalGroup.group.items.length} products) to current stock.
                  </span>
                </div>
              </label>

              {/* Modal actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeliveryModalGroup(null)}
                  className="btn-outline text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeliverySubmit}
                  disabled={confirmDelivery.isPending}
                  className="btn-primary text-xs py-2.5 px-4 font-bold shadow-md flex items-center gap-1.5"
                >
                  <PackageCheck size={16} />
                  <span>
                    {confirmDelivery.isPending ? 'Logging Delivery…' : 'Confirm Delivery & Update Scorecard'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice OCR Modal */}
      <InvoiceOcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
      />
    </div>
  );
}
