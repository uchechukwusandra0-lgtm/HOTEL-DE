// src/pages/admin/AbandonedTab.tsx
// Lead recovery & abandoned booking pipeline

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Send, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { getAbandoned, updateAbandoned } from '../../services/data.ts';
import { WEBHOOKS, postWebhook } from '../../config.ts';
import { AbandonedBooking } from '../../types.ts';
import { useToast } from '../../components/ui/Toast.tsx';

export const AbandonedTab: React.FC = () => {
  const [abandonedList, setAbandonedList] = useState<AbandonedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { toast, success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAbandoned();
      setAbandonedList(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendReminder = async (item: AbandonedBooking) => {
    setSendingId(item.id);
    try {
      // 1. Post webhook to n8n
      await postWebhook(WEBHOOKS.recoverAbandoned, {
        guestEmail: item.email,
        roomType: item.roomType,
        guestName: item.fullName,
        amount: item.totalAmount
      });

      // 2. Update data layer
      const updated = await updateAbandoned(item.id, 'Pending', true);
      setAbandonedList(prev => prev.map(a => a.id === item.id ? updated : a));

      // Show requested toast text
      toast("Reminder request accepted by n8n. Delivery depends on the configured workflow.", 'success');
    } catch (err: any) {
      console.warn('Webhook recoverAbandoned failed:', err);
      error(err?.message || 'Reminder could not be sent. Check the n8n webhook configuration.');
    } finally {
      setSendingId(null);
    }
  };

  // Compute metrics
  const recoveredCount = abandonedList.filter(a => a.status === 'Recovered').length;
  const pendingRecoveryCount = abandonedList.filter(a => a.status === 'Pending').length;
  const potentialRevenue = abandonedList
    .filter(a => a.status === 'Pending')
    .reduce((sum, a) => sum + a.totalAmount, 0);

  const columns: Column<AbandonedBooking>[] = [
    {
      key: 'fullName',
      header: 'Guest Name',
      render: item => (
        <div>
          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
            {item.fullName}
          </span>
          <span className="block font-mono text-[10px] text-slate-400">
            {item.bookingId}
          </span>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Contact Email',
      render: item => (
        <span className="text-xs text-slate-600 font-mono">
          {item.email}
        </span>
      )
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: item => (
        <span className="text-xs text-slate-600">
          {item.phone}
        </span>
      )
    },
    {
      key: 'roomType',
      header: 'Room Type',
      render: item => (
        <span className="font-medium text-slate-800 text-xs">
          {item.roomType}
        </span>
      )
    },
    {
      key: 'totalAmount',
      header: 'Amount (₦)',
      render: item => (
        <span className="font-bold text-[#0A1A2F] text-xs sm:text-sm font-serif">
          ₦{item.totalAmount.toLocaleString()}
        </span>
      )
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: item => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{item.lastActivity}</span>
          {item.remindersSent > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {item.remindersSent} sent
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
        const canRemind = item.status === 'Pending';
        const isBusy = sendingId === item.id;

        return (
          <div className="flex items-center justify-end">
            {canRemind ? (
              <button
                onClick={() => handleSendReminder(item)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg bg-[#C9A24B] text-[#0A1A2F] hover:brightness-110 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBusy ? 'Sending...' : 'Send Reminder'}</span>
              </button>
            ) : item.status === 'Recovered' ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Converted
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Closed
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0A1A2F]">
            Abandoned Booking Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            Debounced leads captured when visitors fill email/phone but leave before confirming.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Counter card computed from data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border-2 border-[#C9A24B]/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recovered This Week
            </span>
            <div className="text-2xl font-bold text-[#0A1A2F] font-serif mt-1">
              {recoveredCount} recovered
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">
              Converted back to confirmed reservations
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Re-engagement
            </span>
            <div className="text-2xl font-bold text-amber-900 font-serif mt-1">
              {pendingRecoveryCount} Guests
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Waiting for WhatsApp / Email reminder
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pipeline Value
            </span>
            <div className="text-2xl font-bold text-[#0A1A2F] font-serif mt-1">
              ₦{potentialRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Potential revenue up for recovery
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0A1A2F]/5 text-[#C9A24B] flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      <DataTable
        data={abandonedList}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search leads by guest name, email, room..."
        searchFilter={(item, q) =>
          item.fullName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.roomType.toLowerCase().includes(q)
        }
        rowKey={item => item.id}
        emptyTitle="No abandoned bookings"
        emptyMessage="Every visitor who filled contact details completed their reservation!"
      />
    </div>
  );
};
