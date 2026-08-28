import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Bell, CheckCheck, Trash2, Filter, AlertTriangle, AlertOctagon, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } = useAdmin();

  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = notifications.filter(n => {
    if (typeFilter === 'all') return true;
    return n.type === typeFilter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'out_of_stock': return <AlertOctagon className="w-4 h-4 text-red-400" />;
      case 'large_sale': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'shift_started':
      case 'shift_closed': return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Alerts & Notifications</h2>
          <p className="text-xs text-neutral-400">
            Realtime notifications dispatched from Worker POS transactions, shifts, and inventory triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            Mark All Read
          </button>
          <button
            onClick={clearAllNotifications}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-1 bg-neutral-950 rounded-xl border border-neutral-800 flex gap-1 max-w-xl">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'low_stock', label: 'Low Stock' },
          { id: 'out_of_stock', label: 'Out of Stock' },
          { id: 'shift_started', label: 'Shifts' },
          { id: 'large_sale', label: 'High Value Sales' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              typeFilter === tab.id ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 bg-neutral-900/60 border border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
            No notifications matching this category.
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition flex items-start gap-4 cursor-pointer ${
                !notif.is_read
                  ? 'bg-neutral-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-neutral-950/80 border-neutral-800/80 hover:bg-neutral-900/60'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {notif.title}
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                    )}
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-mono">{notif.time} • {notif.date}</span>
                </div>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
