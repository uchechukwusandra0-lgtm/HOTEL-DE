import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getBookings } from '../../services/data';
import { Booking } from '../../types';
import { auth } from '../../services/firebase';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (auth.currentUser) {
        const bookings = await getBookings(auth.currentUser.uid);
        setBookings(bookings);
      }
      setLoading(false);
    };
    fetchBookings();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-[#0A1A2F] mb-6">My Bookings</h1>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Booking ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Room</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map(b => (
              <tr key={b.bookingId}>
                <td className="px-6 py-4 text-sm text-[#0A1A2F]">{b.bookingId}</td>
                <td className="px-6 py-4 text-sm text-[#0A1A2F]">{b.roomType}</td>
                <td className="px-6 py-4 text-sm text-[#0A1A2F] capitalize">{b.status}</td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-[#C9A24B] font-semibold hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};
