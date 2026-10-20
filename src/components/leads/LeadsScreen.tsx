/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  FilePlus2,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  X,
  Check,
  UserPlus,
  Calendar,
  Edit2,
  AlertCircle,
  Loader2,
  UserCheck,
  XCircle,
  Sparkles,
} from 'lucide-react';
import {
  Lead,
  LeadStatus,
  LeadSource,
  MembershipPlan,
  Member,
  FollowUpReason,
} from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';

interface LeadsScreenProps {
  leads: Lead[];
  members: Member[];
  plans: MembershipPlan[];
  isEmptyState?: boolean;
  onAddLead: (data: {
    name: string;
    phone: string;
    email?: string;
    source: LeadSource;
    interestedPlan?: string;
    enquiryDate?: string;
    status?: LeadStatus;
    nextFollowUpDate?: string;
    nextFollowUpTime?: string;
    notes?: string;
    assignedStaff?: string;
  }) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onConvertLead: (
    leadId: string,
    options?: { membershipPlan?: string; startDate?: string }
  ) => { success: boolean; memberId?: string; message: string };
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
  onOpenFollowUpsScreen: () => void;
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

import { getTodayIso, getDaysAgoIso, getDaysAheadIso } from '../../utils/dateUtils';

const REFERENCE_TODAY = getTodayIso();

const LEAD_SOURCES: LeadSource[] = [
  'Walk-in',
  'Referral',
  'Friend Referral',
  'Phone',
  'Instagram',
  'Social Media',
  'Website',
  'Other',
];

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
  return (name || 'L').slice(0, 2).toUpperCase();
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

function getInterestedPlanPillStyle(planName?: string): { label: string; className: string } | null {
  if (!planName) return null;
  const lower = planName.toLowerCase();
  if (lower.includes('personal') || lower.includes('annual') || lower.includes('12')) {
    return {
      label: planName,
      className: 'bg-[#F3E8FF] text-[#7C3AED]',
    };
  }
  return {
    label: planName,
    className: 'bg-[#EBF3FF] text-[#2563EB]',
  };
}

export type UILeadStatusFilter = 'All' | 'New' | 'Contacted' | 'Interested' | 'Joined' | 'Not Interested';

export function isLeadJoined(status: LeadStatus): boolean {
  return status === 'Joined' || status === 'Converted';
}

export function isLeadNotInterested(status: LeadStatus): boolean {
  return status === 'Not Interested' || status === 'Lost';
}

export function normalizeLeadStatus(
  status: LeadStatus
): 'New' | 'Contacted' | 'Interested' | 'Joined' | 'Not Interested' {
  if (status === 'Converted' || status === 'Joined') return 'Joined';
  if (status === 'Lost' || status === 'Not Interested') return 'Not Interested';
  if (status === 'Trial') return 'Interested';
  return status as 'New' | 'Contacted' | 'Interested';
}

function isFollowUpDueOrOverdue(lead: Lead): boolean {
  if (isLeadJoined(lead.status) || isLeadNotInterested(lead.status)) return false;
  if (!lead.nextFollowUpDate) return false;
  return lead.nextFollowUpDate <= REFERENCE_TODAY;
}

function isFollowUpOverdue(lead: Lead): boolean {
  if (isLeadJoined(lead.status) || isLeadNotInterested(lead.status)) return false;
  if (!lead.nextFollowUpDate) return false;
  return lead.nextFollowUpDate < REFERENCE_TODAY;
}

export const LeadsScreen: React.FC<LeadsScreenProps> = ({
  leads,
  members,
  plans,
  isEmptyState = false,
  onAddLead,
  onUpdateLead,
  onConvertLead,
  onScheduleFollowUp,
  onOpenFollowUpsScreen,
  onOpenMembersDirectory,
  onRecordPayment,
  onRenewMembership,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<UILeadStatusFilter>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'followup'>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Advanced Filter Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'All' | LeadSource>('All');
  const [planFilter, setPlanFilter] = useState<string>('All');
  const [enquiryPeriodFilter, setEnquiryPeriodFilter] = useState<
    'All' | 'today' | 'this_week' | 'this_month'
  >('All');
  const [followUpDueFilter, setFollowUpDueFilter] = useState<
    'All' | 'due_or_overdue' | 'upcoming' | 'none'
  >('All');

  // Add / Edit Lead Modal State
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState<LeadSource>('Walk-in');
  const [leadInterestedPlan, setLeadInterestedPlan] = useState<string>('Monthly Plan');
  const [leadEnquiryDate, setLeadEnquiryDate] = useState(REFERENCE_TODAY);
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('New');
  const [leadNextFollowUpDate, setLeadNextFollowUpDate] = useState(() => getDaysAheadIso(2));
  const [leadNextFollowUpTime, setLeadNextFollowUpTime] = useState('10:00 AM');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadFormError, setLeadFormError] = useState<string | null>(null);
  const [isLeadSaving, setIsLeadSaving] = useState(false);

  // Selected Lead Detail & Conversion Modal State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [conversionPlan, setConversionPlan] = useState<string>('Monthly Plan');
  const [isConfirmingLost, setIsConfirmingLost] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState('');
  const [isQuickFollowUpOpen, setIsQuickFollowUpOpen] = useState(false);
  const [quickFollowUpDate, setQuickFollowUpDate] = useState(() => getDaysAheadIso(2));
  const [quickFollowUpTime, setQuickFollowUpTime] = useState('10:00 AM');
  const [quickFollowUpNote, setQuickFollowUpNote] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Viewing converted member profile
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);

  const effectiveLeads = useMemo(() => (isEmptyState ? [] : leads), [leads, isEmptyState]);
  const effectiveMembers = useMemo(() => (isEmptyState ? [] : members), [members, isEmptyState]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Real Summary KPI Calculations from actual lead records
  const summaryStats = useMemo(() => {
    if (isEmptyState || effectiveLeads.length === 0) {
      return {
        totalLeads: 0,
        thisMonthCount: 0,
        newLeads: 0,
        followUpsDue: 0,
        overdueCount: 0,
        convertedCount: 0,
        conversionRate: 0,
      };
    }

    const totalLeads = effectiveLeads.length;
    const thisMonthCount = effectiveLeads.filter(
      (l) => l.enquiryDate && l.enquiryDate.startsWith(REFERENCE_TODAY.slice(0, 7))
    ).length;
    const newLeads = effectiveLeads.filter((l) => l.status === 'New').length;
    const followUpsDue = effectiveLeads.filter((l) => isFollowUpDueOrOverdue(l)).length;
    const overdueCount = effectiveLeads.filter((l) => isFollowUpOverdue(l)).length;
    const joinedCount = effectiveLeads.filter((l) => isLeadJoined(l.status)).length;
    const conversionRate =
      totalLeads > 0 ? Math.round((joinedCount / totalLeads) * 100) : 0;

    return {
      totalLeads,
      thisMonthCount,
      newLeads,
      followUpsDue,
      overdueCount,
      joinedCount,
      convertedCount: joinedCount,
      conversionRate,
    };
  }, [effectiveLeads, isEmptyState]);

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (sourceFilter !== 'All') count++;
    if (planFilter !== 'All') count++;
    if (enquiryPeriodFilter !== 'All') count++;
    if (followUpDueFilter !== 'All') count++;
    return count;
  }, [sourceFilter, planFilter, enquiryPeriodFilter, followUpDueFilter]);

  // Filtered and Sorted Leads
  const filteredAndSortedLeads = useMemo(() => {
    return effectiveLeads
      .filter((lead) => {
        // 1. Search by name, phone, or lead ID
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = lead.name.toLowerCase().includes(q);
          const matchPhone = lead.phone.toLowerCase().includes(q);
          const matchCode = (lead.leadCode || '').toLowerCase().includes(q);
          const matchSource = lead.source.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchCode && !matchSource) return false;
        }

        // 2. Status Chip Filter (5 clear statuses)
        if (selectedStatusTab !== 'All') {
          const normalized = normalizeLeadStatus(lead.status);
          if (normalized !== selectedStatusTab) {
            return false;
          }
        }

        // 3. Enquiry Source Filter
        if (sourceFilter !== 'All' && lead.source !== sourceFilter) {
          return false;
        }

        // 4. Interested Plan Filter
        if (planFilter !== 'All') {
          if ((lead.interestedPlan || '') !== planFilter) return false;
        }

        // 5. Enquiry Date Period Filter
        if (enquiryPeriodFilter === 'today') {
          if (lead.enquiryDate !== REFERENCE_TODAY) return false;
        } else if (enquiryPeriodFilter === 'this_week') {
          if (lead.enquiryDate < getDaysAgoIso(6) || lead.enquiryDate > REFERENCE_TODAY) {
            return false;
          }
        } else if (enquiryPeriodFilter === 'this_month') {
          if (!lead.enquiryDate.startsWith(REFERENCE_TODAY.slice(0, 7))) return false;
        }

        // 6. Follow-Up Due Date Filter
        if (followUpDueFilter === 'due_or_overdue') {
          if (!isFollowUpDueOrOverdue(lead)) return false;
        } else if (followUpDueFilter === 'upcoming') {
          if (
            !lead.nextFollowUpDate ||
            lead.nextFollowUpDate <= REFERENCE_TODAY ||
            lead.status === 'Converted' ||
            lead.status === 'Lost'
          ) {
            return false;
          }
        } else if (followUpDueFilter === 'none') {
          if (lead.nextFollowUpDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.enquiryDate || 0).getTime() - new Date(a.enquiryDate || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.enquiryDate || 0).getTime() - new Date(b.enquiryDate || 0).getTime();
        }
        if (sortBy === 'followup') {
          const dateA = a.nextFollowUpDate
            ? new Date(a.nextFollowUpDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          const dateB = b.nextFollowUpDate
            ? new Date(b.nextFollowUpDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          return dateA - dateB;
        }
        return 0;
      });
  }, [
    effectiveLeads,
    searchQuery,
    selectedStatusTab,
    sourceFilter,
    planFilter,
    enquiryPeriodFilter,
    followUpDueFilter,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatusTab('All');
    setSourceFilter('All');
    setPlanFilter('All');
    setEnquiryPeriodFilter('All');
    setFollowUpDueFilter('All');
  };

  const openAddLeadModal = (leadToEdit?: Lead | null) => {
    setLeadFormError(null);
    setIsLeadSaving(false);
    if (leadToEdit) {
      setEditingLead(leadToEdit);
      setLeadName(leadToEdit.name);
      setLeadPhone(leadToEdit.phone);
      setLeadSource(leadToEdit.source);
      setLeadInterestedPlan(leadToEdit.interestedPlan || '');
      setLeadEnquiryDate(leadToEdit.enquiryDate || REFERENCE_TODAY);
      setLeadStatus(leadToEdit.status);
      setLeadNextFollowUpDate(leadToEdit.nextFollowUpDate || '');
      setLeadNextFollowUpTime(leadToEdit.nextFollowUpTime || '10:00 AM');
      setLeadNotes(leadToEdit.notes || '');
    } else {
      setEditingLead(null);
      setLeadName('');
      setLeadPhone('');
      setLeadSource('Walk-in');
      setLeadInterestedPlan('Monthly Plan');
      setLeadEnquiryDate(REFERENCE_TODAY);
      setLeadStatus('New');
      setLeadNextFollowUpDate(getDaysAheadIso(2));
      setLeadNextFollowUpTime('10:00 AM');
      setLeadNotes('');
    }
    setIsLeadFormOpen(true);
  };

  const handleSaveLeadForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLeadSaving) return;
    setLeadFormError(null);

    if (!leadName.trim()) {
      setLeadFormError('Please enter the prospective member’s full name.');
      return;
    }

    const cleanDigits = leadPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setLeadFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    // Check duplicate phone when creating a new lead
    if (!editingLead) {
      const last10 = cleanDigits.slice(-10);
      const duplicateLead = effectiveLeads.find(
        (l) => l.phone.replace(/[^0-9]/g, '').slice(-10) === last10
      );
      if (duplicateLead) {
        setLeadFormError(
          `A lead with this mobile number already exists (${duplicateLead.name} · ${duplicateLead.leadCode}).`
        );
        return;
      }
    }

    const formattedPhone =
      cleanDigits.length === 10
        ? `${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`
        : leadPhone.trim();

    setIsLeadSaving(true);
    setTimeout(() => {
      if (editingLead) {
        onUpdateLead(editingLead.id, {
          name: leadName.trim(),
          phone: formattedPhone,
          source: leadSource,
          interestedPlan: leadInterestedPlan || undefined,
          enquiryDate: leadEnquiryDate,
          status: leadStatus,
          nextFollowUpDate: leadNextFollowUpDate || undefined,
          nextFollowUpTime: leadNextFollowUpTime || undefined,
          notes: leadNotes.trim() || undefined,
        });
        showToast(`Updated lead ${leadName.trim()}`);
      } else {
        onAddLead({
          name: leadName.trim(),
          phone: formattedPhone,
          source: leadSource,
          interestedPlan: leadInterestedPlan || undefined,
          enquiryDate: leadEnquiryDate,
          status: leadStatus,
          nextFollowUpDate: leadNextFollowUpDate || undefined,
          nextFollowUpTime: leadNextFollowUpTime || undefined,
          notes: leadNotes.trim() || undefined,
        });
        showToast(`Added new lead ${leadName.trim()}`);
      }
      setIsLeadSaving(false);
      setIsLeadFormOpen(false);
    }, 220);
  };

  // Active Lead for Detail Modal
  const selectedLead = useMemo(
    () => effectiveLeads.find((l) => l.id === selectedLeadId) || null,
    [effectiveLeads, selectedLeadId]
  );

  // If viewing a Member Profile after converting or clicking a converted lead
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

  const availablePlanNames = useMemo(() => {
    const names = new Set<string>([
      'Monthly Plan',
      'Quarterly Plan',
      '3 Months Plan',
      '6 Months Plan',
      'Annual Plan',
      'Personal Training',
    ]);
    plans.forEach((p) => {
      if (p.status === 'active') names.add(p.name);
    });
    return Array.from(names);
  }, [plans]);

  const sortLabel =
    sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Follow-Up Date';

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
      {/* A. HEADER: "Leads", Subtitle, View Switchers & "+ Add Lead"    */}
      {/* ============================================================== */}
      <header className="w-full flex flex-wrap items-center justify-between gap-2 pt-2.5 pb-2 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
              Leads
            </h1>
            <button
              type="button"
              onClick={onOpenFollowUpsScreen}
              className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
              title="Switch to Follow-Ups"
            >
              Follow-Ups →
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
            Turn enquiries into members
          </p>
        </div>

        {/* Primary "+ Add Lead" Button */}
        <button
          type="button"
          onClick={() => openAddLeadModal(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-95 text-white text-[12px] font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          aria-label="Add Lead"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Lead</span>
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
            placeholder="Search name, phone or lead ID"
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

        {/* Filter Control Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer relative shrink-0 ${
            activeAdvancedFilterCount > 0
              ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71]'
              : 'bg-white border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
          }`}
          aria-label="Filter leads"
          title="Filter leads by status, source, plan or date"
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
      {/* C. THREE SPACIOUS SUMMARY CARDS (No truncation or crowding)    */}
      {/* ============================================================== */}
      <div className="mt-2.5 grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* 1. Total Leads (Soft Blue) */}
        <div
          onClick={() => {
            setSelectedStatusTab('All');
            setFollowUpDueFilter('All');
          }}
          className="bg-[#EEF5FF] border border-[#DBEAFE] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs cursor-pointer hover:border-[#BFDBFE] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[#4B5563] text-[11px] sm:text-[11.5px] font-medium leading-tight">
              Total Leads
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none mt-1.5">
            {summaryStats.totalLeads}
          </div>
          <span className="text-[10px] sm:text-[10.5px] text-[#2563EB] font-medium mt-1.5 block leading-none">
            {summaryStats.thisMonthCount > 0
              ? `+${summaryStats.thisMonthCount} this month`
              : 'All enquiries'}
          </span>
        </div>

        {/* 2. Follow-Ups Due (Soft Amber/Red) */}
        <div
          onClick={() => {
            setFollowUpDueFilter(
              followUpDueFilter === 'due_or_overdue' ? 'All' : 'due_or_overdue'
            );
            setSelectedStatusTab('All');
          }}
          className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs cursor-pointer hover:border-[#FCD34D] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[#4B5563] text-[11px] sm:text-[11.5px] font-medium leading-tight">
              Follow-Ups Due
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none mt-1.5">
            {summaryStats.followUpsDue}
          </div>
          <span className="text-[10px] sm:text-[10.5px] text-[#D97706] font-medium mt-1.5 block leading-none">
            {summaryStats.overdueCount > 0
              ? `${summaryStats.overdueCount} overdue`
              : 'Today / Pending'}
          </span>
        </div>

        {/* 3. Joined Members (Soft Green) */}
        <div
          onClick={() => {
            setSelectedStatusTab(selectedStatusTab === 'Joined' ? 'All' : 'Joined');
            setFollowUpDueFilter('All');
          }}
          className="bg-[#ECFDF3] border border-[#C6F6D5] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs cursor-pointer hover:border-[#9AE6B4] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[#4B5563] text-[11px] sm:text-[11.5px] font-medium leading-tight">
              Joined
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#D1FAE5] text-[#16A34A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none mt-1.5">
            {summaryStats.joinedCount}
          </div>
          <span className="text-[10px] sm:text-[10.5px] text-[#16A34A] font-medium mt-1.5 block leading-none">
            {summaryStats.conversionRate}% converted
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* D. FIVE CLEAR STATUS FILTER TABS                               */}
      {/* ============================================================== */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x">
        {(
          [
            { id: 'All', label: 'All', dotColor: null },
            { id: 'New', label: 'New', dotColor: '#10B981' },
            { id: 'Contacted', label: 'Contacted', dotColor: '#3B82F6' },
            { id: 'Interested', label: 'Interested', dotColor: '#F59E0B' },
            { id: 'Joined', label: 'Joined', dotColor: '#16A34A' },
            { id: 'Not Interested', label: 'Not Interested', dotColor: '#71717A' },
          ] as const
        ).map((tab) => {
          const isSelected = selectedStatusTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id as UILeadStatusFilter)}
              className={`flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer snap-start ${
                isSelected
                  ? 'bg-[#102A71] text-white shadow-2xs font-bold'
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
      {/* E. LEADS LIST HEADER & SORT CONTROL                            */}
      {/* ============================================================== */}
      <div className="mt-3 mb-2 flex items-center justify-between gap-2 px-0.5 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight">
            Leads ({filteredAndSortedLeads.length})
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

        {/* Sort Dropdown Pill */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] text-[11px] font-semibold text-[#191919] shadow-2xs cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 text-[#71717A]" />
            <span>Sort: {sortLabel}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {(
                [
                  { id: 'newest', label: 'Newest First' },
                  { id: 'oldest', label: 'Oldest First' },
                  { id: 'followup', label: 'Follow-Up Date' },
                ] as const
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[#FAF8F5] flex items-center justify-between cursor-pointer ${
                    sortBy === opt.id
                      ? 'text-[#102A71] font-bold bg-[#F4F1EA]'
                      : 'text-[#191919]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-3 h-3 text-[#102A71]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* F. LEADS LIST ROWS (Spacious, Clear Hierarchy, Functional)     */}
      {/* ============================================================== */}
      <div className="space-y-2.5">
        {effectiveLeads.length === 0 ? (
          /* Empty Gym State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <UserPlus className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No leads recorded yet</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              Add your first walk-in, phone call, or Instagram enquiry to start converting prospective members.
            </p>
            <button
              type="button"
              onClick={() => openAddLeadModal(null)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#102A71] text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              + Add First Lead
            </button>
          </div>
        ) : filteredAndSortedLeads.length === 0 ? (
          /* Filtered Empty State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No matching leads found</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? `No leads match "${searchQuery}". Try searching by name, phone number, or Lead ID.`
                : 'No leads match your selected status or filter criteria.'}
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
          filteredAndSortedLeads.map((lead) => {
            const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
            const hasOverdueFollowUp = isFollowUpOverdue(lead);
            const isFollowUpDueToday =
              !hasOverdueFollowUp &&
              lead.nextFollowUpDate === REFERENCE_TODAY &&
              !isLeadJoined(lead.status) &&
              !isLeadNotInterested(lead.status);
            const formattedEnquiry = formatDisplayDate(lead.enquiryDate);
            const formattedFollowUp = lead.nextFollowUpDate
              ? formatDisplayDate(lead.nextFollowUpDate)
              : null;
            const normStatus = normalizeLeadStatus(lead.status);
            const isJoined = isLeadJoined(lead.status);

            // Clean status badge formatting
            let statusBadge = {
              label: 'New',
              bg: 'bg-[#ECFDF5]',
              text: 'text-[#065F46]',
              dot: 'bg-[#10B981]',
              border: 'border-[#A7F3D0]',
            };
            if (normStatus === 'Contacted') {
              statusBadge = {
                label: 'Contacted',
                bg: 'bg-[#EFF6FF]',
                text: 'text-[#1E40AF]',
                dot: 'bg-[#3B82F6]',
                border: 'border-[#BFDBFE]',
              };
            } else if (normStatus === 'Interested') {
              statusBadge = {
                label: 'Interested',
                bg: 'bg-[#FFFBEB]',
                text: 'text-[#92400E]',
                dot: 'bg-[#F59E0B]',
                border: 'border-[#FDE68A]',
              };
            } else if (normStatus === 'Joined') {
              statusBadge = {
                label: 'Joined',
                bg: 'bg-[#F0FDF4]',
                text: 'text-[#166534]',
                dot: 'bg-[#22C55E]',
                border: 'border-[#BBF7D0]',
              };
            } else if (normStatus === 'Not Interested') {
              statusBadge = {
                label: 'Not Interested',
                bg: 'bg-[#F4F4F5]',
                text: 'text-[#52525B]',
                dot: 'bg-[#71717A]',
                border: 'border-[#E4E4E7]',
              };
            }

            return (
              <div
                key={lead.id}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all space-y-2.5"
              >
                {/* Row 1: Avatar + Name + Phone + Status + Call & WhatsApp Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setConversionPlan(lead.interestedPlan || 'Monthly Plan');
                      setIsConfirmingLost(false);
                      setIsQuickFollowUpOpen(false);
                    }}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  >
                    {lead.photoUrl ? (
                      <img
                        src={lead.photoUrl}
                        alt={lead.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#EAE5DC] shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center border shrink-0 ${getAvatarColorStyle(
                          lead.name
                        )}`}
                      >
                        {getInitials(lead.name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-[14px] sm:text-[15px] text-[#191919] truncate leading-tight hover:text-[#102A71] transition-colors">
                          {lead.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-[#71717A] bg-[#F4F1EA] px-1.5 py-0.5 rounded leading-none">
                          {lead.leadCode}
                        </span>
                      </div>

                      {/* Phone number: High contrast, readable */}
                      <p className="text-[12px] font-semibold text-[#1E3A8A] mt-0.5 leading-tight">
                        +91 {lead.phone}
                      </p>
                    </div>
                  </div>

                  {/* Accessible Call & WhatsApp Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {cleanPhone.length >= 10 && (
                      <>
                        <a
                          href={`tel:${cleanPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-xl bg-[#EEF5FF] hover:bg-[#DBEAFE] active:scale-95 text-[#2563EB] flex items-center justify-center transition-all shadow-2xs"
                          aria-label={`Call ${lead.name}`}
                          title={`Call +91 ${lead.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5 fill-current" />
                        </a>

                        <a
                          href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(
                            lead.name
                          )},%20thank%20you%20for%20your%20enquiry%20at%20our%20gym!`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-white flex items-center justify-center transition-all shadow-2xs"
                          aria-label={`WhatsApp ${lead.name}`}
                          title={`WhatsApp +91 ${lead.phone}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Row 2: Status Pill + Interested Plan + Source + Follow-Up Date */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#F2EFE8] text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      <span>{statusBadge.label}</span>
                    </span>

                    {/* Interested Plan */}
                    {lead.interestedPlan && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE5DC] text-[10.5px] font-medium text-[#52525B]">
                        {lead.interestedPlan}
                      </span>
                    )}

                    {/* Source */}
                    <span className="text-[10.5px] text-[#71717A]">
                      via {lead.source}
                    </span>
                  </div>

                  {/* Follow-Up / Joined Date Indicator */}
                  <div>
                    {isJoined ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Joined: {formatDisplayDate(lead.convertedDate || lead.enquiryDate)}</span>
                      </span>
                    ) : hasOverdueFollowUp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Follow-Up Overdue: {formattedFollowUp}</span>
                      </span>
                    ) : isFollowUpDueToday ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#FEF3C7] text-[#B45309]">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>Due Today: {lead.nextFollowUpTime || '10:00 AM'}</span>
                      </span>
                    ) : formattedFollowUp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#EEF2FF] text-[#1E3A8A]">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>Next: {formattedFollowUp}</span>
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-[#71717A]">Enquiry: {formattedEnquiry}</span>
                    )}
                  </div>
                </div>

                {/* Row 3: Quick Functional Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F8F6F0]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setConversionPlan(lead.interestedPlan || 'Monthly Plan');
                      setIsConfirmingLost(false);
                      setIsQuickFollowUpOpen(false);
                    }}
                    className="text-[11.5px] font-semibold text-[#102A71] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Notes & Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!isJoined && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setQuickFollowUpDate(lead.nextFollowUpDate || getDaysAheadIso(2));
                            setQuickFollowUpTime(lead.nextFollowUpTime || '10:00 AM');
                            setIsQuickFollowUpOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] hover:bg-[#F2EFE8] text-[11px] font-bold text-[#191919] cursor-pointer"
                        >
                          {formattedFollowUp ? 'Reschedule' : 'Schedule'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setConversionPlan(lead.interestedPlan || 'Monthly Plan');
                            const res = onConvertLead(lead.id, {
                              membershipPlan: lead.interestedPlan || 'Monthly Plan',
                            });
                            showToast(res.message);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#102A71] hover:bg-[#0D225D] text-white text-[11px] font-bold cursor-pointer shadow-2xs"
                        >
                          Mark Joined
                        </button>
                      </>
                    )}
                    {isJoined && lead.convertedMemberId && (
                      <button
                        type="button"
                        onClick={() => {
                          const mId = lead.convertedMemberId!;
                          setViewingMemberId(mId);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#E8F8EE] border border-[#BBF7D0] text-[#15803D] text-[11px] font-bold cursor-pointer"
                      >
                        View Member
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* G. LEAD DETAIL, FOLLOW-UP & CONVERSION MODAL                   */}
      {/* ============================================================== */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedLead.photoUrl ? (
                  <img
                    src={selectedLead.photoUrl}
                    alt={selectedLead.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#EAE5DC] shrink-0"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${getAvatarColorStyle(
                      selectedLead.name
                    )}`}
                  >
                    {getInitials(selectedLead.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[15px] font-bold text-[#191919] truncate">
                      {selectedLead.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#F4F1EA] text-[10px] font-bold text-[#6B7280]">
                      {selectedLead.leadCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    +91 {selectedLead.phone} · {selectedLead.source}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lead Information Card */}
            <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">Enquiry Date</span>
                <span className="font-semibold text-[#191919]">
                  {formatDisplayDate(selectedLead.enquiryDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">Interested Plan</span>
                <span className="font-bold text-[#102A71]">
                  {selectedLead.interestedPlan || 'Undecided'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">Next Follow-Up</span>
                <span className="font-semibold text-[#191919]">
                  {selectedLead.nextFollowUpDate
                    ? `${formatDisplayDate(selectedLead.nextFollowUpDate)}${
                        selectedLead.nextFollowUpTime ? `, ${selectedLead.nextFollowUpTime}` : ''
                      }`
                    : 'Not scheduled'}
                </span>
              </div>
              {selectedLead.notes && (
                <div className="pt-1.5 border-t border-[#EAE5DC] text-[11px] text-[#4B5563]">
                  <span className="font-semibold text-[#191919]">Notes: </span>
                  {selectedLead.notes}
                </div>
              )}
              {selectedLead.lostReason && (
                <div className="pt-1.5 border-t border-[#EAE5DC] text-[11px] text-[#DC2626]">
                  <span className="font-semibold">Lost Reason: </span>
                  {selectedLead.lostReason}
                </div>
              )}
            </div>

            {/* Quick Status Pipeline Updater */}
            {selectedLead.status !== 'Converted' && (
              <div className="mt-3">
                <label className="block text-[11px] font-bold text-[#191919] mb-1.5">
                  Update Lead Stage
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['New', 'Contacted', 'Interested', 'Trial'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => {
                        onUpdateLead(selectedLead.id, { status: st });
                        showToast(`Marked ${selectedLead.name} as ${st}`);
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                        selectedLead.status === st
                          ? 'bg-[#102A71] text-white border-[#102A71]'
                          : 'bg-white text-[#191919] border-[#EAE5DC] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Schedule Follow-Up Sub-panel */}
            {isQuickFollowUpOpen && (
              <div className="mt-3 p-3 rounded-xl bg-[#EEF5FF] border border-[#DBEAFE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#102A71]">
                    Schedule Follow-Up for {selectedLead.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuickFollowUpOpen(false)}
                    className="text-[11px] text-[#6B7280] hover:text-[#191919] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={quickFollowUpDate}
                    onChange={(e) => setQuickFollowUpDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                  />
                  <input
                    type="text"
                    value={quickFollowUpTime}
                    onChange={(e) => setQuickFollowUpTime(e.target.value)}
                    placeholder="e.g. 11:00 AM"
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                  />
                </div>
                <input
                  type="text"
                  value={quickFollowUpNote}
                  onChange={(e) => setQuickFollowUpNote(e.target.value)}
                  placeholder="Follow-up note (e.g., Check after trial session)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!quickFollowUpDate) return;
                    onScheduleFollowUp({
                      personId: selectedLead.id,
                      personType: 'Lead',
                      reason:
                        selectedLead.status === 'Trial'
                          ? 'Trial'
                          : selectedLead.status === 'Interested'
                          ? 'Interested'
                          : 'New enquiry',
                      note:
                        quickFollowUpNote.trim() ||
                        `Follow up with ${selectedLead.name} on ${
                          selectedLead.interestedPlan || 'membership'
                        }`,
                      dueDate: quickFollowUpDate,
                      dueTime: quickFollowUpTime || '10:00 AM',
                    });
                    setIsQuickFollowUpOpen(false);
                    setQuickFollowUpNote('');
                    showToast(`Follow-up scheduled for ${formatDisplayDate(quickFollowUpDate)}`);
                  }}
                  className="w-full py-1.5 rounded-lg bg-[#102A71] text-white text-xs font-bold cursor-pointer"
                >
                  Save Follow-Up Task
                </button>
              </div>
            )}

            {/* Mark as Not Interested Confirmation */}
            {isConfirmingLost && (
              <div className="mt-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
                <span className="text-xs font-bold text-[#DC2626] block">
                  Mark {selectedLead.name} as Not Interested?
                </span>
                <input
                  type="text"
                  value={lostReasonInput}
                  onChange={(e) => setLostReasonInput(e.target.value)}
                  placeholder="Reason (e.g., Joined another gym, Price issue, Moved away)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-lg text-[#191919]"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingLost(false)}
                    className="px-3 py-1 rounded-lg bg-white border border-[#EAE5DC] text-xs font-semibold text-[#4B5563] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateLead(selectedLead.id, {
                        status: 'Not Interested',
                        lostReason: lostReasonInput.trim() || 'Not interested currently',
                        nextFollowUpDate: undefined,
                      });
                      setIsConfirmingLost(false);
                      showToast(`Marked ${selectedLead.name} as Not Interested`);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#DC2626] text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Not Interested
                  </button>
                </div>
              </div>
            )}

            {/* Convert Lead to Member Section */}
            {isLeadJoined(selectedLead.status) ? (
              <div className="mt-3 p-3 rounded-xl bg-[#ECFDF3] border border-[#C6F6D5] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#15803D] block">
                      Joined as Gym Member
                    </span>
                    <span className="text-[10.5px] text-[#16A34A]">
                      Joined on {formatDisplayDate(selectedLead.convertedDate || selectedLead.enquiryDate)}
                    </span>
                  </div>
                </div>
                {selectedLead.convertedMemberId && (
                  <button
                    type="button"
                    onClick={() => {
                      const mId = selectedLead.convertedMemberId!;
                      setSelectedLeadId(null);
                      setViewingMemberId(mId);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    View Member
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-3 p-3 rounded-xl bg-[#F8F7F4] border border-[#EAE5DC]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#191919] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#102A71]" />
                    <span>Convert Lead to Member</span>
                  </span>
                  <span className="text-[10.5px] text-[#71717A]">No auto-payment charged</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={conversionPlan}
                    onChange={(e) => setConversionPlan(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#EAE5DC] rounded-xl font-medium text-[#191919]"
                  >
                    {availablePlanNames.map((pName) => (
                      <option key={pName} value={pName}>
                        {pName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const res = onConvertLead(selectedLead.id, {
                        membershipPlan: conversionPlan,
                      });
                      showToast(res.message);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold cursor-pointer shrink-0 shadow-2xs"
                  >
                    Mark Joined
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuickFollowUpDate(selectedLead.nextFollowUpDate || getDaysAheadIso(2));
                  setQuickFollowUpTime(selectedLead.nextFollowUpTime || '10:00 AM');
                  setIsQuickFollowUpOpen(!isQuickFollowUpOpen);
                }}
                className="py-2 px-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] hover:bg-[#F2EFE8] text-[11.5px] font-bold text-[#102A71] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Follow-Up</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const l = selectedLead;
                  setSelectedLeadId(null);
                  openAddLeadModal(l);
                }}
                className="py-2 px-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] hover:bg-[#F2EFE8] text-[11.5px] font-bold text-[#191919] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Lead</span>
              </button>

              {!isLeadJoined(selectedLead.status) && !isLeadNotInterested(selectedLead.status) ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingLost(true)}
                  className="py-2 px-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[11.5px] font-bold text-[#DC2626] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Not Interested</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(null)}
                  className="py-2 px-2.5 rounded-xl bg-white border border-[#EAE5DC] text-[11.5px] font-semibold text-[#4B5563] cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* H. ADD / EDIT LEAD MODAL                                       */}
      {/* ============================================================== */}
      {isLeadFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] sm:text-base font-bold text-[#191919] leading-tight">
                    {editingLead ? 'Edit Lead' : 'Add New Lead'}
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    Record enquiry details and schedule follow-up
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeadFormOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeadForm} className="mt-3 space-y-2.5">
              {leadFormError && (
                <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#DC2626] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{leadFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Full Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g., Arun Kumar"
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Phone Number (+91) <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Enquiry Source
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71]"
                  >
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Interested Plan (Optional)
                  </label>
                  <select
                    value={leadInterestedPlan}
                    onChange={(e) => setLeadInterestedPlan(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71]"
                  >
                    <option value="">None / Undecided</option>
                    {availablePlanNames.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Enquiry Date
                  </label>
                  <input
                    type="date"
                    value={leadEnquiryDate}
                    onChange={(e) => setLeadEnquiryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Lead Status
                  </label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  >
                    {(['New', 'Contacted', 'Interested', 'Trial'] as const).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Next Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={leadNextFollowUpDate}
                    onChange={(e) => setLeadNextFollowUpDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Follow-Up Time
                  </label>
                  <input
                    type="text"
                    value={leadNextFollowUpTime}
                    onChange={(e) => setLeadNextFollowUpTime(e.target.value)}
                    placeholder="e.g., 10:00 AM"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="e.g., Looking for morning weight training batch"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-[#191919]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeadFormOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] text-xs font-bold text-[#4B5563] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLeadSaving}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isLeadSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingLead ? 'Update Lead' : 'Save Lead'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* I. ADVANCED FILTER MODAL FOR LEADS                             */}
      {/* ============================================================== */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191919] leading-tight">
                    Filter Leads
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    Filter by source, interested plan, enquiry date, or follow-up due
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
              {/* Enquiry Source */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Enquiry Source
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['All', 'Walk-in', 'Referral', 'Phone', 'Instagram', 'Social Media'] as const).map(
                    (src) => (
                      <button
                        type="button"
                        key={src}
                        onClick={() => setSourceFilter(src as any)}
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer truncate ${
                          sourceFilter === src
                            ? 'bg-[#102A71] text-white border-[#102A71]'
                            : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                        }`}
                      >
                        {src}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Interested Plan */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Interested Membership Plan
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl font-medium text-[#191919]"
                >
                  <option value="All">All Plans</option>
                  {availablePlanNames.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Follow-Up Due Filter */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Follow-Up Schedule
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'All', label: 'All Leads' },
                    { id: 'due_or_overdue', label: 'Due Today / Overdue' },
                    { id: 'upcoming', label: 'Upcoming Follow-Up' },
                    { id: 'none', label: 'No Follow-Up Set' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setFollowUpDueFilter(opt.id as any)}
                      className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold text-left flex items-center justify-between cursor-pointer ${
                        followUpDueFilter === opt.id
                          ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {followUpDueFilter === opt.id && (
                        <Check className="w-3.5 h-3.5 text-[#102A71]" />
                      )}
                    </button>
                  ))}
                </div>
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
