import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { BusinessSettings } from '../types';
import { 
  Settings, 
  Store, 
  Printer, 
  Database, 
  Save, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import { SUPABASE_SCHEMA_SQL, getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, refreshData, dbSyncStatus } = useAdmin();

  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'supabase'>('business');

  // Supabase Config
  const [supabaseUrl, setSupabaseUrl] = useState(getSupabaseConfig().url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(getSupabaseConfig().anonKey);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState<boolean | null>(null);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectSuccess(null);

    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    await refreshData();

    setIsConnecting(false);
    setConnectSuccess(true);
    setTimeout(() => setConnectSuccess(null), 3000);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Settings & Integrations</h2>
          <p className="text-xs text-neutral-400">
            Configure MUNAJ BAR business profile, 80mm thermal receipts, tax rates (₦), and Supabase backend
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl animate-in fade-in">
            <Check className="w-4 h-4" />
            Settings Updated!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="p-1 bg-neutral-950 rounded-xl border border-neutral-800 flex gap-1 max-w-xl">
        <button
          onClick={() => setActiveTab('business')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'business' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Store className="w-4 h-4" />
          Business Info
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'receipt' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Printer className="w-4 h-4" />
          Receipt & Tax
        </button>
        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'supabase' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Supabase Database
        </button>
      </div>

      {/* TAB 1: BUSINESS PROFILE */}
      {activeTab === 'business' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSaveBusiness} className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Establishment Details</h3>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Bar / Business Name *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500/70"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Physical Bar Location / Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/70"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Business Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: RECEIPT & TAX SETTINGS */}
      {activeTab === 'receipt' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSaveBusiness} className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Thermal Receipt & Financial Rules</h3>

            {/* Currency Note */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">System Currency</span>
                <p className="text-[11px] text-neutral-400">Strictly formatted in Nigerian Naira (₦ / NGN)</p>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-700">
                ₦ NGN
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Value Added Tax (VAT %)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.vat_percentage}
                onChange={(e) => setFormData({ ...formData, vat_percentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500/70"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">Default Nigerian VAT is 7.5%</span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Receipt Header Tagline</label>
              <textarea
                rows={2}
                value={formData.receipt_header}
                onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Receipt Footer Message</label>
              <textarea
                rows={2}
                value={formData.receipt_footer}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/70"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_cashier}
                  onChange={(e) => setFormData({ ...formData, show_cashier: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 focus:ring-offset-0 bg-neutral-900 border-neutral-700"
                />
                <div>
                  <span className="font-semibold text-white">Display Cashier / Worker Name on Receipt</span>
                  <p className="text-[11px] text-neutral-400">Prints the staff member's name for shift accountability</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_receipt_number}
                  onChange={(e) => setFormData({ ...formData, show_receipt_number: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 focus:ring-offset-0 bg-neutral-900 border-neutral-700"
                />
                <div>
                  <span className="font-semibold text-white">Display Unique Serialized Receipt Number</span>
                  <p className="text-[11px] text-neutral-400">Essential for customer lookup and audits</p>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Receipt Configurations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SUPABASE INTEGRATION & SQL MIGRATION */}
      {activeTab === 'supabase' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Live Supabase Project Connection
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Link this Admin Panel and the Worker POS directly to your existing Supabase database
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className={`w-2.5 h-2.5 rounded-full ${dbSyncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-xs font-bold text-neutral-200">
                {dbSyncStatus === 'synced' ? 'Connected & Live' : 'System Connected'}
              </span>
            </div>
          </div>

          <form onSubmit={handleConnectSupabase} className="space-y-4 max-w-2xl text-xs">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500/70"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Supabase Public Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500/70"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Never enter your service-role key. Only public client anon key.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isConnecting}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center gap-2"
              >
                {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isConnecting ? 'Testing Connection...' : 'Save & Synchronize Supabase'}
              </button>

              {connectSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Connected Successfully!
                </span>
              )}
            </div>
          </form>

          {/* SQL Schema Copy Section */}
          <div className="pt-6 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  PostgreSQL Schema & RLS Policies
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Execute this SQL in your Supabase SQL Editor to set up all tables and permissions
                </p>
              </div>

              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {sqlCopied ? 'Copied to Clipboard' : 'Copy SQL Schema'}
              </button>
            </div>

            <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-emerald-400/90 overflow-x-auto max-h-60">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>

        </div>
      )}

    </div>
  );
};
