import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Product } from '../types';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  PackageCheck
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { products, categories, updateStock, setCurrentView } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [customQty, setCustomQty] = useState<number>(0);

  // Statistics
  const stats = useMemo(() => {
    const totalItems = products.reduce((acc, p) => acc + p.stock_quantity, 0);
    const totalValue = products.reduce((acc, p) => acc + (p.stock_quantity * p.cost_price), 0);
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length;
    const outOfStock = products.filter(p => p.stock_quantity <= 0).length;

    return { totalItems, totalValue, lowStock, outOfStock };
  }, [products]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || p.category_id === categoryFilter;

      let matchesStock = true;
      if (stockStatusFilter === 'in_stock') matchesStock = p.stock_quantity > p.min_stock_level;
      else if (stockStatusFilter === 'low_stock') matchesStock = p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level;
      else if (stockStatusFilter === 'out_of_stock') matchesStock = p.stock_quantity <= 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockStatusFilter]);

  const handleQuickAdjust = async (product: Product, delta: number) => {
    const newQty = Math.max(0, product.stock_quantity + delta);
    await updateStock(product.id, newQty);
  };

  const handleApplyCustomQty = async (productId: string) => {
    if (customQty < 0) return;
    await updateStock(productId, customQty);
    setAdjustingId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Bar Inventory & Stock Control</h2>
          <p className="text-xs text-neutral-400">
            Monitor real-time warehouse & bar stock levels, adjust units, and trigger replenishment
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats.outOfStock > 0 && (
            <button
              onClick={() => setCurrentView('out_of_stock')}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition hover:bg-red-600/30"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {stats.outOfStock} Out of Stock
            </button>
          )}
          <button
            onClick={() => setCurrentView('products')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
        </div>
      </div>

      {/* 4 Inventory Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Total Units in Bar</span>
          <span className="text-2xl font-extrabold text-white font-mono mt-1 block">
            {stats.totalItems.toLocaleString()} <span className="text-xs font-normal text-neutral-400">units</span>
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">Across {products.length} distinct SKUs</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Inventory Asset Value</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
            ₦{stats.totalValue.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">Calculated at unit cost price</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Low Stock Alert</span>
          <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
            {stats.lowStock} <span className="text-xs font-normal text-neutral-400">items</span>
          </span>
          <span className="text-[11px] text-amber-500/80 mt-1 block">Below configured thresholds</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Out of Stock</span>
          <span className={`text-2xl font-extrabold font-mono mt-1 block ${stats.outOfStock > 0 ? 'text-red-400' : 'text-neutral-300'}`}>
            {stats.outOfStock} <span className="text-xs font-normal text-neutral-400">items</span>
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">Unavailable on Worker POS</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (Healthy)</option>
            <option value="low_stock">Low Stock (Alert)</option>
            <option value="out_of_stock">Out of Stock (Zero)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table with Quick Adjustments */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Product Name & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Min Level</th>
                <th className="py-3.5 px-4 text-center">Current Qty</th>
                <th className="py-3.5 px-4 text-right">Quick Adjustments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredProducts.map((prod) => {
                const isOut = prod.stock_quantity <= 0;
                const isLow = prod.stock_quantity > 0 && prod.stock_quantity <= prod.min_stock_level;
                const isAdjusting = adjustingId === prod.id;

                return (
                  <tr key={prod.id} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">{prod.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">SKU: {prod.sku}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px]">
                        {prod.category_name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          <XCircle className="w-3 h-3" />
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-neutral-400">
                      {prod.min_stock_level}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-mono font-extrabold text-base ${
                        isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'
                      }`}>
                        {prod.stock_quantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAdjusting ? (
                        <div className="inline-flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-700">
                          <input
                            type="number"
                            min="0"
                            value={customQty}
                            onChange={(e) => setCustomQty(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-center text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => handleApplyCustomQty(prod.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition"
                          >
                            Set
                          </button>
                          <button
                            onClick={() => setAdjustingId(null)}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs rounded transition"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdjust(prod, -1)}
                            disabled={prod.stock_quantity <= 0}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 rounded-lg transition"
                            title="Deduct 1 unit"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(prod, 1)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
                            title="Add 1 unit"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(prod, 12)}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-bold text-[10px] rounded-lg transition"
                            title="Add 1 Crate (12 units)"
                          >
                            +12 (Crate)
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(prod, 24)}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-bold text-[10px] rounded-lg transition"
                            title="Add 24 units"
                          >
                            +24
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingId(prod.id);
                              setCustomQty(prod.stock_quantity);
                            }}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition"
                            title="Set Exact Quantity"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
