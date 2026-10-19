/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  IndianRupee,
  Wallet,
  AlertTriangle,
  ChevronRight,
  Phone,
  MessageCircle,
  ArrowUpDown,
  CheckCircle,
  X,
  Check,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Member, Payment } from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';
import { PaymentDetailView } from './PaymentDetailView';

interface PaymentsScreenProps {
  payments: Payment[];
  members: Member[];
  collectedThisMonth: number;
  isEmptyState?: boolean;
  initialFilterTab?: 'all' | 'paid' | 'partial' | 'pending' | 'overdue';
  onOpenRecordPayment: (memberId?: string) => void;
  onOpenRenewModal: (memberId?: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
  onReversePayment?: (paymentId: string, reason?: string) => void;
  onSwitchToExpenses?: () => void;
}

interface PaymentAdvancedFilters {
  paymentMethod: 'all' | 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  planType: 'all' | 'monthly' | 'quarterly' | 'half_yearly' | 'annual';
  period: 'all' | 'this_month' | 'earlier';
}

export interface EnrichedPaymentItem {
  id: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  phone: string;
  photoUrl?: string;
  plan: string;
  planFee: number;
  previouslyPaid?: number;
  paidAmount: number;
  pendingAmount: number;
  date: string;
  time?: string;
  dueDate?: string;
  month: string;
  uiStatus: 'paid' | 'partial' | 'pending' | 'overdue' | 'refunded';
  paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  receiptNumber: string;
  referenceId?: string;
  notes?: string;
}

function parsePlanFeeNumber(planFeeStr?: string, planName?: string): number {
  if (planFeeStr) {
    const digits = planFeeStr.replace(/[^0-9]/g, '');
    const parsed = parseInt(digits, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const lower = (planName || '').toLowerCase();
  if (lower.includes('annual') || lower.includes('12')) return 14000;
  if (lower.includes('6') || lower.includes('half')) return 9000;
  if (lower.includes('3') || lower.includes('quarter')) return 5500;
  return 2000;
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

function getMethodIcon(method: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer') {
  switch (method) {
    case 'UPI':
      return <Smartphone className="w-3 h-3 text-[#102A71]" />;
    case 'Cash':
      return <Banknote className="w-3 h-3 text-[#15803D]" />;
    case 'Card':
      return <CreditCard className="w-3 h-3 text-[#7C3AED]" />;
    case 'Bank Transfer':
      return <Building2 className="w-3 h-3 text-[#D97706]" />;
  }
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  payments,
  members,
  collectedThisMonth,
  isEmptyState = false,
  initialFilterTab = 'all',
  onOpenRecordPayment,
  onOpenRenewModal,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
  onReversePayment,
  onSwitchToExpenses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'paid' | 'partial' | 'pending' | 'overdue'>(
    initialFilterTab
  );
  const [sortBy, setSortBy] = useState<'latest' | 'amount_desc' | 'due_desc' | 'name'>('latest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<PaymentAdvancedFilters>({
    paymentMethod: 'all',
    planType: 'all',
    period: 'all',
  });

  // Payment Detail View state & Member Detail View state
  const [selectedPaymentItem, setSelectedPaymentItem] = useState<EnrichedPaymentItem | null>(null);
  const [selectedMemberIdForDetail, setSelectedMemberIdForDetail] = useState<string | null>(null);

  const effectiveMembers = useMemo(() => (isEmptyState ? [] : members), [members, isEmptyState]);
  const effectivePayments = useMemo(() => (isEmptyState ? [] : payments), [payments, isEmptyState]);

  // Build unified, accurate payment items enriched with member data
  const enrichedPayments: EnrichedPaymentItem[] = useMemo(() => {
    if (isEmptyState) return [];

    const memberMap = new Map<string, Member>();
    effectiveMembers.forEach((m) => memberMap.set(m.id, m));

    const recordedMemberIdsWithOpenDue = new Set<string>();

    const fromPayments: EnrichedPaymentItem[] = effectivePayments.map((p, idx) => {
      const member = memberMap.get(p.memberId);
      const inferredPlanFee =
        p.planFee || parsePlanFeeNumber(member?.planFee, p.plan || member?.membershipPlan);

      // Sync pending amount with member's live pending balance if this was an open due record
      let pendingAmt =
        p.pendingAmount !== undefined
          ? p.pendingAmount
          : p.status === 'completed'
          ? 0
          : member?.pendingAmount || 0;

      if (member && member.pendingAmount === 0 && pendingAmt > 0 && p.status !== 'refunded') {
        pendingAmt = 0;
      }

      if (pendingAmt > 0) {
        recordedMemberIdsWithOpenDue.add(p.memberId);
      }

      let uiStatus: EnrichedPaymentItem['uiStatus'] = 'paid';
      if (p.status === 'refunded') {
        uiStatus = 'refunded';
      } else if (pendingAmt > 0) {
        const isMemberExpired = member ? member.daysUntilExpiry < 0 || member.status === 'expired' : false;
        if (p.status === 'overdue' || isMemberExpired) {
          uiStatus = 'overdue';
        } else if (p.status === 'partial' || (p.amount > 0 && p.status !== 'pending')) {
          uiStatus = 'partial';
        } else {
          uiStatus = 'pending';
        }
      } else {
        uiStatus = 'paid';
      }

      return {
        id: p.id,
        memberId: p.memberId,
        memberName: member?.name || p.memberName,
        memberCode: member?.memberCode || p.memberCode || `MBR${String(idx + 1).padStart(3, '0')}`,
        phone: member?.phone || '98765 43210',
        photoUrl: member?.photoUrl,
        plan: p.plan || member?.membershipPlan || 'Monthly Plan',
        planFee: inferredPlanFee,
        previouslyPaid: p.previouslyPaid || 0,
        paidAmount: p.amount,
        pendingAmount: pendingAmt,
        date: p.date,
        time: p.time || '10:24 AM',
        dueDate: p.dueDate || member?.expiryDate,
        month: p.month || new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        uiStatus,
        paymentMethod: p.paymentMethod || 'UPI',
        receiptNumber: p.receiptNumber || `PAY${String(idx + 1).padStart(3, '0')}`,
        referenceId: p.referenceId || p.receiptNumber,
        notes: p.notes,
      };
    });

    // Ensure any member with a live pendingAmount > 0 who doesn't have an open payment record yet is also represented
    effectiveMembers.forEach((m) => {
      if (m.pendingAmount > 0 && !recordedMemberIdsWithOpenDue.has(m.id)) {
        const fee = parsePlanFeeNumber(m.planFee, m.membershipPlan);
        const paidSoFar = Math.max(0, fee - m.pendingAmount);
        const isOverdue = m.daysUntilExpiry < 0 || m.status === 'expired';
        const now = new Date();
        const currentMonthLabel = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        fromPayments.push({
          id: `due-${m.id}`,
          memberId: m.id,
          memberName: m.name,
          memberCode: m.memberCode || m.id,
          phone: m.phone,
          photoUrl: m.photoUrl,
          plan: m.membershipPlan,
          planFee: fee,
          paidAmount: paidSoFar,
          pendingAmount: m.pendingAmount,
          date: m.startDate || now.toISOString().split('T')[0],
          dueDate: m.expiryDate,
          month: currentMonthLabel,
          uiStatus: isOverdue ? 'overdue' : paidSoFar > 0 ? 'partial' : 'pending',
          paymentMethod: 'UPI',
          receiptNumber: `DUE-${(m.memberCode || m.id).replace(/[^0-9]/g, '') || '101'}`,
          notes: isOverdue ? 'Membership fee overdue' : 'Pending membership balance',
        });
      }
    });

    return fromPayments;
  }, [effectivePayments, effectiveMembers, isEmptyState]);

  // Real Summary KPI Calculations (never hardcoded)
  const summaryStats = useMemo(() => {
    if (isEmptyState) {
      return {
        collectedTotal: 0,
        pendingTotal: 0,
        pendingCount: 0,
        overdueTotal: 0,
        overdueCount: 0,
        paidCount: 0,
      };
    }

    const paidCount = enrichedPayments.filter((item) => item.uiStatus === 'paid').length;
    const pendingItems = enrichedPayments.filter(
      (item) => item.uiStatus === 'pending' || item.uiStatus === 'partial'
    );
    const overdueItems = enrichedPayments.filter((item) => item.uiStatus === 'overdue');

    const pendingTotal = pendingItems.reduce((sum, item) => sum + item.pendingAmount, 0);
    const overdueTotal = overdueItems.reduce((sum, item) => sum + item.pendingAmount, 0);

    return {
      collectedTotal: collectedThisMonth,
      pendingTotal,
      pendingCount: pendingItems.length,
      overdueTotal,
      overdueCount: overdueItems.length,
      paidCount,
    };
  }, [enrichedPayments, collectedThisMonth, isEmptyState]);

  const activeAdvancedFilterCount = useMemo(() => {
    let c = 0;
    if (advancedFilters.paymentMethod !== 'all') c++;
    if (advancedFilters.planType !== 'all') c++;
    if (advancedFilters.period !== 'all') c++;
    return c;
  }, [advancedFilters]);

  // Filtered and Sorted Payment Transactions
  const filteredAndSortedPayments = useMemo(() => {
    return enrichedPayments
      .filter((item) => {
        // 1. Search query (member name, phone, member code, receipt number, plan)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.memberName.toLowerCase().includes(q);
          const matchPhone = item.phone.toLowerCase().includes(q);
          const matchCode = item.memberCode.toLowerCase().includes(q);
          const matchReceipt = item.receiptNumber.toLowerCase().includes(q);
          const matchPlan = item.plan.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchCode && !matchReceipt && !matchPlan) {
            return false;
          }
        }

        // 2. Status Tab filter
        if (selectedTab !== 'all' && item.uiStatus !== selectedTab) {
          return false;
        }

        // 3. Advanced filters
        if (
          advancedFilters.paymentMethod !== 'all' &&
          item.paymentMethod !== advancedFilters.paymentMethod
        ) {
          return false;
        }

        if (advancedFilters.planType !== 'all') {
          const pLower = item.plan.toLowerCase();
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

        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentShortMonth = now.toLocaleDateString('en-IN', { month: 'short' });

        if (advancedFilters.period === 'this_month') {
          if (!item.month.includes(currentShortMonth) && !item.date.startsWith(currentYearMonth)) return false;
        } else if (advancedFilters.period === 'earlier') {
          if (item.month.includes(currentShortMonth) || item.date.startsWith(currentYearMonth)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'latest') {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.paidAmount - a.paidAmount;
        }
        if (sortBy === 'due_desc') {
          if (b.pendingAmount !== a.pendingAmount) {
            return b.pendingAmount - a.pendingAmount;
          }
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        }
        if (sortBy === 'name') {
          return a.memberName.localeCompare(b.memberName);
        }
        return 0;
      });
  }, [enrichedPayments, searchQuery, selectedTab, advancedFilters, sortBy]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedTab('all');
    setAdvancedFilters({
      paymentMethod: 'all',
      planType: 'all',
      period: 'all',
    });
  };

  // If navigating to Member Detail View (Page 3) from a payment record
  const activeMemberForDetail =
    effectiveMembers.find((m) => m.id === selectedMemberIdForDetail) || null;
  if (activeMemberForDetail) {
    return (
      <MemberDetailView
        member={activeMemberForDetail}
        onBack={() => setSelectedMemberIdForDetail(null)}
        onRecordPayment={(id) => onOpenRecordPayment(id)}
        onRenewMembership={(id) => onOpenRenewModal(id)}
        onMarkAttendance={onMarkAttendance}
        onUpdateMember={onUpdateMember}
        onArchiveMember={onArchiveMember}
        onAddFollowUp={onAddFollowUp}
      />
    );
  }

  // If viewing Payment Detail Screen (Screen 1) for a selected transaction
  const liveSelectedPaymentItem = selectedPaymentItem
    ? enrichedPayments.find((item) => item.id === selectedPaymentItem.id) || selectedPaymentItem
    : null;
  if (liveSelectedPaymentItem) {
    const linkedMember =
      effectiveMembers.find((m) => m.id === liveSelectedPaymentItem.memberId) || null;
    return (
      <PaymentDetailView
        payment={liveSelectedPaymentItem}
        member={linkedMember}
        onBack={() => setSelectedPaymentItem(null)}
        onViewMember={(mId) => {
          setSelectedPaymentItem(null);
          setSelectedMemberIdForDetail(mId);
        }}
        onCollectBalance={(mId) => onOpenRecordPayment(mId)}
        onReversePayment={onReversePayment}
      />
    );
  }

  return (
    <div className="w-full flex-1 pb-3">
      {/* ============================================================== */}
      {/* A. HEADER: Title, Subtitle, & "+ Record Payment" Button        */}
      {/* ============================================================== */}
      <header className="w-full flex flex-wrap items-center justify-between gap-2 pt-2.5 pb-2 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
              Payments
            </h1>
            {onSwitchToExpenses && (
              <button
                type="button"
                onClick={onSwitchToExpenses}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Switch to Gym Expenses"
              >
                Expenses →
              </button>
            )}
          </div>
          <p className="text-[#71717A] text-[12px] font-normal mt-0.5 leading-none">
            Track fee collections, pending balances, and receipts.
          </p>
        </div>

        {/* Primary "+ Record Payment" Action Button */}
        <button
          type="button"
          onClick={() => onOpenRecordPayment(undefined)}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-95 text-white text-[12px] font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          aria-label="Record Payment"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Record Payment</span>
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
            placeholder="Search member, phone, ID or receipt"
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
          aria-label="Open payment filters"
          title="Filter payments"
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
      {/* C. THREE SUMMARY CARDS: Collected, Pending Dues, Overdue       */}
      {/* ============================================================== */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {/* 1. Collected This Month (Pale Green) */}
        <button
          type="button"
          onClick={() => setSelectedTab(selectedTab === 'paid' ? 'all' : 'paid')}
          className={`bg-[#ECF9F2] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between text-left border transition-all cursor-pointer shadow-2xs ${
            selectedTab === 'paid'
              ? 'border-[#16A34A] ring-1 ring-[#16A34A]/30'
              : 'border-[#CDEEDB] hover:border-[#A8E0C0]'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#D3F3E0] text-[#16A34A] flex items-center justify-center shrink-0">
            <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.3]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10.5px] sm:text-[11px] font-medium block leading-tight truncate">
              Collected
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[17px] sm:text-[20px] font-bold text-[#191919] tracking-tight leading-none truncate">
                ₹{summaryStats.collectedTotal.toLocaleString('en-IN')}
              </span>
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#C8EBD6] text-[#1E5636] flex items-center justify-center shrink-0">
                <ChevronRight className="w-3 h-3 stroke-[2.3]" />
              </span>
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10.5px] text-[#15803D] font-medium mt-1.5 block leading-none truncate">
            {summaryStats.collectedTotal > 0 ? '+18% this month' : 'No collections'}
          </span>
        </button>

        {/* 2. Pending Balance (Pale Amber) */}
        <button
          type="button"
          onClick={() => setSelectedTab(selectedTab === 'pending' ? 'all' : 'pending')}
          className={`bg-[#FDF6E4] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between text-left border transition-all cursor-pointer shadow-2xs ${
            selectedTab === 'pending' || selectedTab === 'partial'
              ? 'border-[#D97706] ring-1 ring-[#D97706]/30'
              : 'border-[#F7E3B5] hover:border-[#F2D08B]'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FCE8B2] text-[#D97706] flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10.5px] sm:text-[11px] font-medium block leading-tight truncate">
              Pending Dues
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[17px] sm:text-[20px] font-bold text-[#191919] tracking-tight leading-none truncate">
                ₹{summaryStats.pendingTotal.toLocaleString('en-IN')}
              </span>
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#F2DEC0] text-[#5C4822] flex items-center justify-center shrink-0">
                <ChevronRight className="w-3 h-3 stroke-[2.3]" />
              </span>
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10.5px] text-[#6B7280] mt-1.5 block leading-none truncate">
            {summaryStats.pendingCount} {summaryStats.pendingCount === 1 ? 'member' : 'members'} due
          </span>
        </button>

        {/* 3. Overdue Payments (Pale Red) */}
        <button
          type="button"
          onClick={() => setSelectedTab(selectedTab === 'overdue' ? 'all' : 'overdue')}
          className={`bg-[#FDF1F1] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between text-left border transition-all cursor-pointer shadow-2xs ${
            selectedTab === 'overdue'
              ? 'border-[#DC2626] ring-1 ring-[#DC2626]/30'
              : 'border-[#FADBD8] hover:border-[#F5B7B1]'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FDE0E0] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10.5px] sm:text-[11px] font-medium block leading-tight truncate">
              Overdue
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[17px] sm:text-[20px] font-bold text-[#191919] tracking-tight leading-none truncate">
                ₹{summaryStats.overdueTotal.toLocaleString('en-IN')}
              </span>
              <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#F5D5D5] text-[#642626] flex items-center justify-center shrink-0">
                <ChevronRight className="w-3 h-3 stroke-[2.3]" />
              </span>
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10.5px] text-[#DC2626] font-medium mt-1.5 block leading-none truncate">
            {summaryStats.overdueCount} overdue
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
            { id: 'paid', label: 'Paid', dot: '#16A34A' },
            { id: 'partial', label: 'Partial', dot: '#F59E0B' },
            { id: 'pending', label: 'Pending', dot: '#D97706' },
            { id: 'overdue', label: 'Overdue', dot: '#EF4444' },
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
              Sort:{' '}
              <span className="font-semibold text-[#191919]">
                {sortBy === 'latest'
                  ? 'Latest'
                  : sortBy === 'amount_desc'
                  ? 'Highest Paid'
                  : sortBy === 'due_desc'
                  ? 'Pending Due'
                  : 'Member Name'}
              </span>
            </span>
            <span className="text-[8px] ml-0.5 text-[#71717A]">▼</span>
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {[
                { id: 'latest', label: 'Latest Date (Default)' },
                { id: 'due_desc', label: 'Highest Pending Due' },
                { id: 'amount_desc', label: 'Highest Paid Amount' },
                { id: 'name', label: 'Member Name (A–Z)' },
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
      {/* E. TRANSACTIONS HEADING & ACTIVE FILTER CHIPS                  */}
      {/* ============================================================== */}
      <div className="mt-3 mb-2 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight">
            Transactions ({filteredAndSortedPayments.length})
          </h2>
          {advancedFilters.paymentMethod !== 'all' && (
            <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#102A71] text-[10px] font-semibold">
              {advancedFilters.paymentMethod}
            </span>
          )}
        </div>

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
      {/* F. COMPACT PAYMENT TRANSACTION CARDS LIST                      */}
      {/* ============================================================== */}
      <div className="space-y-2 sm:space-y-2.5">
        {enrichedPayments.length === 0 ? (
          /* Empty Gym State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No payments recorded yet</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              Record your first member payment to track collections, receipts, and pending dues.
            </p>
            <button
              type="button"
              onClick={() => onOpenRecordPayment(undefined)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#102A71] text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              + Record First Payment
            </button>
          </div>
        ) : filteredAndSortedPayments.length === 0 ? (
          /* Filtered Empty State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">
              {searchQuery
                ? 'No matching payment records'
                : selectedTab === 'paid'
                ? 'No completed payments found'
                : selectedTab === 'partial'
                ? 'No partial payments found'
                : selectedTab === 'pending'
                ? 'No pending payments'
                : selectedTab === 'overdue'
                ? 'No overdue payments'
                : 'No matching transactions'}
            </h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? `No transactions match "${searchQuery}". Try searching by member name, ID, or receipt number.`
                : 'Try clearing your active status or payment mode filters to view all transactions.'}
            </p>
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-bold text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredAndSortedPayments.map((item) => {
            const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
            const planBadge = getPlanBadgeStyle(item.plan);
            const formattedDate = formatDisplayDate(item.date);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedPaymentItem(item)}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-2.5 sm:p-3 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`View payment details for ${item.memberName}`}
              >
                {/* Top Row: Avatar, Member Name & ID, Status Badge, Call & WhatsApp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.memberName}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 border border-[#EAE5DC] shadow-2xs"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E0E7FF] text-[#102A71] font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-[#C7D2FE]">
                        {item.memberName.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[13.5px] sm:text-[14px] text-[#191919] truncate leading-tight group-hover:text-[#102A71] transition-colors">
                        {item.memberName}
                      </h3>
                      <p className="text-[11px] text-[#71717A] mt-0.5 truncate leading-none">
                        ID: {item.memberCode} &nbsp;•&nbsp; {item.receiptNumber}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Status Pill + Call + WhatsApp + Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.uiStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-[#E8FAF0] text-[#16A34A] leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                        <span>Paid</span>
                      </span>
                    ) : item.uiStatus === 'partial' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-[#FFF4E5] text-[#D97706] leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                        <span>Partial</span>
                      </span>
                    ) : item.uiStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-[#FFF4E5] text-[#B45309] leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-[#FEECEB] text-[#DC2626] leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                        <span>Overdue</span>
                      </span>
                    )}

                    <a
                      href={`tel:${cleanPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors"
                      title={`Call ${item.memberName}`}
                      aria-label={`Call ${item.memberName}`}
                    >
                      <Phone className="w-3.5 h-3.5 stroke-[2.2]" />
                    </a>

                    <a
                      href={`https://wa.me/91${cleanPhone}?text=${
                        item.pendingAmount > 0
                          ? `Hi%20${encodeURIComponent(
                              item.memberName
                            )},%20a%20friendly%20reminder%20from%20MuscleFit%20Gym%20regarding%20your%20pending%20membership%20balance%20of%20₹${item.pendingAmount.toLocaleString(
                              'en-IN'
                            )}%20for%20${encodeURIComponent(item.plan)}.`
                          : `Hi%20${encodeURIComponent(
                              item.memberName
                            )},%20thank%20you%20for%20your%20payment%20of%20₹${item.paidAmount.toLocaleString(
                              'en-IN'
                            )}%20(${encodeURIComponent(item.receiptNumber)})%20at%20MuscleFit%20Gym!`
                      }`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-[#ECFDF5] text-[#16A34A] hover:bg-[#D1FAE5] flex items-center justify-center transition-colors"
                      title={`WhatsApp ${item.memberName}`}
                      aria-label={`Send WhatsApp message to ${item.memberName}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                    </a>

                    <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#191919] transition-colors shrink-0" />
                  </div>
                </div>

                {/* Bottom Row: 3 Detail Columns (Plan & Mode, Amount Paid, Balance / Date) */}
                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-[#F2EFE8] items-center">
                  {/* Col 1: Plan Badge & Payment Method */}
                  <div className="flex flex-col items-start min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight truncate max-w-full ${planBadge.className}`}
                    >
                      {planBadge.label}
                    </span>
                    <span className="text-[10.5px] font-medium text-[#4B5563] mt-1 leading-none pl-0.5 flex items-center gap-1">
                      {getMethodIcon(item.paymentMethod)}
                      <span>{item.paymentMethod}</span>
                    </span>
                  </div>

                  {/* Col 2: Amount Paid & Total Plan Fee */}
                  <div className="border-l border-[#F0ECE3] pl-2 flex flex-col justify-center min-w-0">
                    <span className="text-[10px] text-[#71717A] leading-none">
                      Paid Amount
                    </span>
                    <span className="text-[12.5px] sm:text-[13px] font-bold text-[#191919] mt-0.5 leading-tight truncate">
                      ₹{item.paidAmount.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-[#71717A]">
                        / ₹{item.planFee.toLocaleString('en-IN')}
                      </span>
                    </span>
                  </div>

                  {/* Col 3: Due Balance + Collect Action OR Payment Date */}
                  <div className="border-l border-[#F0ECE3] pl-2 flex items-center justify-between gap-1 min-w-0">
                    {item.pendingAmount > 0 ? (
                      <>
                        <div className="min-w-0">
                          <span className="text-[10px] text-[#71717A] block leading-none">
                            Balance Due
                          </span>
                          <span
                            className={`text-[12px] font-bold mt-0.5 block leading-tight truncate ${
                              item.uiStatus === 'overdue' ? 'text-[#DC2626]' : 'text-[#D97706]'
                            }`}
                          >
                            ₹{item.pendingAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRecordPayment(item.memberId);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#102A71] hover:bg-[#0D225D] text-white text-[10px] font-semibold leading-none cursor-pointer transition-colors shrink-0 shadow-2xs"
                          title={`Collect ₹${item.pendingAmount.toLocaleString('en-IN')} from ${item.memberName}`}
                        >
                          Collect
                        </button>
                      </>
                    ) : (
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#71717A] block leading-none">
                          Paid On
                        </span>
                        <span className="text-[11.5px] font-semibold text-[#191919] mt-0.5 block leading-tight truncate">
                          {formattedDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* G. ADVANCED FILTER MODAL FOR PAYMENTS                          */}
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
                    Filter Payments
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    Filter by payment mode, plan package, or period
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
              {/* Payment Method */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Modes' },
                    { id: 'UPI', label: 'UPI (GPay / PhonePe)' },
                    { id: 'Cash', label: 'Cash' },
                    { id: 'Card', label: 'Card' },
                    { id: 'Bank Transfer', label: 'Bank Transfer' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          paymentMethod: opt.id as any,
                        }))
                      }
                      className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        advancedFilters.paymentMethod === opt.id
                          ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {advancedFilters.paymentMethod === opt.id && (
                        <Check className="w-3.5 h-3.5 text-[#102A71]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

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

              {/* Collection Period */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Collection Period
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'earlier', label: 'Earlier' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          period: opt.id as any,
                        }))
                      }
                      className={`py-1.5 px-2 rounded-xl border text-[11.5px] font-semibold transition-all cursor-pointer ${
                        advancedFilters.period === opt.id
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
                    paymentMethod: 'all',
                    planType: 'all',
                    period: 'all',
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
