import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import {
  RefreshCw,
  Package,
  AlertTriangle,
  TrendingUp,
  Archive,
  Coins,
  X,
  ShieldAlert,
  ShoppingCart,
  MessageCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';

/* ── Urgency colour maps (module-level constants — stable references) ────── */
const urgencyColors = {
  critical: { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',       bar: '#ef4444', left: '#ef4444' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700',  bar: '#f97316', left: '#f97316' },
  medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700',  bar: '#eab308', left: '#eab308' },
  low:      { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',    bar: '#22c55e', left: '#22c55e' },
};

/* module-level so useMemo deps stay stable */
const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };

/* ── Skeleton loader — matches dashboard structure ───────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="skeleton h-10 w-44 rounded-xl" />
      </div>
      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="card flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-8 w-10" />
            </div>
          </div>
        ))}
      </div>
      {/* quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="card skeleton h-16" />)}
      </div>
      {/* chart + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card skeleton h-72" />
        <div className="card skeleton h-72" />
      </div>
    </div>
  );
}

/** Small stat card used in the top stats row */
function StatCard({ icon: Icon, label, value, color = 'text-gray-700', iconBg = 'bg-gray-100/80', to }) {
  const content = (
    <div className={`card card-interactive flex items-center gap-4 ${to ? 'cursor-pointer' : ''}`}>
      <div className={`p-3 rounded-2xl ${iconBg} shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 truncate leading-tight">
          {label}
        </p>
        <p className={`text-3xl font-black mt-0.5 nums leading-none ${color}`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );

  return to ? <Link to={to} className="block">{content}</Link> : content;
}

/** Reorder alert card for a single suggestion */
function ReorderAlertCard({ item, productMap }) {
  const c = urgencyColors[item.urgency] ?? urgencyColors.low;
  const pid = item.productId?._id || item.productId || item._id;
  const p = productMap[pid] || {};
  const reorderPt = item.reorderPoint ?? p.reorderPoint ?? 0;
  const name = item.productName || p.name || 'Kirana Item';
  const unit = item.unit || p.unit || 'units';

  return (
    <div
      className={`rounded-xl border border-l-4 p-3 ${c.bg} ${c.border} transition-all duration-150 hover:shadow-sm`}
      style={{ borderLeftColor: c.left }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-800 text-sm truncate" title={name}>
          {name}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${c.badge}`}>
          {item.urgency}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
        <p>
          Stock: <strong className="text-gray-800 nums">{item.currentStock}</strong> {unit}
          {' · '}Reorder at: <strong className="text-gray-800 nums">{reorderPt}</strong>
        </p>
        {item.suggestedOrderQty && (
          <span className="text-[11px] font-bold text-primary-700 bg-white/80 px-2 py-0.5 rounded-lg border border-primary-200 nums shrink-0 ml-2">
            Order +{item.suggestedOrderQty}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const [generatingForecast, setGeneratingForecast] = useState(false);
  const [showDeadStockModal, setShowDeadStockModal] = useState(false);

  /* ── Close modal on Escape key ─────────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowDeadStockModal(false);
    };
    if (showDeadStockModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeadStockModal]);

  /* ── Data fetching ──────────────────────────────────────────────────────── */
  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: async () => {
      const res = await apiClient.get('/reorder/suggestions');
      const payload = res.data?.data || res.data;
      return payload?.suggestion?.items || payload?.items || [];
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      const payload = res.data?.data || res.data;
      return payload?.products || (Array.isArray(payload) ? payload : []);
    },
  });

  const { data: deadStockData } = useQuery({
    queryKey: ['dead-stock'],
    queryFn: async () => {
      const res = await apiClient.get('/products/dead-stock');
      const payload = res.data?.data || res.data;
      return payload || { totalTrappedCapital: 0, count: 0, items: [] };
    },
  });

  /* ── Defensive fallbacks ────────────────────────────────────────────────── */
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  const safeProducts    = Array.isArray(products) ? products : [];
  const safeDeadStock   = deadStockData && typeof deadStockData === 'object'
    ? deadStockData
    : { totalTrappedCapital: 0, count: 0, items: [] };

  /* ── Product Lookup Map ─────────────────────────────────────────────────── */
  const productMap = useMemo(() => {
    const map = {};
    for (const p of safeProducts) {
      if (p?._id) map[p._id.toString()] = p;
    }
    return map;
  }, [safeProducts]);

  /* ── Derived stats ──────────────────────────────────────────────────────── */
  const totalProducts  = safeProducts.length;
  const topSellers     = safeProducts.filter((p) => Boolean(p?.isTopSeller)).length;
  const itemsToReorder = safeSuggestions.length;
  const criticalItems  = safeSuggestions.filter((s) => s?.urgency === 'critical').length;

  const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  const chartData = useMemo(() => {
    return [...safeSuggestions]
      .sort((a, b) => (urgencyWeight[b?.urgency] ?? 0) - (urgencyWeight[a?.urgency] ?? 0))
      .slice(0, 5)
      .map((s) => {
        const pid = s?.productId?._id || s?.productId || s?._id;
        const p = (pid && productMap[pid.toString()]) || {};
        const name = s?.productName || p.name || 'Item';
        const reorderPt = s?.reorderPoint ?? p.reorderPoint ?? 0;
        return {
          name: name.length > 11 ? name.slice(0, 11) + '…' : name,
          fullName: name,
          stock: s?.currentStock ?? p.currentStock ?? 0,
          reorderPoint: reorderPt,
          urgency: s?.urgency || 'low',
        };
      });
  }, [safeSuggestions, productMap]);

  /* ── Generate forecast ──────────────────────────────────────────────────── */
  const generateForecast = async () => {
    setGeneratingForecast(true);
    try {
      const res = await apiClient.post('/reorder/generate');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['reorder-suggestions'] }),
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['dead-stock'] }),
      ]);
      const msg = res.data?.message || 'Forecast generated successfully!';
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate forecast. Try again.');
    } finally {
      setGeneratingForecast(false);
    }
  };

  const isLoading = loadingSuggestions || loadingProducts;
  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 fade-up fade-up-d0">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">Real-time inventory intelligence for your store</p>
        </div>
        <button
          onClick={generateForecast}
          disabled={generatingForecast}
          className="btn-primary"
        >
          <RefreshCw size={16} className={generatingForecast ? 'animate-spin' : ''} />
          {generatingForecast ? 'Analyzing Trends…' : 'Generate New Forecast'}
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fade-up fade-up-d1">
          <StatCard icon={Package}       label="Total Products"    value={totalProducts}  iconBg="bg-blue-50"   color="text-blue-600"     to="/products" />
        </div>
        <div className="fade-up fade-up-d2">
          <StatCard icon={TrendingUp}    label="Top Sellers"       value={topSellers}     iconBg="bg-green-50"  color="text-primary-600"  to="/products" />
        </div>
        <div className="fade-up fade-up-d3">
          <StatCard icon={AlertTriangle} label="Items to Reorder"  value={itemsToReorder} iconBg="bg-orange-50" color="text-orange-500"   to="/reorder" />
        </div>
        <div className="fade-up fade-up-d4">
          <StatCard icon={Archive}       label="Critical Stockouts" value={criticalItems}  iconBg="bg-red-50"    color="text-red-500"      to="/reorder" />
        </div>
      </div>

      {/* ── Quick Store Operations Hub ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 fade-up fade-up-d3">

        <Link
          to="/sales/quick-tap"
          className="card card-interactive p-3.5 flex items-center justify-between group"
          style={{ borderColor: 'rgba(226,232,240,0.9)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-150">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Log Daily Sales</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">1-Tap Counter &amp; Voice Input</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-emerald-600 text-xs font-semibold flex items-center gap-1 transition-colors duration-150">
            Open <span className="arrow-slide"><ArrowRight size={13} /></span>
          </span>
        </Link>

        <Link
          to="/reorder"
          className="card card-interactive p-3.5 flex items-center justify-between group"
          style={{ borderColor: 'rgba(226,232,240,0.9)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all duration-150">
              <MessageCircle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">WhatsApp POs</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">1-Tap purchase orders to suppliers</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-green-600 text-xs font-semibold flex items-center gap-1 transition-colors duration-150">
            Send <span className="arrow-slide"><ArrowRight size={13} /></span>
          </span>
        </Link>

        <Link
          to="/distributors"
          className="card card-interactive p-3.5 flex items-center justify-between group"
          style={{ borderColor: 'rgba(226,232,240,0.9)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-150">
              <Truck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Suppliers Directory</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Delivery days &amp; minimum orders</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-colors duration-150">
            View <span className="arrow-slide"><ArrowRight size={13} /></span>
          </span>
        </Link>
      </div>

      {/* ── Trapped Working Capital Alert Banner ─────────────────────────────── */}
      {safeDeadStock?.totalTrappedCapital > 0 && (
        <div
          className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-up fade-up-d4"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a22 100%)',
            border: '1px solid #fcd34d',
            boxShadow: '0 2px 12px rgba(217,119,6,0.12)',
          }}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 rounded-2xl shrink-0" style={{ background: '#fde68a', color: '#92400e' }}>
              <Coins size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-900 text-xl nums">
                  ₹{(safeDeadStock.totalTrappedCapital || 0).toLocaleString('en-IN')} Trapped in Dead Stock
                </span>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: '#fcd34d', color: '#78350f' }}
                >
                  {safeDeadStock.count || 0} slow-movers
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed font-medium">
                Items sitting idle for 30+ days. Stop reordering to free up liquidity for high-turnover FMCG goods.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeadStockModal(true)}
            className="btn-outline text-xs whitespace-nowrap self-start sm:self-auto shrink-0"
            style={{ borderColor: '#d97706', color: '#92400e' }}
          >
            View Capital Breakdown →
          </button>
        </div>
      )}

      {/* ── Chart + Alert cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up fade-up-d5">

        {/* Bar chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">Top 5 Items by Urgency</h3>
              <span className="text-xs text-gray-400 font-medium">Stock vs Reorder Threshold</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#f97316' }}></span>
              Current Stock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#e2e8f0' }}></span>
              Reorder Point
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm font-semibold text-gray-500">All products have healthy stock!</p>
              <p className="text-xs text-gray-400 mt-1">Click "Generate New Forecast" to recalculate with latest sales.</p>
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      border: '1px solid #f1f5f9',
                      padding: '10px 14px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 6 }}
                    formatter={(val, name) => [val, name === 'stock' ? 'Current Stock' : 'Reorder Point']}
                  />
                  <Bar dataKey="stock" name="stock" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={urgencyColors[entry.urgency]?.bar ?? '#6b7280'} />
                    ))}
                  </Bar>
                  <Bar dataKey="reorderPoint" name="reorderPoint" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Reorder Alerts panel */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-base">
              Reorder Alerts
              <span className="ml-2 text-xs text-gray-400 font-normal nums">
                ({safeSuggestions.length} items)
              </span>
            </h3>
            <Link
              to="/reorder"
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 transition-colors"
            >
              Go to Reorders →
            </Link>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scroll-thin flex-1">
            {safeSuggestions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm font-semibold text-gray-600">All stock levels are healthy</p>
                <p className="text-xs text-gray-400 mt-1">No products currently at or below reorder threshold.</p>
              </div>
            ) : (
              safeSuggestions.map((item, idx) => {
                const pid = item.productId?._id || item.productId || item._id || idx;
                return <ReorderAlertCard key={pid} item={item} productMap={productMap} />;
              })
            )}
          </div>

          {safeSuggestions.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {criticalItems > 0 ? (
                  <span className="text-red-600 font-semibold nums">
                    {criticalItems} critical item{criticalItems !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="nums">{safeSuggestions.length} items need replenishment</span>
                )}
              </span>
              <Link
                to="/reorder"
                className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold px-3 py-1.5 rounded-lg border border-primary-200 transition-colors"
              >
                Review &amp; Send WhatsApp Order →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Dead Stock Breakdown Modal ───────────────────────────────────────── */}
      {showDeadStockModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeadStockModal(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin"
            style={{ borderRadius: '20px', boxShadow: '0 24px 64px rgba(0,0,0,0.20)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: '#fde68a', color: '#92400e' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Dead Working Capital Analysis</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ₹{(safeDeadStock?.totalTrappedCapital || 0).toLocaleString('en-IN')} locked in {safeDeadStock?.count || 0} slow-moving products
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeadStockModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <tr>
                      {['Product', 'Idle Stock', 'Trapped Cash', '30d Sales', 'Actionable AI Advice'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid #f1f5f9' }}>
                    {safeDeadStock?.items?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-400 text-sm">
                          No dead stock detected! All inventory items have healthy movement in the last 30 days.
                        </td>
                      </tr>
                    ) : (
                      safeDeadStock?.items?.map((item) => (
                        <tr
                          key={item._id}
                          className="transition-colors"
                          style={{ borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          <td className="px-3 py-3 font-semibold text-gray-800 text-xs">
                            {item.name}
                            {item.brand && <span className="block text-[11px] text-gray-400 font-normal">{item.brand}</span>}
                          </td>
                          <td className="px-3 py-3 text-gray-600 font-medium text-xs nums">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="px-3 py-3 font-bold text-red-600 text-xs nums">
                            ₹{item.trappedCash.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 text-gray-500 font-medium text-xs nums">
                            {item.soldIn30d} units
                          </td>
                          <td className="px-3 py-3 text-amber-800 font-medium text-xs">
                            {item.recommendation}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl text-xs text-gray-600 border border-gray-100" style={{ background: '#f8fafc' }}>
                💡 <strong>Kirana Insight:</strong> Instead of accepting distributor bulk schemes on slow items, redirect this ₹{(safeDeadStock?.totalTrappedCapital || 0).toLocaleString('en-IN')} to order high-demand items (e.g. Fortune Oil, Parle-G, Milk) that sell out every 2–3 days.
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 flex justify-end" style={{ borderTop: '1px solid #f1f5f9', background: '#fafbfc', borderRadius: '0 0 20px 20px' }}>
              <button onClick={() => setShowDeadStockModal(false)} className="btn-primary text-xs py-2 px-4">
                Close &amp; Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
