/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
  ClipboardList,
  Clock,
  RefreshCw,
  CheckCircle2,
  Dumbbell,
  User,
  Sparkles,
  CreditCard,
  FileText,
  Wind,
  Calendar,
  Check,
  Shield,
  Paperclip,
  AlertCircle,
  Send,
  Lock,
} from 'lucide-react';
import {
  ComplaintRecord,
  ComplaintCategory,
  ComplaintStatus,
  Member,
  StaffMember,
} from '../../types/dashboard';
import { ReportTabType } from '../reports/RetentionReportScreen';

interface ComplaintsSupportScreenProps {
  complaints: ComplaintRecord[];
  members: Member[];
  staff: StaffMember[];
  isEmptyState?: boolean;
  onBack: () => void;
  onSelectReportTab?: (tab: ReportTabType) => void;
  onAddComplaint: (data: {
    category: ComplaintCategory;
    title: string;
    description: string;
    memberId?: string;
    reporterName: string;
    assignedStaffId?: string;
    assignedStaffName?: string;
    attachmentName?: string;
  }) => ComplaintRecord;
  onUpdateComplaintStatus: (
    complaintId: string,
    nextStatus: ComplaintStatus,
    note?: string,
    actorName?: string
  ) => void;
  onAssignComplaintStaff: (
    complaintId: string,
    staffId: string,
    staffName: string,
    actorName?: string
  ) => void;
  onAddComplaintNote: (
    complaintId: string,
    noteText: string,
    actorName?: string
  ) => void;
}

type StatusFilter = 'All' | 'Open' | 'In Progress' | 'Resolved';

const CATEGORY_OPTIONS: Array<{
  id: ComplaintCategory;
  label: string;
  defaultTitle: string;
}> = [
  { id: 'Equipment', label: 'Equipment Issue', defaultTitle: 'Equipment Issue' },
  {
    id: 'Behaviour',
    label: 'Staff / Behaviour Concern',
    defaultTitle: 'Behaviour Concern',
  },
  {
    id: 'Cleanliness',
    label: 'Cleanliness & Hygiene',
    defaultTitle: 'Cleanliness Issue',
  },
  { id: 'Billing', label: 'Billing Query', defaultTitle: 'Billing Query' },
  {
    id: 'Feedback',
    label: 'General Feedback',
    defaultTitle: 'General Feedback',
  },
  {
    id: 'Facility',
    label: 'Facility / AC & Utilities',
    defaultTitle: 'AC Not Working',
  },
];

export const ComplaintsSupportScreen: React.FC<ComplaintsSupportScreenProps> = ({
  complaints,
  members,
  staff,
  isEmptyState = false,
  onBack,
  onSelectReportTab,
  onAddComplaint,
  onUpdateComplaintStatus,
  onAssignComplaintStaff,
  onAddComplaintNote,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerRole, setViewerRole] = useState<'owner' | 'trainer'>('owner');
  const canManageComplaints = viewerRole === 'owner';

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Complaint for Detail & Resolution Sheet
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null
  );
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [detailError, setDetailError] = useState<string | null>(null);

  // New Complaint Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<ComplaintCategory>('Equipment');
  const [newTitle, setNewTitle] = useState('Equipment Issue');
  const [newDescription, setNewDescription] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [customReporterName, setCustomReporterName] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const effectiveComplaints = useMemo(
    () => (isEmptyState ? [] : complaints || []),
    [isEmptyState, complaints]
  );

  // Dynamic Status Counts from actual records
  const statusCounts = useMemo(() => {
    const total = effectiveComplaints.length;
    const open = effectiveComplaints.filter((c) => c.status === 'Open').length;
    const inProgress = effectiveComplaints.filter(
      (c) => c.status === 'In Progress'
    ).length;
    const resolved = effectiveComplaints.filter(
      (c) => c.status === 'Resolved'
    ).length;
    return { total, open, inProgress, resolved };
  }, [effectiveComplaints]);

  // Combined Search + Status Filter
  const filteredComplaints = useMemo(() => {
    return effectiveComplaints.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchRef = c.referenceNumber.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchReporter = c.reporterName.toLowerCase().includes(q);
        const matchStatus = c.status.toLowerCase().includes(q);
        const matchCategory = c.category.toLowerCase().includes(q);
        if (
          !matchTitle &&
          !matchRef &&
          !matchDesc &&
          !matchReporter &&
          !matchStatus &&
          !matchCategory
        ) {
          return false;
        }
      }
      return true;
    });
  }, [effectiveComplaints, statusFilter, searchQuery]);

  const selectedComplaint = useMemo(
    () =>
      selectedComplaintId
        ? effectiveComplaints.find((c) => c.id === selectedComplaintId) || null
        : null,
    [effectiveComplaints, selectedComplaintId]
  );

  const getCategoryIconAndStyle = (category: ComplaintCategory) => {
    switch (category) {
      case 'Equipment':
        return {
          icon: <Dumbbell className="w-4.5 h-4.5 text-[#EF4444]" />,
          bg: 'bg-[#FEE2E2]',
        };
      case 'Behaviour':
        return {
          icon: <User className="w-4.5 h-4.5 text-[#D97706]" />,
          bg: 'bg-[#FEF3C7]',
        };
      case 'Cleanliness':
        return {
          icon: <Sparkles className="w-4.5 h-4.5 text-[#2563EB]" />,
          bg: 'bg-[#DBEAFE]',
        };
      case 'Billing':
        return {
          icon: <CreditCard className="w-4.5 h-4.5 text-[#9333EA]" />,
          bg: 'bg-[#F3E8FF]',
        };
      case 'Feedback':
        return {
          icon: <FileText className="w-4.5 h-4.5 text-[#D97706]" />,
          bg: 'bg-[#FEF3C7]',
        };
      case 'Facility':
      default:
        return {
          icon: <Wind className="w-4.5 h-4.5 text-[#EF4444]" />,
          bg: 'bg-[#FEE2E2]',
        };
    }
  };

  const getStatusBadgeStyle = (status: ComplaintStatus) => {
    if (status === 'Open') {
      return 'bg-[#FEE2E2] text-[#EF4444]';
    }
    if (status === 'In Progress') {
      return 'bg-[#DBEAFE] text-[#2563EB]';
    }
    return 'bg-[#DCFCE7] text-[#16A34A]';
  };

  const handleOpenNewModal = () => {
    setNewCategory('Equipment');
    setNewTitle('Equipment Issue');
    setNewDescription('');
    setSelectedMemberId(members[0]?.id || '');
    setCustomReporterName('');
    setAssignedStaffId('');
    setAttachmentName('');
    setFormError(null);
    setIsNewModalOpen(true);
  };

  const handleCreateComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newTitle.trim()) {
      setFormError('Please enter a complaint subject or title.');
      return;
    }
    if (!newDescription.trim() || newDescription.trim().length < 5) {
      setFormError('Please enter a clear description (at least 5 characters).');
      return;
    }

    const memberObj = members.find((m) => m.id === selectedMemberId);
    const reporterName =
      customReporterName.trim() || memberObj?.name || 'Gym Member';
    const staffObj = staff.find((s) => s.id === assignedStaffId);

    setIsSubmitting(true);
    setFormError(null);

    const created = onAddComplaint({
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim(),
      memberId: memberObj?.id,
      reporterName,
      assignedStaffId: staffObj?.id,
      assignedStaffName: staffObj?.name,
      attachmentName: attachmentName || undefined,
    });

    setIsSubmitting(false);
    setIsNewModalOpen(false);
    showToast(`Complaint ${created.referenceNumber} logged.`);
  };

  const handleStatusChangeInDetail = (nextStatus: ComplaintStatus) => {
    if (!selectedComplaint) return;
    if (!canManageComplaints) {
      setDetailError(
        'Only the Gym Owner or Manager can change complaint status.'
      );
      return;
    }
    setDetailError(null);
    onUpdateComplaintStatus(
      selectedComplaint.id,
      nextStatus,
      resolutionNoteInput.trim() || undefined,
      'Vikram Sharma (Owner)'
    );
    if (resolutionNoteInput.trim()) {
      setResolutionNoteInput('');
    }
    showToast(
      `Updated ${selectedComplaint.referenceNumber} status to ${nextStatus}.`
    );
  };

  const handleAssignStaffInDetail = (staffId: string) => {
    if (!selectedComplaint) return;
    if (!canManageComplaints) {
      setDetailError('Only the Gym Owner or Manager can assign staff.');
      return;
    }
    const targetStaff = staff.find((s) => s.id === staffId);
    if (!targetStaff) return;
    setDetailError(null);
    onAssignComplaintStaff(
      selectedComplaint.id,
      targetStaff.id,
      targetStaff.name,
      'Vikram Sharma (Owner)'
    );
    showToast(
      `Assigned ${selectedComplaint.referenceNumber} to ${targetStaff.name}.`
    );
  };

  const handleAddNoteInDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!resolutionNoteInput.trim()) {
      setDetailError('Please enter a note before saving.');
      return;
    }
    setDetailError(null);
    onAddComplaintNote(
      selectedComplaint.id,
      resolutionNoteInput.trim(),
      canManageComplaints ? 'Vikram Sharma (Owner)' : 'Gym Staff'
    );
    setResolutionNoteInput('');
    showToast('Progress / resolution note recorded.');
  };

  return (
    <div className="w-full pt-3 pb-6 space-y-2.5">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#191919] text-white text-[11.5px] font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="flex items-start gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-7 h-7 rounded-xl bg-white border border-[#EAE5DC] text-[#191919] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs hover:bg-[#F8F6F1] cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none">
              Complaints & Support
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Manage member complaints and support requests.
            </p>
          </div>
        </div>

        {/* Primary CTA: + New Complaint */}
        <button
          type="button"
          onClick={handleOpenNewModal}
          className="h-[34px] px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#163172] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Complaint</span>
        </button>
      </div>

      {/* REPORT / SECTION SWITCHER PILLS */}
      {onSelectReportTab && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'overview', label: 'Reports Overview' },
              { id: 'complaints', label: 'Complaints & Support' },
              { id: 'revenue', label: 'Revenue' },
              { id: 'membership', label: 'Memberships' },
              { id: 'retention', label: 'Retention' },
              { id: 'staff', label: 'Staff Report' },
              { id: 'staff_permissions', label: 'Staff Permissions' },
              { id: 'gym_settings', label: 'Gym Settings' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'support', label: 'Help & FAQs' },
            ] as Array<{ id: ReportTabType; label: string }>
          ).map((t) => {
            const isActive = t.id === 'complaints';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectReportTab(t.id)}
                className={`h-[28px] px-3 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'bg-white text-[#52525B] border border-[#E5E0D6] hover:border-[#D6D0C4]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. TOP SUMMARY + SEARCH & FILTER CONTAINER CARD */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        {/* 4 Status Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
          {/* Total */}
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`rounded-xl p-2.5 text-left transition-all cursor-pointer border ${
              statusFilter === 'All'
                ? 'bg-[#EFF6FF] border-[#93C5FD]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#EFF6FF]/60'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center mb-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] font-medium text-[#52525B] leading-tight">
              Total
            </div>
            <div className="text-[16px] font-extrabold text-[#191919] leading-tight mt-0.5">
              {statusCounts.total}
            </div>
          </button>

          {/* Open */}
          <button
            type="button"
            onClick={() => setStatusFilter('Open')}
            className={`rounded-xl p-2.5 text-left transition-all cursor-pointer border ${
              statusFilter === 'Open'
                ? 'bg-[#FFF7ED] border-[#FDBA74]'
                : 'bg-[#FFFBEB]/70 border-[#FEF3C7] hover:bg-[#FFF7ED]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center mb-1.5">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] font-medium text-[#52525B] leading-tight">
              Open
            </div>
            <div className="text-[16px] font-extrabold text-[#191919] leading-tight mt-0.5">
              {statusCounts.open}
            </div>
          </button>

          {/* In Progress */}
          <button
            type="button"
            onClick={() => setStatusFilter('In Progress')}
            className={`rounded-xl p-2.5 text-left transition-all cursor-pointer border ${
              statusFilter === 'In Progress'
                ? 'bg-[#EFF6FF] border-[#93C5FD]'
                : 'bg-[#EFF6FF]/50 border-[#DBEAFE] hover:bg-[#EFF6FF]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center mb-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] font-medium text-[#52525B] leading-tight truncate">
              In Progress
            </div>
            <div className="text-[16px] font-extrabold text-[#191919] leading-tight mt-0.5">
              {statusCounts.inProgress}
            </div>
          </button>

          {/* Resolved */}
          <button
            type="button"
            onClick={() => setStatusFilter('Resolved')}
            className={`rounded-xl p-2.5 text-left transition-all cursor-pointer border ${
              statusFilter === 'Resolved'
                ? 'bg-[#F0FDF4] border-[#86EFAC]'
                : 'bg-[#F0FDF4]/60 border-[#DCFCE7] hover:bg-[#F0FDF4]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] font-medium text-[#52525B] leading-tight">
              Resolved
            </div>
            <div className="text-[16px] font-extrabold text-[#191919] leading-tight mt-0.5">
              {statusCounts.resolved}
            </div>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaints by name, topic or status..."
            className="w-full h-[36px] pl-8.5 pr-8 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-[11.5px] font-medium text-[#191919] placeholder:text-[#9CA3AF] focus:outline-hidden focus:border-[#1E3A8A]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#191919] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Status Filter Pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { id: 'All', label: `All (${statusCounts.total})` },
              { id: 'Open', label: `Open (${statusCounts.open})` },
              {
                id: 'In Progress',
                label: `In Progress (${statusCounts.inProgress})`,
              },
              {
                id: 'Resolved',
                label: `Resolved (${statusCounts.resolved})`,
              },
            ] as Array<{ id: StatusFilter; label: string }>
          ).map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`h-[30px] px-1.5 rounded-xl text-[10.5px] font-bold truncate transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'bg-[#EFF6FF]/80 text-[#1E3A8A] hover:bg-[#DBEAFE]/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. COMPLAINT LIST CARDS */}
      {isEmptyState ? (
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center mx-auto">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-[#191919]">
            No complaints yet
          </h3>
          <p className="text-[11.5px] text-[#71717A] max-w-xs mx-auto">
            Record member complaints, equipment issues, or support requests to track resolution.
          </p>
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="mt-1 h-[34px] px-4 rounded-xl bg-[#1E3A8A] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log First Complaint</span>
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#191919]">
            No matching complaints
          </h3>
          <p className="text-[11.5px] text-[#71717A] max-w-xs mx-auto">
            No complaints match your current filter or search query.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('All');
              setSearchQuery('');
            }}
            className="h-[30px] px-3.5 rounded-xl bg-[#1E3A8A] text-white text-[11px] font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredComplaints.map((complaint) => {
            const catVisual = getCategoryIconAndStyle(complaint.category);
            const badgeStyle = getStatusBadgeStyle(complaint.status);

            return (
              <button
                key={complaint.id}
                type="button"
                onClick={() => {
                  setSelectedComplaintId(complaint.id);
                  setDetailError(null);
                  setResolutionNoteInput('');
                }}
                className="w-full bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs hover:border-[#D6D0C4] transition-all flex items-center justify-between gap-2.5 text-left cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Left Category Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl ${catVisual.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    {catVisual.icon}
                  </div>

                  {/* Center Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-bold text-[#191919] leading-tight truncate">
                          {complaint.title}
                        </h3>
                        <div className="text-[10.5px] font-semibold text-[#71717A] mt-0.5">
                          {complaint.referenceNumber}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${badgeStyle}`}
                      >
                        {complaint.status}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-[#52525B] truncate mt-1">
                      {complaint.description}
                    </p>

                    {/* Bottom Reporter & Date Row */}
                    <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-[#F4F1EA] text-[10.5px] font-medium text-[#52525B]">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <User className="w-3 h-3 text-[#475569] shrink-0" />
                        <span className="truncate">
                          {complaint.reporterName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-[#71717A]">
                        <Calendar className="w-3 h-3 text-[#475569]" />
                        <span>{complaint.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#52525B] shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* COMPLAINT DETAIL & RESOLUTION MODAL                            */}
      {/* ============================================================== */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 border border-[#EAE5DC] shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#F4F1EA]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${
                    getCategoryIconAndStyle(selectedComplaint.category).bg
                  } flex items-center justify-center shrink-0`}
                >
                  {getCategoryIconAndStyle(selectedComplaint.category).icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold text-[#1E3A8A]">
                      {selectedComplaint.referenceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusBadgeStyle(
                        selectedComplaint.status
                      )}`}
                    >
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <h3 className="text-[14.5px] font-bold text-[#191919] leading-snug mt-0.5">
                    {selectedComplaint.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaintId(null)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#52525B] shrink-0 cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Role Switcher inside Detail Modal to test permissions */}
            <div className="flex items-center justify-between bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#F2EFE8]">
              <span className="text-[10.5px] font-semibold text-[#52525B] flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#1E3A8A]" />
                Access Mode:{' '}
                <strong className="text-[#191919]">
                  {viewerRole === 'owner'
                    ? 'Owner / Manager (Full Access)'
                    : 'Staff (View & Note Only)'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  setViewerRole((prev) =>
                    prev === 'owner' ? 'trainer' : 'owner'
                  )
                }
                className="text-[10px] font-bold text-[#1E3A8A] underline cursor-pointer"
              >
                Switch Role
              </button>
            </div>

            {detailError && (
              <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-[11px] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{detailError}</span>
              </div>
            )}

            {/* Full Complaint Details Box */}
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2">
              <div className="text-[11.5px] text-[#191919] leading-relaxed font-medium">
                {selectedComplaint.description}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EAE5DC] text-[10.5px]">
                <div>
                  <span className="text-[#71717A] block">Reported By</span>
                  <span className="font-bold text-[#191919]">
                    {selectedComplaint.reporterName}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Submitted On</span>
                  <span className="font-bold text-[#191919]">
                    {selectedComplaint.createdAt}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Category</span>
                  <span className="font-bold text-[#191919]">
                    {selectedComplaint.category}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Assigned Staff</span>
                  <span className="font-bold text-[#1E3A8A]">
                    {selectedComplaint.assignedStaffName || 'Unassigned'}
                  </span>
                </div>
              </div>

              {selectedComplaint.resolutionNote && (
                <div className="mt-2 pt-2 border-t border-[#EAE5DC]">
                  <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider block">
                    Latest Resolution / Progress Note
                  </span>
                  <p className="text-[11px] font-semibold text-[#191919] mt-0.5">
                    {selectedComplaint.resolutionNote}
                  </p>
                </div>
              )}
            </div>

            {/* Workflow Controls: Update Status & Assign Staff */}
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#191919]">
                    Update Complaint Status
                  </label>
                  {!canManageComplaints && (
                    <span className="text-[10px] text-[#B45309] font-semibold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Owner/Manager only
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Open', 'In Progress', 'Resolved'] as const).map((st) => {
                    const isCurrent = selectedComplaint.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChangeInDetail(st)}
                        className={`h-[32px] rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                            : 'bg-white text-[#52525B] border-[#EAE5DC] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Responsible Staff Member */}
              <div>
                <label className="block text-[11px] font-bold text-[#191919] mb-1">
                  Assign Responsible Staff
                </label>
                <select
                  value={selectedComplaint.assignedStaffId || ''}
                  disabled={!canManageComplaints}
                  onChange={(e) => handleAssignStaffInDetail(e.target.value)}
                  className="w-full h-[34px] px-2.5 rounded-xl bg-white border border-[#D6D0C4] text-[11.5px] font-semibold text-[#191919] disabled:bg-gray-100"
                >
                  <option value="">-- Select Staff Member --</option>
                  {staff
                    .filter((s) => s.status === 'active')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleLabel})
                      </option>
                    ))}
                </select>
              </div>

              {/* Add Resolution / Progress Note */}
              <form onSubmit={handleAddNoteInDetail} className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#191919]">
                  Add Resolution or Follow-Up Note
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={resolutionNoteInput}
                    onChange={(e) => setResolutionNoteInput(e.target.value)}
                    placeholder="Enter action taken or resolution details..."
                    className="flex-1 h-[34px] px-2.5 rounded-xl bg-white border border-[#D6D0C4] text-[11.5px] font-medium text-[#191919]"
                  />
                  <button
                    type="submit"
                    className="h-[34px] px-3 rounded-xl bg-[#1E3A8A] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Complaint History Timeline */}
            <div className="pt-2 border-t border-[#F4F1EA] space-y-2">
              <div className="text-[11.5px] font-bold text-[#191919]">
                Complaint History ({(selectedComplaint.history || []).length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(selectedComplaint.history || []).map((h) => (
                  <div
                    key={h.id}
                    className="p-2 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8] text-[10.5px]"
                  >
                    <div className="flex items-center justify-between font-bold text-[#191919]">
                      <span>{h.action}</span>
                      <span className="text-[9.5px] font-medium text-[#71717A]">
                        {h.timestamp}
                      </span>
                    </div>
                    {h.note && (
                      <p className="text-[#52525B] mt-0.5 leading-snug">
                        {h.note}
                      </p>
                    )}
                    <div className="text-[9.5px] text-[#71717A] mt-0.5">
                      By: {h.actor}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* NEW COMPLAINT MODAL FORM                                       */}
      {/* ============================================================== */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 border border-[#EAE5DC] shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4F1EA]">
              <div>
                <h3 className="text-[15px] font-bold text-[#191919]">
                  New Complaint
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Log a member complaint or operational issue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#71717A] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {formError && (
              <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-[11px] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateComplaintSubmit} className="space-y-2.5">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                  Complaint Category *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const isSelected = newCategory === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setNewCategory(opt.id);
                          setNewTitle(opt.defaultTitle);
                        }}
                        className={`h-[32px] px-2.5 rounded-xl text-[11px] font-bold text-left truncate border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EEF2FF] border-[#1E3A8A] text-[#1E3A8A]'
                            : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#52525B]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject / Title */}
              <div>
                <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                  Subject / Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Equipment Issue, AC Not Working..."
                  className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                />
              </div>

              {/* Associated Member / Reporter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Reported By (Member)
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value);
                      setCustomReporterName('');
                    }}
                    className="w-full h-[34px] px-2 rounded-xl border border-[#D6D0C4] text-[11.5px] font-semibold text-[#191919] bg-white"
                  >
                    <option value="">-- Custom / Walk-in --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberCode || m.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Assign Staff (Optional)
                  </label>
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full h-[34px] px-2 rounded-xl border border-[#D6D0C4] text-[11.5px] font-semibold text-[#191919] bg-white"
                  >
                    <option value="">-- Unassigned --</option>
                    {staff
                      .filter((s) => s.status === 'active')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleLabel})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {!selectedMemberId && (
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Reporter Name
                  </label>
                  <input
                    type="text"
                    value={customReporterName}
                    onChange={(e) => setCustomReporterName(e.target.value)}
                    placeholder="Enter member or staff reporter name..."
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the issue, equipment number, or support request..."
                  className="w-full p-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-medium text-[#191919] leading-snug"
                />
              </div>

              {/* Optional Attachment */}
              <div className="flex items-center justify-between pt-1">
                <label className="h-[30px] px-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#EAE5DC] text-[11px] font-semibold text-[#52525B] inline-flex items-center gap-1.5 cursor-pointer">
                  <Paperclip className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>
                    {attachmentName || 'Attach Photo / Receipt (Optional)'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAttachmentName(file.name);
                    }}
                  />
                </label>
                {attachmentName && (
                  <button
                    type="button"
                    onClick={() => setAttachmentName('')}
                    className="text-[10.5px] font-bold text-[#DC2626] cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F4F1EA]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-[34px] px-3.5 rounded-xl bg-[#F4F1EA] text-[#52525B] text-[11.5px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-[34px] px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#163172] text-white text-[11.5px] font-bold cursor-pointer shadow-xs"
                >
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
