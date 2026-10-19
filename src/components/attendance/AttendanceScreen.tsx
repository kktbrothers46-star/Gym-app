/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  UserX,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  QrCode,
  Check,
  Phone,
  MessageCircle,
  AlertTriangle,
  AlertCircle,
  X,
  ArrowUpDown,
  Hash,
  RotateCcw,
  Sparkles,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Member, AttendanceRecord } from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';

export type AttendanceStatusFilter =
  | 'All'
  | 'Present Today'
  | 'Not Checked In'
  | 'Inactive 7+ Days'
  | 'Expiring Soon'
  | 'Expired';

export type AttendanceSortOption =
  | 'Recent Check-In'
  | 'Name A–Z'
  | 'Most Inactive'
  | 'Expiry Date'
  | 'Status';

interface AttendanceScreenProps {
  members: Member[];
  attendance: AttendanceRecord[];
  activeMembersCount: number;
  isEmptyState?: boolean;
  onMarkAttendance: (
    memberId: string,
    memberName: string,
    options?: {
      date?: string;
      time?: string;
      method?: AttendanceRecord['method'];
      notes?: string;
    }
  ) => void;
  onUnmarkAttendance?: (attendanceId: string) => void;
  onRecordPayment: (memberId?: string) => void;
  onRenewMembership: (memberId: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
  onOpenAddMember?: () => void;
}

import { getTodayIso, getYesterdayIso, getDaysAgoIso, formatIndianDate } from '../../utils/dateUtils';

const TODAY_ISO = getTodayIso();

function formatSelectedDateLabel(isoDate: string): string {
  const today = getTodayIso();
  const yesterday = getYesterdayIso();
  if (isoDate === today) {
    return `Today, ${formatIndianDate(today)}`;
  }
  if (isoDate === yesterday) {
    return `Yesterday, ${formatIndianDate(yesterday)}`;
  }
  return formatIndianDate(isoDate);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function parseTimeMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({
  members,
  attendance,
  activeMembersCount,
  isEmptyState = false,
  onMarkAttendance,
  onUnmarkAttendance,
  onRecordPayment,
  onRenewMembership,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
  onOpenAddMember,
}) => {
  // Date state (defaults to dynamic today)
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>('All');
  const [sortBy, setSortBy] = useState<AttendanceSortOption>('Recent Check-In');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [planFilter, setPlanFilter] = useState<string>('All');

  // Quick Check-In state
  const [quickInput, setQuickInput] = useState('');
  const [quickFeedback, setQuickFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Modals state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [expiredCheckInMember, setExpiredCheckInMember] = useState<Member | null>(null);
  const [inspectingCheckIn, setInspectingCheckIn] = useState<{
    member: Member;
    record: AttendanceRecord;
  } | null>(null);

  // Mark Attendance Modal form state
  const [markModalSearch, setMarkModalSearch] = useState('');
  const [markModalMemberId, setMarkModalMemberId] = useState<string>('');
  const [markModalDate, setMarkModalDate] = useState<string>(TODAY_ISO);
  const [markModalTime, setMarkModalTime] = useState<string>('07:30 AM');
  const [markModalMethod, setMarkModalMethod] = useState<AttendanceRecord['method']>('Manual');
  const [markModalNotes, setMarkModalNotes] = useState<string>('');

  const effectiveMembers = isEmptyState ? [] : members;
  const effectiveAttendance = isEmptyState ? [] : attendance;

  // Map of memberId -> AttendanceRecord for the selectedDate
  const checkInsOnSelectedDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const rec of effectiveAttendance) {
      const recDate =
        rec.date || (rec.timestamp.startsWith('Today') ? TODAY_ISO : undefined);
      if (recDate === selectedDate && !map.has(rec.memberId)) {
        map.set(rec.memberId, rec);
      }
    }
    return map;
  }, [effectiveAttendance, selectedDate]);

  // Summary metrics derived from real data
  const summaryStats = useMemo(() => {
    const presentCount = checkInsOnSelectedDate.size;
    const activePool = effectiveMembers.filter(
      (m) =>
        m.status === 'active' ||
        m.status === 'expiring' ||
        (m.status === 'pending' && m.daysUntilExpiry > 0)
    );
    const totalActive = effectiveMembers.length > 0 ? activePool.length : 0;

    // Active members who have NOT checked in on selectedDate
    const absentActiveMembers = activePool.filter(
      (m) => !checkInsOnSelectedDate.has(m.id)
    );
    const absentActiveCount = absentActiveMembers.length;

    // Active members not visited 3+ days
    const notVisited3PlusCount = activePool.filter(
      (m) => m.daysSinceLastVisit >= 3 && !checkInsOnSelectedDate.has(m.id)
    ).length;

    // Inactive 7+ days across members
    const inactive7PlusCount = effectiveMembers.filter(
      (m) => m.daysSinceLastVisit >= 7 && !checkInsOnSelectedDate.has(m.id)
    ).length;

    // Daily goal % (target ~60% of active members in roster)
    const dailyGoalTarget = Math.max(1, Math.round(totalActive * 0.65));
    const dailyGoalPct =
      totalActive > 0 ? Math.min(100, Math.round((presentCount / dailyGoalTarget) * 100)) : 0;

    // Avg daily visits over last 30 days (sum of visitsThisMonth across members / elapsed days in month, or attendance records)
    const totalMonthlyVisits = effectiveMembers.reduce(
      (sum, m) => sum + (m.visitsThisMonth || 0),
      0
    );
    const avgDailyVisits =
      effectiveMembers.length > 0
        ? Math.max(presentCount, Math.round(totalMonthlyVisits / 17))
        : 0;

    // Peak window calculation from attendance records
    let morningCount = 0;
    let eveningCount = 0;
    for (const rec of effectiveAttendance) {
      const mins = parseTimeMinutes(rec.checkInTime || rec.timestamp);
      if (mins >= 330 && mins <= 660) morningCount++;
      else if (mins >= 1020 && mins <= 1290) eveningCount++;
    }
    const peakLabel =
      effectiveAttendance.length === 0
        ? 'Not enough data yet'
        : morningCount >= eveningCount
        ? 'Peak: 6 AM – 9 AM'
        : 'Peak: 6 PM – 8 PM';

    return {
      presentCount,
      totalActive,
      absentActiveCount,
      notVisited3PlusCount,
      inactive7PlusCount,
      dailyGoalPct,
      avgDailyVisits,
      peakLabel,
    };
  }, [effectiveMembers, effectiveAttendance, checkInsOnSelectedDate]);

  // Distinct plan names for advanced filter
  const availablePlans = useMemo(() => {
    const set = new Set<string>();
    effectiveMembers.forEach((m) => {
      if (m.membershipPlan) set.add(m.membershipPlan);
    });
    return ['All', ...Array.from(set)];
  }, [effectiveMembers]);

  // Quick Check-In autocomplete suggestions
  const quickMatches = useMemo(() => {
    const q = quickInput.trim().toLowerCase();
    if (!q) return [];
    return effectiveMembers
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.memberCode && m.memberCode.toLowerCase().includes(q)) ||
          m.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
      )
      .slice(0, 4);
  }, [effectiveMembers, quickInput]);

  // Filtered and sorted member rows for the attendance list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = effectiveMembers.filter((m) => {
      // Search filter
      if (q) {
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCode = m.memberCode?.toLowerCase().includes(q);
        const matchesPhone = m.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        if (!matchesName && !matchesCode && !matchesPhone) return false;
      }

      // Plan filter
      if (planFilter !== 'All' && m.membershipPlan !== planFilter) {
        return false;
      }

      const isPresent = checkInsOnSelectedDate.has(m.id);
      const isExpired = m.status === 'expired' || m.daysUntilExpiry < 0;
      const isExpiring =
        !isExpired && (m.status === 'expiring' || (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7));
      const isInactive7Plus = !isPresent && m.daysSinceLastVisit >= 7;

      if (statusFilter === 'Present Today') return isPresent;
      if (statusFilter === 'Not Checked In') return !isPresent && !isExpired;
      if (statusFilter === 'Inactive 7+ Days') return isInactive7Plus;
      if (statusFilter === 'Expiring Soon') return isExpiring;
      if (statusFilter === 'Expired') return isExpired;
      return true;
    });

    return filtered.sort((a, b) => {
      const recA = checkInsOnSelectedDate.get(a.id);
      const recB = checkInsOnSelectedDate.get(b.id);

      if (sortBy === 'Recent Check-In') {
        if (recA && !recB) return -1;
        if (!recA && recB) return 1;
        if (recA && recB) {
          return (
            parseTimeMinutes(recB.checkInTime || recB.timestamp) -
            parseTimeMinutes(recA.checkInTime || recA.timestamp)
          );
        }
        return a.daysSinceLastVisit - b.daysSinceLastVisit;
      }

      if (sortBy === 'Name A–Z') {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === 'Most Inactive') {
        return b.daysSinceLastVisit - a.daysSinceLastVisit;
      }

      if (sortBy === 'Expiry Date') {
        return a.daysUntilExpiry - b.daysUntilExpiry;
      }

      if (sortBy === 'Status') {
        const order = (m: Member) => {
          if (checkInsOnSelectedDate.has(m.id)) return 1;
          if (m.daysSinceLastVisit >= 7) return 2;
          if (m.status === 'expiring' || (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7)) return 3;
          if (m.status === 'expired' || m.daysUntilExpiry < 0) return 5;
          return 4;
        };
        return order(a) - order(b);
      }

      return 0;
    });
  }, [effectiveMembers, searchQuery, planFilter, statusFilter, sortBy, checkInsOnSelectedDate]);

  // Date navigation helpers
  const shiftDate = (daysDelta: number) => {
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() + daysDelta);
    const nextIso = curr.toISOString().split('T')[0];
    if (nextIso > TODAY_ISO) return; // Prevent future dates
    setSelectedDate(nextIso);
  };

  // Handle Check-In with validation (duplicate protection & expired plan warning)
  const handleAttemptCheckIn = (
    member: Member,
    method: AttendanceRecord['method'] = 'Manual',
    customDate?: string,
    customTime?: string,
    customNotes?: string
  ) => {
    const targetDate = customDate || selectedDate;
    const existing = effectiveAttendance.find(
      (a) =>
        a.memberId === member.id &&
        (a.date === targetDate ||
          (!a.date && targetDate === TODAY_ISO && a.timestamp.startsWith('Today')))
    );

    if (existing) {
      setQuickFeedback({
        type: 'warning',
        message: `${member.name} (${member.memberCode || member.id}) is already checked in at ${
          existing.checkInTime || 'earlier today'
        }.`,
      });
      setTimeout(() => setQuickFeedback(null), 3500);
      return;
    }

    // Warn before checking in an expired member unless override already confirmed
    const isExpired = member.status === 'expired' || member.daysUntilExpiry < 0;
    if (isExpired && !customNotes?.includes('Override')) {
      setExpiredCheckInMember(member);
      return;
    }

    const nowFormatted =
      customTime ||
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    onMarkAttendance(member.id, member.name, {
      date: targetDate,
      time: nowFormatted,
      method,
      notes: customNotes,
    });

    setQuickInput('');
    setQuickFeedback({
      type: 'success',
      message: `Checked in ${member.name} (${member.memberCode || member.id}) at ${nowFormatted}.`,
    });
    setTimeout(() => setQuickFeedback(null), 3200);
  };

  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = quickInput.trim();
    if (!q) {
      setQuickFeedback({
        type: 'error',
        message: 'Enter a Member ID (e.g. MBR001), phone number, or name first.',
      });
      setTimeout(() => setQuickFeedback(null), 3000);
      return;
    }

    // Exact code or phone match first, otherwise top match
    const exactMatch =
      effectiveMembers.find(
        (m) =>
          m.memberCode?.toLowerCase() === q.toLowerCase() ||
          m.phone.replace(/\s+/g, '') === q.replace(/\s+/g, '')
      ) || quickMatches[0];

    if (!exactMatch) {
      setQuickFeedback({
        type: 'error',
        message: `No member found matching "${q}".`,
      });
      setTimeout(() => setQuickFeedback(null), 3000);
      return;
    }

    handleAttemptCheckIn(exactMatch, 'Member_ID');
  };

  // If viewing a specific member's detail view
  const selectedMember = useMemo(
    () => effectiveMembers.find((m) => m.id === selectedMemberId) || null,
    [effectiveMembers, selectedMemberId]
  );

  if (selectedMember) {
    return (
      <MemberDetailView
        member={selectedMember}
        onBack={() => setSelectedMemberId(null)}
        onRecordPayment={(id) => onRecordPayment(id)}
        onRenewMembership={(id) => onRenewMembership(id)}
        onMarkAttendance={(id, name) =>
          onMarkAttendance(id, name, { date: selectedDate, method: 'Manual' })
        }
        onUpdateMember={onUpdateMember}
        onArchiveMember={onArchiveMember}
        onAddFollowUp={onAddFollowUp}
      />
    );
  }

  return (
    <div className="w-full pt-3 pb-6 space-y-2.5">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none">
            Attendance
          </h1>
          <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
            Track daily check-ins and member activity
          </p>
        </div>

        <button
          onClick={() => {
            setMarkModalDate(selectedDate);
            setMarkModalTime(
              new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            );
            setMarkModalMemberId(effectiveMembers[0]?.id || '');
            setMarkModalSearch('');
            setMarkModalNotes('');
            setIsMarkModalOpen(true);
          }}
          className="h-[34px] px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] active:scale-[0.98] text-white text-[11.5px] font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Mark Attendance</span>
        </button>
      </div>

      {/* 2. SEARCH + FILTER BAR */}
      <div className="bg-white rounded-xl border border-[#E5E0D6] h-[38px] px-3 flex items-center gap-2 shadow-2xs">
        <Search className="w-4 h-4 text-[#71717A] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by member name, phone, or ID..."
          className="w-full bg-transparent text-[12px] font-medium text-[#191919] placeholder:text-[#9CA3AF] focus:outline-hidden"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-0.5 rounded-full hover:bg-[#F5F2EB] text-[#71717A] cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="w-px h-4 bg-[#E5E0D6] shrink-0" />
        <button
          onClick={() => setIsFilterSheetOpen((prev) => !prev)}
          className={`p-1 rounded-lg transition-colors cursor-pointer relative ${
            planFilter !== 'All'
              ? 'bg-[#EEF2FF] text-[#1E3A8A]'
              : 'text-[#71717A] hover:text-[#191919]'
          }`}
          aria-label="Filter attendance"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {planFilter !== 'All' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] absolute top-0.5 right-0.5" />
          )}
        </button>
      </div>

      {/* Optional Plan Filter Pill Bar when filter icon is toggled */}
      {isFilterSheetOpen && (
        <div className="bg-white rounded-xl p-2.5 border border-[#EAE5DC] shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
              Filter by Membership Plan
            </span>
            {planFilter !== 'All' && (
              <button
                onClick={() => setPlanFilter('All')}
                className="text-[10.5px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availablePlans.map((plan) => (
              <button
                key={plan}
                onClick={() => setPlanFilter(plan)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  planFilter === plan
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-[#F8F6F1] text-[#52525B] hover:bg-[#EFECE6]'
                }`}
              >
                {plan}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. ATTENDANCE SUMMARY CARDS (2×2 GRID) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card 1: Present Today */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter((prev) => (prev === 'Present Today' ? 'All' : 'Present Today'))
          }
          className={`text-left bg-white rounded-2xl p-3 border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'Present Today'
              ? 'border-[#22C55E] ring-1 ring-[#22C55E]/30'
              : 'border-[#EAE5DC] hover:border-[#D6D0C4]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.4]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#52525B] truncate">
              Present Today
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[20px] font-extrabold text-[#191919] leading-none tracking-tight">
              {summaryStats.presentCount}
            </span>
            <span className="text-[11px] font-medium text-[#71717A]">
              of {summaryStats.totalActive} active
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-[#16A34A]">
            <span>↑ {summaryStats.dailyGoalPct}% daily goal</span>
          </div>
        </button>

        {/* Card 2: Absent Active */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter((prev) => (prev === 'Not Checked In' ? 'All' : 'Not Checked In'))
          }
          className={`text-left bg-white rounded-2xl p-3 border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'Not Checked In'
              ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/30'
              : 'border-[#EAE5DC] hover:border-[#D6D0C4]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <UserX className="w-3.5 h-3.5 stroke-[2.3]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#52525B] truncate">
              Absent Active
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[20px] font-extrabold text-[#191919] leading-none tracking-tight">
              {summaryStats.absentActiveCount}
            </span>
            <span className="text-[11px] font-medium text-[#71717A] truncate">
              not checked in
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-[#D97706] truncate">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {summaryStats.notVisited3PlusCount} not visited 3+ days
            </span>
          </div>
        </button>

        {/* Card 3: Inactive 7+ Days */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter((prev) => (prev === 'Inactive 7+ Days' ? 'All' : 'Inactive 7+ Days'))
          }
          className={`text-left bg-white rounded-2xl p-3 border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'Inactive 7+ Days'
              ? 'border-[#EF4444] ring-1 ring-[#EF4444]/30'
              : 'border-[#EAE5DC] hover:border-[#D6D0C4]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 stroke-[2.3]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#52525B] truncate">
              Inactive 7+ Days
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[20px] font-extrabold text-[#191919] leading-none tracking-tight">
              {summaryStats.inactive7PlusCount}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#DC2626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            <span>Needs follow-up</span>
          </div>
        </button>

        {/* Card 4: Avg. Daily Visits */}
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className="text-left bg-white rounded-2xl p-3 border border-[#EAE5DC] hover:border-[#D6D0C4] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 stroke-[2.3]" />
            </div>
            <span className="text-[11.5px] font-semibold text-[#52525B] truncate">
              Avg. Daily Visits
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[20px] font-extrabold text-[#191919] leading-none tracking-tight">
              {summaryStats.avgDailyVisits}
            </span>
            <span className="text-[11px] font-medium text-[#71717A] truncate">
              last 30 days
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#7C3AED] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] shrink-0" />
            <span className="truncate">{summaryStats.peakLabel}</span>
          </div>
        </button>
      </div>

      {/* 4. DATE SELECTOR BAR */}
      <div className="bg-white rounded-xl px-3 py-2 border border-[#EAE5DC] shadow-2xs flex items-center justify-between gap-2 relative">
        <button
          type="button"
          onClick={() => setIsDatePickerOpen((prev) => !prev)}
          className="flex items-center gap-2 text-left cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="text-[12px] font-bold text-[#191919] group-hover:text-[#1E3A8A] transition-colors">
            {formatSelectedDateLabel(selectedDate)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="w-6 h-6 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] text-[#52525B] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(TODAY_ISO)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              selectedDate === TODAY_ISO
                ? 'bg-[#EEF2FF] text-[#1E3A8A]'
                : 'bg-[#F5F2EB] text-[#52525B] hover:bg-[#EAE5DC]'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => shiftDate(1)}
            disabled={selectedDate >= TODAY_ISO}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              selectedDate >= TODAY_ISO
                ? 'bg-[#F8F6F1] text-[#D4D4D8] cursor-not-allowed'
                : 'bg-[#F5F2EB] hover:bg-[#EAE5DC] text-[#52525B] cursor-pointer'
            }`}
            aria-label="Next day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Date Picker Dropdown */}
        {isDatePickerOpen && (
          <div className="absolute left-2 top-11 z-30 bg-white rounded-2xl p-3 border border-[#E5E0D6] shadow-lg w-64 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#191919]">Select Attendance Date</span>
              <button
                onClick={() => setIsDatePickerOpen(false)}
                className="text-[#71717A] hover:text-[#191919] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="date"
              value={selectedDate}
              max={TODAY_ISO}
              onChange={(e) => {
                if (e.target.value && e.target.value <= TODAY_ISO) {
                  setSelectedDate(e.target.value);
                  setIsDatePickerOpen(false);
                }
              }}
              className="w-full h-[34px] px-2.5 rounded-xl border border-[#E5E0D6] text-[12px] font-medium text-[#191919]"
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                {
                  label: `Today (${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
                  date: TODAY_ISO,
                },
                {
                  label: 'Yesterday',
                  date: getYesterdayIso(),
                },
                {
                  label: new Date(Date.now() - 2 * 86400000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  }),
                  date: getDaysAgoIso(2),
                },
                {
                  label: new Date(Date.now() - 3 * 86400000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  }),
                  date: getDaysAgoIso(3),
                },
              ].map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.date);
                    setIsDatePickerOpen(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold cursor-pointer ${
                    selectedDate === d.date
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-[#F5F2EB] text-[#52525B] hover:bg-[#EAE5DC]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. STATUS FILTER PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(
          [
            'All',
            'Present Today',
            'Not Checked In',
            'Inactive 7+ Days',
            'Expiring Soon',
            'Expired',
          ] as AttendanceStatusFilter[]
        ).map((pill) => {
          const isActive = statusFilter === pill;
          return (
            <button
              key={pill}
              type="button"
              onClick={() => setStatusFilter(pill)}
              className={`h-[30px] px-3 rounded-full text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#1E3A8A] text-white shadow-2xs font-bold'
                  : 'bg-white text-[#52525B] border border-[#E5E0D6] hover:border-[#D6D0C4]'
              }`}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* 6. QUICK CHECK-IN CARD */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-bold text-[#191919] leading-tight">
              Quick Check-In
            </h2>
            <p className="text-[10.5px] font-medium text-[#71717A]">
              Fast entry for arriving members
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsScanModalOpen(true)}
              className="h-[28px] px-2.5 rounded-lg bg-[#F8F6F1] hover:bg-[#EFECE6] border border-[#E5E0D6] text-[#191919] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#52525B]" />
              <span>Scan / ID</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSubmit()}
              className="h-[28px] px-2.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.98] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Check In</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleQuickSubmit} className="relative">
          <div className="bg-[#FBF9F5] border border-[#E5E0D6] focus-within:border-[#1E3A8A] rounded-xl h-[36px] px-3 flex items-center justify-between gap-2 transition-colors">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Enter Member ID or Phone..."
              className="w-full bg-transparent text-[12px] font-medium text-[#191919] placeholder:text-[#9CA3AF] focus:outline-hidden"
            />
            {quickInput ? (
              <button
                type="button"
                onClick={() => setQuickInput('')}
                className="text-[#71717A] hover:text-[#191919] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Hash className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            )}
          </div>

          {/* Instant Member Suggestions Dropdown */}
          {quickMatches.length > 0 && (
            <div className="mt-1.5 bg-white rounded-xl border border-[#E5E0D6] shadow-md divide-y divide-[#F2EFE8] overflow-hidden">
              {quickMatches.map((m) => {
                const alreadyIn = checkInsOnSelectedDate.get(m.id);
                const isExpired = m.status === 'expired' || m.daysUntilExpiry < 0;
                return (
                  <div
                    key={m.id}
                    className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-[#FBF9F5]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-[#191919] truncate">
                          {m.name}
                        </span>
                        <span className="text-[10.5px] font-semibold text-[#71717A]">
                          {m.memberCode}
                        </span>
                        {isExpired && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#FEE2E2] text-[#B91C1C] text-[9.5px] font-bold">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-[#71717A]">
                        {m.membershipPlan} • {m.phone}
                      </p>
                    </div>

                    {alreadyIn ? (
                      <span className="px-2 py-1 rounded-lg bg-[#DCFCE7] text-[#15803D] text-[10.5px] font-bold shrink-0">
                        ✓ In at {alreadyIn.checkInTime || 'Today'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAttemptCheckIn(m, 'Member_ID')}
                        className="px-2.5 py-1 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-[10.5px] font-bold shrink-0 cursor-pointer"
                      >
                        ✓ Check In
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </form>

        {/* Inline Feedback Toast */}
        {quickFeedback && (
          <div
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 ${
              quickFeedback.type === 'success'
                ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                : quickFeedback.type === 'warning'
                ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                : 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]'
            }`}
          >
            <span>{quickFeedback.message}</span>
            <button
              type="button"
              onClick={() => setQuickFeedback(null)}
              className="opacity-75 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 7. SECTION HEADER — TODAY'S ATTENDANCE */}
      <div className="flex items-center justify-between pt-1 px-0.5 relative">
        <h2 className="text-[13.5px] font-bold text-[#191919]">
          {selectedDate === TODAY_ISO ? "Today's Attendance" : 'Attendance Records'} (
          {statusFilter === 'All' && !searchQuery && planFilter === 'All'
            ? summaryStats.presentCount
            : filteredMembers.length}
          )
        </h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 text-[11.5px] font-semibold text-[#52525B] hover:text-[#191919] cursor-pointer"
          >
            <span>{sortBy}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {isSortMenuOpen && (
            <div className="absolute right-0 top-6 z-30 bg-white rounded-xl border border-[#E5E0D6] shadow-lg py-1 w-44">
              {(
                [
                  'Recent Check-In',
                  'Name A–Z',
                  'Most Inactive',
                  'Expiry Date',
                  'Status',
                ] as AttendanceSortOption[]
              ).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSortBy(option);
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-[11.5px] flex items-center justify-between cursor-pointer ${
                    sortBy === option
                      ? 'bg-[#EEF2FF] text-[#1E3A8A] font-bold'
                      : 'text-[#52525B] hover:bg-[#F8F6F1] font-medium'
                  }`}
                >
                  <span>{option}</span>
                  {sortBy === option && <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8. ATTENDANCE MEMBER LIST */}
      {effectiveMembers.length === 0 ? (
        /* Empty State 1 — No members in gym */
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center mx-auto">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-[#191919]">No members yet</h3>
          <p className="text-[11.5px] text-[#71717A] max-w-xs mx-auto">
            Add your first member to start tracking attendance.
          </p>
          {onOpenAddMember && (
            <button
              type="button"
              onClick={onOpenAddMember}
              className="mt-2 h-[34px] px-4 rounded-xl bg-[#1E3A8A] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Member</span>
            </button>
          )}
        </div>
      ) : filteredMembers.length === 0 ? (
        /* Empty State 2 / 3 — No matching records */
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-[#F5F2EB] text-[#71717A] flex items-center justify-center mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-[#191919]">
            {statusFilter === 'Present Today'
              ? 'No check-ins recorded for this date'
              : 'No matching attendance records'}
          </h3>
          <p className="text-[11.5px] text-[#71717A] max-w-xs mx-auto">
            {statusFilter === 'Present Today'
              ? 'Use Quick Check-In or Mark Attendance when members arrive.'
              : 'Try adjusting your search or clearing the active filters.'}
          </p>
          {(searchQuery || statusFilter !== 'All' || planFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setPlanFilter('All');
              }}
              className="mt-1 px-3 py-1.5 rounded-xl bg-[#EEF2FF] text-[#1E3A8A] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const checkInRec = checkInsOnSelectedDate.get(member.id);
            const isPresent = Boolean(checkInRec);
            const isExpired = member.status === 'expired' || member.daysUntilExpiry < 0;
            const isExpiringSoon =
              !isExpired &&
              (member.status === 'expiring' ||
                (member.daysUntilExpiry >= 0 && member.daysUntilExpiry <= 7));
            const isInactive7Plus = !isPresent && member.daysSinceLastVisit >= 7;

            // Determine Status Pill appearance
            let statusBadge = {
              label: 'Not Checked In',
              bg: 'bg-[#FEF3C7]',
              text: 'text-[#B45309]',
              dot: 'bg-[#F59E0B]',
              border: 'border-[#FDE68A]',
            };

            if (isPresent) {
              statusBadge = {
                label: 'Present',
                bg: 'bg-[#DCFCE7]',
                text: 'text-[#15803D]',
                dot: 'bg-[#22C55E]',
                border: 'border-[#BBF7D0]',
              };
            } else if (isExpired) {
              statusBadge = {
                label: 'Expired',
                bg: 'bg-[#FEE2E2]',
                text: 'text-[#B91C1C]',
                dot: 'bg-[#EF4444]',
                border: 'border-[#FECACA]',
              };
            } else if (isInactive7Plus) {
              statusBadge = {
                label: `Inactive ${member.daysSinceLastVisit}d`,
                bg: 'bg-[#FEE2E2]',
                text: 'text-[#B91C1C]',
                dot: 'bg-[#EF4444]',
                border: 'border-[#FECACA]',
              };
            } else if (isExpiringSoon) {
              statusBadge = {
                label: `Expiring in ${Math.max(1, member.daysUntilExpiry)}d`,
                bg: 'bg-[#FEF3C7]',
                text: 'text-[#B45309]',
                dot: 'bg-[#F59E0B]',
                border: 'border-[#FDE68A]',
              };
            }

            const cleanPhone = member.phone.replace(/[^0-9]/g, '');
            const waLink = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
              `Hi ${member.name}, we missed seeing you at MuscleFit Gym! Hope to see you for your workout soon.`
            )}`;

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-3 border border-[#EAE5DC] hover:border-[#D6D0C4] shadow-2xs transition-all"
              >
                {/* Row 1: Avatar + Member Info + Status Badge */}
                <div
                  onClick={() => setSelectedMemberId(member.id)}
                  className="flex items-start justify-between gap-2.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#E5E0D6]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#1E3A8A] font-bold text-[12px] flex items-center justify-center border border-[#E0E7FF]">
                          {getInitials(member.name)}
                        </div>
                      )}
                      <span
                        className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                          isPresent
                            ? 'bg-[#22C55E]'
                            : isExpired || isInactive7Plus
                            ? 'bg-[#EF4444]'
                            : 'bg-[#F59E0B]'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[13.5px] font-bold text-[#191919] leading-tight truncate">
                          {member.name}
                        </span>
                        <span className="text-[11px] font-semibold text-[#71717A]">
                          {member.memberCode || member.id.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-[#71717A] truncate mt-0.5">
                        {member.membershipPlan} • {member.phone}
                      </p>
                    </div>
                  </div>

                  {/* Right Status Pill */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border flex items-center gap-1 shrink-0 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>

                {/* Row 2: Visit Metadata & Quick Action Controls */}
                <div className="mt-2.5 pt-2 border-t border-[#F2EFE8] flex items-center justify-between gap-2">
                  {/* Left Visit Summary */}
                  <div
                    onClick={() => setSelectedMemberId(member.id)}
                    className="flex items-center gap-1.5 text-[11px] min-w-0 cursor-pointer"
                  >
                    {isPresent && checkInRec ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span className="text-[#4B5563] font-medium truncate">
                          Checked in at{' '}
                          <strong className="font-bold text-[#191919]">
                            {checkInRec.checkInTime ||
                              checkInRec.timestamp.replace('Today, ', '')}
                          </strong>{' '}
                          • {member.visitsThisMonth || 1} visits this month
                        </span>
                      </>
                    ) : isInactive7Plus ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                        <span className="truncate">
                          <strong className="font-bold text-[#DC2626]">
                            Last visit: {member.daysSinceLastVisit} days ago
                          </strong>{' '}
                          <span className="text-[#71717A] font-medium">
                            • {member.visitsThisMonth || 0} visits this month
                          </span>
                        </span>
                      </>
                    ) : isExpiringSoon ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                        <span className="text-[#52525B] font-medium truncate">
                          Last visit: {member.lastVisitDate} •{' '}
                          <strong className="font-bold text-[#B45309]">
                            Plan ends {member.expiryDate}
                          </strong>
                        </span>
                      </>
                    ) : isExpired ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                        <span className="text-[#52525B] font-medium truncate">
                          Last visit: {member.lastVisitDate} •{' '}
                          <strong className="font-bold text-[#DC2626]">
                            Expired {member.expiryDate}
                          </strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                        <span className="text-[#52525B] font-medium truncate">
                          Last visit: {member.lastVisitDate} • {member.visitsThisMonth || 0} visits
                          this month
                        </span>
                      </>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPresent && checkInRec ? (
                      <button
                        type="button"
                        onClick={() =>
                          setInspectingCheckIn({ member, record: checkInRec })
                        }
                        className="h-[26px] px-2.5 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[2.6]" />
                        <span>Checked In</span>
                      </button>
                    ) : (
                      <>
                        {isInactive7Plus && (
                          <>
                            <a
                              href={`tel:${cleanPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-[26px] h-[26px] rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] flex items-center justify-center transition-colors"
                              aria-label={`Call ${member.name}`}
                              title={`Call ${member.name}`}
                            >
                              <Phone className="w-3 h-3 stroke-[2.2]" />
                            </a>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-[26px] h-[26px] rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] flex items-center justify-center transition-colors"
                              aria-label={`WhatsApp ${member.name}`}
                              title={`WhatsApp ${member.name}`}
                            >
                              <MessageCircle className="w-3 h-3 stroke-[2.2]" />
                            </a>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAttemptCheckIn(member, 'Manual')}
                          className="h-[26px] px-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] active:scale-[0.98] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Check className="w-3 h-3 stroke-[2.6]" />
                          <span>Check In</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className="p-0.5 text-[#9CA3AF] hover:text-[#191919] cursor-pointer"
                      aria-label={`Open ${member.name} profile`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: + MARK ATTENDANCE MODAL                               */}
      {/* ============================================================== */}
      {isMarkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#EAE5DC] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-4 py-3.5 border-b border-[#F2EFE8] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#191919]">Mark Attendance</h3>
                <p className="text-[11px] text-[#71717A]">
                  Record manual or backdated member check-in
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMarkModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#52525B] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Search & Select Member */}
              <div>
                <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                  Select Member *
                </label>
                <div className="bg-[#FBF9F5] border border-[#E5E0D6] rounded-xl h-[36px] px-3 flex items-center gap-2 mb-1.5">
                  <Search className="w-3.5 h-3.5 text-[#71717A]" />
                  <input
                    type="text"
                    value={markModalSearch}
                    onChange={(e) => setMarkModalSearch(e.target.value)}
                    placeholder="Filter member by name, ID, or phone..."
                    className="w-full bg-transparent text-[12px] text-[#191919] focus:outline-hidden"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto rounded-xl border border-[#E5E0D6] divide-y divide-[#F2EFE8]">
                  {effectiveMembers
                    .filter((m) => {
                      const q = markModalSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        m.name.toLowerCase().includes(q) ||
                        m.memberCode?.toLowerCase().includes(q) ||
                        m.phone.includes(q)
                      );
                    })
                    .map((m) => {
                      const isSelected = markModalMemberId === m.id;
                      const isAlreadyCheckedIn = effectiveAttendance.some(
                        (a) =>
                          a.memberId === m.id &&
                          (a.date === markModalDate ||
                            (!a.date &&
                              markModalDate === TODAY_ISO &&
                              a.timestamp.startsWith('Today')))
                      );
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMarkModalMemberId(m.id)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#EEF2FF]' : 'hover:bg-[#FBF9F5]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-bold text-[#191919] truncate">
                                {m.name}
                              </span>
                              <span className="text-[10.5px] font-semibold text-[#71717A]">
                                {m.memberCode}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-[#71717A]">
                              {m.membershipPlan} • {m.phone}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isAlreadyCheckedIn && (
                              <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold">
                                Checked In
                              </span>
                            )}
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                                  : 'border-[#D4D4D8]'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={markModalDate}
                    max={TODAY_ISO}
                    onChange={(e) => setMarkModalDate(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-xl bg-[#FBF9F5] border border-[#E5E0D6] text-[12px] font-medium text-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    value={markModalTime}
                    onChange={(e) => setMarkModalTime(e.target.value)}
                    placeholder="e.g. 07:30 AM"
                    className="w-full h-[36px] px-3 rounded-xl bg-[#FBF9F5] border border-[#E5E0D6] text-[12px] font-medium text-[#191919]"
                  />
                </div>
              </div>

              {/* Entry Method */}
              <div>
                <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                  Check-In Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'Manual', label: 'Manual' },
                      { id: 'Member_ID', label: 'Member ID' },
                      { id: 'QR_Scan', label: 'QR Scan' },
                      { id: 'Biometric', label: 'Biometric' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMarkModalMethod(m.id)}
                      className={`py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                        markModalMethod === m.id
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                          : 'bg-[#FBF9F5] text-[#52525B] border-[#E5E0D6]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={markModalNotes}
                  onChange={(e) => setMarkModalNotes(e.target.value)}
                  placeholder="e.g. Morning batch, guest pass, forgot card..."
                  className="w-full h-[36px] px-3 rounded-xl bg-[#FBF9F5] border border-[#E5E0D6] text-[12px] text-[#191919]"
                />
              </div>
            </div>

            <div className="p-3.5 border-t border-[#F2EFE8] flex items-center justify-end gap-2 bg-[#FBF9F5]">
              <button
                type="button"
                onClick={() => setIsMarkModalOpen(false)}
                className="h-[34px] px-3.5 rounded-xl border border-[#E5E0D6] bg-white text-[#52525B] text-[12px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const chosen = effectiveMembers.find((m) => m.id === markModalMemberId);
                  if (!chosen) return;
                  setSelectedDate(markModalDate);
                  setIsMarkModalOpen(false);
                  handleAttemptCheckIn(
                    chosen,
                    markModalMethod,
                    markModalDate,
                    markModalTime,
                    markModalNotes
                  );
                }}
                className="h-[34px] px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Confirm Check-In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: SCAN / ID FAST CHECK-IN MODAL                         */}
      {/* ============================================================== */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#EAE5DC] shadow-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#F2EFE8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-[#191919]">
                    Scan QR or Tap Member ID
                  </h3>
                  <p className="text-[10.5px] text-[#71717A]">
                    Instant reception check-in for arriving members
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#52525B] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Simulated QR Scanner Frame */}
              <div className="bg-[#191919] text-white rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
                    <QrCode className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold">Reception Pass Scanner Ready</p>
                    <p className="text-[10.5px] text-[#A1A1AA]">
                      Tap any member pass below to simulate scan
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#4ADE80] text-[10px] font-bold">
                  LIVE
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {effectiveMembers.map((m) => {
                  const alreadyIn = checkInsOnSelectedDate.get(m.id);
                  return (
                    <div
                      key={m.id}
                      className="px-3 py-2 rounded-xl border border-[#EAE5DC] flex items-center justify-between gap-2 bg-[#FBF9F5]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-extrabold text-[#1E3A8A] bg-[#EEF2FF] px-1.5 py-0.5 rounded-md">
                            {m.memberCode}
                          </span>
                          <span className="text-[12px] font-bold text-[#191919] truncate">
                            {m.name}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[#71717A] mt-0.5">
                          {m.membershipPlan} • {m.phone}
                        </p>
                      </div>

                      {alreadyIn ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[#DCFCE7] text-[#15803D] text-[10.5px] font-bold shrink-0">
                          ✓ Checked In
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsScanModalOpen(false);
                            handleAttemptCheckIn(m, 'QR_Scan');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white text-[10.5px] font-bold shrink-0 cursor-pointer"
                        >
                          Scan In
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: EXPIRED MEMBERSHIP CHECK-IN WARNING                   */}
      {/* ============================================================== */}
      {expiredCheckInMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-[#FECACA] shadow-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#191919]">
                    Membership Expired
                  </h3>
                  <p className="text-[11px] text-[#71717A]">
                    {expiredCheckInMember.name} ({expiredCheckInMember.memberCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpiredCheckInMember(null)}
                className="text-[#71717A] hover:text-[#191919] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[11.5px] text-[#991B1B] space-y-1">
              <p className="font-semibold">
                Plan ({expiredCheckInMember.membershipPlan}) expired on{' '}
                {expiredCheckInMember.expiryDate}.
              </p>
              <p className="text-[11px] text-[#B91C1C]">
                Would you like to renew their membership first or allow a one-time override
                check-in?
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const memberId = expiredCheckInMember.id;
                  setExpiredCheckInMember(null);
                  onRenewMembership(memberId);
                }}
                className="w-full h-[36px] rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renew Membership Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = expiredCheckInMember;
                  setExpiredCheckInMember(null);
                  handleAttemptCheckIn(
                    target,
                    'Manual',
                    selectedDate,
                    undefined,
                    'Override check-in while expired'
                  );
                }}
                className="w-full h-[34px] rounded-xl border border-[#E5E0D6] bg-[#FBF9F5] hover:bg-[#F2EFE8] text-[#52525B] text-[11.5px] font-semibold cursor-pointer"
              >
                Allow One-Time Override Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: CHECK-IN DETAILS / UNDO ACCIDENTAL CHECK-IN           */}
      {/* ============================================================== */}
      {inspectingCheckIn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-[#EAE5DC] shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#191919]">Check-In Details</h3>
                  <p className="text-[11px] text-[#71717A]">
                    {inspectingCheckIn.member.name} ({inspectingCheckIn.member.memberCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCheckIn(null)}
                className="text-[#71717A] hover:text-[#191919] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FBF9F5] rounded-2xl p-3 border border-[#EAE5DC] space-y-1.5 text-[11.5px]">
              <div className="flex justify-between">
                <span className="text-[#71717A]">Check-In Time</span>
                <span className="font-bold text-[#191919]">
                  {inspectingCheckIn.record.checkInTime || inspectingCheckIn.record.timestamp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Method</span>
                <span className="font-semibold text-[#191919]">
                  {inspectingCheckIn.record.method.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Monthly Visits</span>
                <span className="font-semibold text-[#191919]">
                  {inspectingCheckIn.member.visitsThisMonth || 1} visits
                </span>
              </div>
              {inspectingCheckIn.record.notes && (
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Note</span>
                  <span className="font-medium text-[#52525B]">
                    {inspectingCheckIn.record.notes}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {onUnmarkAttendance && (
                <button
                  type="button"
                  onClick={() => {
                    onUnmarkAttendance(inspectingCheckIn.record.id);
                    setInspectingCheckIn(null);
                  }}
                  className="h-[34px] px-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo Check-In</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const mId = inspectingCheckIn.member.id;
                  setInspectingCheckIn(null);
                  setSelectedMemberId(mId);
                }}
                className="flex-1 h-[34px] px-3 rounded-xl bg-[#1E3A8A] text-white text-[11.5px] font-bold cursor-pointer"
              >
                Open Member Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
