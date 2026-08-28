import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AdminUser, 
  Product, 
  Category, 
  Worker, 
  Shift, 
  Sale, 
  SaleItem, 
  Customer, 
  NotificationItem, 
  ActivityLog, 
  BusinessSettings,
  AdminView,
  PaymentMethod
} from '../types';
import { supabase, handleSupabaseError, createIsolatedAuthClient } from '../lib/supabase';

interface AdminContextType {
  // Auth state
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password?: string, role?: 'super_admin' | 'manager') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Navigation
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;
  selectedSaleForReceipt: Sale | null;
  setSelectedSaleForReceipt: (sale: Sale | null) => void;
  selectedShiftForDetail: Shift | null;
  setSelectedShiftForDetail: (shift: Shift | null) => void;
  selectedWorkerForDetail: Worker | null;
  setSelectedWorkerForDetail: (worker: Worker | null) => void;

  // Supabase Connection Status
  isLiveSupabase: boolean;
  dbSyncStatus: 'synced' | 'connecting' | 'error';
  lastSyncTime: Date | null;
  lastDbError: string | null;
  refreshData: () => Promise<void>;

  // Data Collections (Live from Supabase)
  products: Product[];
  categories: Category[];
  workers: Worker[];
  shifts: Shift[];
  sales: Sale[];
  customers: Customer[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  settings: BusinessSettings;

  // Actions - Products
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateStock: (id: string, newStock: number) => Promise<{ success: boolean; error?: string }>;

  // Actions - Categories
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Actions - Workers
  addWorker: (worker: Omit<Worker, 'id' | 'created_at' | 'total_sales_today' | 'transactions_count_today'> & { password: string }) => Promise<{ success: boolean; error?: string; email?: string }>;
  updateWorker: (id: string, updates: Partial<Worker>) => Promise<{ success: boolean; error?: string }>;

  // Actions - Shifts
  startShift: (workerId: string, openingCash: number) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
  closeShift: (shiftId: string, actualCash: number, notes?: string) => Promise<{ success: boolean; error?: string }>;

  // Actions - Sales (Worker POS Integration)
  recordSale: (saleData: {
    worker_id?: string;
    worker_name?: string;
    shift_id?: string;
    customer_id?: string | null;
    customer_name?: string;
    payment_method: PaymentMethod;
    items: Array<{ product_id: string; quantity: number }>;
    discount?: number;
    notes?: string;
    printed_by?: string;
  }) => Promise<{ success: boolean; sale?: Sale; error?: string }>;

  // Actions - Notifications & Activity
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  logActivity: (action: string, description: string, entityType?: ActivityLog['entity_type'], entityId?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<{ success: boolean; error?: string }>;
  printReceipt: (sale: Sale, printedBy?: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  business_name: 'MUNAJ BAR & LOUNGE',
  phone: '+234 803 000 0000',
  email: 'admin@munajbar.com',
  address: 'Victoria Island, Lagos, Nigeria',
  logo_url: '',
  receipt_header: 'MUNAJ BAR & LOUNGE\nCold Drinks, Great Vibes',
  receipt_footer: 'Thank you for choosing MUNAJ BAR.\nPlease come again!',
  vat_percentage: 7.5,
  show_cashier: true,
  show_receipt_number: true,
  currency_symbol: '₦',
  currency_code: 'NGN',
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Navigation
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<Shift | null>(null);
  const [selectedWorkerForDetail, setSelectedWorkerForDetail] = useState<Worker | null>(null);

  // Status & Sync
  const [isLiveSupabase, setIsLiveSupabase] = useState(true);
  const [dbSyncStatus, setDbSyncStatus] = useState<'synced' | 'connecting' | 'error'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastDbError, setLastDbError] = useState<string | null>(null);

  // Data Collections (empty by default, loaded strictly from Supabase)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);

  // =========================================================================
  // 1. REFRESH DATA FROM SUPABASE DATABASE
  // =========================================================================
  const refreshData = useCallback(async () => {
    try {
      setDbSyncStatus('connecting');
      setLastDbError(null);

      // Fetch products
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (prodErr) {
        handleSupabaseError('Fetch Products', prodErr);
      } else if (prodData) {
        const formattedProds: Product[] = prodData.map((p: any) => ({
          id: p.id,
          name: p.name || 'Unnamed Product',
          sku: p.sku || `SKU-${p.id.slice(0, 6).toUpperCase()}`,
          category_id: p.category_id || '',
          selling_price: Number(p.selling_price || 0),
          cost_price: Number(p.cost_price || 0),
          stock_quantity: Number(p.stock_quantity || 0),
          min_stock_level: Number(p.minimum_stock ?? p.min_stock_level ?? 5),
          image_url: p.image_url || undefined,
          description: p.description || undefined,
          status: (p.stock_quantity <= 0 ? 'out_of_stock' : (p.is_active === false ? 'hidden' : 'active')) as Product['status'],
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));
        setProducts(formattedProds);
      }

      // Fetch categories
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (catErr) {
        handleSupabaseError('Fetch Categories', catErr);
      } else if (catData) {
        const formattedCats: Category[] = catData.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || undefined,
          image_url: c.image_url || undefined,
          status: c.is_active === false ? 'inactive' : 'active',
          sort_order: 0,
          created_at: c.created_at,
        }));
        setCategories(formattedCats);
      }

      // Fetch sales and sale_items
      const { data: salesData, error: salesErr } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: saleItemsData, error: itemsErr } = await supabase
        .from('sale_items')
        .select('*');

      if (salesErr) {
        handleSupabaseError('Fetch Sales', salesErr);
      }
      if (itemsErr) {
        handleSupabaseError('Fetch Sale Items', itemsErr);
      }

      if (salesData) {
        const allItems = saleItemsData || [];
        const formattedSales: Sale[] = salesData.map((s: any) => {
          const matchedItems = allItems.filter((item: any) => item.sale_id === s.id);
          const createdDate = s.created_at ? new Date(s.created_at) : new Date();
          const receiptNo = `MB-${s.id.slice(0, 5).toUpperCase()}`;

          return {
            id: s.id,
            receipt_number: receiptNo,
            date: createdDate.toISOString().split('T')[0],
            time: createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: s.created_at || new Date().toISOString(),
            worker_id: s.worker_id || '',
            worker_name: s.worker_name || 'Cashier',
            shift_id: null,
            customer_id: null,
            customer_name: 'Walk-in Guest',
            subtotal: Number(s.subtotal || s.total || 0),
            discount: Number(s.discount || 0),
            vat: 0,
            grand_total: Number(s.total || s.subtotal || 0),
            payment_method: (s.payment_method || 'Cash') as PaymentMethod,
            status: 'completed',
            notes: s.notes || undefined,
            items: matchedItems.map((mi: any) => ({
              id: mi.id,
              sale_id: s.id,
              product_id: mi.product_id || '',
              product_name: mi.product_name || 'Item',
              quantity: Number(mi.quantity || 1),
              unit_price: Number(mi.unit_price || 0),
              total_price: Number(mi.total_price || (mi.quantity * mi.unit_price) || 0),
            })),
          };
        });
        setSales(formattedSales);
      }

      // Fetch worker_shifts
      const { data: shiftData, error: shiftErr } = await supabase
        .from('worker_shifts')
        .select('*')
        .order('created_at', { ascending: false });

      if (shiftErr) {
        handleSupabaseError('Fetch Worker Shifts', shiftErr);
      } else if (shiftData) {
        const formattedShifts: Shift[] = shiftData.map((sh: any) => {
          return {
            id: sh.id,
            worker_id: sh.worker_id || '',
            worker_name: 'Staff Member',
            start_time: sh.started_at || sh.created_at || new Date().toISOString(),
            end_time: sh.ended_at || null,
            opening_cash: 0,
            expected_cash: Number(sh.total_sales || 0),
            actual_cash: null,
            cash_difference: null,
            cash_sales: Number(sh.total_sales || 0),
            pos_sales: 0,
            transfer_sales: 0,
            total_sales: Number(sh.total_sales || 0),
            transactions_count: 0,
            items_sold_count: 0,
            status: (sh.status || 'open') as Shift['status'],
            notes: undefined,
            created_at: sh.created_at || new Date().toISOString(),
          };
        });
        setShifts(formattedShifts);
      }

      // Fetch profiles (for workers/admins)
      const { data: profileData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (profErr) {
        handleSupabaseError('Fetch Profiles', profErr);
      } else if (profileData) {
        const formattedWorkers: Worker[] = profileData.map((p: any) => {
          return {
            id: p.id,
            name: p.full_name || p.email || 'Worker',
            email: p.email,
            role: (p.role || 'cashier') as Worker['role'],
            phone: p.phone || undefined,
            status: (p.status || 'active') as Worker['status'],
            total_sales_today: 0,
            transactions_count_today: 0,
            created_at: p.created_at || new Date().toISOString(),
          };
        });
        setWorkers(formattedWorkers);
      }

      // Fetch notifications
      const { data: notifData, error: notifErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifErr) {
        handleSupabaseError('Fetch Notifications', notifErr);
      } else if (notifData) {
        const formattedNotifs: NotificationItem[] = notifData.map((n: any) => {
          const d = n.created_at ? new Date(n.created_at) : new Date();
          return {
            id: n.id,
            title: n.title || 'Notification',
            message: n.message || '',
            type: (n.type || 'system') as NotificationItem['type'],
            date: d.toISOString().split('T')[0],
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: n.created_at || new Date().toISOString(),
            is_read: Boolean(n.is_read),
          };
        });
        setNotifications(formattedNotifs);
      }

      // Fetch activity_logs
      const { data: logData, error: logErr } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logErr) {
        handleSupabaseError('Fetch Activity Logs', logErr);
      } else if (logData) {
        const formattedLogs: ActivityLog[] = logData.map((l: any) => {
          const d = l.created_at ? new Date(l.created_at) : new Date();
          return {
            id: l.id,
            user_id: l.user_id || undefined,
            user_name: 'Admin',
            user_role: 'super_admin',
            action: l.action || 'Action',
            description: l.description || '',
            timestamp: l.created_at || new Date().toISOString(),
            date: d.toISOString().split('T')[0],
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
        setActivityLogs(formattedLogs);
      }

      // Fetch settings
      const { data: settingsData, error: settErr } = await supabase
        .from('settings')
        .select('*');

      if (settErr) {
        handleSupabaseError('Fetch Settings', settErr);
      } else if (settingsData && settingsData.length > 0) {
        const settMap: Record<string, any> = {};
        settingsData.forEach((s: any) => {
          settMap[s.key] = s.value;
        });
        setSettings(prev => ({
          ...prev,
          business_name: settMap.business_name || prev.business_name,
          phone: settMap.phone || prev.phone,
          email: settMap.email || prev.email,
          address: settMap.address || prev.address,
          vat_percentage: settMap.vat_percentage !== undefined ? Number(settMap.vat_percentage) : prev.vat_percentage,
        }));
      }

      setDbSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('Fatal sync error:', err);
      setDbSyncStatus('error');
      setLastDbError(err.message || 'Database connection error');
    }
  }, []);

  // =========================================================================
  // 2. AUTHENTICATION & SESSION MANAGEMENT (#7, #8)
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    // Check active session on startup
    const checkInitialSession = async () => {
      try {
        setIsLoadingAuth(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          handleSupabaseError('Get Session', sessionError);
        }

        if (session?.user && isMounted) {
          // Fetch profile to verify role
          const { data: profile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profError) {
            handleSupabaseError('Fetch Profile for Session', profError);
          }

          if (profile) {
            if (['super_admin', 'manager', 'admin'].includes(profile.role)) {
              setCurrentUser({
                id: profile.id,
                email: profile.email || session.user.email || '',
                full_name: profile.full_name || 'Admin User',
                role: profile.role,
                created_at: profile.created_at || new Date().toISOString(),
              });
            } else {
              // Deny access to cashiers/workers
              await supabase.auth.signOut();
              setCurrentUser(null);
            }
          } else {
            // Profile row not yet created, grant admin session for authenticated user
            setCurrentUser({
              id: session.user.id,
              email: session.user.email || 'admin@munajbar.com',
              full_name: session.user.user_metadata?.full_name || 'Admin User',
              role: 'super_admin',
              created_at: session.user.created_at || new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    };

    checkInitialSession();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        if (isMounted) setCurrentUser(null);
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (isMounted) {
          if (profile && ['super_admin', 'manager', 'admin'].includes(profile.role)) {
            setCurrentUser({
              id: profile.id,
              email: profile.email || session.user.email || '',
              full_name: profile.full_name || 'Admin User',
              role: profile.role,
              created_at: profile.created_at || new Date().toISOString(),
            });
          } else if (!profile) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email || 'admin@munajbar.com',
              full_name: session.user.user_metadata?.full_name || 'Admin User',
              role: 'super_admin',
              created_at: session.user.created_at || new Date().toISOString(),
            });
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Realtime Data Subscription (#19)
  useEffect(() => {
    refreshData();

    const channel = supabase
      .channel('munaj_bar_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sale_items' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_shifts' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => refreshData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  // =========================================================================
  // 3. LOGIN & LOGOUT HANDLERS (#7, #8)
  // =========================================================================
  const login = async (
    email: string, 
    password?: string, 
    role: 'super_admin' | 'manager' = 'super_admin'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoadingAuth(true);
    try {
      // 1. Attempt Supabase Auth signInWithPassword
      if (password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          handleSupabaseError('Login', authError);
          // If invalid credentials, provide clear error message
          setIsLoadingAuth(false);
          return { success: false, error: authError.message || 'Invalid credentials.' };
        }

        if (authData.user) {
          // Check role in profiles
          const { data: profile, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profErr) {
            handleSupabaseError('Profile Verification', profErr);
          }

          if (profile) {
            if (!['super_admin', 'manager', 'admin'].includes(profile.role)) {
              await supabase.auth.signOut();
              setIsLoadingAuth(false);
              return { success: false, error: 'You do not have permission to access the Admin Panel.' };
            }
            setCurrentUser({
              id: profile.id,
              email: profile.email || authData.user.email || '',
              full_name: profile.full_name || 'Admin User',
              role: profile.role,
              created_at: profile.created_at || new Date().toISOString(),
            });
          } else {
            // No profile row yet, auto-create admin profile row in DB
            try {
              await supabase.from('profiles').insert([{
                id: authData.user.id,
                email: authData.user.email || email,
                full_name: authData.user.email?.split('@')[0] || 'Super Admin',
                role: role || 'super_admin',
              }]);
            } catch (e) {
              console.warn('Could not auto-insert profile:', e);
            }

            setCurrentUser({
              id: authData.user.id,
              email: authData.user.email || email,
              full_name: 'Super Admin',
              role: role,
              created_at: new Date().toISOString(),
            });
          }

          await logActivity('Admin Login', `${email} logged into the Admin Panel.`, 'settings', authData.user.id);
          setIsLoadingAuth(false);
          return { success: true };
        }
      }

      // Fallback in case of quick dev access without password
      const user: AdminUser = {
        id: `admin-${Date.now()}`,
        email,
        full_name: role === 'super_admin' ? 'Alhaji Munaj (Super Admin)' : 'Olumide Bakare (Bar Manager)',
        role,
        created_at: new Date().toISOString(),
      };
      setCurrentUser(user);
      setIsLoadingAuth(false);
      return { success: true };
    } catch (err: any) {
      setIsLoadingAuth(false);
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
  };

  // =========================================================================
  // 4. ACTIVITY & NOTIFICATIONS LOGGERS
  // =========================================================================
  const logActivity = useCallback(async (
    action: string, 
    description: string, 
    entityType?: ActivityLog['entity_type'], 
    entityId?: string
  ) => {
    try {
      const { error } = await supabase.from('activity_logs').insert([{
        user_id: currentUser?.id || null,
        action,
        description,
        metadata: { entity_type: entityType, entity_id: entityId },
      }]);
      if (error) handleSupabaseError('Log Activity', error);
      await refreshData();
    } catch (err) {
      console.warn('Log activity error:', err);
    }
  }, [currentUser, refreshData]);

  const triggerNotification = useCallback(async (
    title: string,
    message: string,
    type: NotificationItem['type']
  ) => {
    try {
      const { error } = await supabase.from('notifications').insert([{
        title,
        message,
        type,
        is_read: false,
      }]);
      if (error) handleSupabaseError('Trigger Notification', error);
      await refreshData();
    } catch (err) {
      console.warn('Trigger notification error:', err);
    }
  }, [refreshData]);

  // =========================================================================
  // 5. PRODUCT ACTIONS (#12, #13)
  // =========================================================================
  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.from('products').insert([{
        name: productData.name,
        sku: productData.sku || null,
        category_id: productData.category_id || null,
        selling_price: Number(productData.selling_price || 0),
        cost_price: Number(productData.cost_price || 0),
        stock_quantity: Number(productData.stock_quantity || 0),
        minimum_stock: Number(productData.min_stock_level || 5),
        description: productData.description || null,
        image_url: productData.image_url || null,
        unit: 'bottle',
        is_active: productData.status !== 'hidden',
      }]).select().single();

      if (error) {
        handleSupabaseError('Add Product', error);
        return { success: false, error: error.message || 'Unable to save product. Please try again.' };
      }

      await logActivity('Product Created', `Added product "${productData.name}" (Stock: ${productData.stock_quantity})`, 'product', data?.id);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Add product error:', err);
      return { success: false, error: err.message || 'Failed to create product in database.' };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
      if (updates.category_id !== undefined) dbUpdates.category_id = updates.category_id || null;
      if (updates.selling_price !== undefined) dbUpdates.selling_price = Number(updates.selling_price);
      if (updates.cost_price !== undefined) dbUpdates.cost_price = Number(updates.cost_price);
      if (updates.stock_quantity !== undefined) dbUpdates.stock_quantity = Number(updates.stock_quantity);
      if (updates.min_stock_level !== undefined) dbUpdates.minimum_stock = Number(updates.min_stock_level);
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;
      if (updates.status !== undefined) dbUpdates.is_active = updates.status !== 'hidden';

      const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);

      if (error) {
        handleSupabaseError('Update Product', error);
        return { success: false, error: error.message || 'Unable to update product. Please try again.' };
      }

      await logActivity('Product Updated', `Updated details for product #${id}`, 'product', id);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Update product error:', err);
      return { success: false, error: err.message || 'Failed to update product.' };
    }
  };

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) {
        handleSupabaseError('Delete Product', error);
        return { success: false, error: error.message || 'Unable to delete product.' };
      }

      await logActivity('Product Deleted', `Removed product #${id} from database.`, 'product', id);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Delete product error:', err);
      return { success: false, error: err.message || 'Failed to delete product.' };
    }
  };

  const updateStock = async (id: string, newStock: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const target = products.find(p => p.id === id);
      const { error } = await supabase.from('products').update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      if (error) {
        handleSupabaseError('Update Stock', error);
        return { success: false, error: error.message || 'Unable to update inventory.' };
      }

      if (target) {
        if (newStock <= 0) {
          await triggerNotification('OUT OF STOCK', `${target.name} is now out of stock.`, 'out_of_stock');
        } else if (newStock <= target.min_stock_level) {
          await triggerNotification('LOW STOCK', `${target.name} is running low (${newStock} units remaining).`, 'low_stock');
        }
      }

      await logActivity('Inventory Restocked', `Adjusted stock for product #${id} to ${newStock} units`, 'inventory', id);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Update stock error:', err);
      return { success: false, error: err.message || 'Failed to update stock.' };
    }
  };

  // =========================================================================
  // 6. CATEGORY ACTIONS
  // =========================================================================
  const addCategory = async (catData: Omit<Category, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('categories').insert([{
        name: catData.name,
        description: catData.description || null,
        image_url: catData.image_url || null,
        is_active: catData.status !== 'inactive',
      }]);

      if (error) {
        handleSupabaseError('Add Category', error);
        return { success: false, error: error.message || 'Unable to create category.' };
      }

      await logActivity('Category Created', `Created category "${catData.name}"`, 'category');
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Add category error:', err);
      return { success: false, error: err.message || 'Failed to create category.' };
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;
      if (updates.status !== undefined) dbUpdates.is_active = updates.status !== 'inactive';

      const { error } = await supabase.from('categories').update(dbUpdates).eq('id', id);

      if (error) {
        handleSupabaseError('Update Category', error);
        return { success: false, error: error.message || 'Unable to update category.' };
      }

      await logActivity('Category Updated', `Updated category #${id}`, 'category', id);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Update category error:', err);
      return { success: false, error: err.message || 'Failed to update category.' };
    }
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) {
        handleSupabaseError('Delete Category', error);
        return { success: false, error: error.message || 'Unable to delete category.' };
      }

      await logActivity('Category Deleted', `Deleted category #${id}`, 'category', id);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Delete category error:', err);
      return { success: false, error: err.message || 'Failed to delete category.' };
    }
  };

  // =========================================================================
  // 7. WORKER & SHIFT ACTIONS (#15, #16)
  // =========================================================================
  const addWorker = async (
    workerData: Omit<Worker, 'id' | 'created_at' | 'total_sales_today' | 'transactions_count_today'> & { password: string }
  ): Promise<{ success: boolean; error?: string; email?: string }> => {
    try {
      const email = (workerData.email || '').trim().toLowerCase();
      const password = workerData.password || '';

      // ---- Server-safe validation (mirrors the form) ----
      if (!workerData.name?.trim()) return { success: false, error: 'Full name is required.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Please enter a valid email address.' };
      if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters.' };

      // 1. Create a REAL Supabase Authentication user for the worker.
      //    We use an ISOLATED client so the admin's own session on the main
      //    client is never replaced. This uses ONLY the public publishable
      //    (anon) key — the service-role/secret key is never used in the browser.
      const authClient = createIsolatedAuthClient();
      const { data: signUpData, error: signUpError } = await authClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: workerData.name, role: workerData.role },
        },
      });

      if (signUpError) {
        const msg = (signUpError.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          return { success: false, error: 'This email address is already registered.' };
        }
        handleSupabaseError('Create Worker Auth', signUpError);
        return { success: false, error: signUpError.message || 'Unable to create the worker login account.' };
      }

      const authUser = signUpData.user;
      // Supabase returns a user object with an empty identities array when the
      // email already belongs to an existing account (no new account created).
      if (!authUser || (Array.isArray(authUser.identities) && authUser.identities.length === 0)) {
        return { success: false, error: 'This email address is already registered.' };
      }

      // 2. Save the worker profile and LINK it to the auth user (auth.users.id -> profiles.id).
      const baseProfile = {
        id: authUser.id,
        email,
        full_name: workerData.name,
        role: workerData.role,
        phone: workerData.phone || null,
      };

      let { error: profileError } = await supabase
        .from('profiles')
        .insert([{ ...baseProfile, status: workerData.status }]);

      // Gracefully support databases whose `profiles` table has no `status` column yet.
      if (profileError && (profileError.code === 'PGRST204' || /status/i.test(profileError.message || ''))) {
        const retry = await supabase.from('profiles').insert([baseProfile]);
        profileError = retry.error;
      }

      if (profileError) {
        // Auth user exists but the profile could not be saved. We cannot delete
        // the auth user from the browser (that needs the service role), so we
        // surface a clear, actionable error instead of leaving silent drift.
        handleSupabaseError('Create Worker Profile', profileError);
        return {
          success: false,
          error: `Login was created but saving the worker profile failed (${profileError.message}). Please contact your administrator before retrying.`,
        };
      }

      await logActivity(
        'Worker Registered',
        `Registered worker "${workerData.name}" (${workerData.role}) with a POS login account`,
        'worker',
        authUser.id
      );
      await refreshData();
      return { success: true, email };
    } catch (err: any) {
      console.error('Add worker error:', err);
      return { success: false, error: err.message || 'Failed to register worker.' };
    }
  };

  const updateWorker = async (id: string, updates: Partial<Worker>): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.full_name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      let { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);

      // Gracefully support databases whose `profiles` table has no `status` column yet.
      if (error && (error.code === 'PGRST204' || /status/i.test(error.message || ''))) {
        const { status, ...withoutStatus } = dbUpdates;
        const retry = await supabase.from('profiles').update(withoutStatus).eq('id', id);
        error = retry.error;
      }

      if (error) {
        handleSupabaseError('Update Worker', error);
        return { success: false, error: error.message || 'Unable to update worker.' };
      }

      await logActivity('Worker Updated', `Updated staff profile #${id}`, 'worker', id);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Update worker error:', err);
      return { success: false, error: err.message || 'Failed to update worker.' };
    }
  };

  const startShift = async (workerId: string, _openingCash: number): Promise<{ success: boolean; shift?: Shift; error?: string }> => {
    try {
      const { data, error } = await supabase.from('worker_shifts').insert([{
        worker_id: workerId || null,
        started_at: new Date().toISOString(),
        total_sales: 0,
        status: 'open',
      }]).select().single();

      if (error) {
        handleSupabaseError('Start Shift', error);
        return { success: false, error: error.message || 'Unable to start shift in database.' };
      }

      await triggerNotification('WORKER STARTED SHIFT', `A staff member started a new shift.`, 'worker_shift_start');
      await logActivity('Shift Started', `Shift started (ID: ${data.id})`, 'shift', data.id);
      await refreshData();

      const newShift: Shift = {
        id: data.id,
        worker_id: workerId,
        worker_name: 'Staff Member',
        start_time: data.started_at || new Date().toISOString(),
        end_time: null,
        opening_cash: 0,
        expected_cash: 0,
        cash_sales: 0,
        pos_sales: 0,
        transfer_sales: 0,
        total_sales: 0,
        transactions_count: 0,
        items_sold_count: 0,
        status: 'open',
        created_at: data.created_at || new Date().toISOString(),
      };

      return { success: true, shift: newShift };
    } catch (err: any) {
      console.error('Start shift error:', err);
      return { success: false, error: err.message || 'Failed to start shift.' };
    }
  };

  const closeShift = async (shiftId: string, actualCash: number, notes?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('worker_shifts').update({
        ended_at: new Date().toISOString(),
        status: 'closed',
        updated_at: new Date().toISOString(),
      }).eq('id', shiftId);

      if (error) {
        handleSupabaseError('Close Shift', error);
        return { success: false, error: error.message || 'Unable to close shift.' };
      }

      await triggerNotification('WORKER ENDED SHIFT', `Staff closed shift #${shiftId}.`, 'worker_shift_end');
      await logActivity('Shift Closed', `Closed shift #${shiftId} (Reconciliation cash: ₦${actualCash.toLocaleString()}) ${notes ? `Notes: ${notes}` : ''}`, 'shift', shiftId);
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Close shift error:', err);
      return { success: false, error: err.message || 'Failed to close shift.' };
    }
  };

  // =========================================================================
  // 8. RECORD SALE / WORKER POS INTEGRATION (#11, #13, #14)
  // =========================================================================
  const recordSale = async (saleData: {
    worker_id?: string;
    worker_name?: string;
    shift_id?: string;
    customer_id?: string | null;
    customer_name?: string;
    payment_method: PaymentMethod;
    items: Array<{ product_id: string; quantity: number }>;
    discount?: number;
    notes?: string;
    printed_by?: string;
  }): Promise<{ success: boolean; sale?: Sale; error?: string }> => {
    try {
      // 1. Calculate pricing
      let subtotal = 0;
      const saleItemsToInsert: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }> = [];

      for (const req of saleData.items) {
        const prod = products.find(p => p.id === req.product_id);
        if (!prod) {
          return { success: false, error: `Product not found in database: ${req.product_id}` };
        }
        if (prod.stock_quantity < req.quantity) {
          return { 
            success: false, 
            error: `Insufficient stock for "${prod.name}". Available: ${prod.stock_quantity}, Requested: ${req.quantity}` 
          };
        }
        const itemTotal = prod.selling_price * req.quantity;
        subtotal += itemTotal;
        saleItemsToInsert.push({
          product_id: prod.id,
          product_name: prod.name,
          quantity: req.quantity,
          unit_price: prod.selling_price,
          total_price: itemTotal,
        });
      }

      const discount = saleData.discount || 0;
      const grandTotal = Math.max(0, subtotal - discount);

      // 2. Insert Sale into `sales` in Supabase
      const { data: saleRow, error: saleErr } = await supabase
        .from('sales')
        .insert([{
          worker_id: saleData.worker_id || null,
          worker_name: saleData.worker_name || 'Cashier',
          subtotal,
          discount,
          total: grandTotal,
          payment_method: saleData.payment_method,
          payment_status: 'completed',
          notes: saleData.notes || null,
        }])
        .select()
        .single();

      if (saleErr) {
        handleSupabaseError('Record Sale', saleErr);
        return { success: false, error: saleErr.message || 'Unable to record transaction in database.' };
      }

      // 3. Insert Sale Items into `sale_items` in Supabase
      if (saleItemsToInsert.length > 0) {
        const itemsWithSaleId = saleItemsToInsert.map(item => ({
          ...item,
          sale_id: saleRow.id,
        }));
        const { error: itemsErr } = await supabase.from('sale_items').insert(itemsWithSaleId);
        if (itemsErr) handleSupabaseError('Insert Sale Items', itemsErr);
      }

      // 4. Decrease stock quantity in `products` in Supabase
      for (const req of saleData.items) {
        const prod = products.find(p => p.id === req.product_id);
        if (prod) {
          const newQty = Math.max(0, prod.stock_quantity - req.quantity);
          const { error: stockErr } = await supabase
            .from('products')
            .update({
              stock_quantity: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', prod.id);

          if (stockErr) handleSupabaseError('Deduct Stock', stockErr);

          if (newQty <= 0) {
            await triggerNotification('OUT OF STOCK', `${prod.name} is now OUT OF STOCK!`, 'out_of_stock');
          } else if (newQty <= prod.min_stock_level) {
            await triggerNotification('LOW STOCK ALERT', `${prod.name} is running low (${newQty} units left).`, 'low_stock');
          }
        }
      }

      // 5. Trigger sale notification
      const receiptNo = `MB-${saleRow.id.slice(0, 5).toUpperCase()}`;
      if (grandTotal >= 50000) {
        await triggerNotification('LARGE SALE ALERT', `Transaction of ₦${grandTotal.toLocaleString()} completed via ${saleData.payment_method}.`, 'large_sale');
      } else {
        await triggerNotification('NEW SALE', `Sale #${receiptNo} completed for ₦${grandTotal.toLocaleString()}.`, 'new_sale');
      }

      await logActivity('Sale Completed', `Sale #${receiptNo} for ₦${grandTotal.toLocaleString()} (${saleData.payment_method})`, 'sale', saleRow.id);

      // 6. Refresh data from Supabase
      await refreshData();

      const createdDate = saleRow.created_at ? new Date(saleRow.created_at) : new Date();
      const completedSale: Sale = {
        id: saleRow.id,
        receipt_number: receiptNo,
        date: createdDate.toISOString().split('T')[0],
        time: createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: saleRow.created_at || new Date().toISOString(),
        worker_id: saleData.worker_id || '',
        worker_name: saleData.worker_name || 'Cashier',
        shift_id: null,
        customer_id: null,
        customer_name: saleData.customer_name || 'Walk-in Guest',
        subtotal,
        discount,
        vat: 0,
        grand_total: grandTotal,
        payment_method: saleData.payment_method,
        status: 'completed',
        printed_by: saleData.printed_by || 'MUNAJ BAR POS',
        printed_at: new Date().toISOString(),
        notes: saleData.notes,
        items: saleItemsToInsert.map((item, idx) => ({
          id: `item-${idx}`,
          sale_id: saleRow.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      };

      return { success: true, sale: completedSale };
    } catch (err: any) {
      console.error('Record sale error:', err);
      return { success: false, error: err.message || 'Failed to complete transaction.' };
    }
  };

  // =========================================================================
  // 9. NOTIFICATIONS & SETTINGS ACTIONS
  // =========================================================================
  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) handleSupabaseError('Mark Notification Read', error);
      await refreshData();
    } catch (err) {
      console.error('Mark notification error:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      if (error) handleSupabaseError('Mark All Notifications Read', error);
      await refreshData();
    } catch (err) {
      console.error('Mark all notifications error:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<BusinessSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings }));
      const entries = Object.entries(newSettings);
      for (const [key, val] of entries) {
        await supabase.from('settings').upsert({
          key,
          value: String(val),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      }

      await logActivity('Settings Updated', 'Admin modified system business settings.', 'settings');
      await refreshData();
      return { success: true };
    } catch (err: any) {
      console.error('Update settings error:', err);
      return { success: false, error: err.message || 'Failed to update settings.' };
    }
  };

  const printReceipt = (sale: Sale, printedBy?: string) => {
    const actor = printedBy || currentUser?.full_name || 'Admin Console';
    const now = new Date().toISOString();
    
    setSelectedSaleForReceipt({ ...sale, printed_by: actor, printed_at: now });
    logActivity('Receipt Printed', `Thermal receipt for #${sale.receipt_number} printed by ${actor}`, 'sale', sale.id);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <AdminContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoadingAuth,
        login,
        logout,
        currentView,
        setCurrentView,
        selectedSaleForReceipt,
        setSelectedSaleForReceipt,
        selectedShiftForDetail,
        setSelectedShiftForDetail,
        selectedWorkerForDetail,
        setSelectedWorkerForDetail,
        isLiveSupabase,
        dbSyncStatus,
        lastSyncTime,
        lastDbError,
        refreshData,
        products,
        categories,
        workers,
        shifts,
        sales,
        customers,
        notifications,
        activityLogs,
        settings,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        addCategory,
        updateCategory,
        deleteCategory,
        addWorker,
        updateWorker,
        startShift,
        closeShift,
        recordSale,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        logActivity,
        updateSettings,
        printReceipt,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
