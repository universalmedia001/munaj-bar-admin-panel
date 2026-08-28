import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { sales, products, workers, categories } = useAdmin();

  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'workers' | 'payments'>('sales');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7d' | '30d' | 'all'>('7d');

  // Filter Sales based on Date
  const filteredSales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter((s) => {
      if (s.status !== 'completed') return false;
      if (dateRange === 'today') return s.date === today;
      if (dateRange === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return s.date === y.toISOString().split('T')[0];
      }
      if (dateRange === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return new Date(s.timestamp) >= d;
      }
      if (dateRange === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return new Date(s.timestamp) >= d;
      }
      return true;
    });
  }, [sales, dateRange]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalItems = 0;

    filteredSales.forEach((s) => {
      totalRevenue += s.grand_total;
      s.items.forEach((item) => {
        totalItems += item.quantity;
        const prod = products.find(p => p.id === item.product_id);
        const cost = prod ? prod.cost_price : (item.unit_price * 0.6);
        totalCost += cost * item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
    const orderCount = filteredSales.length;
    const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    return { totalRevenue, totalCost, grossProfit, profitMargin, orderCount, avgOrderValue, totalItems };
  }, [filteredSales, products]);

  // Product Leaderboard
  const productPerformance = useMemo(() => {
    const map: { [prodName: string]: { name: string; qty: number; revenue: number; category: string } } = {};

    filteredSales.forEach(s => {
      s.items.forEach(item => {
        if (!map[item.product_name]) {
          map[item.product_name] = { name: item.product_name, qty: 0, revenue: 0, category: 'Bar' };
        }
        map[item.product_name].qty += item.quantity;
        map[item.product_name].revenue += item.total_price;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Worker Leaderboard
  const workerPerformance = useMemo(() => {
    const map: { [workerName: string]: { name: string; salesCount: number; revenue: number } } = {};

    filteredSales.forEach(s => {
      if (!map[s.worker_name]) {
        map[s.worker_name] = { name: s.worker_name, salesCount: 0, revenue: 0 };
      }
      map[s.worker_name].salesCount += 1;
      map[s.worker_name].revenue += s.grand_total;
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let pos = 0;
    let cash = 0;
    let transfer = 0;

    filteredSales.forEach(s => {
      if (s.payment_method === 'POS') pos += s.grand_total;
      else if (s.payment_method === 'Cash') cash += s.grand_total;
      else if (s.payment_method === 'Transfer') transfer += s.grand_total;
    });

    return [
      { name: 'POS Card', value: pos, color: '#10b981' },
      { name: 'Cash', value: cash, color: '#3b82f6' },
      { name: 'Bank Transfer', value: transfer, color: '#8b5cf6' },
    ];
  }, [filteredSales]);

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];

    if (activeTab === 'sales') {
      headers = ['Date', 'Total Sales (NGN)', 'Transactions Count', 'Units Sold'];
      // aggregate by date
      const dateMap: { [d: string]: { total: number; count: number; items: number } } = {};
      filteredSales.forEach(s => {
        if (!dateMap[s.date]) dateMap[s.date] = { total: 0, count: 0, items: 0 };
        dateMap[s.date].total += s.grand_total;
        dateMap[s.date].count += 1;
        dateMap[s.date].items += s.items.reduce((a, i) => a + i.quantity, 0);
      });
      rows = Object.entries(dateMap).map(([date, d]) => [date, d.total, d.count, d.items]);
    } else if (activeTab === 'products') {
      headers = ['Product Name', 'Units Sold', 'Total Revenue (NGN)'];
      rows = productPerformance.map(p => [`"${p.name}"`, p.qty, p.revenue]);
    } else if (activeTab === 'workers') {
      headers = ['Worker Name', 'Orders Processed', 'Total Revenue (NGN)'];
      rows = workerPerformance.map(w => [`"${w.name}"`, w.salesCount, w.revenue]);
    } else {
      headers = ['Payment Channel', 'Total Amount (NGN)'];
      rows = paymentBreakdown.map(p => [p.name, p.value]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MUNAJ_BAR_Report_${activeTab}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Business Reports & Financial Intelligence</h2>
          <p className="text-xs text-neutral-400">
            Generate audited reports for sales revenue, beverage margins, cashier rankings, and payment channels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            {(['today', 'yesterday', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  dateRange === r ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {r === 'today' ? 'Today' : r === 'yesterday' ? 'Yesterday' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Total Revenue</span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono block">
            ₦{metrics.totalRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 block">{metrics.orderCount} orders processed</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Gross Profit</span>
          <span className="text-2xl font-extrabold text-white font-mono block">
            ₦{metrics.grossProfit.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-400 block font-semibold">{metrics.profitMargin}% Profit Margin</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Cost of Goods (COGS)</span>
          <span className="text-2xl font-extrabold text-neutral-300 font-mono block">
            ₦{metrics.totalCost.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 block">Inventory wholesale cost</span>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Average Order Value</span>
          <span className="text-2xl font-extrabold text-white font-mono block">
            ₦{metrics.avgOrderValue.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 block">{metrics.totalItems} total beverage units</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-1 bg-neutral-950 rounded-xl border border-neutral-800 flex gap-1">
        {[
          { id: 'sales', label: 'Sales Summary', icon: TrendingUp },
          { id: 'products', label: 'Product Leaderboard', icon: Package },
          { id: 'workers', label: 'Worker Performance', icon: Users },
          { id: 'payments', label: 'Payment Channels', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-bold rounded-lg transition ${
                isActive ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PRODUCTS LEADERBOARD */}
      {activeTab === 'products' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Best Selling Products & Beverages</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase font-semibold">
                  <th className="pb-2.5">Rank</th>
                  <th className="pb-2.5">Product Name</th>
                  <th className="pb-2.5 text-center">Units Sold</th>
                  <th className="pb-2.5 text-right">Revenue Generated (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {productPerformance.map((p, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/30">
                    <td className="py-3 font-mono font-bold text-neutral-500">#{idx + 1}</td>
                    <td className="py-3 font-semibold text-white">{p.name}</td>
                    <td className="py-3 text-center font-mono text-white">{p.qty} units</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-400">₦{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WORKER PERFORMANCE */}
      {activeTab === 'workers' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Staff Sales Volume & Cashier Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase font-semibold">
                  <th className="pb-2.5">Rank</th>
                  <th className="pb-2.5">Staff Name</th>
                  <th className="pb-2.5 text-center">Orders Processed</th>
                  <th className="pb-2.5 text-right">Total Revenue Handled (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {workerPerformance.map((w, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/30">
                    <td className="py-3 font-mono font-bold text-neutral-500">#{idx + 1}</td>
                    <td className="py-3 font-semibold text-white">{w.name}</td>
                    <td className="py-3 text-center font-mono text-white">{w.salesCount} orders</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-400">₦{w.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PAYMENT CHANNELS */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentBreakdown.map((pm, idx) => (
            <div key={idx} className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">{pm.name}</span>
              <span className="text-2xl font-extrabold text-white font-mono block">
                ₦{pm.value.toLocaleString()}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 block font-bold">
                {metrics.totalRevenue > 0 ? Math.round((pm.value / metrics.totalRevenue) * 100) : 0}% of Total Inflow
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: SALES SUMMARY */}
      {activeTab === 'sales' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Daily Sales Aggregations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase font-semibold">
                  <th className="pb-2.5">Receipt #</th>
                  <th className="pb-2.5">Date & Time</th>
                  <th className="pb-2.5">Worker</th>
                  <th className="pb-2.5">Payment</th>
                  <th className="pb-2.5 text-right">Subtotal</th>
                  <th className="pb-2.5 text-right">VAT</th>
                  <th className="pb-2.5 text-right">Grand Total (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-800/30">
                    <td className="py-2.5 font-mono font-bold text-white">{s.receipt_number}</td>
                    <td className="py-2.5 text-neutral-400">{s.date} {s.time}</td>
                    <td className="py-2.5 text-neutral-300">{s.worker_name}</td>
                    <td className="py-2.5 text-emerald-400">{s.payment_method}</td>
                    <td className="py-2.5 text-right font-mono text-neutral-400">₦{s.subtotal.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-mono text-neutral-400">₦{s.vat.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">₦{s.grand_total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
