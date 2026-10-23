/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Check,
  Phone,
  MessageCircle,
  AlertTriangle,
  AlertCircle,
  X,
  UserCheck,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Member, AttendanceRecord } from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';
import {
  WhatsAppFollowUpModal,
  WhatsAppFollowUpTarget,
} from '../modals/WhatsAppFollowUpModal';
import { getTodayIso, getYesterdayIso, getDaysAgoIso, formatIndianDate } from '../../utils/dateUtils';

export type AttendanceTab = 'all' | 'present' | 'absent' | 'inactive';

interface AttendanceScreenProps {
  members: Member[];
  attendance: AttendanceRecord[];
  activeMembersCount: number;
  gymName?: string;
  upiId?: string;
  initialTab?: AttendanceTab;
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

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({
  members,
  attendance,
  activeMembersCount,
  gymName = 'My Gym',
  upiId,
  initialTab = 'all',
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

  // Search & Filter state — Member search is primary interaction
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<AttendanceTab>(initialTab);
  const [inactivityDaysFilter, setInactivityDaysFilter] = useState<7 | 14 | 30>(7);
  const [whatsAppTarget, setWhatsAppTarget] = useState<WhatsAppFollowUpTarget | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [expiredCheckInMember, setExpiredCheckInMember] = useState<Member | null>(null);
  const [inspectingCheckIn, setInspectingCheckIn] = useState<{
    member: Member;
    record: AttendanceRecord;
  } | null>(null);

  // Feedback Toast state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const effectiveMembers = useMemo(() => (isEmptyState ? [] : members), [members, isEmptyState]);
  const effectiveAttendance = useMemo(
    () => (isEmptyState ? [] : attendance),
    [attendance, isEmptyState]
  );

  // Map member IDs checked in on the selected date
  const checkInsOnSelectedDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    effectiveAttendance.forEach((rec) => {
      if (
        rec.date === selectedDate ||
        (!rec.date && selectedDate === TODAY_ISO && rec.timestamp.startsWith('Today'))
      ) {
        map.set(rec.memberId, rec);
      }
    });
    return map;
  }, [effectiveAttendance, selectedDate]);

  // Real Attendance Counts
  const presentCount = checkInsOnSelectedDate.size;
  const absentActiveCount = Math.max(0, activeMembersCount - presentCount);

  // Calculate actual last visit & inactivity strictly from real attendance history
  const memberInactivityMap = useMemo(() => {
    const todayMidnight = new Date(TODAY_ISO + 'T00:00:00').getTime();
    const latestRecByMember = new Map<string, string>();

    effectiveAttendance.forEach((rec) => {
      if (!rec.memberId) return;
      let recDate = rec.date || '';
      if (!recDate && rec.timestamp?.startsWith('Today')) {
        recDate = TODAY_ISO;
      }
      if (!recDate) return;
      const prev = latestRecByMember.get(rec.memberId);
      if (!prev || recDate > prev) {
        latestRecByMember.set(rec.memberId, recDate);
      }
    });

    const result = new Map<
      string,
      {
        hasHistory: boolean;
        daysSinceLastVisit: number;
        lastVisitDisplay: string;
      }
    >();

    effectiveMembers.forEach((m) => {
      const latestIso = latestRecByMember.get(m.id);
      if (latestIso) {
        const attMidnight = new Date(latestIso + 'T00:00:00').getTime();
        const days = Math.max(
          0,
          Math.round((todayMidnight - attMidnight) / (1000 * 60 * 60 * 24))
        );
        const display =
          latestIso === TODAY_ISO
            ? 'Today'
            : formatIndianDate(latestIso);
        result.set(m.id, {
          hasHistory: true,
          daysSinceLastVisit: days,
          lastVisitDisplay: display,
        });
      } else if (
        m.lastVisitDate &&
        m.lastVisitDate !== 'No visits recorded' &&
        m.lastVisitDate !== 'Never' &&
        m.daysSinceLastVisit >= 0 &&
        (m.totalVisits === undefined || m.totalVisits > 0 || m.daysSinceLastVisit > 0)
      ) {
        result.set(m.id, {
          hasHistory: true,
          daysSinceLastVisit: m.daysSinceLastVisit,
          lastVisitDisplay: m.lastVisitDate,
        });
      } else {
        result.set(m.id, {
          hasHistory: false,
          daysSinceLastVisit: -1,
          lastVisitDisplay: 'No attendance history recorded',
        });
      }
    });

    return result;
  }, [effectiveAttendance, effectiveMembers]);

  // Active customers who have attendance history and are inactive by 7+, 14+, or 30+ days
  const inactiveCounts = useMemo(() => {
    let d7 = 0;
    let d14 = 0;
    let d30 = 0;
    let noHistoryActiveCount = 0;

    effectiveMembers.forEach((m) => {
      // Exclude members who are expired (not active customers)
      if (m.status === 'expired' || m.daysUntilExpiry < 0) return;
      const info = memberInactivityMap.get(m.id);
      if (!info || !info.hasHistory) {
        noHistoryActiveCount++;
        return;
      }
      if (info.daysSinceLastVisit >= 7) d7++;
      if (info.daysSinceLastVisit >= 14) d14++;
      if (info.daysSinceLastVisit >= 30) d30++;
    });

    return { d7, d14, d30, noHistoryActiveCount };
  }, [effectiveMembers, memberInactivityMap]);

  // Filter members based on primary search query and active tab
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return effectiveMembers
      .filter((m) => {
        // 1. Search Query Filter (name, phone, member ID code)
        if (q) {
          const nameMatch = m.name.toLowerCase().includes(q);
          const codeMatch = (m.memberCode || m.id).toLowerCase().includes(q);
          const phoneMatch = m.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
          if (!nameMatch && !codeMatch && !phoneMatch) return false;
        }

        // 2. Tab Filter
        if (activeTab === 'inactive') {
          // Exclude expired members
          if (m.status === 'expired' || m.daysUntilExpiry < 0) return false;
          const info = memberInactivityMap.get(m.id);
          if (!info || !info.hasHistory) return false;
          return info.daysSinceLastVisit >= inactivityDaysFilter;
        }

        const isPresent = checkInsOnSelectedDate.has(m.id);
        if (activeTab === 'present' && !isPresent) return false;
        if (activeTab === 'absent' && isPresent) return false;

        return true;
      })
      .sort((a, b) => {
        if (activeTab === 'inactive') {
          const infoA = memberInactivityMap.get(a.id)?.daysSinceLastVisit || 0;
          const infoB = memberInactivityMap.get(b.id)?.daysSinceLastVisit || 0;
          return infoB - infoA;
        }

        // If searching, keep search relevance
        if (q) {
          const aExact = a.name.toLowerCase().startsWith(q) || (a.memberCode || '').toLowerCase().includes(q);
          const bExact = b.name.toLowerCase().startsWith(q) || (b.memberCode || '').toLowerCase().includes(q);
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
        }

        // Otherwise: if on "All" or "Present", show recently checked in first, then alphabetical
        const aChecked = checkInsOnSelectedDate.has(a.id);
        const bChecked = checkInsOnSelectedDate.has(b.id);
        if (activeTab === 'all') {
          if (aChecked && !bChecked) return -1;
          if (!aChecked && bChecked) return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [
    effectiveMembers,
    searchQuery,
    activeTab,
    checkInsOnSelectedDate,
    memberInactivityMap,
    inactivityDaysFilter,
  ]);

  // Date Navigation
  const shiftDate = (daysDelta: number) => {
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() + daysDelta);
    const nextIso = curr.toISOString().split('T')[0];
    if (nextIso > TODAY_ISO) return; // Prevent future dates
    setSelectedDate(nextIso);
  };

  // Perform Check In with duplicate protection & validation
  const handleAttemptCheckIn = (
    member: Member,
    method: AttendanceRecord['method'] = 'Manual',
    customNotes?: string
  ) => {
    const existing = checkInsOnSelectedDate.get(member.id);

    // Duplicate check-in prevention
    if (existing) {
      showFeedback(
        'warning',
        `${member.name} (${member.memberCode || member.id}) is already checked in at ${
          existing.checkInTime || 'earlier'
        }.`
      );
      return;
    }

    // Check for expired plan
    const isExpired = member.status === 'expired' || member.daysUntilExpiry < 0;
    if (isExpired && !customNotes?.includes('Override')) {
      setExpiredCheckInMember(member);
      return;
    }

    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    onMarkAttendance(member.id, member.name, {
      date: selectedDate,
      time: nowTime,
      method,
      notes: customNotes,
    });

    showFeedback(
      'success',
      `Checked in ${member.name} (${member.memberCode || member.id}) at ${nowTime}.`
    );
  };

  // Handle Scan / ID manual submission
  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCodeInput.trim().toLowerCase();
    if (!code) return;

    const matched = effectiveMembers.find(
      (m) =>
        (m.memberCode || '').toLowerCase() === code ||
        m.id.toLowerCase() === code ||
        m.phone.replace(/[^0-9]/g, '').slice(-10) === code.replace(/[^0-9]/g, '').slice(-10)
    );

    if (!matched) {
      showFeedback('error', `No member found with ID or phone "${manualCodeInput}".`);
      return;
    }

    setManualCodeInput('');
    setIsScanModalOpen(false);
    handleAttemptCheckIn(matched, 'Member_ID');
  };

  // If viewing a member's full detail view
  const activeMemberDetail = useMemo(
    () => effectiveMembers.find((m) => m.id === selectedMemberId) || null,
    [effectiveMembers, selectedMemberId]
  );

  if (activeMemberDetail) {
    return (
      <MemberDetailView
        member={activeMemberDetail}
        onBack={() => setSelectedMemberId(null)}
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
    <div className="w-full flex-1 pb-4">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
            feedback.type === 'success'
              ? 'bg-[#15803D] text-white'
              : feedback.type === 'warning'
              ? 'bg-[#B45309] text-white'
              : 'bg-[#DC2626] text-white'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER & DATE SWITCHER                                  */}
      {/* ============================================================== */}
      <header className="pt-2 pb-2 px-0.5 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
            Attendance
          </h1>
          <p className="text-[12px] text-[#71717A] mt-0.5 leading-none">
            Fast member check-ins for daily workouts
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-1 bg-white border border-[#EAE5DC] rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="w-7 h-7 rounded-lg hover:bg-[#FAF8F5] text-[#52525B] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Previous Day"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="px-2 py-0.5 text-[11px] font-semibold text-[#191919] hover:text-[#102A71] flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-[#71717A]" />
              <span>
                {selectedDate === TODAY_ISO
                  ? 'Today'
                  : selectedDate === getYesterdayIso()
                  ? 'Yesterday'
                  : formatIndianDate(selectedDate)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => shiftDate(1)}
              disabled={selectedDate >= TODAY_ISO}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                selectedDate >= TODAY_ISO
                  ? 'text-[#D1D5DB] cursor-not-allowed'
                  : 'hover:bg-[#FAF8F5] text-[#52525B] cursor-pointer'
              }`}
              aria-label="Next Day"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Date Picker Popover */}
          {isDatePickerOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-40 bg-white rounded-xl p-3 border border-[#EAE5DC] shadow-xl w-64 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#191919]">Select Date</span>
                <button
                  type="button"
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
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5DC] text-xs font-semibold text-[#191919]"
              />
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(TODAY_ISO);
                    setIsDatePickerOpen(false);
                  }}
                  className={`flex-1 py-1 text-[10.5px] font-bold rounded-lg border cursor-pointer ${
                    selectedDate === TODAY_ISO
                      ? 'bg-[#102A71] text-white border-[#102A71]'
                      : 'bg-[#FAF8F5] text-[#52525B] border-[#EAE5DC]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(getYesterdayIso());
                    setIsDatePickerOpen(false);
                  }}
                  className={`flex-1 py-1 text-[10.5px] font-bold rounded-lg border cursor-pointer ${
                    selectedDate === getYesterdayIso()
                      ? 'bg-[#102A71] text-white border-[#102A71]'
                      : 'bg-[#FAF8F5] text-[#52525B] border-[#EAE5DC]'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. PRIMARY INTERACTION — MEMBER SEARCH & LOOKUP BAR            */}
      {/* ============================================================== */}
      <div className="mt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member name, phone, or Member ID..."
            className="w-full pl-9 pr-8 py-2.5 text-[13px] bg-white border border-[#EAE5DC] focus:border-[#102A71] rounded-xl text-[#191919] placeholder-[#8E8E93] focus:outline-hidden shadow-2xs transition-colors"
            autoFocus={false}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#191919] p-1 cursor-pointer"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scan / ID Shortcut Button */}
        <button
          type="button"
          onClick={() => setIsScanModalOpen(true)}
          className="h-[42px] px-3 rounded-xl bg-white hover:bg-[#FAF8F5] active:scale-95 border border-[#EAE5DC] text-[#191919] text-[11.5px] font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
          title="Scan QR or Enter Member ID shortcut"
        >
          <QrCode className="w-4 h-4 text-[#102A71]" />
          <span>Scan / ID</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. TODAY'S ATTENDANCE SUMMARY STRIP & FILTER TABS              */}
      {/* ============================================================== */}
      <div className="mt-2.5 bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[19px] sm:text-[21px] font-extrabold text-[#191919] leading-none">
                {presentCount}
              </span>
              <span className="text-[11.5px] font-medium text-[#71717A] leading-none">
                Present on {formatSelectedDateLabel(selectedDate).split(',')[0]}
              </span>
            </div>
            <p className="text-[11px] text-[#52525B] mt-1 leading-none font-medium">
              {activeMembersCount > 0
                ? `${presentCount} of ${activeMembersCount} active members checked in (${Math.round(
                    (presentCount / Math.max(1, activeMembersCount)) * 100
                  )}%)`
                : 'No active members yet'}
            </p>
          </div>
        </div>

        {/* Segmented Filter Controls: All, Present, Absent, Inactive Detector */}
        <div className="flex items-center gap-1 p-1 bg-[#F4F1EA] rounded-xl self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-[#102A71] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#191919]'
            }`}
          >
            All ({effectiveMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('present')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'present'
                ? 'bg-white text-[#15803D] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#191919]'
            }`}
          >
            Present ({presentCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('absent')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'absent'
                ? 'bg-white text-[#D97706] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#191919]'
            }`}
          >
            Absent ({Math.max(0, effectiveMembers.length - presentCount)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inactive')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inactive'
                ? 'bg-white text-[#DC2626] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#191919]'
            }`}
          >
            Inactive ({inactiveCounts.d7})
          </button>
        </div>
      </div>

      {/* INACTIVE MEMBER DETECTOR FILTER BAR (7, 14, 30 Days) */}
      {activeTab === 'inactive' && (
        <div className="mt-2.5 bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-2.5 sm:p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-xs font-bold text-[#191919]">
                Inactive Member Detector
              </h2>
              <p className="text-[10.5px] text-[#71717A]">
                Active members with no recorded gym visit in the selected period (excludes expired memberships)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { days: 7, label: '7+ Days', count: inactiveCounts.d7 },
                  { days: 14, label: '14+ Days', count: inactiveCounts.d14 },
                  { days: 30, label: '30+ Days', count: inactiveCounts.d30 },
                ] as const
              ).map((f) => (
                <button
                  key={f.days}
                  type="button"
                  onClick={() => setInactivityDaysFilter(f.days)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    inactivityDaysFilter === f.days
                      ? 'bg-[#102A71] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] border border-[#EAE5DC] text-[#52525B] hover:bg-[#F2EFE8]'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>
          {inactiveCounts.noHistoryActiveCount > 0 && (
            <p className="text-[10px] text-[#71717A] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EAE5DC]">
              Note: {inactiveCounts.noHistoryActiveCount} active member
              {inactiveCounts.noHistoryActiveCount === 1 ? ' has' : 's have'} no recorded attendance history yet and are not marked inactive until their first check-in is logged.
            </p>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MEMBER ATTENDANCE LIST — CLEAR CHECK-IN & INACTIVE ACTIONS  */}
      {/* ============================================================== */}
      <div className="mt-3 space-y-2">
        {effectiveMembers.length === 0 ? (
          /* Empty Gym State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[14px] font-bold text-[#191919]">No members enrolled yet</h3>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              Add your first gym member to begin recording daily workout attendance.
            </p>
            {onOpenAddMember && (
              <button
                type="button"
                onClick={onOpenAddMember}
                className="mt-3 px-4 py-2 rounded-xl bg-[#102A71] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#0D225D]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Member</span>
              </button>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          /* Empty Filter State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-[14px] font-bold text-[#191919]">
              {searchQuery
                ? `No members found matching "${searchQuery}"`
                : activeTab === 'inactive'
                ? `No active members absent for ${inactivityDaysFilter}+ days`
                : activeTab === 'present'
                ? 'No check-ins recorded yet for this date'
                : 'No members in this view'}
            </h3>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? 'Check the name, phone number, or Member ID, or clear the search query.'
                : activeTab === 'inactive'
                ? `All active members with attendance history have visited within the last ${inactivityDaysFilter} days.`
                : activeTab === 'present'
                ? 'Arriving members can be checked in from the All Members list or search.'
                : 'All gym members have already checked in today.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-bold text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear search</span>
              </button>
            )}
          </div>
        ) : (
          filteredMembers.map((member) => {
            const checkInRec = checkInsOnSelectedDate.get(member.id);
            const isPresent = Boolean(checkInRec);
            const isExpired = member.status === 'expired' || member.daysUntilExpiry < 0;
            const isExpiringSoon =
              !isExpired &&
              (member.status === 'expiring' ||
                (member.daysUntilExpiry >= 0 && member.daysUntilExpiry <= 7));
            const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
            const inactivityInfo = memberInactivityMap.get(member.id);

            return (
              <div
                key={member.id}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all flex items-center justify-between gap-3"
              >
                {/* Member Info */}
                <div
                  onClick={() => setSelectedMemberId(member.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#EAE5DC] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#EBF1FE] text-[#102A71] font-bold text-xs flex items-center justify-center border border-[#DBEAFE] shrink-0">
                      {getInitials(member.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-[14px] sm:text-[15px] text-[#191919] leading-snug break-normal hover:text-[#102A71] transition-colors">
                        {member.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-[#71717A] bg-[#F4F1EA] px-1.5 py-0.5 rounded leading-none">
                        {member.memberCode || member.id}
                      </span>
                      {activeTab === 'inactive' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">
                          {member.status === 'expiring' ? 'Expiring' : 'Active Plan'}
                        </span>
                      )}
                    </div>

                    <p className="text-[11.5px] text-[#52525B] mt-0.5 leading-tight truncate">
                      {member.membershipPlan} · +91 {member.phone}
                    </p>

                    {/* Last Visit / Inactivity Details OR Expiry Notice */}
                    {activeTab === 'inactive' && inactivityInfo ? (
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#DC2626] mt-0.5 flex-wrap">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          Last visit: {inactivityInfo.lastVisitDisplay} (
                          {inactivityInfo.daysSinceLastVisit} days ago)
                        </span>
                      </div>
                    ) : isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#DC2626] mt-0.5">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Plan Expired ({member.expiryDate})</span>
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97706] mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Expiring in {member.daysUntilExpiry} days</span>
                      </span>
                    ) : inactivityInfo?.hasHistory ? (
                      <span className="text-[10px] text-[#71717A] mt-0.5 block">
                        Last visit: {inactivityInfo.lastVisitDisplay}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {activeTab === 'inactive' && (
                    <>
                      <a
                        href={`tel:${cleanPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors cursor-pointer"
                        title={`Call ${member.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWhatsAppTarget({
                            personId: member.id,
                            personType: 'Member',
                            name: member.name,
                            phone: member.phone,
                            planName: member.membershipPlan,
                            lastVisitDate: inactivityInfo?.lastVisitDisplay,
                            daysSinceLastVisit: inactivityInfo?.daysSinceLastVisit,
                            defaultCategory: 'inactive',
                          });
                        }}
                        className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#16A34A] hover:bg-[#D1FAE5] flex items-center justify-center transition-colors cursor-pointer"
                        title={`Send WhatsApp follow-up to ${member.name}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {isPresent && checkInRec ? (
                    <button
                      type="button"
                      onClick={() => setInspectingCheckIn({ member, record: checkInRec })}
                      className="h-9 sm:h-10 px-3 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="View Check-In Details"
                    >
                      <Check className="w-4 h-4 stroke-[2.8]" />
                      <span>In at {checkInRec.checkInTime || 'Today'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAttemptCheckIn(member, 'Manual')}
                      className="h-9 sm:h-10 px-3.5 rounded-xl bg-[#15803D] hover:bg-[#166534] active:scale-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      aria-label={`Check in ${member.name}`}
                    >
                      <Check className="w-4 h-4 stroke-[2.8]" />
                      <span>Check In</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* One-Tap WhatsApp Follow-Up Modal */}
      <WhatsAppFollowUpModal
        isOpen={Boolean(whatsAppTarget)}
        target={whatsAppTarget}
        gymName={gymName}
        upiId={upiId}
        onClose={() => setWhatsAppTarget(null)}
        onConfirmSent={(payload) => {
          if (onAddFollowUp) {
            onAddFollowUp(payload.personId, {
              note: `WhatsApp (${payload.category}): ${payload.messageText}`,
              type: 'WhatsApp',
            });
          }
          showFeedback('success', `Follow-up logged for ${whatsAppTarget?.name}.`);
        }}
      />

      {/* ============================================================== */}
      {/* MODAL: SCAN / ID SHORTCUT MODAL                                */}
      {/* ============================================================== */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#191919] leading-tight">
                    Scan / Enter Member ID
                  </h3>
                  <p className="text-[11px] text-[#71717A]">
                    Quick lookup via barcode, QR, or Member ID
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleManualScanSubmit} className="mt-3.5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Member ID or Phone Number
                </label>
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="e.g. MBR001 or 9876543210"
                  className="w-full px-3 py-2 text-sm font-semibold bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:border-[#102A71] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold cursor-pointer shadow-2xs"
                >
                  Verify & Check In
                </button>
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#52525B] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EXPIRED PLAN CHECK-IN WARNING & OVERRIDE                */}
      {/* ============================================================== */}
      {expiredCheckInMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-[#FECACA] relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#191919]">
              Membership Plan Expired
            </h3>
            <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
              <strong className="text-[#191919]">{expiredCheckInMember.name}</strong> ({expiredCheckInMember.memberCode})'s plan ended on{' '}
              <strong className="text-[#DC2626]">{expiredCheckInMember.expiryDate}</strong>.
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const m = expiredCheckInMember;
                  setExpiredCheckInMember(null);
                  onRenewMembership(m.id);
                }}
                className="w-full py-2.5 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Renew Membership Now
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = expiredCheckInMember;
                  setExpiredCheckInMember(null);
                  handleAttemptCheckIn(m, 'Manual', 'Override: Checked in with expired plan');
                }}
                className="w-full py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] hover:bg-[#F2EFE8] text-xs font-semibold text-[#52525B] cursor-pointer"
              >
                Allow Check-In Anyway (1-Day Grace)
              </button>
              <button
                type="button"
                onClick={() => setExpiredCheckInMember(null)}
                className="w-full text-xs text-[#71717A] hover:underline pt-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VIEW CHECK-IN DETAILS / UNMARK ATTENDANCE               */}
      {/* ============================================================== */}
      {inspectingCheckIn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#191919] leading-tight">
                    Check-In Details
                  </h3>
                  <p className="text-[11px] text-[#71717A]">
                    {inspectingCheckIn.member.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCheckIn(null)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5 text-xs text-[#52525B]">
              <div className="flex justify-between">
                <span>Member:</span>
                <span className="font-bold text-[#191919]">
                  {inspectingCheckIn.member.name} ({inspectingCheckIn.member.memberCode || inspectingCheckIn.member.id})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Check-In Time:</span>
                <span className="font-bold text-[#15803D]">
                  {inspectingCheckIn.record.checkInTime || inspectingCheckIn.record.timestamp}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entry Method:</span>
                <span className="font-semibold text-[#191919]">
                  {inspectingCheckIn.record.method || 'Manual'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-semibold text-[#102A71]">
                  {inspectingCheckIn.member.membershipPlan}
                </span>
              </div>
              {inspectingCheckIn.record.notes && (
                <div className="pt-1.5 border-t border-[#EAE5DC]">
                  <span className="text-[#71717A]">Notes: </span>
                  <span>{inspectingCheckIn.record.notes}</span>
                </div>
              )}
            </div>

            <div className="mt-3.5 flex gap-2">
              {onUnmarkAttendance && (
                <button
                  type="button"
                  onClick={() => {
                    const recId = inspectingCheckIn.record.id;
                    const memName = inspectingCheckIn.member.name;
                    setInspectingCheckIn(null);
                    onUnmarkAttendance(recId);
                    showFeedback('warning', `Reversed check-in for ${memName}.`);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-bold cursor-pointer transition-colors"
                >
                  Undo Check-In
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectingCheckIn(null)}
                className="flex-1 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#52525B] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
