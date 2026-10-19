/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Users,
  CreditCard,
  Wallet,
  CalendarCheck,
  Shield,
  BarChart3,
  Settings,
  RefreshCw,
  MessageCircle,
  Mail,
  AlertTriangle,
  FileText,
  Check,
  ArrowRight,
  Paperclip,
} from 'lucide-react';
import { SupportTicket } from '../../types/dashboard';
import { ReportTabType } from '../reports/RetentionReportScreen';

interface HelpSupportScreenProps {
  supportTickets: SupportTicket[];
  onBack: () => void;
  onSelectReportTab?: (tab: ReportTabType) => void;
  onCreateSupportTicket: (data: {
    category: SupportTicket['category'];
    subject: string;
    description: string;
    attachmentName?: string;
  }) => SupportTicket;
  onNavigateToDestination?: (
    destination:
      | 'members'
      | 'plans'
      | 'payments'
      | 'attendance'
      | 'staff_report'
      | 'reports'
      | 'renewals'
      | 'home'
  ) => void;
}

interface HelpCategoryItem {
  id: string;
  title: SupportTicket['category'] | 'Renewals & Follow-Ups';
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  destination:
    | 'members'
    | 'plans'
    | 'payments'
    | 'attendance'
    | 'staff_report'
    | 'reports'
    | 'renewals'
    | 'home';
  destinationLabel: string;
  steps: string[];
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const HELP_CATEGORIES: HelpCategoryItem[] = [
  {
    id: 'cat-members',
    title: 'Members & Registration',
    subtitle: 'Add, edit and manage members',
    icon: <Users className="w-4 h-4 text-[#2563EB]" />,
    iconBg: 'bg-[#DBEAFE]',
    destination: 'members',
    destinationLabel: 'Open Members Directory',
    steps: [
      'Open the Home dashboard or the Members tab and tap "+ Add Member".',
      'Enter the member’s full name, 10-digit Indian mobile number, and select a Membership Plan.',
      'Choose the start date and whether the member is paying in full, making a partial payment, or keeping the balance pending.',
      'Tap any member row in the directory to open Member Detail, edit profile details, log follow-ups, or view attendance and payment history.',
    ],
  },
  {
    id: 'cat-plans',
    title: 'Membership Plans',
    subtitle: 'Create and manage plans',
    icon: <CreditCard className="w-4 h-4 text-[#7C3AED]" />,
    iconBg: 'bg-[#F3E8FF]',
    destination: 'plans',
    destinationLabel: 'Open Membership Plans',
    steps: [
      'Open the Plans tab in the bottom navigation bar.',
      'Tap "+ Add Plan" to create a new plan with custom duration (days or months), price in ₹ INR, and included features.',
      'Use the card menu on any plan to Edit pricing, Duplicate a tier, or toggle Active/Inactive status.',
      'Renaming a plan automatically keeps existing member records assigned to that plan synchronized.',
    ],
  },
  {
    id: 'cat-payments',
    title: 'Payments & Balances',
    subtitle: 'Payments, dues and refunds',
    icon: <Wallet className="w-4 h-4 text-[#D97706]" />,
    iconBg: 'bg-[#FEF3C7]',
    destination: 'payments',
    destinationLabel: 'Open Payments',
    steps: [
      'Open the Payments tab or tap "+ Record Payment" from Quick Actions.',
      'Select the member, enter the amount received (supports full or partial payments), and choose UPI, Cash, Card, or Bank Transfer.',
      'Outstanding balances are automatically recalculated on the member profile and Payments summary cards.',
      'Tap any transaction row to open Payment Detail, download/share a receipt, or reverse/refund an erroneous entry.',
    ],
  },
  {
    id: 'cat-attendance',
    title: 'Attendance',
    subtitle: 'Check-in, check-out and visits',
    icon: <CalendarCheck className="w-4 h-4 text-[#16A34A]" />,
    iconBg: 'bg-[#DCFCE7]',
    destination: 'attendance',
    destinationLabel: 'Open Attendance',
    steps: [
      'Open the Attendance tab to view Today’s Check-Ins, Attendance Rate, Absent Today, and Inactive (14+ days) members.',
      'Tap "✓ Check In" on any active member row for one-tap check-in, or tap "+ Mark Attendance" to log via QR Scan, Member ID, or Manual selection.',
      'Expired memberships trigger an expiry safeguard prompt so staff can renew the member first or allow a one-time override.',
      'Tap a "✓ Checked In" button on the same day if you need to undo an accidental check-in.',
    ],
  },
  {
    id: 'cat-staff',
    title: 'Staff & Permissions',
    subtitle: 'Manage staff and access',
    icon: <Shield className="w-4 h-4 text-[#2563EB]" />,
    iconBg: 'bg-[#DBEAFE]',
    destination: 'staff_report',
    destinationLabel: 'Open Staff & Permissions',
    steps: [
      'Open Reports → Staff to view Total Staff, Present Today, Salaries Paid, and Pending Salaries.',
      'Tap any staff member row to open the Staff Detail & Permissions screen.',
      'Select a Role Preset (Trainer, Receptionist, Manager, or Custom) or expand permission groups to toggle individual capabilities.',
      'Tap "Save Changes" to apply and audit-log permission updates, or use "Deactivate Staff" to revoke access while preserving historical records.',
    ],
  },
  {
    id: 'cat-reports',
    title: 'Expenses & Reports',
    subtitle: 'Expenses and business reports',
    icon: <BarChart3 className="w-4 h-4 text-[#EA580C]" />,
    iconBg: 'bg-[#FFEDD5]',
    destination: 'reports',
    destinationLabel: 'Open Business Reports',
    steps: [
      'Switch to Payments → Expenses to record Rent, Utilities, Staff Salaries, Equipment, Maintenance, and Marketing costs.',
      'Open the Reports tab to switch between Revenue, Memberships, Retention, and Staff reports.',
      'Use the Date Range selector on any report to inspect This Week, This Month, Last Month, Last 3 Months, or a Custom Date Range.',
      'Tap "Export" on any report screen to download a CSV file for the selected reporting period.',
    ],
  },
  {
    id: 'cat-settings',
    title: 'Account & Settings',
    subtitle: 'Gym profile and app settings',
    icon: <Settings className="w-4 h-4 text-[#52525B]" />,
    iconBg: 'bg-[#F4F4F5]',
    destination: 'home',
    destinationLabel: 'Go to Gym Profile Header',
    steps: [
      'Tap your Gym Name in the top-left header of the Home dashboard to view the active branch profile.',
      'Select "Rename Gym" to update your gym’s display name across all receipts and reports.',
      'Use the top-right Search and Notifications icons to quickly locate members or review urgent expiry and payment alerts.',
    ],
  },
  {
    id: 'cat-renewals',
    title: 'Renewals & Follow-Ups',
    subtitle: 'Expiring plans and follow-ups',
    icon: <RefreshCw className="w-4 h-4 text-[#DC2626]" />,
    iconBg: 'bg-[#FEE2E2]',
    destination: 'renewals',
    destinationLabel: 'Open Renewals & Expiry',
    steps: [
      'Open Members → Renewals to see Expiring in 7 Days, Expired Memberships, Renewed This Month, and Pending Renewal Dues.',
      'Tap "Renew" on any expiring or expired member row to extend their membership from the previous expiry date or from today.',
      'Open Members → Follow-Ups to schedule, complete, or reschedule calls and WhatsApp check-ins for leads and at-risk members.',
    ],
  },
];

const FAQ_LIST: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Members & Registration',
    question: 'How do I add a new member?',
    answer:
      'Tap "+ Add Member" in Quick Actions on the Home dashboard or inside the Members Directory. Enter the member’s name, 10-digit phone number, membership plan, start date, and initial payment amount, then tap Save Member.',
  },
  {
    id: 'faq-2',
    category: 'Membership Plans',
    question: 'How do I create a membership plan?',
    answer:
      'Navigate to the Plans tab in the bottom navigation bar and tap "+ Add Plan". Enter the plan name, duration (in days or months), price in ₹ INR, and key features, then save.',
  },
  {
    id: 'faq-3',
    category: 'Payments & Balances',
    question: 'How do I record a partial payment?',
    answer:
      'Open "+ Record Payment", select the member, and enter the actual amount received (less than the total plan fee). The app automatically records a Partial payment and tracks the remaining balance under Pending Payments.',
  },
  {
    id: 'faq-4',
    category: 'Renewals & Follow-Ups',
    question: 'How do I check membership expiry?',
    answer:
      'Open the Members tab and switch to the "Renewals" view (or open Reports → Memberships). You can filter members by Expiring Soon (within 7 days), Expired, or Due Today and send direct WhatsApp renewal reminders.',
  },
  {
    id: 'faq-5',
    category: 'Staff & Permissions',
    question: 'How do I give a staff member limited access?',
    answer:
      'Open Reports → Staff and tap the staff member’s row to open "Staff Detail & Permissions". Choose a role preset (Trainer or Receptionist) or expand individual permission groups to toggle specific actions, then tap "Save Changes".',
  },
  {
    id: 'faq-6',
    category: 'Payments & Balances',
    question: 'How do I correct a payment record?',
    answer:
      'Open the Payments tab and tap the transaction row you want to review to open "Payment Detail". Use "Record Balance Payment" for partial dues, or tap "Reverse / Refund Payment" to reverse an erroneous transaction and restore the member’s balance.',
  },
  {
    id: 'faq-7',
    category: 'Attendance',
    question: 'How do I mark or undo daily attendance?',
    answer:
      'Open the Attendance tab and tap "✓ Check In" next to any active member, or use "+ Mark Attendance". If a check-in was marked by mistake on the current date, tap "✓ Checked In" on that row and confirm to undo it.',
  },
  {
    id: 'faq-8',
    category: 'Members & Registration',
    question: 'How do I convert an enquiry lead into a member?',
    answer:
      'Open the Members tab (Leads view) and tap "Convert" on the lead’s row, or open Lead Detail and select "Convert to Member". Choose their membership plan and start date; their pending balance is created automatically without fabricating a payment.',
  },
  {
    id: 'faq-9',
    category: 'Expenses & Reports',
    question: 'How do I record gym expenses and staff salaries?',
    answer:
      'Open Payments → Expenses and tap "+ Add Expense" to log operational costs. For staff payroll, you can also open Reports → Staff, select a staff member with pending salary, and tap "Pay Due Salary" to automatically log a Staff expense.',
  },
  {
    id: 'faq-10',
    category: 'Expenses & Reports',
    question: 'How do I export business reports to CSV?',
    answer:
      'Open the Reports tab, select Revenue, Memberships, Retention, or Staff, choose your desired reporting period from the date dropdown, and tap the "Export" button in the top-right corner.',
  },
];

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({
  supportTickets,
  onBack,
  onSelectReportTab,
  onCreateSupportTicket,
  onNavigateToDestination,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({});
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [activeCategoryModal, setActiveCategoryModal] = useState<HelpCategoryItem | null>(null);

  // Report a Problem Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState<SupportTicket['category']>(
    'Payments & Balances'
  );
  const [issueSubject, setIssueSubject] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueAttachmentName, setIssueAttachmentName] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [submissionToast, setSubmissionToast] = useState<string | null>(null);

  // Contact channel notice state (since external WhatsApp/Email destinations are not invented)
  const [contactChannelNotice, setContactChannelNotice] = useState<string | null>(null);

  // Selected Support Ticket Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showAllTickets, setShowAllTickets] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return HELP_CATEGORIES;
    return HELP_CATEGORIES.filter(
      (c) =>
        c.title.toLowerCase().includes(normalizedQuery) ||
        c.subtitle.toLowerCase().includes(normalizedQuery) ||
        c.steps.some((s) => s.toLowerCase().includes(normalizedQuery))
    );
  }, [normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) {
      return showAllFaqs ? FAQ_LIST : FAQ_LIST.slice(0, 6);
    }
    return FAQ_LIST.filter(
      (f) =>
        f.question.toLowerCase().includes(normalizedQuery) ||
        f.answer.toLowerCase().includes(normalizedQuery) ||
        f.category.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, showAllFaqs]);

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmitProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSubject.trim()) {
      setReportError('Please enter a short summary of the issue.');
      return;
    }
    if (issueDescription.trim().length < 10) {
      setReportError('Please provide a brief description (at least 10 characters).');
      return;
    }

    const created = onCreateSupportTicket({
      category: issueCategory,
      subject: issueSubject.trim(),
      description: issueDescription.trim(),
      attachmentName: issueAttachmentName.trim() || undefined,
    });

    setIssueSubject('');
    setIssueDescription('');
    setIssueAttachmentName('');
    setReportError(null);
    setIsReportModalOpen(false);
    setSubmissionToast(`Support request ${created.ticketCode} submitted.`);
    setTimeout(() => setSubmissionToast(null), 4000);
  };

  const displayedTickets = showAllTickets ? supportTickets : supportTickets.slice(0, 3);

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
              Help & Support
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Find answers and get help with your gym.
            </p>
          </div>
        </div>
      </div>

      {/* REPORT & SECTION SWITCHER PILLS */}
      {onSelectReportTab && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'overview', label: 'Reports Overview' },
              { id: 'complaints', label: 'Complaints & Support' },
              { id: 'support', label: 'Help & Support' },
              { id: 'gym_settings', label: 'Gym Settings' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'staff_permissions', label: 'Staff Permissions' },
              { id: 'retention', label: 'Retention' },
              { id: 'staff', label: 'Staff Report' },
              { id: 'revenue', label: 'Revenue' },
              { id: 'membership', label: 'Memberships' },
            ] as Array<{ id: ReportTabType; label: string }>
          ).map((t) => {
            const isActive = t.id === 'support';
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

      {/* 2. SEARCH FIELD */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a question or topic..."
          className="w-full h-[38px] pl-9 pr-8 rounded-2xl bg-white border border-[#EAE5DC] text-[12px] font-medium text-[#191919] placeholder:text-[#9CA3AF] focus:outline-hidden focus:border-[#1E3A8A] shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="w-5 h-5 rounded-full bg-[#F2EFE8] text-[#52525B] flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 hover:bg-[#E5E0D6] cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* SUBMISSION TOAST */}
      {submissionToast && (
        <div className="px-3 py-2 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] text-[11.5px] font-semibold flex items-center justify-between gap-2">
          <span>{submissionToast}</span>
          <Check className="w-3.5 h-3.5 shrink-0" />
        </div>
      )}

      {/* EMPTY SEARCH RESULTS STATE */}
      {normalizedQuery && filteredCategories.length === 0 && filteredFaqs.length === 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
          <p className="text-[13px] font-bold text-[#191919]">
            No help results for &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-[11px] text-[#71717A]">
            Try searching for keywords like members, plans, partial payment, expiry, attendance, or
            permissions.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="h-[30px] px-3 rounded-xl bg-[#F4F6FB] text-[#1E3A8A] text-[11px] font-bold cursor-pointer"
            >
              Clear Search
            </button>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="h-[30px] px-3 rounded-xl bg-[#1E3A8A] text-white text-[11px] font-bold cursor-pointer"
            >
              Report a Problem
            </button>
          </div>
        </div>
      )}

      {/* 3. QUICK HELP CATEGORIES (2-COLUMN GRID) */}
      {filteredCategories.length > 0 && (
        <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
          <h2 className="text-[14px] font-bold text-[#191919]">Quick Help Categories</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryModal(cat)}
                className="p-2.5 rounded-xl bg-[#FBF9F5]/80 hover:bg-[#F4F1EA] border border-[#EAE5DC] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl ${cat.iconBg} flex items-center justify-center shrink-0`}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-bold text-[#191919] truncate">
                      {cat.title}
                    </div>
                    <div className="text-[10px] font-medium text-[#71717A] truncate">
                      {cat.subtitle}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      {filteredFaqs.length > 0 && (
        <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#191919]">Frequently Asked Questions</h2>
            {!normalizedQuery && (
              <button
                type="button"
                onClick={() => setShowAllFaqs((prev) => !prev)}
                className="text-[11.5px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
              >
                {showAllFaqs ? 'Show Compact' : 'View All'}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {filteredFaqs.map((faq) => {
              const isExpanded = Boolean(expandedFaqIds[faq.id]);
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-[#EAE5DC] bg-[#FBF9F5]/60 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isExpanded}
                    className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-[#F8F6F1] transition-colors cursor-pointer"
                  >
                    <span className="text-[12px] font-bold text-[#191919]">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform duration-150 ${
                        isExpanded ? 'rotate-180 text-[#1E3A8A]' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-2.5 pt-1.5 border-t border-[#EAE5DC] bg-white">
                      <p className="text-[11px] font-medium text-[#52525B] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. CONTACT SUPPORT */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <h2 className="text-[14px] font-bold text-[#191919]">Contact Support</h2>

        <div className="grid grid-cols-3 gap-2">
          {/* WhatsApp Support */}
          <button
            type="button"
            onClick={() =>
              setContactChannelNotice(
                'External WhatsApp support number is not configured for this workspace. Please use "Report a Problem" to log an in-app support request.'
              )
            }
            className="p-2.5 rounded-xl bg-[#FBF9F5] hover:bg-[#F4F1EA] border border-[#EAE5DC] flex items-center justify-between gap-1.5 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold text-[#191919] truncate">
                  WhatsApp Support
                </div>
                <div className="text-[9px] font-medium text-[#71717A] truncate">
                  Not configured
                </div>
              </div>
            </div>
            <ChevronRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
          </button>

          {/* Email Support */}
          <button
            type="button"
            onClick={() =>
              setContactChannelNotice(
                'External support email destination is not configured for this workspace. Please use "Report a Problem" to submit your issue.'
              )
            }
            className="p-2.5 rounded-xl bg-[#FBF9F5] hover:bg-[#F4F1EA] border border-[#EAE5DC] flex items-center justify-between gap-1.5 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold text-[#191919] truncate">Email Support</div>
                <div className="text-[9px] font-medium text-[#71717A] truncate">
                  Not configured
                </div>
              </div>
            </div>
            <ChevronRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
          </button>

          {/* Report a Problem */}
          <button
            type="button"
            onClick={() => {
              setContactChannelNotice(null);
              setReportError(null);
              setIsReportModalOpen(true);
            }}
            className="p-2.5 rounded-xl bg-[#FEF2F2]/70 hover:bg-[#FEE2E2]/70 border border-[#FECACA] flex items-center justify-between gap-1.5 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold text-[#191919] truncate">
                  Report a Problem
                </div>
                <div className="text-[9px] font-medium text-[#71717A] truncate">
                  Tell us what&apos;s wrong
                </div>
              </div>
            </div>
            <ChevronRight className="w-3 h-3 text-[#9CA3AF] shrink-0" />
          </button>
        </div>

        {contactChannelNotice && (
          <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[11px] flex items-center justify-between gap-2">
            <span>{contactChannelNotice}</span>
            <button
              type="button"
              onClick={() => {
                setContactChannelNotice(null);
                setIsReportModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#1E3A8A] text-white text-[10.5px] font-bold shrink-0 cursor-pointer"
            >
              Open Form
            </button>
          </div>
        )}
      </div>

      {/* 6. MY SUPPORT REQUESTS (Connected to real supportTickets; no fabricated tickets) */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#191919]">My Support Requests</h2>
          {supportTickets.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllTickets((prev) => !prev)}
              className="text-[11.5px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
            >
              {showAllTickets ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>

        {supportTickets.length === 0 ? (
          <div className="py-4 px-2 text-center rounded-xl bg-[#FBF9F5] border border-[#EAE5DC] space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-[#F2EFE8] text-[#71717A] flex items-center justify-center mx-auto">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-[12px] font-bold text-[#191919]">No support requests yet</p>
            <p className="text-[10.5px] text-[#71717A] max-w-xs mx-auto">
              Any issues you submit through &ldquo;Report a Problem&rdquo; will appear here with
              their reference number and status.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE8]">
            {displayedTickets.map((ticket) => {
              const badgeClass =
                ticket.status === 'Resolved'
                  ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                  : ticket.status === 'In Progress'
                  ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                  : 'bg-[#DBEAFE] text-[#1E3A8A] border-[#BFDBFE]';

              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full py-2.5 first:pt-1 last:pb-0.5 flex items-center justify-between gap-2 text-left hover:bg-[#FBF9F5] rounded-xl px-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F2EFE8] text-[#52525B] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-[#191919] truncate">
                        {ticket.ticketCode}
                      </div>
                      <div className="text-[10.5px] font-medium text-[#71717A] truncate">
                        {ticket.subject}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10.5px] font-medium text-[#71717A]">
                      {ticket.createdAt}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}
                    >
                      {ticket.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CATEGORY GUIDE MODAL */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#EAE5DC] shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl ${activeCategoryModal.iconBg} flex items-center justify-center shrink-0`}
                >
                  {activeCategoryModal.icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#191919]">
                    {activeCategoryModal.title}
                  </h3>
                  <p className="text-[11px] text-[#71717A]">{activeCategoryModal.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategoryModal(null)}
                className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#52525B] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8F6F1] border border-[#EAE5DC] space-y-2">
              <div className="text-[11px] font-bold text-[#191919] uppercase tracking-wider">
                How It Works in Gym Business OS
              </div>
              <ol className="space-y-2 list-decimal list-inside text-[11.5px] font-medium text-[#52525B]">
                {activeCategoryModal.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveCategoryModal(null)}
                className="flex-1 h-[38px] rounded-xl border border-[#E5E0D6] text-[12px] font-bold text-[#52525B] cursor-pointer"
              >
                Close
              </button>
              {onNavigateToDestination && (
                <button
                  type="button"
                  onClick={() => {
                    const dest = activeCategoryModal.destination;
                    setActiveCategoryModal(null);
                    onNavigateToDestination(dest);
                  }}
                  className="flex-1 h-[38px] rounded-xl bg-[#1E3A8A] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{activeCategoryModal.destinationLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT A PROBLEM MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#EAE5DC] shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#191919]">Report a Problem</h3>
                  <p className="text-[10.5px] text-[#71717A]">
                    Do not include passwords, OTPs, or card numbers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#52525B] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProblem} className="space-y-2.5">
              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Issue Category *
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value as SupportTicket['category'])}
                  className="w-full h-[36px] px-2.5 rounded-xl border border-[#E5E0D6] text-[12px] font-medium bg-white"
                >
                  <option value="Members & Registration">Members & Registration</option>
                  <option value="Membership Plans">Membership Plans</option>
                  <option value="Payments & Balances">Payments & Balances</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Staff & Permissions">Staff & Permissions</option>
                  <option value="Expenses & Reports">Expenses & Reports</option>
                  <option value="Account & Settings">Account & Settings</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Short Summary *
                </label>
                <input
                  type="text"
                  value={issueSubject}
                  onChange={(e) => setIssueSubject(e.target.value)}
                  placeholder="e.g., Unable to record partial UPI payment"
                  className="w-full h-[36px] px-3 rounded-xl border border-[#E5E0D6] text-[12px] font-medium"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe what happened and which screen you were using..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E0D6] text-[12px] font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Optional Screenshot / Reference Note
                </label>
                <div className="relative">
                  <Paperclip className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={issueAttachmentName}
                    onChange={(e) => setIssueAttachmentName(e.target.value)}
                    placeholder="Optional receipt number or screenshot filename"
                    className="w-full h-[34px] pl-8 pr-3 rounded-xl border border-[#E5E0D6] text-[11.5px] font-medium"
                  />
                </div>
              </div>

              {reportError && (
                <p className="text-[11px] font-semibold text-[#DC2626]">{reportError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 h-[38px] rounded-xl border border-[#E5E0D6] text-[12px] font-bold text-[#52525B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-[38px] rounded-xl bg-[#1E3A8A] text-white text-[12px] font-bold cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPORT TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#EAE5DC] shadow-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-extrabold text-[#191919]">
                    {selectedTicket.ticketCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#DBEAFE] text-[#1E3A8A] border border-[#BFDBFE]">
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Category: {selectedTicket.category} · Submitted {selectedTicket.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#52525B] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8F6F1] border border-[#EAE5DC] space-y-1.5">
              <div className="text-[12px] font-bold text-[#191919]">{selectedTicket.subject}</div>
              <p className="text-[11.5px] text-[#52525B] leading-relaxed">
                {selectedTicket.description}
              </p>
              {selectedTicket.attachmentName && (
                <div className="pt-1 text-[10.5px] font-semibold text-[#1E3A8A] flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span>Reference: {selectedTicket.attachmentName}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="w-full h-[36px] rounded-xl bg-[#1E3A8A] text-white text-[12px] font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
