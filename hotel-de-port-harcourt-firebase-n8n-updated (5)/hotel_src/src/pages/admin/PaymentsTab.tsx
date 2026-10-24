// src/pages/admin/PaymentsTab.tsx
// Management and verification of guest invoices and payment reconciliation

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, RefreshCw, DollarSign, Wallet } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { getPayments, updatePayment } from '../../services/data.ts';
import { WEBHOOKS, postWebhook } from '../../config.ts';
import { Payment } from '../../types.ts';
import { useToast } from '../../components/ui/Toast.tsx';

export const PaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvoice, setProcessingInvoice] = useState<string | null>(null);
  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getPayments();
      setPayments(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshFromWebhook = async () => {
    setIsLoading(true);
    try {
      // Call postWebhook(WEBHOOKS.getPayments, {})
      const webhookResult = await postWebhook<Payment[]>(WEBHOOKS.getPayments, {});
      if (Array.isArray(webhookResult) && webhookResult.length > 0) {
        setPayments(webhookResult);
        success('Payments synchronized from n8n webhook.');
      } else {
        const local = await getPayments();
        setPayments(local);
        success('Payments records up to date.');
      }
    } catch (err: any) {
      console.warn('Get payments webhook fallback:', err);
      const local = await getPayments();
      setPayments(local);
      error(`n8n payment refresh failed. Showing saved Firestore records instead: ${err?.message || 'unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (payment: Payment) => {
    setProcessingInvoice(payment.invoiceNumber);
    const paidAt = new Date().toISOString();

    try {
      // 1. Update data layer
      const updated = await updatePayment(payment.invoiceNumber, 'Paid');
      setPayments(prev => prev.map(p => p.invoiceNumber === payment.invoiceNumber ? updated : p));

      // 2. Post webhook to n8n
      await postWebhook(WEBHOOKS.updatePayment, {
        invoiceNumber: payment.invoiceNumber,
        status: 'paid',
        paidAt
      });

      success(`Invoice ${payment.invoiceNumber} for ${payment.guestName} marked as Paid.`);
    } catch (err: any) {
      console.warn('Webhook updatePayment fallback:', err);
      error(`Payment record may be saved, but n8n sync failed: ${err?.message || 'unknown error'}`);
    } finally {
      setProcessingInvoice(null);
    }
  };

  // Summary figures
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + p.amount, 0);

  const columns: Column<Payment>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: item => (
        <div>
          <span className="font-mono font-bold text-xs text-[#0A1A2F]">
            {item.invoiceNumber}
          </span>
          <span className="block text-[10px] text-slate-400">
            Ref: {item.bookingId.slice(-9)}
          </span>
        </div>
      )
    },
    {
      key: 'guestName',
      header: 'Guest Name',
      render: item => (
        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
          {item.guestName}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Amount (₦)',
      render: item => (
        <span className="font-bold text-[#0A1A2F] text-xs sm:text-sm font-serif">
          ₦{item.amount.toLocaleString()}
        </span>
      )
    },
    {
      key: 'method',
      header: 'Method',
      render: item => (
        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
          {item.method}
        </span>
      )
    },
    {
      key: 'date',
      header: 'Date / Paid At',
      render: item => (
        <div className="text-xs text-slate-600">
          <div>{item.date}</div>
          {item.paidAt && (
            <span className="text-[10px] text-emerald-600 block">
              Paid: {new Date(item.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: item => {
        const canMarkPaid = item.status === 'Pending' || item.status === 'Unconfirmed';
        const isBusy = processingInvoice === item.invoiceNumber;

        return (
          <div className="flex items-center justify-end">
            <button
              onClick={() => handleMarkAsPaid(item)}
              disabled={!canMarkPaid || isBusy}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                canMarkPaid
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Paid</span>
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header & Quick Financial Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0A1A2F]">
            Guest Billing & Invoicing
          </h2>
          <p className="text-xs text-slate-500">
            Reconcile bank wire transfers, POS terminal transactions, and card payments.
          </p>
        </div>

        <button
          onClick={handleRefreshFromWebhook}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh via n8n Webhook</span>
        </button>
      </div>

      {/* Mini summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Settled & Paid Invoices
            </span>
            <div className="text-xl font-bold text-emerald-950 font-serif mt-0.5">
              ₦{totalPaid.toLocaleString()}
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-200/60 text-emerald-900 font-bold">
            {payments.filter(p => p.status === 'Paid').length} Paid
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pending / Unconfirmed Invoices
            </span>
            <div className="text-xl font-bold text-amber-950 font-serif mt-0.5">
              ₦{totalPending.toLocaleString()}
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 font-bold">
            {payments.filter(p => p.status !== 'Paid').length} Pending
          </span>
        </div>
      </div>

      <DataTable
        data={payments}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search invoices by guest name, invoice #, method..."
        searchFilter={(item, q) =>
          item.guestName.toLowerCase().includes(q) ||
          item.invoiceNumber.toLowerCase().includes(q) ||
          item.bookingId.toLowerCase().includes(q) ||
          item.method.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        }
        rowKey={item => item.invoiceNumber}
        emptyTitle="No invoices recorded"
        emptyMessage="No payment transactions currently on file."
      />
    </div>
  );
};
