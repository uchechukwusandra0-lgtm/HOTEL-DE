// src/pages/admin/MaintenanceTab.tsx
// Hotel maintenance and housekeeping ticket tracker

import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, Filter, AlertTriangle, User } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { getMaintenance, addMaintenance, updateMaintenance } from '../../services/data.ts';
import { WEBHOOKS, postWebhook } from '../../config.ts';
import { MaintenanceTicket, MaintenanceIssueType, MaintenancePriority } from '../../types.ts';
import { useToast } from '../../components/ui/Toast.tsx';

export const MaintenanceTab: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>([]);
  const [filterOpenOnly, setFilterOpenOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // New Ticket Form State
  const [newRoom, setNewRoom] = useState('');
  const [newIssueType, setNewIssueType] = useState<MaintenanceIssueType>('AC not working');
  const [newPriority, setNewPriority] = useState<MaintenancePriority>('High');
  const [newAssignedTo, setNewAssignedTo] = useState('Emeka Nwosu (Lead HVAC)');
  const [newDescription, setNewDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getMaintenance();
      setMaintenance(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkDone = async (ticket: MaintenanceTicket) => {
    setMarkingId(ticket.ticketId);
    const completedAt = new Date().toISOString();

    try {
      // 1. Update data layer
      const updated = await updateMaintenance(ticket.ticketId, 'Done');
      setMaintenance(prev => prev.map(m => m.ticketId === ticket.ticketId ? updated : m));

      // 2. Post webhook to n8n
      await postWebhook(WEBHOOKS.updateMaintenance, {
        ticketId: ticket.ticketId,
        status: 'done',
        completedAt
      });

      success(`Maintenance ticket for Room ${ticket.room} marked as completed.`);
    } catch (err: any) {
      console.warn('Webhook updateMaintenance fallback:', err);
      error(`Could not complete the ticket update or n8n notification: ${err?.message || 'unknown error'}`);
    } finally {
      setMarkingId(null);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.trim()) {
      error('Please enter a room number');
      return;
    }
    if (!newDescription.trim()) {
      error('Please enter an issue description');
      return;
    }

    setIsSaving(true);
    const reportedAt = new Date().toISOString();

    const payload = {
      room: newRoom.trim(),
      issueType: newIssueType,
      priority: newPriority,
      assignedTo: newAssignedTo,
      description: newDescription.trim(),
      reportedBy: 'staff' as const,
      reportedAt
    };

    try {
      // 1. Save to data layer
      const created = await addMaintenance(payload);
      setMaintenance(prev => [created, ...prev]);

      // 2. Post webhook to n8n
      await postWebhook(WEBHOOKS.createMaintenance, payload);

      success(`Maintenance task created for Room ${newRoom} and assigned to ${newAssignedTo}.`);
      setIsModalOpen(false);

      // Reset form
      setNewRoom('');
      setNewDescription('');
    } catch (err: any) {
      console.warn('Webhook createMaintenance fallback:', err);
      error(`Could not complete ticket creation or n8n notification: ${err?.message || 'unknown error'}`);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const displayedData = maintenance.filter(m => {
    if (filterOpenOnly && m.status === 'Done') return false;
    return true;
  });

  const columns: Column<MaintenanceTicket>[] = [
    {
      key: 'room',
      header: 'Room #',
      render: item => (
        <span className="px-2.5 py-1 rounded-lg bg-[#0A1A2F] text-amber-200 font-mono font-bold text-xs sm:text-sm">
          #{item.room}
        </span>
      )
    },
    {
      key: 'issueType',
      header: 'Issue & Description',
      render: item => (
        <div className="max-w-md">
          <div className="font-bold text-slate-900 text-xs sm:text-sm">
            {item.issueType}
          </div>
          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
            {item.description}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Reported by: <span className="capitalize font-medium text-slate-600">{item.reportedBy}</span> • Ticket: {item.ticketId}
          </span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: item => <StatusBadge status={item.priority} />
    },
    {
      key: 'assignedTo',
      header: 'Assigned Technician',
      render: item => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.assignedTo || 'Unassigned'}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      key: 'reportedAt',
      header: 'Date Reported',
      render: item => (
        <div className="text-xs text-slate-600">
          <div>{new Date(item.reportedAt).toLocaleDateString()}</div>
          <span className="text-[10px] text-slate-400">
            {new Date(item.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: item => {
        const canMarkDone = item.status !== 'Done';
        const isBusy = markingId === item.ticketId;

        return (
          <div className="flex items-center justify-end">
            {canMarkDone ? (
              <button
                onClick={() => handleMarkDone(item)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Done</span>
              </button>
            ) : (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
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
            Housekeeping & Maintenance Operations
          </h2>
          <p className="text-xs text-slate-500">
            In-room QR code submissions, electrical, HVAC cooling, and plumbing work orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle: Open Only / All (default Open Only) */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
            <button
              onClick={() => setFilterOpenOnly(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterOpenOnly
                  ? 'bg-white text-[#0A1A2F] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Open Only ({maintenance.filter(m => m.status !== 'Done').length})
            </button>
            <button
              onClick={() => setFilterOpenOnly(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !filterOpenOnly
                  ? 'bg-white text-[#0A1A2F] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({maintenance.length})
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0A1A2F] text-[#C9A24B] hover:brightness-125 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      <DataTable
        data={displayedData}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search maintenance by room, technician, issue..."
        searchFilter={(item, q) =>
          item.room.toLowerCase().includes(q) ||
          item.issueType.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.assignedTo || '').toLowerCase().includes(q) ||
          item.priority.toLowerCase().includes(q)
        }
        rowKey={item => item.ticketId}
        emptyTitle="No maintenance tickets"
        emptyMessage="All rooms in Hotel De Port are operating at 100% standard."
      />

      {/* Modal: Report Issue */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Maintenance Work Order"
        subtitle="Dispatch engineering or housekeeping to an allocated room."
      >
        <form onSubmit={handleCreateIssue} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Room # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newRoom}
                onChange={e => setNewRoom(e.target.value)}
                placeholder="e.g. 203"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Priority <span className="text-rose-500">*</span>
              </label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as MaintenancePriority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              >
                <option value="High">High (Immediate)</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Issue Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={newIssueType}
                onChange={e => setNewIssueType(e.target.value as MaintenanceIssueType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              >
                <option value="AC not working">AC not working</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Broken TV">Broken TV</option>
                <option value="Electrical">Electrical</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Staff <span className="text-rose-500">*</span>
              </label>
              <select
                value={newAssignedTo}
                onChange={e => setNewAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
              >
                <option value="Emeka Nwosu (Lead HVAC)">Emeka Nwosu (Lead HVAC)</option>
                <option value="Sunday Peters (Plumbing)">Sunday Peters (Plumbing)</option>
                <option value="Blessing Jack (Housekeeping)">Blessing Jack (Housekeeping)</option>
                <option value="Chukwudi Alabi (Electrical)">Chukwudi Alabi (Electrical)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Provide exact details of problem and tools required..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#0A1A2F] text-[#C9A24B] hover:brightness-125 text-xs font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
            >
              {isSaving ? 'Dispatching...' : 'Dispatch Work Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
