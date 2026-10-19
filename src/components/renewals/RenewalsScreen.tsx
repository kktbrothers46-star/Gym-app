/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  CalendarClock,
  AlertTriangle,
  RotateCw,
  ChevronRight,
  Phone,
  MessageCircle,
  ArrowUpDown,
  CheckCircle,
  X,
  RefreshCw,
  Check,
  Users,
} from 'lucide-react';
import { Member, RenewalRecord } from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';

interface RenewalsScreenProps {
  members: Member[];
  renewals: RenewalRecord[];
  isEmptyState?: boolean;
  initialFilterTab?: 'all' | 'expiring' | 'expired' | 'renewed';
  onOpenRenewModal: (memberId?: string) => void;
  onRecordPayment: (memberId: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
  onSwitchToDirectory?: () => void;
  onOpenLeads?: () => void;
  onOpenFollowUps?: () => void;
}

interface RenewalAdvancedFilters {
  planType: 'all' | 'monthly' | 'quarterly' | 'half_yearly' | 'annual';
  urgencyWindow: 'all' | 'critical_7d' | 'within_15d' | 'within_30d' | 'overdue';
  paymentDue: 'all' | 'has_due' | 'cleared';
}

// Helper to determine membership expiry status strictly from actual expiry date / daysUntilExpiry
// (distinct from attendance inactivity or payment pending status)
export function getMembershipExpiryCategory(member: Member): 'expired' | 'expiring' | 'active' {
  if (member.daysUntilExpiry < 0 || member.status === 'expired') {
    return 'expired';
  }
  if (member.daysUntilExpiry <= 30 || member.status === 'expiring') {
    return 'expiring';
  }
  return 'active';
}

// Format date string consistently as "DD MMM YYYY" (e.g. "15 Oct 2026")
function formatExpiryDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  // If already in "15 Oct 2026" style, normalize leading zero
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

// Format concise plan fee for card (e.g. "₹2,000" from "₹2,000 / month")
function formatConciseFee(planFee?: string, planName?: string): string {
  if (planFee) {
    const match = planFee.match(/₹[\d,]+/);
    if (match) return match[0];
    return planFee;
  }
  const lower = (planName || '').toLowerCase();
  if (lower.includes('annual') || lower.includes('12')) return '₹14,000';
  if (lower.includes('6') || lower.includes('half')) return '₹9,000';
  if (lower.includes('3') || lower.includes('quarter')) return '₹5,500';
  return '₹2,000';
}

// Format short plan badge label & colors matching the reference screenshot
function getPlanBadgeStyle(planName: string): { label: string; className: string } {
  const lower = (planName || '').toLowerCase();
  if (lower.includes('3') || lower.includes('quarter')) {
    return {
      label: planName.length > 15 ? 'Quarterly Plan' : planName,
      className: 'bg-[#E8F8EE] text-[#15803D]',
    };
  }
  if (lower.includes('6') || lower.includes('half')) {
    return {
      label: planName.length > 15 ? 'Half Yearly' : planName,
      className: 'bg-[#F3E8FF] text-[#6D28D9]',
    };
  }
  if (lower.includes('annual') || lower.includes('12') || lower.includes('year')) {
    return {
      label: planName.length > 15 ? 'Annual Plan' : planName,
      className: 'bg-[#F3E8FF] text-[#7C3AED]',
    };
  }
  return {
    label: planName.length > 15 ? 'Monthly Plan' : planName,
    className: 'bg-[#EBF3FF] text-[#1D4ED8]',
  };
}

export const RenewalsScreen: React.FC<RenewalsScreenProps> = ({
  members,
  renewals,
  isEmptyState = false,
  initialFilterTab = 'all',
  onOpenRenewModal,
  onRecordPayment,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
  onSwitchToDirectory,
  onOpenLeads,
  onOpenFollowUps,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'expiring' | 'expired' | 'renewed'>(
    initialFilterTab
  );
  const [sortBy, setSortBy] = useState<'expiry' | 'overdue' | 'name' | 'recent'>('expiry');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<RenewalAdvancedFilters>({
    planType: 'all',
    urgencyWindow: 'all',
    paymentDue: 'all',
  });

  // Selected member to view Member Detail Screen (Page 3)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const effectiveMembers = useMemo(() => (isEmptyState ? [] : members), [members, isEmptyState]);
  const effectiveRenewals = useMemo(
    () => (isEmptyState ? [] : renewals.filter((r) => r.status === 'completed')),
    [renewals, isEmptyState]
  );

  const renewedMemberIdsThisMonth = useMemo(() => {
    const ids = new Set<string>();
    const now = new Date();
    const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthLabel = `${now.toLocaleDateString('en-IN', { month: 'short' })} ${now.getFullYear()}`;
    effectiveRenewals.forEach((r) => {
      if (r.month === currentMonthLabel || (r.renewedAt && r.renewedAt.startsWith(currentPrefix))) {
        ids.add(r.memberId);
      }
    });
    effectiveMembers.forEach((m) => {
      if (m.lastRenewedDate && m.lastRenewedDate.startsWith(currentPrefix)) {
        ids.add(m.id);
      }
    });
    return ids;
  }, [effectiveRenewals, effectiveMembers]);

  // Real Summary Counts (never hardcoded)
  const expiringSoonCount = useMemo(() => {
    return effectiveMembers.filter((m) => getMembershipExpiryCategory(m) === 'expiring').length;
  }, [effectiveMembers]);

  const expiredCount = useMemo(() => {
    return effectiveMembers.filter((m) => getMembershipExpiryCategory(m) === 'expired').length;
  }, [effectiveMembers]);

  const renewedThisMonthCount = useMemo(() => {
    return Math.max(effectiveRenewals.length, renewedMemberIdsThisMonth.size);
  }, [effectiveRenewals, renewedMemberIdsThisMonth]);

  // Active advanced filter count
  const activeAdvancedFilterCount = useMemo(() => {
    let c = 0;
    if (advancedFilters.planType !== 'all') c++;
    if (advancedFilters.urgencyWindow !== 'all') c++;
    if (advancedFilters.paymentDue !== 'all') c++;
    return c;
  }, [advancedFilters]);

  // Filtered and Sorted Members
  const filteredAndSortedMembers = useMemo(() => {
    return effectiveMembers
      .filter((m) => {
        const expiryCat = getMembershipExpiryCategory(m);
        const isRenewed = renewedMemberIdsThisMonth.has(m.id);

        // 1. Search Query (Name, Phone, or Member ID)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = m.name.toLowerCase().includes(q);
          const matchPhone = m.phone.toLowerCase().includes(q);
          const matchId = (m.memberCode || m.id).toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchId) return false;
        }

        // 2. Selected Filter Tab
        if (selectedTab === 'expiring' && expiryCat !== 'expiring') return false;
        if (selectedTab === 'expired' && expiryCat !== 'expired') return false;
        if (selectedTab === 'renewed' && !isRenewed) return false;

        // 3. Advanced Filters
        if (advancedFilters.planType !== 'all') {
          const pLower = (m.membershipPlan || '').toLowerCase();
          if (advancedFilters.planType === 'monthly' && !pLower.includes('month')) return false;
          if (
            advancedFilters.planType === 'quarterly' &&
            !pLower.includes('3') &&
            !pLower.includes('quarter')
          ) {
            return false;
          }
          if (
            advancedFilters.planType === 'half_yearly' &&
            !pLower.includes('6') &&
            !pLower.includes('half')
          ) {
            return false;
          }
          if (
            advancedFilters.planType === 'annual' &&
            !pLower.includes('annual') &&
            !pLower.includes('12')
          ) {
            return false;
          }
        }

        if (advancedFilters.urgencyWindow !== 'all') {
          if (
            advancedFilters.urgencyWindow === 'critical_7d' &&
            (m.daysUntilExpiry < 0 || m.daysUntilExpiry > 7)
          ) {
            return false;
          }
          if (
            advancedFilters.urgencyWindow === 'within_15d' &&
            (m.daysUntilExpiry < 0 || m.daysUntilExpiry > 15)
          ) {
            return false;
          }
          if (
            advancedFilters.urgencyWindow === 'within_30d' &&
            (m.daysUntilExpiry < 0 || m.daysUntilExpiry > 30)
          ) {
            return false;
          }
          if (advancedFilters.urgencyWindow === 'overdue' && m.daysUntilExpiry >= 0) {
            return false;
          }
        }

        if (advancedFilters.paymentDue === 'has_due' && m.pendingAmount <= 0) return false;
        if (advancedFilters.paymentDue === 'cleared' && m.pendingAmount > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry') {
          // Earliest expiry (expiring soonest and expired at top, ordered by daysUntilExpiry ascending)
          // Put expiring soon (0..30) and expired (<0) prioritized cleanly
          const catA = getMembershipExpiryCategory(a);
          const catB = getMembershipExpiryCategory(b);
          const rank = (cat: 'expired' | 'expiring' | 'active', days: number) => {
            if (cat === 'expiring' && days <= 10) return 1;
            if (cat === 'expired') return 2;
            if (cat === 'expiring') return 3;
            return 4;
          };
          const rA = rank(catA, a.daysUntilExpiry);
          const rB = rank(catB, b.daysUntilExpiry);
          if (rA !== rB) return rA - rB;
          return a.daysUntilExpiry - b.daysUntilExpiry;
        }
        if (sortBy === 'overdue') {
          return a.daysUntilExpiry - b.daysUntilExpiry;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'recent') {
          return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
        }
        return 0;
      });
  }, [
    effectiveMembers,
    searchQuery,
    selectedTab,
    advancedFilters,
    sortBy,
    renewedMemberIdsThisMonth,
  ]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedTab('all');
    setAdvancedFilters({
      planType: 'all',
      urgencyWindow: 'all',
      paymentDue: 'all',
    });
  };

  // If a member is selected, show the existing Member Detail View (Page 3)
  const activeMember = effectiveMembers.find((m) => m.id === selectedMemberId) || null;
  if (activeMember) {
    return (
      <MemberDetailView
        member={activeMember}
        onBack={() => setSelectedMemberId(null)}
        onRecordPayment={onRecordPayment}
        onRenewMembership={(id) => onOpenRenewModal(id)}
        onMarkAttendance={onMarkAttendance}
        onUpdateMember={onUpdateMember}
        onArchiveMember={onArchiveMember}
        onAddFollowUp={onAddFollowUp}
      />
    );
  }

  return (
    <div className="w-full flex-1 pb-3">
      {/* ============================================================== */}
      {/* A. HEADER: Title, Subtitle, & "+ Renew Member" Button          */}
      {/* ============================================================== */}
      <header className="w-full flex flex-wrap items-center justify-between gap-2 pt-2.5 pb-2 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
              Renewals
            </h1>
            {onSwitchToDirectory && (
              <button
                type="button"
                onClick={onSwitchToDirectory}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Switch to full Members Directory"
              >
                Members
              </button>
            )}
            {onOpenLeads && (
              <button
                type="button"
                onClick={onOpenLeads}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Open Leads screen"
              >
                Leads
              </button>
            )}
            {onOpenFollowUps && (
              <button
                type="button"
                onClick={onOpenFollowUps}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Open Follow-Ups screen"
              >
                Follow-Ups
              </button>
            )}
          </div>
          <p className="text-[#71717A] text-[12px] font-normal mt-0.5 leading-none">
            Track expiring memberships and follow up on time.
          </p>
        </div>

        {/* Primary "+ Renew Member" Action Button */}
        <button
          type="button"
          onClick={() => onOpenRenewModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-95 text-white text-[12px] font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          aria-label="Renew Member"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Renew Member</span>
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
            placeholder="Search name, phone or member ID"
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
          aria-label="Open renewal filters"
          title="Filter renewals"
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
      {/* C. THREE SUMMARY CARDS: Expiring Soon, Expired, Renewed        */}
      {/* ============================================================== */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {/* 1. Expiring Soon (Pale Amber) */}
        <button
          type="button"
          onClick={() => setSelectedTab(selectedTab === 'expiring' ? 'all' : 'expiring')}
          className={`bg-[#FDF6E4] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between text-left border transition-all cursor-pointer shadow-2xs ${
            selectedTab === 'expiring'
              ? 'border-[#D97706] ring-1 ring-[#D97706]/30'
              : 'border-[#F7E3B5] hover:border-[#F2D08B]'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FCE8B2] text-[#D97706] flex items-center justify-center shrink-0">
            <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10.5px] sm:text-[11px] font-medium block leading-tight truncate">
              Expiring Soon
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none">
                {expiringSoonCount}
              </span>
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#F2DEC0] text-[#5C4822] flex items-center justify-center shrink-0">
                <ChevronRight className="w-3 h-3 stroke-[2.3]" />
              </span>
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10.5px] text-[#6B7280] mt-1.5 block leading-none truncate">
            Within 30 days
          </span>
        </button>

        {/* 2. Expired (Pale Red) */}
        <button
          type="button"
          onClick={() => setSelectedTab(selectedTab === 'expired' ? 'all' : 'expired')}
          className={`bg-[#FDF1F1] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between text-left border transition-all cursor-pointer shadow-2xs ${
            selectedTab === 'expired'
              ? 'border-[#DC2626] ring-1 ring-[#DC2626]/30'
              : 'border-[#FADBD8] hover:border-[#F5B7B1]'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FDE0E0] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10.5px] sm:text-[11px] font-medium block leading-tight truncate">
              Expired
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none">
                {expiredCount}
              </span>
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#F5D5D5] text-[#642626] flex items-center justify-center shrink-0">
                <ChevronRight className="w-3 h-3 stroke-[2.3]" />
              </span>
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10.5px] text-[#6B7280] mt-1.5 block leading-none truncate">
            Needs renewal
          </span>
        </button>

        {/* 3. Renewed This Month (Pale Green) */}
        <button
          type="button"
          onClick={() => setSelectedTab(selectedTab === 'renewed' ? 'all' : 'renewed')}
          className={`bg-[#ECF9F2] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between text-left border transition-all cursor-pointer shadow-2xs ${
            selectedTab === 'renewed'
              ? 'border-[#16A34A] ring-1 ring-[#16A34A]/30'
              : 'border-[#CDEEDB] hover:border-[#A8E0C0]'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#D3F3E0] text-[#16A34A] flex items-center justify-center shrink-0">
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10.5px] sm:text-[11px] font-medium block leading-tight truncate">
              Renewed This Month
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none">
                {renewedThisMonthCount}
              </span>
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#C8EBD6] text-[#1E5636] flex items-center justify-center shrink-0">
                <ChevronRight className="w-3 h-3 stroke-[2.3]" />
              </span>
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10.5px] text-[#15803D] font-medium mt-1.5 block leading-none truncate">
            {renewedThisMonthCount > 0 ? `+20% from last month` : 'No renewals yet'}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* D. FILTER TABS & SORT PILL ROW                                 */}
      {/* ============================================================== */}
      <div className="mt-3 flex items-center justify-between gap-1.5 relative">
        {/* Scrollable Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x">
          {[
            { id: 'all', label: 'All', dot: null },
            { id: 'expiring', label: 'Expiring Soon', dot: '#F59E0B' },
            { id: 'expired', label: 'Expired', dot: '#EF4444' },
            { id: 'renewed', label: 'Renewed', dot: '#16A34A' },
          ].map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer snap-start ${
                  isSelected
                    ? 'bg-[#102A71] text-white shadow-2xs'
                    : 'bg-white border border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
                }`}
              >
                {tab.dot && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tab.dot }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Pill Control */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-full bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] text-[10.5px] sm:text-[11px] font-medium text-[#4B5563] cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <ArrowUpDown className="w-3 h-3 stroke-[2] text-[#191919]" />
            <span>
              Sort by:{' '}
              <span className="font-semibold text-[#191919]">
                {sortBy === 'expiry'
                  ? 'Expiry Date'
                  : sortBy === 'overdue'
                  ? 'Most Overdue'
                  : sortBy === 'name'
                  ? 'Member Name'
                  : 'Recently Added'}
              </span>
            </span>
            <span className="text-[8px] ml-0.5 text-[#71717A]">▼</span>
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {[
                { id: 'expiry', label: 'Earliest Expiry (Default)' },
                { id: 'overdue', label: 'Most Overdue First' },
                { id: 'name', label: 'Member Name (A–Z)' },
                { id: 'recent', label: 'Recently Renewed / Added' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setSortBy(s.id as any);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-[#FAF8F5] transition-colors flex items-center justify-between cursor-pointer ${
                    sortBy === s.id ? 'text-[#102A71] font-bold bg-[#F4F1EA]' : 'text-[#191919]'
                  }`}
                >
                  <span>{s.label}</span>
                  {sortBy === s.id && <CheckCircle className="w-3 h-3 text-[#102A71]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* E. MEMBERS HEADING & COUNT                                     */}
      {/* ============================================================== */}
      <div className="mt-3 mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight">
          Members ({filteredAndSortedMembers.length})
        </h2>

        {(searchQuery || selectedTab !== 'all' || activeAdvancedFilterCount > 0) && (
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="text-[11px] font-bold text-[#102A71] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* F. COMPACT MEMBER RENEWAL CARDS LIST                           */}
      {/* ============================================================== */}
      <div className="space-y-2 sm:space-y-2.5">
        {effectiveMembers.length === 0 ? (
          /* Empty Gym State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No members yet</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              Add your first member to start tracking membership expiry dates and renewals.
            </p>
          </div>
        ) : filteredAndSortedMembers.length === 0 ? (
          /* Specific Tab / Search Empty States */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">
              {searchQuery
                ? 'No matching members found'
                : selectedTab === 'expiring'
                ? 'No expiring memberships'
                : selectedTab === 'expired'
                ? 'No expired memberships'
                : selectedTab === 'renewed'
                ? 'No renewal history this month'
                : 'No matching memberships'}
            </h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? `No members match "${searchQuery}". Check the name, phone, or member ID.`
                : selectedTab === 'expiring'
                ? 'No active memberships are scheduled to expire within the next 30 days.'
                : selectedTab === 'expired'
                ? 'Great job! All expired memberships have been followed up or renewed.'
                : selectedTab === 'renewed'
                ? 'No membership renewals have been completed in this calendar month yet.'
                : 'Try clearing your active filter rules to view all members.'}
            </p>
            {(searchQuery || selectedTab !== 'all' || activeAdvancedFilterCount > 0) && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-bold text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedMembers.map((m) => {
            const cleanPhone = (m.phone || '').replace(/[^0-9]/g, '');
            const expiryCat = getMembershipExpiryCategory(m);
            const planBadge = getPlanBadgeStyle(m.membershipPlan);
            const conciseFee = formatConciseFee(m.planFee, m.membershipPlan);
            const formattedExpiry = formatExpiryDisplay(m.expiryDate);

            // Urgency color for date & days text matching reference screenshot
            const isCritical = m.daysUntilExpiry <= 3; // overdue or <= 3 days left is red
            const isWarning = m.daysUntilExpiry > 3 && m.daysUntilExpiry <= 30;

            const daysLabel =
              m.daysUntilExpiry < 0
                ? `${Math.abs(m.daysUntilExpiry)} days overdue`
                : m.daysUntilExpiry === 0
                ? 'Expires today'
                : `${m.daysUntilExpiry} days left`;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-2.5 sm:p-3 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`View renewal and membership details for ${m.name}`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* ZONE 1: Avatar + Member Name & ID */}
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-[1.25]">
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 border border-[#EAE5DC] shadow-2xs"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E0E7FF] text-[#102A71] font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-[#C7D2FE]">
                        {m.name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-bold text-[13px] sm:text-[13.5px] text-[#191919] truncate leading-tight group-hover:text-[#102A71] transition-colors">
                        {m.name}
                      </h3>
                      <p className="text-[10.5px] sm:text-[11px] text-[#71717A] mt-0.5 truncate leading-none">
                        ID: {m.memberCode || m.id}
                      </p>
                    </div>
                  </div>

                  {/* ZONE 2: Colored Plan Pill + Plan Fee */}
                  <div className="flex flex-col items-start shrink-0 min-w-[78px] sm:min-w-[92px]">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold leading-tight whitespace-nowrap ${planBadge.className}`}
                    >
                      {planBadge.label}
                    </span>
                    <span className="text-[11.5px] sm:text-[12px] font-bold text-[#191919] mt-1 leading-none pl-0.5">
                      {conciseFee}
                    </span>
                  </div>

                  {/* ZONE 3: Divider + Expiry Date + Days Remaining / Overdue */}
                  <div className="border-l border-[#F0ECE3] pl-2 sm:pl-3 flex flex-col justify-center shrink-0 min-w-[76px] sm:min-w-[92px]">
                    <span
                      className={`text-[11px] sm:text-[12px] font-medium leading-tight whitespace-nowrap ${
                        isCritical ? 'text-[#DC2626]' : 'text-[#1E293B]'
                      }`}
                    >
                      {formattedExpiry}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 leading-none whitespace-nowrap ${
                        isCritical
                          ? 'text-[#DC2626]'
                          : isWarning
                          ? 'text-[#D97706]'
                          : 'text-[#6B7280]'
                      }`}
                    >
                      {daysLabel}
                    </span>
                  </div>

                  {/* ZONE 4: Status Badge + Call & WhatsApp + Chevron */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      {/* Explicit Membership Status Pill */}
                      {expiryCat === 'expiring' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-[#FFF4E5] text-[#D97706] leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          <span>Expiring</span>
                        </span>
                      ) : expiryCat === 'expired' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-[#FEECEB] text-[#DC2626] leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                          <span>Expired</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-[#E8FAF0] text-[#16A34A] leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          <span>Active</span>
                        </span>
                      )}

                      {/* Direct Call & WhatsApp Action Buttons */}
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${cleanPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors"
                          title={`Call ${m.name}`}
                          aria-label={`Call ${m.name}`}
                        >
                          <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                        </a>

                        <a
                          href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(
                            m.name
                          )},%20your%20${encodeURIComponent(
                            m.membershipPlan
                          )}%20at%20MuscleFit%20Gym%20${
                            expiryCat === 'expired'
                              ? `expired%20on%20${encodeURIComponent(formattedExpiry)}`
                              : `is%20expiring%20on%20${encodeURIComponent(formattedExpiry)}`
                          }.%20Let%20us%20know%20to%20renew!`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#ECFDF5] text-[#16A34A] hover:bg-[#D1FAE5] flex items-center justify-center transition-colors"
                          title={`WhatsApp ${m.name}`}
                          aria-label={`Send WhatsApp renewal reminder to ${m.name}`}
                        >
                          <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                        </a>
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#191919] transition-colors shrink-0" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* ADVANCED FILTER MODAL FOR RENEWALS                             */}
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
                    Filter Renewals
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    Filter by plan package, expiry window, or dues
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
              {/* Plan Type */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Membership Plan
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Plans' },
                    { id: 'monthly', label: 'Monthly Plan' },
                    { id: 'quarterly', label: 'Quarterly (3M)' },
                    { id: 'half_yearly', label: 'Half Yearly (6M)' },
                    { id: 'annual', label: 'Annual Plan' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          planType: opt.id as any,
                        }))
                      }
                      className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        advancedFilters.planType === opt.id
                          ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {advancedFilters.planType === opt.id && (
                        <Check className="w-3.5 h-3.5 text-[#102A71]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency Window */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Expiry Window
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'Any Expiry Window' },
                    { id: 'critical_7d', label: 'Critical (≤ 7 Days)' },
                    { id: 'within_15d', label: 'Within 15 Days' },
                    { id: 'within_30d', label: 'Within 30 Days' },
                    { id: 'overdue', label: 'Already Overdue' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          urgencyWindow: opt.id as any,
                        }))
                      }
                      className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        advancedFilters.urgencyWindow === opt.id
                          ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {advancedFilters.urgencyWindow === opt.id && (
                        <Check className="w-3.5 h-3.5 text-[#102A71]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pending Balance */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Payment Balance
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'has_due', label: 'Has Dues' },
                    { id: 'cleared', label: 'No Dues' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          paymentDue: opt.id as any,
                        }))
                      }
                      className={`py-1.5 px-2 rounded-xl border text-[11.5px] font-semibold transition-all cursor-pointer ${
                        advancedFilters.paymentDue === opt.id
                          ? 'bg-[#102A71] text-white border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#F2EFE8] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdvancedFilters({
                    planType: 'all',
                    urgencyWindow: 'all',
                    paymentDue: 'all',
                  });
                  setIsFilterModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2 px-4 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold shadow-xs cursor-pointer"
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
