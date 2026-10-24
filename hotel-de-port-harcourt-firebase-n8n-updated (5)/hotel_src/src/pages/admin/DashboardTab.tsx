// src/pages/admin/DashboardTab.tsx
// Operations overview dashboard for Hotel De Port

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Wrench,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  BedDouble
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import {
  getBookings,
  getPayments,
  getEnquiries,
  getMaintenance
} from '../../services/data.ts';
import { AuthService } from '../../services/auth.ts';
import { Booking, Payment, Enquiry, MaintenanceTicket } from '../../types.ts';

interface DashboardTabProps {
  onNavigateTab: (tabId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigateTab }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [bData, pData, eData, mData] = await Promise.all([
          getBookings(),
          getPayments(),
          getEnquiries(),
          getMaintenance()
        ]);
        setBookings(bData);
        setPayments(pData);
        setEnquiries(eData);
        setMaintenance(mData);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const adminUser = AuthService.getAdminUser();
  const staffName = adminUser?.name || 'Sandra Uchechukwu';

  // Compute live metrics
  const todayDateStr = new Date().toISOString().split('T')[0];
  const bookingsToday = bookings.filter(
    b => b.checkIn === todayDateStr || b.createdAt.startsWith(todayDateStr)
  ).length;

  const paidPayments = payments.filter(p => p.status === 'Paid');
  const revenueToday = paidPayments
    .filter(p => p.paidAt?.startsWith(todayDateStr) || p.date?.startsWith(todayDateStr))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter(p => p.status === 'Pending' || p.status === 'Unconfirmed');
  const pendingCount = pendingPayments.length;
  const pendingTotalAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const newEnquiriesCount = enquiries.filter(e => e.status === 'Escalated' || e.channel === 'Website').length;
  const openMaintenanceCount = maintenance.filter(m => m.status === 'Open' || m.status === 'In Progress').length;

  // Active checked-in occupancy rate
  const activeRooms = bookings.filter(b => b.status === 'Checked-in').length;
  const totalInventory = 24;
  const occupancyPct = Math.round((activeRooms / totalInventory) * 100);

  // Recent 5 bookings
  const recentBookings = bookings.slice(0, 5);

  // Dynamic 7-day revenue derived strictly from live payment records
  const sevenDayRevenue = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      const dayRevenue = payments
        .filter(p => p.status === 'Paid' && (p.paidAt?.startsWith(dateStr) || p.date?.startsWith(dateStr)))
        .reduce((sum, p) => sum + p.amount, 0);
      days.push({
        day: dayLabel,
        revenue: dayRevenue,
        isToday: i === 0
      });
    }
    const maxRev = Math.max(...days.map(d => d.revenue), 1);
    return days.map(d => ({
      ...d,
      height: d.revenue > 0 ? `${Math.max(14, Math.round((d.revenue / maxRev) * 100))}%` : '4px'
    }));
  }, [payments]);

  const totalWeeklyRevenue = sevenDayRevenue.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Welcome & Live Port Harcourt Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0A1A2F] to-[#152B47] text-white border border-[#C9A24B]/30 shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C9A24B] font-semibold">
            Operations Briefing
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
            Good day, {staffName}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Hotel De Port PMS is live •{' '}
            <strong className="text-amber-200">
              {activeRooms} Active Check-in{activeRooms === 1 ? '' : 's'} ({occupancyPct}% Occupancy)
            </strong>{' '}
            • Ready for guest reservations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('bookings')}
            className="px-4 py-2 rounded-xl bg-[#C9A24B] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md transition-all cursor-pointer"
          >
            Review Room Arrivals
          </button>
        </div>
      </div>

      {/* 1. KEY KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Bookings Today"
          value={isLoading ? '...' : bookingsToday}
          subtitle={bookingsToday > 0 ? `${bookingsToday} check-in${bookingsToday > 1 ? 's' : ''} today` : 'No arrivals scheduled today'}
          icon={CalendarCheck}
          trend={bookingsToday > 0 ? { value: `${bookingsToday} new`, isPositive: true } : undefined}
          onClick={() => onNavigateTab('bookings')}
        />

        <StatCard
          title="Revenue (Today)"
          value={isLoading ? '...' : `₦${revenueToday.toLocaleString()}`}
          subtitle={revenueToday > 0 ? 'Cleared bank & POS' : 'No payments received today'}
          icon={TrendingUp}
          highlight={revenueToday > 0}
          onClick={() => onNavigateTab('payments')}
        />

        <StatCard
          title="Pending Payments"
          value={isLoading ? '...' : `${pendingCount} (₦${pendingTotalAmount.toLocaleString()})`}
          subtitle={pendingCount > 0 ? 'Awaiting verification' : 'All accounts settled'}
          icon={CreditCard}
          badge={pendingCount > 0 ? 'Action Req.' : undefined}
          onClick={() => onNavigateTab('payments')}
        />

        <StatCard
          title="Active Enquiries"
          value={isLoading ? '...' : newEnquiriesCount}
          subtitle={newEnquiriesCount > 0 ? 'Website & WhatsApp' : 'No pending enquiries'}
          icon={MessageSquare}
          onClick={() => onNavigateTab('enquiries')}
        />

        <StatCard
          title="Open Maintenance"
          value={isLoading ? '...' : openMaintenanceCount}
          subtitle={openMaintenanceCount > 0 ? `${openMaintenanceCount} ticket(s) active` : 'No open work orders'}
          icon={Wrench}
          trend={openMaintenanceCount > 0 ? { value: `${openMaintenanceCount} open`, isPositive: false } : undefined}
          onClick={() => onNavigateTab('maintenance')}
        />
      </div>

      {/* 2. REVENUE BAR CHART & RECENT BOOKINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue 7-Day Bar Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-base font-bold text-[#0A1A2F]">
                Revenue Last 7 Days
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                ₦{totalWeeklyRevenue.toLocaleString()} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Daily revenue collections from suites and dining.
            </p>

            {/* SVG/HTML Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
              {sevenDayRevenue.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0A1A2F] text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                    ₦{bar.revenue.toLocaleString()}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: bar.height }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      bar.isToday && bar.revenue > 0
                        ? 'bg-gradient-to-t from-[#C9A24B] to-[#E0C172] shadow-sm'
                        : bar.revenue > 0
                        ? 'bg-[#0A1A2F]/80 group-hover:bg-[#0A1A2F]'
                        : 'bg-slate-100'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                    {bar.day.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A24B]" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> Past 6 Days
            </span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-[#0A1A2F] hover:text-[#C9A24B] font-semibold text-xs flex items-center gap-0.5"
            >
              Full Reports <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Recent 5 Bookings (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-base font-bold text-[#0A1A2F]">
                  Recent PMS Bookings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest room reservations received across all channels.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="text-xs font-semibold text-[#0A1A2F] hover:text-[#C9A24B] flex items-center gap-1"
              >
                View All ({bookings.length}) <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2">Booking ID</th>
                    <th className="pb-2">Guest</th>
                    <th className="pb-2">Suite</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                        <p className="font-semibold text-slate-600 text-xs">No reservations recorded</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          New bookings made by guests will appear here in real time.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map(b => (
                      <tr key={b.bookingId} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-mono font-medium text-slate-600">
                          {b.bookingId.slice(-9)}
                        </td>
                        <td className="py-2.5 font-semibold text-[#0A1A2F]">
                          {b.fullName}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {b.roomType} {b.roomNumber ? `(#${b.roomNumber})` : ''}
                        </td>
                        <td className="py-2.5 font-bold text-[#0A1A2F]">
                          ₦{b.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={b.status} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>PMS Auto-Sync active</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Webhooks operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
