import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isLoadingAuth } = useAdmin();
  const [email, setEmail] = useState('admin@munajbar.com');
  const [password, setPassword] = useState('admin12345');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'manager'>('super_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your administrative email and password.');
      return;
    }

    const result = await login(email, password, selectedRole);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials or unauthorized role.');
    }
  };

  const handleDemoSelect = (role: 'super_admin' | 'manager', demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('admin12345');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/60 mb-3">
            <span className="text-emerald-400 font-extrabold text-2xl tracking-wider">MB</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">MUNAJ BAR</h1>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Executive Administration Console
          </p>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Authorized Super Admins & Bar Managers Only. Workers/Cashiers must use the Worker POS app.
          </p>
        </div>

        {/* Role Segmented Selector */}
        <div className="mb-6 p-1 bg-neutral-950 rounded-xl border border-neutral-800 flex gap-1">
          <button
            type="button"
            onClick={() => handleDemoSelect('super_admin', 'admin@munajbar.com')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              selectedRole === 'super_admin'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('manager', 'manager@munajbar.com')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              selectedRole === 'manager'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Bar Manager
          </button>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Admin Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@munajbar.com"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-300">Security Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoadingAuth}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            {isLoadingAuth ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Warning Notice */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Role-Based Access Protected. Cashiers, Bartenders and Floor Staff must conduct sales via the <strong className="text-neutral-400">MUNAJ BAR Worker POS Application</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
