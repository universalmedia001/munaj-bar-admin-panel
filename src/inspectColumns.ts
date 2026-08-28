import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://koquuccenxpkerwkehyt.supabase.co';
const supabasePublishableKey = 'sb_publishable_YvpzSQMR6oXxXL_qseMOCA_0-ZYi7_7';
const supabase = createClient(supabaseUrl, supabasePublishableKey);

async function inspectColumns() {
  const tables = [
    'profiles',
    'categories',
    'sales',
    'sale_items',
    'worker_shifts',
    'payments',
    'notifications',
    'activity_logs',
    'settings'
  ];

  for (const table of tables) {
    // Try to select with limit 0 or insert a dummy with invalid structure or check error hints
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`\n================== TABLE: ${table} ==================`);
    if (error) {
      console.log(`Error querying ${table}:`, error.message);
    } else {
      console.log(`Success querying ${table}. Found ${data.length} rows.`);
    }

    // Let's test columns by querying specific candidate columns
    const candidateColumns: Record<string, string[]> = {
      profiles: ['id', 'email', 'full_name', 'role', 'avatar_url', 'phone', 'is_active', 'created_at', 'updated_at', 'username', 'name'],
      categories: ['id', 'name', 'description', 'image_url', 'status', 'is_active', 'sort_order', 'created_at', 'updated_at', 'slug'],
      sales: ['id', 'receipt_number', 'date', 'time', 'timestamp', 'created_at', 'worker_id', 'worker_name', 'cashier_id', 'cashier_name', 'shift_id', 'customer_id', 'customer_name', 'subtotal', 'discount', 'vat', 'tax', 'grand_total', 'total_amount', 'payment_method', 'status', 'printed_by', 'printed_at', 'notes'],
      sale_items: ['id', 'sale_id', 'product_id', 'product_name', 'name', 'sku', 'quantity', 'unit_price', 'price', 'cost_price', 'total_price', 'subtotal', 'created_at'],
      worker_shifts: ['id', 'worker_id', 'worker_name', 'user_id', 'staff_name', 'start_time', 'end_time', 'opening_cash', 'opening_float', 'expected_cash', 'actual_cash', 'closing_cash', 'cash_difference', 'difference', 'cash_sales', 'pos_sales', 'transfer_sales', 'total_sales', 'transactions_count', 'items_sold_count', 'status', 'notes', 'created_at'],
      payments: ['id', 'sale_id', 'payment_method', 'amount', 'status', 'reference', 'created_at'],
      notifications: ['id', 'title', 'message', 'type', 'date', 'time', 'timestamp', 'created_at', 'is_read', 'metadata', 'read'],
      activity_logs: ['id', 'user_id', 'user_name', 'user_role', 'action', 'description', 'entity_type', 'entity_id', 'timestamp', 'created_at', 'date', 'time'],
      settings: ['id', 'business_name', 'phone', 'email', 'address', 'logo_url', 'receipt_header', 'receipt_footer', 'vat_percentage', 'tax_rate', 'show_cashier', 'show_receipt_number', 'currency_symbol', 'currency_code', 'updated_at', 'created_at', 'key', 'value']
    };

    if (candidateColumns[table]) {
      const validCols: string[] = [];
      for (const col of candidateColumns[table]) {
        const { error: colErr } = await supabase.from(table).select(col).limit(1);
        if (!colErr) {
          validCols.push(col);
        }
      }
      console.log(`Table [${table}] VALID COLUMNS:`, validCols);
    }
  }
}

inspectColumns();
