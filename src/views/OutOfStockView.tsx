import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { AlertOctagon, Plus, Package, RefreshCw, CheckCircle2 } from 'lucide-react';

export const OutOfStockView: React.FC = () => {
  const { products, updateStock, setCurrentView } = useAdmin();

  const outOfStockProducts = products.filter(p => p.stock_quantity <= 0);
  const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level);

  const handleRestock = async (productId: string, quantity: number) => {
    await updateStock(productId, quantity);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/20 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Out of Stock & Depleted Inventory</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Priority procurement view: items with 0 or critically depleted stock that cannot be sold on POS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('inventory')}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition"
          >
            All Inventory
          </button>
        </div>
      </div>

      {/* Out of stock list */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          Zero Stock Items ({outOfStockProducts.length})
        </h3>

        {outOfStockProducts.length === 0 ? (
          <div className="p-8 bg-neutral-900/60 border border-neutral-800 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            <h4 className="text-sm font-bold text-white">All Clear! No items currently out of stock.</h4>
            <p className="text-xs text-neutral-400">All bar items have positive inventory stock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outOfStockProducts.map((prod) => (
              <div key={prod.id} className="p-5 bg-neutral-900 border border-red-500/30 rounded-2xl space-y-3 shadow-lg shadow-red-950/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{prod.name}</h4>
                    <span className="text-xs font-mono text-neutral-400">SKU: {prod.sku}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40">
                    0 IN STOCK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <div>
                    <span className="text-neutral-500 block">Category:</span>
                    <span className="font-semibold text-neutral-300">{prod.category_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Min Threshold:</span>
                    <span className="font-mono text-amber-400 font-bold">{prod.min_stock_level} units</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleRestock(prod.id, 12)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Restock 12 (Crate)
                  </button>
                  <button
                    onClick={() => handleRestock(prod.id, 24)}
                    className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl border border-neutral-700 transition"
                  >
                    +24
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Stock Watchlist */}
      {lowStockProducts.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Low Stock Watchlist ({lowStockProducts.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((prod) => (
              <div key={prod.id} className="p-4 bg-neutral-900/90 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{prod.name}</h4>
                    <span className="text-[11px] font-mono text-neutral-400">SKU: {prod.sku}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    {prod.stock_quantity} LEFT
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-neutral-400 font-mono">Min alert: {prod.min_stock_level}</span>
                  <button
                    onClick={() => handleRestock(prod.id, prod.stock_quantity + 12)}
                    className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-semibold text-xs rounded-lg transition"
                  >
                    +12 Units
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
