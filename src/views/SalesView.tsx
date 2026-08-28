import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Sale, PaymentMethod, SaleStatus } from '../types';
import { 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Download, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Calendar, 
  User, 
  X,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SalesView: React.FC = () => {
  const { sales, workers, printReceipt, setSelectedSaleForReceipt } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Filter logic
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Search match
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        sale.receipt_number.toLowerCase().includes(query) ||
        sale.worker_name.toLowerCase().includes(query) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(query)) ||
        sale.items.some(item => item.product_name.toLowerCase().includes(query));

      // Worker match
      const matchesWorker = selectedWorker === 'all' || sale.worker_id === selectedWorker;

      // Payment match
      const matchesPayment = selectedPayment === 'all' || sale.payment_method === selectedPayment;

      // Status match
      const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;

      // Date match
      const today = new Date().toISOString().split('T')[0];
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = sale.date === today;
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = sale.date === yesterday.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = new Date(sale.timestamp) >= weekAgo;
      }

      return matchesSearch && matchesWorker && matchesPayment && matchesStatus && matchesDate;
    });
  }, [sales, searchQuery, selectedWorker, selectedPayment, selectedStatus, dateFilter]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.grand_total, 0);
  }, [filteredSales]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Time', 'Worker', 'Customer', 'Items Count', 'Payment Method', 'Subtotal', 'Discount', 'VAT', 'Total (NGN)', 'Status'];
    const rows = filteredSales.map(s => [
      s.receipt_number,
      s.date,
      s.time,
      `"${s.worker_name}"`,
      `"${s.customer_name || 'Walk-in'}"`,
      s.items.length,
      s.payment_method,
      s.subtotal,
      s.discount,
      s.vat,
      s.grand_total,
      s.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MUNAJ_BAR_Sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sales Transactions & Revenue</h2>
          <p className="text-xs text-neutral-400">
            Realtime sales registry from MUNAJ BAR Worker POS terminals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl">
            <span className="text-[10px] text-neutral-400 block uppercase font-bold">Filtered Revenue</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              ₦{totalFilteredRevenue.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Receipt #, Worker, Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>

        {/* Date Filter */}
        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Past 7 Days</option>
          </select>
        </div>

        {/* Worker Filter */}
        <div>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Workers</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Payment Methods</option>
            <option value="POS">POS Card</option>
            <option value="Cash">Cash</option>
            <option value="Transfer">Bank Transfer</option>
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
            <p className="font-semibold text-neutral-400">No sales match the specified filters.</p>
            <p>Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Receipt Number</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Worker (Cashier)</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Total Amount (₦)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {sale.receipt_number}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      <div>{sale.date}</div>
                      <div className="text-[10px] text-neutral-500">{sale.time}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {sale.worker_name}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">
                      {sale.customer_name || 'Walk-in Guest'}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      <span className="font-semibold text-neutral-200">
                        {sale.items.reduce((acc, i) => acc + i.quantity, 0)} units
                      </span>
                      <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                        {sale.items.map(i => i.product_name).join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sale.payment_method === 'POS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        sale.payment_method === 'Cash' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white text-sm">
                      ₦{sale.grand_total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedSaleDetail(sale)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                        title="View Full Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printReceipt(sale)}
                        className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition"
                        title="Print Thermal Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 my-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Transaction Details — #{selectedSaleDetail.receipt_number}
                </h3>
                <p className="text-xs text-neutral-400">
                  {selectedSaleDetail.date} at {selectedSaleDetail.time}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">Worker:</span>
                <span className="font-semibold text-white">{selectedSaleDetail.worker_name}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Customer:</span>
                <span className="font-semibold text-white">{selectedSaleDetail.customer_name || 'Walk-in'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Payment Method:</span>
                <span className="font-semibold text-emerald-400">{selectedSaleDetail.payment_method}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Shift Reference:</span>
                <span className="font-mono text-neutral-400">{selectedSaleDetail.shift_id || 'N/A'}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">Purchased Items</h4>
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {selectedSaleDetail.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/20">
                        <td className="py-2.5 px-3 font-medium text-white">{item.product_name}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-300">₦{item.unit_price.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">₦{item.total_price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal:</span>
                <span className="font-mono">₦{selectedSaleDetail.subtotal.toLocaleString()}</span>
              </div>
              {selectedSaleDetail.discount > 0 && (
                <div className="flex justify-between text-neutral-400">
                  <span>Discount Applied:</span>
                  <span className="font-mono text-amber-400">-₦{selectedSaleDetail.discount.toLocaleString()}</span>
                </div>
              )}
              {selectedSaleDetail.vat > 0 && (
                <div className="flex justify-between text-neutral-400">
                  <span>VAT (7.5%):</span>
                  <span className="font-mono">₦{selectedSaleDetail.vat.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400 text-base">₦{selectedSaleDetail.grand_total.toLocaleString()}</span>
              </div>
            </div>

            {/* Audit / Printed By Information */}
            <div className="text-[11px] text-neutral-500 flex justify-between items-center px-1">
              <span>Printed By: <strong className="text-neutral-400">{selectedSaleDetail.printed_by || 'Cashier Terminal'}</strong></span>
              <span>Status: <strong className="text-emerald-400 uppercase">{selectedSaleDetail.status}</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedSaleDetail(null);
                  printReceipt(selectedSaleDetail);
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                Print Thermal POS Receipt
              </button>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
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
