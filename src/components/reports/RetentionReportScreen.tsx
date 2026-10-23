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
  Users,
  TrendingDown,
  AlertTriangle,
  Clock,
  Phone,
  MessageCircle,
  Check,
} from 'lucide-react';
import { Member, RenewalRecord } from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';
import { ReportDateRangePreset } from './RevenueReportScreen';

export type ReportTabType =
  | 'overview'
  | 'complaints'
  | 'revenue'
  | 'membership'
  | 'retention'
  | 'staff'
  | 'staff_permissions'
  | 'support'
  | 'gym_settings'
  | 'notifications';

interface RetentionReportScreenProps {
  members: Member[];
  renewals: RenewalRecord[];
  isEmptyState?: boolean;
  onBack: () => void;
  onSelectReportTab: (tab: ReportTabType) => void;
  onOpenFollowUpsScreen: () => void;
  onOpenMembersDirectory: () => void;
  onOpenRecordPayment: (memberId?: string) => void;
  onOpenRenewModal: (memberId: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
}

import { getTodayIso, computeDynamicDateBounds } from '../../utils/dateUtils';

const REPORT_TODAY = getTodayIso();

function getRetentionDateBounds(
  preset: ReportDateRangePreset,
  customStart: string,
  customEnd: string
) {
  return computeDynamicDateBounds(preset, customStart, customEnd);
}

function reconcilePercentages<T extends { count: number }>(
  items: T[],
  total: number
): Array<T & { percentage: number }> {
  if (total <= 0 || items.length === 0) {
    return items.map((item) => ({ ...item, percentage: 0 }));
  }
  const raw = items.map((item) => (item.count / total) * 100);
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

export const RetentionReportScreen: React.FC<RetentionReportScreenProps> = ({
  members,
  renewals,
  isEmptyState = false,
  onBack,
  onSelectReportTab,
  onOpenFollowUpsScreen,
  onOpenMembersDirectory,
  onOpenRecordPayment,
  onOpenRenewModal,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
}) => {
  const [rangePreset, setRangePreset] = useState<ReportDateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState(() => {
    const now = new Date();
    return getTodayIso(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [customEnd, setCustomEnd] = useState(() => getTodayIso());
  const [customDateError, setCustomDateError] = useState<string | null>(null);
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);
  const [trendHorizon, setTrendHorizon] = useState<'6m' | '3m'>('6m');
  const [exportToast, setExportToast] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const effectiveMembers = isEmptyState ? [] : members;
  const effectiveRenewals = isEmptyState ? [] : renewals;

  const bounds = useMemo(
    () => getRetentionDateBounds(rangePreset, customStart, customEnd),
    [rangePreset, customStart, customEnd]
  );

  // Lost members in the selected period:
  // Members whose membership expired/ended without renewal (`status === 'expired'`) and whose lostDate or expiry falls in the period (or all expired if viewing overall)
  const lostMembersInPeriod = useMemo(() => {
    return effectiveMembers.filter((m) => {
      if (m.status !== 'expired' && m.daysUntilExpiry >= 0) return false;
      if (m.lostDate) {
        return m.lostDate >= bounds.startDate && m.lostDate <= bounds.endDate;
      }
      return true;
    });
  }, [effectiveMembers, bounds]);

  const prevLostMembers = useMemo(() => {
    return effectiveMembers.filter((m) => {
      if (m.status !== 'expired' && m.daysUntilExpiry >= 0) return false;
      if (m.lostDate) {
        return m.lostDate >= bounds.prevStartDate && m.lostDate <= bounds.prevEndDate;
      }
      return false;
    });
  }, [effectiveMembers, bounds]);

  // Unique At-Risk Members (non-expired members who meet at least one warning signal):
  // 1. Inactive (valid membership, no visit in 14+ days)
  // 2. Expiring Soon (valid membership expiring within 7 days)
  // 3. Low Attendance (valid membership, 5–13 days absent or visitsThisMonth <= 4)
  const atRiskMembers = useMemo(() => {
    const list: Array<{
      member: Member;
      riskType: 'Inactive' | 'Expiring Soon' | 'Low Attendance';
      urgencyScore: number;
    }> = [];

    effectiveMembers.forEach((m) => {
      // Do not classify already-expired/lost members as At-Risk
      if (m.status === 'expired' || m.daysUntilExpiry < 0) return;

      if (m.daysSinceLastVisit >= 14 || m.status === 'inactive') {
        list.push({
          member: m,
          riskType: 'Inactive',
          urgencyScore: 300 + m.daysSinceLastVisit,
        });
      } else if (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7) {
        list.push({
          member: m,
          riskType: 'Expiring Soon',
          urgencyScore: 200 + (7 - m.daysUntilExpiry),
        });
      } else if (m.daysSinceLastVisit >= 3 && (m.visitsThisMonth || 0) <= 14) {
        list.push({
          member: m,
          riskType: 'Low Attendance',
          urgencyScore: 100 + m.daysSinceLastVisit,
        });
      }
    });

    return list.sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [effectiveMembers]);

  // Inactive Members (valid membership, no visit in 14+ days — never confused with expired)
  const inactiveValidMembers = useMemo(() => {
    return effectiveMembers.filter(
      (m) =>
        m.status !== 'expired' &&
        m.daysUntilExpiry >= 0 &&
        (m.daysSinceLastVisit >= 14 || m.status === 'inactive')
    );
  }, [effectiveMembers]);

  // Retention KPI calculations
  // Retention Rate = Retained Valid Memberships ÷ Total Eligible Memberships in Period × 100
  const kpis = useMemo(() => {
    const eligibleMembers = effectiveMembers.filter(
      (m) => !m.startDate || m.startDate <= bounds.endDate
    );
    const retainedMembers = eligibleMembers.filter(
      (m) => m.status !== 'expired' && m.daysUntilExpiry >= 0
    );

    const retentionRate =
      eligibleMembers.length > 0
        ? Math.round((retainedMembers.length / eligibleMembers.length) * 100)
        : 0;

    // Previous period retention rate for comparison
    const prevEligible = effectiveMembers.filter(
      (m) => !m.startDate || m.startDate <= bounds.prevEndDate
    );
    const prevRetained = prevEligible.filter(
      (m) => !m.lostDate || m.lostDate > bounds.prevEndDate
    );
    const prevRetentionRate =
      prevEligible.length > 0
        ? Math.round((prevRetained.length / prevEligible.length) * 100)
        : null;

    const rateDiff =
      prevRetentionRate !== null ? retentionRate - prevRetentionRate : null;

    return {
      retentionRate,
      rateDiff,
      lostCount: lostMembersInPeriod.length,
      prevLostCount: prevLostMembers.length,
      atRiskCount: atRiskMembers.length,
      inactiveCount: inactiveValidMembers.length,
    };
  }, [
    effectiveMembers,
    bounds,
    lostMembersInPeriod,
    prevLostMembers,
    atRiskMembers,
    inactiveValidMembers,
  ]);

  // Retention Trend Combo Chart Data (Last 6 Months or Last 3 Months)
  const retentionTrendSeries = useMemo(() => {
    const now = new Date();
    const months: Array<{ prefix: string; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      months.push({ prefix, label });
    }
    const selectedMonths = trendHorizon === '3m' ? months.slice(3) : months;

    return selectedMonths.map((m) => {
      const enrolledByMonth = effectiveMembers.filter(
        (mem) => !mem.startDate || mem.startDate.slice(0, 7) <= m.prefix
      );
      const lostByMonth = enrolledByMonth.filter(
        (mem) => mem.lostDate && mem.lostDate.slice(0, 7) <= m.prefix
      );
      const activeInMonth = Math.max(0, enrolledByMonth.length - lostByMonth.length);
      const rate =
        enrolledByMonth.length > 0
          ? Math.round((activeInMonth / enrolledByMonth.length) * 100)
          : 0;

      return {
        label: m.label,
        activeMembers: activeInMonth,
        retentionRate: rate,
      };
    });
  }, [effectiveMembers, trendHorizon]);

  // Member Status Distribution Donut Data
  const statusDistribution = useMemo(() => {
    let activeRegular = 0;
    let atRisk = 0;
    let expired = 0;
    let inactive = 0;
    let pendingBalance = 0;

    effectiveMembers.forEach((m) => {
      if (m.status === 'expired' || m.daysUntilExpiry < 0) {
        expired++;
      } else if (m.daysSinceLastVisit >= 14 || m.status === 'inactive') {
        inactive++;
      } else if (
        (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7) ||
        m.daysSinceLastVisit >= 3
      ) {
        atRisk++;
      } else if (m.status === 'pending') {
        pendingBalance++;
      } else {
        activeRegular++;
      }
    });

    const items = [
      { label: 'Active', count: activeRegular, color: '#22C55E' },
      { label: 'At Risk', count: atRisk, color: '#F59E0B' },
      { label: 'Expired', count: expired, color: '#EF4444' },
      { label: 'Inactive', count: inactive, color: '#3B82F6' },
      { label: 'Others', count: pendingBalance, color: '#9CA3AF' },
    ].filter((i) => i.count > 0);

    return reconcilePercentages(items, effectiveMembers.length);
  }, [effectiveMembers]);

  // Reasons for Leaving Donut Data (from actual recorded leavingReason on expired/lost members)
  const leavingReasonsBreakdown = useMemo(() => {
    const allLostWithReasons = effectiveMembers.filter(
      (m) => (m.status === 'expired' || m.daysUntilExpiry < 0) && m.leavingReason
    );

    const reasonColors: Record<string, string> = {
      'Membership Expired': '#EF4444',
      'Personal Reasons': '#F59E0B',
      'Financial Issues': '#3B82F6',
      'Moved Away': '#8B5CF6',
      Other: '#9CA3AF',
    };

    const grouped: Record<string, number> = {};
    allLostWithReasons.forEach((m) => {
      const r = m.leavingReason || 'Membership Expired';
      grouped[r] = (grouped[r] || 0) + 1;
    });

    const items = Object.entries(grouped)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({
        label,
        count,
        color: reasonColors[label] || '#9CA3AF',
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLostWithReasons: allLostWithReasons.length,
      slices: reconcilePercentages(items, allLostWithReasons.length),
    };
  }, [effectiveMembers]);

  // Export CSV
  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Gym Business OS - Member Retention Report'],
      ['Reporting Period', bounds.label],
      ['Retention Rate', `${kpis.retentionRate}%`],
      ['Members Lost in Period', String(kpis.lostCount)],
      ['At-Risk Members', String(kpis.atRiskCount)],
      ['Inactive Members (14+ Days Absent)', String(kpis.inactiveCount)],
      [],
      ['At-Risk Members List'],
      ['Member Code', 'Member Name', 'Plan', 'Last Visit', 'Days Absent', 'Risk Warning'],
      ...atRiskMembers.map(({ member, riskType }) => [
        member.memberCode || member.id,
        member.name,
        member.membershipPlan,
        member.lastVisitDate,
        String(member.daysSinceLastVisit),
        riskType,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `retention_report_${bounds.startDate}_to_${bounds.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`Exported Retention Report (${bounds.label})`);
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

  // Helper to render SVG Donut
  const renderDonut = (
    slices: Array<{ label: string; count: number; percentage: number; color: string }>,
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
          <span className="text-[13px] font-extrabold text-[#191919] leading-none">
            {centerValue}
          </span>
          <span className="text-[8.5px] font-medium text-[#71717A] leading-tight mt-0.5">
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
              Retention Report
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Understand member retention and reduce churn.
            </p>
          </div>
        </div>
      </div>

      {/* REPORT SWITCHER PILLS */}
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
          const isActive = t.id === 'retention';
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

      {/* 3. RETENTION KPI CARDS (2×2 GRID) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card A: Retention Rate */}
        <button
          type="button"
          onClick={onOpenMembersDirectory}
          className="text-left rounded-2xl p-3 bg-[#F0FDF4]/90 border border-[#DCFCE7] hover:border-[#BBF7D0] shadow-2xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                Retention Rate
              </span>
              <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {effectiveMembers.length > 0 ? `${kpis.retentionRate}%` : '—'}
              </div>
              <div className="text-[10px] font-semibold text-[#16A34A] mt-0.5 truncate">
                {kpis.rateDiff !== null && effectiveMembers.length > 0 ? (
                  <span>
                    {kpis.rateDiff >= 0 ? `+${kpis.rateDiff}%` : `${kpis.rateDiff}%`} vs prev
                    period
                  </span>
                ) : (
                  <span>Active vs enrolled</span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>

        {/* Card B: Members Lost */}
        <button
          type="button"
          onClick={onOpenFollowUpsScreen}
          className="text-left rounded-2xl p-3 bg-[#FEF2F2]/90 border border-[#FECACA] hover:border-[#FCA5A5] shadow-2xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                Members Lost
              </span>
              <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {kpis.lostCount}
              </div>
              <div className="text-[10px] font-semibold text-[#DC2626] mt-0.5 truncate">
                Expired / ended in period
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>

        {/* Card C: At-Risk Members */}
        <button
          type="button"
          onClick={onOpenFollowUpsScreen}
          className="text-left rounded-2xl p-3 bg-[#FFFBEB]/90 border border-[#FDE68A] hover:border-[#FCD34D] shadow-2xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                At-Risk Members
              </span>
              <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {kpis.atRiskCount}
              </div>
              <div className="text-[10px] font-semibold text-[#D97706] mt-0.5 truncate">
                Needs attention
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>

        {/* Card D: Inactive Members */}
        <button
          type="button"
          onClick={onOpenFollowUpsScreen}
          className="text-left rounded-2xl p-3 bg-[#EFF6FF]/90 border border-[#DBEAFE] hover:border-[#BFDBFE] shadow-2xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                Inactive Members
              </span>
              <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {kpis.inactiveCount}
              </div>
              <div className="text-[10px] font-semibold text-[#52525B] mt-0.5 truncate">
                No visit in 14+ days
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>
      </div>

      {/* 4. RETENTION TREND COMBO CHART */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-bold text-[#191919]">Retention Trend</h2>

          <button
            type="button"
            onClick={() => setTrendHorizon((prev) => (prev === '6m' ? '3m' : '6m'))}
            className="h-[26px] px-2.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] text-[#191919] text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{trendHorizon === '6m' ? 'Last 6 Months' : 'Last 3 Months'}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10.5px] font-semibold text-[#52525B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>Retention Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span>Active Members</span>
          </div>
        </div>

        {effectiveMembers.length === 0 ? (
          <div className="py-6 text-center text-[#71717A]">
            <p className="text-[12px] font-bold text-[#191919]">Not enough data yet.</p>
            <p className="text-[10.5px] mt-0.5">
              Add members and track visits to view retention trends over time.
            </p>
          </div>
        ) : (
          <div className="pt-1">
            <div className="flex gap-2">
              {/* Y-Axis Ticks */}
              <div className="flex flex-col justify-between text-[9.5px] font-medium text-[#71717A] h-28 pb-3 shrink-0 text-right w-7">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              <div className="flex-1">
                {(() => {
                  const width = 280;
                  const height = 100;
                  const padX = 18;
                  const padY = 8;
                  const plotW = width - padX * 2;
                  const plotH = height - padY * 2;
                  const maxActive = Math.max(
                    ...retentionTrendSeries.map((s) => s.activeMembers),
                    15
                  );

                  const getX = (i: number) =>
                    retentionTrendSeries.length === 1
                      ? width / 2
                      : padX + (i / (retentionTrendSeries.length - 1)) * plotW;
                  const getYRate = (pct: number) => padY + plotH - (pct / 100) * plotH;

                  const linePoints = retentionTrendSeries
                    .map((s, i) => `${getX(i)},${getYRate(s.retentionRate)}`)
                    .join(' ');
                  const areaPoints = `${getX(0)},${padY + plotH} ${linePoints} ${getX(
                    retentionTrendSeries.length - 1
                  )},${padY + plotH}`;

                  return (
                    <>
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-28 overflow-visible"
                      >
                        <defs>
                          <linearGradient id="retAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                          const y = padY + t * plotH;
                          return (
                            <line
                              key={t}
                              x1={0}
                              y1={y}
                              x2={width}
                              y2={y}
                              stroke="#F2EFE8"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Soft Blue Active Member Bars */}
                        {retentionTrendSeries.map((s, i) => {
                          const barH = (s.activeMembers / maxActive) * (plotH * 0.75);
                          const barX = getX(i) - 9;
                          const barY = padY + plotH - barH;
                          return (
                            <rect
                              key={s.label}
                              x={barX}
                              y={barY}
                              width="18"
                              height={Math.max(4, barH)}
                              rx="2"
                              fill="#93C5FD"
                              fillOpacity="0.65"
                            />
                          );
                        })}

                        {/* Retention Rate Area & Line */}
                        <polygon points={areaPoints} fill="url(#retAreaGrad)" />
                        <polyline
                          fill="none"
                          stroke="#16A34A"
                          strokeWidth="2"
                          points={linePoints}
                        />

                        {retentionTrendSeries.map((s, i) => (
                          <circle
                            key={s.label}
                            cx={getX(i)}
                            cy={getYRate(s.retentionRate)}
                            r="3"
                            fill="#16A34A"
                            stroke="#FFFFFF"
                            strokeWidth="1.2"
                          />
                        ))}
                      </svg>

                      <div className="flex items-center justify-between px-2 pt-0.5">
                        {retentionTrendSeries.map((s) => (
                          <span
                            key={s.label}
                            className="text-[9.5px] font-medium text-[#71717A] text-center"
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. SIDE-BY-SIDE BREAKDOWN CARDS: STATUS DISTRIBUTION & REASONS FOR LEAVING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Left Card: Member Status Distribution */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <h3 className="text-[12.5px] font-bold text-[#191919]">
            Member Status Distribution
          </h3>

          {effectiveMembers.length === 0 ? (
            <div className="py-5 text-center text-[11px] text-[#71717A]">
              No member records yet.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              {renderDonut(
                statusDistribution,
                String(effectiveMembers.length),
                'Total Members'
              )}

              <div className="flex-1 space-y-1.5 min-w-0">
                {statusDistribution.map((item) => (
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

        {/* Right Card: Reasons for Leaving */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <h3 className="text-[12.5px] font-bold text-[#191919]">Reasons for Leaving</h3>

          {leavingReasonsBreakdown.slices.length === 0 ? (
            <div className="py-5 text-center text-[11px] text-[#71717A]">
              No recorded leaving reasons yet.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              {renderDonut(
                leavingReasonsBreakdown.slices,
                String(leavingReasonsBreakdown.totalLostWithReasons),
                'Members Lost'
              )}

              <div className="flex-1 space-y-1.5 min-w-0">
                {leavingReasonsBreakdown.slices.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-1 text-[10.5px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#52525B] font-medium leading-tight truncate">
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

      {/* 6. AT-RISK MEMBERS LIST */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13.5px] font-bold text-[#191919]">
            At-Risk Members ({atRiskMembers.length})
          </h2>
          <button
            type="button"
            onClick={onOpenFollowUpsScreen}
            className="text-[11.5px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {atRiskMembers.length === 0 ? (
          <div className="py-5 text-center text-[#71717A] space-y-1">
            <p className="text-[12px] font-bold text-[#191919]">
              No at-risk members right now
            </p>
            <p className="text-[11px]">
              All active members are attending regularly and up to date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE8]">
            {atRiskMembers.slice(0, 6).map(({ member, riskType }) => {
              const cleanPhone = member.phone.replace(/[^0-9]/g, '');
              const waLink = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                `Hi ${member.name}, checking in from MuscleFit Gym! Let us know how your workouts are going.`
              )}`;

              const badgeStyle =
                riskType === 'Inactive'
                  ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                  : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className="py-2.5 first:pt-1 last:pb-0.5 flex items-center justify-between gap-2 hover:bg-[#FBF9F5] rounded-xl px-1 transition-colors cursor-pointer"
                >
                  {/* Left: Avatar + Name + Plan */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#E5E0D6] shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#1E3A8A] font-bold text-[11.5px] flex items-center justify-center shrink-0">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-bold text-[#191919] break-words leading-tight">
                        {member.name}
                      </div>
                      <div className="text-[10.5px] font-medium text-[#71717A] truncate">
                        {member.membershipPlan}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Last Visit Info */}
                  <div className="text-left shrink-0 hidden xs:block sm:block px-1.5">
                    <div className="text-[10px] text-[#71717A]">Last visit</div>
                    <div className="text-[11px] font-semibold text-[#52525B]">
                      {member.daysSinceLastVisit === 0
                        ? 'Today'
                        : `${member.daysSinceLastVisit} days ago`}
                    </div>
                  </div>

                  {/* Warning Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeStyle}`}
                  >
                    {riskType}
                  </span>

                  {/* Right: Call, WhatsApp & Chevron */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`tel:${cleanPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center transition-colors"
                      aria-label={`Call ${member.name}`}
                      title={`Call ${member.name}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center transition-colors"
                      aria-label={`WhatsApp ${member.name}`}
                      title={`WhatsApp ${member.name}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
