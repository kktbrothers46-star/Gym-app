/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  Download,
  Wallet,
  CreditCard,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Check,
  AlertCircle,
  Banknote,
  Building2,
  Smartphone,
  RotateCcw,
} from 'lucide-react';
import { Member, Payment, Expense } from '../../types/dashboard';
import { PaymentDetailView } from '../payments/PaymentDetailView';
import { MemberDetailView } from '../members/MemberDetailView';

export type ReportDateRangePreset =
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'custom';

interface RevenueReportScreenProps {
  payments: Payment[];
  expenses: Expense[];
  members: Member[];
  isEmptyState?: boolean;
  onBack: () => void;
  onSwitchToMembershipReport: () => void;
  onSelectReportTab?: (
    tab:
      | 'overview'
      | 'complaints'
      | 'revenue'
      | 'membership'
      | 'retention'
      | 'staff'
      | 'staff_permissions'
      | 'support'
      | 'gym_settings'
      | 'notifications'
  ) => void;
  onOpenPaymentsScreen: () => void;
  onOpenExpensesScreen: () => void;
  onOpenRecordPayment: (memberId?: string) => void;
  onOpenRenewModal: (memberId: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
  onReversePayment?: (paymentId: string, reason?: string) => void;
}

import {
  getTodayIso,
  computeDynamicDateBounds,
  getLast7DaysSeries,
  getLast3MonthsSeries,
  getCurrentMonthLabel,
} from '../../utils/dateUtils';

const REPORT_TODAY = getTodayIso();

function getDateBounds(
  preset: ReportDateRangePreset,
  customStart: string,
  customEnd: string
): {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
  label: string;
  shortLabel: string;
} {
  const bounds = computeDynamicDateBounds(preset, customStart, customEnd);
  const shortLabels: Record<ReportDateRangePreset, string> = {
    this_week: 'This Week',
    this_month: 'This Month',
    last_month: 'Last Month',
    last_3_months: 'Last 3 Months',
    custom: 'Custom Range',
  };
  return {
    ...bounds,
    shortLabel: shortLabels[preset] || 'This Month',
  };
}

function reconcilePercentages<T extends { amount: number }>(
  items: T[],
  total: number
): Array<T & { percentage: number }> {
  if (total <= 0 || items.length === 0) {
    return items.map((item) => ({ ...item, percentage: 0 }));
  }
  const raw = items.map((item) => (item.amount / total) * 100);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = 100 - floored.reduce((a, b) => a + b, 0);

  const indicesByFraction = raw
    .map((v, idx) => ({ idx, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder && i < indicesByFraction.length; i++) {
    floored[indicesByFraction[i].idx] += 1;
  }

  return items.map((item, idx) => ({
    ...item,
    percentage: floored[idx],
  }));
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const RevenueReportScreen: React.FC<RevenueReportScreenProps> = ({
  payments,
  expenses,
  members,
  isEmptyState = false,
  onBack,
  onSwitchToMembershipReport,
  onSelectReportTab,
  onOpenPaymentsScreen,
  onOpenExpensesScreen,
  onOpenRecordPayment,
  onOpenRenewModal,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
  onReversePayment,
}) => {
  const [rangePreset, setRangePreset] = useState<ReportDateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState(() => {
    const now = new Date();
    return getTodayIso(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [customEnd, setCustomEnd] = useState(() => getTodayIso());
  const [customDateError, setCustomDateError] = useState<string | null>(null);
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Navigation to Payment Detail or Member Detail
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const effectivePayments = isEmptyState ? [] : payments;
  const effectiveExpenses = isEmptyState ? [] : expenses;
  const effectiveMembers = isEmptyState ? [] : members;

  const bounds = useMemo(
    () => getDateBounds(rangePreset, customStart, customEnd),
    [rangePreset, customStart, customEnd]
  );

  // Filter valid collected payments in the selected date range
  // Excludes refunded payments and only sums the actual paid amount (`p.amount`), never unpaid balances
  const periodPayments = useMemo(() => {
    return effectivePayments
      .filter((p) => {
        if (p.status === 'refunded' || p.status === 'pending' || p.status === 'overdue' || p.amount <= 0) return false;
        return p.date >= bounds.startDate && p.date <= bounds.endDate;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [effectivePayments, bounds]);

  // Previous equivalent period payments for honest comparison
  const prevPeriodPayments = useMemo(() => {
    return effectivePayments.filter((p) => {
      if (p.status === 'refunded' || p.status === 'pending' || p.status === 'overdue' || p.amount <= 0) return false;
      return p.date >= bounds.prevStartDate && p.date <= bounds.prevEndDate;
    });
  }, [effectivePayments, bounds]);

  // Filter valid paid expenses in the selected date range
  const periodExpenses = useMemo(() => {
    return effectiveExpenses
      .filter((e) => {
        if (e.status === 'unpaid' || e.amount <= 0) return false;
        return e.date >= bounds.startDate && e.date <= bounds.endDate;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [effectiveExpenses, bounds]);

  const prevPeriodExpenses = useMemo(() => {
    return effectiveExpenses.filter((e) => {
      if (e.status === 'unpaid' || e.amount <= 0) return false;
      return e.date >= bounds.prevStartDate && e.date <= bounds.prevEndDate;
    });
  }, [effectiveExpenses, bounds]);

  // Core KPI Calculations
  const kpis = useMemo(() => {
    const collectedRevenue = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    const prevRevenue = prevPeriodPayments.reduce((sum, p) => sum + p.amount, 0);

    const recordedExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevExpenses = prevPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Current outstanding payments owed by members (never added to collected revenue)
    const membersWithDues = effectiveMembers.filter((m) => (m.pendingAmount || 0) > 0);
    const outstandingPayments = membersWithDues.reduce(
      (sum, m) => sum + (m.pendingAmount || 0),
      0
    );

    // Cash-based operating result = Collected Revenue - Recorded Expenses
    const operatingResult = collectedRevenue - recordedExpenses;
    const prevOperatingResult = prevRevenue - prevExpenses;

    const revenueChangePct =
      prevRevenue > 0
        ? Math.round(((collectedRevenue - prevRevenue) / prevRevenue) * 100)
        : null;

    const expenseChangePct =
      prevExpenses > 0
        ? Math.round(((recordedExpenses - prevExpenses) / prevExpenses) * 100)
        : null;

    const operatingChangePct =
      prevOperatingResult > 0
        ? Math.round(((operatingResult - prevOperatingResult) / prevOperatingResult) * 100)
        : null;

    return {
      collectedRevenue,
      recordedExpenses,
      outstandingPayments,
      overdueMembersCount: membersWithDues.length,
      operatingResult,
      revenueChangePct,
      expenseChangePct,
      operatingChangePct,
    };
  }, [
    periodPayments,
    prevPeriodPayments,
    periodExpenses,
    prevPeriodExpenses,
    effectiveMembers,
  ]);

  // Trend Chart Buckets based on selected date range
  const trendBuckets = useMemo(() => {
    if (rangePreset === 'this_week') {
      const days = getLast7DaysSeries();
      return days.map((d) => ({
        label: d.label,
        revenue: periodPayments
          .filter((p) => p.date === d.date)
          .reduce((s, p) => s + p.amount, 0),
        expenses: periodExpenses
          .filter((e) => e.date === d.date)
          .reduce((s, e) => s + e.amount, 0),
      }));
    }

    if (rangePreset === 'last_3_months') {
      const months = getLast3MonthsSeries();
      return months.map((m) => ({
        label: m.label,
        revenue: periodPayments
          .filter((p) => p.date.startsWith(m.prefix))
          .reduce((s, p) => s + p.amount, 0),
        expenses: periodExpenses
          .filter((e) => e.date.startsWith(m.prefix))
          .reduce((s, e) => s + e.amount, 0),
      }));
    }

    // For This Month, Last Month, or Custom: 6 intervals across the month
    const monthPrefix = bounds.startDate.slice(0, 7);
    const dateObj = new Date(bounds.startDate + 'T00:00:00');
    const monthShort = isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleDateString('en-IN', { month: 'short' });
    const lastDay = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth() + 1,
      0
    ).getDate();

    const ranges = [
      { start: `${monthPrefix}-01`, end: `${monthPrefix}-05`, label: `1 ${monthShort}` },
      { start: `${monthPrefix}-06`, end: `${monthPrefix}-10`, label: `6 ${monthShort}` },
      { start: `${monthPrefix}-11`, end: `${monthPrefix}-15`, label: `11 ${monthShort}` },
      { start: `${monthPrefix}-16`, end: `${monthPrefix}-20`, label: `16 ${monthShort}` },
      { start: `${monthPrefix}-21`, end: `${monthPrefix}-25`, label: `21 ${monthShort}` },
      {
        start: `${monthPrefix}-26`,
        end: `${monthPrefix}-${String(lastDay).padStart(2, '0')}`,
        label: `${lastDay} ${monthShort}`,
      },
    ];

    return ranges.map((r) => ({
      label: r.label,
      revenue: periodPayments
        .filter((p) => p.date >= r.start && p.date <= r.end)
        .reduce((s, p) => s + p.amount, 0),
      expenses: periodExpenses
        .filter((e) => e.date >= r.start && e.date <= r.end)
        .reduce((s, e) => s + e.amount, 0),
    }));
  }, [rangePreset, periodPayments, periodExpenses, bounds]);

  const maxBucketVal = useMemo(() => {
    const rawMax = Math.max(
      ...trendBuckets.map((b) => Math.max(b.revenue, b.expenses)),
      0
    );
    if (rawMax <= 0) return 20000;
    return Math.ceil(rawMax / 5000) * 5000;
  }, [trendBuckets]);

  // Payment Method Breakdown (with reconciled percentages)
  const paymentMethodBreakdown = useMemo(() => {
    const methodColors: Record<string, string> = {
      UPI: '#22C55E',
      Cash: '#3B82F6',
      'Bank Transfer': '#F59E0B',
      Card: '#8B5CF6',
    };
    const totals: Record<string, number> = {
      UPI: 0,
      Cash: 0,
      'Bank Transfer': 0,
      Card: 0,
    };

    periodPayments.forEach((p) => {
      const m = p.paymentMethod || 'UPI';
      totals[m] = (totals[m] || 0) + p.amount;
    });

    const list = Object.entries(totals)
      .filter(([, amt]) => amt > 0)
      .map(([method, amount]) => ({
        label: method,
        amount,
        color: methodColors[method] || '#64748B',
      }))
      .sort((a, b) => b.amount - a.amount);

    return reconcilePercentages(list, kpis.collectedRevenue);
  }, [periodPayments, kpis.collectedRevenue]);

  // Expense Category Breakdown (with reconciled percentages)
  const expenseCategoryBreakdown = useMemo(() => {
    const categoryColors: Record<string, string> = {
      Rent: '#EF4444',
      Utilities: '#F59E0B',
      Staff: '#3B82F6',
      'Trainer Salaries': '#3B82F6',
      Maintenance: '#22C55E',
      Equipment: '#8B5CF6',
      Supplies: '#14B8A6',
      Marketing: '#EC4899',
      Other: '#9CA3AF',
    };

    const grouped: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      grouped[cat] = (grouped[cat] || 0) + e.amount;
    });

    const sorted = Object.entries(grouped)
      .filter(([, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1]);

    // Group top 4 + Others if more than 5 categories so legend stays compact on mobile
    const topItems = sorted.slice(0, 4).map(([cat, amount]) => ({
      label: cat,
      amount,
      color: categoryColors[cat] || '#9CA3AF',
    }));

    if (sorted.length > 4) {
      const othersAmt = sorted.slice(4).reduce((s, [, amt]) => s + amt, 0);
      topItems.push({
        label: 'Others',
        amount: othersAmt,
        color: '#9CA3AF',
      });
    }

    return reconcilePercentages(topItems, kpis.recordedExpenses);
  }, [periodExpenses, kpis.recordedExpenses]);

  // Handle CSV Export
  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Gym Business OS - Revenue & Expense Report'],
      ['Period', bounds.label],
      ['Collected Revenue (INR)', String(kpis.collectedRevenue)],
      ['Recorded Expenses (INR)', String(kpis.recordedExpenses)],
      ['Cash-Based Operating Result (INR)', String(kpis.operatingResult)],
      ['Current Outstanding Payments (INR)', String(kpis.outstandingPayments)],
      [],
      ['Payment Date', 'Receipt', 'Member Name', 'Plan', 'Method', 'Amount Received (INR)'],
      ...periodPayments.map((p) => [
        p.date,
        p.receiptNumber || p.id,
        p.memberName,
        p.plan,
        p.paymentMethod,
        String(p.amount),
      ]),
      [],
      ['Expense Date', 'Title', 'Category', 'Method', 'Amount (INR)'],
      ...periodExpenses.map((e) => [
        e.date,
        e.title,
        e.category,
        e.paymentMethod || 'UPI',
        String(e.amount),
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `revenue_report_${bounds.startDate}_to_${bounds.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`Exported Revenue Report (${bounds.label})`);
    setTimeout(() => setExportToast(null), 3000);
  };

  // If viewing a specific Member Detail
  const activeMemberObj = useMemo(
    () => effectiveMembers.find((m) => m.id === selectedMemberId) || null,
    [effectiveMembers, selectedMemberId]
  );

  if (activeMemberObj) {
    return (
      <MemberDetailView
        member={activeMemberObj}
        onBack={() => setSelectedMemberId(null)}
        onRecordPayment={onOpenRecordPayment}
        onRenewMembership={onOpenRenewModal}
        onMarkAttendance={onMarkAttendance}
        onUpdateMember={onUpdateMember}
        onArchiveMember={onArchiveMember}
        onAddFollowUp={onAddFollowUp}
      />
    );
  }

  // If viewing a specific Payment Detail
  const selectedPaymentObj = useMemo(
    () => effectivePayments.find((p) => p.id === selectedPaymentId) || null,
    [effectivePayments, selectedPaymentId]
  );

  if (selectedPaymentObj) {
    const linkedMember = effectiveMembers.find((m) => m.id === selectedPaymentObj.memberId);
    return (
      <PaymentDetailView
        payment={{
          id: selectedPaymentObj.id,
          memberId: selectedPaymentObj.memberId,
          memberName: selectedPaymentObj.memberName,
          memberCode:
            selectedPaymentObj.memberCode ||
            linkedMember?.memberCode ||
            selectedPaymentObj.memberId.toUpperCase(),
          phone: linkedMember?.phone || '',
          photoUrl: linkedMember?.photoUrl,
          plan: selectedPaymentObj.plan || linkedMember?.membershipPlan || 'Monthly Plan',
          planFee: selectedPaymentObj.planFee || selectedPaymentObj.amount,
          paidAmount: selectedPaymentObj.amount,
          previouslyPaid: selectedPaymentObj.previouslyPaid || 0,
          pendingAmount: selectedPaymentObj.pendingAmount || 0,
          paymentMethod: selectedPaymentObj.paymentMethod,
          date: selectedPaymentObj.date,
          time: selectedPaymentObj.time || '10:24 AM',
          dueDate: selectedPaymentObj.dueDate,
          month: selectedPaymentObj.month || getCurrentMonthLabel(),
          receiptNumber: selectedPaymentObj.receiptNumber || `PAY-${selectedPaymentObj.id.slice(-6)}`,
          referenceId: selectedPaymentObj.referenceId,
          notes: selectedPaymentObj.notes,
          uiStatus:
            selectedPaymentObj.status === 'refunded'
              ? 'refunded'
              : (selectedPaymentObj.pendingAmount || 0) > 0
              ? 'partial'
              : 'paid',
        }}
        member={linkedMember}
        onBack={() => setSelectedPaymentId(null)}
        onViewMember={(mId: string) => {
          setSelectedPaymentId(null);
          setSelectedMemberId(mId);
        }}
        onCollectBalance={(mId: string) => onOpenRecordPayment(mId)}
        onReversePayment={onReversePayment}
      />
    );
  }

  // Helper to render SVG Donut slices
  const renderDonutSvg = (
    slices: Array<{ label: string; amount: number; percentage: number; color: string }>,
    centerValue: string,
    centerLabel: string
  ) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    let cumulativeFraction = 0;

    return (
      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#F2EFE8"
            strokeWidth="12"
          />
          {slices.map((s) => {
            const frac = s.percentage / 100;
            const dashArray = `${Math.max(0, frac * circumference - 1.5)} ${circumference}`;
            const dashOffset = -cumulativeFraction * circumference;
            cumulativeFraction += frac;
            return (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
          <span className="text-[11px] font-extrabold text-[#191919] leading-tight">
            {centerValue}
          </span>
          <span className="text-[9.5px] font-medium text-[#71717A] leading-none mt-0.5">
            {centerLabel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pt-3 pb-6 space-y-2.5">
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
            <h1 className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none">
              Revenue Report
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Track your gym’s income and financial performance.
            </p>
          </div>
        </div>

        {/* Switch to Membership & Renewal Report */}
        <button
          type="button"
          onClick={onSwitchToMembershipReport}
          className="h-[28px] px-2.5 rounded-full bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E3A8A] text-[10.5px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          <span>Memberships</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* REPORT SWITCHER PILLS */}
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
            ] as const
          ).map((t) => {
            const isActive = t.id === 'revenue';
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

      {/* 2. DATE RANGE SELECTOR + EXPORT BUTTON */}
      <div className="flex items-center justify-between gap-2 relative">
        <button
          type="button"
          onClick={() => setIsRangeMenuOpen((prev) => !prev)}
          className="h-[34px] px-3 rounded-xl bg-white border border-[#EAE5DC] hover:border-[#D6D0C4] text-[#191919] text-[11.5px] font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
          <span>{bounds.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        <button
          type="button"
          onClick={handleExportCsv}
          className="h-[34px] px-3 rounded-xl bg-white hover:bg-[#F8F6F1] border border-[#EAE5DC] text-[#191919] text-[11.5px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#52525B]" />
          <span>Export</span>
        </button>

        {/* Date Range Dropdown Menu */}
        {isRangeMenuOpen && (
          <div className="absolute left-0 top-10 z-30 bg-white rounded-2xl border border-[#E5E0D6] shadow-xl p-2.5 w-72 space-y-1.5">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#71717A] px-1">
              Select Reporting Period
            </div>
            {(
              [
                { id: 'this_week', label: `This Week (${computeDynamicDateBounds('this_week').label})` },
                { id: 'this_month', label: `This Month (${computeDynamicDateBounds('this_month').label})` },
                { id: 'last_month', label: `Last Month (${computeDynamicDateBounds('last_month').label})` },
                { id: 'last_3_months', label: `Last 3 Months (${computeDynamicDateBounds('last_3_months').label})` },
                { id: 'custom', label: 'Custom Date Range' },
              ] as Array<{ id: ReportDateRangePreset; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setRangePreset(opt.id);
                  setCustomDateError(null);
                  if (opt.id !== 'custom') {
                    setIsRangeMenuOpen(false);
                  }
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl text-left text-[11.5px] flex items-center justify-between cursor-pointer ${
                  rangePreset === opt.id
                    ? 'bg-[#EEF2FF] text-[#1E3A8A] font-bold'
                    : 'text-[#52525B] hover:bg-[#F8F6F1] font-medium'
                }`}
              >
                <span>{opt.label}</span>
                {rangePreset === opt.id && <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />}
              </button>
            ))}

            {rangePreset === 'custom' && (
              <div className="pt-2 border-t border-[#F2EFE8] space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#71717A] mb-0.5">
                      From
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      max={REPORT_TODAY}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full h-[30px] px-2 rounded-lg border border-[#E5E0D6] text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#71717A] mb-0.5">
                      To
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      max={REPORT_TODAY}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full h-[30px] px-2 rounded-lg border border-[#E5E0D6] text-[11px]"
                    />
                  </div>
                </div>
                {customDateError && (
                  <p className="text-[10.5px] font-semibold text-[#DC2626]">{customDateError}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (customStart > customEnd) {
                      setCustomDateError('Start date cannot be after end date.');
                      return;
                    }
                    setCustomDateError(null);
                    setIsRangeMenuOpen(false);
                  }}
                  className="w-full h-[30px] rounded-lg bg-[#1E3A8A] text-white text-[11px] font-bold cursor-pointer"
                >
                  Apply Custom Range
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {exportToast && (
        <div className="px-3 py-1.5 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] text-[11px] font-semibold flex items-center justify-between">
          <span>{exportToast}</span>
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      {/* 3. REVENUE KPI CARDS (2×2 GRID) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card A: Collected Revenue */}
        <div className="rounded-2xl p-3 bg-[#F0FDF4]/90 border border-[#DCFCE7] shadow-2xs flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              Collected Revenue
            </span>
            <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
              ₹{kpis.collectedRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] font-semibold mt-0.5 truncate">
              {kpis.revenueChangePct !== null ? (
                <span
                  className={
                    kpis.revenueChangePct >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }
                >
                  {kpis.revenueChangePct >= 0 ? `+${kpis.revenueChangePct}%` : `${kpis.revenueChangePct}%`}{' '}
                  <span className="text-[#71717A] font-medium">vs prev period</span>
                </span>
              ) : (
                <span className="text-[#16A34A]">
                  {periodPayments.length} payment{periodPayments.length === 1 ? '' : 's'} received
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card B: Recorded Expenses */}
        <button
          type="button"
          onClick={onOpenExpensesScreen}
          className="text-left rounded-2xl p-3 bg-[#FEF2F2]/90 border border-[#FECACA] hover:border-[#FCA5A5] shadow-2xs flex items-start gap-2.5 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              Recorded Expenses
            </span>
            <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
              ₹{kpis.recordedExpenses.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] font-semibold mt-0.5 truncate">
              {kpis.expenseChangePct !== null ? (
                <span
                  className={
                    kpis.expenseChangePct <= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }
                >
                  {kpis.expenseChangePct >= 0 ? `+${kpis.expenseChangePct}%` : `${kpis.expenseChangePct}%`}{' '}
                  <span className="text-[#71717A] font-medium">vs prev period</span>
                </span>
              ) : (
                <span className="text-[#DC2626]">
                  {periodExpenses.length} expense{periodExpenses.length === 1 ? '' : 's'} logged
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Card C: Outstanding Payments */}
        <button
          type="button"
          onClick={onOpenPaymentsScreen}
          className="text-left rounded-2xl p-3 bg-[#EFF6FF]/90 border border-[#DBEAFE] hover:border-[#BFDBFE] shadow-2xs flex items-start gap-2.5 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              Outstanding Payments
            </span>
            <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
              ₹{kpis.outstandingPayments.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] font-semibold text-[#1E3A8A] mt-0.5 truncate">
              Current balance ({kpis.overdueMembersCount} due)
            </div>
          </div>
        </button>

        {/* Card D: Operating Result (Cash-based) */}
        <div className="rounded-2xl p-3 bg-[#FFFBEB]/90 border border-[#FDE68A] shadow-2xs flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              Operating Result
            </span>
            <div
              className={`text-[19px] sm:text-[20px] font-extrabold leading-tight tracking-tight mt-0.5 ${
                kpis.operatingResult >= 0 ? 'text-[#191919]' : 'text-[#DC2626]'
              }`}
            >
              {kpis.operatingResult < 0 ? '-' : ''}₹
              {Math.abs(kpis.operatingResult).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] font-semibold text-[#16A34A] mt-0.5 truncate">
              Cash-based (Rev − Exp)
            </div>
          </div>
        </div>
      </div>

      {/* 4. REVENUE TREND CHART (GROUPED BARS: REVENUE VS EXPENSES) */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-bold text-[#191919]">Revenue Trend</h2>

          <button
            type="button"
            onClick={() => setIsRangeMenuOpen((prev) => !prev)}
            className="h-[26px] px-2.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] text-[#191919] text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{bounds.shortLabel}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-[#52525B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Expenses</span>
          </div>
        </div>

        {periodPayments.length === 0 && periodExpenses.length === 0 ? (
          <div className="py-6 text-center text-[#71717A]">
            <p className="text-[12px] font-bold text-[#191919]">
              No transactions in this period
            </p>
            <p className="text-[10.5px] mt-0.5">
              Select another date range or record a payment to view revenue trends.
            </p>
          </div>
        ) : (
          <div className="pt-1">
            <div className="flex gap-2">
              {/* Y-Axis Ticks */}
              <div className="flex flex-col justify-between text-[9.5px] font-medium text-[#71717A] h-32 pb-4 shrink-0 text-right w-8">
                <span>{Math.round(maxBucketVal / 1000)}K</span>
                <span>{Math.round((maxBucketVal * 0.75) / 1000)}K</span>
                <span>{Math.round((maxBucketVal * 0.5) / 1000)}K</span>
                <span>{Math.round((maxBucketVal * 0.25) / 1000)}K</span>
                <span>0</span>
              </div>

              {/* Plot Area */}
              <div className="flex-1">
                <div className="relative h-28 flex items-end justify-around border-b border-[#EAE5DC] px-1">
                  {/* Subtle horizontal grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-dashed border-[#F2EFE8] w-full" />
                    <div className="border-b border-dashed border-[#F2EFE8] w-full" />
                    <div className="border-b border-dashed border-[#F2EFE8] w-full" />
                    <div className="border-b border-dashed border-[#F2EFE8] w-full" />
                    <div />
                  </div>

                  {trendBuckets.map((bucket, idx) => {
                    const revPct = Math.min(100, (bucket.revenue / maxBucketVal) * 100);
                    const expPct = Math.min(100, (bucket.expenses / maxBucketVal) * 100);
                    const isSelected = activeBarIndex === idx;

                    return (
                      <div
                        key={bucket.label}
                        onClick={() =>
                          setActiveBarIndex((prev) => (prev === idx ? null : idx))
                        }
                        className="relative z-10 flex flex-col items-center justify-end h-full flex-1 cursor-pointer group"
                      >
                        {/* Tooltip */}
                        {isSelected && (
                          <div className="absolute -top-11 z-20 bg-[#191919] text-white text-[9.5px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-md">
                            <div>Rev: ₹{bucket.revenue.toLocaleString('en-IN')}</div>
                            <div className="text-[#FBBF24]">
                              Exp: ₹{bucket.expenses.toLocaleString('en-IN')}
                            </div>
                          </div>
                        )}

                        <div className="flex items-end gap-1 h-full w-full justify-center px-0.5">
                          {/* Revenue Bar */}
                          <div
                            style={{
                              height: bucket.revenue > 0 ? `${Math.max(6, revPct)}%` : '0%',
                            }}
                            className="w-2.5 sm:w-3 rounded-t-sm bg-[#2563EB] transition-all duration-200 group-hover:opacity-90"
                          />
                          {/* Expense Bar */}
                          <div
                            style={{
                              height: bucket.expenses > 0 ? `${Math.max(6, expPct)}%` : '0%',
                            }}
                            className="w-2.5 sm:w-3 rounded-t-sm bg-[#F59E0B] transition-all duration-200 group-hover:opacity-90"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-center justify-around pt-1.5">
                  {trendBuckets.map((bucket) => (
                    <span
                      key={bucket.label}
                      className="text-[9.5px] font-medium text-[#71717A] text-center flex-1 truncate"
                    >
                      {bucket.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. SIDE-BY-SIDE BREAKDOWN CARDS: PAYMENT METHODS & EXPENSE CATEGORIES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Left Card: Payment Method Breakdown */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <h3 className="text-[12.5px] font-bold text-[#191919]">
            Payment Method Breakdown
          </h3>

          {paymentMethodBreakdown.length === 0 ? (
            <div className="py-5 text-center text-[11px] text-[#71717A]">
              No collected payments in this period.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              {renderDonutSvg(
                paymentMethodBreakdown,
                `₹${kpis.collectedRevenue.toLocaleString('en-IN')}`,
                'Total'
              )}

              <div className="flex-1 space-y-1.5 min-w-0">
                {paymentMethodBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#52525B] font-medium truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-bold text-[#191919] shrink-0">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Card: Expense by Category */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <h3 className="text-[12.5px] font-bold text-[#191919]">Expense by Category</h3>

          {expenseCategoryBreakdown.length === 0 ? (
            <div className="py-5 text-center text-[11px] text-[#71717A]">
              No recorded expenses in this period.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              {renderDonutSvg(
                expenseCategoryBreakdown,
                `₹${kpis.recordedExpenses.toLocaleString('en-IN')}`,
                'Total'
              )}

              <div className="flex-1 space-y-1.5 min-w-0">
                {expenseCategoryBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#52525B] font-medium truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-bold text-[#191919] shrink-0">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. RECENT PAYMENTS LIST */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13.5px] font-bold text-[#191919]">
            Recent Payments ({periodPayments.length})
          </h2>
          <button
            type="button"
            onClick={onOpenPaymentsScreen}
            className="text-[11.5px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {periodPayments.length === 0 ? (
          <div className="py-5 text-center text-[#71717A] space-y-1">
            <p className="text-[12px] font-bold text-[#191919]">
              No payments recorded in this date range
            </p>
            <p className="text-[11px]">
              Try selecting another date range or record a new payment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE8]">
            {periodPayments.slice(0, 6).map((payment) => {
              const member = effectiveMembers.find((m) => m.id === payment.memberId);
              return (
                <button
                  key={payment.id}
                  type="button"
                  onClick={() => setSelectedPaymentId(payment.id)}
                  className="w-full py-2.5 first:pt-1 last:pb-0.5 flex items-center justify-between gap-2 text-left hover:bg-[#FBF9F5] rounded-xl px-1 transition-colors cursor-pointer"
                >
                  {/* Left: Member Avatar + Name + Plan */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {member?.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={payment.memberName}
                        className="w-9 h-9 rounded-full object-cover border border-[#E5E0D6] shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#1E3A8A] font-bold text-[11.5px] flex items-center justify-center shrink-0">
                        {getInitials(payment.memberName || 'Member')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-[#191919] truncate">
                        {payment.memberName || 'Gym Member'}
                      </div>
                      <div className="text-[10.5px] font-medium text-[#71717A] truncate">
                        {payment.plan || member?.membershipPlan || 'Membership'}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Date & Time */}
                  <div className="text-left shrink-0 hidden xs:block sm:block px-2 border-l border-[#F2EFE8]">
                    <div className="text-[11px] font-medium text-[#52525B]">
                      {formatShortDate(payment.date)}
                    </div>
                    <div className="text-[10px] text-[#71717A]">
                      {payment.time || '10:24 AM'}
                    </div>
                  </div>

                  {/* Right: Amount + Method + Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-right">
                      <div className="text-[12.5px] font-extrabold text-[#191919]">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-semibold text-[#52525B] flex items-center justify-end gap-1">
                        {payment.paymentMethod === 'UPI' ? (
                          <Smartphone className="w-2.5 h-2.5 text-[#16A34A]" />
                        ) : payment.paymentMethod === 'Cash' ? (
                          <Banknote className="w-2.5 h-2.5 text-[#16A34A]" />
                        ) : payment.paymentMethod === 'Bank Transfer' ? (
                          <Building2 className="w-2.5 h-2.5 text-[#1E3A8A]" />
                        ) : (
                          <CreditCard className="w-2.5 h-2.5 text-[#7C3AED]" />
                        )}
                        <span>{payment.paymentMethod}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
