// src/pages/admin/EnquiriesTab.tsx
// Chatbot logs & guest enquiries desk

import React, { useState, useEffect } from 'react';
import { MessageSquare, Bot, AlertTriangle, UserCheck, RefreshCw, Smartphone, Globe } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { getEnquiries, updateEnquiry } from '../../services/data.ts';
import { WEBHOOKS, postWebhook } from '../../config.ts';
import { Enquiry, EnquiryStatus } from '../../types.ts';
import { useToast } from '../../components/ui/Toast.tsx';

export const EnquiriesTab: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filter, setFilter] = useState<'All' | 'Answered' | 'Escalated'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getEnquiries();
      setEnquiries(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEscalate = async (enquiry: Enquiry) => {
    setEscalatingId(enquiry.enquiryId);
    const escalatedAt = new Date().toISOString();

    try {
      // 1. Update data layer
      const updated = await updateEnquiry(enquiry.enquiryId, 'Escalated');
      setEnquiries(prev => prev.map(e => e.enquiryId === enquiry.enquiryId ? updated : e));

      // 2. Post webhook to n8n
      await postWebhook(WEBHOOKS.escalateToStaff, {
        enquiryId: enquiry.enquiryId,
        guestName: enquiry.guestName,
        contact: enquiry.contact,
        question: enquiry.question,
        escalatedAt
      });

      success(`Enquiry ${enquiry.enquiryId} escalated to Front Desk Manager.`);
    } catch (err: any) {
      console.warn('Webhook escalateToStaff fallback:', err);
      error(`Could not complete the enquiry update or n8n notification: ${err?.message || 'unknown error'}`);
    } finally {
      setEscalatingId(null);
    }
  };

  const filteredEnquiries = enquiries.filter(item => {
    if (filter === 'Answered' && item.status !== 'Answered by bot') return false;
    if (filter === 'Escalated' && item.status !== 'Escalated') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.guestName.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.botAnswer.toLowerCase().includes(q) ||
        item.contact.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0A1A2F]">
            Guest Enquiries & Digital Concierge
          </h2>
          <p className="text-xs text-slate-500">
            Real-time queries processed by the AI bot on WhatsApp and website chat.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter buttons */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-medium shrink-0">
          {(['All', 'Answered', 'Escalated'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filter === f
                  ? 'bg-white text-[#0A1A2F] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f} ({enquiries.filter(e => f === 'All' ? true : f === 'Answered' ? e.status === 'Answered by bot' : e.status === 'Escalated').length})
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by question, guest, answer..."
          className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B] max-w-sm w-full"
        />
      </div>

      {/* Enquiries Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No enquiries matching filter</p>
            <p className="text-xs text-slate-500 mt-1">Try switching tabs or resetting the search filter.</p>
          </div>
        ) : (
          filteredEnquiries.map(item => (
            <div
              key={item.enquiryId}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#C9A24B]/60 shadow-xs transition-all space-y-3"
            >
              {/* Top metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-[#0A1A2F]">
                    {item.guestName}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({item.contact})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {item.channel === 'WhatsApp' ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <Globe className="w-3 h-3 text-blue-600" />}
                    {item.channel}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <StatusBadge status={item.status} size="sm" pulse={item.status === 'Escalated'} />
                </div>
              </div>

              {/* Guest Question */}
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-slate-800 block text-xs mb-1 uppercase tracking-wider">
                  Guest Enquiry:
                </span>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                  &ldquo;{item.question}&rdquo;
                </p>
              </div>

              {/* Bot Response */}
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-[#0A1A2F] flex items-center gap-1.5 text-xs mb-1 uppercase tracking-wider">
                  <Bot className="w-3.5 h-3.5 text-[#C9A24B]" /> Automated Concierge Answer:
                </span>
                <p className="text-slate-600 bg-amber-50/40 p-3 rounded-xl border border-amber-200/50">
                  {item.botAnswer}
                </p>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Ticket #{item.enquiryId}
                </span>

                {item.status === 'Answered by bot' && (
                  <button
                    onClick={() => handleEscalate(item)}
                    disabled={escalatingId === item.enquiryId}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0A1A2F] text-[#C9A24B] hover:brightness-125 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Escalate to Staff</span>
                  </button>
                )}
                {item.status === 'Escalated' && (
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    Assigned to Duty Manager
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
