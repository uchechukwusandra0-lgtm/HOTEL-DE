// src/components/ui/StatusBadge.tsx
// Semantic status indicators adhering to the hotel design system

import React from 'react';

export type StatusType =
  | 'Paid'
  | 'Pending'
  | 'Unconfirmed'
  | 'Confirmed'
  | 'Checked-in'
  | 'Checked-out'
  | 'Cancelled'
  | 'Open'
  | 'In Progress'
  | 'Done'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Answered by bot'
  | 'Escalated'
  | 'Recovered'
  | 'Lost'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse = false }) => {
  const normalized = (status || '').trim();

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (normalized) {
    // Payments & Recoveries
    case 'Paid':
    case 'Recovered':
    case 'Done':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      dotColor = 'bg-emerald-500';
      break;

    case 'Pending':
      style = 'bg-amber-50 text-amber-800 border-amber-200/80';
      dotColor = 'bg-amber-500';
      break;

    case 'Unconfirmed':
    case 'Lost':
      style = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      break;

    // Bookings
    case 'Confirmed':
      style = 'bg-blue-50 text-blue-800 border-blue-200/80';
      dotColor = 'bg-blue-500';
      break;

    case 'Checked-in':
      style = 'bg-[#0A1A2F]/10 text-[#0A1A2F] border-[#C9A24B]/60 font-semibold';
      dotColor = 'bg-[#C9A24B]';
      break;

    case 'Checked-out':
      style = 'bg-slate-100 text-slate-600 border-slate-300';
      dotColor = 'bg-slate-400';
      break;

    // Maintenance Priority & Issues
    case 'High':
    case 'Open':
      style = 'bg-rose-50 text-rose-800 border-rose-200/80 font-semibold';
      dotColor = 'bg-rose-500';
      break;

    case 'Medium':
    case 'In Progress':
      style = 'bg-amber-50 text-amber-800 border-amber-200/80';
      dotColor = 'bg-amber-500';
      break;

    case 'Low':
      style = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
      break;

    // Enquiries
    case 'Answered by bot':
      style = 'bg-teal-50 text-teal-800 border-teal-200/80';
      dotColor = 'bg-teal-500';
      break;

    case 'Escalated':
      style = 'bg-purple-50 text-purple-800 border-purple-200/80 font-semibold';
      dotColor = 'bg-purple-500';
      break;

    default:
      style = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap tracking-wide transition-colors ${sizeClass} ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{normalized}</span>
    </span>
  );
};
