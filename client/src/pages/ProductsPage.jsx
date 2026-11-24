import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  Minus,
  X,
  Star,
  Search,
  Camera,
  PackagePlus,
  Pencil,
  Trash2,
  AlertTriangle,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import apiClient from '../api/client';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import InvoiceOcrModal from '../components/restock/InvoiceOcrModal';
import QuickRestockModal from '../components/restock/QuickRestockModal';

const CATEGORIES = [
  'Edible Oil',
  'Biscuits',
  'Dairy',
  'Snacks',
  'Beverages',
  'Flour & Grains',
  'Pulses',
  'Personal Care',
  'Household',
  'Tea & Coffee',
  'Other',
];

const emptyForm = {
  name: '',
  category: 'Edible Oil',
  brand: '',
  unit: 'piece',
  packSize: 1,
  currentStock: 0,
  reorderPoint: 5,
  costPrice: '',
  sellingPrice: '',
  isTopSeller: false,
  distributorId: '',
};

/** Simple modal backdrop wrapper */
function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-gray-800 text-base sm:text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="px-4 sm:px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [editModalProduct, setEditModalProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  // Automatically open modal if redirected from Dashboard quick-action (?action=add)
  useEffect(() => {
    if (searchParams.get('action') === 'add' || searchParams.get('new') === '1') {
      setShowModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [topSellersOnly, setTopSellersOnly] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('compact'); // 'compact' or 'cards'

  /* ── Fetch products & distributors ─────────────────────────────────────── */
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      const payload = res.data?.data || res.data;
      return payload?.products || (Array.isArray(payload) ? payload : []);
    },
  });

  const { data: distributors = [] } = useQuery({
    queryKey: ['distributors'],
    queryFn: async () => {
      const res = await apiClient.get('/distributors');
      const payload = res.data?.data || res.data;
      return payload?.distributors || (Array.isArray(payload) ? payload : []);
    },
  });

  const safeProducts = Array.isArray(products) ? products : [];
  const safeDistributors = Array.isArray(distributors) ? distributors : [];

  /* ── Add product mutation ───────────────────────────────────────────────── */
  const addProduct = useMutation({
    mutationFn: (payload) => apiClient.post('/products', payload),
    onSuccess: () => {
      toast.success('Product added successfully!');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      qc.invalidateQueries({ queryKey: ['dead-stock'] });
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add product. Please check details.'),
  });

  /* ── Update product mutation ────────────────────────────────────────────── */
  const updateProduct = useMutation({
    mutationFn: ({ id, payload }) => apiClient.put(`/products/${id}`, payload),
    onSuccess: () => {
      toast.success('Product updated successfully!');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      qc.invalidateQueries({ queryKey: ['dead-stock'] });
      setEditModalProduct(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product.'),
  });

  /* ── Delete product mutation ────────────────────────────────────────────── */
  const deleteProduct = useMutation({
    mutationFn: (id) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted successfully!');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      qc.invalidateQueries({ queryKey: ['dead-stock'] });
      setDeleteConfirmProduct(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete product.'),
  });

  /* ── Quick In-line Stock Adjust (1-Tap for Shopkeepers) ─────────────────── */
  const quickStockAdjust = useMutation({
    mutationFn: ({ id, delta, currentStock }) => {
      const newStock = Math.max(0, currentStock + delta);
      return apiClient.put(`/products/${id}`, { currentStock: newStock });
    },
    onSuccess: (res, vars) => {
      const finalStock = Math.max(0, vars.currentStock + vars.delta);
      toast.success(`Stock updated: ${finalStock} units`, { duration: 1200 });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update stock.'),
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const openEditModal = (p) => {
    setEditForm({
      name: p.name || '',
      category: p.category || 'Other',
      brand: p.brand || '',
      unit: p.unit || 'piece',
      packSize: p.packSize ?? 1,
      currentStock: p.currentStock ?? 0,
      reorderPoint: p.reorderPoint ?? 5,
      costPrice: p.costPrice !== undefined && p.costPrice !== null ? p.costPrice : '',
      sellingPrice: p.sellingPrice !== undefined && p.sellingPrice !== null ? p.sellingPrice : '',
      distributorId: p.distributorId?._id || p.distributorId || '',
      isTopSeller: Boolean(p.isTopSeller),
    });
    setEditModalProduct(p);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName) {
      toast.error('Product name is required');
      return;
    }

    if (!form.distributorId || form.distributorId.trim() === '') {
      toast.error('Distributor is required. Please select a distributor/supplier.');
      return;
    }

    // Prevent duplicate product names UNDER THE SAME DISTRIBUTOR
    const formDistId = form.distributorId.trim().toString();
    const isDuplicate = safeProducts.some((p) => {
      const pDistId = (p.distributorId?._id || p.distributorId || '').toString();
      return (
        pDistId === formDistId &&
        p.name?.trim().toLowerCase() === cleanName.toLowerCase()
      );
    });
    if (isDuplicate) {
      toast.error(`"${cleanName}" already exists under this distributor!`);
      return;
    }

    const payload = {
      name: cleanName,
      category: form.category || 'Other',
      brand: form.brand?.trim() || '',
      unit: form.unit || 'piece',
      packSize: Math.max(1, Number(form.packSize) || 1),
      currentStock: Math.max(0, Number(form.currentStock) || 0),
      reorderPoint: Math.max(0, Number(form.reorderPoint) || 0),
      distributorId: form.distributorId.trim(),
      isTopSeller: Boolean(form.isTopSeller),
    };

    if (form.costPrice !== '' && !isNaN(Number(form.costPrice))) {
      payload.costPrice = Math.max(0, Number(form.costPrice));
    }
    if (form.sellingPrice !== '' && !isNaN(Number(form.sellingPrice))) {
      payload.sellingPrice = Math.max(0, Number(form.sellingPrice));
    }

    addProduct.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const cleanName = editForm.name.trim();
    if (!cleanName) {
      toast.error('Product name is required');
      return;
    }

    if (!editForm.distributorId || editForm.distributorId.trim() === '') {
      toast.error('Distributor is required. Please select a distributor/supplier.');
      return;
    }

    // Prevent duplicate product names UNDER THE SAME DISTRIBUTOR when renaming
    const editDistId = editForm.distributorId.trim().toString();
    const isDuplicate = safeProducts.some((p) => {
      const pDistId = (p.distributorId?._id || p.distributorId || '').toString();
      return (
        p._id !== editModalProduct._id &&
        pDistId === editDistId &&
        p.name?.trim().toLowerCase() === cleanName.toLowerCase()
      );
    });
    if (isDuplicate) {
      toast.error(`"${cleanName}" already exists under this distributor!`);
      return;
    }

    const payload = {
      name: cleanName,
      category: editForm.category || 'Other',
      brand: editForm.brand?.trim() || '',
      unit: editForm.unit || 'piece',
      packSize: Math.max(1, Number(editForm.packSize) || 1),
      currentStock: Math.max(0, Number(editForm.currentStock) || 0),
      reorderPoint: Math.max(0, Number(editForm.reorderPoint) || 0),
      distributorId: editForm.distributorId.trim(),
      isTopSeller: Boolean(editForm.isTopSeller),
    };

    if (editForm.costPrice !== '' && !isNaN(Number(editForm.costPrice))) {
      payload.costPrice = Math.max(0, Number(editForm.costPrice));
    }
    if (editForm.sellingPrice !== '' && !isNaN(Number(editForm.sellingPrice))) {
      payload.sellingPrice = Math.max(0, Number(editForm.sellingPrice));
    }

    updateProduct.mutate({ id: editModalProduct._id, payload });
  };

  // Calculate counts for 1-tap quick filters
  const lowStockCount = safeProducts.filter((p) => p.currentStock <= p.reorderPoint).length;
  const topSellersCount = safeProducts.filter((p) => p.isTopSeller).length;

  // Filtered products list
  const filteredProducts = safeProducts.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term);

    const matchesCategory =
      selectedCategory === 'ALL' || p.category === selectedCategory;

    const matchesTopSeller = !topSellersOnly || p.isTopSeller;
    const matchesLowStock = !lowStockOnly || p.currentStock <= p.reorderPoint;

    return matchesSearch && matchesCategory && matchesTopSeller && matchesLowStock;
  });

  // Extract available distinct categories from current catalog
  const availableCategories = Array.from(
    new Set([...CATEGORIES, ...safeProducts.map((p) => p.category).filter(Boolean)])
  );

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4 md:space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Products</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-normal">
            {filteredProducts.length} of {safeProducts.length} products listed
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOcrModal(true)}
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3 font-semibold bg-white rounded-xl"
            title="Scan wholesale supplier bill or delivery challan via OCR"
          >
            <Camera size={15} className="text-primary-600" />
            <span className="hidden sm:inline">Scan Invoice</span>
            <span className="sm:hidden">Scan</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5 font-semibold rounded-xl"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar & 1-Tap Shopkeeper Quick Action Filters ───────────────── */}
      <div className="card p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 100+ products, brands..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/70"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-2.5 py-2 bg-gray-50/70 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-700 max-w-[120px] truncate shrink-0 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Mobile Speed View Switcher (Compact Speed List vs Detailed Cards) */}
          <div className="flex md:hidden items-center bg-gray-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'compact' ? 'bg-white text-primary-600 shadow-2xs font-bold' : 'text-gray-400'
              }`}
              title="Compact Speed List (Manage 100+ items fast)"
            >
              <LayoutList size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards' ? 'bg-white text-primary-600 shadow-2xs font-bold' : 'text-gray-400'
              }`}
              title="Detailed Cards"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* 1-Tap Quick Action Filter Chips (Clean scroll with no ugly scrollbar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setLowStockOnly(false);
              setTopSellersOnly(false);
              setSelectedCategory('ALL');
            }}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold shrink-0 border transition-all ${
              !lowStockOnly && !topSellersOnly && selectedCategory === 'ALL'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All ({safeProducts.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              if (!lowStockOnly) setTopSellersOnly(false);
            }}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold shrink-0 border flex items-center gap-1 transition-all ${
              lowStockOnly
                ? 'bg-red-500 text-white border-red-500 shadow-xs'
                : lowStockCount > 0
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            <AlertTriangle size={12} className={lowStockOnly ? 'text-white' : 'text-red-500'} />
            <span>Low Stock ({lowStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTopSellersOnly(!topSellersOnly);
              if (!topSellersOnly) setLowStockOnly(false);
            }}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold shrink-0 border flex items-center gap-1 transition-all ${
              topSellersOnly
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Star size={12} className={topSellersOnly ? 'fill-white text-white' : 'text-amber-500'} />
            <span>Top Sellers ({topSellersCount})</span>
          </button>

          <div className="h-4 w-px bg-gray-200 shrink-0 mx-0.5" />

          {availableCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === c ? 'ALL' : c)}
              className={`text-xs px-2.5 py-1 rounded-xl font-semibold shrink-0 border transition-all ${
                selectedCategory === c
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product List (Mobile Views + Desktop Table) ────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-600 text-sm">No products match your search.</p>
          <p className="text-xs text-gray-400 mt-1">Try clearing your filters or search terms.</p>
          {(search || selectedCategory !== 'ALL' || topSellersOnly || lowStockOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setTopSellersOnly(false);
                setLowStockOnly(false);
              }}
              className="btn-outline text-xs mt-4 py-1.5 px-3"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Mobile View: Compact Speed Mode (Responsive, never cut off) ───── */}
          {viewMode === 'compact' ? (
            <div className="md:hidden space-y-2.5">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.reorderPoint;
                return (
                  <div
                    key={p._id}
                    className="p-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-2.5 transition-all"
                  >
                    {/* Top Row: Name, Category, Price & Stock Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openEditModal(p)}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm leading-tight">
                            {p.name}
                          </span>
                          {p.isTopSeller && (
                            <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.2 rounded font-extrabold flex items-center gap-0.5 shrink-0">
                              <Star size={9} fill="currentColor" /> Top
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1 flex-wrap">
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[10px] font-medium">
                            {p.category}
                          </span>
                          {p.brand && <span className="text-gray-400 text-[10px]">• {p.brand}</span>}
                          <span className="text-gray-400 text-[10px]">• Min: {p.reorderPoint}</span>
                        </div>
                      </div>

                      {/* Price & Stock Badge on Right */}
                      <div className="text-right shrink-0">
                        {p.sellingPrice ? (
                          <div className="font-black text-gray-900 text-sm">₹{p.sellingPrice}</div>
                        ) : null}
                        <div className={`text-[10px] font-bold mt-0.5 ${isLow ? 'text-red-500' : 'text-emerald-600'}`}>
                          {isLow ? '⚠️ LOW' : 'In Stock'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Tactile Stepper on Left, Action Buttons on Right */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      {/* Left: Quick In-line Stock Stepper */}
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200/70 shrink-0">
                        <button
                          type="button"
                          onClick={() => quickStockAdjust.mutate({ id: p._id, delta: -1, currentStock: p.currentStock })}
                          disabled={p.currentStock <= 0 || quickStockAdjust.isPending}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 active:scale-95 disabled:opacity-30 shadow-2xs transition"
                          title="Decrease stock (-1)"
                        >
                          <Minus size={12} />
                        </button>

                        <div className="px-2 text-center min-w-[40px]">
                          <div className={`text-xs font-black leading-none ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                            {p.currentStock}
                          </div>
                          <div className="text-[9px] text-gray-400 leading-none mt-0.5 truncate">{p.unit || 'units'}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => quickStockAdjust.mutate({ id: p._id, delta: 1, currentStock: p.currentStock })}
                          disabled={quickStockAdjust.isPending}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 active:scale-95 shadow-2xs font-bold transition"
                          title="Increase stock (+1)"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Right: Quick Restock & Edit Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setRestockProduct(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 font-bold text-xs flex items-center gap-1 transition shadow-2xs"
                          title="Restock delivery"
                        >
                          <PackagePlus size={14} />
                          <span>Restock</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-gray-100 border border-gray-200 transition"
                          title="Edit product"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition"
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Mobile View: Detailed Cards Mode ──────────────────────────── */
            <div className="md:hidden space-y-3">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.reorderPoint;
                return (
                  <div key={p._id} className="card p-3.5 space-y-3">
                    {/* Top row: Name & Top Seller badge & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-sm leading-snug">{p.name}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {p.brand && <span className="text-xs text-gray-400 font-medium">{p.brand}</span>}
                          {p.brand && <span className="text-gray-300 text-xs">•</span>}
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            {p.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {p.sellingPrice ? (
                          <div className="font-bold text-gray-900 text-sm">₹{p.sellingPrice}</div>
                        ) : null}
                        {p.isTopSeller && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold mt-1">
                            <Star size={10} fill="currentColor" /> Top
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock & Reorder info with In-line Stepper */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/80 p-2.5 rounded-xl text-xs border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Current Stock</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-black text-sm block ${isLow ? 'text-red-500' : 'text-gray-900'}`}>
                            {p.currentStock} {p.unit || 'units'}
                          </span>
                          {/* In-line Quick Stock Adjust buttons */}
                          <div className="inline-flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
                            <button
                              type="button"
                              onClick={() => quickStockAdjust.mutate({ id: p._id, delta: -1, currentStock: p.currentStock })}
                              disabled={p.currentStock <= 0 || quickStockAdjust.isPending}
                              className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                              title="-1"
                            >
                              <Minus size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => quickStockAdjust.mutate({ id: p._id, delta: 1, currentStock: p.currentStock })}
                              disabled={quickStockAdjust.isPending}
                              className="w-5 h-5 flex items-center justify-center rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold"
                              title="+1"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Reorder Point</span>
                        <span className="font-bold text-sm text-gray-700 mt-1 block">
                          {p.reorderPoint} {p.unit || 'units'}
                        </span>
                      </div>
                    </div>

                    {/* Distributor & Action bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2 flex-wrap">
                      <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                        {p.distributorId?.name ? `📦 ${p.distributorId.name}` : '—'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setRestockProduct(p)}
                          className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                          title="Quick restock"
                        >
                          <PackagePlus size={13} />
                          + Restock
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-gray-200 transition-colors"
                          aria-label="Edit product"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors"
                          aria-label="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Desktop Table (visible on desktop md+ only) ─────────────────── */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-xs">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Category', 'Stock', 'Reorder At', 'Distributor', 'Top Seller', 'Restock', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {p.name}
                      {p.brand && <span className="ml-1 text-xs text-gray-400">({p.brand})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.currentStock <= p.reorderPoint ? 'text-red-500' : 'text-gray-700'}`}>
                        {p.currentStock} {p.unit || ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.reorderPoint}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.distributorId?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.isTopSeller && (
                        <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          <Star size={11} fill="currentColor" /> Top
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRestockProduct(p)}
                        className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                        title="Quick restock delivered units"
                      >
                        <PackagePlus size={13} />
                        + Restock
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-gray-200"
                          title="Edit product details"
                          aria-label="Edit product"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                          title="Delete product"
                          aria-label="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Add Product Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <Modal title="Add New Product" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Product Name *</label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Tata Salt 1kg"
                />
              </div>
              <div>
                <label className="label-sm">Brand</label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Tata"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="input-field">
                  {availableCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-sm">Unit</label>
                <select name="unit" value={form.unit} onChange={handleChange} className="input-field">
                  {['piece', 'bottle', 'pack', 'pouch', 'bag', 'bar', 'cup', 'kg', 'litre', 'dozen'].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-sm">Current Stock</label>
                <input
                  name="currentStock"
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-sm">Reorder Point</label>
                <input
                  name="reorderPoint"
                  type="number"
                  min="0"
                  value={form.reorderPoint}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-sm">Wholesale Pack Size</label>
                <input
                  name="packSize"
                  type="number"
                  min="1"
                  value={form.packSize}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Cost Price (₹)</label>
                <input
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label-sm">Selling Price (₹)</label>
                <input
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label-sm">Distributor / Supplier *</label>
                {safeDistributors.length === 0 && (
                  <span className="text-xs text-red-500 font-medium">⚠️ No suppliers found. Add one in Suppliers.</span>
                )}
              </div>
              <select
                name="distributorId"
                required
                value={form.distributorId}
                onChange={handleChange}
                className="input-field"
              >
                <option value="" disabled>— Select Distributor / Supplier * —</option>
                {safeDistributors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isTopSeller"
                checked={form.isTopSeller}
                onChange={handleChange}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm font-medium text-gray-700">Mark as Top Seller (featured in Daily Sales)</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={addProduct.isPending} className="btn-primary flex-1">
                {addProduct.isPending ? 'Saving…' : 'Add Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Product Modal ────────────────────────────────────────────── */}
      {editModalProduct && (
        <Modal title={`Edit Product: ${editModalProduct.name}`} onClose={() => setEditModalProduct(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Product Name *</label>
                <input
                  name="name"
                  required
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="e.g. Tata Salt 1kg"
                />
              </div>
              <div>
                <label className="label-sm">Brand</label>
                <input
                  name="brand"
                  value={editForm.brand}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="e.g. Tata"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Category</label>
                <select name="category" value={editForm.category} onChange={handleEditChange} className="input-field">
                  {availableCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-sm">Unit</label>
                <input
                  name="unit"
                  value={editForm.unit}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="e.g. piece, kg, litre"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-sm">Pack Size</label>
                <input
                  name="packSize"
                  type="number"
                  min="1"
                  value={editForm.packSize}
                  onChange={handleEditChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-sm">Current Stock</label>
                <input
                  name="currentStock"
                  type="number"
                  min="0"
                  value={editForm.currentStock}
                  onChange={handleEditChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-sm">Reorder At</label>
                <input
                  name="reorderPoint"
                  type="number"
                  min="0"
                  value={editForm.reorderPoint}
                  onChange={handleEditChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm">Cost Price (₹)</label>
                <input
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.costPrice}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label-sm">Selling Price (₹)</label>
                <input
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.sellingPrice}
                  onChange={handleEditChange}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label-sm">Distributor / Supplier *</label>
                {safeDistributors.length === 0 && (
                  <span className="text-xs text-red-500 font-medium">⚠️ No suppliers found</span>
                )}
              </div>
              <select
                name="distributorId"
                required
                value={editForm.distributorId}
                onChange={handleEditChange}
                className="input-field"
              >
                <option value="" disabled>— Select Distributor / Supplier * —</option>
                {safeDistributors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isTopSeller"
                checked={editForm.isTopSeller}
                onChange={handleEditChange}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm font-medium text-gray-700">Mark as Top Seller (featured in Daily Sales)</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditModalProduct(null)} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={updateProduct.isPending} className="btn-primary flex-1">
                {updateProduct.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Product Confirmation Modal ───────────────────────────────── */}
      {deleteConfirmProduct && (
        <Modal title="Delete Product" onClose={() => setDeleteConfirmProduct(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100 text-red-800">
              <Trash2 size={22} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Confirm Product Deletion</p>
                <p className="mt-1 text-xs text-red-700 leading-relaxed">
                  Are you sure you want to delete <strong className="font-bold underline text-red-900">{deleteConfirmProduct.name}</strong>?
                  This product will be removed from your catalog and daily operations.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteProduct.mutate(deleteConfirmProduct._id)}
                disabled={deleteProduct.isPending}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteProduct.isPending ? 'Deleting…' : 'Delete Product'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Wholesale Invoice Scanner (OCR) Modal ───────────────────────────── */}
      <InvoiceOcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
      />

      {/* ── Quick Restock Modal ─────────────────────────────────────────────── */}
      <QuickRestockModal
        product={restockProduct}
        onClose={() => setRestockProduct(null)}
      />

      <style>{`
        .label-sm { display:block; font-size:.75rem; font-weight:500; color:#374151; margin-bottom:.25rem; }
        .input-field { width:100%; border:1px solid #d1d5db; border-radius:.5rem; padding:.5rem .75rem; font-size:.875rem; outline:none; }
        .input-field:focus { outline:none; border-color:#16a34a; box-shadow:0 0 0 2px #bbf7d0; }
      `}</style>
    </div>
  );
}
