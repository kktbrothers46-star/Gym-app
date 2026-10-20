/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GymProfile {
  id: string;
  name: string;
  ownerName: string;
  location: string;
  currency: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  gstNumber?: string;
  openingHours?: string;
  sundayHours?: string;
  establishedYear?: string;
  branchCode?: string;
}

export interface GymSettings {
  // Payment & Billing
  acceptedPaymentMethods: Array<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>;
  defaultPaymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  upiId: string;
  receiptPrefix: string;
  enableGstBilling: boolean;
  gstPercentage: number;
  allowPartialPayments: boolean;
  // Membership & Attendance Rules
  renewalGracePeriodDays: number;
  expiryReminderDays: number;
  autoMarkInactiveDays: number;
  allowCheckInWithPendingDues: boolean;
  blockExpiredMemberCheckIn: boolean;
  defaultCheckInMethod: 'Manual' | 'QR_Scan' | 'Member_ID';
  // Notification Preferences
  notifyMembershipExpiry: boolean;
  notifyPendingPayments: boolean;
  notifyInactiveMembers: boolean;
  notifyNewLeadsAndFollowUps: boolean;
  notifyDailySummary: boolean;
  notifyStaffAttendanceAndSalary: boolean;
  whatsappRemindersEnabled: boolean;
  whatsappRenewalTemplate: string;
  whatsappPaymentTemplate: string;
}

export interface OnboardingPreferences {
  hasCompletedOnboarding: boolean;
  currentStep?:
    | 'welcome'
    | 'role'
    | 'member_coming_soon'
    | 'gym_name'
    | 'member_count'
    | 'management_method'
    | 'challenges'
    | 'plans'
    | 'payment_methods'
    | 'complete';
  selectedRole?: 'owner' | 'member' | null;
  gymName?: string;
  memberCountOption?: string;
  customMemberCount?: string;
  managementMethod?: string;
  customManagementMethod?: string;
  challenges?: string[];
  customChallenge?: string;
  offeredPlans?: string[];
  customPlanDuration?: string;
  paymentMethods?: string[];
  customPaymentMethod?: string;
  completedAt?: string;
}

export type NotificationCategory =
  | 'Renewal'
  | 'Payment'
  | 'Follow-Up'
  | 'Attendance'
  | 'Staff'
  | 'System';

export interface GymNotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  dateGroup: 'Today' | 'Yesterday' | 'Earlier';
  isRead: boolean;
  memberId?: string;
  memberName?: string;
  staffId?: string;
  amount?: number;
  actionLabel?: string;
  actionTarget?:
    | 'renewals'
    | 'payments'
    | 'followups'
    | 'members'
    | 'attendance'
    | 'staff'
    | 'revenue_report'
    | 'record_payment'
    | 'renew_member';
}

export interface FollowUpItem {
  id: string;
  memberId: string;
  date: string;
  note: string;
  type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment';
  status: 'pending' | 'completed';
  createdBy?: string;
}

export interface Member {
  id: string;
  memberCode?: string; // e.g. "MBR001"
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'expiring' | 'expired' | 'pending' | 'inactive';
  membershipPlan: string;
  planFee?: string; // e.g. "₹2,000 / month" or "₹5,500"
  startDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  pendingAmount: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  photoUrl?: string;
  gender?: 'Male' | 'Female' | 'Other';
  emergencyContact?: string;
  notes?: string;
  // Extended fields for Member Detail Screen
  visitsThisMonth?: number;
  totalVisits?: number;
  attendanceStreak?: number;
  weightProgress?: {
    currentKg: number;
    targetKg?: number;
    initialKg?: number;
    lastUpdated?: string;
  };
  fitnessGoal?: string; // e.g. "Hypertrophy / Fat Loss"
  assignedTrainer?: string; // e.g. "Coach Dev (Senior Strength)"
  lockerNumber?: string;
  followUps?: FollowUpItem[];
  lastRenewedDate?: string; // ISO date e.g. "YYYY-MM-DD"
  membershipHistory?: MembershipHistoryItem[];
  leavingReason?: 'Membership Expired' | 'Personal Reasons' | 'Financial Issues' | 'Moved Away' | 'Other';
  lostDate?: string; // ISO date e.g. "YYYY-MM-DD"
}

export interface MembershipHistoryItem {
  id: string;
  planName: string;
  planFee: string;
  startDate: string;
  expiryDate: string;
  renewedAt?: string;
  status: 'completed' | 'active' | 'expired';
}

export interface RenewalRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberCode?: string;
  previousPlan: string;
  previousExpiryDate: string;
  newPlan: string;
  newExpiryDate: string;
  planFee: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  renewedAt: string; // e.g. "YYYY-MM-DD"
  month: string; // e.g. "MMM YYYY"
  status: 'completed' | 'failed';
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  memberCode?: string;
  amount: number;
  planFee?: number;
  previouslyPaid?: number;
  pendingAmount?: number;
  date: string;
  time?: string;
  dueDate?: string;
  month: string; // e.g. "MMM YYYY"
  status: 'completed' | 'partial' | 'pending' | 'overdue' | 'refunded';
  paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
  plan: string;
  receiptNumber?: string;
  referenceId?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Utilities'
  | 'Staff'
  | 'Trainer Salaries'
  | 'Maintenance'
  | 'Equipment'
  | 'Supplies'
  | 'Supplements'
  | 'Marketing'
  | 'Other';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  month: string;
  paidTo?: string;
  paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  status?: 'paid' | 'unpaid';
  notes?: string;
  receiptRef?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberCode?: string;
  date?: string; // ISO date e.g. "YYYY-MM-DD"
  checkInTime?: string; // e.g. "07:15 AM"
  timestamp: string;
  type: 'check_in' | 'check_out';
  method: 'QR_Scan' | 'Manual' | 'Biometric' | 'Member_ID';
  notes?: string;
  markedBy?: string;
}

export interface RecentActivity {
  id: string;
  type: 'member_joined' | 'payment_received' | 'attendance' | 'expense' | 'renewal';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  badgeType: 'success' | 'info' | 'warning' | 'purple';
}

export interface MonthlyMetric {
  month: string;
  shortMonth: string;
  revenue: number;
  members: number;
  attendance: number;
}

export interface MembershipPlan {
  id: string;
  code: string;
  name: string;
  durationValue: number;
  durationUnit: 'days' | 'months';
  durationDays: number;
  durationLabel: string;
  price: number;
  registrationFee?: number;
  status: 'active' | 'inactive';
  isCustom: boolean;
  description: string;
  features: string[];
  createdAt: string;
  category?: 'General' | 'Personal Training' | 'Special' | 'Custom';
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Joined'
  | 'Not Interested'
  | 'Trial'
  | 'Converted'
  | 'Lost';

export type LeadSource =
  | 'Walk-in'
  | 'Referral'
  | 'Friend Referral'
  | 'Phone'
  | 'Instagram'
  | 'Social Media'
  | 'Website'
  | 'Other';

export interface Lead {
  id: string;
  leadCode: string; // e.g. "LD001"
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  enquiryDate: string; // ISO date e.g. "YYYY-MM-DD"
  interestedPlan?: string;
  status: LeadStatus;
  nextFollowUpDate?: string; // ISO date e.g. "YYYY-MM-DD"
  nextFollowUpTime?: string; // e.g. "10:00 AM"
  notes?: string;
  assignedStaff?: string;
  convertedMemberId?: string;
  convertedDate?: string;
  lostReason?: string;
  photoUrl?: string;
}

export type FollowUpReason =
  | 'New enquiry'
  | 'Trial follow-up'
  | 'Membership renewal'
  | 'Membership expiry'
  | 'Pending payment'
  | 'Inactive member'
  | 'General check-in'
  | 'Interested'
  | 'Trial'
  | 'Contacted'
  | 'Renewal'
  | 'Payment'
  | 'Other';

export interface FollowUpTask {
  id: string;
  personId: string; // lead.id or member.id
  personType: 'Lead' | 'Member';
  personName: string;
  personPhone: string;
  personPhotoUrl?: string;
  reason: FollowUpReason;
  note: string;
  dueDate: string; // ISO date e.g. "YYYY-MM-DD"
  dueTime?: string; // e.g. "10:00 AM"
  status: 'pending' | 'completed';
  completedAt?: string;
  outcomeNote?: string;
  assignedStaff?: string;
  priority?: 'High' | 'Medium' | 'Low';
  relatedPlan?: string;
}

export type StaffRole = 'Trainer' | 'Reception' | 'Management' | 'Maintenance';

export interface StaffAttendanceLog {
  date: string; // ISO date e.g. "YYYY-MM-DD"
  status: 'Present' | 'Late' | 'Absent';
  checkInTime?: string; // e.g. "06:45 AM"
  hoursLogged?: string; // e.g. "8h 15m"
}

export interface StaffDetailedPermissions {
  // Members (3)
  viewMembers: boolean;
  addMembers: boolean;
  editMembers: boolean;
  // Attendance (3)
  viewAttendance: boolean;
  recordCheckIns: boolean;
  correctAttendance: boolean;
  // Membership Plans (3)
  viewPlans: boolean;
  createPlans: boolean;
  editPlans: boolean;
  // Payments (4)
  viewPayments: boolean;
  recordPayments: boolean;
  viewBalances: boolean;
  paymentCorrections: boolean;
  // Expenses (3)
  viewExpenses: boolean;
  addExpenses: boolean;
  editExpenses: boolean;
  // Reports (3)
  viewReports: boolean;
  exportReports: boolean;
  viewSalaries: boolean;
  // Staff (3)
  viewStaff: boolean;
  manageStaff: boolean;
  changeStaffPermissions: boolean;
  // Settings (2)
  viewSettings: boolean;
  modifySettings: boolean;
}

export interface StaffMember {
  id: string;
  staffCode: string; // e.g. "STF001"
  name: string;
  role: StaffRole;
  roleLabel: string; // e.g. "Senior Strength Trainer", "Receptionist", "Manager"
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  employmentType?: 'Full Time' | 'Part Time' | 'Contract';
  monthlySalary: number;
  paidSalaryThisMonth: number;
  pendingSalary: number;
  photoUrl?: string;
  shiftLabel?: string; // e.g. "6:00 AM – 2:30 PM"
  permissions: {
    manageMembers: boolean;
    recordPayments: boolean;
    markAttendance: boolean;
    viewReports: boolean;
    manageExpenses: boolean;
    viewSalaries: boolean;
  };
  detailedPermissions?: StaffDetailedPermissions;
  attendanceLogs: StaffAttendanceLog[];
}

export interface SupportTicket {
  id: string;
  ticketCode: string; // e.g. "#SUP-001"
  category:
    | 'Members & Registration'
    | 'Membership Plans'
    | 'Payments & Balances'
    | 'Attendance'
    | 'Staff & Permissions'
    | 'Expenses & Reports'
    | 'Account & Settings'
    | 'Other';
  subject: string;
  description: string;
  attachmentName?: string;
  createdAt: string; // e.g. "DD MMM YYYY"
  status: 'Open' | 'In Progress' | 'Resolved';
}

export type ComplaintCategory =
  | 'Equipment'
  | 'Behaviour'
  | 'Cleanliness'
  | 'Billing'
  | 'Feedback'
  | 'Facility';

export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved';

export interface ComplaintHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  note?: string;
  actor: string;
}

export interface ComplaintRecord {
  id: string;
  referenceNumber: string; // e.g. "#CMP-006"
  category: ComplaintCategory;
  title: string;
  description: string;
  memberId?: string;
  reporterName: string;
  createdAt: string; // e.g. "DD MMM YYYY, hh:mm A"
  createdDateIso: string; // e.g. "YYYY-MM-DD"
  status: ComplaintStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  attachmentName?: string;
  history: ComplaintHistoryEntry[];
}

export interface GymStoreState {
  gym: GymProfile;
  settings: GymSettings;
  onboarding: OnboardingPreferences;
  notifications: GymNotificationItem[];
  members: Member[];
  plans: MembershipPlan[];
  renewals: RenewalRecord[];
  payments: Payment[];
  expenses: Expense[];
  leads: Lead[];
  followUpTasks: FollowUpTask[];
  attendance: AttendanceRecord[];
  staff: StaffMember[];
  supportTickets: SupportTicket[];
  complaints: ComplaintRecord[];
  activities: RecentActivity[];
  monthlyMetrics: MonthlyMetric[];
  selectedMonth: string;
  isEmptyState: boolean;
  // Computed Summary Metrics
  activeMembersCount: number;
  totalMembersCount: number;
  collectedThisMonth: number;
  pendingPaymentsTotal: number;
  operatingProfit: number;
  overdueCount: number;
  overdueTotal: number;
  expiringSoonCount: number;
  inactiveCount: number;
}
