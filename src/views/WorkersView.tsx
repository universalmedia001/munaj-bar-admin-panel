import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Worker, WorkerRole, WorkerStatus, Sale } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  ShoppingBag, 
  Eye, 
  Edit3, 
  X, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const WorkersView: React.FC = () => {
  const { workers, sales, shifts, addWorker, updateWorker } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<Worker | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier' as WorkerRole,
    status: 'active' as WorkerStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Compute stats for each worker
  const workerStats = useMemo(() => {
    const map: { [workerId: string]: { todaySales: number; todayCount: number; allSales: Sale[] } } = {};
    
    workers.forEach(w => {
      const workerSales = sales.filter(s => s.worker_id === w.id);
      const todaySalesList = workerSales.filter(s => s.date === today && s.status === 'completed');
      const todaySales = todaySalesList.reduce((acc, s) => acc + s.grand_total, 0);
      const todayCount = todaySalesList.length;

      map[w.id] = { todaySales, todayCount, allSales: workerSales };
    });

    return map;
  }, [workers, sales, today]);

  const filteredWorkers = workers.filter(w => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || w.name.toLowerCase().includes(q) || w.email.toLowerCase().includes(q) || (w.phone && w.phone.includes(q));
    const matchesRole = roleFilter === 'all' || w.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'cashier',
      status: 'active',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setEditingWorker(w);
    setFormData({
      name: w.name,
      email: w.email,
      phone: w.phone || '',
      role: w.role,
      status: w.status,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Name and Email are required.');
      return;
    }

    if (editingWorker) {
      const res = await updateWorker(editingWorker.id, formData);
      if (!res.success) setFormError(res.error || 'Failed to update worker');
      else setIsAddModalOpen(false);
    } else {
      const res = await addWorker(formData);
      if (!res.success) setFormError(res.error || 'Failed to add worker');
      else setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Worker Roster & POS Staff</h2>
          <p className="text-xs text-neutral-400">
            Manage bar workers, cashiers, bartenders, shift assignments, and daily sales metrics
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition"
        >
          <Plus className="w-4 h-4" />
          Add Worker
        </button>
      </div>

      {/* Search & Role Filters */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search worker by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Staff Roles</option>
            <option value="cashier">Cashier</option>
            <option value="bartender">Bartender</option>
            <option value="worker">General Bar Worker</option>
          </select>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => {
          const stats = workerStats[worker.id] || { todaySales: 0, todayCount: 0, allSales: [] };
          const activeShift = shifts.find(s => s.worker_id === worker.id && s.status === 'open');

          return (
            <div key={worker.id} className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-4 hover:border-neutral-700 transition flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-base text-emerald-400">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{worker.name}</h3>
                      <span className="text-xs text-neutral-400 capitalize">{worker.role}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    activeShift 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                      : worker.status === 'active'
                      ? 'bg-neutral-800 text-neutral-300'
                      : 'bg-neutral-900 text-neutral-500'
                  }`}>
                    {activeShift ? 'ON SHIFT' : worker.status.toUpperCase()}
                  </span>
                </div>

                {/* Contact info */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 space-y-1.5 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="truncate">{worker.email}</span>
                  </div>
                  {worker.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{worker.phone}</span>
                    </div>
                  )}
                </div>

                {/* Shift & Sales Today */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                  <div>
                    <span className="text-neutral-500 block">Sales Today:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₦{stats.todaySales.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Receipts:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {stats.todayCount} orders
                    </span>
                  </div>
                </div>

                {activeShift && (
                  <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Shift Started {activeShift.start_time}
                    </span>
                    <span className="font-mono font-bold">Float: ₦{activeShift.opening_cash.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedWorkerDetail(worker)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Sales History
                </button>

                <button
                  onClick={() => handleOpenEdit(worker)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                  title="Edit Worker Info"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Worker Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                {editingWorker ? 'Edit Worker Profile' : 'Add New Bar Worker / Cashier'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Okafor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@munajbar.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">POS Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as WorkerRole })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="bartender">Bartender</option>
                    <option value="worker">General Worker</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Employment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkerStatus })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
                >
                  {editingWorker ? 'Save Changes' : 'Register Worker'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Sales History Drawer/Modal */}
      {selectedWorkerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 my-8 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Worker Profile — {selectedWorkerDetail.name}
                </h3>
                <p className="text-xs text-neutral-400 capitalize">{selectedWorkerDetail.role} • {selectedWorkerDetail.email}</p>
              </div>
              <button
                onClick={() => setSelectedWorkerDetail(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">Total Lifetime Sales:</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  ₦{(workerStats[selectedWorkerDetail.id]?.allSales.reduce((a, s) => a + s.grand_total, 0) || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Total Receipts:</span>
                <span className="text-base font-extrabold font-mono text-white">
                  {workerStats[selectedWorkerDetail.id]?.allSales.length || 0}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Sales Today:</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  ₦{(workerStats[selectedWorkerDetail.id]?.todaySales || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sales Table */}
            <div>
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">Recent Transactions Handled</h4>
              <div className="border border-neutral-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Date/Time</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {(workerStats[selectedWorkerDetail.id]?.allSales || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-neutral-500">No transactions recorded for this worker yet.</td>
                      </tr>
                    ) : (
                      workerStats[selectedWorkerDetail.id]?.allSales.map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-800/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">{s.receipt_number}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{s.date} {s.time}</td>
                          <td className="py-2.5 px-3 text-emerald-400">{s.payment_method}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">₦{s.grand_total.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedWorkerDetail(null)}
                className="py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
