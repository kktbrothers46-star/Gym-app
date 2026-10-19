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
  UserCheck,
  IndianRupee,
  Clock,
  Check,
  Phone,
  MessageCircle,
  Shield,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  StaffMember,
  StaffRole,
  StaffDetailedPermissions,
  Expense,
} from '../../types/dashboard';
import { ReportDateRangePreset } from './RevenueReportScreen';
import { ReportTabType } from './RetentionReportScreen';
import { StaffDetailPermissionsScreen } from '../staff/StaffDetailPermissionsScreen';

interface StaffReportScreenProps {
  staff: StaffMember[];
  expenses: Expense[];
  isEmptyState?: boolean;
  onBack: () => void;
  onSelectReportTab: (tab: ReportTabType) => void;
  onMarkStaffAttendance: (
    staffId: string,
    date: string,
    status: 'Present' | 'Late' | 'Absent',
    hoursLogged?: string
  ) => void;
  onPayStaffSalary: (staffId: string, amountToPay: number) => void;
  onSaveStaffPermissions: (
    staffId: string,
    detailed: StaffDetailedPermissions,
    updatedRole?: StaffRole,
    updatedRoleLabel?: string
  ) => void;
  onUpdateStaffMember: (staffId: string, updates: Partial<StaffMember>) => void;
  onToggleStaffActiveStatus: (staffId: string) => void;
  onOpenExpensesScreen?: () => void;
  onAddStaffMember?: (data: {
    name: string;
    role: StaffRole;
    roleLabel: string;
    phone: string;
    email?: string;
    monthlySalary: number;
    employmentType?: 'Full Time' | 'Part Time' | 'Contract';
  }) => void;
}

import { getTodayIso, computeDynamicDateBounds, getLast7DaysSeries } from '../../utils/dateUtils';

const REPORT_TODAY = getTodayIso();

function getStaffDateBounds(
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

export const StaffReportScreen: React.FC<StaffReportScreenProps> = ({
  staff,
  expenses,
  isEmptyState = false,
  onBack,
  onSelectReportTab,
  onMarkStaffAttendance,
  onPayStaffSalary,
  onSaveStaffPermissions,
  onUpdateStaffMember,
  onToggleStaffActiveStatus,
  onOpenExpensesScreen,
  onAddStaffMember,
}) => {
  const [rangePreset, setRangePreset] = useState<ReportDateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState(() => {
    const now = new Date();
    return getTodayIso(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [customEnd, setCustomEnd] = useState(() => getTodayIso());
  const [customDateError, setCustomDateError] = useState<string | null>(null);
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);

  // Add Staff Modal State
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('Trainer');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffSalary, setNewStaffSalary] = useState('25000');
  const [newStaffType, setNewStaffType] = useState<'Full Time' | 'Part Time' | 'Contract'>('Full Time');
  const [addStaffError, setAddStaffError] = useState<string | null>(null);

  const [attendanceChartPeriod, setAttendanceChartPeriod] = useState<'month' | 'week'>('month');
  const [staffFilter, setStaffFilter] = useState<'all' | 'present_today' | 'salary_due'>('all');
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<'owner' | 'reception'>('owner');
  const [exportToast, setExportToast] = useState<string | null>(null);

  const canViewSalaries = viewerRole === 'owner';

  const allStaffRecords = useMemo(() => (isEmptyState ? [] : staff), [isEmptyState, staff]);
  const effectiveStaff = useMemo(
    () => allStaffRecords.filter((s) => s.status === 'active'),
    [allStaffRecords]
  );

  const bounds = useMemo(
    () => getStaffDateBounds(rangePreset, customStart, customEnd),
    [rangePreset, customStart, customEnd]
  );

  // Staff KPI metrics
  const kpis = useMemo(() => {
    const totalStaff = effectiveStaff.length;
    const trainersCount = effectiveStaff.filter((s) => s.role === 'Trainer').length;
    const othersCount = Math.max(0, totalStaff - trainersCount);

    let presentTodayCount = 0;
    let salariesPaidTotal = 0;
    let pendingSalariesTotal = 0;
    let staffDueCount = 0;

    effectiveStaff.forEach((s) => {
      const todayLog = (s.attendanceLogs || []).find((l) => l.date === REPORT_TODAY);
      if (todayLog && (todayLog.status === 'Present' || todayLog.status === 'Late')) {
        presentTodayCount++;
      }
      salariesPaidTotal += s.paidSalaryThisMonth || 0;
      pendingSalariesTotal += s.pendingSalary || 0;
      if ((s.pendingSalary || 0) > 0) {
        staffDueCount++;
      }
    });

    const attendanceRateToday =
      totalStaff > 0 ? Math.round((presentTodayCount / totalStaff) * 100) : 0;

    return {
      totalStaff,
      trainersCount,
      othersCount,
      presentTodayCount,
      attendanceRateToday,
      salariesPaidTotal,
      pendingSalariesTotal,
      staffDueCount,
    };
  }, [effectiveStaff]);

  // Staff Attendance Overview Stacked Bar Series
  const attendanceSeries = useMemo(() => {
    const checkpoints =
      attendanceChartPeriod === 'week'
        ? getLast7DaysSeries()
        : (() => {
            const now = new Date();
            const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const monthShort = now.toLocaleDateString('en-IN', { month: 'short' });
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const days = [1, 5, 10, 15, 20, 25, lastDay];
            return days.map((d) => ({
              date: `${prefix}-${String(d).padStart(2, '0')}`,
              label: `${d} ${monthShort}`,
            }));
          })();

    return checkpoints.map((pt) => {
      let present = 0;
      let late = 0;
      let absent = 0;

      effectiveStaff.forEach((s) => {
        const log = (s.attendanceLogs || []).find((l) => l.date === pt.date);
        const status = log ? log.status : 'Present';
        if (status === 'Present') present++;
        else if (status === 'Late') late++;
        else absent++;
      });

      return {
        label: pt.label,
        date: pt.date,
        present,
        late,
        absent,
      };
    });
  }, [effectiveStaff, attendanceChartPeriod]);

  // Salary Expenses Trend (Last 6 Months)
  const salaryTrendSeries = useMemo(() => {
    if (effectiveStaff.length === 0 && (!expenses || expenses.length === 0)) return [];
    const now = new Date();
    const months: Array<{ label: string; amount: number }> = [];
    const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });

      // Real salary expenses from recorded expenses under 'Staff' category for that month
      const staffExpensesForMonth = (isEmptyState ? [] : expenses)
        .filter((e) => e.category === 'Staff' && e.date && e.date.startsWith(prefix))
        .reduce((sum, e) => sum + e.amount, 0);

      const isCurrentMonth = prefix === currentPrefix;
      const monthTotal = isCurrentMonth
        ? Math.max(staffExpensesForMonth, kpis.salariesPaidTotal)
        : staffExpensesForMonth;

      months.push({ label, amount: monthTotal });
    }
    return months;
  }, [effectiveStaff, expenses, isEmptyState, kpis.salariesPaidTotal]);

  // Staff Role Distribution Donut Data
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Trainers: 0,
      Reception: 0,
      Management: 0,
      Maintenance: 0,
    };

    effectiveStaff.forEach((s) => {
      if (s.role === 'Trainer') counts.Trainers++;
      else if (s.role === 'Reception') counts.Reception++;
      else if (s.role === 'Management') counts.Management++;
      else counts.Maintenance++;
    });

    const roleColors: Record<string, string> = {
      Trainers: '#2563EB',
      Reception: '#16A34A',
      Management: '#F59E0B',
      Maintenance: '#EF4444',
    };

    const items = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({
        label,
        count,
        color: roleColors[label] || '#9CA3AF',
      }));

    return reconcilePercentages(items, effectiveStaff.length);
  }, [effectiveStaff]);

  // Filtered Staff List (includes all staff so deactivated staff remain visible with Inactive status)
  const filteredStaff = useMemo(() => {
    return allStaffRecords.filter((s) => {
      if (staffFilter === 'present_today') {
        const log = (s.attendanceLogs || []).find((l) => l.date === REPORT_TODAY);
        return s.status === 'active' && log && (log.status === 'Present' || log.status === 'Late');
      }
      if (staffFilter === 'salary_due') {
        return (s.pendingSalary || 0) > 0;
      }
      return true;
    });
  }, [allStaffRecords, staffFilter]);

  const displayedStaff = showAllStaff ? filteredStaff : filteredStaff.slice(0, 4);

  const selectedStaffObj = useMemo(
    () => allStaffRecords.find((s) => s.id === selectedStaffId) || null,
    [allStaffRecords, selectedStaffId]
  );

  if (selectedStaffObj) {
    return (
      <StaffDetailPermissionsScreen
        staff={selectedStaffObj}
        viewerRole={viewerRole}
        onBack={() => setSelectedStaffId(null)}
        onSavePermissions={onSaveStaffPermissions}
        onUpdateStaffMember={onUpdateStaffMember}
        onToggleStaffActiveStatus={onToggleStaffActiveStatus}
        onMarkStaffAttendance={onMarkStaffAttendance}
        onPayStaffSalary={onPayStaffSalary}
      />
    );
  }

  // Export CSV
  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Gym Business OS - Staff Report'],
      ['Reporting Period', bounds.label],
      ['Total Active Staff', String(kpis.totalStaff)],
      ['Present Today', `${kpis.presentTodayCount} (${kpis.attendanceRateToday}%)`],
      ...(canViewSalaries
        ? [
            ['Salaries Paid This Month (INR)', String(kpis.salariesPaidTotal)],
            ['Pending Salaries (INR)', String(kpis.pendingSalariesTotal)],
          ]
        : []),
      [],
      ['Staff Directory & Today Status'],
      [
        'Staff Code',
        'Name',
        'Role',
        'Today Attendance',
        ...(canViewSalaries ? ['Monthly Salary (INR)', 'Paid (INR)', 'Pending (INR)'] : []),
      ],
      ...effectiveStaff.map((s) => {
        const todayLog = (s.attendanceLogs || []).find((l) => l.date === REPORT_TODAY);
        const todayStatus = todayLog ? todayLog.status : 'Absent';
        return [
          s.staffCode,
          s.name,
          s.roleLabel,
          todayStatus,
          ...(canViewSalaries
            ? [
                String(s.monthlySalary),
                String(s.paidSalaryThisMonth),
                String(s.pendingSalary),
              ]
            : []),
        ];
      }),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `staff_report_${bounds.startDate}_to_${bounds.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`Exported Staff Report (${bounds.label})`);
    setTimeout(() => setExportToast(null), 3000);
  };

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
          <span className="text-[14px] font-extrabold text-[#191919] leading-none">
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
              Staff Report
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Track staff attendance, salaries, and performance.
            </p>
          </div>
        </div>

        {/* Role Permission Switcher (Owner vs Restricted Staff view) */}
        <button
          type="button"
          onClick={() => setViewerRole((prev) => (prev === 'owner' ? 'reception' : 'owner'))}
          className="h-[26px] px-2 rounded-lg bg-white border border-[#EAE5DC] text-[10px] font-bold text-[#52525B] flex items-center gap-1 shrink-0 shadow-2xs hover:bg-[#F8F6F1] cursor-pointer"
          title="Toggle role permission preview for salary visibility"
        >
          <Shield className="w-3 h-3 text-[#1E3A8A]" />
          <span>{viewerRole === 'owner' ? 'Owner View' : 'Staff View'}</span>
        </button>
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
          const isActive = t.id === 'staff';
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

      {/* 3. STAFF KPI CARDS (2×2 GRID) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card A: Total Staff */}
        <button
          type="button"
          onClick={() => {
            setStaffFilter('all');
            setShowAllStaff(true);
          }}
          className={`text-left rounded-2xl p-3 bg-[#EFF6FF]/90 border transition-colors shadow-2xs flex items-center justify-between gap-2 cursor-pointer ${
            staffFilter === 'all' ? 'border-[#93C5FD]' : 'border-[#DBEAFE] hover:border-[#BFDBFE]'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                Total Staff
              </span>
              <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {kpis.totalStaff}
              </div>
              <div className="text-[10px] font-medium text-[#52525B] mt-0.5 truncate">
                {kpis.trainersCount} Trainers, {kpis.othersCount} Others
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>

        {/* Card B: Present Today */}
        <button
          type="button"
          onClick={() =>
            setStaffFilter((prev) => (prev === 'present_today' ? 'all' : 'present_today'))
          }
          className={`text-left rounded-2xl p-3 bg-[#F0FDF4]/90 border transition-colors shadow-2xs flex items-center justify-between gap-2 cursor-pointer ${
            staffFilter === 'present_today'
              ? 'border-[#86EFAC]'
              : 'border-[#DCFCE7] hover:border-[#BBF7D0]'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                Present Today
              </span>
              <div className="text-[19px] sm:text-[20px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {kpis.presentTodayCount}
              </div>
              <div className="text-[10px] font-semibold text-[#16A34A] mt-0.5 truncate">
                {kpis.attendanceRateToday}% attendance
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>

        {/* Card C: Salaries Paid */}
        <button
          type="button"
          onClick={() => {
            if (canViewSalaries && onOpenExpensesScreen) {
              onOpenExpensesScreen();
            }
          }}
          className="text-left rounded-2xl p-3 bg-[#FFFBEB]/90 border border-[#FDE68A] hover:border-[#FCD34D] shadow-2xs flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                Salaries Paid
              </span>
              <div className="text-[18px] sm:text-[19px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {canViewSalaries ? `₹${kpis.salariesPaidTotal.toLocaleString('en-IN')}` : '••••••'}
              </div>
              <div className="text-[10px] font-medium text-[#52525B] mt-0.5 truncate">
                {canViewSalaries ? 'This Month' : 'Owner access only'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>

        {/* Card D: Pending Salaries */}
        <button
          type="button"
          onClick={() =>
            setStaffFilter((prev) => (prev === 'salary_due' ? 'all' : 'salary_due'))
          }
          className={`text-left rounded-2xl p-3 bg-[#FEF2F2]/90 border transition-colors shadow-2xs flex items-center justify-between gap-2 cursor-pointer ${
            staffFilter === 'salary_due'
              ? 'border-[#FCA5A5]'
              : 'border-[#FECACA] hover:border-[#FCA5A5]'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#52525B] block truncate">
                Pending Salaries
              </span>
              <div className="text-[18px] sm:text-[19px] font-extrabold text-[#191919] leading-tight tracking-tight mt-0.5">
                {canViewSalaries
                  ? `₹${kpis.pendingSalariesTotal.toLocaleString('en-IN')}`
                  : '••••••'}
              </div>
              <div className="text-[10px] font-semibold text-[#DC2626] mt-0.5 truncate">
                {canViewSalaries ? `${kpis.staffDueCount} Staff Due` : 'Restricted'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>
      </div>

      {/* 4. STAFF ATTENDANCE OVERVIEW STACKED BAR CHART */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-bold text-[#191919]">Staff Attendance Overview</h2>

          <button
            type="button"
            onClick={() =>
              setAttendanceChartPeriod((prev) => (prev === 'month' ? 'week' : 'month'))
            }
            className="h-[26px] px-2.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] text-[#191919] text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{attendanceChartPeriod === 'month' ? 'This Month' : 'This Week'}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10.5px] font-semibold text-[#52525B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span>Absent</span>
          </div>
        </div>

        {effectiveStaff.length === 0 ? (
          <div className="py-6 text-center text-[#71717A]">
            <p className="text-[12px] font-bold text-[#191919]">No staff attendance data yet</p>
            <p className="text-[10.5px] mt-0.5">
              Add staff members and mark daily attendance to view trends.
            </p>
          </div>
        ) : (
          <div className="pt-1">
            <div className="flex gap-2">
              {/* Y-Axis Ticks */}
              <div className="flex flex-col justify-between text-[9.5px] font-medium text-[#71717A] h-28 pb-4 shrink-0 text-right w-4">
                <span>8</span>
                <span>6</span>
                <span>4</span>
                <span>2</span>
                <span>0</span>
              </div>

              {/* Stacked Bars */}
              <div className="flex-1">
                <div className="h-24 flex items-end justify-between gap-2 pt-1 pb-1 border-b border-[#EAE5DC] px-2">
                  {attendanceSeries.map((item) => {
                    const maxTotal = Math.max(8, effectiveStaff.length);
                    const presentPct = (item.present / maxTotal) * 100;
                    const latePct = (item.late / maxTotal) * 100;
                    const absentPct = (item.absent / maxTotal) * 100;

                    return (
                      <div
                        key={item.date}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-7 z-20 bg-[#191919] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                          {item.label}: {item.present}P · {item.late}L · {item.absent}A
                        </div>

                        <div className="w-4 sm:w-5 h-full flex flex-col justify-end rounded-t-sm overflow-hidden">
                          {item.absent > 0 && (
                            <div
                              style={{ height: `${absentPct}%` }}
                              className="w-full bg-[#EF4444]"
                            />
                          )}
                          {item.late > 0 && (
                            <div
                              style={{ height: `${latePct}%` }}
                              className="w-full bg-[#F59E0B]"
                            />
                          )}
                          {item.present > 0 && (
                            <div
                              style={{ height: `${presentPct}%` }}
                              className="w-full bg-[#22C55E]"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-center justify-between gap-1 pt-1.5 px-1">
                  {attendanceSeries.map((item) => (
                    <div
                      key={item.date}
                      className="flex-1 text-center text-[9.5px] font-medium text-[#71717A] truncate"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. SIDE-BY-SIDE CARDS: SALARY EXPENSES TREND & STAFF ROLE DISTRIBUTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Left Card: Salary Expenses Trend */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <div>
            <h3 className="text-[12.5px] font-bold text-[#191919]">Salary Expenses Trend</h3>
            <p className="text-[10px] font-medium text-[#71717A]">Last 6 Months</p>
          </div>

          {!canViewSalaries ? (
            <div className="py-6 text-center text-[11px] text-[#71717A]">
              Salary trend is visible to Owner accounts only.
            </div>
          ) : salaryTrendSeries.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-[#71717A]">
              No salary history recorded yet.
            </div>
          ) : (
            <div className="flex gap-1.5 pt-1">
              <div className="flex flex-col justify-between text-[8.5px] font-medium text-[#71717A] h-24 pb-4 shrink-0 text-right w-7">
                <span>₹80k</span>
                <span>₹60k</span>
                <span>₹40k</span>
                <span>₹20k</span>
                <span>₹0k</span>
              </div>

              <div className="flex-1">
                <div className="h-20 flex items-end justify-between gap-1.5 border-b border-[#EAE5DC] px-1">
                  {salaryTrendSeries.map((m) => {
                    const pct = Math.min(100, Math.round((m.amount / 80000) * 100));
                    return (
                      <div
                        key={m.label}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-6 z-20 bg-[#191919] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                          {m.label}: ₹{m.amount.toLocaleString('en-IN')}
                        </div>
                        <div
                          style={{ height: `${Math.max(8, pct)}%` }}
                          className="w-3.5 sm:w-4 bg-[#2563EB] rounded-t-xs transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-1 px-0.5">
                  {salaryTrendSeries.map((m) => (
                    <span
                      key={m.label}
                      className="flex-1 text-center text-[9px] font-medium text-[#71717A]"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Card: Staff Role Distribution */}
        <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
          <h3 className="text-[12.5px] font-bold text-[#191919]">Staff Role Distribution</h3>

          {roleDistribution.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-[#71717A]">
              No staff members added yet.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5 pt-1">
              {renderDonut(roleDistribution, String(effectiveStaff.length), 'Total Staff')}

              <div className="flex-1 space-y-1.5 min-w-0">
                {roleDistribution.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#52525B] font-medium truncate">{item.label}</span>
                    </div>
                    <span className="font-bold text-[#191919] shrink-0">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. STAFF LIST SECTION */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[13.5px] font-bold text-[#191919]">Staff List</h2>
            {staffFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStaffFilter('all')}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#1E3A8A] cursor-pointer"
              >
                {staffFilter === 'present_today' ? 'Present Today ×' : 'Salary Due ×'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onAddStaffMember && (
              <button
                type="button"
                onClick={() => {
                  setNewStaffName('');
                  setNewStaffPhone('');
                  setNewStaffSalary('25000');
                  setAddStaffError(null);
                  setIsAddStaffModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#1E3A8A] text-white text-[11px] font-bold hover:bg-[#162D6E] transition-colors cursor-pointer"
              >
                + Add Staff
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAllStaff((prev) => !prev)}
              className="text-[11.5px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
            >
              {showAllStaff ? 'Show Compact' : 'View All'}
            </button>
          </div>
        </div>

        {displayedStaff.length === 0 ? (
          <div className="py-6 text-center text-[#71717A] space-y-1.5">
            <div className="w-9 h-9 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-[12.5px] font-bold text-[#191919]">No staff records found</p>
            <p className="text-[11px] max-w-xs mx-auto">
              Add your trainers, receptionists, or managers to track team attendance and payroll.
            </p>
            {onAddStaffMember && (
              <button
                type="button"
                onClick={() => {
                  setNewStaffName('');
                  setNewStaffPhone('');
                  setNewStaffSalary('25000');
                  setAddStaffError(null);
                  setIsAddStaffModalOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-[11.5px] font-bold cursor-pointer hover:bg-[#162D6E] shadow-2xs"
              >
                + Add First Staff Member
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE8]">
            {displayedStaff.map((s) => {
              const todayLog = (s.attendanceLogs || []).find((l) => l.date === REPORT_TODAY);
              const todayStatus = todayLog ? todayLog.status : 'Absent';

              const attBadge =
                todayStatus === 'Present'
                  ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                  : todayStatus === 'Late'
                  ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                  : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]';

              const isSalaryDue = (s.pendingSalary || 0) > 0;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  className="py-2.5 first:pt-1 last:pb-0.5 flex items-center justify-between gap-2 hover:bg-[#FBF9F5] rounded-xl px-1 transition-colors cursor-pointer"
                >
                  {/* Left: Avatar + Name + Role */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#E5E0D6] shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#1E3A8A] font-bold text-[11.5px] flex items-center justify-center shrink-0">
                        {getInitials(s.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-[#191919] truncate">
                        {s.name}
                      </div>
                      <div className="text-[10.5px] font-medium text-[#71717A] truncate">
                        {s.roleLabel}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Attendance Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${attBadge}`}
                  >
                    {todayStatus}
                  </span>

                  {/* Right: Salary Info + Status Badge + Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canViewSalaries && (
                      <>
                        <span className="text-[12.5px] font-extrabold text-[#191919]">
                          ₹{s.monthlySalary.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isSalaryDue
                              ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                              : 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                          }`}
                        >
                          {isSalaryDue ? 'Due' : 'Paid'}
                        </span>
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD STAFF MEMBER MODAL */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4.5 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#191919]">Add Staff Member</h3>
                  <p className="text-[11px] text-[#71717A]">Add a new employee to your gym</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStaffName.trim()) {
                  setAddStaffError('Please enter the staff member name.');
                  return;
                }
                if (!newStaffPhone.trim()) {
                  setAddStaffError('Please enter a phone number.');
                  return;
                }
                const salaryNum = parseFloat(newStaffSalary);
                if (isNaN(salaryNum) || salaryNum < 0) {
                  setAddStaffError('Please enter a valid monthly salary.');
                  return;
                }
                if (onAddStaffMember) {
                  onAddStaffMember({
                    name: newStaffName.trim(),
                    role: newStaffRole,
                    roleLabel: newStaffRole,
                    phone: newStaffPhone.trim(),
                    monthlySalary: salaryNum,
                    employmentType: newStaffType,
                  });
                }
                setIsAddStaffModalOpen(false);
              }}
              className="mt-3 space-y-2.5"
            >
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Vikram Seth"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Role *
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
                  >
                    <option value="Trainer">Trainer</option>
                    <option value="Reception">Reception</option>
                    <option value="Management">Management</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                    Employment
                  </label>
                  <select
                    value={newStaffType}
                    onChange={(e) =>
                      setNewStaffType(e.target.value as 'Full Time' | 'Part Time' | 'Contract')
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Monthly Salary (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={newStaffSalary}
                  onChange={(e) => setNewStaffSalary(e.target.value)}
                  placeholder="25000"
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
                />
              </div>

              {addStaffError && (
                <p className="text-[10.5px] font-semibold text-[#DC2626]">{addStaffError}</p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E0D6] text-xs font-semibold text-[#71717A] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#162D6E] cursor-pointer shadow-2xs"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
