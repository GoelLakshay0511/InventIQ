import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, PackagePlus, ArrowRight } from 'lucide-react';
import apiClient from '../../api/client';

export default function QuickRestockModal({ product, onClose }) {
  const qc = useQueryClient();
  const [cartons, setCartons] = useState(1);

  const packSize = product?.packSize || 1;
  const unitsToAdd = cartons * packSize;
  const newStock = (product?.currentStock || 0) + unitsToAdd;

  const restockMutation = useMutation({
    mutationFn: () => apiClient.post(`/products/${product._id}/restock`, { quantity: unitsToAdd }),
    onSuccess: () => {
      toast.success(`Restocked +${unitsToAdd} ${product.unit || 'units'} of ${product.name}!`);
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to restock product.');
    },
  });

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <PackagePlus size={18} className="text-primary-600" />
            <h3 className="font-bold text-gray-800 text-sm">Receive Delivery Stock</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Product Details */}
        <div>
          <h4 className="font-bold text-gray-900 text-base leading-snug">{product.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Pack size: <strong>{packSize} {product.unit || 'units'} per carton</strong>
          </p>
        </div>

        {/* Cartons selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 block">
            Cartons Delivered by Supplier:
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 5, 10].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCartons(c)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                  cartons === c
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {c} ctn
              </button>
            ))}
          </div>
        </div>

        {/* Stock change preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Incoming</span>
            <span className="font-bold text-primary-700 text-sm">+{unitsToAdd} {product.unit}</span>
          </div>
          <ArrowRight size={15} className="text-gray-400" />
          <div className="text-right">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">New Stock</span>
            <span className="font-extrabold text-gray-900 text-sm">
              {product.currentStock} → {newStock}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline flex-1 text-xs py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => restockMutation.mutate()}
            disabled={restockMutation.isPending}
            className="btn-primary flex-1 text-xs py-2 font-bold disabled:opacity-50"
          >
            {restockMutation.isPending ? 'Updating…' : 'Add to Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
