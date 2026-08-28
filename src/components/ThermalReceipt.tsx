import React from 'react';
import { Sale, BusinessSettings } from '../types';
import { Printer, X, Check, Copy } from 'lucide-react';

interface ThermalReceiptProps {
  sale: Sale | null;
  settings: BusinessSettings;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale, settings, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textReceipt = `
========================================
             ${settings.business_name}
${settings.receipt_header}
----------------------------------------
Tel: ${settings.phone}
Address: ${settings.address}
----------------------------------------
Receipt No: ${sale.receipt_number}
Date: ${sale.date}  Time: ${sale.time}
Cashier: ${sale.worker_name}
Customer: ${sale.customer_name || 'Walk-in Guest'}
----------------------------------------
ITEMS:
${sale.items.map(item => `${item.product_name}\n  ${item.quantity} x ₦${item.unit_price.toLocaleString()} = ₦${item.total_price.toLocaleString()}`).join('\n')}
----------------------------------------
Subtotal:        ₦${sale.subtotal.toLocaleString()}
${sale.discount > 0 ? `Discount:       -₦${sale.discount.toLocaleString()}\n` : ''}VAT (${settings.vat_percentage}%):     ₦${sale.vat.toLocaleString()}
----------------------------------------
TOTAL:           ₦${sale.grand_total.toLocaleString()}
PAYMENT METHOD:  ${sale.payment_method}
STATUS:          ${sale.status.toUpperCase()}
----------------------------------------
Printed By: ${sale.printed_by || 'MUNAJ BAR Admin'}
Time: ${new Date().toLocaleTimeString()}
----------------------------------------
${settings.receipt_footer}
========================================
    `;

    navigator.clipboard.writeText(textReceipt.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-100 my-8">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Thermal Receipt
            </h3>
            <p className="text-xs text-neutral-400">Standard 80mm POS Receipt Format</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="my-6 p-6 bg-white text-black font-mono text-xs rounded-lg shadow-inner border border-neutral-200" id="thermal-receipt-print-area">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-tight uppercase">{settings.business_name}</h2>
            <div className="whitespace-pre-line text-[11px] leading-tight text-neutral-700">
              {settings.receipt_header}
            </div>
            <p className="text-[11px] text-neutral-600">{settings.address}</p>
            <p className="text-[11px] text-neutral-600">Tel: {settings.phone}</p>
          </div>

          <div className="border-t border-dashed border-neutral-400 my-3"></div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-600">RECEIPT NO:</span>
              <span className="font-bold">{sale.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">DATE / TIME:</span>
              <span>{sale.date} {sale.time}</span>
            </div>
            {settings.show_cashier && (
              <div className="flex justify-between">
                <span className="text-neutral-600">CASHIER / WORKER:</span>
                <span className="font-semibold">{sale.worker_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-600">CUSTOMER:</span>
              <span>{sale.customer_name || 'Walk-in Guest'}</span>
            </div>
            {sale.shift_id && (
              <div className="flex justify-between">
                <span className="text-neutral-600">SHIFT ID:</span>
                <span className="text-neutral-800">{sale.shift_id}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-neutral-400 my-3"></div>

          {/* Items Header */}
          <div className="grid grid-cols-12 font-bold text-[11px] pb-1 border-b border-neutral-300">
            <span className="col-span-6">ITEM</span>
            <span className="col-span-2 text-center">QTY</span>
            <span className="col-span-4 text-right">TOTAL</span>
          </div>

          {/* Item List */}
          <div className="divide-y divide-neutral-100 py-1 space-y-1.5">
            {sale.items.map((item, idx) => (
              <div key={idx} className="pt-1.5 text-[11px]">
                <div className="font-semibold text-neutral-900">{item.product_name}</div>
                <div className="flex justify-between text-neutral-600">
                  <span>{item.quantity} x ₦{item.unit_price.toLocaleString()}</span>
                  <span className="font-bold text-neutral-900">₦{item.total_price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-neutral-400 my-3"></div>

          {/* Financials */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₦{sale.subtotal.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-neutral-700">
                <span>Discount:</span>
                <span>-₦{sale.discount.toLocaleString()}</span>
              </div>
            )}
            {sale.vat > 0 && (
              <div className="flex justify-between text-neutral-700">
                <span>VAT ({settings.vat_percentage}%):</span>
                <span>₦{sale.vat.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-neutral-300">
              <span>TOTAL (NGN):</span>
              <span>₦{sale.grand_total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-neutral-600">Payment Method:</span>
              <span className="font-bold uppercase bg-neutral-100 px-1.5 py-0.5 rounded">{sale.payment_method}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-600">Payment Status:</span>
              <span className="font-bold uppercase text-emerald-700">{sale.status}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-neutral-400 my-3"></div>

          {/* Footer & Audit */}
          <div className="text-center space-y-1 text-[10px] text-neutral-600">
            <p className="font-semibold text-neutral-800 whitespace-pre-line">{settings.receipt_footer}</p>
            <p className="pt-2 text-[9px] text-neutral-500">
              Printed By: {sale.printed_by || 'Admin Console'} | {new Date().toLocaleTimeString()}
            </p>
            <p className="text-[9px] text-neutral-400">Powered by MUNAJ BAR POS System</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 transition active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl border border-neutral-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
        </div>
      </div>
    </div>
  );
};
