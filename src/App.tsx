import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { ThermalReceipt } from './components/ThermalReceipt';

import { DashboardView } from './views/DashboardView';
import { SalesView } from './views/SalesView';
import { OrdersView } from './views/OrdersView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { InventoryView } from './views/InventoryView';
import { OutOfStockView } from './views/OutOfStockView';
import { WorkersView } from './views/WorkersView';
import { ShiftsView } from './views/ShiftsView';
import { CustomersView } from './views/CustomersView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { ActivityLogView } from './views/ActivityLogView';
import { SettingsView } from './views/SettingsView';
import { WorkerPosSimulatorView } from './views/WorkerPosSimulatorView';

const AdminPanelApp: React.FC = () => {
  const { 
    isAuthenticated, 
    currentView, 
    settings, 
    selectedSaleForReceipt, 
    setSelectedSaleForReceipt 
  } = useAdmin();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'sales':
        return <SalesView />;
      case 'orders':
        return <OrdersView />;
      case 'products':
        return <ProductsView />;
      case 'categories':
        return <CategoriesView />;
      case 'inventory':
        return <InventoryView />;
      case 'out_of_stock':
        return <OutOfStockView />;
      case 'workers':
        return <WorkersView />;
      case 'shifts':
        return <ShiftsView />;
      case 'customers':
        return <CustomersView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'activity_log':
        return <ActivityLogView />;
      case 'settings':
        return <SettingsView />;
      case 'pos_simulator':
        return <WorkerPosSimulatorView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-neutral-950">
      
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Layout Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          searchTerm={globalSearchTerm}
          setSearchTerm={setGlobalSearchTerm}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {renderCurrentView()}
        </main>
      </div>

      {/* 80mm Thermal Receipt Modal */}
      {selectedSaleForReceipt && (
        <ThermalReceipt
          sale={selectedSaleForReceipt}
          settings={settings}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminPanelApp />
    </AdminProvider>
  );
}
