import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Sparkles,
  Camera,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import apiClient from '../../api/client';

export default function InvoiceOcrModal({ isOpen, onClose }) {
  const qc = useQueryClient();

  const [invoiceFile, setInvoiceFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [editedItems, setEditedItems] = useState([]);

  /* ── Scan invoice mutation ──────────────────────────────────────────────── */
  const scanMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.preset) {
        const res = await apiClient.post('/products/restock/ocr', { preset: payload.preset });
        return res.data?.data || res.data;
      }

      const formData = new FormData();
      formData.append('invoice', payload.file);
      const res = await apiClient.post('/products/restock/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      setScannedData(data);
      setEditedItems(data.items || []);
      toast.success(`OCR Scan Complete: Detected ${data.items?.length || 0} product(s)!`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to scan invoice OCR.');
    },
  });

  /* ── Confirm restock mutation ───────────────────────────────────────────── */
  const confirmMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/products/restock/confirm', payload),
    onSuccess: (res) => {
      const msg = res.data?.message || 'Successfully updated inventory stock!';
      toast.success(msg, { duration: 4000 });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      handleClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to confirm restock.');
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvoiceFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    scanMutation.mutate({ file });
  };

  const handlePresetSelect = (presetKey) => {
    setInvoiceFile(null);
    setFilePreviewUrl(null);
    scanMutation.mutate({ preset: presetKey });
  };

  const updateItemQty = (index, delta) => {
    setEditedItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      const newQty = Math.max(1, (target.quantityReceived || 0) + delta);
      target.quantityReceived = newQty;
      target.newStock = target.currentStock + newQty;
      target.subtotal = newQty * (target.unitCost || 0);
      copy[index] = target;
      return copy;
    });
  };

  const handleConfirm = () => {
    if (!editedItems.length) {
      toast.error('No items to restock.');
      return;
    }
    confirmMutation.mutate({
      supplierName: scannedData?.supplierName,
      invoiceNumber: scannedData?.invoiceNumber,
      items: editedItems,
    });
  };

  const handleClose = () => {
    setInvoiceFile(null);
    setFilePreviewUrl(null);
    setScannedData(null);
    setEditedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  const totalUnits = editedItems.reduce((sum, item) => sum + (item.quantityReceived || 0), 0);
  const totalAmount = editedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg leading-tight">
                Wholesale Invoice Scanner (OCR)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Scan supplier bills & delivery challans to automatically increment inventory stock
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Upload Zone & Quick Sample Presets */}
        {!scannedData && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-primary-200 rounded-2xl p-6 text-center bg-primary-50/20 hover:bg-primary-50/40 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                id="invoice-photo-input"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="invoice-photo-input" className="cursor-pointer block space-y-2">
                <Upload size={32} className="mx-auto text-primary-600" />
                <span className="text-sm font-bold text-gray-800 block">
                  {scanMutation.isPending ? 'Reading Invoice with OCR…' : 'Take Photo or Upload Wholesale Bill'}
                </span>
                <span className="text-xs text-gray-400 block">
                  Supports GST invoices, handwritten bills, and photos of paper challans
                </span>
              </label>
            </div>

            {/* Demo 1-Click Presets */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Sparkles size={14} className="text-amber-500" />
                <span>Instant Demo Bills (1-Click Test):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect('sharma')}
                  disabled={scanMutation.isPending}
                  className="btn-outline text-xs py-1.5 px-3 bg-white hover:bg-gray-100 shadow-2xs font-medium"
                >
                  📦 Sharma Bros Bill (Oil, Parle-G, Maggi, Colgate)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('dairy')}
                  disabled={scanMutation.isPending}
                  className="btn-outline text-xs py-1.5 px-3 bg-white hover:bg-gray-100 shadow-2xs font-medium"
                >
                  🥛 Mumbai Dairy Bill (Milk, Butter, Curd, Frooti)
                </button>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 flex-wrap gap-1">
                <span className="text-[11px] text-gray-500 font-medium">Demo PNG invoices to show/upload:</span>
                <div className="flex gap-2.5 items-center">
                  <a
                    href="/demo-invoices/invoice_sharma_traders.png"
                    download="invoice_sharma_traders.png"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded hover:bg-primary-100 transition flex items-center gap-1 font-semibold"
                  >
                    📄 Sharma Bros Bill.png
                  </a>
                  <a
                    href="/demo-invoices/invoice_mumbai_dairy.png"
                    download="invoice_mumbai_dairy.png"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100 transition flex items-center gap-1 font-semibold"
                  >
                    📄 Mumbai Dairy Bill.png
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OCR Result Preview */}
        {scannedData && (
          <div className="space-y-4">
            {/* Invoice Meta Bar */}
            <div className="bg-primary-50/80 border border-primary-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">Supplier / Distributor</span>
                <span className="font-bold text-gray-800 text-sm">{scannedData.supplierName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Invoice #</span>
                <span className="font-semibold text-primary-700 bg-white px-2 py-0.5 rounded border border-primary-200">
                  {scannedData.invoiceNumber}
                </span>
              </div>
              <button
                onClick={() => {
                  setScannedData(null);
                  setEditedItems([]);
                }}
                className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw size={12} /> Scan Another Bill
              </button>
            </div>

            {/* Detected Line Items Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 text-xs font-bold text-gray-700 flex justify-between">
                <span>Detected Products ({editedItems.length})</span>
                <span>Est. Total: ₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="divide-y divide-gray-100 text-xs max-h-60 overflow-y-auto">
                {editedItems.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                        <span className="font-bold text-gray-800 truncate">{item.productName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                        <span>Stock: {item.currentStock}</span>
                        <ArrowRight size={11} className="text-gray-400" />
                        <span className="font-bold text-green-700">{item.newStock} {item.unit}</span>
                        {item.unitCost > 0 && (
                          <span className="text-gray-400">· @₹{item.unitCost}/unit</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity editor (+/-) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateItemQty(idx, -1)}
                        className="h-7 w-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                        title="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-extrabold text-sm w-8 text-center text-primary-700">
                        {item.quantityReceived}
                      </span>
                      <button
                        onClick={() => updateItemQty(idx, 1)}
                        className="h-7 w-7 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center font-bold text-primary-700"
                        title="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unmatched items warning */}
            {scannedData.unmatched && scannedData.unmatched.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>
                  {scannedData.unmatched.length} item(s) on the bill were skipped (not found in your catalog).
                </span>
              </div>
            )}

            {/* Summary & Confirm Button */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <div className="text-xs">
                <span className="font-bold text-gray-800 text-sm block">
                  +{totalUnits} Total Units Incoming
                </span>
                <span className="text-gray-500">Across {editedItems.length} products</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-outline text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending || editedItems.length === 0}
                  className="btn-primary text-xs py-2.5 px-4 font-bold shadow-md disabled:opacity-50"
                >
                  {confirmMutation.isPending ? 'Updating Stock…' : 'Confirm & Restock Stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
