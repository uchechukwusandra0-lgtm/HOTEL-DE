// src/pages/admin/ReportsTab.tsx
// Automated daily executive summaries & report broadcast dispatcher

import React, { useState, useEffect } from 'react';
import { FileText, Send, Calendar, CheckCircle2, Mail, Smartphone, RefreshCw, Sparkles } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable.tsx';
import { getDailyReports, triggerDailyReport, getBookings, getPayments, getEnquiries, getMaintenance } from '../../services/data.ts';
import { WEBHOOKS, postWebhook, DEMO_ADMIN_CREDENTIALS } from '../../config.ts';
import { DailyReport } from '../../types.ts';
import { useToast } from '../../components/ui/Toast.tsx';

export const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingSummary, setIsSendingSummary] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    bookings: 0,
    revenue: 0,
    pendingPayments: 0,
    enquiries: 0,
    openMaintenance: 0
  });
  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [repData, bData, pData, eData, mData] = await Promise.all([
        getDailyReports(),
        getBookings(),
        getPayments(),
        getEnquiries(),
        getMaintenance()
      ]);
      setReports(repData);

      const paidRev = pData.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
      const pendCount = pData.filter(p => p.status !== 'Paid').length;
      const openM = mData.filter(m => m.status !== 'Done').length;

      setLiveMetrics({
        bookings: bData.length,
        revenue: paidRev,
        pendingPayments: pendCount,
        enquiries: eData.length,
        openMaintenance: openM
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendSummaryNow = async () => {
    setIsSendingSummary(true);
    const requestedAt = new Date().toISOString();
    const requestedBy = DEMO_ADMIN_CREDENTIALS.name;

    try {
      // 1. Post webhook to n8n
      await postWebhook(WEBHOOKS.triggerSummary, {
        requestedAt,
        requestedBy
      });

      // 2. Generate daily report in data layer
      const newReport = await triggerDailyReport(requestedBy);
      setReports(prev => [newReport, ...prev]);

      success('Daily summary generated and dispatched to General Manager via Email & WhatsApp!');
    } catch (err: any) {
      console.warn('Webhook triggerSummary fallback:', err);
      const newReport = await triggerDailyReport(requestedBy);
      setReports(prev => [newReport, ...prev]);
      success('Daily executive summary broadcast simulated successfully.');
    } finally {
      setIsSendingSummary(false);
    }
  };

  const columns: Column<DailyReport>[] = [
    {
      key: 'date',
      header: 'Report Date',
      render: item => (
        <span className="font-bold text-[#0A1A2F] text-xs sm:text-sm">
          {item.date}
        </span>
      )
    },
    {
      key: 'bookingsCount',
      header: 'Bookings',
      render: item => (
        <span className="text-xs font-semibold text-slate-800">
          {item.bookingsCount} suites
        </span>
      )
    },
    {
      key: 'revenue',
      header: 'Cleared Revenue',
      render: item => (
        <span className="font-bold text-[#0A1A2F] text-xs sm:text-sm font-serif">
          ₦{item.revenue.toLocaleString()}
        </span>
      )
    },
    {
      key: 'pending',
      header: 'Pending Payments',
      render: item => (
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-amber-700">{item.pendingPaymentsCount}</span>
          {item.pendingPaymentsAmount > 0 && (
            <span className="block text-[10px] text-slate-400">
              (₦{item.pendingPaymentsAmount.toLocaleString()})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'enquiriesCount',
      header: 'Enquiries',
      render: item => (
        <span className="text-xs text-slate-700">
          {item.enquiriesCount} queries
        </span>
      )
    },
    {
      key: 'sentChannels',
      header: 'Sent Via',
      render: item => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.sentChannels.map((c, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                c === 'Email'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {c === 'Email' ? <Mail className="w-3 h-3 text-blue-600" /> : <Smartphone className="w-3 h-3 text-emerald-600" />}
              {c}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'sentAt',
      header: 'Timestamp',
      render: item => (
        <span className="text-[11px] text-slate-400 whitespace-nowrap">
          {item.sentAt ? new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '23:59 WAT'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0A1A2F]">
            Executive Briefings & Daily Audit
          </h2>
          <p className="text-xs text-slate-500">
            End-of-day revenue reconciliation and management dispatch logs.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* "Today's Summary" Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0A1A2F] via-[#10233D] to-[#0A1A2F] text-white border border-[#C9A24B]/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A24B]/20 text-[#C9A24B] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Today&apos;s Summary</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">
              October 24, 2026 Executive Snapshot
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Consolidated snapshot of active guest reservations, settled revenue, outstanding invoices, and customer care enquiries in GRA Phase 2.
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Bookings</span>
                <span className="text-2xl font-bold text-white font-serif">{liveMetrics.bookings}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Cleared Revenue</span>
                <span className="text-2xl font-bold text-[#C9A24B] font-serif">₦{(liveMetrics.revenue / 1000).toFixed(0)}k</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Pending Invoices</span>
                <span className="text-2xl font-bold text-amber-300 font-serif">{liveMetrics.pendingPayments}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Active Enquiries</span>
                <span className="text-2xl font-bold text-white font-serif">{liveMetrics.enquiries}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <button
              onClick={handleSendSummaryNow}
              disabled={isSendingSummary}
              className="w-full lg:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingSummary ? 'Dispatching Broadcast...' : 'Send Summary Now'}</span>
            </button>
            <span className="block text-[11px] text-slate-400 text-center lg:text-right mt-2">
              Broadcasts via n8n to General Manager
            </span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div>
        <h3 className="font-serif text-lg font-bold text-[#0A1A2F] mb-3">
          Last 7 Daily Executive Reports
        </h3>
        <DataTable
          data={reports}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search reports by date, channel..."
          searchFilter={(item, q) =>
            item.date.includes(q) ||
            item.sentChannels.some(c => c.toLowerCase().includes(q))
          }
          rowKey={item => item.date}
          emptyTitle="No daily reports"
          emptyMessage="No historical daily reports archived."
        />
      </div>
    </div>
  );
};
