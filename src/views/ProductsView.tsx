import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Product, ProductStatus } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  Package, 
  Sparkles,
  ArrowUpDown,
  Boxes
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, updateStock } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    selling_price: 1500,
    cost_price: 900,
    stock_quantity: 24,
    min_stock_level: 6,
    description: '',
    status: 'active' as ProductStatus,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Open modal for Create or Edit
  const handleOpenCreate = () => {
    setEditingProduct(null);
    const defaultCat = categories[0]?.id || '';
    setFormData({
      name: '',
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: defaultCat,
      selling_price: 2000,
      cost_price: 1200,
      stock_quantity: 24,
      min_stock_level: 5,
      description: '',
      status: 'active',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category_id: prod.category_id,
      selling_price: prod.selling_price,
      cost_price: prod.cost_price,
      stock_quantity: prod.stock_quantity,
      min_stock_level: prod.min_stock_level,
      description: prod.description || '',
      status: prod.status,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.sku) {
      setFormError('Product Name and SKU are required.');
      return;
    }

    setIsSaving(true);
    const cat = categories.find(c => c.id === formData.category_id);
    const category_name = cat?.name || 'General';

    try {
      if (editingProduct) {
        const res = await updateProduct(editingProduct.id, {
          ...formData,
          category_name,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await addProduct({
          ...formData,
          category_name,
        });
        if (!res.success) throw new Error(res.error);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    setDeleteConfirmId(null);
  };

  const generateSku = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'MB';
    const random = Math.floor(100 + Math.random() * 900);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Product Catalog Management</h2>
          <p className="text-xs text-neutral-400">
            Create and maintain bar inventory, prices (₦), and stock levels for Worker POS terminals
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active & Available</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="hidden">Hidden from POS</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500 space-y-3">
            <Boxes className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="font-semibold text-neutral-400">No products found.</p>
            <p>Add a new beverage or menu item using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Product & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Selling Price (₦)</th>
                  <th className="py-3.5 px-4 text-right">Cost Price (₦)</th>
                  <th className="py-3.5 px-4 text-center">Stock Qty</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredProducts.map((prod) => {
                  const isLow = prod.stock_quantity > 0 && prod.stock_quantity <= prod.min_stock_level;
                  const isOut = prod.stock_quantity <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-sm">{prod.name}</div>
                        <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1 mt-0.5">
                          <span>SKU:</span>
                          <span className="text-neutral-300">{prod.sku}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-medium">
                          {prod.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        ₦{prod.selling_price.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-400">
                        ₦{prod.cost_price.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-sm ${
                            isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'
                          }`}>
                            {prod.stock_quantity}
                          </span>
                          <span className="text-[10px] text-neutral-500">/ min {prod.min_stock_level}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Low Stock ({prod.stock_quantity})
                          </span>
                        ) : prod.status === 'hidden' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400">
                            Hidden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(prod.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 my-8 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Product Name */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heineken Lager (600ml)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              {/* SKU & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-neutral-300">SKU Code *</label>
                    <button
                      type="button"
                      onClick={generateSku}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="BEER-HEIN-600"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-emerald-500/70"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing (NGN) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Selling Price (₦) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500/70"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Cost Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 font-mono focus:outline-none focus:border-emerald-500/70"
                  />
                </div>
              </div>

              {/* Stock Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Current Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500/70"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Minimum Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-amber-400 font-mono focus:outline-none focus:border-emerald-500/70"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Display Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                >
                  <option value="active">Active (Visible in Worker POS)</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="hidden">Hidden from POS</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes, serving style, or alcohol percentage..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition"
                >
                  {isSaving ? 'Saving to Database...' : editingProduct ? 'Update Product' : 'Add to Catalog'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Delete Product?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to delete this product? It will be removed from the catalog and Worker POS catalog.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
