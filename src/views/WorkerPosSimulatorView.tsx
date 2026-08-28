import React, { useState, useMemo, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { createIsolatedAuthClient } from '../lib/supabase';
import { Product, PaymentMethod, SaleItem, Worker, WorkerRole, WorkerStatus } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  Store, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Printer, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Sparkles,
  AlertTriangle,
  Lock,
  LogOut,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthedWorker {
  id: string;
  name: string;
  email: string;
  role: WorkerRole;
  status: WorkerStatus;
}

const POS_ROLES: WorkerRole[] = ['cashier', 'bartender', 'general_worker'];

export const WorkerPosSimulatorView: React.FC = () => {
  const { 
    products, 
    categories, 
    workers, 
    shifts, 
    settings, 
    processSale, 
    startShift, 
    printReceipt 
  } = useAdmin();

  // ---- Worker POS Authentication (real Supabase Auth) ----
  const [authedWorker, setAuthedWorker] = useState<AuthedWorker | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Dedicated auth client so the worker's session never overwrites the admin's.
  const authClientRef = useRef<SupabaseClient | null>(null);

  // Selected Worker & Shift — the authenticated worker IS the selected worker.
  const selectedWorkerId = authedWorker?.id || '';
  const activeShift = useMemo(() => {
    return shifts.find(s => s.worker_id === selectedWorkerId && s.status === 'open');
  }, [shifts, selectedWorkerId]);

  // POS Cart State
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('POS');
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSaleResult, setCompletedSaleResult] = useState<any | null>(null);

  const selectedWorker: Worker | AuthedWorker | undefined =
    workers.find(w => w.id === selectedWorkerId) || authedWorker || undefined;

  // ---- Worker POS login handler ----
  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const email = loginEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      // Isolated client keeps the worker's session out of the admin session.
      const authClient = createIsolatedAuthClient();
      authClientRef.current = authClient;

      const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (authError || !authData.user) {
        setLoginError('Invalid email or password.');
        setIsLoggingIn(false);
        return;
      }

      // Retrieve the worker's profile (RLS-safe: uses the worker's own session).
      const { data: profile, error: profErr } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profErr || !profile) {
        await authClient.auth.signOut();
        setLoginError('We could not find your worker profile. Please contact your administrator.');
        setIsLoggingIn(false);
        return;
      }

      const role = profile.role as WorkerRole;
      const status = (profile.status as WorkerStatus) || 'active';

      // Verify POS role
      if (!POS_ROLES.includes(role)) {
        await authClient.auth.signOut();
        setLoginError('This account does not have Worker POS access.');
        setIsLoggingIn(false);
        return;
      }

      // Verify employment status
      if (status !== 'active') {
        await authClient.auth.signOut();
        setLoginError('Your worker account is currently inactive. Please contact your administrator.');
        setIsLoggingIn(false);
        return;
      }

      setAuthedWorker({
        id: profile.id,
        name: profile.full_name || email,
        email: profile.email || email,
        role,
        status,
      });
      setLoginPassword('');
      setLoginEmail('');
    } catch (err: any) {
      console.error('Worker POS login error:', err);
      setLoginError('Something went wrong while signing in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleWorkerLogout = async () => {
    try {
      await authClientRef.current?.auth.signOut();
    } catch {
      /* no-op */
    }
    authClientRef.current = null;
    setAuthedWorker(null);
    setCart([]);
    setDiscountAmount(0);
    setCustomerName('Walk-in Guest');
    setCompletedSaleResult(null);
  };

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.selling_price * item.quantity), 0);
  }, [cart]);

  const vat = useMemo(() => {
    return Math.round((subtotal - discountAmount) * (settings.vat_percentage / 100));
  }, [subtotal, discountAmount, settings.vat_percentage]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + vat);
  }, [subtotal, discountAmount, vat]);

  // Add to cart
  const handleAddToCart = (prod: Product) => {
    if (prod.stock_quantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        if (existing.quantity >= prod.stock_quantity) return prev;
        return prev.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, { product: prod, quantity: 1 }];
      }
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock_quantity) return item;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as Array<{ product: Product; quantity: number }>;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Start shift if not open
  const handleQuickStartShift = async () => {
    if (!selectedWorker) return;
    await startShift(selectedWorker.id, selectedWorker.name, 20000);
  };

  // Submit POS Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0 || !selectedWorker) return;

    setIsProcessing(true);

    const saleItems: SaleItem[] = cart.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.selling_price,
      total_price: item.product.selling_price * item.quantity,
    }));

    const result = await processSale({
      worker_id: selectedWorker.id,
      worker_name: selectedWorker.name,
      customer_name: customerName.trim() || 'Walk-in Guest',
      shift_id: activeShift ? activeShift.shift_id : 'SHIFT-STANDALONE',
      items: saleItems,
      subtotal,
      discount: discountAmount,
      vat,
      grand_total: grandTotal,
      payment_method: paymentMethod,
      printed_by: `${selectedWorker.name} (POS)`,
    });

    setIsProcessing(false);

    if (result.success && result.sale) {
      setCompletedSaleResult(result.sale);
      setCart([]);
      setDiscountAmount(0);
      setCustomerName('Walk-in Guest');
    }
  };

  // Filter products by category
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'all') return p.status === 'active';
    return p.category_id === selectedCategory && p.status === 'active';
  });

  // ---- Worker POS Login Gate ----
  if (!authedWorker) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-2xl p-7">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">MUNAJ BAR Worker POS</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Sign in with your worker email and password to start selling
              </p>
            </div>

            <form onSubmit={handleWorkerLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="worker@munajbar.com"
                    autoComplete="username"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/70"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {loginError && (
                <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-500/40 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
              >
                {isLoggingIn ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In to POS
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-neutral-500 mt-4">
            Accounts are created by your administrator in the Workers section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/20 border border-neutral-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Worker POS Live Simulator</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Test and verify worker cashier sales, shift linkage, automatic stock deduction, and real-time admin sync
          </p>
        </div>

        {/* Logged-in Worker + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <div className="leading-tight">
              <p className="text-xs text-white font-semibold">{authedWorker?.name}</p>
              <p className="text-[10px] text-neutral-400 capitalize">{authedWorker?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={handleWorkerLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          {!activeShift && (
            <button
              onClick={handleQuickStartShift}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Start Shift (₦20k Float)
            </button>
          )}
        </div>
      </div>

      {/* POS Grid: Left Catalog, Right Order Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Beverage & Food Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              All Items ({products.filter(p => p.status === 'active').length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((prod) => {
              const isOut = prod.stock_quantity <= 0;
              const isLow = prod.stock_quantity > 0 && prod.stock_quantity <= prod.min_stock_level;
              const inCart = cart.find(item => item.product.id === prod.id);

              return (
                <button
                  key={prod.id}
                  disabled={isOut}
                  onClick={() => handleAddToCart(prod)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition relative overflow-hidden group ${
                    isOut 
                      ? 'bg-neutral-950/60 border-neutral-900 opacity-40 cursor-not-allowed'
                      : inCart
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md'
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-emerald-500/40 hover:bg-neutral-850'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-neutral-950 font-extrabold text-[10px]">
                      {inCart.quantity}x
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-medium truncate">{prod.category_name}</span>
                    <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-2 leading-snug">{prod.name}</h4>
                  </div>

                  <div className="pt-3 flex items-baseline justify-between w-full">
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">
                      ₦{prod.selling_price.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-mono ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-neutral-500'}`}>
                      {isOut ? 'OUT' : `${prod.stock_quantity} left`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Active Order Terminal (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          
          <div>
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Current Order Cart</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-red-400 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Guest / Shift Info */}
            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-500 block">Customer</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest / Table"
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 block">Active Shift</label>
                <div className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 font-mono text-[11px] truncate">
                  {activeShift ? activeShift.shift_id : 'No Open Shift'}
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Cart is empty. Click any product from the catalog to add items.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <h5 className="font-semibold text-white truncate text-[11px]">{item.product.name}</h5>
                      <span className="font-mono text-emerald-400 text-[11px]">
                        ₦{item.product.selling_price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                        <button
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="p-1 hover:text-white text-neutral-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 font-mono font-bold text-white text-[11px]">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="p-1 hover:text-white text-neutral-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-white text-[11px] w-14 text-right">
                        ₦{(item.product.selling_price * item.quantity).toLocaleString()}
                      </span>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment & Order Calculation Summary */}
          <div className="pt-3 border-t border-neutral-800 space-y-3">
            
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'POS' as PaymentMethod, label: 'POS Card', icon: CreditCard },
                { id: 'Cash' as PaymentMethod, label: 'Cash', icon: Banknote },
                { id: 'Transfer' as PaymentMethod, label: 'Transfer', icon: Smartphone },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-2 rounded-xl flex flex-col items-center gap-1 text-[11px] font-bold border transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal:</span>
                <span className="font-mono">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>VAT ({settings.vat_percentage}%):</span>
                <span className="font-mono">₦{vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-neutral-800">
                <span>Total Due:</span>
                <span className="font-mono text-emerald-400 text-base">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCompleteSale}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Charge ₦{grandTotal.toLocaleString()} & Issue Receipt</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

      {/* Sale Complete Success Toast / Modal */}
      {completedSaleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-emerald-500/50 rounded-2xl shadow-2xl p-6 text-neutral-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">POS Transaction Completed!</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Receipt <strong className="text-white font-mono">{completedSaleResult.receipt_number}</strong>
              </p>
              <p className="text-base font-extrabold text-emerald-400 font-mono mt-1">
                ₦{completedSaleResult.grand_total.toLocaleString()} ({completedSaleResult.payment_method})
              </p>
            </div>

            <p className="text-[11px] text-neutral-400">
              Stock automatically deducted & synchronized in real time to Admin Dashboard.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  printReceipt(completedSaleResult);
                  setCompletedSaleResult(null);
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Thermal Receipt
              </button>
              <button
                onClick={() => setCompletedSaleResult(null)}
                className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
