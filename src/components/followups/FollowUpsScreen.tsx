/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  User,
  CalendarClock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  FollowUpTask,
  FollowUpReason,
  Lead,
  Member,
} from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';

interface FollowUpsScreenProps {
  followUpTasks: FollowUpTask[];
  leads: Lead[];
  members: Member[];
  isEmptyState?: boolean;
  onScheduleFollowUp: (data: {
    personId: string;
    personType: 'Lead' | 'Member';
    reason: FollowUpReason;
    note: string;
    dueDate: string;
    dueTime?: string;
    assignedStaff?: string;
    priority?: 'High' | 'Medium' | 'Low';
  }) => void;
  onCompleteFollowUp: (
    taskId: string,
    outcomeNote?: string,
    nextFollowUp?: {
      dueDate: string;
      dueTime?: string;
      note?: string;
      reason?: FollowUpReason;
    }
  ) => void;
  onRescheduleFollowUp: (
    taskId: string,
    newDueDate: string,
    newDueTime?: string,
    updatedNote?: string
  ) => void;
  onOpenLeadsScreen: () => void;
  onOpenMembersDirectory: () => void;
  onRecordPayment: (memberId?: string) => void;
  onRenewMembership: (memberId?: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
}

import { getTodayIso, getDaysAheadIso, getCurrentMonthLabel } from '../../utils/dateUtils';

const REFERENCE_TODAY = getTodayIso();

type ComputedTaskUrgency = 'Overdue' | 'Due Today' | 'Upcoming' | 'Completed';

const FOLLOW_UP_REASONS: FollowUpReason[] = [
  'New enquiry',
  'Trial follow-up',
  'Membership renewal',
  'Membership expiry',
  'Pending payment',
  'Inactive member',
  'General check-in',
  'Other',
];

function getTaskUrgency(task: FollowUpTask): ComputedTaskUrgency {
  if (task.status === 'completed') return 'Completed';
  if (task.dueDate < REFERENCE_TODAY) return 'Overdue';
  if (task.dueDate === REFERENCE_TODAY) return 'Due Today';
  return 'Upcoming';
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim().replace(/^0(\d\s)/, '$1');
  }
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (name || 'F').slice(0, 2).toUpperCase();
}

function getAvatarColorStyle(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.startsWith('p') || lower.startsWith('a') || lower.startsWith('s')) {
    return 'bg-[#FEE2E2] text-[#EF4444] border-[#FECACA]';
  }
  if (lower.startsWith('r') || lower.startsWith('k') || lower.startsWith('v')) {
    return 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
  }
  return 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]';
}

export const FollowUpsScreen: React.FC<FollowUpsScreenProps> = ({
  followUpTasks,
  leads,
  members,
  isEmptyState = false,
  onScheduleFollowUp,
  onCompleteFollowUp,
  onRescheduleFollowUp,
  onOpenLeadsScreen,
  onOpenMembersDirectory,
  onRecordPayment,
  onRenewMembership,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<
    'All' | 'Today' | 'Overdue' | 'Upcoming' | 'Completed'
  >('All');
  const currentMonthLabel = useMemo(() => getCurrentMonthLabel(), []);
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState<string>(() => getCurrentMonthLabel());
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  // Advanced Filter Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [personTypeFilter, setPersonTypeFilter] = useState<'All' | 'Lead' | 'Member'>('All');
  const [reasonFilter, setReasonFilter] = useState<string>('All');
  const [staffFilter, setStaffFilter] = useState<string>('All');

  // Schedule Follow-Up Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulePersonType, setSchedulePersonType] = useState<'Lead' | 'Member'>('Lead');
  const [schedulePersonId, setSchedulePersonId] = useState<string>('');
  const [scheduleReason, setScheduleReason] = useState<FollowUpReason>('New enquiry');
  const [scheduleDueDate, setScheduleDueDate] = useState<string>(REFERENCE_TODAY);
  const [scheduleDueTime, setScheduleDueTime] = useState<string>('11:00 AM');
  const [scheduleNote, setScheduleNote] = useState<string>('');
  const [scheduleStaff, setScheduleStaff] = useState<string>('Reception');
  const [schedulePriority, setSchedulePriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);

  // Task Detail / Complete / Reschedule Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'view' | 'complete' | 'reschedule'>('view');
  const [outcomeNoteInput, setOutcomeNoteInput] = useState('');
  const [scheduleNextAfterComplete, setScheduleNextAfterComplete] = useState(false);
  const [nextFollowUpDateInput, setNextFollowUpDateInput] = useState(() => getDaysAheadIso(3));
  const [nextFollowUpNoteInput, setNextFollowUpNoteInput] = useState('');
  const [rescheduleDateInput, setRescheduleDateInput] = useState(() => getDaysAheadIso(1));
  const [rescheduleTimeInput, setRescheduleTimeInput] = useState('10:00 AM');
  const [rescheduleNoteInput, setRescheduleNoteInput] = useState('');
  const [taskActionError, setTaskActionError] = useState<string | null>(null);

  // Viewing Member Detail View
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const effectiveTasks = useMemo(
    () => (isEmptyState ? [] : followUpTasks),
    [followUpTasks, isEmptyState]
  );
  const effectiveLeads = useMemo(() => (isEmptyState ? [] : leads), [leads, isEmptyState]);
  const effectiveMembers = useMemo(() => (isEmptyState ? [] : members), [members, isEmptyState]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Mutually Exclusive Summary Counts calculated from actual follow-up records
  const summaryStats = useMemo(() => {
    if (isEmptyState || effectiveTasks.length === 0) {
      return {
        dueTodayCount: 0,
        overdueCount: 0,
        upcomingCount: 0,
        completedThisMonthCount: 0,
      };
    }

    let dueTodayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let completedThisMonthCount = 0;

    effectiveTasks.forEach((task) => {
      const urgency = getTaskUrgency(task);
      if (urgency === 'Due Today') {
        dueTodayCount++;
      } else if (urgency === 'Overdue') {
        overdueCount++;
      } else if (urgency === 'Upcoming') {
        upcomingCount++;
      } else if (urgency === 'Completed') {
        const compDate = task.completedAt || task.dueDate || '';
        if (compDate.startsWith(REFERENCE_TODAY.slice(0, 7))) {
          completedThisMonthCount++;
        }
      }
    });

    return {
      dueTodayCount,
      overdueCount,
      upcomingCount,
      completedThisMonthCount,
    };
  }, [effectiveTasks, isEmptyState]);

  const activeAdvancedFilterCount = useMemo(() => {
    let c = 0;
    if (personTypeFilter !== 'All') c++;
    if (reasonFilter !== 'All') c++;
    if (staffFilter !== 'All') c++;
    return c;
  }, [personTypeFilter, reasonFilter, staffFilter]);

  // Filtered and Urgency-Sorted Follow-Up Tasks
  const filteredAndSortedTasks = useMemo(() => {
    const urgencyPriority: Record<ComputedTaskUrgency, number> = {
      Overdue: 0,
      'Due Today': 1,
      Upcoming: 2,
      Completed: 3,
    };

    return effectiveTasks
      .filter((task) => {
        const urgency = getTaskUrgency(task);

        // 1. Period Filter
        if (selectedPeriodLabel !== 'All Dates') {
          if (!task.dueDate.startsWith(REFERENCE_TODAY.slice(0, 7))) return false;
        }

        // 2. Search by name, phone, or follow-up note
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = task.personName.toLowerCase().includes(q);
          const matchPhone = task.personPhone.toLowerCase().includes(q);
          const matchNote = task.note.toLowerCase().includes(q);
          const matchReason = task.reason.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchNote && !matchReason) return false;
        }

        // 3. Status Tab Filter
        if (selectedStatusTab === 'Today' && urgency !== 'Due Today') return false;
        if (selectedStatusTab === 'Overdue' && urgency !== 'Overdue') return false;
        if (selectedStatusTab === 'Upcoming' && urgency !== 'Upcoming') return false;
        if (selectedStatusTab === 'Completed' && urgency !== 'Completed') return false;

        // 4. Person Type Filter (Lead or Member)
        if (personTypeFilter !== 'All' && task.personType !== personTypeFilter) {
          return false;
        }

        // 5. Follow-up Reason Filter
        if (reasonFilter !== 'All') {
          if (!task.reason.toLowerCase().includes(reasonFilter.toLowerCase())) {
            return false;
          }
        }

        // 6. Staff Filter
        if (staffFilter !== 'All' && (task.assignedStaff || 'Reception') !== staffFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const urgA = getTaskUrgency(a);
        const urgB = getTaskUrgency(b);
        if (urgencyPriority[urgA] !== urgencyPriority[urgB]) {
          return urgencyPriority[urgA] - urgencyPriority[urgB];
        }
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      });
  }, [
    effectiveTasks,
    selectedPeriodLabel,
    searchQuery,
    selectedStatusTab,
    personTypeFilter,
    reasonFilter,
    staffFilter,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatusTab('All');
    setPersonTypeFilter('All');
    setReasonFilter('All');
    setStaffFilter('All');
  };

  const openScheduleModal = (defaultType: 'Lead' | 'Member' = 'Lead', defaultId?: string) => {
    setScheduleError(null);
    setIsScheduleSaving(false);
    setSchedulePersonType(defaultType);
    if (defaultId) {
      setSchedulePersonId(defaultId);
    } else if (defaultType === 'Lead' && effectiveLeads.length > 0) {
      setSchedulePersonId(effectiveLeads[0].id);
    } else if (defaultType === 'Member' && effectiveMembers.length > 0) {
      setSchedulePersonId(effectiveMembers[0].id);
    } else {
      setSchedulePersonId('');
    }
    setScheduleReason(defaultType === 'Lead' ? 'New enquiry' : 'Membership renewal');
    setScheduleDueDate(REFERENCE_TODAY);
    setScheduleDueTime('11:00 AM');
    setScheduleNote('');
    setScheduleStaff('Reception');
    setSchedulePriority('Medium');
    setIsScheduleModalOpen(true);
  };

  const handleSaveScheduleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isScheduleSaving) return;
    setScheduleError(null);

    if (!schedulePersonId) {
      setScheduleError(`Please select a ${schedulePersonType.toLowerCase()} to contact.`);
      return;
    }

    if (!scheduleDueDate) {
      setScheduleError('Please select a due date for the follow-up.');
      return;
    }

    setIsScheduleSaving(true);
    setTimeout(() => {
      onScheduleFollowUp({
        personId: schedulePersonId,
        personType: schedulePersonType,
        reason: scheduleReason,
        note:
          scheduleNote.trim() ||
          `${scheduleReason} follow-up scheduled`,
        dueDate: scheduleDueDate,
        dueTime: scheduleDueTime || '10:00 AM',
        assignedStaff: scheduleStaff,
        priority: schedulePriority,
      });
      setIsScheduleSaving(false);
      setIsScheduleModalOpen(false);
      showToast('Follow-up scheduled');
    }, 200);
  };

  const selectedTask = useMemo(
    () => effectiveTasks.find((t) => t.id === selectedTaskId) || null,
    [effectiveTasks, selectedTaskId]
  );

  // If viewing a Member Profile from a follow-up task
  const activeMemberForDetail = useMemo(
    () => effectiveMembers.find((m) => m.id === viewingMemberId) || null,
    [effectiveMembers, viewingMemberId]
  );

  if (activeMemberForDetail) {
    return (
      <MemberDetailView
        member={activeMemberForDetail}
        onBack={() => setViewingMemberId(null)}
        onRecordPayment={onRecordPayment}
        onRenewMembership={onRenewMembership}
        onMarkAttendance={onMarkAttendance}
        onUpdateMember={onUpdateMember}
        onArchiveMember={onArchiveMember}
        onAddFollowUp={onAddFollowUp}
      />
    );
  }

  return (
    <div className="w-full flex-1 pb-3">
      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#191919] text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* A. HEADER: "Follow-Ups", Subtitle & "+ Schedule Follow-Up"     */}
      {/* ============================================================== */}
      <header className="w-full flex flex-wrap items-center justify-between gap-2 pt-2.5 pb-2 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
              Follow-Ups
            </h1>
            <button
              type="button"
              onClick={onOpenLeadsScreen}
              className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
              title="Switch to Leads"
            >
              ← Leads
            </button>
            <button
              type="button"
              onClick={onOpenMembersDirectory}
              className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
              title="Switch to Members Directory"
            >
              Members
            </button>
          </div>
          <p className="text-[#71717A] text-[12px] font-normal mt-0.5 leading-none">
            Stay connected. Keep members engaged.
          </p>
        </div>

        {/* Primary "+ Schedule Follow-Up" Button */}
        <button
          type="button"
          onClick={() => openScheduleModal('Lead')}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-95 text-white text-[12px] font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          aria-label="Schedule Follow-Up"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Schedule Follow-Up</span>
        </button>
      </header>

      {/* ============================================================== */}
      {/* B. SEARCH & FILTER BAR                                         */}
      {/* ============================================================== */}
      <div className="mt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone or follow-up note"
            className="w-full pl-9 pr-7 py-2 text-[12.5px] bg-white border border-[#EAE5DC] rounded-xl text-[#191919] placeholder-[#8E8E93] focus:outline-hidden focus:border-[#102A71] shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#191919] p-0.5 rounded-full cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer relative shrink-0 ${
            activeAdvancedFilterCount > 0
              ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71]'
              : 'bg-white border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
          }`}
          aria-label="Filter follow-ups"
          title="Filter follow-ups by person type, reason, or staff"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
          {activeAdvancedFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#102A71] text-white text-[9px] font-bold flex items-center justify-center">
              {activeAdvancedFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* C. FOUR COMPACT SUMMARY CARDS                                  */}
      {/* ============================================================== */}
      <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:gap-2">
        {/* 1. Due Today (Soft Rose/Red) */}
        <div
          onClick={() =>
            setSelectedStatusTab(selectedStatusTab === 'Today' ? 'All' : 'Today')
          }
          className="bg-[#FDF2F2] border border-[#FADBD8] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs cursor-pointer hover:border-[#F5B7B1] transition-colors"
        >
          <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#FDE0E0] text-[#DC2626] flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="mt-1.5">
            <span className="text-[#4B5563] text-[9.5px] sm:text-[10.5px] font-medium block leading-tight truncate">
              Due Today
            </span>
            <div className="text-[18px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
              {summaryStats.dueTodayCount}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#DC2626] font-medium mt-1 block leading-none truncate">
            Action required
          </span>
        </div>

        {/* 2. Overdue (Soft Rose/Red) */}
        <div
          onClick={() =>
            setSelectedStatusTab(selectedStatusTab === 'Overdue' ? 'All' : 'Overdue')
          }
          className="bg-[#FDF2F2] border border-[#FADBD8] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs cursor-pointer hover:border-[#F5B7B1] transition-colors"
        >
          <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#FDE0E0] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="mt-1.5">
            <span className="text-[#4B5563] text-[9.5px] sm:text-[10.5px] font-medium block leading-tight truncate">
              Overdue
            </span>
            <div className="text-[18px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
              {summaryStats.overdueCount}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#DC2626] font-medium mt-1 block leading-none truncate">
            Follow up now
          </span>
        </div>

        {/* 3. Upcoming (Soft Blue) */}
        <div
          onClick={() =>
            setSelectedStatusTab(selectedStatusTab === 'Upcoming' ? 'All' : 'Upcoming')
          }
          className="bg-[#EEF5FF] border border-[#DBEAFE] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs cursor-pointer hover:border-[#BFDBFE] transition-colors"
        >
          <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="mt-1.5">
            <span className="text-[#4B5563] text-[9.5px] sm:text-[10.5px] font-medium block leading-tight truncate">
              Upcoming
            </span>
            <div className="text-[18px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
              {summaryStats.upcomingCount}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#2563EB] font-medium mt-1 block leading-none truncate">
            This week
          </span>
        </div>

        {/* 4. Completed (Soft Green) */}
        <div
          onClick={() =>
            setSelectedStatusTab(selectedStatusTab === 'Completed' ? 'All' : 'Completed')
          }
          className="bg-[#ECFDF3] border border-[#C6F6D5] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xs cursor-pointer hover:border-[#9AE6B4] transition-colors"
        >
          <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#D1FAE5] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="mt-1.5">
            <span className="text-[#4B5563] text-[9.5px] sm:text-[10.5px] font-medium block leading-tight truncate">
              Completed
            </span>
            <div className="text-[18px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
              {summaryStats.completedThisMonthCount}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#16A34A] font-medium mt-1 block leading-none truncate">
            This month
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* D. STATUS FILTER CHIPS                                         */}
      {/* ============================================================== */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x">
        {(
          [
            { id: 'All', label: 'All', dotColor: null },
            { id: 'Today', label: 'Today', dotColor: '#EF4444' },
            { id: 'Overdue', label: 'Overdue', dotColor: '#F59E0B' },
            { id: 'Upcoming', label: 'Upcoming', dotColor: '#2563EB' },
            { id: 'Completed', label: 'Completed', dotColor: '#16A34A' },
          ] as const
        ).map((tab) => {
          const isSelected = selectedStatusTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer snap-start ${
                isSelected
                  ? 'bg-[#102A71] text-white shadow-2xs'
                  : 'bg-white border border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
              }`}
            >
              {tab.dotColor && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: isSelected ? '#FFFFFF' : tab.dotColor,
                  }}
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* E. FOLLOW-UPS LIST HEADER & MONTH SELECTOR                     */}
      {/* ============================================================== */}
      <div className="mt-3 mb-2 flex items-center justify-between gap-2 px-0.5 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight">
            Follow-Ups ({filteredAndSortedTasks.length})
          </h2>
          {(searchQuery || selectedStatusTab !== 'All' || activeAdvancedFilterCount > 0) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-[#102A71] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Month Selector Pill */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] text-[11px] font-semibold text-[#191919] shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3 h-3 text-[#71717A]" />
            <span>{selectedPeriodLabel}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isPeriodDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {[currentMonthLabel, 'All Dates'].map((period) => (
                <button
                  type="button"
                  key={period}
                  onClick={() => {
                    setSelectedPeriodLabel(period);
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[#FAF8F5] flex items-center justify-between cursor-pointer ${
                    selectedPeriodLabel === period
                      ? 'text-[#102A71] font-bold bg-[#F4F1EA]'
                      : 'text-[#191919]'
                  }`}
                >
                  <span>{period}</span>
                  {selectedPeriodLabel === period && (
                    <Check className="w-3 h-3 text-[#102A71]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* F. FOLLOW-UPS LIST ROWS                                        */}
      {/* ============================================================== */}
      <div className="space-y-2">
        {effectiveTasks.length === 0 ? (
          /* Empty Gym State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No follow-ups scheduled yet</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              Schedule follow-ups for leads or existing members to stay connected on renewals, trials, and pending dues.
            </p>
            <button
              type="button"
              onClick={() => openScheduleModal('Lead')}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#102A71] text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              + Schedule First Follow-Up
            </button>
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          /* Filtered Empty State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No matching follow-ups found</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? `No follow-up tasks match "${searchQuery}". Try searching by name, phone, or note.`
                : 'No follow-ups match your active status or filter criteria.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-bold text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => {
            const urgency = getTaskUrgency(task);
            const cleanPhone = (task.personPhone || '').replace(/[^0-9]/g, '');
            const formattedDueDate = formatDisplayDate(task.dueDate);

            return (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setActionMode('view');
                  setOutcomeNoteInput(task.outcomeNote || '');
                  setScheduleNextAfterComplete(false);
                  setRescheduleDateInput(task.dueDate || getDaysAheadIso(1));
                  setRescheduleTimeInput(task.dueTime || '10:00 AM');
                  setRescheduleNoteInput(task.note || '');
                  setTaskActionError(null);
                }}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`Open follow-up task for ${task.personName}`}
              >
                {/* Left Column: Avatar + Name + PersonType·Reason + Note */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {task.personPhotoUrl ? (
                    <img
                      src={task.personPhotoUrl}
                      alt={task.personName}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#EAE5DC] shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center border shrink-0 ${getAvatarColorStyle(
                        task.personName
                      )}`}
                    >
                      {getInitials(task.personName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[13.5px] sm:text-[14px] text-[#191919] truncate leading-tight group-hover:text-[#102A71] transition-colors">
                      {task.personName}
                    </h3>
                    <p className="text-[11px] sm:text-[11.5px] text-[#4B5563] font-medium mt-0.5 leading-none truncate">
                      {task.personType} · {task.reason}
                    </p>
                    <p className="text-[10.5px] text-[#71717A] mt-1 leading-none truncate">
                      {task.note}
                    </p>
                  </div>
                </div>

                {/* Middle Column: Urgency Status Badge + Scheduled Date & Time */}
                <div className="border-l border-[#F0ECE3] pl-2 sm:pl-2.5 flex flex-col items-start justify-center shrink-0 min-w-[92px] sm:min-w-[108px]">
                  {urgency === 'Overdue' ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] leading-tight">
                      Overdue
                    </span>
                  ) : urgency === 'Due Today' ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] leading-tight">
                      Due Today
                    </span>
                  ) : urgency === 'Upcoming' ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-[#DBEAFE] text-[#2563EB] leading-tight">
                      Upcoming
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-[#E8F8EE] text-[#15803D] leading-tight">
                      Completed
                    </span>
                  )}

                  <span className="text-[10.5px] sm:text-[11px] font-medium text-[#4B5563] mt-1 block leading-tight whitespace-nowrap">
                    {formattedDueDate}
                  </span>
                  <span className="text-[9.5px] sm:text-[10px] text-[#71717A] mt-0.5 block leading-none whitespace-nowrap">
                    {task.dueTime || '10:00 AM'}
                  </span>
                </div>

                {/* Right Column: Call + WhatsApp + Chevron */}
                <div className="border-l border-[#F0ECE3] pl-2 flex items-center gap-1.5 shrink-0">
                  {cleanPhone.length >= 10 && (
                    <>
                      <a
                        href={`tel:${cleanPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-[#EEF5FF] hover:bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center transition-colors"
                        aria-label={`Call ${task.personName}`}
                        title={`Call +91 ${task.personPhone}`}
                      >
                        <Phone className="w-3.5 h-3.5 fill-current" />
                      </a>

                      <a
                        href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(
                          task.personName
                        )},%20following%20up%20from%20MuscleFit%20Gym%20regarding%20${encodeURIComponent(
                          task.reason.toLowerCase()
                        )}.`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center transition-colors shadow-2xs"
                        aria-label={`WhatsApp ${task.personName}`}
                        title={`WhatsApp +91 ${task.personPhone}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      </a>
                    </>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#191919] shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* G. FOLLOW-UP TASK DETAIL, COMPLETE & RESCHEDULE MODAL          */}
      {/* ============================================================== */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedTask.personPhotoUrl ? (
                  <img
                    src={selectedTask.personPhotoUrl}
                    alt={selectedTask.personName}
                    className="w-10 h-10 rounded-full object-cover border border-[#EAE5DC] shrink-0"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${getAvatarColorStyle(
                      selectedTask.personName
                    )}`}
                  >
                    {getInitials(selectedTask.personName)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[15px] font-bold text-[#191919] truncate">
                      {selectedTask.personName}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#EEF5FF] text-[#102A71] text-[10px] font-bold">
                      {selectedTask.personType}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    +91 {selectedTask.personPhone} · {selectedTask.reason}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Summary Card */}
            <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">Scheduled For</span>
                <span className="font-bold text-[#191919]">
                  {formatDisplayDate(selectedTask.dueDate)}, {selectedTask.dueTime || '10:00 AM'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">Task Status</span>
                <span
                  className={`font-bold ${
                    getTaskUrgency(selectedTask) === 'Overdue'
                      ? 'text-[#DC2626]'
                      : getTaskUrgency(selectedTask) === 'Due Today'
                      ? 'text-[#B45309]'
                      : getTaskUrgency(selectedTask) === 'Completed'
                      ? 'text-[#16A34A]'
                      : 'text-[#2563EB]'
                  }`}
                >
                  {getTaskUrgency(selectedTask)}
                </span>
              </div>
              {selectedTask.relatedPlan && (
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">Related Plan</span>
                  <span className="font-semibold text-[#191919]">{selectedTask.relatedPlan}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-[#EAE5DC] text-[11.5px] text-[#191919]">
                <span className="font-semibold text-[#71717A] block text-[10.5px] uppercase tracking-wider mb-0.5">
                  Follow-Up Note
                </span>
                {selectedTask.note}
              </div>
              {selectedTask.outcomeNote && selectedTask.status === 'completed' && (
                <div className="pt-1.5 border-t border-[#EAE5DC] text-[11px] text-[#15803D]">
                  <span className="font-bold">Outcome: </span>
                  {selectedTask.outcomeNote}
                </div>
              )}
            </div>

            {taskActionError && (
              <div className="mt-2.5 p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-medium">
                {taskActionError}
              </div>
            )}

            {/* Complete Task Form */}
            {actionMode === 'complete' && (
              <div className="mt-3 p-3 rounded-xl bg-[#ECFDF3] border border-[#C6F6D5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15803D]">
                    Complete Follow-Up Task
                  </span>
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="text-[11px] text-[#4B5563] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={outcomeNoteInput}
                  onChange={(e) => setOutcomeNoteInput(e.target.value)}
                  placeholder="Outcome note (e.g., Spoke with member, visiting tomorrow)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                />

                <label className="flex items-center gap-2 text-xs text-[#191919] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleNextAfterComplete}
                    onChange={(e) => setScheduleNextAfterComplete(e.target.checked)}
                    className="rounded text-[#102A71]"
                  />
                  <span>Schedule another follow-up after this</span>
                </label>

                {scheduleNextAfterComplete && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="date"
                      value={nextFollowUpDateInput}
                      onChange={(e) => setNextFollowUpDateInput(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                    />
                    <input
                      type="text"
                      value={nextFollowUpNoteInput}
                      onChange={(e) => setNextFollowUpNoteInput(e.target.value)}
                      placeholder="Next task note"
                      className="px-2 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onCompleteFollowUp(
                      selectedTask.id,
                      outcomeNoteInput,
                      scheduleNextAfterComplete && nextFollowUpDateInput
                        ? {
                            dueDate: nextFollowUpDateInput,
                            note:
                              nextFollowUpNoteInput.trim() ||
                              `Follow-up with ${selectedTask.personName}`,
                          }
                        : undefined
                    );
                    setSelectedTaskId(null);
                    showToast(`Marked follow-up with ${selectedTask.personName} as completed`);
                  }}
                  className="w-full py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Complete
                </button>
              </div>
            )}

            {/* Reschedule Task Form */}
            {actionMode === 'reschedule' && (
              <div className="mt-3 p-3 rounded-xl bg-[#EEF5FF] border border-[#DBEAFE] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#102A71]">
                    Reschedule Follow-Up
                  </span>
                  <button
                    type="button"
                    onClick={() => setActionMode('view')}
                    className="text-[11px] text-[#4B5563] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-[#4B5563] mb-0.5">
                      New Date
                    </label>
                    <input
                      type="date"
                      value={rescheduleDateInput}
                      onChange={(e) => setRescheduleDateInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-[#4B5563] mb-0.5">
                      New Time
                    </label>
                    <input
                      type="text"
                      value={rescheduleTimeInput}
                      onChange={(e) => setRescheduleTimeInput(e.target.value)}
                      placeholder="11:00 AM"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={rescheduleNoteInput}
                  onChange={(e) => setRescheduleNoteInput(e.target.value)}
                  placeholder="Update note (optional)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!rescheduleDateInput) {
                      setTaskActionError('Please choose a valid reschedule date.');
                      return;
                    }
                    onRescheduleFollowUp(
                      selectedTask.id,
                      rescheduleDateInput,
                      rescheduleTimeInput,
                      rescheduleNoteInput
                    );
                    setSelectedTaskId(null);
                    showToast(
                      `Rescheduled follow-up to ${formatDisplayDate(rescheduleDateInput)}`
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold cursor-pointer"
                >
                  Save New Date
                </button>
              </div>
            )}

            {/* Primary Action Buttons */}
            {actionMode === 'view' && (
              <div className="mt-3.5 space-y-2">
                {selectedTask.status !== 'completed' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActionMode('complete')}
                      className="py-2.5 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Mark Complete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionMode('reschedule')}
                      className="py-2.5 px-3 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pType = selectedTask.personType;
                      const pId = selectedTask.personId;
                      setSelectedTaskId(null);
                      if (pType === 'Member') {
                        setViewingMemberId(pId);
                      } else {
                        onOpenLeadsScreen();
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] hover:bg-[#F2EFE8] text-xs font-bold text-[#102A71] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Open {selectedTask.personType}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTaskId(null)}
                    className="py-2 px-3 rounded-xl bg-white border border-[#EAE5DC] text-xs font-semibold text-[#4B5563] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* H. SCHEDULE FOLLOW-UP MODAL                                    */}
      {/* ============================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] sm:text-base font-bold text-[#191919] leading-tight">
                    Schedule Follow-Up
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    Schedule a contact task for a lead or gym member
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleForm} className="mt-3 space-y-2.5">
              {scheduleError && (
                <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#DC2626] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              {/* Person Type Toggle: Lead vs Member */}
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Contact Type <span className="text-[#EF4444]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F4F1EA] border border-[#EAE5DC]">
                  {(['Lead', 'Member'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => {
                        setSchedulePersonType(type);
                        if (type === 'Lead') {
                          setSchedulePersonId(effectiveLeads[0]?.id || '');
                          setScheduleReason('New enquiry');
                        } else {
                          setSchedulePersonId(effectiveMembers[0]?.id || '');
                          setScheduleReason('Membership renewal');
                        }
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        schedulePersonType === type
                          ? 'bg-[#102A71] text-white shadow-2xs'
                          : 'text-[#4B5563] hover:text-[#191919]'
                      }`}
                    >
                      {type === 'Lead' ? 'Prospective Lead' : 'Existing Member'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Person */}
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Select {schedulePersonType} <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  required
                  value={schedulePersonId}
                  onChange={(e) => setSchedulePersonId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919] font-medium focus:outline-hidden focus:border-[#102A71]"
                >
                  {schedulePersonType === 'Lead' ? (
                    effectiveLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.leadCode}) · +91 {l.phone}
                      </option>
                    ))
                  ) : (
                    effectiveMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberCode || m.id}) · +91 {m.phone}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Follow-Up Reason */}
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Follow-Up Reason <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  required
                  value={scheduleReason}
                  onChange={(e) => setScheduleReason(e.target.value as FollowUpReason)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919] font-medium focus:outline-hidden focus:border-[#102A71]"
                >
                  {FOLLOW_UP_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Due Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleDueDate}
                    onChange={(e) => setScheduleDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="text"
                    value={scheduleDueTime}
                    onChange={(e) => setScheduleDueTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  />
                </div>
              </div>

              {/* Assigned Staff & Priority */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Assigned Staff
                  </label>
                  <select
                    value={scheduleStaff}
                    onChange={(e) => setScheduleStaff(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  >
                    {['Reception', 'Coach Dev', 'Coach Riya', 'Coach Karthik', 'Vikram Sharma'].map(
                      (st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Priority
                  </label>
                  <select
                    value={schedulePriority}
                    onChange={(e) =>
                      setSchedulePriority(e.target.value as 'High' | 'Medium' | 'Low')
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Follow-Up Note
                </label>
                <input
                  type="text"
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  placeholder="e.g., Remind about membership expiry or trial session"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] text-xs font-bold text-[#4B5563] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduleSaving}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isScheduleSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Schedule Follow-Up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* I. ADVANCED FILTER MODAL FOR FOLLOW-UPS                        */}
      {/* ============================================================== */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191919] leading-tight">
                    Filter Follow-Ups
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    Filter by person type, reason, or assigned staff
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {/* Person Type */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Person Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['All', 'Lead', 'Member'] as const).map((pt) => (
                    <button
                      type="button"
                      key={pt}
                      onClick={() => setPersonTypeFilter(pt)}
                      className={`py-1.5 px-2 rounded-xl border text-[11.5px] font-semibold transition-all cursor-pointer ${
                        personTypeFilter === pt
                          ? 'bg-[#102A71] text-white border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC]'
                      }`}
                    >
                      {pt === 'All' ? 'All Contacts' : `${pt}s Only`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-Up Reason */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Follow-Up Reason
                </label>
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl font-medium text-[#191919]"
                >
                  <option value="All">All Reasons</option>
                  <option value="New enquiry">New Enquiry</option>
                  <option value="Trial">Trial Follow-Up</option>
                  <option value="Interested">Interested</option>
                  <option value="Renewal">Membership Renewal</option>
                  <option value="Payment">Pending Payment</option>
                  <option value="Inactive">Inactive Member</option>
                </select>
              </div>

              {/* Assigned Staff */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Assigned Staff Member
                </label>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl font-medium text-[#191919]"
                >
                  <option value="All">All Staff</option>
                  <option value="Reception">Reception</option>
                  <option value="Coach Dev">Coach Dev</option>
                  <option value="Coach Riya">Coach Riya</option>
                  <option value="Coach Karthik">Coach Karthik</option>
                  <option value="Vikram Sharma">Vikram Sharma</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#F2EFE8] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setIsFilterModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] text-xs font-bold text-[#4B5563] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2 px-4 rounded-xl bg-[#102A71] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
