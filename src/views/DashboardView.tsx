import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  Plus, 
  Printer, 
  Users, 
  Boxes, 
  BarChart3, 
  ArrowUpRight, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Store,
  Flame
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { 
    sales, 
    products, 
    workers, 
    shifts, 
    notifications, 
    activityLogs, 
    setCurrentView, 
    printReceipt, 
    setSelectedSaleForReceipt,
    setSelectedShiftForDetail 
  } = useAdmin();

  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '90d'>('7d');

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Calculate Today's Metrics
  const todaySalesList = useMemo(() => sales.filter(s => s.date === todayStr && s.status === 'completed'), [sales, todayStr]);
  const todayRevenue = useMemo(() => todaySalesList.reduce((acc, s) => acc + s.grand_total, 0), [todaySalesList]);
  const todayOrdersCount = todaySalesList.length;
  
  const todayItemsSoldCount = useMemo(() => {
    return todaySalesList.reduce((acc, s) => {
      const itemsCount = s.items?.reduce((iAcc, item) => iAcc + item.quantity, 0) || 0;
      return acc + itemsCount;
    }, 0);
  }, [todaySalesList]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stock_quantity <= 0).length;
  }, [products]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let pos = 0;
    let transfer = 0;

    todaySalesList.forEach(s => {
      if (s.payment_method === 'Cash') cash += s.grand_total;
      else if (s.payment_method === 'POS') pos += s.grand_total;
      else if (s.payment_method === 'Transfer') transfer += s.grand_total;
    });

    const total = cash + pos + transfer || 1; // avoid divide by zero

    return [
      { name: 'POS Card', value: pos, percentage: Math.round((pos / total) * 100), color: '#10b981', icon: CreditCard },
      { name: 'Cash', value: cash, percentage: Math.round((cash / total) * 100), color: '#3b82f6', icon: Banknote },
      { name: 'Bank Transfer', value: transfer, percentage: Math.round((transfer / total) * 100), color: '#8b5cf6', icon: Smartphone },
    ];
  }, [todaySalesList]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const days = timeframe === 'today' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const result = [];

    if (timeframe === 'today') {
      // Hourly distribution
      const hourlyMap: { [hour: string]: number } = {
        '10:00': 0, '12:00': 0, '14:00': 0, '16:00': 0, '18:00': 0, '20:00': 0, '22:00': 0, '00:00': 0
      };
      todaySalesList.forEach(s => {
        const hour = s.time.split(':')[0] + ':00';
        if (hourlyMap[hour] !== undefined) hourlyMap[hour] += s.grand_total;
        else hourlyMap['14:00'] += s.grand_total;
      });
      return Object.entries(hourlyMap).map(([time, amount]) => ({ label: time, amount }));
    }

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date === dStr && s.status === 'completed');
      const total = daySales.reduce((acc, s) => acc + s.grand_total, 0);

      result.push({
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        amount: total,
      });
    }

    return result;
  }, [sales, timeframe, todaySalesList]);

  // Active shifts count
  const activeShifts = shifts.filter(s => s.status === 'open');

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Welcome / Live Bar Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Bar Operations</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">MUNAJ BAR Executive Dashboard</h2>
          <p className="text-xs text-neutral-400">
            {activeShifts.length} Active Shift{activeShifts.length === 1 ? '' : 's'} on floor • Realtime Worker POS synchronization active
          </p>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentView('products')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
          <button
            onClick={() => setCurrentView('pos_simulator')}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            Worker POS Tester
          </button>
          {sales.length > 0 && (
            <button
              onClick={() => printReceipt(sales[0])}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition"
              title="Print latest sale receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              Latest Receipt
            </button>
          )}
        </div>
      </div>

      {/* 4 PRIMARY STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TODAY'S SALES */}
        <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-3 relative overflow-hidden group hover:border-neutral-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
              ₦{todayRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> Live revenue from Worker POS
            </p>
          </div>
        </div>

        {/* TODAY'S ORDERS */}
        <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-3 relative overflow-hidden group hover:border-neutral-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Today's Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {todayOrdersCount} <span className="text-xs font-normal text-neutral-400">receipts</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Avg value: <span className="text-neutral-200 font-semibold font-mono">₦{todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount).toLocaleString() : '0'}</span>
            </p>
          </div>
        </div>

        {/* ITEMS SOLD */}
        <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-3 relative overflow-hidden group hover:border-neutral-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Items Sold</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {todayItemsSoldCount} <span className="text-xs font-normal text-neutral-400">units</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Across all categories & bars
            </p>
          </div>
        </div>

        {/* LOW STOCK / OUT OF STOCK */}
        <div 
          onClick={() => setCurrentView('out_of_stock')}
          className="cursor-pointer p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-3 relative overflow-hidden group hover:border-amber-500/50 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Stock Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-baseline gap-2">
              <span className={lowStockCount > 0 ? 'text-amber-400' : 'text-neutral-200'}>{lowStockCount}</span>
              <span className="text-xs font-normal text-neutral-400">low</span>
              {outOfStockCount > 0 && (
                <span className="text-xs font-bold text-red-400 font-mono">({outOfStockCount} out)</span>
              )}
            </div>
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center justify-between">
              <span>Requires replenishment</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>
      </div>

      {/* SALES CHART & PAYMENT METHOD BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart Section */}
        <div className="lg:col-span-2 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
            <div>
              <h3 className="text-sm font-bold text-white">Sales Revenue Analytics</h3>
              <p className="text-xs text-neutral-400">Track beverage & food revenue performance</p>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 self-start sm:self-auto">
              {(['today', '7d', '30d', '90d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    timeframe === tf
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tf === 'today' ? 'Today' : tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="label" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#737373" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`₦${Number(val).toLocaleString()}`, 'Sales Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Payment Method Distribution</h3>
            <p className="text-xs text-neutral-400">Today's breakdown across POS, Cash & Transfer</p>
          </div>

          <div className="space-y-3 my-auto">
            {paymentBreakdown.map((pm, idx) => {
              const Icon = pm.icon;
              return (
                <div key={idx} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pm.color}20`, color: pm.color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{pm.name}</p>
                      <p className="text-[11px] font-mono text-neutral-400">₦{pm.value.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono" style={{ color: pm.color }}>
                      {pm.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-800 flex justify-between text-xs font-bold text-neutral-300">
            <span>Total Collected Today:</span>
            <span className="font-mono text-emerald-400">₦{todayRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* RECENT SALES & LIVE ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions (2 Cols) */}
        <div className="lg:col-span-2 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <div>
              <h3 className="text-sm font-bold text-white">Recent POS Sales</h3>
              <p className="text-xs text-neutral-400">Latest transactions registered by workers</p>
            </div>
            <button
              onClick={() => setCurrentView('sales')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              View All Sales <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No sales recorded yet today. Use the Worker POS Tester to create test sales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="pb-2.5 font-bold">Receipt #</th>
                    <th className="pb-2.5">Worker</th>
                    <th className="pb-2.5">Payment</th>
                    <th className="pb-2.5">Items</th>
                    <th className="pb-2.5 text-right">Amount (₦)</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {sales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="group hover:bg-neutral-800/40 transition">
                      <td className="py-3 font-mono font-bold text-white">
                        {sale.receipt_number}
                        <div className="text-[10px] text-neutral-500 font-sans">{sale.time}</div>
                      </td>
                      <td className="py-3 text-neutral-300">
                        <span className="font-semibold text-white">{sale.worker_name}</span>
                        <div className="text-[10px] text-neutral-500">{sale.customer_name || 'Walk-in'}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sale.payment_method === 'POS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          sale.payment_method === 'Cash' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-400">
                        {sale.items.length} item{sale.items.length === 1 ? '' : 's'}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-white">
                        ₦{sale.grand_total.toLocaleString()}
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => printReceipt(sale)}
                          className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition"
                          title="Print Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Activity Feed (1 Col) */}
        <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Live Activity Feed</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
              Real-time
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activityLogs.slice(0, 7).map((log) => (
              <div key={log.id} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-neutral-500">{log.time}</span>
                </div>
                <p className="text-neutral-300 text-[11px] leading-snug">{log.description}</p>
                <div className="text-[10px] text-neutral-500">
                  By <strong className="text-neutral-400">{log.user_name}</strong>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentView('activity_log')}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition text-center"
          >
            View Full Audit Log →
          </button>
        </div>

      </div>

    </div>
  );
};
