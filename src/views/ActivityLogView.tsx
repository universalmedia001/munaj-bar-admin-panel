import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { History, Search, Filter, ShieldCheck, User, Calendar, FileText } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { activityLogs } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const filteredLogs = activityLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      log.user_name.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q);

    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Audit Trail & Activity Log</h2>
          <p className="text-xs text-neutral-400">
            Immutable timeline of staff logins, POS sales, stock additions, shift float adjustments, and system changes
          </p>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          {activityLogs.length} Logged Events
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search activity description or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
          />
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full py-2 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-emerald-500/70"
          >
            <option value="all">All Event Modules</option>
            <option value="sales">Sales & Transactions</option>
            <option value="shifts">Shifts & Floats</option>
            <option value="products">Product Catalog</option>
            <option value="inventory">Inventory Stock</option>
            <option value="workers">Staff & Accounts</option>
            <option value="settings">System Settings</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator / User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-800/40 transition">
                  <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                    <div>{log.date}</div>
                    <div className="text-[10px] text-neutral-500">{log.time}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {log.user_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 capitalize">
                      {log.user_role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-400">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-300 max-w-xs">
                    {log.description}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-800 uppercase">
                      {log.entity_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
