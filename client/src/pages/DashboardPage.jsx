import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import LoadingSpinner from '../components/shared/LoadingSpinner';
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

/* ── Urgency colour maps ───────────────────────────────────────────────────── */
const urgencyColors = {
  critical: { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    bar: '#ef4444' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', bar: '#f97316' },
  medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', bar: '#eab308' },
  low:      { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  bar: '#22c55e' },
};

/** Small stat card used in the top stats row */
function StatCard({ icon: Icon, label, value, color = 'text-gray-700', to }) {
  const content = (
    <div className={`card flex items-center gap-3 transition-all ${to ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}`}>
      <div className="p-2.5 rounded-xl bg-gray-100/80 shrink-0">
        <Icon size={20} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className={`text-xl font-extrabold ${color}`}>{value ?? '—'}</p>
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
    <div className={`rounded-xl border p-3 ${c.bg} ${c.border} transition-all hover:shadow-2xs`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-800 text-sm truncate" title={name}>
          {name}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${c.badge}`}>
          {item.urgency}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs text-gray-600">
        <p>
          Stock: <strong className="text-gray-900">{item.currentStock}</strong> {unit} · Reorder at: <strong className="text-gray-900">{reorderPt}</strong>
        </p>
        {item.suggestedOrderQty && (
          <span className="text-[11px] font-semibold text-primary-700 bg-white/70 px-1.5 py-0.5 rounded-md border border-primary-200">
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

  /* ── Defensive fallbacks ensuring arrays & objects are never null/undefined ── */
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeDeadStock = deadStockData && typeof deadStockData === 'object' ? deadStockData : { totalTrappedCapital: 0, count: 0, items: [] };

  /* ── Product Lookup Map for fast & accurate fallback values ────────────── */
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

  // Top 5 suggestions for the bar chart (sorted by urgency weight)
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

  /* ── Generate forecast mutation ─────────────────────────────────────────── */
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
  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500">Real-time inventory intelligence for your store</p>
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

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package}       label="Total Products"    value={totalProducts}  to="/products" />
        <StatCard icon={TrendingUp}    label="Top Sellers"       value={topSellers}     color="text-primary-600" to="/products" />
        <StatCard icon={AlertTriangle} label="Items to Reorder"  value={itemsToReorder} color="text-orange-500" to="/reorder" />
        <StatCard icon={Archive}       label="Critical Stockouts" value={criticalItems}  color="text-red-500" to="/reorder" />
      </div>

      {/* ── Quick Store Operations Hub ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          to="/sales/quick-tap"
          className="card hover:border-emerald-300 hover:shadow-xs transition-all p-3.5 flex items-center justify-between group bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Log Daily Sales</h4>
              <p className="text-[11px] text-gray-500">1-Tap Counter & Voice Input</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-emerald-600 text-xs font-semibold flex items-center gap-1">
            Open <ArrowRight size={13} />
          </span>
        </Link>

        <Link
          to="/reorder"
          className="card hover:border-green-300 hover:shadow-xs transition-all p-3.5 flex items-center justify-between group bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <MessageCircle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">WhatsApp POs</h4>
              <p className="text-[11px] text-gray-500">1-Tap purchase orders to suppliers</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-green-600 text-xs font-semibold flex items-center gap-1">
            Send <ArrowRight size={13} />
          </span>
        </Link>

        <Link
          to="/distributors"
          className="card hover:border-blue-300 hover:shadow-xs transition-all p-3.5 flex items-center justify-between group bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Truck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Suppliers Directory</h4>
              <p className="text-[11px] text-gray-500">Delivery days & minimum orders</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-blue-600 text-xs font-semibold flex items-center gap-1">
            View <ArrowRight size={13} />
          </span>
        </Link>
      </div>

      {/* ── Trapped Working Capital Alert Banner ────────────────────────────── */}
      {safeDeadStock?.totalTrappedCapital > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <Coins size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-900 text-base">
                  ₹{(safeDeadStock.totalTrappedCapital || 0).toLocaleString('en-IN')} Trapped in Dead Stock
                </span>
                <span className="bg-amber-200 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {safeDeadStock.count || 0} slow-movers
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Items sitting idle for 30+ days. Stop reordering to free up liquidity for high-turnover FMCG goods.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeadStockModal(true)}
            className="btn-outline border-amber-600 text-amber-900 hover:bg-amber-100 text-xs py-2 px-3.5 whitespace-nowrap self-start sm:self-auto shrink-0 font-semibold"
          >
            View Capital Breakdown →
          </button>
        </div>
      )}

      {/* ── Chart + Alert cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — current stock vs reorder point for top 5 urgent items */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800">Top 5 Items by Urgency</h3>
            <span className="text-xs text-gray-400">Stock vs Reorder Threshold</span>
          </div>

          {/* Mini Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-500 inline-block"></span> Current Stock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-gray-300 inline-block"></span> Reorder Point
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-1">📦</p>
              <p className="text-sm font-medium text-gray-500">All products have healthy stock!</p>
              <p className="text-xs text-gray-400 mt-0.5">Click "Generate New Forecast" to recalculate with latest sales.</p>
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val, name) => [val, name === 'stock' ? 'Current Stock' : 'Reorder Point']}
                  />
                  <Bar dataKey="stock" name="stock" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={urgencyColors[entry.urgency]?.bar ?? '#6b7280'} />
                    ))}
                  </Bar>
                  <Bar dataKey="reorderPoint" name="reorderPoint" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Reorder alert cards */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">
                Reorder Alerts
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  ({safeSuggestions.length} items)
                </span>
              </h3>
              <Link
                to="/reorder"
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
              >
                Go to Reorders →
              </Link>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {safeSuggestions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="text-sm font-medium text-gray-600">All stock levels are healthy</p>
                  <p className="text-xs text-gray-400 mt-1">No products currently at or below reorder threshold.</p>
                </div>
              ) : (
                safeSuggestions.map((item, idx) => {
                  const pid = item.productId?._id || item.productId || item._id || idx;
                  return (
                    <ReorderAlertCard key={pid} item={item} productMap={productMap} />
                  );
                })
              )}
            </div>
          </div>

          {safeSuggestions.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {criticalItems > 0 ? (
                  <span className="text-red-600 font-semibold">{criticalItems} critical item{criticalItems !== 1 ? 's' : ''}</span>
                ) : (
                  `${safeSuggestions.length} items need replenishment`
                )}
              </span>
              <Link
                to="/reorder"
                className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold px-3 py-1.5 rounded-lg border border-primary-200 transition-colors"
              >
                Review & Send WhatsApp Order →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Dead Stock Breakdown Modal ─────────────────────────────────────── */}
      {showDeadStockModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeadStockModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Dead Working Capital Analysis</h3>
                  <p className="text-xs text-gray-500">₹{(safeDeadStock?.totalTrappedCapital || 0).toLocaleString('en-IN')} locked in {safeDeadStock?.count || 0} slow-moving products</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeadStockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Product</th>
                      <th className="px-3 py-2.5 text-left">Idle Stock</th>
                      <th className="px-3 py-2.5 text-left">Trapped Cash</th>
                      <th className="px-3 py-2.5 text-left">30d Sales</th>
                      <th className="px-3 py-2.5 text-left">Actionable AI Advice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {safeDeadStock?.items?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-400">
                          No dead stock detected! All inventory items have healthy movement in the last 30 days.
                        </td>
                      </tr>
                    ) : (
                      safeDeadStock?.items?.map((item) => (
                        <tr key={item._id} className="hover:bg-amber-50/40">
                          <td className="px-3 py-3 font-semibold text-gray-800">
                            {item.name}
                            {item.brand && <span className="block text-[11px] text-gray-400 font-normal">{item.brand}</span>}
                          </td>
                          <td className="px-3 py-3 text-gray-600 font-medium">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="px-3 py-3 font-bold text-red-600">
                            ₹{item.trappedCash.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 text-gray-500 font-medium">
                            {item.soldIn30d} units
                          </td>
                          <td className="px-3 py-3 text-amber-800 font-medium">
                            {item.recommendation}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-600 border border-gray-100">
                💡 <strong>Kirana Insight:</strong> Instead of accepting distributor bulk schemes on slow items, redirect this ₹{(safeDeadStock?.totalTrappedCapital || 0).toLocaleString('en-IN')} to order high-demand items (e.g. Fortune Oil, Parle-G, Milk) that sell out every 2–3 days.
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setShowDeadStockModal(false)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
