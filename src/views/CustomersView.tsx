import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Customer } from '../types';
import { Users, Search, Plus, Phone, Mail, Award, Edit3, Trash2, X, ShoppingBag } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, sales, addCustomer, updateCustomer, deleteCustomer } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerPurchases, setSelectedCustomerPurchases] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return !searchQuery || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q));
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Directory & VIP Patrons</h2>
          <p className="text-xs text-neutral-400">
            Track customer spend, bar visit frequency, loyalty, and contact details
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const custSales = sales.filter(s => s.customer_name === cust.name);

          return (
            <div key={cust.id} className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-4 hover:border-neutral-700 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-sm text-emerald-400">
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{cust.name}</h3>
                      <span className="text-[11px] text-neutral-400">Customer ID: {cust.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 space-y-1 text-xs text-neutral-400">
                  {cust.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{cust.phone}</span>
                    </div>
                  )}
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.notes && (
                    <p className="text-[11px] text-neutral-500 italic pt-1 border-t border-neutral-900">
                      "{cust.notes}"
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                  <div>
                    <span className="text-neutral-500 block">Total Spend (₦):</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₦{cust.total_spent.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Visits/Orders:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {cust.total_orders} orders
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedCustomerPurchases(cust)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> View Purchases
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cust)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCustomer(cust.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Adebayo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234 802 345 6789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Preferences / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Table preferences, favorite drinks, or VIP notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
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

      {/* Customer Purchase History Modal */}
      {selectedCustomerPurchases && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                Purchases for {selectedCustomerPurchases.name}
              </h3>
              <button onClick={() => setSelectedCustomerPurchases(null)} className="p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-neutral-800">
              {sales.filter(s => s.customer_name === selectedCustomerPurchases.name).length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">No recorded purchases under this name.</div>
              ) : (
                sales.filter(s => s.customer_name === selectedCustomerPurchases.name).map((s) => (
                  <div key={s.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-mono font-bold text-white">#{s.receipt_number}</div>
                      <div className="text-[10px] text-neutral-500">{s.date} {s.time} • {s.worker_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">₦{s.grand_total.toLocaleString()}</div>
                      <div className="text-[10px] text-neutral-400">{s.payment_method}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCustomerPurchases(null)}
                className="py-1.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
