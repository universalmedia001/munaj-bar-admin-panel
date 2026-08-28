import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Sale } from '../types';
import { Search, ShoppingBag, Printer, Eye, Download, Calendar, User, CheckCircle2 } from 'lucide-react';

export const OrdersView: React.FC = () => {
  const { sales, printReceipt, setSelectedSaleForReceipt } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('all');

  const filteredOrders = sales.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      order.receipt_number.toLowerCase().includes(q) ||
      order.worker_name.toLowerCase().includes(q) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(q));

    const matchesPayment = selectedPayment === 'all' || order.payment_method === selectedPayment;

    return matchesSearch && matchesPayment;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Orders & Receipts Registry</h2>
          <p className="text-xs text-neutral-400">
            View all completed orders, item breakdowns, and issue thermal receipts
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-neutral-400 block font-semibold">Total Orders Processed</span>
          <span className="text-xl font-extrabold text-white font-mono">{sales.length}</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by receipt # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>

        <div>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Payment Channels</option>
            <option value="POS">POS Terminal Card</option>
            <option value="Cash">Cash at Counter</option>
            <option value="Transfer">Direct Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-4 hover:border-neutral-700 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-white text-base">#{order.receipt_number}</span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {order.date} • {order.time}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  order.payment_method === 'POS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  order.payment_method === 'Cash' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {order.payment_method}
                </span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 space-y-1 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Cashier / Worker:</span>
                  <span className="font-semibold text-white">{order.worker_name}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Guest:</span>
                  <span className="text-neutral-300">{order.customer_name || 'Walk-in'}</span>
                </div>
              </div>

              {/* Items summary */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Ordered Items</span>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-neutral-300 text-[11px]">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span className="font-mono text-neutral-400">₦{item.total_price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase">Total Amount</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  ₦{order.grand_total.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedSaleForReceipt(order)}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition"
                  title="View Thermal Receipt"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => printReceipt(order)}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition"
                  title="Print Thermal Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
