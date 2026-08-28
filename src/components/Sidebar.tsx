import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Layers, 
  Boxes, 
  AlertOctagon, 
  Users, 
  Clock, 
  UserCheck, 
  BarChart3, 
  Bell, 
  History, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Store
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { AdminView } from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentView, setCurrentView, currentUser, logout, notifications, products } = useAdmin();

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;

  const navItems: Array<{
    id: AdminView;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    section?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'sales', label: 'Sales Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders & Receipts', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Package, section: 'Inventory & Catalog' },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'inventory', label: 'Inventory Stock', icon: Boxes },
    { id: 'out_of_stock', label: 'Out of Stock', icon: AlertOctagon, badge: outOfStockCount, badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30' },
    { id: 'workers', label: 'Workers', icon: Users, section: 'Operations' },
    { id: 'shifts', label: 'Shift Management', icon: Clock },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, section: 'Management' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount, badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    { id: 'activity_log', label: 'Activity Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'pos_simulator', label: 'Worker POS Tester', icon: Store, section: 'Integration' },
  ];

  const handleNavClick = (viewId: AdminView) => {
    setCurrentView(viewId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-neutral-950 border-r border-neutral-800/80 transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50">
              <span className="text-emerald-400 font-extrabold text-lg tracking-wider">MB</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-white tracking-wider text-base leading-none">MUNAJ BAR</span>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mt-1">Admin Console</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <React.Fragment key={item.id}>
                {item.section && !isCollapsed && (
                  <div className="px-3 pt-4 pb-1 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition group relative
                    ${isActive 
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold' 
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'}
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-neutral-400 group-hover:text-neutral-200'}`} />
                  
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`
                      px-2 py-0.5 text-[10px] font-bold rounded-full
                      ${item.badgeColor || 'bg-emerald-500/20 text-emerald-400'}
                      ${isCollapsed ? 'absolute -top-1 -right-1' : ''}
                    `}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/80">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-sm">
              {currentUser?.full_name?.charAt(0) || 'A'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{currentUser?.full_name || 'Admin User'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-neutral-400 capitalize">
                    {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Manager'}
                  </span>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="w-full mt-2 flex items-center justify-center p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
