// src/pages/MaintenancePage.tsx
// In-room QR maintenance portal: /report?room=203

import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Wrench, CheckCircle2, ArrowLeft, AlertTriangle, Shield, Clock } from 'lucide-react';
import { WEBHOOKS, postWebhook } from '../config.ts';
import { addMaintenance } from '../services/data.ts';
import { MaintenanceIssueType } from '../types.ts';
import { useToast } from '../components/ui/Toast.tsx';

const ISSUE_TYPES: MaintenanceIssueType[] = [
  'AC not working',
  'Plumbing',
  'Broken TV',
  'Electrical',
  'Cleaning',
  'Other'
];

export const MaintenancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomParam = searchParams.get('room') || '203';
  const { error } = useToast();

  const [room, setRoom] = useState(roomParam);
  const [issueType, setIssueType] = useState<MaintenanceIssueType>('AC not working');
  const [description, setDescription] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<{ open: boolean; ticketId?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!room.trim()) {
      error('Please enter your room number.');
      return;
    }
    if (!description.trim()) {
      error('Please describe the issue so our engineering team can bring the right tools.');
      return;
    }

    setIsSubmitting(true);
    const reportedAt = new Date().toISOString();

    const payload = {
      room: room.trim(),
      issueType,
      priority: 'Medium' as const,
      description: description.trim() + (guestPhone.trim() ? ` (Guest Callback: ${guestPhone.trim()})` : ''),
      reportedBy: 'guest' as const,
      reportedAt
    };

    try {
      // 1. Post webhook to n8n
      const response = await postWebhook<{ ticketId?: string }>(WEBHOOKS.createMaintenance, payload);

      // 2. Add to local data layer
      const createdTicket = await addMaintenance(payload);

      setSuccessTicket({
        open: true,
        ticketId: response?.ticketId || createdTicket.ticketId
      });
    } catch (err: any) {
      console.warn('Create maintenance webhook fallback:', err);
      const createdTicket = await addMaintenance(payload);
      setSuccessTicket({
        open: true,
        ticketId: createdTicket.ticketId
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1A2F] py-8 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#C9A24B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hotel De Port Website</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#C9A24B]/40 relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0A1A2F] text-[#C9A24B] flex items-center justify-center mx-auto mb-3 shadow-md">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-[#C9A24B] font-bold">
              In-Room Rapid Response Portal
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#0A1A2F] mt-1">
              Report a Room Issue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Scanned from Room {room}. Our on-site duty engineering team responds within 15 minutes.
            </p>
          </div>

          {!successTicket ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Room Number & Issue Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="e.g. 203"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Issue Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={issueType}
                    onChange={e => setIssueType(e.target.value as MaintenanceIssueType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                  >
                    {ISSUE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Issue Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. AC unit in bedroom blowing ambient air rather than cool air..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                />
              </div>

              {/* Guest Callback Number (Optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Contact Number (Optional, for technician callback)
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Our maintenance supervisor will arrive with sanitized gear. If you are sleeping or in meetings, leave a note in the description.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#B38C38] text-[#0A1A2F] font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Dispatching Technician...' : 'Submit Maintenance Request'}
              </button>
            </form>
          ) : (
            /* Success confirmation */
            <div className="text-center py-6 animate-in zoom-in-95 duration-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#0A1A2F]">
                Thank you.
              </h2>
              <p className="text-sm font-semibold text-emerald-800 bg-emerald-50 py-2.5 px-4 rounded-xl border border-emerald-200">
                Our maintenance team has been notified.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Ticket reference <code className="font-bold text-[#0A1A2F]">{successTicket.ticketId}</code> has been dispatched to engineering. A duty supervisor is on their way to Room {room}.
              </p>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSuccessTicket(null);
                    setDescription('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  Report Another Room Issue
                </button>
                <Link
                  to="/"
                  className="text-xs text-[#0A1A2F] hover:text-[#C9A24B] font-semibold py-1"
                >
                  Back to Hotel Homepage
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
