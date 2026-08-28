export type UserRole = 'super_admin' | 'manager' | 'cashier' | 'worker';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export type WorkerStatus = 'active' | 'offline' | 'on_shift' | 'off_shift';
export type WorkerRole = 'cashier' | 'worker' | 'bartender' | 'manager';

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: WorkerRole;
  phone?: string;
  status: WorkerStatus;
  current_shift_id?: string | null;
  shift_start?: string | null;
  last_activity?: string;
  total_sales_today: number;
  transactions_count_today: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  status: 'active' | 'inactive';
  sort_order?: number;
  created_at?: string;
}

export type ProductStatus = 'active' | 'out_of_stock' | 'hidden';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name?: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  image_url?: string;
  description?: string;
  status: ProductStatus;
  created_at?: string;
  updated_at?: string;
}

export type ShiftStatus = 'open' | 'closed';

export interface Shift {
  id: string;
  worker_id: string;
  worker_name: string;
  start_time: string;
  end_time?: string | null;
  opening_cash: number;
  expected_cash: number;
  actual_cash?: number | null;
  cash_difference?: number | null;
  cash_sales: number;
  pos_sales: number;
  transfer_sales: number;
  total_sales: number;
  transactions_count: number;
  items_sold_count: number;
  status: ShiftStatus;
  notes?: string;
  created_at: string;
}

export type PaymentMethod = 'Cash' | 'POS' | 'Transfer';
export type SaleStatus = 'completed' | 'pending' | 'cancelled' | 'refunded';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  total_price: number;
}

export interface Sale {
  id: string;
  receipt_number: string;
  date: string;
  time: string;
  timestamp: string;
  worker_id: string;
  worker_name: string;
  shift_id?: string | null;
  customer_id?: string | null;
  customer_name?: string;
  subtotal: number;
  discount: number;
  vat: number;
  grand_total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  printed_by?: string;
  printed_at?: string;
  notes?: string;
  items: SaleItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  total_purchases: number;
  total_spending: number;
  last_purchase_at?: string;
  orders_count: number;
  notes?: string;
  created_at: string;
}

export type NotificationType = 
  | 'new_sale'
  | 'worker_shift_start'
  | 'worker_shift_end'
  | 'low_stock'
  | 'out_of_stock'
  | 'large_sale'
  | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  time: string;
  timestamp: string;
  is_read: boolean;
  metadata?: Record<string, any>;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  entity_type?: 'sale' | 'product' | 'worker' | 'shift' | 'inventory' | 'settings' | 'category';
  entity_id?: string;
  timestamp: string;
  date: string;
  time: string;
}

export interface BusinessSettings {
  business_name: string;
  phone: string;
  email: string;
  address: string;
  logo_url?: string;
  receipt_header: string;
  receipt_footer: string;
  vat_percentage: number;
  show_cashier: boolean;
  show_receipt_number: boolean;
  currency_symbol: string;
  currency_code: string;
}

export type AdminView = 
  | 'dashboard'
  | 'sales'
  | 'orders'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'out_of_stock'
  | 'workers'
  | 'shifts'
  | 'customers'
  | 'reports'
  | 'notifications'
  | 'activity_log'
  | 'settings'
  | 'pos_simulator';
