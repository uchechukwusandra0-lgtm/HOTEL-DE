// src/pages/admin/BookingsTab.tsx
// Management of guest arrivals, departures, and room allocations

import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, RefreshCw, Mail, Phone, Calendar } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { getBookings, updateBookingStatus } from '../../services/data.ts';
import { WEBHOOKS, postWebhook } from '../../config.ts';
import { Booking } from '../../types.ts';
import { useToast } from '../../components/ui/Toast.tsx';

export const BookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (booking: Booking, newStatus: 'Checked-in' | 'Checked-out') => {
    setUpdatingId(booking.bookingId);
    const webhookStatus = newStatus === 'Checked-in' ? 'checked_in' : 'checked_out';

    try {
      // 1. Update data layer
      const updated = await updateBookingStatus(booking.bookingId, newStatus);
      setBookings(prev => prev.map(b => b.bookingId === booking.bookingId ? updated : b));

      // 2. Post webhook to n8n
      await postWebhook(WEBHOOKS.updateBookingStatus, {
        bookingId: booking.bookingId,
        status: webhookStatus,
        guestName: booking.fullName,
        roomNumber: booking.roomNumber || 'Assigned Room',
        timestamp: new Date().toISOString()
      });

      if (newStatus === 'Checked-out') {
        success(`Guest ${booking.fullName} checked out. Housekeeping team notified via n8n automation.`);
      } else {
        success(`Guest ${booking.fullName} successfully checked in.`);
      }
    } catch (err: any) {
      console.warn('Webhook updateBookingStatus fallback:', err);
      error(`Could not complete the booking update or n8n notification: ${err?.message || 'unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<Booking>[] = [
    {
      key: 'bookingId',
      header: 'Booking ID',
      render: item => (
        <div>
          <span className="font-mono font-bold text-xs text-[#0A1A2F]">
            {item.bookingId}
          </span>
          <span className="block text-[10px] text-slate-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'fullName',
      header: 'Guest Details',
      render: item => (
        <div>
          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
            {item.fullName}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>{item.phone}</span>
            <span>•</span>
            <span className="truncate max-w-[150px]">{item.email}</span>
          </div>
          {item.specialRequest && (
            <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5 line-clamp-1 max-w-xs">
              Note: {item.specialRequest}
            </p>
          )}
        </div>
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
      key: 'roomNumber',
      header: 'Room #',
      render: item => (
        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-[#0A1A2F] text-xs">
          {item.roomNumber || '—'}
        </span>
      )
    },
    {
      key: 'dates',
      header: 'Stay Period',
      render: item => (
        <div className="text-xs text-slate-600">
          <div>In: <strong className="text-slate-800">{item.checkIn}</strong></div>
          <div>Out: <strong className="text-slate-800">{item.checkOut}</strong></div>
          <span className="text-[10px] text-slate-400">({item.nights} {item.nights === 1 ? 'night' : 'nights'})</span>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: item => (
        <div>
          <div className="font-bold text-[#0A1A2F] text-xs sm:text-sm font-serif">
            ₦{item.totalAmount.toLocaleString()}
          </div>
          <span className={`text-[10px] font-semibold ${item.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {item.paymentStatus}
          </span>
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
        const canCheckIn = item.status === 'Confirmed' || item.status === 'Pending';
        const canCheckOut = item.status === 'Checked-in';
        const isBusy = updatingId === item.bookingId;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleStatusChange(item, 'Checked-in')}
              disabled={!canCheckIn || isBusy}
              title="Check in guest"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                canCheckIn
                  ? 'bg-[#0A1A2F] text-[#C9A24B] hover:brightness-125 shadow-xs cursor-pointer'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Check-in</span>
            </button>

            <button
              onClick={() => handleStatusChange(item, 'Checked-out')}
              disabled={!canCheckOut || isBusy}
              title="Check out guest & notify housekeeping"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                canCheckOut
                  ? 'bg-[#C9A24B] text-[#0A1A2F] hover:brightness-110 shadow-xs cursor-pointer'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check-out</span>
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0A1A2F]">
            Guest Reservations & PMS Registry
          </h2>
          <p className="text-xs text-slate-500">
            Check in arrivals and check out departures. Check-out triggers automated housekeeping alerts.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Bookings</span>
        </button>
      </div>

      <DataTable
        data={bookings}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by guest name, booking ID, room #..."
        searchFilter={(item, q) =>
          item.fullName.toLowerCase().includes(q) ||
          item.bookingId.toLowerCase().includes(q) ||
          (item.roomNumber || '').toLowerCase().includes(q) ||
          item.roomType.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        }
        rowKey={item => item.bookingId}
        emptyTitle="No bookings found"
        emptyMessage="No guest reservations recorded in the system."
      />
    </div>
  );
};
