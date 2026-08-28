import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Shift, Sale } from '../types';
import { 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Lock, 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Printer, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

export const ShiftsView: React.FC = () => {
  const { shifts, workers, sales, startShift, closeShift, printReceipt } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<Shift | null>(null);
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState<Shift | null>(null);

  // Start Shift Form
  const [startWorkerId, setStartWorkerId] = useState('');
  const [startOpeningCash, setStartOpeningCash] = useState<number>(20000);

  // Close Shift Form
  const [closingActualCash, setClosingActualCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        shift.shift_id.toLowerCase().includes(q) ||
        shift.worker_name.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shifts, searchQuery, statusFilter]);

  // Open Shift Handler
  const handleStartShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find(w => w.id === startWorkerId) || workers[0];
    if (!worker) return;

    await startShift(worker.id, worker.name, startOpeningCash);
    setIsStartShiftOpen(false);
  };

  // Close Shift Handler
  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCloseShiftOpen) return;

    await closeShift(isCloseShiftOpen.id, closingActualCash, closingNotes);
    setIsCloseShiftOpen(null);
  };

  // Get transactions for a given shift
  const getShiftSales = (shiftId: string) => {
    return sales.filter(s => s.shift_id === shiftId);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Shift Management & Cash Reconciliation</h2>
          <p className="text-xs text-neutral-400">
            Monitor worker active shifts, register opening cash float, and reconcile closing cash drawers
          </p>
        </div>

        <button
          onClick={() => {
            setStartWorkerId(workers[0]?.id || '');
            setStartOpeningCash(20000);
            setIsStartShiftOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition"
        >
          <Plus className="w-4 h-4" />
          Open New Shift
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by Shift ID or Worker Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Shifts</option>
            <option value="open">Active / Open Shifts</option>
            <option value="closed">Completed / Closed Shifts</option>
          </select>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Shift ID</th>
                <th className="py-3.5 px-4">Worker (Staff)</th>
                <th className="py-3.5 px-4">Start Time</th>
                <th className="py-3.5 px-4">End Time</th>
                <th className="py-3.5 px-4 text-right">Opening Float (₦)</th>
                <th className="py-3.5 px-4 text-right">Expected Cash (₦)</th>
                <th className="py-3.5 px-4 text-right">Actual Counted (₦)</th>
                <th className="py-3.5 px-4 text-right">Difference (₦)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredShifts.map((shift) => {
                const isDiscrepancy = shift.cash_difference !== null && shift.cash_difference !== 0;

                return (
                  <tr key={shift.id} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {shift.shift_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {shift.worker_name}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      <div>{shift.start_date}</div>
                      <div className="text-[10px] text-neutral-500">{shift.start_time}</div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      {shift.end_time ? (
                        <>
                          <div>{shift.end_date}</div>
                          <div className="text-[10px] text-neutral-500">{shift.end_time}</div>
                        </>
                      ) : (
                        <span className="text-emerald-400 font-semibold italic text-[11px]">In Progress</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-neutral-300">
                      ₦{shift.opening_cash.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-neutral-300 font-semibold">
                      ₦{shift.expected_cash.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {shift.actual_cash !== null ? `₦${shift.actual_cash.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {shift.cash_difference !== null ? (
                        <span className={shift.cash_difference < 0 ? 'text-red-400' : shift.cash_difference > 0 ? 'text-emerald-400' : 'text-neutral-400'}>
                          {shift.cash_difference > 0 ? `+₦${shift.cash_difference.toLocaleString()}` : `₦${shift.cash_difference.toLocaleString()}`}
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {shift.status === 'open' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                          OPEN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                          CLOSED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedShiftDetail(shift)}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                        title="View Shift Transactions"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {shift.status === 'open' && (
                        <button
                          onClick={() => {
                            setIsCloseShiftOpen(shift);
                            setClosingActualCash(shift.expected_cash);
                            setClosingNotes('');
                          }}
                          className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-lg transition"
                        >
                          Reconcile & Close
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Shift Modal */}
      {isStartShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Open New POS Shift
              </h3>
              <button onClick={() => setIsStartShiftOpen(false)} className="p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartShiftSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Select Assigned Worker *</label>
                <select
                  value={startWorkerId}
                  onChange={(e) => setStartWorkerId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Opening Cash Float (₦) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={startOpeningCash}
                  onChange={(e) => setStartOpeningCash(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500/70"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">Physical cash handed over in change drawer</span>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
                >
                  Authorize & Start Shift
                </button>
                <button
                  type="button"
                  onClick={() => setIsStartShiftOpen(false)}
                  className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Reconciliation Modal */}
      {isCloseShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Close Shift & Reconcile Float — {isCloseShiftOpen.shift_id}
              </h3>
              <button onClick={() => setIsCloseShiftOpen(null)} className="p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">Staff on Duty:</span>
                <span className="font-semibold text-white">{isCloseShiftOpen.worker_name}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Opening Float:</span>
                <span className="font-mono text-neutral-300">₦{isCloseShiftOpen.opening_cash.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Total Shift Revenue:</span>
                <span className="font-mono font-bold text-emerald-400">₦{isCloseShiftOpen.total_sales.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Expected Cash in Drawer:</span>
                <span className="font-mono font-bold text-white">₦{isCloseShiftOpen.expected_cash.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">
                  Physically Counted Cash in Drawer (₦) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={closingActualCash}
                  onChange={(e) => setClosingActualCash(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              {/* Realtime variance display */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-400">Drawer Discrepancy / Variance:</span>
                <span className={`font-mono font-extrabold text-sm ${
                  (closingActualCash - isCloseShiftOpen.expected_cash) < 0 
                    ? 'text-red-400' 
                    : (closingActualCash - isCloseShiftOpen.expected_cash) > 0
                    ? 'text-emerald-400'
                    : 'text-neutral-300'
                }`}>
                  ₦{(closingActualCash - isCloseShiftOpen.expected_cash).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Reconciliation Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Reason for any cash difference or shift handover comments..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-950/60"
                >
                  Verify & Finalize Shift Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloseShiftOpen(null)}
                  className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Details Modal */}
      {selectedShiftDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 my-8 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Shift Breakdown — #{selectedShiftDetail.shift_id}
                </h3>
                <p className="text-xs text-neutral-400">
                  Staff: {selectedShiftDetail.worker_name} • Started: {selectedShiftDetail.start_date} {selectedShiftDetail.start_time}
                </p>
              </div>
              <button
                onClick={() => setSelectedShiftDetail(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Breakdown in this shift */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-semibold">POS Card Total</span>
                  <span className="font-mono font-bold text-white text-xs">
                    ₦{selectedShiftDetail.pos_sales.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center gap-3">
                <Banknote className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Cash Sales Total</span>
                  <span className="font-mono font-bold text-white text-xs">
                    ₦{selectedShiftDetail.cash_sales.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Bank Transfers</span>
                  <span className="font-mono font-bold text-white text-xs">
                    ₦{selectedShiftDetail.transfer_sales.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Transactions In Shift */}
            <div>
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Transactions Executed ({getShiftSales(selectedShiftDetail.shift_id).length})
              </h4>

              <div className="border border-neutral-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                      <th className="py-2.5 px-3 text-right">Print</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {getShiftSales(selectedShiftDetail.shift_id).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-neutral-500">
                          No sales recorded in this shift yet.
                        </td>
                      </tr>
                    ) : (
                      getShiftSales(selectedShiftDetail.shift_id).map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-800/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-white">{s.receipt_number}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{s.time}</td>
                          <td className="py-2.5 px-3 text-neutral-300">{s.items.length} items</td>
                          <td className="py-2.5 px-3 text-emerald-400">{s.payment_method}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">₦{s.grand_total.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => printReceipt(s)}
                              className="p-1 text-neutral-400 hover:text-white"
                              title="Print Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedShiftDetail(null)}
                className="py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
              >
                Close Breakdown
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
