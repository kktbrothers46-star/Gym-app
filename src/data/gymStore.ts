/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  GymProfile,
  Member,
  Payment,
  PaymentPromise,
  CashReconciliation,
  Expense,
  AttendanceRecord,
  RecentActivity,
  MonthlyMetric,
  MembershipPlan,
  RenewalRecord,
  MembershipHistoryItem,
  Lead,
  LeadStatus,
  LeadSource,
  FollowUpTask,
  FollowUpReason,
  StaffMember,
  StaffRole,
  StaffAttendanceLog,
  StaffDetailedPermissions,
  SupportTicket,
  GymSettings,
  GymNotificationItem,
  ComplaintRecord,
  ComplaintCategory,
  ComplaintStatus,
  OnboardingPreferences,
  GymStoreState,
} from '../types/dashboard';
import {
  syncStoreDiffToFirestore,
} from '../lib/firestoreSync';

const STORAGE_KEY = 'gym_business_os_production_v1';

// Clean Initial Gym Profile (no fabricated sample owner, phone, GST, or address)
const INITIAL_GYM: GymProfile = {
  id: 'gym-1',
  name: 'My Gym',
  ownerName: 'Gym Owner',
  location: 'India',
  currency: 'INR',
  phone: '',
  email: '',
  address: '',
  city: '',
  pincode: '',
  gstNumber: '',
  openingHours: '6:00 AM – 10:00 PM',
  sundayHours: '7:00 AM – 12:00 PM',
  establishedYear: String(new Date().getFullYear()),
  branchCode: 'MAIN-01',
};

export const INITIAL_SETTINGS: GymSettings = {
  acceptedPaymentMethods: ['UPI', 'Cash', 'Card', 'Bank Transfer'],
  defaultPaymentMethod: 'UPI',
  upiId: '',
  receiptPrefix: 'PAY',
  enableGstBilling: false,
  gstPercentage: 18,
  allowPartialPayments: true,
  renewalGracePeriodDays: 5,
  expiryReminderDays: 7,
  autoMarkInactiveDays: 14,
  allowCheckInWithPendingDues: true,
  blockExpiredMemberCheckIn: true,
  defaultCheckInMethod: 'QR_Scan',
  notifyMembershipExpiry: true,
  notifyPendingPayments: true,
  notifyInactiveMembers: true,
  notifyNewLeadsAndFollowUps: true,
  notifyDailySummary: true,
  notifyStaffAttendanceAndSalary: true,
  whatsappRemindersEnabled: true,
  whatsappRenewalTemplate:
    'Hi {member_name}, your {plan_name} membership at {gym_name} expires on {expiry_date}. Renew today to keep your workout streak going!',
  whatsappPaymentTemplate:
    'Hi {member_name}, a balance of ₹{pending_amount} is due for your {plan_name} at {gym_name}. You can pay via UPI ({upi_id}) or at reception.',
};

export const INITIAL_ONBOARDING: OnboardingPreferences = {
  hasCompletedOnboarding: true,
  currentStep: 'welcome',
  selectedRole: null,
  gymName: '',
  memberCountOption: '',
  customMemberCount: '',
  managementMethod: '',
  customManagementMethod: '',
  challenges: [],
  customChallenge: '',
  offeredPlans: [],
  customPlanDuration: '',
  paymentMethods: [],
  customPaymentMethod: '',
};

function getLocalIsoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getLocalMonthLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function getFullMonthLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function getDefaultStaffDetailedPermissions(role: StaffRole): StaffDetailedPermissions {
  if (role === 'Management') {
    return {
      viewMembers: true,
      addMembers: true,
      editMembers: true,
      viewAttendance: true,
      recordCheckIns: true,
      correctAttendance: true,
      viewPlans: true,
      createPlans: true,
      editPlans: true,
      viewPayments: true,
      recordPayments: true,
      viewBalances: true,
      paymentCorrections: true,
      viewExpenses: true,
      addExpenses: true,
      editExpenses: true,
      viewReports: true,
      exportReports: true,
      viewSalaries: true,
      viewStaff: true,
      manageStaff: true,
      changeStaffPermissions: false,
      viewSettings: true,
      modifySettings: false,
    };
  }
  if (role === 'Reception') {
    return {
      viewMembers: true,
      addMembers: true,
      editMembers: true,
      viewAttendance: true,
      recordCheckIns: true,
      correctAttendance: false,
      viewPlans: true,
      createPlans: false,
      editPlans: false,
      viewPayments: true,
      recordPayments: true,
      viewBalances: true,
      paymentCorrections: false,
      viewExpenses: false,
      addExpenses: false,
      editExpenses: false,
      viewReports: false,
      exportReports: false,
      viewSalaries: false,
      viewStaff: false,
      manageStaff: false,
      changeStaffPermissions: false,
      viewSettings: false,
      modifySettings: false,
    };
  }
  if (role === 'Trainer') {
    return {
      viewMembers: true,
      addMembers: false,
      editMembers: false,
      viewAttendance: true,
      recordCheckIns: true,
      correctAttendance: false,
      viewPlans: true,
      createPlans: false,
      editPlans: false,
      viewPayments: false,
      recordPayments: false,
      viewBalances: false,
      paymentCorrections: false,
      viewExpenses: false,
      addExpenses: false,
      editExpenses: false,
      viewReports: false,
      exportReports: false,
      viewSalaries: false,
      viewStaff: false,
      manageStaff: false,
      changeStaffPermissions: false,
      viewSettings: false,
      modifySettings: false,
    };
  }
  return {
    viewMembers: false,
    addMembers: false,
    editMembers: false,
    viewAttendance: false,
    recordCheckIns: false,
    correctAttendance: false,
    viewPlans: false,
    createPlans: false,
    editPlans: false,
    viewPayments: false,
    recordPayments: false,
    viewBalances: false,
    paymentCorrections: false,
    viewExpenses: false,
    addExpenses: false,
    editExpenses: false,
    viewReports: false,
    exportReports: false,
    viewSalaries: false,
    viewStaff: false,
    manageStaff: false,
    changeStaffPermissions: false,
    viewSettings: false,
    modifySettings: false,
  };
}

/**
 * Computes the last 6 monthly metrics dynamically from real payments, members, and attendance records.
 */
function buildDynamicMonthlyMetrics(
  payments: Payment[],
  members: Member[],
  attendance: AttendanceRecord[]
): MonthlyMetric[] {
  const now = new Date();
  const result: MonthlyMetric[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const shortMonth = d.toLocaleDateString('en-IN', { month: 'short' });
    const monthLabel = `${shortMonth} ${d.getFullYear()}`;

    const monthRevenue = payments
      .filter(
        (p) =>
          p.status !== 'refunded' &&
          p.status !== 'pending' &&
          p.status !== 'overdue' &&
          p.amount > 0 &&
          ((p.date && p.date.startsWith(yearMonthPrefix)) || p.month === monthLabel)
      )
      .reduce((sum, p) => sum + p.amount, 0);

    const monthMembers = members.filter(
      (m) => !m.startDate || m.startDate <= `${yearMonthPrefix}-31`
    ).length;

    const monthAttendance = attendance.filter(
      (a) => a.date && a.date.startsWith(yearMonthPrefix)
    ).length;

    result.push({
      month: monthLabel,
      shortMonth,
      revenue: monthRevenue,
      members: monthMembers,
      attendance: monthAttendance,
    });
  }

  return result;
}

/**
 * Generates real operational notifications from actual member, payment, follow-up, and staff records
 * merged with any user-acknowledged/dismissed states.
 */
function syncRealNotifications(state: {
  members: Member[];
  followUpTasks: FollowUpTask[];
  staff: StaffMember[];
  existingNotifications: GymNotificationItem[];
  dismissedIds?: string[];
}): GymNotificationItem[] {
  const existingMap = new Map<string, GymNotificationItem>();
  (state.existingNotifications || []).forEach((n) => existingMap.set(n.id, n));

  const generated: GymNotificationItem[] = [];
  const todayIso = getLocalIsoDate();

  // 1. Expiring memberships (within 7 days)
  (state.members || []).forEach((m) => {
    if (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7 && m.status !== 'expired') {
      const id = `auto-exp-${m.id}`;
      const prev = existingMap.get(id);
      generated.push({
        id,
        title:
          m.daysUntilExpiry === 0
            ? 'Membership Expires Today'
            : `Membership Expiring in ${m.daysUntilExpiry} Day${m.daysUntilExpiry === 1 ? '' : 's'}`,
        message: `${m.name} (${m.memberCode || m.id}) — ${m.membershipPlan} expires on ${m.expiryDate}.`,
        category: 'Renewal',
        priority: m.daysUntilExpiry <= 2 ? 'high' : 'medium',
        timestamp: prev?.timestamp || 'Today',
        dateGroup: 'Today',
        isRead: prev ? prev.isRead : false,
        memberId: m.id,
        memberName: m.name,
        actionLabel: 'Renew Now',
        actionTarget: 'renew_member',
      });
    }
  });

  // 2. Pending / Overdue payments on member accounts
  (state.members || []).forEach((m) => {
    if ((m.pendingAmount || 0) > 0) {
      const id = `auto-due-${m.id}-${m.pendingAmount}`;
      const prev = existingMap.get(id);
      const isOverdue = m.daysUntilExpiry < 0 || m.status === 'expired';
      generated.push({
        id,
        title: `${isOverdue ? 'Overdue' : 'Pending'} Balance (₹${m.pendingAmount.toLocaleString('en-IN')})`,
        message: `${m.name} (${m.memberCode || m.id}) has a balance of ₹${m.pendingAmount.toLocaleString('en-IN')} for ${m.membershipPlan}.`,
        category: 'Payment',
        priority: isOverdue ? 'high' : 'medium',
        timestamp: prev?.timestamp || 'Today',
        dateGroup: 'Today',
        isRead: prev ? prev.isRead : false,
        memberId: m.id,
        memberName: m.name,
        amount: m.pendingAmount,
        actionLabel: 'Collect Payment',
        actionTarget: 'record_payment',
      });
    }
  });

  // 3. Pending Follow-Up tasks due today or overdue
  const dueTasks = (state.followUpTasks || []).filter(
    (t) => t.status === 'pending' && t.dueDate <= todayIso
  );
  if (dueTasks.length > 0) {
    const id = `auto-flw-${todayIso}-${dueTasks.length}`;
    const prev = existingMap.get(id);
    generated.push({
      id,
      title: `${dueTasks.length} Follow-Up${dueTasks.length === 1 ? '' : 's'} Due Today`,
      message: `Scheduled follow-ups pending for ${dueTasks
        .slice(0, 3)
        .map((t) => t.personName)
        .join(', ')}.`,
      category: 'Follow-Up',
      priority: 'medium',
      timestamp: prev?.timestamp || 'Today',
      dateGroup: 'Today',
      isRead: prev ? prev.isRead : false,
      actionLabel: 'Open Follow-Ups',
      actionTarget: 'followups',
    });
  }

  // 4. Inactive members (14+ days without visit)
  (state.members || []).forEach((m) => {
    if (m.daysSinceLastVisit >= 14 && m.status !== 'expired') {
      const id = `auto-inact-${m.id}`;
      const prev = existingMap.get(id);
      generated.push({
        id,
        title: `Inactive Member Alert (${m.daysSinceLastVisit} Days)`,
        message: `${m.name} (${m.memberCode || m.id}) has not checked in for ${m.daysSinceLastVisit} days.`,
        category: 'Attendance',
        priority: 'medium',
        timestamp: prev?.timestamp || 'Today',
        dateGroup: 'Today',
        isRead: prev ? prev.isRead : false,
        memberId: m.id,
        memberName: m.name,
        actionLabel: 'View Attendance',
        actionTarget: 'attendance',
      });
    }
  });

  // Keep custom/event notifications that were explicitly created during the session
  const manualNotifications = (state.existingNotifications || []).filter(
    (n) => !n.id.startsWith('auto-')
  );

  return [...generated, ...manualNotifications];
}

export function loadGymData(): GymStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return calculateSummary({
        gym: { ...INITIAL_GYM, ...(parsed.gym || {}) },
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
        onboarding: { ...INITIAL_ONBOARDING, ...(parsed.onboarding || {}) },
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        members: Array.isArray(parsed.members) ? parsed.members : [],
        plans: Array.isArray(parsed.plans) ? parsed.plans : [],
        renewals: Array.isArray(parsed.renewals) ? parsed.renewals : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        paymentPromises: Array.isArray(parsed.paymentPromises) ? parsed.paymentPromises : [],
        cashReconciliations: Array.isArray(parsed.cashReconciliations)
          ? parsed.cashReconciliations
          : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        leads: Array.isArray(parsed.leads) ? parsed.leads : [],
        followUpTasks: Array.isArray(parsed.followUpTasks) ? parsed.followUpTasks : [],
        attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
        staff: Array.isArray(parsed.staff) ? parsed.staff : [],
        supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
        complaints: Array.isArray(parsed.complaints) ? parsed.complaints : [],
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
        monthlyMetrics: Array.isArray(parsed.monthlyMetrics) ? parsed.monthlyMetrics : [],
        selectedMonth: parsed.selectedMonth || getFullMonthLabel(),
        isEmptyState: Boolean(parsed.isEmptyState),
      });
    }
  } catch (err) {
    console.error('Failed to parse gym store from localStorage', err);
  }

  // Genuine empty initial store — no fabricated members, payments, revenue, staff, or complaints
  const initialState = {
    gym: INITIAL_GYM,
    settings: INITIAL_SETTINGS,
    onboarding: INITIAL_ONBOARDING,
    notifications: [] as GymNotificationItem[],
    members: [] as Member[],
    plans: [] as MembershipPlan[],
    renewals: [] as RenewalRecord[],
    payments: [] as Payment[],
    paymentPromises: [] as PaymentPromise[],
    cashReconciliations: [] as CashReconciliation[],
    expenses: [] as Expense[],
    leads: [] as Lead[],
    followUpTasks: [] as FollowUpTask[],
    attendance: [] as AttendanceRecord[],
    staff: [] as StaffMember[],
    supportTickets: [] as SupportTicket[],
    complaints: [] as ComplaintRecord[],
    activities: [] as RecentActivity[],
    monthlyMetrics: [] as MonthlyMetric[],
    selectedMonth: getFullMonthLabel(),
    isEmptyState: false,
  };

  return calculateSummary(initialState);
}

function calculateSummary(state: any): GymStoreState {
  if (state.isEmptyState) {
    return {
      ...state,
      monthlyMetrics: [],
      activeMembersCount: 0,
      totalMembersCount: 0,
      collectedThisMonth: 0,
      pendingPaymentsTotal: 0,
      operatingProfit: 0,
      overdueCount: 0,
      overdueTotal: 0,
      expiringSoonCount: 0,
      inactiveCount: 0,
    };
  }

  const rawMembers: Member[] = state.members || [];
  const payments: Payment[] = state.payments || [];
  const expenses: Expense[] = state.expenses || [];
  const attendance: AttendanceRecord[] = state.attendance || [];
  const todayIso = getLocalIsoDate();
  const todayMidnight = new Date(todayIso + 'T00:00:00').getTime();

  // Map latest actual attendance date per memberId
  const latestAttendanceByMember = new Map<string, { dateIso: string; display: string }>();
  attendance.forEach((rec) => {
    if (!rec.memberId) return;
    let recIso = rec.date || '';
    if (!recIso && rec.timestamp?.startsWith('Today')) {
      recIso = todayIso;
    }
    if (!recIso) return;
    const prev = latestAttendanceByMember.get(rec.memberId);
    if (!prev || recIso > prev.dateIso) {
      latestAttendanceByMember.set(rec.memberId, {
        dateIso: recIso,
        display:
          recIso === todayIso
            ? `Today${rec.checkInTime ? `, ${rec.checkInTime}` : ''}`
            : new Date(recIso + 'T00:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
      });
    }
  });

  // Recalculate daysUntilExpiry from actual expiryDate and daysSinceLastVisit from actual attendance
  const members: Member[] = rawMembers.map((m) => {
    let computedDaysUntilExpiry = m.daysUntilExpiry;
    if (m.expiryDate) {
      const parsedExp = new Date(m.expiryDate);
      if (!isNaN(parsedExp.getTime())) {
        const expIso = getLocalIsoDate(parsedExp);
        const expMidnight = new Date(expIso + 'T00:00:00').getTime();
        computedDaysUntilExpiry = Math.round((expMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
      }
    }

    let computedDaysSinceVisit = m.daysSinceLastVisit;
    let computedLastVisitDate = m.lastVisitDate;
    const latestAtt = latestAttendanceByMember.get(m.id);
    if (latestAtt) {
      const attMidnight = new Date(latestAtt.dateIso + 'T00:00:00').getTime();
      computedDaysSinceVisit = Math.max(
        0,
        Math.round((todayMidnight - attMidnight) / (1000 * 60 * 60 * 24))
      );
      computedLastVisitDate = latestAtt.display;
    }

    // Derive accurate status from actual dates & balance
    let derivedStatus: Member['status'] = m.status;
    if (computedDaysUntilExpiry < 0) {
      derivedStatus = 'expired';
    } else if ((m.pendingAmount || 0) > 0) {
      derivedStatus = 'pending';
    } else if (computedDaysUntilExpiry <= 7) {
      derivedStatus = 'expiring';
    } else if (m.status === 'inactive' || (latestAtt && computedDaysSinceVisit >= 14)) {
      derivedStatus = 'inactive';
    } else {
      derivedStatus = 'active';
    }

    return {
      ...m,
      daysUntilExpiry: computedDaysUntilExpiry,
      daysSinceLastVisit: computedDaysSinceVisit,
      lastVisitDate: computedLastVisitDate,
      status: derivedStatus,
    };
  });

  // Recompute dynamic monthly metrics from real records
  const monthlyMetrics = buildDynamicMonthlyMetrics(payments, members, attendance);

  // Sync live notifications from real records
  const notifications = syncRealNotifications({
    members,
    followUpTasks: state.followUpTasks || [],
    staff: state.staff || [],
    existingNotifications: state.notifications || [],
  });

  // Active members: status is 'active' or 'expiring' or 'pending' (if active plan)
  const activeMembers = members.filter(
    (m) =>
      m.status === 'active' ||
      m.status === 'expiring' ||
      (m.status === 'pending' && m.daysUntilExpiry > 0)
  );
  const activeMembersCount = activeMembers.length;
  const totalMembersCount = members.length;

  // Collected this month: sum of non-refunded payments in current month
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentShortMonthLabel = getLocalMonthLabel(now);

  const collectedThisMonth = payments
    .filter(
      (p) =>
        p.status !== 'refunded' &&
        p.status !== 'pending' &&
        p.status !== 'overdue' &&
        p.amount > 0 &&
        ((p.date && p.date.startsWith(currentYearMonth)) ||
          p.month === currentShortMonthLabel)
    )
    .reduce((sum, p) => sum + p.amount, 0);

  // Pending payments from actual member balances
  const overdueMembers = members.filter((m) => (m.pendingAmount || 0) > 0);
  const overdueTotal = overdueMembers.reduce((sum, m) => sum + (m.pendingAmount || 0), 0);
  const overdueCount = overdueMembers.length;
  const pendingPaymentsTotal = overdueTotal;

  // Expiring soon (within 7 days)
  const expiringMembers = members.filter(
    (m) =>
      m.status !== 'expired' &&
      (m.status === 'expiring' || (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7))
  );
  const expiringSoonCount = expiringMembers.length;

  // Inactive members (no visit in >= 14 days)
  const inactiveMembers = members.filter(
    (m) => m.status !== 'expired' && (m.status === 'inactive' || m.daysSinceLastVisit >= 14)
  );
  const inactiveCount = inactiveMembers.length;

  // Operating Profit = Collected This Month - Total Paid Expenses This Month
  const totalExpenses = expenses
    .filter(
      (e: Expense) =>
        e.status !== 'unpaid' &&
        ((e.date && e.date.startsWith(currentYearMonth)) ||
          e.month === currentShortMonthLabel)
    )
    .reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0);

  const operatingProfit = collectedThisMonth - totalExpenses;

  return {
    ...state,
    members,
    paymentPromises: state.paymentPromises || [],
    cashReconciliations: state.cashReconciliations || [],
    notifications,
    monthlyMetrics,
    activeMembersCount,
    totalMembersCount,
    collectedThisMonth,
    pendingPaymentsTotal,
    operatingProfit,
    overdueCount,
    overdueTotal,
    expiringSoonCount,
    inactiveCount,
  };
}

export function saveGymData(state: GymStoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save gym store to localStorage', err);
  }
}

// Global state hook
let listeners: Array<(state: GymStoreState) => void> = [];
let currentState: GymStoreState = loadGymData();

export function setFullGymStore(loaded: Partial<GymStoreState>) {
  const next = calculateSummary({
    ...currentState,
    ...loaded,
  });
  currentState = next;
  saveGymData(next);
  listeners.forEach((l) => l(next));
}

export function useGymStore() {
  const [state, setState] = useState<GymStoreState>(currentState);

  useEffect(() => {
    const listener = (newState: GymStoreState) => setState(newState);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const updateStore = (updater: (prev: GymStoreState) => GymStoreState) => {
    const prev = currentState;
    const next = calculateSummary(updater(prev));
    currentState = next;
    saveGymData(next);
    syncStoreDiffToFirestore(prev, next);
    listeners.forEach((l) => l(next));
  };

  const addMember = (
    newMember: Omit<Member, 'id'> & {
      initialPaidAmount?: number;
      paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    }
  ) => {
    updateStore((prev) => {
      const nextCode = `MBR${String(prev.members.length + 1).padStart(3, '0')}`;
      const memberId = `m-${Date.now()}`;
      const parsedPlanFee =
        parseInt(String(newMember.planFee || '').replace(/[^0-9]/g, ''), 10) || 0;
      const pendingAmt = Math.max(0, newMember.pendingAmount || 0);
      const paidNow =
        newMember.initialPaidAmount !== undefined
          ? Math.max(0, newMember.initialPaidAmount)
          : Math.max(0, parsedPlanFee - pendingAmt);

      const { initialPaidAmount, paymentMethod, ...memberFields } = newMember;

      const member: Member = {
        ...memberFields,
        id: memberId,
        memberCode: newMember.memberCode || nextCode,
        status: pendingAmt > 0 ? 'pending' : newMember.status || 'active',
        visitsThisMonth: newMember.visitsThisMonth ?? 0,
        totalVisits: newMember.totalVisits ?? 0,
      };

      const nextPayments = [...prev.payments];
      const nextActivities = [...prev.activities];

      if (paidNow > 0 || pendingAmt > 0) {
        const nowTime = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const prefix = prev.settings?.receiptPrefix || 'PAY';
        const nextSeq = String(prev.payments.length + 1).padStart(5, '0');
        const payment: Payment = {
          id: `p-${Date.now()}`,
          memberId: member.id,
          memberName: member.name,
          memberCode: member.memberCode,
          amount: paidNow,
          planFee: parsedPlanFee || paidNow + pendingAmt,
          previouslyPaid: 0,
          pendingAmount: pendingAmt,
          date: member.startDate || getLocalIsoDate(),
          time: nowTime,
          month: getLocalMonthLabel(),
          status:
            pendingAmt > 0 ? (paidNow > 0 ? 'partial' : 'pending') : 'completed',
          paymentMethod: paymentMethod || prev.settings?.defaultPaymentMethod || 'UPI',
          plan: member.membershipPlan,
          receiptNumber: `${prefix}${nextSeq}`,
        };
        nextPayments.unshift(payment);
      }

      const enrollActivity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'member_joined',
        title: 'New Member Enrolled',
        description: `${member.name} (${member.memberCode}) joined ${member.membershipPlan}${
          paidNow > 0 ? ` — Paid ₹${paidNow.toLocaleString('en-IN')}` : ''
        }`,
        timestamp: 'Just now',
        amount: paidNow > 0 ? paidNow : undefined,
        badgeType: 'purple',
      };
      nextActivities.unshift(enrollActivity);

      return {
        ...prev,
        members: [member, ...prev.members],
        payments: nextPayments,
        activities: nextActivities,
      };
    });
  };

  const recordPayment = (paymentData: {
    memberId: string;
    memberName: string;
    amount: number;
    paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
    plan: string;
    planFee?: number;
    notes?: string;
    date?: string;
    referenceId?: string;
  }) => {
    updateStore((prev) => {
      const targetMember = prev.members.find((m) => m.id === paymentData.memberId);
      const memberCode = targetMember?.memberCode || paymentData.memberId;
      const existingPending = targetMember?.pendingAmount || 0;
      const paidNow = Math.max(0, paymentData.amount);

      let nextPending = 0;
      if (existingPending > 0) {
        nextPending = Math.max(0, existingPending - paidNow);
      } else if (paymentData.planFee && paymentData.planFee > paidNow) {
        nextPending = Math.max(0, paymentData.planFee - paidNow);
      }

      const openPaymentRecord = prev.payments.find(
        (p) =>
          p.memberId === paymentData.memberId &&
          (p.status === 'partial' || p.status === 'pending' || p.status === 'overdue')
      );
      const prevPaidAmount = openPaymentRecord ? openPaymentRecord.amount : 0;

      const effectivePlanFee =
        paymentData.planFee ||
        (openPaymentRecord?.planFee
          ? openPaymentRecord.planFee
          : existingPending > 0
          ? prevPaidAmount + existingPending
          : paidNow + nextPending);

      const paymentStatus: Payment['status'] =
        nextPending > 0 ? (paidNow > 0 ? 'partial' : 'pending') : 'completed';

      const nowTime = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const prefix = prev.settings?.receiptPrefix || 'PAY';
      const nextReceiptSeq = String(prev.payments.length + 1).padStart(5, '0');
      const paymentDate = paymentData.date || getLocalIsoDate();
      const parsedDate = new Date(paymentDate);
      const monthLabel = !isNaN(parsedDate.getTime())
        ? getLocalMonthLabel(parsedDate)
        : getLocalMonthLabel();

      const payment: Payment = {
        id: `p-${Date.now()}`,
        memberId: paymentData.memberId,
        memberName: paymentData.memberName,
        memberCode,
        amount: paidNow,
        planFee: effectivePlanFee,
        previouslyPaid: existingPending > 0 ? prevPaidAmount : 0,
        pendingAmount: nextPending,
        date: paymentDate,
        time: nowTime,
        month: monthLabel,
        status: paymentStatus,
        paymentMethod: paymentData.paymentMethod,
        plan: paymentData.plan,
        receiptNumber: `${prefix}${nextReceiptSeq}`,
        referenceId:
          paymentData.referenceId ||
          (paymentData.paymentMethod === 'UPI'
            ? `UPI${Math.floor(100000000 + Math.random() * 900000000)}`
            : undefined),
        notes: paymentData.notes,
      };

      const updatedMembers = prev.members.map((m) => {
        if (m.id === paymentData.memberId) {
          const newStatus =
            nextPending === 0
              ? m.daysUntilExpiry < 0
                ? 'expired'
                : m.daysUntilExpiry <= 7
                ? 'expiring'
                : 'active'
              : 'pending';
          return { ...m, pendingAmount: nextPending, status: newStatus as Member['status'] };
        }
        return m;
      });

      const updatedExistingPayments = prev.payments.map((p) => {
        if (
          p.memberId === paymentData.memberId &&
          (p.status === 'pending' || p.status === 'partial' || p.status === 'overdue') &&
          existingPending > 0
        ) {
          return {
            ...p,
            pendingAmount: nextPending,
            status: (nextPending === 0 ? 'completed' : 'partial') as Payment['status'],
          };
        }
        return p;
      });

      const activity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'payment_received',
        title: nextPending > 0 ? 'Partial Payment Received' : 'Payment Received',
        description: `${paymentData.memberName} paid ₹${paidNow.toLocaleString('en-IN')} via ${paymentData.paymentMethod}${
          nextPending > 0 ? ` (Due: ₹${nextPending.toLocaleString('en-IN')})` : ''
        }`,
        timestamp: 'Just now',
        amount: paidNow,
        badgeType: nextPending > 0 ? 'warning' : 'success',
      };

      // Auto-complete any pending payment promises for this member if balance cleared or promised amount met
      const updatedPromises = (prev.paymentPromises || []).map((pr) => {
        if (
          pr.memberId === paymentData.memberId &&
          pr.status === 'pending' &&
          paidNow > 0 &&
          (nextPending === 0 || paidNow >= pr.promisedAmount)
        ) {
          return {
            ...pr,
            status: 'completed' as const,
            completedAt: paymentDate,
          };
        }
        return pr;
      });

      return {
        ...prev,
        members: updatedMembers,
        payments: [payment, ...updatedExistingPayments],
        paymentPromises: updatedPromises,
        activities: [activity, ...prev.activities],
      };
    });
  };

  const markAttendance = (
    memberId: string,
    memberName: string,
    options?: {
      date?: string;
      time?: string;
      method?: AttendanceRecord['method'];
      notes?: string;
    }
  ) => {
    updateStore((prev) => {
      const todayIso = getLocalIsoDate();
      const targetDate = options?.date || todayIso;
      const existingOnDate = (prev.attendance || []).find(
        (a) =>
          a.memberId === memberId &&
          (a.date === targetDate ||
            (!a.date && targetDate === todayIso && a.timestamp.startsWith('Today')))
      );
      if (existingOnDate) {
        return prev;
      }

      const targetMember = prev.members.find((m) => m.id === memberId);
      const formattedTime =
        options?.time ||
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

      const isToday = targetDate === todayIso;
      const displayTimestamp = isToday
        ? `Today, ${formattedTime}`
        : `${new Date(targetDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          })}, ${formattedTime}`;

      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        memberId,
        memberName: targetMember?.name || memberName,
        memberCode: targetMember?.memberCode,
        date: targetDate,
        checkInTime: formattedTime,
        timestamp: displayTimestamp,
        type: 'check_in',
        method: options?.method || 'Manual',
        notes: options?.notes?.trim() || undefined,
        markedBy: 'Owner',
      };

      const updatedMembers = prev.members.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            lastVisitDate: isToday ? `Today, ${formattedTime}` : m.lastVisitDate,
            daysSinceLastVisit: isToday ? 0 : m.daysSinceLastVisit,
            visitsThisMonth: (m.visitsThisMonth || 0) + 1,
            totalVisits: (m.totalVisits || 0) + 1,
            attendanceStreak: isToday ? (m.attendanceStreak || 0) + 1 : m.attendanceStreak,
            status: (m.status === 'inactive' && m.daysUntilExpiry > 0 ? 'active' : m.status) as Member['status'],
          };
        }
        return m;
      });

      const activity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'attendance',
        title: 'Check-in Recorded',
        description: `${targetMember?.name || memberName} checked in at ${formattedTime}`,
        timestamp: 'Just now',
        badgeType: 'info',
      };

      return {
        ...prev,
        members: updatedMembers,
        attendance: [record, ...(prev.attendance || [])],
        activities: [activity, ...prev.activities],
      };
    });
  };

  const unmarkAttendance = (attendanceId: string) => {
    updateStore((prev) => {
      const targetRecord = (prev.attendance || []).find((a) => a.id === attendanceId);
      if (!targetRecord) return prev;

      const updatedAttendance = (prev.attendance || []).filter((a) => a.id !== attendanceId);
      const todayIso = getLocalIsoDate();
      const isToday =
        targetRecord.date === todayIso ||
        targetRecord.timestamp.startsWith('Today');

      const updatedMembers = prev.members.map((m) => {
        if (m.id === targetRecord.memberId) {
          return {
            ...m,
            lastVisitDate: isToday ? 'Yesterday' : m.lastVisitDate,
            daysSinceLastVisit: isToday ? 1 : m.daysSinceLastVisit,
            visitsThisMonth: Math.max(0, (m.visitsThisMonth || 1) - 1),
            totalVisits: Math.max(0, (m.totalVisits || 1) - 1),
          };
        }
        return m;
      });

      return {
        ...prev,
        members: updatedMembers,
        attendance: updatedAttendance,
      };
    });
  };

  const reversePayment = (paymentId: string, reason?: string) => {
    updateStore((prev) => {
      const target = prev.payments.find((p) => p.id === paymentId);
      if (!target || target.status === 'refunded') return prev;

      const updatedPayments = prev.payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'refunded' as const,
              notes: reason ? `Reversed: ${reason}` : 'Payment reversed / refunded',
            }
          : p
      );

      const updatedMembers = prev.members.map((m) => {
        if (m.id === target.memberId) {
          const restoredPending = (m.pendingAmount || 0) + target.amount;
          return {
            ...m,
            pendingAmount: restoredPending,
            status: 'pending' as Member['status'],
          };
        }
        return m;
      });

      const activity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'payment_received',
        title: 'Payment Reversed',
        description: `Reversed ₹${target.amount.toLocaleString('en-IN')} for ${target.memberName} (${target.receiptNumber || target.id})`,
        timestamp: 'Just now',
        amount: target.amount,
        badgeType: 'warning',
      };

      return {
        ...prev,
        payments: updatedPayments,
        members: updatedMembers,
        activities: [activity, ...prev.activities],
      };
    });
  };

  const addExpense = (expenseData: {
    title: string;
    category: Expense['category'];
    amount: number;
    date?: string;
    paidTo?: string;
    paymentMethod?: Expense['paymentMethod'];
    status?: 'paid' | 'unpaid';
    notes?: string;
    receiptRef?: string;
  }) => {
    updateStore((prev) => {
      const expDate = expenseData.date || getLocalIsoDate();
      const parsedDate = new Date(expDate);
      const expMonth = !isNaN(parsedDate.getTime())
        ? getLocalMonthLabel(parsedDate)
        : getLocalMonthLabel();

      const expense: Expense = {
        id: `exp-${Date.now()}`,
        title: expenseData.title,
        category: expenseData.category,
        amount: expenseData.amount,
        date: expDate,
        month: expMonth,
        paidTo: expenseData.paidTo,
        paymentMethod: expenseData.paymentMethod || 'UPI',
        status: expenseData.status || 'paid',
        notes: expenseData.notes,
        receiptRef: expenseData.receiptRef,
      };

      const activity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'expense',
        title: expense.status === 'unpaid' ? 'Unpaid Expense Logged' : 'Expense Recorded',
        description: `${expenseData.title} (${expenseData.category}) — ₹${expenseData.amount.toLocaleString('en-IN')}`,
        timestamp: 'Just now',
        amount: expenseData.amount,
        badgeType: 'warning',
      };

      return {
        ...prev,
        expenses: [expense, ...prev.expenses],
        activities: [activity, ...prev.activities],
      };
    });
  };

  const updateExpense = (expenseId: string, updates: Partial<Expense>) => {
    updateStore((prev) => {
      const updatedExpenses = prev.expenses.map((e) => {
        if (e.id === expenseId) {
          const nextDate = updates.date || e.date;
          const parsedDate = new Date(nextDate);
          const nextMonth = !isNaN(parsedDate.getTime())
            ? getLocalMonthLabel(parsedDate)
            : e.month;
          return { ...e, ...updates, month: nextMonth };
        }
        return e;
      });
      return {
        ...prev,
        expenses: updatedExpenses,
      };
    });
  };

  const deleteExpense = (expenseId: string) => {
    updateStore((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
  };

  const renewMembership = (
    memberId: string,
    renewalData: {
      membershipPlan: string;
      planFee: string;
      monthsToAdd: number;
      daysToAdd?: number;
      planPrice?: number;
      paymentAmount: number;
      paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    }
  ) => {
    updateStore((prev) => {
      const todayIso = getLocalIsoDate();
      // Prevent duplicate renewal records on the same day for the same member & plan
      const alreadyRenewedToday = (prev.renewals || []).some(
        (r) =>
          r.memberId === memberId &&
          r.renewedAt === todayIso &&
          r.newPlan === renewalData.membershipPlan &&
          r.status === 'completed'
      );
      if (alreadyRenewedToday) {
        return prev;
      }

      let renewedMemberName = '';
      let renewedMemberCode = '';
      let prevPlanName = '';
      let prevExpiryStr = '';
      let formattedNewExpiry = '';
      const totalPlanPrice =
        renewalData.planPrice !== undefined
          ? renewalData.planPrice
          : Math.max(renewalData.paymentAmount, 0);
      const actualPaid = Math.max(0, renewalData.paymentAmount);
      const unpaidDelta = Math.max(0, totalPlanPrice - actualPaid);

      const updatedMembers = prev.members.map((m) => {
        if (m.id === memberId) {
          renewedMemberName = m.name;
          renewedMemberCode = m.memberCode || m.id;
          prevPlanName = m.membershipPlan;
          prevExpiryStr = m.expiryDate;

          const baseDate = new Date();
          const currExp = new Date(m.expiryDate);
          const effectiveStart =
            !isNaN(currExp.getTime()) && currExp > baseDate ? currExp : baseDate;
          const nextExpiry = new Date(effectiveStart);

          if (renewalData.daysToAdd && renewalData.daysToAdd > 0) {
            nextExpiry.setDate(nextExpiry.getDate() + renewalData.daysToAdd);
          } else {
            nextExpiry.setMonth(nextExpiry.getMonth() + renewalData.monthsToAdd);
          }

          formattedNewExpiry = nextExpiry.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const diffDays = Math.ceil(
            (nextExpiry.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const previousHistoryItem: MembershipHistoryItem = {
            id: `hist-${Date.now()}`,
            planName: m.membershipPlan,
            planFee: m.planFee || `₹${totalPlanPrice.toLocaleString('en-IN')}`,
            startDate: m.startDate,
            expiryDate: m.expiryDate,
            renewedAt: todayIso,
            status: 'completed',
          };

          const updatedPending = Math.max(0, (m.pendingAmount || 0) + unpaidDelta);

          return {
            ...m,
            membershipPlan: renewalData.membershipPlan,
            planFee: renewalData.planFee,
            startDate: getLocalIsoDate(effectiveStart),
            expiryDate: formattedNewExpiry,
            daysUntilExpiry: diffDays,
            pendingAmount: updatedPending,
            lastRenewedDate: todayIso,
            membershipHistory: [previousHistoryItem, ...(m.membershipHistory || [])],
            status: (updatedPending > 0 ? 'pending' : 'active') as Member['status'],
          };
        }
        return m;
      });

      const renewalRecord: RenewalRecord = {
        id: `ren-${Date.now()}`,
        memberId,
        memberName: renewedMemberName,
        memberCode: renewedMemberCode,
        previousPlan: prevPlanName,
        previousExpiryDate: prevExpiryStr,
        newPlan: renewalData.membershipPlan,
        newExpiryDate: formattedNewExpiry,
        planFee: totalPlanPrice,
        paidAmount: actualPaid,
        pendingAmount: unpaidDelta,
        paymentStatus:
          actualPaid >= totalPlanPrice && totalPlanPrice > 0
            ? 'paid'
            : actualPaid > 0
            ? 'partial'
            : 'pending',
        paymentMethod: actualPaid > 0 ? renewalData.paymentMethod : undefined,
        renewedAt: todayIso,
        month: getLocalMonthLabel(),
        status: 'completed',
      };

      const nextPayments = [...prev.payments];
      if (actualPaid > 0 || unpaidDelta > 0) {
        const prefix = prev.settings?.receiptPrefix || 'PAY';
        const nextSeq = String(prev.payments.length + 1).padStart(5, '0');
        const payment: Payment = {
          id: `p-${Date.now()}`,
          memberId,
          memberName: renewedMemberName,
          memberCode: renewedMemberCode,
          amount: actualPaid,
          planFee: totalPlanPrice,
          pendingAmount: unpaidDelta,
          date: todayIso,
          month: getLocalMonthLabel(),
          status:
            unpaidDelta > 0 ? (actualPaid > 0 ? 'partial' : 'pending') : 'completed',
          paymentMethod: renewalData.paymentMethod,
          plan: renewalData.membershipPlan,
          receiptNumber: `${prefix}${nextSeq}`,
        };
        nextPayments.unshift(payment);
      }

      const activity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'renewal',
        title: 'Membership Renewed',
        description:
          actualPaid > 0
            ? `${renewedMemberName} renewed ${renewalData.membershipPlan} (Paid ₹${actualPaid.toLocaleString('en-IN')}${unpaidDelta > 0 ? `, Due ₹${unpaidDelta.toLocaleString('en-IN')}` : ''})`
            : `${renewedMemberName} renewed ${renewalData.membershipPlan} (Payment pending ₹${totalPlanPrice.toLocaleString('en-IN')})`,
        timestamp: 'Just now',
        amount: actualPaid > 0 ? actualPaid : undefined,
        badgeType: actualPaid >= totalPlanPrice ? 'success' : 'warning',
      };

      return {
        ...prev,
        members: updatedMembers,
        renewals: [renewalRecord, ...(prev.renewals || [])],
        payments: nextPayments,
        activities: [activity, ...prev.activities],
      };
    });
  };

  const updateMember = (memberId: string, updates: Partial<Member>) => {
    updateStore((prev) => {
      const updatedMembers = prev.members.map((m) => {
        if (m.id === memberId) {
          return { ...m, ...updates };
        }
        return m;
      });
      return {
        ...prev,
        members: updatedMembers,
      };
    });
  };

  const archiveMember = (memberId: string) => {
    updateStore((prev) => {
      const updatedMembers = prev.members.map((m) => {
        if (m.id === memberId) {
          return { ...m, status: 'inactive' as const, daysUntilExpiry: 0 };
        }
        return m;
      });
      return {
        ...prev,
        members: updatedMembers,
      };
    });
  };

  const addFollowUp = (
    memberId: string,
    followUpData: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => {
    updateStore((prev) => {
      let targetMember: Member | undefined;
      const todayIso = getLocalIsoDate();
      const updatedMembers = prev.members.map((m) => {
        if (m.id === memberId) {
          targetMember = m;
          const newFollowUp = {
            id: `flw-${Date.now()}`,
            memberId,
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            note: followUpData.note,
            type: followUpData.type,
            status: 'completed' as const,
            createdBy: 'Owner',
          };
          const existing = m.followUps || [];
          return {
            ...m,
            followUps: [newFollowUp, ...existing],
          };
        }
        return m;
      });

      const nextTasks = [...(prev.followUpTasks || [])];
      if (targetMember) {
        const loggedTask: FollowUpTask = {
          id: `ft-${Date.now()}`,
          personId: targetMember.id,
          personType: 'Member',
          personName: targetMember.name,
          personPhone: targetMember.phone,
          personPhotoUrl: targetMember.photoUrl,
          reason:
            followUpData.type === 'Renewal'
              ? 'Renewal'
              : followUpData.type === 'Payment'
              ? 'Payment'
              : 'General check-in',
          note: followUpData.note,
          dueDate: todayIso,
          dueTime: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          status: 'completed',
          completedAt: todayIso,
          outcomeNote: followUpData.note,
          assignedStaff: 'Owner',
          relatedPlan: targetMember.membershipPlan,
        };
        nextTasks.unshift(loggedTask);
      }

      return {
        ...prev,
        members: updatedMembers,
        followUpTasks: nextTasks,
      };
    });
  };

  const addLead = (leadData: {
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
  }) => {
    updateStore((prev) => {
      const currentLeads = prev.leads || [];
      const nextCode = `LD${String(currentLeads.length + 1).padStart(3, '0')}`;
      const newLeadId = `lead-${Date.now()}`;
      const enquiryDate = leadData.enquiryDate || getLocalIsoDate();

      const newLead: Lead = {
        id: newLeadId,
        leadCode: nextCode,
        name: leadData.name.trim(),
        phone: leadData.phone.trim(),
        email: leadData.email?.trim() || undefined,
        source: leadData.source,
        enquiryDate,
        interestedPlan: leadData.interestedPlan || undefined,
        status: leadData.status || 'New',
        nextFollowUpDate: leadData.nextFollowUpDate || undefined,
        nextFollowUpTime: leadData.nextFollowUpTime || undefined,
        notes: leadData.notes?.trim() || undefined,
        assignedStaff: leadData.assignedStaff || 'Owner',
      };

      const nextTasks = [...(prev.followUpTasks || [])];
      if (leadData.nextFollowUpDate) {
        const linkedTask: FollowUpTask = {
          id: `ft-${Date.now() + 1}`,
          personId: newLeadId,
          personType: 'Lead',
          personName: newLead.name,
          personPhone: newLead.phone,
          reason:
            newLead.status === 'Trial'
              ? 'Trial'
              : newLead.status === 'Interested'
              ? 'Interested'
              : 'New enquiry',
          note:
            newLead.notes ||
            `Follow up with ${newLead.name} regarding ${newLead.interestedPlan || 'membership'}`,
          dueDate: leadData.nextFollowUpDate,
          dueTime: leadData.nextFollowUpTime || '10:00 AM',
          status: 'pending',
          assignedStaff: newLead.assignedStaff,
          priority: 'Medium',
          relatedPlan: newLead.interestedPlan,
        };
        nextTasks.unshift(linkedTask);
      }

      return {
        ...prev,
        leads: [newLead, ...currentLeads],
        followUpTasks: nextTasks,
      };
    });
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    updateStore((prev) => {
      let updatedLeadObj: Lead | undefined;
      const updatedLeads = (prev.leads || []).map((l) => {
        if (l.id === leadId) {
          updatedLeadObj = { ...l, ...updates };
          return updatedLeadObj;
        }
        return l;
      });

      let nextTasks = [...(prev.followUpTasks || [])];
      if (updatedLeadObj) {
        nextTasks = nextTasks.map((t) => {
          if (t.personType === 'Lead' && t.personId === leadId && t.status === 'pending') {
            return {
              ...t,
              personName: updatedLeadObj!.name,
              personPhone: updatedLeadObj!.phone,
              dueDate: updates.nextFollowUpDate || t.dueDate,
              dueTime: updates.nextFollowUpTime || t.dueTime,
              relatedPlan: updatedLeadObj!.interestedPlan || t.relatedPlan,
            };
          }
          return t;
        });
      }

      return {
        ...prev,
        leads: updatedLeads,
        followUpTasks: nextTasks,
      };
    });
  };

  const convertLeadToMember = (
    leadId: string,
    conversionOptions?: {
      membershipPlan?: string;
      startDate?: string;
    }
  ): { success: boolean; memberId?: string; message: string } => {
    const targetLead = (currentState.leads || []).find((l) => l.id === leadId);
    if (!targetLead) {
      return { success: false, message: 'Lead record not found.' };
    }

    if (targetLead.status === 'Converted' && targetLead.convertedMemberId) {
      return {
        success: false,
        memberId: targetLead.convertedMemberId,
        message: 'This lead has already been converted into a member.',
      };
    }

    const cleanLeadPhone = targetLead.phone.replace(/[^0-9]/g, '').slice(-10);
    const existingMember = currentState.members.find(
      (m) => m.phone.replace(/[^0-9]/g, '').slice(-10) === cleanLeadPhone
    );

    const todayIso = getLocalIsoDate();

    if (existingMember) {
      updateStore((prev) => ({
        ...prev,
        leads: (prev.leads || []).map((l) =>
          l.id === leadId
            ? {
                ...l,
                status: 'Converted' as const,
                convertedMemberId: existingMember.id,
                convertedDate: todayIso,
              }
            : l
        ),
      }));
      return {
        success: true,
        memberId: existingMember.id,
        message: `Linked to existing member ${existingMember.name} (${existingMember.memberCode}).`,
      };
    }

    const chosenPlanName =
      conversionOptions?.membershipPlan ||
      targetLead.interestedPlan ||
      currentState.plans[0]?.name ||
      'Monthly Plan';
    const matchedPlan = (currentState.plans || []).find(
      (p) => p.name.toLowerCase() === chosenPlanName.toLowerCase()
    );
    const planPrice = matchedPlan
      ? matchedPlan.price
      : chosenPlanName.toLowerCase().includes('annual')
      ? 14000
      : chosenPlanName.toLowerCase().includes('quarter') ||
        chosenPlanName.toLowerCase().includes('3')
      ? 5500
      : chosenPlanName.toLowerCase().includes('6')
      ? 9000
      : 2000;
    const durationDays = matchedPlan ? matchedPlan.durationDays : 30;

    const startIso = conversionOptions?.startDate || todayIso;
    const expDate = new Date(startIso);
    expDate.setDate(expDate.getDate() + durationDays);
    const formattedExpiry = expDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newMemberId = `m-${Date.now()}`;
    const nextMemberCode = `MBR${String(currentState.members.length + 1).padStart(3, '0')}`;

    const newMember: Member = {
      id: newMemberId,
      memberCode: nextMemberCode,
      name: targetLead.name,
      phone: targetLead.phone,
      email: targetLead.email,
      status: 'pending',
      membershipPlan: chosenPlanName,
      planFee: `₹${planPrice.toLocaleString('en-IN')}`,
      startDate: startIso,
      expiryDate: formattedExpiry,
      daysUntilExpiry: durationDays,
      pendingAmount: planPrice,
      lastVisitDate: 'Converted today',
      daysSinceLastVisit: 0,
      visitsThisMonth: 0,
      totalVisits: 0,
      photoUrl: targetLead.photoUrl,
      notes: targetLead.notes,
      assignedTrainer: targetLead.assignedStaff,
    };

    updateStore((prev) => {
      const updatedLeads = (prev.leads || []).map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: 'Converted' as const,
              interestedPlan: chosenPlanName,
              convertedMemberId: newMemberId,
              convertedDate: startIso,
            }
          : l
      );

      const updatedTasks = (prev.followUpTasks || []).map((t) =>
        t.personType === 'Lead' && t.personId === leadId && t.status === 'pending'
          ? {
              ...t,
              status: 'completed' as const,
              completedAt: todayIso,
              outcomeNote: `Converted to member (${nextMemberCode})`,
            }
          : t
      );

      const activity: RecentActivity = {
        id: `act-${Date.now()}`,
        type: 'member_joined',
        title: 'Lead Converted to Member',
        description: `${targetLead.name} (${nextMemberCode}) converted to ${chosenPlanName}`,
        timestamp: 'Just now',
        badgeType: 'purple',
      };

      return {
        ...prev,
        members: [newMember, ...prev.members],
        leads: updatedLeads,
        followUpTasks: updatedTasks,
        activities: [activity, ...prev.activities],
      };
    });

    return {
      success: true,
      memberId: newMemberId,
      message: `${targetLead.name} converted to Member (${nextMemberCode}).`,
    };
  };

  const scheduleFollowUpTask = (taskData: {
    personId: string;
    personType: 'Lead' | 'Member';
    reason: FollowUpReason;
    note: string;
    dueDate: string;
    dueTime?: string;
    assignedStaff?: string;
    priority?: 'High' | 'Medium' | 'Low';
  }) => {
    updateStore((prev) => {
      let personName = '';
      let personPhone = '';
      let personPhotoUrl: string | undefined;
      let relatedPlan: string | undefined;

      if (taskData.personType === 'Lead') {
        const lead = (prev.leads || []).find((l) => l.id === taskData.personId);
        if (lead) {
          personName = lead.name;
          personPhone = lead.phone;
          personPhotoUrl = lead.photoUrl;
          relatedPlan = lead.interestedPlan;
        }
      } else {
        const member = prev.members.find((m) => m.id === taskData.personId);
        if (member) {
          personName = member.name;
          personPhone = member.phone;
          personPhotoUrl = member.photoUrl;
          relatedPlan = member.membershipPlan;
        }
      }

      if (!personName) return prev;

      const newTask: FollowUpTask = {
        id: `ft-${Date.now()}`,
        personId: taskData.personId,
        personType: taskData.personType,
        personName,
        personPhone,
        personPhotoUrl,
        reason: taskData.reason,
        note: taskData.note.trim(),
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime || '10:00 AM',
        status: 'pending',
        assignedStaff: taskData.assignedStaff || 'Owner',
        priority: taskData.priority || 'Medium',
        relatedPlan,
      };

      const updatedLeads =
        taskData.personType === 'Lead'
          ? (prev.leads || []).map((l) =>
              l.id === taskData.personId
                ? {
                    ...l,
                    nextFollowUpDate: taskData.dueDate,
                    nextFollowUpTime: taskData.dueTime || '10:00 AM',
                  }
                : l
            )
          : prev.leads;

      const updatedMembers =
        taskData.personType === 'Member'
          ? prev.members.map((m) => {
              if (m.id === taskData.personId) {
                const memberFlw = {
                  id: newTask.id,
                  memberId: m.id,
                  date: new Date(taskData.dueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                  note: `${taskData.reason}: ${taskData.note.trim()}`,
                  type: (
                    taskData.reason.toLowerCase().includes('renew') ||
                    taskData.reason.toLowerCase().includes('expir')
                      ? 'Renewal'
                      : taskData.reason.toLowerCase().includes('pay')
                      ? 'Payment'
                      : 'Call'
                  ) as 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment',
                  status: 'pending' as const,
                  createdBy: taskData.assignedStaff || 'Owner',
                };
                return {
                  ...m,
                  followUps: [memberFlw, ...(m.followUps || [])],
                };
              }
              return m;
            })
          : prev.members;

      return {
        ...prev,
        leads: updatedLeads,
        members: updatedMembers,
        followUpTasks: [newTask, ...(prev.followUpTasks || [])],
      };
    });
  };

  const completeFollowUpTask = (
    taskId: string,
    outcomeNote?: string,
    nextFollowUp?: {
      dueDate: string;
      dueTime?: string;
      note?: string;
      reason?: FollowUpReason;
    }
  ) => {
    updateStore((prev) => {
      const targetTask = (prev.followUpTasks || []).find((t) => t.id === taskId);
      if (!targetTask) return prev;

      const todayIso = getLocalIsoDate();
      const updatedTasks = (prev.followUpTasks || []).map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'completed' as const,
              completedAt: todayIso,
              outcomeNote: outcomeNote?.trim() || 'Completed',
            }
          : t
      );

      if (nextFollowUp && nextFollowUp.dueDate) {
        const followOnTask: FollowUpTask = {
          id: `ft-${Date.now()}`,
          personId: targetTask.personId,
          personType: targetTask.personType,
          personName: targetTask.personName,
          personPhone: targetTask.personPhone,
          personPhotoUrl: targetTask.personPhotoUrl,
          reason: nextFollowUp.reason || targetTask.reason,
          note: nextFollowUp.note?.trim() || `Follow-up with ${targetTask.personName}`,
          dueDate: nextFollowUp.dueDate,
          dueTime: nextFollowUp.dueTime || '10:00 AM',
          status: 'pending',
          assignedStaff: targetTask.assignedStaff,
          priority: targetTask.priority,
          relatedPlan: targetTask.relatedPlan,
        };
        updatedTasks.unshift(followOnTask);
      }

      const updatedLeads =
        targetTask.personType === 'Lead'
          ? (prev.leads || []).map((l) => {
              if (l.id === targetTask.personId) {
                return {
                  ...l,
                  status: (l.status === 'New' ? 'Contacted' : l.status) as LeadStatus,
                  nextFollowUpDate: nextFollowUp?.dueDate || undefined,
                  nextFollowUpTime: nextFollowUp?.dueTime || undefined,
                };
              }
              return l;
            })
          : prev.leads;

      const updatedMembers =
        targetTask.personType === 'Member'
          ? prev.members.map((m) => {
              if (m.id === targetTask.personId) {
                const updatedMemberFlws = (m.followUps || []).map((f) =>
                  f.id === taskId ? { ...f, status: 'completed' as const } : f
                );
                return { ...m, followUps: updatedMemberFlws };
              }
              return m;
            })
          : prev.members;

      return {
        ...prev,
        leads: updatedLeads,
        members: updatedMembers,
        followUpTasks: updatedTasks,
      };
    });
  };

  const rescheduleFollowUpTask = (
    taskId: string,
    newDueDate: string,
    newDueTime?: string,
    updatedNote?: string
  ) => {
    updateStore((prev) => {
      const targetTask = (prev.followUpTasks || []).find((t) => t.id === taskId);
      if (!targetTask) return prev;

      const updatedTasks = (prev.followUpTasks || []).map((t) =>
        t.id === taskId
          ? {
              ...t,
              dueDate: newDueDate,
              dueTime: newDueTime || t.dueTime || '10:00 AM',
              note: updatedNote?.trim() ? updatedNote.trim() : t.note,
              status: 'pending' as const,
            }
          : t
      );

      const updatedLeads =
        targetTask.personType === 'Lead'
          ? (prev.leads || []).map((l) =>
              l.id === targetTask.personId
                ? {
                    ...l,
                    nextFollowUpDate: newDueDate,
                    nextFollowUpTime: newDueTime || l.nextFollowUpTime,
                  }
                : l
            )
          : prev.leads;

      return {
        ...prev,
        leads: updatedLeads,
        followUpTasks: updatedTasks,
      };
    });
  };

  const addPlan = (planData: Omit<MembershipPlan, 'id' | 'code' | 'createdAt'>) => {
    updateStore((prev) => {
      const currentPlans = prev.plans || [];
      const nextCode = `PLN${String(currentPlans.length + 1).padStart(3, '0')}`;
      const newPlan: MembershipPlan = {
        ...planData,
        id: `plan-${Date.now()}`,
        code: nextCode,
        createdAt: getLocalIsoDate(),
      };
      return {
        ...prev,
        plans: [newPlan, ...currentPlans],
      };
    });
  };

  const updatePlan = (planId: string, updates: Partial<MembershipPlan>) => {
    updateStore((prev) => {
      const oldPlan = (prev.plans || []).find((p) => p.id === planId);
      const updatedPlans = (prev.plans || []).map((p) =>
        p.id === planId ? { ...p, ...updates } : p
      );

      let updatedMembers = prev.members;
      if (oldPlan && updates.name && updates.name !== oldPlan.name) {
        updatedMembers = prev.members.map((m) =>
          m.membershipPlan === oldPlan.name
            ? { ...m, membershipPlan: updates.name! }
            : m
        );
      }

      return {
        ...prev,
        plans: updatedPlans,
        members: updatedMembers,
      };
    });
  };

  const togglePlanStatus = (planId: string) => {
    updateStore((prev) => {
      const updatedPlans = (prev.plans || []).map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            status: (p.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive',
          };
        }
        return p;
      });
      return {
        ...prev,
        plans: updatedPlans,
      };
    });
  };

  const duplicatePlan = (planId: string) => {
    updateStore((prev) => {
      const currentPlans = prev.plans || [];
      const source = currentPlans.find((p) => p.id === planId);
      if (!source) return prev;
      const nextCode = `PLN${String(currentPlans.length + 1).padStart(3, '0')}`;
      const copy: MembershipPlan = {
        ...source,
        id: `plan-${Date.now()}`,
        code: nextCode,
        name: `${source.name} (Copy)`,
        createdAt: getLocalIsoDate(),
      };
      return {
        ...prev,
        plans: [copy, ...currentPlans],
      };
    });
  };

  const deletePlan = (planId: string) => {
    updateStore((prev) => ({
      ...prev,
      plans: (prev.plans || []).filter((p) => p.id !== planId),
    }));
  };

  const updateGymName = (newName: string) => {
    updateStore((prev) => ({
      ...prev,
      gym: { ...prev.gym, name: newName },
    }));
  };

  const updateGymProfile = (updates: Partial<GymProfile>) => {
    updateStore((prev) => {
      const nextGym = { ...prev.gym, ...updates };
      const activity: RecentActivity = {
        id: `act-gym-${Date.now()}`,
        type: 'member_joined',
        title: 'Gym Profile Updated',
        description: `Updated profile details for ${nextGym.name}${nextGym.location ? ` (${nextGym.location})` : ''}`,
        timestamp: 'Just now',
        badgeType: 'info',
      };
      return {
        ...prev,
        gym: nextGym,
        activities: [activity, ...prev.activities],
      };
    });
  };

  const updateGymSettings = (updates: Partial<GymSettings>) => {
    updateStore((prev) => {
      const nextSettings = { ...(prev.settings || INITIAL_SETTINGS), ...updates };
      return {
        ...prev,
        settings: nextSettings,
      };
    });
  };

  const markNotificationRead = (notificationId: string) => {
    updateStore((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
    }));
  };

  const toggleNotificationRead = (notificationId: string) => {
    updateStore((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === notificationId ? { ...n, isRead: !n.isRead } : n
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    updateStore((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, isRead: true })),
    }));
  };

  const dismissNotification = (notificationId: string) => {
    updateStore((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).filter((n) => n.id !== notificationId),
    }));
  };

  const toggleEmptyState = () => {
    updateStore((prev) => ({
      ...prev,
      isEmptyState: !prev.isEmptyState,
    }));
  };

  const addStaffMember = (staffData: {
    name: string;
    role: StaffRole;
    roleLabel: string;
    phone: string;
    email?: string;
    monthlySalary: number;
    shiftLabel?: string;
    employmentType?: 'Full Time' | 'Part Time' | 'Contract';
  }): StaffMember => {
    const existingStaff = currentState.staff || [];
    const nextCode = `STF${String(existingStaff.length + 1).padStart(3, '0')}`;
    const detailed = getDefaultStaffDetailedPermissions(staffData.role);
    const todayIso = getLocalIsoDate();

    const newStaff: StaffMember = {
      id: `stf-${Date.now()}`,
      staffCode: nextCode,
      name: staffData.name.trim(),
      role: staffData.role,
      roleLabel: staffData.roleLabel.trim() || staffData.role,
      phone: staffData.phone.trim(),
      email: staffData.email?.trim() || undefined,
      status: 'active',
      joinedDate: todayIso,
      employmentType: staffData.employmentType || 'Full Time',
      monthlySalary: Math.max(0, staffData.monthlySalary),
      paidSalaryThisMonth: 0,
      pendingSalary: Math.max(0, staffData.monthlySalary),
      shiftLabel: staffData.shiftLabel?.trim() || '6:00 AM – 2:00 PM',
      permissions: {
        manageMembers: Boolean(
          detailed.viewMembers || detailed.addMembers || detailed.editMembers
        ),
        recordPayments: Boolean(detailed.recordPayments),
        markAttendance: Boolean(detailed.recordCheckIns || detailed.correctAttendance),
        viewReports: Boolean(detailed.viewReports),
        manageExpenses: Boolean(detailed.addExpenses || detailed.editExpenses),
        viewSalaries: Boolean(detailed.viewSalaries),
      },
      detailedPermissions: detailed,
      attendanceLogs: [
        {
          date: todayIso,
          status: 'Present',
          checkInTime: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          hoursLogged: '8h 00m',
        },
      ],
    };

    updateStore((prev) => {
      const activity: RecentActivity = {
        id: `act-stf-add-${Date.now()}`,
        type: 'member_joined',
        title: 'New Staff Member Added',
        description: `${newStaff.name} (${newStaff.roleLabel}) added to staff roster`,
        timestamp: 'Just now',
        badgeType: 'info',
      };
      return {
        ...prev,
        staff: [newStaff, ...(prev.staff || [])],
        activities: [activity, ...prev.activities],
      };
    });

    return newStaff;
  };

  const updateStaffMember = (staffId: string, updates: Partial<StaffMember>) => {
    updateStore((prev) => ({
      ...prev,
      staff: (prev.staff || []).map((s) => (s.id === staffId ? { ...s, ...updates } : s)),
    }));
  };

  const markStaffAttendance = (
    staffId: string,
    date: string,
    status: 'Present' | 'Late' | 'Absent',
    hoursLogged?: string
  ) => {
    updateStore((prev) => ({
      ...prev,
      staff: (prev.staff || []).map((s) => {
        if (s.id !== staffId) return s;
        const filteredLogs = (s.attendanceLogs || []).filter((l) => l.date !== date);
        const newLog: StaffAttendanceLog = {
          date,
          status,
          checkInTime: status === 'Absent' ? undefined : '08:00 AM',
          hoursLogged:
            hoursLogged ||
            (status === 'Present' ? '8h 00m' : status === 'Late' ? '7h 15m' : '0h 00m'),
        };
        return {
          ...s,
          attendanceLogs: [newLog, ...filteredLogs],
        };
      }),
    }));
  };

  const payStaffSalary = (staffId: string, amountToPay: number) => {
    updateStore((prev) => {
      let targetStaff: StaffMember | undefined;
      const updatedStaff = (prev.staff || []).map((s) => {
        if (s.id === staffId) {
          targetStaff = s;
          const actualPaid = Math.min(s.pendingSalary, Math.max(0, amountToPay));
          return {
            ...s,
            paidSalaryThisMonth: s.paidSalaryThisMonth + actualPaid,
            pendingSalary: Math.max(0, s.pendingSalary - actualPaid),
          };
        }
        return s;
      });

      if (!targetStaff || amountToPay <= 0) return prev;

      const salaryExpense: Expense = {
        id: `exp-sal-${Date.now()}`,
        title: `Salary Payment - ${targetStaff.name}`,
        category: 'Staff',
        amount: amountToPay,
        date: getLocalIsoDate(),
        month: getLocalMonthLabel(),
        paidTo: targetStaff.name,
        paymentMethod: 'Bank Transfer',
        status: 'paid',
        notes: `${targetStaff.roleLabel} salary disbursement`,
      };

      return {
        ...prev,
        staff: updatedStaff,
        expenses: [salaryExpense, ...prev.expenses],
      };
    });
  };

  const saveStaffPermissions = (
    staffId: string,
    detailed: StaffDetailedPermissions,
    updatedRole?: StaffRole,
    updatedRoleLabel?: string
  ) => {
    updateStore((prev) => {
      let staffName = '';
      const updatedStaff = (prev.staff || []).map((s) => {
        if (s.id !== staffId) return s;
        staffName = s.name;
        const summaryPermissions = {
          manageMembers: Boolean(
            detailed.viewMembers || detailed.addMembers || detailed.editMembers
          ),
          recordPayments: Boolean(detailed.recordPayments),
          markAttendance: Boolean(detailed.recordCheckIns || detailed.correctAttendance),
          viewReports: Boolean(detailed.viewReports),
          manageExpenses: Boolean(detailed.addExpenses || detailed.editExpenses),
          viewSalaries: Boolean(detailed.viewSalaries),
        };
        return {
          ...s,
          role: updatedRole || s.role,
          roleLabel: updatedRoleLabel || s.roleLabel,
          permissions: summaryPermissions,
          detailedPermissions: detailed,
        };
      });

      if (!staffName) return prev;

      const enabledCount = Object.values(detailed).filter(Boolean).length;
      const auditActivity: RecentActivity = {
        id: `act-perm-${Date.now()}`,
        type: 'member_joined',
        title: 'Staff Permissions Updated',
        description: `Updated access permissions for ${staffName} (${enabledCount} permissions enabled)`,
        timestamp: 'Just now',
        badgeType: 'info',
      };

      return {
        ...prev,
        staff: updatedStaff,
        activities: [auditActivity, ...prev.activities],
      };
    });
  };

  const toggleStaffActiveStatus = (staffId: string) => {
    updateStore((prev) => {
      let targetName = '';
      let nextStatus: 'active' | 'inactive' = 'inactive';

      const updatedStaff = (prev.staff || []).map((s) => {
        if (s.id !== staffId) return s;
        targetName = s.name;
        nextStatus = s.status === 'active' ? 'inactive' : 'active';
        return {
          ...s,
          status: nextStatus,
        };
      });

      if (!targetName) return prev;

      const auditActivity: RecentActivity = {
        id: `act-stf-${Date.now()}`,
        type: 'member_joined',
        title: nextStatus === 'inactive' ? 'Staff Member Deactivated' : 'Staff Member Reactivated',
        description: `${targetName} marked as ${nextStatus}. Historical attendance & salary records preserved.`,
        timestamp: 'Just now',
        badgeType: nextStatus === 'inactive' ? 'warning' : 'success',
      };

      return {
        ...prev,
        staff: updatedStaff,
        activities: [auditActivity, ...prev.activities],
      };
    });
  };

  const createSupportTicket = (ticketData: {
    category: SupportTicket['category'];
    subject: string;
    description: string;
    attachmentName?: string;
  }): SupportTicket => {
    const existing = currentState.supportTickets || [];
    const nextNum = existing.length + 1;
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());

    const ticket: SupportTicket = {
      id: `sup-${Date.now()}`,
      ticketCode: `#SUP-${String(nextNum).padStart(3, '0')}`,
      category: ticketData.category,
      subject: ticketData.subject.trim(),
      description: ticketData.description.trim(),
      attachmentName: ticketData.attachmentName,
      createdAt: formattedDate,
      status: 'Open',
    };

    updateStore((prev) => ({
      ...prev,
      supportTickets: [ticket, ...(prev.supportTickets || [])],
    }));

    return ticket;
  };

  const addComplaint = (data: {
    category: ComplaintCategory;
    title: string;
    description: string;
    memberId?: string;
    reporterName: string;
    assignedStaffId?: string;
    assignedStaffName?: string;
    attachmentName?: string;
  }): ComplaintRecord => {
    const existing = currentState.complaints || [];
    const nextNum = existing.length + 1;
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(now);
    const formattedTime = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(now)
      .toUpperCase();
    const createdAtStr = `${formattedDate}, ${formattedTime}`;
    const createdDateIso = getLocalIsoDate(now);

    const newComplaint: ComplaintRecord = {
      id: `cmp-${Date.now()}`,
      referenceNumber: `#CMP-${String(nextNum).padStart(3, '0')}`,
      category: data.category,
      title: data.title.trim(),
      description: data.description.trim(),
      memberId: data.memberId,
      reporterName: data.reporterName.trim() || 'Gym Member',
      createdAt: createdAtStr,
      createdDateIso,
      status: 'Open',
      assignedStaffId: data.assignedStaffId,
      assignedStaffName: data.assignedStaffName,
      attachmentName: data.attachmentName,
      history: [
        {
          id: `ch-${Date.now()}`,
          timestamp: createdAtStr,
          action: 'Complaint created',
          note: data.description.trim(),
          actor: data.reporterName.trim() || 'Gym Owner',
        },
      ],
    };

    updateStore((prev) => {
      const activity: RecentActivity = {
        id: `act-cmp-${Date.now()}`,
        type: 'member_joined',
        title: `New Complaint (${newComplaint.referenceNumber})`,
        description: `${newComplaint.title} reported by ${newComplaint.reporterName}`,
        timestamp: 'Just now',
        badgeType: 'warning',
      };
      return {
        ...prev,
        complaints: [newComplaint, ...(prev.complaints || [])],
        activities: [activity, ...prev.activities],
      };
    });

    return newComplaint;
  };

  const updateComplaintStatus = (
    complaintId: string,
    nextStatus: ComplaintStatus,
    note?: string,
    actorName: string = 'Gym Owner'
  ) => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(now);
    const formattedTime = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(now)
      .toUpperCase();
    const timestampStr = `${formattedDate}, ${formattedTime}`;

    updateStore((prev) => ({
      ...prev,
      complaints: (prev.complaints || []).map((c) => {
        if (c.id !== complaintId) return c;
        const historyEntry = {
          id: `ch-${Date.now()}`,
          timestamp: timestampStr,
          action: `Status updated to ${nextStatus}`,
          note: note?.trim() || undefined,
          actor: actorName,
        };
        return {
          ...c,
          status: nextStatus,
          resolutionNote:
            nextStatus === 'Resolved'
              ? note?.trim() || c.resolutionNote || 'Issue resolved and verified.'
              : c.resolutionNote,
          resolvedAt: nextStatus === 'Resolved' ? timestampStr : c.resolvedAt,
          history: [...(c.history || []), historyEntry],
        };
      }),
    }));
  };

  const assignComplaintStaff = (
    complaintId: string,
    staffId: string,
    staffName: string,
    actorName: string = 'Gym Owner'
  ) => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(now);
    const formattedTime = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(now)
      .toUpperCase();
    const timestampStr = `${formattedDate}, ${formattedTime}`;

    updateStore((prev) => ({
      ...prev,
      complaints: (prev.complaints || []).map((c) => {
        if (c.id !== complaintId) return c;
        const historyEntry = {
          id: `ch-asg-${Date.now()}`,
          timestamp: timestampStr,
          action: `Assigned to ${staffName}`,
          actor: actorName,
        };
        return {
          ...c,
          assignedStaffId: staffId,
          assignedStaffName: staffName,
          history: [...(c.history || []), historyEntry],
        };
      }),
    }));
  };

  const addComplaintResolutionNote = (
    complaintId: string,
    noteText: string,
    actorName: string = 'Gym Owner'
  ) => {
    if (!noteText.trim()) return;
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(now);
    const formattedTime = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(now)
      .toUpperCase();
    const timestampStr = `${formattedDate}, ${formattedTime}`;

    updateStore((prev) => ({
      ...prev,
      complaints: (prev.complaints || []).map((c) => {
        if (c.id !== complaintId) return c;
        const historyEntry = {
          id: `ch-note-${Date.now()}`,
          timestamp: timestampStr,
          action: 'Resolution / progress note added',
          note: noteText.trim(),
          actor: actorName,
        };
        return {
          ...c,
          resolutionNote: noteText.trim(),
          history: [...(c.history || []), historyEntry],
        };
      }),
    }));
  };

  const saveOnboardingProgress = (partial: Partial<OnboardingPreferences>) => {
    updateStore((prev) => ({
      ...prev,
      onboarding: {
        ...(prev.onboarding || INITIAL_ONBOARDING),
        ...partial,
      },
    }));
  };

  const completeOnboarding = (payload: {
    gymProfile?: Partial<GymProfile>;
    settings?: Partial<GymSettings>;
    onboarding?: Partial<OnboardingPreferences>;
    updatedPlanPrices?: Record<string, number>;
    startWithEmptyGym?: boolean;
  }) => {
    updateStore((prev) => {
      const nextGym = payload.gymProfile ? { ...prev.gym, ...payload.gymProfile } : prev.gym;
      const nextSettings = payload.settings
        ? { ...prev.settings, ...payload.settings }
        : prev.settings;
      const nextOnboarding: OnboardingPreferences = {
        ...(prev.onboarding || INITIAL_ONBOARDING),
        ...(payload.onboarding || {}),
        currentStep: 'complete',
        hasCompletedOnboarding: true,
        completedAt: new Date().toISOString(),
      };

      // If the user selected real offered plans during onboarding and no plans exist yet, create starter plans for those durations
      let nextPlans = [...(prev.plans || [])];
      if (
        nextPlans.length === 0 &&
        nextOnboarding.offeredPlans?.length &&
        !nextOnboarding.offeredPlans.includes("Haven't created plans yet")
      ) {
        const todayIso = getLocalIsoDate();
        const planTemplates: Array<{
          match: string;
          name: string;
          durationValue: number;
          durationUnit: 'days' | 'months';
          durationDays: number;
          durationLabel: string;
          price: number;
        }> = [
          {
            match: 'Monthly',
            name: 'Monthly Plan',
            durationValue: 1,
            durationUnit: 'months',
            durationDays: 30,
            durationLabel: '1 Month (30 Days)',
            price: 2000,
          },
          {
            match: 'Quarterly',
            name: 'Quarterly Plan',
            durationValue: 3,
            durationUnit: 'months',
            durationDays: 90,
            durationLabel: '3 Months (90 Days)',
            price: 5500,
          },
          {
            match: 'Half-yearly',
            name: 'Half-Yearly Plan',
            durationValue: 6,
            durationUnit: 'months',
            durationDays: 180,
            durationLabel: '6 Months (180 Days)',
            price: 9500,
          },
          {
            match: 'Annual',
            name: 'Annual Plan',
            durationValue: 12,
            durationUnit: 'months',
            durationDays: 365,
            durationLabel: '12 Months (365 Days)',
            price: 15000,
          },
        ];

        planTemplates.forEach((tpl, idx) => {
          if (nextOnboarding.offeredPlans?.includes(tpl.match)) {
            nextPlans.push({
              id: `plan-onb-${idx + 1}`,
              code: `PLN00${nextPlans.length + 1}`,
              name: tpl.name,
              durationValue: tpl.durationValue,
              durationUnit: tpl.durationUnit,
              durationDays: tpl.durationDays,
              durationLabel: tpl.durationLabel,
              price: tpl.price,
              status: 'active',
              isCustom: false,
              description: `${tpl.name} configured during gym setup.`,
              features: ['Gym Floor Access', 'Cardio & Strength Zone'],
              createdAt: todayIso,
              category: 'General',
            });
          }
        });

        if (
          nextOnboarding.offeredPlans.includes('Custom duration') &&
          nextOnboarding.customPlanDuration?.trim()
        ) {
          nextPlans.push({
            id: `plan-onb-custom`,
            code: `PLN00${nextPlans.length + 1}`,
            name: nextOnboarding.customPlanDuration.trim(),
            durationValue: 30,
            durationUnit: 'days',
            durationDays: 30,
            durationLabel: nextOnboarding.customPlanDuration.trim(),
            price: 1500,
            status: 'active',
            isCustom: true,
            description: 'Custom membership plan created during setup.',
            features: ['Gym Floor Access'],
            createdAt: todayIso,
            category: 'Custom',
          });
        }
      }

      if (payload.updatedPlanPrices) {
        nextPlans = nextPlans.map((p) =>
          payload.updatedPlanPrices && payload.updatedPlanPrices[p.id] !== undefined
            ? { ...p, price: payload.updatedPlanPrices[p.id] }
            : p
        );
      }

      return {
        ...prev,
        gym: nextGym,
        settings: nextSettings,
        onboarding: nextOnboarding,
        plans: nextPlans,
        isEmptyState: false,
      };
    });
  };

  const resetOnboarding = () => {
    updateStore((prev) => ({
      ...prev,
      onboarding: {
        ...INITIAL_ONBOARDING,
        hasCompletedOnboarding: false,
        currentStep: 'welcome',
      },
    }));
  };

  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = loadGymData();
    currentState = fresh;
    listeners.forEach((l) => l(fresh));
  };

  const importMembersBatch = (
    rows: Array<
      Omit<Member, 'id'> & {
        initialPaidAmount?: number;
        paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
      }
    >
  ): { importedCount: number; skippedDuplicatesCount: number } => {
    let importedCount = 0;
    let skippedDuplicatesCount = 0;

    updateStore((prev) => {
      const existingPhones = new Set(
        prev.members
          .map((m) => (m.phone || '').replace(/[^0-9]/g, '').slice(-10))
          .filter((p) => p.length === 10)
      );
      const existingNameKeys = new Set(
        prev.members.map(
          (m) =>
            `${m.name.trim().toLowerCase()}|${(m.phone || '').replace(/[^0-9]/g, '').slice(-10)}`
        )
      );

      const addedMembers: Member[] = [];
      const nextPayments = [...prev.payments];
      const todayIso = getLocalIsoDate();
      const prefix = prev.settings?.receiptPrefix || 'PAY';
      let memberSeq = prev.members.length + 1;
      let paymentSeq = prev.payments.length + 1;

      rows.forEach((row, idx) => {
        const cleanPhone = (row.phone || '').replace(/[^0-9]/g, '').slice(-10);
        const nameKey = `${(row.name || '').trim().toLowerCase()}|${cleanPhone}`;

        if (
          (cleanPhone.length === 10 && existingPhones.has(cleanPhone)) ||
          existingNameKeys.has(nameKey)
        ) {
          skippedDuplicatesCount++;
          return;
        }

        if (cleanPhone.length === 10) existingPhones.add(cleanPhone);
        existingNameKeys.add(nameKey);

        const nextCode = `MBR${String(memberSeq++).padStart(3, '0')}`;
        const memberId = `m-imp-${Date.now()}-${idx}`;
        const parsedPlanFee =
          parseInt(String(row.planFee || '').replace(/[^0-9]/g, ''), 10) || 0;
        const pendingAmt = Math.max(0, row.pendingAmount || 0);
        const paidNow =
          row.initialPaidAmount !== undefined
            ? Math.max(0, row.initialPaidAmount)
            : Math.max(0, parsedPlanFee - pendingAmt);

        const { initialPaidAmount, paymentMethod, ...memberFields } = row;

        const member: Member = {
          ...memberFields,
          id: memberId,
          memberCode: row.memberCode || nextCode,
          status: pendingAmt > 0 ? 'pending' : row.status || 'active',
          visitsThisMonth: row.visitsThisMonth ?? 0,
          totalVisits: row.totalVisits ?? 0,
        };

        addedMembers.push(member);
        importedCount++;

        if (paidNow > 0 || pendingAmt > 0) {
          const payment: Payment = {
            id: `p-imp-${Date.now()}-${idx}`,
            memberId: member.id,
            memberName: member.name,
            memberCode: member.memberCode,
            amount: paidNow,
            planFee: parsedPlanFee || paidNow + pendingAmt,
            previouslyPaid: 0,
            pendingAmount: pendingAmt,
            date: member.startDate || todayIso,
            time: '10:00 AM',
            month: getLocalMonthLabel(),
            status:
              pendingAmt > 0 ? (paidNow > 0 ? 'partial' : 'pending') : 'completed',
            paymentMethod: paymentMethod || prev.settings?.defaultPaymentMethod || 'UPI',
            plan: member.membershipPlan,
            receiptNumber: `${prefix}${String(paymentSeq++).padStart(5, '0')}`,
          };
          nextPayments.unshift(payment);
        }
      });

      if (addedMembers.length === 0) return prev;

      const activity: RecentActivity = {
        id: `act-imp-${Date.now()}`,
        type: 'member_joined',
        title: `Imported ${addedMembers.length} Member${addedMembers.length === 1 ? '' : 's'}`,
        description: `Bulk imported ${addedMembers.length} member record${
          addedMembers.length === 1 ? '' : 's'
        } via CSV/Excel.`,
        timestamp: 'Just now',
        badgeType: 'purple',
      };

      return {
        ...prev,
        members: [...addedMembers, ...prev.members],
        payments: nextPayments,
        activities: [activity, ...prev.activities],
      };
    });

    return { importedCount, skippedDuplicatesCount };
  };

  const addPaymentPromise = (data: {
    memberId: string;
    promisedAmount: number;
    promisedDate: string;
    note?: string;
  }) => {
    updateStore((prev) => {
      const member = prev.members.find((m) => m.id === data.memberId);
      if (!member) return prev;
      const todayIso = getLocalIsoDate();
      const promise: PaymentPromise = {
        id: `prm-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        memberCode: member.memberCode || member.id,
        memberPhone: member.phone,
        promisedAmount: Math.max(0, data.promisedAmount),
        promisedDate: data.promisedDate || todayIso,
        createdAt: todayIso,
        status: 'pending',
        note: data.note?.trim() || undefined,
        planName: member.membershipPlan,
      };
      return {
        ...prev,
        paymentPromises: [promise, ...(prev.paymentPromises || [])],
      };
    });
  };

  const updatePaymentPromise = (
    promiseId: string,
    updates: Partial<PaymentPromise>
  ) => {
    updateStore((prev) => ({
      ...prev,
      paymentPromises: (prev.paymentPromises || []).map((p) =>
        p.id === promiseId ? { ...p, ...updates } : p
      ),
    }));
  };

  const cancelPaymentPromise = (promiseId: string) => {
    updateStore((prev) => ({
      ...prev,
      paymentPromises: (prev.paymentPromises || []).map((p) =>
        p.id === promiseId ? { ...p, status: 'cancelled' as const } : p
      ),
    }));
  };

  const completePaymentPromise = (promiseId: string) => {
    const todayIso = getLocalIsoDate();
    updateStore((prev) => ({
      ...prev,
      paymentPromises: (prev.paymentPromises || []).map((p) =>
        p.id === promiseId
          ? { ...p, status: 'completed' as const, completedAt: todayIso }
          : p
      ),
    }));
  };

  const saveCashReconciliation = (
    date: string,
    physicalCashCounted: number,
    recordedCashAmount: number,
    note?: string
  ) => {
    updateStore((prev) => {
      const recId = `rec-${date}`;
      const record: CashReconciliation = {
        id: recId,
        date,
        recordedCashAmount,
        physicalCashCounted,
        difference: physicalCashCounted - recordedCashAmount,
        note: note?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      const existing = (prev.cashReconciliations || []).filter((r) => r.date !== date && r.id !== recId);
      return {
        ...prev,
        cashReconciliations: [record, ...existing],
      };
    });
  };

  return {
    state,
    addMember,
    importMembersBatch,
    updateMember,
    archiveMember,
    recordPayment,
    reversePayment,
    addPaymentPromise,
    updatePaymentPromise,
    cancelPaymentPromise,
    completePaymentPromise,
    saveCashReconciliation,
    renewMembership,
    addFollowUp,
    addLead,
    updateLead,
    convertLeadToMember,
    scheduleFollowUpTask,
    completeFollowUpTask,
    rescheduleFollowUpTask,
    markAttendance,
    unmarkAttendance,
    addExpense,
    updateExpense,
    deleteExpense,
    addPlan,
    updatePlan,
    togglePlanStatus,
    duplicatePlan,
    deletePlan,
    addStaffMember,
    updateStaffMember,
    markStaffAttendance,
    payStaffSalary,
    saveStaffPermissions,
    toggleStaffActiveStatus,
    createSupportTicket,
    addComplaint,
    updateComplaintStatus,
    assignComplaintStaff,
    addComplaintResolutionNote,
    updateGymName,
    updateGymProfile,
    updateGymSettings,
    markNotificationRead,
    toggleNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    saveOnboardingProgress,
    completeOnboarding,
    resetOnboarding,
    toggleEmptyState,
    resetToDefault,
    setFullGymStore,
  };
}
