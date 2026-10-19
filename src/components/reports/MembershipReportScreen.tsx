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
  UserPlus,
  Clock,
  RefreshCw,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  Member,
  MembershipPlan,
  RenewalRecord,
  MonthlyMetric,
} from '../../types/dashboard';
import { MemberDetailView } from '../members/MemberDetailView';
import { ReportDateRangePreset } from './RevenueReportScreen';

interface MembershipReportScreenProps {
  members: Member[];
  plans: MembershipPlan[];
  renewals: RenewalRecord[];
  monthlyMetrics: MonthlyMetric[];
  isEmptyState?: boolean;
  onBack: () => void;
  onSwitchToRevenueReport: () => void;
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
  onOpenRenewalsScreen: () => void;
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

function getMembershipDateBounds(
  preset: ReportDateRangePreset,
  customStart: string,
  customEnd: string
) {
  return computeDynamicDateBounds(preset, customStart, customEnd);
}

function reconcileStatusPercentages<T extends { count: number }>(
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

export const MembershipReportScreen: React.FC<MembershipReportScreenProps> = ({
  members,
  plans,
  renewals,
  monthlyMetrics,
  isEmptyState = false,
  onBack,
  onSwitchToRevenueReport,
  onSelectReportTab,
  onOpenRenewalsScreen,
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
  const [growthHorizon, setGrowthHorizon] = useState<'6m' | '3m'>('6m');
  const [exportToast, setExportToast] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const effectiveMembers = isEmptyState ? [] : members;
  const effectivePlans = isEmptyState ? [] : plans;
  const effectiveRenewals = isEmptyState ? [] : renewals;

  const bounds = useMemo(
    () => getMembershipDateBounds(rangePreset, customStart, customEnd),
    [rangePreset, customStart, customEnd]
  );

  // Completed renewals in the selected period
  const periodRenewals = useMemo(() => {
    return effectiveRenewals.filter(
      (r) =>
        r.status === 'completed' &&
        r.renewedAt >= bounds.startDate &&
        r.renewedAt <= bounds.endDate
    );
  }, [effectiveRenewals, bounds]);

  const prevPeriodRenewals = useMemo(() => {
    return effectiveRenewals.filter(
      (r) =>
        r.status === 'completed' &&
        r.renewedAt >= bounds.prevStartDate &&
        r.renewedAt <= bounds.prevEndDate
    );
  }, [effectiveRenewals, bounds]);

  // New memberships started in the selected period (excluding renewals so renewals are not double-counted as new members)
  const newMembershipsInPeriod = useMemo(() => {
    return effectiveMembers.filter((m) => {
      if (!m.startDate) return false;
      const inRange = m.startDate >= bounds.startDate && m.startDate <= bounds.endDate;
      if (!inRange) return false;
      // Exclude if this start date was actually a renewal in `renewals`
      const isRenewalStart = effectiveRenewals.some(
        (r) => r.memberId === m.id && r.renewedAt === m.startDate && r.status === 'completed'
      );
      return !isRenewalStart && !m.lastRenewedDate;
    });
  }, [effectiveMembers, effectiveRenewals, bounds]);

  const prevPeriodNewMemberships = useMemo(() => {
    return effectiveMembers.filter((m) => {
      if (!m.startDate) return false;
      const inRange =
        m.startDate >= bounds.prevStartDate && m.startDate <= bounds.prevEndDate;
      if (!inRange) return false;
      const isRenewalStart = effectiveRenewals.some(
        (r) => r.memberId === m.id && r.renewedAt === m.startDate && r.status === 'completed'
      );
      return !isRenewalStart;
    });
  }, [effectiveMembers, effectiveRenewals, bounds]);

  // Upcoming expiries within 30 days (excludes already expired memberships)
  const upcomingExpiries = useMemo(() => {
    return effectiveMembers
      .filter(
        (m) =>
          m.status !== 'expired' &&
          m.daysUntilExpiry >= 0 &&
          m.daysUntilExpiry <= 30
      )
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [effectiveMembers]);

  // Valid Active Memberships as of reporting date
  const validActiveMemberships = useMemo(() => {
    return effectiveMembers.filter(
      (m) =>
        m.status !== 'expired' &&
        m.status !== 'inactive' &&
        m.daysUntilExpiry >= 0
    );
  }, [effectiveMembers]);

  // KPI summary & Renewal Rate calculation
  // Renewal Rate = eligible memberships renewed during period ÷ memberships eligible for renewal during period × 100
  const kpis = useMemo(() => {
    const activeCount = validActiveMemberships.length;
    const newCount = newMembershipsInPeriod.length;
    const prevNewCount = prevPeriodNewMemberships.length;
    const expiringSoonCount = upcomingExpiries.length;
    const renewalsCount = periodRenewals.length;
    const prevRenewalsCount = prevPeriodRenewals.length;

    // Eligible for renewal = completed renewals in period + currently expiring within 30d + expired
    const expiredCount = effectiveMembers.filter(
      (m) => m.status === 'expired' || m.daysUntilExpiry < 0
    ).length;
    const eligibleForRenewal = renewalsCount + expiringSoonCount + expiredCount;
    const renewalRate =
      eligibleForRenewal > 0
        ? Math.round((renewalsCount / eligibleForRenewal) * 100)
        : null;

    const newChangePct =
      prevNewCount > 0
        ? Math.round(((newCount - prevNewCount) / prevNewCount) * 100)
        : null;

    const renewalsChangePct =
      prevRenewalsCount > 0
        ? Math.round(((renewalsCount - prevRenewalsCount) / prevRenewalsCount) * 100)
        : null;

    return {
      activeCount,
      newCount,
      expiringSoonCount,
      renewalsCount,
      renewalRate,
      eligibleForRenewal,
      newChangePct,
      renewalsChangePct,
    };
  }, [
    validActiveMemberships,
    newMembershipsInPeriod,
    prevPeriodNewMemberships,
    upcomingExpiries,
    periodRenewals,
    prevPeriodRenewals,
    effectiveMembers,
  ]);

  // Membership Growth Multi-Series Data (Last 6 Months or Last 3 Months)
  const growthSeries = useMemo(() => {
    const now = new Date();
    const count = growthHorizon === '3m' ? 3 : 6;
    const sliceMonths: Array<{ prefix: string; label: string }> = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      sliceMonths.push({ prefix, label });
    }

    return sliceMonths.map((m) => {
      // Valid memberships active by end of that month
      const validByMonth = effectiveMembers.filter((mem) => {
        const startedBeforeOrDuring =
          !mem.startDate || mem.startDate.slice(0, 7) <= m.prefix;
        return startedBeforeOrDuring && mem.status !== 'expired';
      }).length;

      // New memberships started in that month (excluding renewals)
      const newInMonth = effectiveMembers.filter((mem) => {
        if (!mem.startDate || !mem.startDate.startsWith(m.prefix)) return false;
        const isRen = effectiveRenewals.some(
          (r) => r.memberId === mem.id && r.renewedAt.startsWith(m.prefix)
        );
        return !isRen;
      }).length;

      // Completed renewals in that month
      const renewalsInMonth = effectiveRenewals.filter(
        (r) => r.status === 'completed' && r.renewedAt.startsWith(m.prefix)
      ).length;

      return {
        label: m.label,
        totalValid: validByMonth,
        newMembers: newInMonth,
        renewals: renewalsInMonth,
      };
    });
  }, [effectiveMembers, effectiveRenewals, growthHorizon]);

  // Membership Status Breakdown (Donut + Legend)
  const statusBreakdown = useMemo(() => {
    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let pausedCount = 0;
    let pendingFeeCount = 0;

    effectiveMembers.forEach((m) => {
      if (m.status === 'expired' || m.daysUntilExpiry < 0) {
        expiredCount++;
      } else if (m.status === 'inactive') {
        pausedCount++;
      } else if (m.status === 'expiring' || (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7)) {
        expiringSoonCount++;
      } else if (m.status === 'pending') {
        pendingFeeCount++;
      } else {
        activeCount++;
      }
    });

    const rawItems = [
      { label: 'Active', count: activeCount, color: '#22C55E' },
      { label: 'Expiring Soon', count: expiringSoonCount, color: '#F59E0B' },
      { label: 'Expired', count: expiredCount, color: '#EF4444' },
      { label: 'Paused / Inactive', count: pausedCount, color: '#3B82F6' },
      { label: 'Payment Due', count: pendingFeeCount, color: '#9CA3AF' },
    ].filter((item) => item.count > 0);

    return reconcileStatusPercentages(rawItems, effectiveMembers.length);
  }, [effectiveMembers]);

  // Membership Plan Popularity (Ranked by actual member counts)
  const planPopularity = useMemo(() => {
    const countsByPlan: Record<string, number> = {};
    effectivePlans.forEach((p) => {
      countsByPlan[p.name] = 0;
    });
    effectiveMembers.forEach((m) => {
      const planName = m.membershipPlan || 'Monthly Plan';
      countsByPlan[planName] = (countsByPlan[planName] || 0) + 1;
    });

    const barColors = ['#2563EB', '#8B5CF6', '#F59E0B', '#22C55E', '#64748B'];

    const sorted = Object.entries(countsByPlan)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const maxPlanCount = Math.max(...sorted.map(([, c]) => c), 1);

    return sorted.slice(0, 5).map(([name, count], idx) => ({
      name,
      count,
      barPct: Math.round((count / maxPlanCount) * 100),
      color: barColors[idx % barColors.length],
    }));
  }, [effectivePlans, effectiveMembers]);

  // Export CSV
  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Gym Business OS - Membership & Renewal Report'],
      ['Reporting Period', bounds.label],
      ['Active Valid Memberships', String(kpis.activeCount)],
      ['New Memberships Started', String(kpis.newCount)],
      ['Expiring Soon (Within 30 Days)', String(kpis.expiringSoonCount)],
      ['Renewals Completed', String(kpis.renewalsCount)],
      [
        'Renewal Rate',
        kpis.renewalRate !== null ? `${kpis.renewalRate}%` : 'Unavailable',
      ],
      [],
      ['Upcoming Expiries (Next 30 Days)'],
      ['Member ID', 'Member Name', 'Plan', 'Expiry Date', 'Days Remaining', 'Status'],
      ...upcomingExpiries.map((m) => [
        m.memberCode || m.id,
        m.name,
        m.membershipPlan,
        m.expiryDate,
        String(m.daysUntilExpiry),
        m.status,
      ]),
      [],
      ['Completed Renewals in Period'],
      ['Date', 'Member Name', 'Previous Plan', 'New Plan', 'New Expiry', 'Paid Amount'],
      ...periodRenewals.map((r) => [
        r.renewedAt,
        r.memberName,
        r.previousPlan,
        r.newPlan,
        r.newExpiryDate,
        String(r.paidAmount),
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
      `membership_renewal_report_${bounds.startDate}_to_${bounds.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`Exported Membership Report (${bounds.label})`);
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

  // Helper to build SVG polyline points for Membership Growth chart
  const renderGrowthSvg = () => {
    if (effectiveMembers.length === 0 || growthSeries.length === 0) {
      return (
        <div className="py-6 text-center text-[#71717A]">
          <p className="text-[12px] font-bold text-[#191919]">Not enough data yet.</p>
          <p className="text-[10.5px] mt-0.5">
            Add members and record renewals to view membership growth over time.
          </p>
        </div>
      );
    }

    const maxY = Math.max(
      ...growthSeries.map((s) => Math.max(s.totalValid, s.newMembers, s.renewals)),
      16
    );
    const ceilY = Math.ceil(maxY / 5) * 5;
    const width = 280;
    const height = 100;
    const padX = 14;
    const padY = 10;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const getX = (i: number) =>
      growthSeries.length === 1
        ? width / 2
        : padX + (i / (growthSeries.length - 1)) * plotW;
    const getY = (val: number) => padY + plotH - (val / ceilY) * plotH;

    const totalPoints = growthSeries.map((s, i) => `${getX(i)},${getY(s.totalValid)}`).join(' ');
    const newPoints = growthSeries.map((s, i) => `${getX(i)},${getY(s.newMembers)}`).join(' ');
    const renPoints = growthSeries.map((s, i) => `${getX(i)},${getY(s.renewals)}`).join(' ');

    const areaPoints = `${getX(0)},${padY + plotH} ${totalPoints} ${getX(
      growthSeries.length - 1
    )},${padY + plotH}`;

    return (
      <div className="pt-1">
        <div className="flex gap-2">
          {/* Y-Axis Ticks */}
          <div className="flex flex-col justify-between text-[9.5px] font-medium text-[#71717A] h-28 pb-3 shrink-0 text-right w-6">
            <span>{ceilY}</span>
            <span>{Math.round(ceilY * 0.75)}</span>
            <span>{Math.round(ceilY * 0.5)}</span>
            <span>{Math.round(ceilY * 0.25)}</span>
            <span>0</span>
          </div>

          <div className="flex-1">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
              <defs>
                <linearGradient id="validAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = padY + t * plotH;
                return (
                  <line
                    key={t}
                    x1={padX}
                    y1={y}
                    x2={width - padX}
                    y2={y}
                    stroke="#F2EFE8"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Area under Total Valid Members */}
              <polygon points={areaPoints} fill="url(#validAreaGrad)" />

              {/* Lines */}
              <polyline
                fill="none"
                stroke="#16A34A"
                strokeWidth="2"
                points={totalPoints}
              />
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="1.8"
                points={newPoints}
              />
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.8"
                points={renPoints}
              />

              {/* Dots */}
              {growthSeries.map((s, i) => (
                <g key={s.label}>
                  <circle
                    cx={getX(i)}
                    cy={getY(s.totalValid)}
                    r="2.8"
                    fill="#16A34A"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                  <circle
                    cx={getX(i)}
                    cy={getY(s.newMembers)}
                    r="2.5"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                  <circle
                    cx={getX(i)}
                    cy={getY(s.renewals)}
                    r="2.5"
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between px-2 pt-0.5">
              {growthSeries.map((s) => (
                <span
                  key={s.label}
                  className="text-[9.5px] font-medium text-[#71717A] text-center"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render Membership Status Donut SVG
  const renderStatusDonut = () => {
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
          {statusBreakdown.map((s) => {
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
            {effectiveMembers.length}
          </span>
          <span className="text-[8.5px] font-medium text-[#71717A] leading-tight mt-0.5">
            Total Members
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
            <h1 className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-tight">
              Membership & Renewal Report
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-0.5">
              Track memberships, renewals and member growth.
            </p>
          </div>
        </div>

        {/* Switch to Revenue Report */}
        <button
          type="button"
          onClick={onSwitchToRevenueReport}
          className="h-[28px] px-2.5 rounded-full bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E3A8A] text-[10.5px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          <span>Revenue</span>
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
            const isActive = t.id === 'membership';
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

      {/* 3. MEMBERSHIP KPI CARDS (2×2 GRID) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card A: Active Memberships */}
        <button
          type="button"
          onClick={onOpenMembersDirectory}
          className="text-left rounded-2xl p-3 bg-[#F0FDF4]/90 border border-[#DCFCE7] hover:border-[#BBF7D0] shadow-2xs flex items-start gap-2.5 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              Active Memberships
            </span>
            <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
              {kpis.activeCount}
            </div>
            <div className="text-[10px] font-semibold text-[#16A34A] mt-0.5 truncate">
              Valid as of 17 Oct
            </div>
          </div>
        </button>

        {/* Card B: New Memberships */}
        <div className="rounded-2xl p-3 bg-[#EFF6FF]/90 border border-[#DBEAFE] shadow-2xs flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              New Memberships
            </span>
            <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
              {kpis.newCount}
            </div>
            <div className="text-[10px] font-semibold text-[#16A34A] mt-0.5 truncate">
              {kpis.newChangePct !== null ? (
                <span>
                  {kpis.newChangePct >= 0 ? `+${kpis.newChangePct}%` : `${kpis.newChangePct}%`}{' '}
                  <span className="text-[#71717A] font-medium">vs prev period</span>
                </span>
              ) : (
                <span>Started in period</span>
              )}
            </div>
          </div>
        </div>

        {/* Card C: Expiring Soon */}
        <button
          type="button"
          onClick={onOpenRenewalsScreen}
          className="text-left rounded-2xl p-3 bg-[#FFFBEB]/90 border border-[#FDE68A] hover:border-[#FCD34D] shadow-2xs flex items-start gap-2.5 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              Expiring Soon
            </span>
            <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
              {kpis.expiringSoonCount}
            </div>
            <div className="text-[10px] font-semibold text-[#D97706] mt-0.5 truncate">
              Within 30 days
            </div>
          </div>
        </button>

        {/* Card D: Renewals Completed */}
        <button
          type="button"
          onClick={onOpenRenewalsScreen}
          className="text-left rounded-2xl p-3 bg-[#FAF5FF]/90 border border-[#F3E8FF] hover:border-[#E9D5FF] shadow-2xs flex items-start gap-2.5 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#52525B] block truncate">
              Renewals Completed
            </span>
            <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
              {kpis.renewalsCount}
            </div>
            <div className="text-[10px] font-semibold text-[#7C3AED] mt-0.5 truncate">
              {kpis.renewalRate !== null
                ? `${kpis.renewalRate}% renewal rate`
                : 'Completed in period'}
            </div>
          </div>
        </button>
      </div>

      {/* 4. MEMBERSHIP GROWTH CHART */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-bold text-[#191919]">Membership Growth</h2>

          <button
            type="button"
            onClick={() => setGrowthHorizon((prev) => (prev === '6m' ? '3m' : '6m'))}
            className="h-[26px] px-2.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] text-[#191919] text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{growthHorizon === '6m' ? 'Last 6 Months' : 'Last 3 Months'}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 text-[10.5px] font-semibold text-[#52525B]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>Total Members</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span>New Members</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Renewals</span>
          </div>
        </div>

        {renderGrowthSvg()}
      </div>

      {/* 5. SIDE-BY-SIDE BREAKDOWN CARDS: MEMBERSHIP STATUS & TOP PLANS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Left Card: Membership Status */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <h3 className="text-[12.5px] font-bold text-[#191919]">Membership Status</h3>

          {effectiveMembers.length === 0 ? (
            <div className="py-5 text-center text-[11px] text-[#71717A]">
              No member records yet.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5">
              {renderStatusDonut()}

              <div className="flex-1 space-y-1.5 min-w-0">
                {statusBreakdown.map((item) => (
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

        {/* Right Card: Top Membership Plans */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <h3 className="text-[12.5px] font-bold text-[#191919]">Top Membership Plans</h3>

          {planPopularity.length === 0 ? (
            <div className="py-5 text-center text-[11px] text-[#71717A]">
              No active membership plans.
            </div>
          ) : (
            <div className="space-y-2 pt-0.5">
              {planPopularity.map((plan) => (
                <div
                  key={plan.name}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="text-[#52525B] font-medium truncate w-24 shrink-0">
                    {plan.name}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[#F2EFE8] overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(12, plan.barPct)}%`,
                        backgroundColor: plan.color,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                  <span className="font-bold text-[#191919] w-5 text-right shrink-0">
                    {plan.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. UPCOMING EXPIRIES LIST */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13.5px] font-bold text-[#191919]">
            Upcoming Expiries ({upcomingExpiries.length})
          </h2>
          <button
            type="button"
            onClick={onOpenRenewalsScreen}
            className="text-[11.5px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {upcomingExpiries.length === 0 ? (
          <div className="py-5 text-center text-[#71717A] space-y-1">
            <p className="text-[12px] font-bold text-[#191919]">
              No memberships expiring within 30 days
            </p>
            <p className="text-[11px]">
              All valid memberships have more than 30 days remaining.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE8]">
            {upcomingExpiries.slice(0, 6).map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className="py-2.5 first:pt-1 last:pb-0.5 flex items-center justify-between gap-2 hover:bg-[#FBF9F5] rounded-xl px-1 transition-colors cursor-pointer"
              >
                {/* Left: Member Avatar + Name + Plan */}
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
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-bold text-[#191919] truncate">
                      {member.name}
                    </div>
                    <div className="text-[10.5px] font-medium text-[#71717A] truncate">
                      {member.membershipPlan}
                    </div>
                  </div>
                </div>

                {/* Middle: Days Remaining Badge */}
                <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] text-[10px] font-bold shrink-0">
                  Expires in {member.daysUntilExpiry} day{member.daysUntilExpiry === 1 ? '' : 's'}
                </span>

                {/* Right: Expiry Date + Renew / Chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-medium text-[#52525B] hidden xs:inline sm:inline">
                    {member.expiryDate}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRenewModal(member.id);
                    }}
                    className="px-2 py-1 rounded-lg bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E3A8A] text-[10px] font-bold cursor-pointer"
                  >
                    Renew
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
