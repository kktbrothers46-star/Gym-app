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
  BarChart3,
  Users,
  UserPlus,
  IndianRupee,
  Clock,
  CalendarCheck,
  Wallet,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  MessageSquareWarning,
} from 'lucide-react';
import {
  Member,
  Payment,
  Expense,
  RenewalRecord,
  MonthlyMetric,
  AttendanceRecord,
  StaffMember,
} from '../../types/dashboard';
import { ReportTabType } from './RetentionReportScreen';

export type OverviewPeriodPreset =
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'custom';

interface ReportsOverviewScreenProps {
  members: Member[];
  payments: Payment[];
  expenses: Expense[];
  renewals: RenewalRecord[];
  attendance: AttendanceRecord[];
  staff: StaffMember[];
  monthlyMetrics: MonthlyMetric[];
  isEmptyState?: boolean;
  onBack: () => void;
  onSelectReportTab: (tab: ReportTabType) => void;
  onOpenAttendanceReport: () => void;
  onOpenExpenseReport: () => void;
  onOpenPaymentsScreen: () => void;
}

export const ReportsOverviewScreen: React.FC<ReportsOverviewScreenProps> = ({
  members,
  payments,
  expenses,
  renewals,
  attendance,
  staff,
  monthlyMetrics,
  isEmptyState = false,
  onBack,
  onSelectReportTab,
  onOpenAttendanceReport,
  onOpenExpenseReport,
  onOpenPaymentsScreen,
}) => {
  const [periodPreset, setPeriodPreset] =
    useState<OverviewPeriodPreset>('this_month');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);

  // Use actual current local date from browser/system
  const nowLocal = useMemo(() => new Date(), []);
  const currentYear = nowLocal.getFullYear();
  const currentMonthIdx = nowLocal.getMonth(); // 0-indexed

  const formatIsoLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDisplayDate = (d: Date) =>
    new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);

  // Default custom range bounds
  const [customStart, setCustomStart] = useState<string>(() => {
    const firstOfMonth = new Date(currentYear, currentMonthIdx, 1);
    return formatIsoLocal(firstOfMonth);
  });
  const [customEnd, setCustomEnd] = useState<string>(() =>
    formatIsoLocal(nowLocal)
  );
  const [customRangeError, setCustomRangeError] = useState<string | null>(null);

  // Simulated loading / error state support for verification
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Calculate active period bounds and label using actual local dates
  const periodBounds = useMemo(() => {
    if (periodPreset === 'this_month') {
      const start = new Date(currentYear, currentMonthIdx, 1);
      const end = nowLocal;
      const prevStart = new Date(currentYear, currentMonthIdx - 1, 1);
      const prevEnd = new Date(currentYear, currentMonthIdx, 0);
      return {
        title: 'This Month',
        subtitle: `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`,
        startIso: formatIsoLocal(start),
        endIso: formatIsoLocal(end),
        prevStartIso: formatIsoLocal(prevStart),
        prevEndIso: formatIsoLocal(prevEnd),
        comparisonLabel: 'vs last month',
      };
    }
    if (periodPreset === 'last_month') {
      const start = new Date(currentYear, currentMonthIdx - 1, 1);
      const end = new Date(currentYear, currentMonthIdx, 0);
      const prevStart = new Date(currentYear, currentMonthIdx - 2, 1);
      const prevEnd = new Date(currentYear, currentMonthIdx - 1, 0);
      return {
        title: 'Last Month',
        subtitle: `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`,
        startIso: formatIsoLocal(start),
        endIso: formatIsoLocal(end),
        prevStartIso: formatIsoLocal(prevStart),
        prevEndIso: formatIsoLocal(prevEnd),
        comparisonLabel: 'vs prior month',
      };
    }
    if (periodPreset === 'last_30_days') {
      const start = new Date(nowLocal);
      start.setDate(nowLocal.getDate() - 29);
      const prevStart = new Date(nowLocal);
      prevStart.setDate(nowLocal.getDate() - 59);
      const prevEnd = new Date(nowLocal);
      prevEnd.setDate(nowLocal.getDate() - 30);
      return {
        title: 'Last 30 Days',
        subtitle: `${formatDisplayDate(start)} - ${formatDisplayDate(nowLocal)}`,
        startIso: formatIsoLocal(start),
        endIso: formatIsoLocal(nowLocal),
        prevStartIso: formatIsoLocal(prevStart),
        prevEndIso: formatIsoLocal(prevEnd),
        comparisonLabel: 'vs previous 30 days',
      };
    }

    // Custom date range
    const startObj = new Date(`${customStart}T00:00:00`);
    const endObj = new Date(`${customEnd}T23:59:59`);
    const valid =
      !isNaN(startObj.getTime()) &&
      !isNaN(endObj.getTime()) &&
      customStart <= customEnd;

    const spanDays = valid
      ? Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      : 30;
    const pEnd = new Date(startObj);
    pEnd.setDate(pEnd.getDate() - 1);
    const pStart = new Date(pEnd);
    pStart.setDate(pStart.getDate() - (spanDays - 1));

    return {
      title: 'Custom Date Range',
      subtitle: valid
        ? `${formatDisplayDate(startObj)} - ${formatDisplayDate(endObj)}`
        : 'Select valid start and end dates',
      startIso: customStart,
      endIso: customEnd,
      prevStartIso: formatIsoLocal(pStart),
      prevEndIso: formatIsoLocal(pEnd),
      comparisonLabel: 'Custom period',
    };
  }, [periodPreset, currentYear, currentMonthIdx, nowLocal, customStart, customEnd]);

  // Period-aware calculations from real store data
  const metrics = useMemo(() => {
    if (isEmptyState) {
      return {
        totalRevenue: 0,
        revenueDeltaPct: null as number | null,
        activeMembers: 0,
        activeMembersDeltaPct: null as number | null,
        newMembers: 0,
        newMembersDeltaPct: null as number | null,
        pendingPaymentsTotal: 0,
        pendingMembersCount: 0,
        hasPeriodActivity: false,
      };
    }

    const effectiveMembers = members || [];
    const effectivePayments = payments || [];

    // 1. Active Members (members whose memberships are currently valid under existing membership rules)
    const validActiveMembers = effectiveMembers.filter(
      (m) =>
        m.status === 'active' ||
        m.status === 'expiring' ||
        (m.status === 'pending' && m.daysUntilExpiry > 0)
    );
    const activeMembersCount = validActiveMembers.length;

    // 2. Pending Payments (outstanding balances on member accounts — never counted as collected revenue)
    const membersWithPending = effectiveMembers.filter(
      (m) => (m.pendingAmount || 0) > 0
    );
    const pendingPaymentsTotal = membersWithPending.reduce(
      (sum, m) => sum + (m.pendingAmount || 0),
      0
    );

    // 3. Collected payments in selected period (strictly 'completed' or 'partial' paid amounts, excluding 'refunded', 'pending', 'overdue')
    const collectedPayments = effectivePayments.filter(
      (p) =>
        (p.status === 'completed' || p.status === 'partial') &&
        p.amount > 0
    );

    // Filter payments by period
    const inPeriodPayments = collectedPayments.filter((p) => {
      return p.date >= periodBounds.startIso && p.date <= periodBounds.endIso;
    });

    const prevPeriodPayments = collectedPayments.filter((p) => {
      return p.date >= periodBounds.prevStartIso && p.date <= periodBounds.prevEndIso;
    });

    const totalRevenue = inPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
    const prevRevenue = prevPeriodPayments.reduce((sum, p) => sum + p.amount, 0);

    const revenueDeltaPct =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
        : null;

    // 4. New Members registered during the selected period
    const inPeriodNewMembers = effectiveMembers.filter((m) => {
      if (!m.startDate) return false;
      return m.startDate >= periodBounds.startIso && m.startDate <= periodBounds.endIso;
    });

    const prevPeriodNewMembers = effectiveMembers.filter((m) => {
      if (!m.startDate) return false;
      return m.startDate >= periodBounds.prevStartIso && m.startDate <= periodBounds.prevEndIso;
    });

    const newMembersCount = inPeriodNewMembers.length;
    const prevNewCount = prevPeriodNewMembers.length;
    const newMembersDeltaPct =
      prevNewCount > 0
        ? Math.round(((newMembersCount - prevNewCount) / prevNewCount) * 100)
        : null;

    // Active members comparison from monthlyMetrics if available
    const octMetric = (monthlyMetrics || []).find((m) => m.shortMonth === 'Oct');
    const sepMetric = (monthlyMetrics || []).find((m) => m.shortMonth === 'Sep');
    const activeMembersDeltaPct =
      octMetric && sepMetric && sepMetric.members > 0 && periodPreset !== 'custom'
        ? Math.round(
            ((octMetric.members - sepMetric.members) / sepMetric.members) * 100
          )
        : null;

    return {
      totalRevenue,
      revenueDeltaPct,
      activeMembers: activeMembersCount,
      activeMembersDeltaPct,
      newMembers: newMembersCount,
      newMembersDeltaPct,
      pendingPaymentsTotal,
      pendingMembersCount: membersWithPending.length,
      hasPeriodActivity:
        inPeriodPayments.length > 0 || inPeriodNewMembers.length > 0,
    };
  }, [
    isEmptyState,
    members,
    payments,
    monthlyMetrics,
    periodPreset,
    periodBounds.startIso,
    periodBounds.endIso,
  ]);

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) {
      setCustomRangeError('Please select both a start date and an end date.');
      return;
    }
    if (customStart > customEnd) {
      setCustomRangeError('Start date cannot be after end date.');
      return;
    }
    setCustomRangeError(null);
    setPeriodPreset('custom');
    setIsPeriodMenuOpen(false);
  };

  if (loadError) {
    return (
      <div className="mt-6 bg-white rounded-2xl p-6 border border-[#FECACA] text-center space-y-2.5 shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-[15px] font-bold text-[#191919]">
          Something went wrong while loading reports.
        </h2>
        <p className="text-[11.5px] text-[#71717A]">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => {
              setLoadError(null);
              setIsLoading(false);
            }, 400);
          }}
          className="h-[34px] px-4 rounded-xl bg-[#1E3A8A] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full pt-3 space-y-2.5 animate-pulse">
        <div className="h-12 bg-white/70 rounded-2xl" />
        <div className="h-14 bg-white/70 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-24 bg-white/70 rounded-2xl" />
          <div className="h-24 bg-white/70 rounded-2xl" />
          <div className="h-24 bg-white/70 rounded-2xl" />
          <div className="h-24 bg-white/70 rounded-2xl" />
        </div>
        <div className="h-72 bg-white/70 rounded-2xl" />
      </div>
    );
  }

  const reportRows = [
    {
      id: 'rev',
      title: 'Revenue Report',
      description: 'Income, payment methods and revenue trends',
      icon: <BarChart3 className="w-4 h-4 text-[#16A34A]" />,
      iconBg: 'bg-[#DCFCE7]',
      onClick: () => onSelectReportTab('revenue'),
    },
    {
      id: 'mem',
      title: 'Membership & Renewal Report',
      description: 'Active members, renewals and expiry analysis',
      icon: <Users className="w-4 h-4 text-[#9333EA]" />,
      iconBg: 'bg-[#F3E8FF]',
      onClick: () => onSelectReportTab('membership'),
    },
    {
      id: 'ret',
      title: 'Retention Report',
      description: 'Member retention and churn analysis',
      icon: <Clock className="w-4 h-4 text-[#D97706]" />,
      iconBg: 'bg-[#FEF3C7]',
      onClick: () => onSelectReportTab('retention'),
    },
    {
      id: 'att',
      title: 'Attendance Report',
      description: 'Check-ins, attendance trends and insights',
      icon: <CalendarCheck className="w-4 h-4 text-[#2563EB]" />,
      iconBg: 'bg-[#DBEAFE]',
      onClick: onOpenAttendanceReport,
    },
    {
      id: 'exp',
      title: 'Expense Report',
      description: 'Gym expenses and cost breakdown',
      icon: <Wallet className="w-4 h-4 text-[#EF4444]" />,
      iconBg: 'bg-[#FEE2E2]',
      onClick: onOpenExpenseReport,
    },
    {
      id: 'stf',
      title: 'Staff Report',
      description: 'Staff attendance, salary and performance',
      icon: <Users className="w-4 h-4 text-[#475569]" />,
      iconBg: 'bg-[#F1F5F9]',
      onClick: () => onSelectReportTab('staff'),
    },
  ];

  return (
    <div className="w-full pt-3 pb-6 space-y-2.5">
      {/* 1. HEADER */}
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="flex items-start gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-7 h-7 rounded-xl bg-white border border-[#EAE5DC] text-[#191919] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs hover:bg-[#F8F6F1] cursor-pointer"
            aria-label="Back to Home"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none">
              Reports Overview
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Get insights about your gym performance.
            </p>
          </div>
        </div>

        {/* Quick switch to Complaints & Support */}
        <button
          type="button"
          onClick={() => onSelectReportTab('complaints')}
          className="h-[28px] px-2.5 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E3A8A] text-[10.5px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          <MessageSquareWarning className="w-3 h-3" />
          <span>Complaints</span>
        </button>
      </div>

      {/* REPORT / SECTION SWITCHER PILLS */}
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
          const isActive = t.id === 'overview';
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

      {/* 2. FULL-WIDTH DATE RANGE SELECTOR CARD */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsPeriodMenuOpen((prev) => !prev)}
          className="w-full bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs flex items-center justify-between gap-3 hover:border-[#D6D0C4] transition-colors cursor-pointer text-left"
          aria-expanded={isPeriodMenuOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold text-[#191919] leading-tight">
                {periodBounds.title}
              </div>
              <div className="text-[10.5px] font-medium text-[#71717A] mt-0.5 truncate">
                {periodBounds.subtitle}
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform duration-150 ${
              isPeriodMenuOpen ? 'rotate-180 text-[#1E3A8A]' : ''
            }`}
          />
        </button>

        {/* Period Dropdown Sheet */}
        {isPeriodMenuOpen && (
          <div className="mt-1.5 bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-xl space-y-2 z-30 relative animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                  { id: 'last_30_days', label: 'Last 30 Days' },
                ] as Array<{ id: OverviewPeriodPreset; label: string }>
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setPeriodPreset(preset.id);
                    setCustomRangeError(null);
                    setIsPeriodMenuOpen(false);
                  }}
                  className={`h-[32px] px-2.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                    periodPreset === preset.id
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-[#FAF8F5] text-[#52525B] border border-[#E5E0D6] hover:bg-[#F2EFE8]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#F4F1EA] space-y-2">
              <div className="text-[11px] font-bold text-[#191919]">
                Custom Date Range
              </div>
              {customRangeError && (
                <div className="p-2 rounded-lg bg-[#FEE2E2] text-[#DC2626] text-[10.5px] font-semibold">
                  {customRangeError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#71717A] mb-0.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full h-[32px] px-2 rounded-lg border border-[#D6D0C4] text-[11px] font-semibold text-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#71717A] mb-0.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full h-[32px] px-2 rounded-lg border border-[#D6D0C4] text-[11px] font-semibold text-[#191919]"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  className="h-[30px] px-3.5 rounded-xl bg-[#1E3A8A] text-white text-[11px] font-bold cursor-pointer"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty Gym Banner if Empty State is toggled */}
      {isEmptyState ? (
        <div className="bg-white rounded-2xl p-5 border border-[#EAE5DC] text-center space-y-1.5 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#191919]">
            Not enough data yet.
          </h3>
          <p className="text-[11.5px] text-[#71717A] max-w-xs mx-auto">
            Add members and record payments or attendance to view your gym performance insights.
          </p>
        </div>
      ) : (
        <>
          {/* Notice if selected custom period has zero transactions */}
          {!metrics.hasPeriodActivity && periodPreset === 'custom' && (
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-2.5 flex items-center justify-between gap-2 text-[#B45309]">
              <span className="text-[11px] font-semibold">
                No payments or new registrations recorded in this custom date range.
              </span>
              <button
                type="button"
                onClick={() => setPeriodPreset('this_month')}
                className="text-[10.5px] font-bold underline shrink-0 cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* 3. 2x2 BUSINESS SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* KPI 1: Total Revenue */}
            <button
              type="button"
              onClick={() => onSelectReportTab('revenue')}
              className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs hover:border-[#D6D0C4] transition-all text-left cursor-pointer flex items-start gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  Total Revenue
                </div>
                <div className="text-[17px] sm:text-[18px] font-extrabold text-[#191919] leading-tight mt-0.5">
                  ₹{metrics.totalRevenue.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  {metrics.revenueDeltaPct !== null ? (
                    <>
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          metrics.revenueDeltaPct >= 0
                            ? 'text-[#16A34A]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {metrics.revenueDeltaPct >= 0 ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : (
                          <TrendingDown className="w-2.5 h-2.5" />
                        )}
                        {metrics.revenueDeltaPct >= 0
                          ? `+${metrics.revenueDeltaPct}%`
                          : `${metrics.revenueDeltaPct}%`}
                      </span>
                      <span className="text-[9.5px] text-[#71717A]">
                        {periodBounds.comparisonLabel}
                      </span>
                    </>
                  ) : (
                    <span className="text-[9.5px] text-[#71717A]">
                      Collected in period
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* KPI 2: Active Members */}
            <button
              type="button"
              onClick={() => onSelectReportTab('membership')}
              className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs hover:border-[#D6D0C4] transition-all text-left cursor-pointer flex items-start gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  Active Members
                </div>
                <div className="text-[17px] sm:text-[18px] font-extrabold text-[#191919] leading-tight mt-0.5">
                  {metrics.activeMembers}
                </div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  {metrics.activeMembersDeltaPct !== null ? (
                    <>
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          metrics.activeMembersDeltaPct >= 0
                            ? 'text-[#16A34A]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        <TrendingUp className="w-2.5 h-2.5" />
                        {metrics.activeMembersDeltaPct >= 0
                          ? `+${metrics.activeMembersDeltaPct}%`
                          : `${metrics.activeMembersDeltaPct}%`}
                      </span>
                      <span className="text-[9.5px] text-[#71717A]">
                        vs last month
                      </span>
                    </>
                  ) : (
                    <span className="text-[9.5px] text-[#71717A]">
                      Valid memberships
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* KPI 3: New Members */}
            <button
              type="button"
              onClick={() => onSelectReportTab('membership')}
              className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs hover:border-[#D6D0C4] transition-all text-left cursor-pointer flex items-start gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  New Members
                </div>
                <div className="text-[17px] sm:text-[18px] font-extrabold text-[#191919] leading-tight mt-0.5">
                  {metrics.newMembers}
                </div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  {metrics.newMembersDeltaPct !== null ? (
                    <>
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          metrics.newMembersDeltaPct >= 0
                            ? 'text-[#16A34A]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {metrics.newMembersDeltaPct >= 0 ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : (
                          <TrendingDown className="w-2.5 h-2.5" />
                        )}
                        {metrics.newMembersDeltaPct >= 0
                          ? `+${metrics.newMembersDeltaPct}%`
                          : `${metrics.newMembersDeltaPct}%`}
                      </span>
                      <span className="text-[9.5px] text-[#71717A]">
                        {periodBounds.comparisonLabel}
                      </span>
                    </>
                  ) : (
                    <span className="text-[9.5px] text-[#71717A]">
                      Joined in period
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* KPI 4: Pending Payments */}
            <button
              type="button"
              onClick={onOpenPaymentsScreen}
              className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs hover:border-[#D6D0C4] transition-all text-left cursor-pointer flex items-start gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                <IndianRupee className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  Pending Payments
                </div>
                <div className="text-[17px] sm:text-[18px] font-extrabold text-[#191919] leading-tight mt-0.5">
                  ₹{metrics.pendingPaymentsTotal.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-bold text-[#DC2626]">
                    {metrics.pendingMembersCount}{' '}
                    {metrics.pendingMembersCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="text-[9.5px] text-[#71717A]">
                    outstanding dues
                  </span>
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* 4. DETAILED REPORT DIRECTORY CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div>
          <h2 className="text-[15px] font-bold text-[#191919] leading-tight">
            Reports
          </h2>
          <p className="text-[11px] font-medium text-[#71717A] mt-0.5">
            View detailed reports and analytics.
          </p>
        </div>

        <div className="space-y-2">
          {reportRows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={row.onClick}
              className="w-full p-2.5 rounded-xl border border-[#F2EFE8] bg-[#FAF8F5]/70 hover:bg-[#F4F1EA] hover:border-[#E5E0D6] flex items-center justify-between gap-2.5 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${row.iconBg} flex items-center justify-center shrink-0`}
                >
                  {row.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-[#191919] truncate">
                    {row.title}
                  </div>
                  <div className="text-[10.5px] font-medium text-[#71717A] truncate mt-0.5">
                    {row.description}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#52525B] shrink-0" />
            </button>
          ))}
        </div>

        {/* Bottom Tip Box inside Reports Card */}
        <div className="mt-2 p-2.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11.5px] font-bold text-[#1E3A8A] leading-tight">
              Tip
            </div>
            <p className="text-[10.5px] font-medium text-[#475569] mt-0.5 leading-snug">
              Use the date range to view reports for a specific period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
