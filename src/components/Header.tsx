import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Database, 
  RefreshCw, 
  Check, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ShoppingBag,
  PackageCheck
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { AdminView } from '../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  searchTerm,
  setSearchTerm,
}) => {
  const { 
    currentView, 
    setCurrentView,
    currentUser, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    dbSyncStatus, 
    refreshData,
    lastSyncTime 
  } = useAdmin();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.is_read);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getPageTitle = (view: AdminView) => {
    switch (view) {
      case 'dashboard': return 'Executive Dashboard';
      case 'sales': return 'Sales Analytics & Revenue';
      case 'orders': return 'Orders & Transactions';
      case 'products': return 'Product Catalog Management';
      case 'categories': return 'Product Categories';
      case 'inventory': return 'Inventory & Stock Control';
      case 'out_of_stock': return 'Out of Stock Items';
      case 'workers': return 'Worker Roster & POS Users';
      case 'shifts': return 'Shift Management & Float Reconciliation';
      case 'customers': return 'Customer Directory & VIPs';
      case 'reports': return 'Business Reports & Statements';
      case 'notifications': return 'System Notifications & Alerts';
      case 'activity_log': return 'Audit Trail & Activity Log';
      case 'settings': return 'System Settings & Supabase Configuration';
      case 'pos_simulator': return 'Worker POS Live Tester';
      default: return 'MUNAJ BAR Admin';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
      {/* Left section: Mobile menu button + View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {getPageTitle(currentView)}
          </h1>
          <p className="hidden sm:block text-[11px] text-neutral-400 font-medium">
            MUNAJ BAR Management & Worker POS Synchronized Network
          </p>
        </div>
      </div>

      {/* Center/Right section: Search, Sync status, Notifications, User */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Global search input */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search catalog, receipts, workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-white bg-neutral-800 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Database Live Status Pill */}
        <div 
          onClick={handleRefresh}
          className="cursor-pointer group flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
          title={`Click to force sync. Status: ${dbSyncStatus}`}
        >
          <div className={`w-2 h-2 rounded-full ${
            dbSyncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' :
            dbSyncStatus === 'connecting' ? 'bg-amber-400 animate-spin' :
            dbSyncStatus === 'local_fallback' ? 'bg-emerald-400' : 'bg-red-400'
          }`} />
          <span className="hidden sm:inline text-xs font-semibold text-neutral-300">
            {dbSyncStatus === 'synced' ? 'Supabase Live' :
             dbSyncStatus === 'connecting' ? 'Connecting...' :
             'System Live'}
          </span>
          <RefreshCw className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-400 transition ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl border border-transparent hover:border-neutral-800 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950 animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Live Notifications</span>
                  {unreadNotifications.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {unreadNotifications.length} new
                    </span>
                  )}
                </div>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 text-xs transition cursor-pointer hover:bg-neutral-800/50 flex gap-3 items-start ${
                        !notif.is_read ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        notif.type === 'low_stock' ? 'bg-amber-400' :
                        notif.type === 'out_of_stock' ? 'bg-red-400' :
                        notif.type === 'large_sale' ? 'bg-emerald-400' :
                        'bg-emerald-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white text-[11px]">{notif.title}</p>
                          <span className="text-[10px] text-neutral-500">{notif.time}</span>
                        </div>
                        <p className="text-neutral-300 text-[11px] mt-0.5 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-neutral-800 bg-neutral-950/60 text-center">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    setCurrentView('notifications');
                  }}
                  className="w-full py-1 text-xs font-semibold text-neutral-400 hover:text-white transition"
                >
                  View all alerts & activity →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-neutral-800">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Manager'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
