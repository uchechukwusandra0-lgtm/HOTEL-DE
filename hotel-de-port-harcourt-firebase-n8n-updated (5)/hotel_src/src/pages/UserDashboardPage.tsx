import React, { useEffect, useState } from 'react';
import { getBookings } from '../services/data';
import { Booking } from '../types';
import { auth } from '../services/firebase';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';

export const UserDashboardPage: React.FC = () => {
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
      <h1 className="text-2xl font-bold text-[#0A1A2F] mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Upcoming Bookings</p>
          <p className="text-3xl font-bold text-[#0A1A2F] mt-2">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
        {/* Add more summary cards here */}
      </div>

      <h2 className="text-xl font-bold text-[#0A1A2F] mb-4">Your Recent Bookings</h2>
      {bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-100">
            <p className="text-slate-500 mb-4">No upcoming bookings found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Booking ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Room</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {bookings.map(b => (
                        <tr key={b.bookingId}>
                        <td className="px-6 py-4 text-sm text-[#0A1A2F]">{b.bookingId}</td>
                        <td className="px-6 py-4 text-sm text-[#0A1A2F]">{b.roomType}</td>
                        <td className="px-6 py-4 text-sm text-[#0A1A2F] capitalize">{b.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </DashboardLayout>
  );
};
