/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Pencil,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Users,
  RotateCcw,
  CalendarCheck,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  X,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';
import {
  StaffMember,
  StaffRole,
  StaffDetailedPermissions,
} from '../../types/dashboard';

import { ReportTabType } from '../reports/RetentionReportScreen';

export type PresetKey = 'Trainer' | 'Receptionist' | 'Manager' | 'Custom';

interface StaffDetailPermissionsScreenProps {
  staff: StaffMember;
  allStaff?: StaffMember[];
  onSelectStaff?: (staffId: string) => void;
  onSelectReportTab?: (tab: ReportTabType) => void;
  viewerRole?: 'owner' | 'manager' | 'reception' | 'trainer';
  onBack: () => void;
  onSavePermissions: (
    staffId: string,
    detailed: StaffDetailedPermissions,
    updatedRole?: StaffRole,
    updatedRoleLabel?: string
  ) => void;
  onUpdateStaffMember: (staffId: string, updates: Partial<StaffMember>) => void;
  onToggleStaffActiveStatus: (staffId: string) => void;
  onMarkStaffAttendance?: (
    staffId: string,
    date: string,
    status: 'Present' | 'Late' | 'Absent'
  ) => void;
  onPayStaffSalary?: (staffId: string, amountToPay: number) => void;
}

import { getTodayIso } from '../../utils/dateUtils';

const REPORT_TODAY = getTodayIso();

export const PRESET_TEMPLATES: Record<Exclude<PresetKey, 'Custom'>, StaffDetailedPermissions> = {
  Trainer: {
    // Members (2/3)
    viewMembers: true,
    addMembers: false,
    editMembers: true,
    // Attendance (2/3)
    viewAttendance: true,
    recordCheckIns: true,
    correctAttendance: false,
    // Membership Plans (1/3)
    viewPlans: true,
    createPlans: false,
    editPlans: false,
    // Payments (0/4)
    viewPayments: false,
    recordPayments: false,
    viewBalances: false,
    paymentCorrections: false,
    // Expenses (0/3)
    viewExpenses: false,
    addExpenses: false,
    editExpenses: false,
    // Reports (0/3)
    viewReports: false,
    exportReports: false,
    viewSalaries: false,
    // Staff (1/3)
    viewStaff: true,
    manageStaff: false,
    changeStaffPermissions: false,
    // Settings (0/2)
    viewSettings: false,
    modifySettings: false,
  },
  Receptionist: {
    // Members (3/3)
    viewMembers: true,
    addMembers: true,
    editMembers: true,
    // Attendance (2/3)
    viewAttendance: true,
    recordCheckIns: true,
    correctAttendance: false,
    // Membership Plans (1/3)
    viewPlans: true,
    createPlans: false,
    editPlans: false,
    // Payments (3/4) - no payment corrections
    viewPayments: true,
    recordPayments: true,
    viewBalances: true,
    paymentCorrections: false,
    // Expenses (2/3)
    viewExpenses: true,
    addExpenses: true,
    editExpenses: false,
    // Reports (0/3)
    viewReports: false,
    exportReports: false,
    viewSalaries: false,
    // Staff (1/3)
    viewStaff: true,
    manageStaff: false,
    changeStaffPermissions: false,
    // Settings (0/2)
    viewSettings: false,
    modifySettings: false,
  },
  Manager: {
    // Members (3/3)
    viewMembers: true,
    addMembers: true,
    editMembers: true,
    // Attendance (3/3)
    viewAttendance: true,
    recordCheckIns: true,
    correctAttendance: true,
    // Membership Plans (3/3)
    viewPlans: true,
    createPlans: true,
    editPlans: true,
    // Payments (3/4) - sensitive payment corrections remain restricted unless explicitly granted by Owner
    viewPayments: true,
    recordPayments: true,
    viewBalances: true,
    paymentCorrections: false,
    // Expenses (3/3)
    viewExpenses: true,
    addExpenses: true,
    editExpenses: true,
    // Reports (2/3) - viewing staff salaries stays restricted by default
    viewReports: true,
    exportReports: true,
    viewSalaries: false,
    // Staff (2/3) - changing permissions stays restricted to Owner
    viewStaff: true,
    manageStaff: true,
    changeStaffPermissions: false,
    // Settings (1/2)
    viewSettings: true,
    modifySettings: false,
  },
};

export function deriveInitialDetailedPermissions(staff: StaffMember): StaffDetailedPermissions {
  if (staff.detailedPermissions) {
    return { ...staff.detailedPermissions };
  }
  // If staff is Arjun Mehta (stf-1) or Trainer, derive from role and existing summary permissions
  if (staff.role === 'Trainer') {
    return {
      viewMembers: true,
      addMembers: staff.permissions.manageMembers,
      editMembers: false,
      viewAttendance: true,
      recordCheckIns: staff.permissions.markAttendance,
      correctAttendance: false,
      viewPlans: true,
      createPlans: false,
      editPlans: false,
      viewPayments: staff.permissions.recordPayments,
      recordPayments: staff.permissions.recordPayments,
      viewBalances: true,
      paymentCorrections: false,
      viewExpenses: staff.permissions.manageExpenses,
      addExpenses: staff.permissions.manageExpenses,
      editExpenses: false,
      viewReports: true,
      exportReports: false,
      viewSalaries: staff.permissions.viewSalaries,
      viewStaff: true,
      manageStaff: false,
      changeStaffPermissions: false,
      viewSettings: false,
      modifySettings: false,
    };
  }
  if (staff.role === 'Reception') {
    return { ...PRESET_TEMPLATES.Receptionist };
  }
  if (staff.role === 'Management') {
    return {
      ...PRESET_TEMPLATES.Manager,
      viewSalaries: staff.permissions.viewSalaries,
    };
  }
  // Maintenance
  return {
    viewMembers: false,
    addMembers: false,
    editMembers: false,
    viewAttendance: true,
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

function arePermissionsEqual(
  a: StaffDetailedPermissions,
  b: StaffDetailedPermissions
): boolean {
  const keys = Object.keys(a) as Array<keyof StaffDetailedPermissions>;
  return keys.every((k) => Boolean(a[k]) === Boolean(b[k]));
}

function detectMatchingPreset(perms: StaffDetailedPermissions): PresetKey {
  if (arePermissionsEqual(perms, PRESET_TEMPLATES.Trainer)) return 'Trainer';
  if (arePermissionsEqual(perms, PRESET_TEMPLATES.Receptionist)) return 'Receptionist';
  if (arePermissionsEqual(perms, PRESET_TEMPLATES.Manager)) return 'Manager';
  return 'Custom';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function formatJoiningDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface PermissionGroupDef {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  items: Array<{
    key: keyof StaffDetailedPermissions;
    label: string;
    description: string;
    sensitive?: boolean;
    ownerOnly?: boolean;
  }>;
}

export const StaffDetailPermissionsScreen: React.FC<StaffDetailPermissionsScreenProps> = ({
  staff,
  allStaff,
  onSelectStaff,
  onSelectReportTab,
  viewerRole = 'owner',
  onBack,
  onSavePermissions,
  onUpdateStaffMember,
  onToggleStaffActiveStatus,
  onMarkStaffAttendance,
  onPayStaffSalary,
}) => {
  const savedPermissions = useMemo(() => deriveInitialDetailedPermissions(staff), [staff]);

  const [draftPermissions, setDraftPermissions] =
    useState<StaffDetailedPermissions>(savedPermissions);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(() =>
    detectMatchingPreset(savedPermissions)
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(staff.name);
  const [editRole, setEditRole] = useState<StaffRole>(staff.role);
  const [editRoleLabel, setEditRoleLabel] = useState(staff.roleLabel);
  const [editPhone, setEditPhone] = useState(staff.phone);
  const [editEmail, setEditEmail] = useState(staff.email || '');
  const [editEmploymentType, setEditEmploymentType] = useState<
    'Full Time' | 'Part Time' | 'Contract'
  >(staff.employmentType || 'Full Time');
  const [editShiftLabel, setEditShiftLabel] = useState(staff.shiftLabel || '6:00 AM – 2:15 PM');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  useEffect(() => {
    const fresh = deriveInitialDetailedPermissions(staff);
    setDraftPermissions(fresh);
    setSelectedPreset(detectMatchingPreset(fresh));
  }, [staff]);

  const hasUnsavedChanges = useMemo(
    () => !arePermissionsEqual(draftPermissions, savedPermissions),
    [draftPermissions, savedPermissions]
  );

  const canModifyPermissions = viewerRole === 'owner';

  const permissionGroups: PermissionGroupDef[] = useMemo(
    () => [
      {
        id: 'members',
        title: 'Members',
        subtitle: 'View, add and edit member records',
        icon: <Users className="w-4 h-4 text-[#2563EB]" />,
        iconBg: 'bg-[#DBEAFE]',
        items: [
          {
            key: 'viewMembers',
            label: 'View member records',
            description: 'View member directory, profiles, and membership status',
          },
          {
            key: 'addMembers',
            label: 'Add members',
            description: 'Register new gym members and assign plans',
          },
          {
            key: 'editMembers',
            label: 'Edit member records',
            description: 'Update member contact details, notes, and fitness goals',
          },
        ],
      },
      {
        id: 'attendance',
        title: 'Attendance',
        subtitle: 'Record and manage member attendance',
        icon: <CalendarCheck className="w-4 h-4 text-[#16A34A]" />,
        iconBg: 'bg-[#DCFCE7]',
        items: [
          {
            key: 'viewAttendance',
            label: 'View attendance',
            description: 'View daily check-in logs and member visit history',
          },
          {
            key: 'recordCheckIns',
            label: 'Record check-ins',
            description: 'Mark daily member check-ins via QR, ID, or manual entry',
          },
          {
            key: 'correctAttendance',
            label: 'Correct attendance records',
            description: 'Undo accidental check-ins on the same day',
          },
        ],
      },
      {
        id: 'plans',
        title: 'Membership Plans',
        subtitle: 'View and manage membership plans',
        icon: <CreditCard className="w-4 h-4 text-[#7C3AED]" />,
        iconBg: 'bg-[#F3E8FF]',
        items: [
          {
            key: 'viewPlans',
            label: 'View plans',
            description: 'View active membership plans and pricing',
          },
          {
            key: 'createPlans',
            label: 'Create plans',
            description: 'Add new membership durations and pricing tiers',
          },
          {
            key: 'editPlans',
            label: 'Edit plans',
            description: 'Modify existing plan prices, features, or active status',
          },
        ],
      },
      {
        id: 'payments',
        title: 'Payments',
        subtitle: 'View and record payments',
        icon: <Wallet className="w-4 h-4 text-[#D97706]" />,
        iconBg: 'bg-[#FEF3C7]',
        items: [
          {
            key: 'viewPayments',
            label: 'View payment records',
            description: 'View transaction history and payment receipts',
          },
          {
            key: 'recordPayments',
            label: 'Record payments',
            description: 'Collect full or partial membership payments',
          },
          {
            key: 'viewBalances',
            label: 'View outstanding balances',
            description: 'See pending dues and overdue member balances',
          },
          {
            key: 'paymentCorrections',
            label: 'Perform payment corrections',
            description: 'Reverse or refund erroneous payment transactions',
            sensitive: true,
            ownerOnly: true,
          },
        ],
      },
      {
        id: 'expenses',
        title: 'Expenses',
        subtitle: 'View and add expenses',
        icon: <Wallet className="w-4 h-4 text-[#DC2626]" />,
        iconBg: 'bg-[#FEE2E2]',
        items: [
          {
            key: 'viewExpenses',
            label: 'View expenses',
            description: 'View recorded operational expenses',
          },
          {
            key: 'addExpenses',
            label: 'Add expenses',
            description: 'Record utility, maintenance, and supply expenses',
          },
          {
            key: 'editExpenses',
            label: 'Edit expenses',
            description: 'Modify or delete existing expense entries',
            sensitive: true,
          },
        ],
      },
      {
        id: 'reports',
        title: 'Reports',
        subtitle: 'View operational reports',
        icon: <BarChart3 className="w-4 h-4 text-[#EA580C]" />,
        iconBg: 'bg-[#FFEDD5]',
        items: [
          {
            key: 'viewReports',
            label: 'View operational reports',
            description: 'Access membership, renewal, and retention analytics',
          },
          {
            key: 'exportReports',
            label: 'Export reports',
            description: 'Download CSV summaries of operational reports',
          },
          {
            key: 'viewSalaries',
            label: 'View salary & payroll figures',
            description: 'View staff salaries and payroll expense breakdowns',
            sensitive: true,
            ownerOnly: true,
          },
        ],
      },
      {
        id: 'staff',
        title: 'Staff',
        subtitle: 'View and manage staff records',
        icon: <Shield className="w-4 h-4 text-[#1E3A8A]" />,
        iconBg: 'bg-[#E0E7FF]',
        items: [
          {
            key: 'viewStaff',
            label: 'View staff records',
            description: 'View staff directory and daily shift attendance',
          },
          {
            key: 'manageStaff',
            label: 'Manage staff',
            description: 'Mark staff attendance and update shift schedules',
          },
          {
            key: 'changeStaffPermissions',
            label: 'Change staff permissions',
            description: 'Modify staff roles and system access levels',
            sensitive: true,
            ownerOnly: true,
          },
        ],
      },
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'Access gym settings',
        icon: <Settings className="w-4 h-4 text-[#52525B]" />,
        iconBg: 'bg-[#F4F4F5]',
        items: [
          {
            key: 'viewSettings',
            label: 'View gym profile & settings',
            description: 'View branch details, timings, and contact info',
          },
          {
            key: 'modifySettings',
            label: 'Modify gym settings',
            description: 'Update gym name, branch profile, and configuration',
            sensitive: true,
            ownerOnly: true,
          },
        ],
      },
    ],
    []
  );

  // Select a preset (does NOT silently save — updates draft state only)
  const handleSelectPreset = (preset: PresetKey) => {
    if (!canModifyPermissions) {
      setSaveFeedback({
        type: 'error',
        message: 'Only the Gym Owner can modify staff role presets and permissions.',
      });
      return;
    }
    setSaveFeedback(null);
    setSelectedPreset(preset);
    if (preset !== 'Custom') {
      setDraftPermissions({ ...PRESET_TEMPLATES[preset] });
    }
  };

  // Toggle an individual permission inside a group
  const handleTogglePermission = (
    key: keyof StaffDetailedPermissions,
    ownerOnly?: boolean
  ) => {
    if (!canModifyPermissions) {
      setSaveFeedback({
        type: 'error',
        message: 'You do not have authority to change staff permissions.',
      });
      return;
    }
    if (ownerOnly && viewerRole !== 'owner') {
      setSaveFeedback({
        type: 'error',
        message: 'Owner-only permissions cannot be granted by non-owner accounts.',
      });
      return;
    }

    setSaveFeedback(null);
    setDraftPermissions((prev) => {
      const nextValue = !prev[key];
      const next = { ...prev, [key]: nextValue };

      // Enforce logical dependency rules automatically:
      // 1. Enabling add/edit members requires viewMembers
      if ((key === 'addMembers' || key === 'editMembers') && nextValue) {
        next.viewMembers = true;
      }
      if (key === 'viewMembers' && !nextValue) {
        next.addMembers = false;
        next.editMembers = false;
      }
      // 2. Enabling recordCheckIns or correctAttendance requires viewAttendance
      if ((key === 'recordCheckIns' || key === 'correctAttendance') && nextValue) {
        next.viewAttendance = true;
      }
      if (key === 'viewAttendance' && !nextValue) {
        next.recordCheckIns = false;
        next.correctAttendance = false;
      }
      // 3. Enabling createPlans or editPlans requires viewPlans
      if ((key === 'createPlans' || key === 'editPlans') && nextValue) {
        next.viewPlans = true;
      }
      if (key === 'viewPlans' && !nextValue) {
        next.createPlans = false;
        next.editPlans = false;
      }
      // 4. Enabling recordPayments or paymentCorrections requires viewPayments
      if ((key === 'recordPayments' || key === 'paymentCorrections') && nextValue) {
        next.viewPayments = true;
      }
      if (key === 'viewPayments' && !nextValue) {
        next.recordPayments = false;
        next.paymentCorrections = false;
      }
      // 5. Enabling addExpenses or editExpenses requires viewExpenses
      if ((key === 'addExpenses' || key === 'editExpenses') && nextValue) {
        next.viewExpenses = true;
      }
      if (key === 'viewExpenses' && !nextValue) {
        next.addExpenses = false;
        next.editExpenses = false;
      }

      setSelectedPreset(detectMatchingPreset(next));
      return next;
    });
  };

  // Reset to default template for the staff member's assigned role
  const handleResetToPreset = () => {
    setSaveFeedback(null);
    const defaultRolePreset: Exclude<PresetKey, 'Custom'> =
      staff.role === 'Reception'
        ? 'Receptionist'
        : staff.role === 'Management'
        ? 'Manager'
        : 'Trainer';
    setDraftPermissions({ ...PRESET_TEMPLATES[defaultRolePreset] });
    setSelectedPreset(defaultRolePreset);
  };

  // Save changes with validation
  const handleSaveChanges = () => {
    if (!canModifyPermissions) {
      setSaveFeedback({
        type: 'error',
        message: 'Permission denied: Only the Gym Owner can save permission changes.',
      });
      return;
    }

    const updatedRole: StaffRole | undefined =
      selectedPreset === 'Trainer'
        ? 'Trainer'
        : selectedPreset === 'Receptionist'
        ? 'Reception'
        : selectedPreset === 'Manager'
        ? 'Management'
        : undefined;

    const updatedRoleLabel: string | undefined =
      selectedPreset === 'Trainer'
        ? 'Trainer'
        : selectedPreset === 'Receptionist'
        ? 'Receptionist'
        : selectedPreset === 'Manager'
        ? 'Manager'
        : undefined;

    onSavePermissions(staff.id, draftPermissions, updatedRole, updatedRoleLabel);
    setSaveFeedback({
      type: 'success',
      message: `Permissions saved for ${staff.name}. Audit log recorded.`,
    });
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Handle Edit Profile Submit
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditFormError('Staff name is required.');
      return;
    }
    const cleanDigits = editPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setEditFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    onUpdateStaffMember(staff.id, {
      name: editName.trim(),
      role: editRole,
      roleLabel: editRoleLabel.trim() || editRole,
      phone: editPhone.trim(),
      email: editEmail.trim() || undefined,
      employmentType: editEmploymentType,
      shiftLabel: editShiftLabel.trim() || undefined,
    });
    setEditFormError(null);
    setIsEditProfileOpen(false);
    setSaveFeedback({
      type: 'success',
      message: `Profile updated for ${editName.trim()}.`,
    });
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const todayLog = (staff.attendanceLogs || []).find((l) => l.date === REPORT_TODAY);
  const todayAttendanceStatus = todayLog ? todayLog.status : 'Absent';

  return (
    <div className="w-full pt-3 pb-6 space-y-2.5">
      {/* 1. HEADER */}
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="flex items-start gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                setIsDiscardConfirmOpen(true);
              } else {
                onBack();
              }
            }}
            className="w-7 h-7 rounded-xl bg-white border border-[#EAE5DC] text-[#191919] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs hover:bg-[#F8F6F1] cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-tight">
              Staff Detail & Permissions
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-0.5">
              Manage staff information and access permissions.
            </p>
          </div>
        </div>

        {/* Staff Selector Dropdown if multiple staff available */}
        {allStaff && allStaff.length > 1 && onSelectStaff && (
          <select
            value={staff.id}
            onChange={(e) => onSelectStaff(e.target.value)}
            aria-label="Select staff member"
            className="h-[28px] px-2 rounded-xl bg-white border border-[#EAE5DC] text-[11px] font-bold text-[#1E3A8A] shadow-2xs shrink-0 cursor-pointer"
          >
            {allStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roleLabel})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* REPORT & SECTION SWITCHER PILLS */}
      {onSelectReportTab && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'overview', label: 'Reports Overview' },
              { id: 'complaints', label: 'Complaints & Support' },
              { id: 'staff_permissions', label: 'Staff Permissions' },
              { id: 'gym_settings', label: 'Gym Settings' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'support', label: 'Help & Support' },
              { id: 'retention', label: 'Retention' },
              { id: 'staff', label: 'Staff Report' },
              { id: 'revenue', label: 'Revenue' },
              { id: 'membership', label: 'Memberships' },
            ] as Array<{ id: ReportTabType; label: string }>
          ).map((t) => {
            const isActive = t.id === 'staff_permissions';
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

      {/* FEEDBACK BANNER */}
      {saveFeedback && (
        <div
          className={`px-3 py-2 rounded-xl border text-[11.5px] font-semibold flex items-center justify-between gap-2 ${
            saveFeedback.type === 'success'
              ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D]'
              : 'bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          <span>{saveFeedback.message}</span>
          <Check className="w-3.5 h-3.5 shrink-0" />
        </div>
      )}

      {/* UNSAVED CHANGES INDICATOR */}
      {hasUnsavedChanges && (
        <div className="px-3 py-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[11px] font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              You have unsaved permission changes. Review and tap Save Changes.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftPermissions(savedPermissions);
              setSelectedPreset(detectMatchingPreset(savedPermissions));
            }}
            className="text-[10.5px] font-bold underline shrink-0 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 2. STAFF PROFILE CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          {/* Avatar + Identity */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {staff.photoUrl ? (
              <img
                src={staff.photoUrl}
                alt={staff.name}
                className="w-14 h-14 rounded-full object-cover border border-[#E5E0D6] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#EEF2FF] text-[#1E3A8A] font-bold text-base flex items-center justify-center shrink-0">
                {getInitials(staff.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[16px] sm:text-[17px] font-extrabold text-[#191919] truncate">
                  {staff.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    staff.status === 'active'
                      ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                      : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                  }`}
                >
                  {staff.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-medium text-[#71717A]">
                  ID: {staff.staffCode}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3E8FF] text-[#7E22CE]">
                  {staff.roleLabel}
                </span>
              </div>

              {/* Phone & Email Row */}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#52525B] flex-wrap">
                <a
                  href={`tel:${staff.phone.replace(/[^0-9]/g, '')}`}
                  className="inline-flex items-center gap-1 hover:text-[#1E3A8A] font-medium"
                >
                  <Phone className="w-3 h-3 text-[#1E3A8A] shrink-0" />
                  <span>+91 {staff.phone}</span>
                </a>
                {staff.email && (
                  <a
                    href={`mailto:${staff.email}`}
                    className="inline-flex items-center gap-1 hover:text-[#1E3A8A] font-medium max-w-[175px] truncate"
                  >
                    <Mail className="w-3 h-3 text-[#1E3A8A] shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={() => {
              setEditName(staff.name);
              setEditRole(staff.role);
              setEditRoleLabel(staff.roleLabel);
              setEditPhone(staff.phone);
              setEditEmail(staff.email || '');
              setEditEmploymentType(staff.employmentType || 'Full Time');
              setEditShiftLabel(staff.shiftLabel || '6:00 AM – 2:15 PM');
              setEditFormError(null);
              setIsEditProfileOpen(true);
            }}
            className="h-[30px] px-2.5 rounded-xl bg-[#F4F6FB] hover:bg-[#E0E7FF] border border-[#DBEAFE] text-[#1E3A8A] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* 3-Column Metadata Strip (Joining Date | Employment Type | Access Level) */}
        <div className="bg-[#F8F6F1] rounded-xl p-2.5 border border-[#EAE5DC] grid grid-cols-3 divide-x divide-[#EAE5DC]">
          <div className="flex items-center gap-2 pr-2 min-w-0">
            <Calendar className="w-4 h-4 text-[#71717A] shrink-0" />
            <div className="min-w-0">
              <div className="text-[9.5px] font-medium text-[#71717A] truncate">Joining Date</div>
              <div className="text-[11px] font-bold text-[#191919] truncate">
                {formatJoiningDate(staff.joinedDate)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 min-w-0">
            <Briefcase className="w-4 h-4 text-[#71717A] shrink-0" />
            <div className="min-w-0">
              <div className="text-[9.5px] font-medium text-[#71717A] truncate">
                Employment Type
              </div>
              <div className="text-[11px] font-bold text-[#191919] truncate">
                {staff.employmentType || 'Full Time'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-2 min-w-0">
            <Users className="w-4 h-4 text-[#71717A] shrink-0" />
            <div className="min-w-0">
              <div className="text-[9.5px] font-medium text-[#71717A] truncate">Access Level</div>
              <div className="text-[11px] font-bold text-[#191919] truncate">{selectedPreset}</div>
            </div>
          </div>
        </div>

        {/* Compact Today's Attendance & Payroll Quick Strip (preserves operational utility) */}
        {(onMarkStaffAttendance || (onPayStaffSalary && staff.pendingSalary > 0)) && (
          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap border-t border-[#F2EFE8]">
            {onMarkStaffAttendance && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-semibold text-[#71717A]">Today:</span>
                {(['Present', 'Late', 'Absent'] as const).map((st) => {
                  const active = todayAttendanceStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onMarkStaffAttendance(staff.id, REPORT_TODAY, st)}
                      className={`h-[24px] px-2 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        active
                          ? st === 'Present'
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                            : st === 'Late'
                            ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                            : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                          : 'bg-white text-[#71717A] border-[#E5E0D6] hover:bg-[#F8F6F1]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            )}

            {onPayStaffSalary && staff.pendingSalary > 0 && viewerRole === 'owner' && (
              <button
                type="button"
                onClick={() => onPayStaffSalary(staff.id, staff.pendingSalary)}
                className="h-[24px] px-2.5 rounded-lg bg-[#1E3A8A] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <IndianRupee className="w-3 h-3" />
                <span>Pay Due Salary (₹{staff.pendingSalary.toLocaleString('en-IN')})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. PERMISSION PRESET CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div>
          <h2 className="text-[14px] font-bold text-[#191919]">Permission Preset</h2>
          <p className="text-[11px] font-medium text-[#71717A] mt-0.5">
            Quickly apply a role template or customise permissions.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(['Trainer', 'Receptionist', 'Manager', 'Custom'] as PresetKey[]).map((preset) => {
            const isSelected = selectedPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`h-[34px] rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'bg-[#F4F6FB] text-[#1E3A8A] hover:bg-[#E0E7FF] border border-[#E5E0D6]'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. GROUPED PERMISSIONS CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold text-[#191919]">Permissions</h2>
            <p className="text-[11px] font-medium text-[#71717A] mt-0.5">
              Control what this staff member can access in the app.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetToPreset}
            className="h-[28px] px-2.5 rounded-xl bg-[#F4F6FB] hover:bg-[#E0E7FF] border border-[#DBEAFE] text-[#1E3A8A] text-[10.5px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Preset</span>
          </button>
        </div>

        {/* Expandable Permission Group Rows */}
        <div className="space-y-2 pt-0.5">
          {permissionGroups.map((group) => {
            const totalInGroup = group.items.length;
            const enabledInGroup = group.items.filter(
              (item) => draftPermissions[item.key]
            ).length;
            const isExpanded = Boolean(expandedGroups[group.id]);

            return (
              <div
                key={group.id}
                className="rounded-xl border border-[#EAE5DC] bg-[#FBF9F5]/60 overflow-hidden transition-all"
              >
                {/* Group Header Row */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [group.id]: !prev[group.id],
                    }))
                  }
                  className="w-full p-2.5 flex items-center justify-between gap-2.5 text-left hover:bg-[#F8F6F1] transition-colors cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${group.iconBg} flex items-center justify-center shrink-0`}
                    >
                      {group.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-[#191919] truncate">
                        {group.title}
                      </div>
                      <div className="text-[10.5px] font-medium text-[#71717A] truncate">
                        {group.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-[#52525B]">
                      {enabledInGroup} / {totalInGroup} enabled
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#71717A] transition-transform duration-150 ${
                        isExpanded ? 'rotate-180 text-[#1E3A8A]' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Individual Permissions */}
                {isExpanded && (
                  <div className="px-3 pb-2.5 pt-1 border-t border-[#EAE5DC] bg-white divide-y divide-[#F2EFE8]">
                    {group.items.map((perm) => {
                      const isEnabled = Boolean(draftPermissions[perm.key]);
                      return (
                        <div
                          key={perm.key}
                          className="py-2 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11.5px] font-bold text-[#191919]">
                                {perm.label}
                              </span>
                              {perm.sensitive && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FEF3C7] text-[#B45309]">
                                  Restricted
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-[#71717A] mt-0.5">
                              {perm.description}
                            </p>
                          </div>

                          {/* Accessible Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            aria-label={perm.label}
                            onClick={() => handleTogglePermission(perm.key, perm.ownerOnly)}
                            className={`w-10 h-5.5 rounded-full transition-colors p-0.5 flex items-center shrink-0 cursor-pointer ${
                              isEnabled ? 'bg-[#1E3A8A] justify-end' : 'bg-[#D4D4D8] justify-start'
                            }`}
                          >
                            <span className="w-4.5 h-4.5 rounded-full bg-white shadow-2xs block" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 5. BOTTOM ACTION BAR: DEACTIVATE STAFF & SAVE CHANGES */}
        <div className="pt-2 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setIsDeactivateConfirmOpen(true)}
            className={`h-[42px] rounded-xl border text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              staff.status === 'active'
                ? 'border-[#EF4444] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626]'
                : 'border-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D]'
            }`}
          >
            {staff.status === 'active' ? (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Deactivate Staff</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reactivate Staff</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            className="h-[42px] rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* EDIT STAFF PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#EAE5DC] shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#191919]">Edit Staff Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#52525B] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-2.5">
              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-[36px] px-3 rounded-xl border border-[#E5E0D6] text-[12px] font-medium focus:outline-hidden focus:border-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                    Role Category
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const nextR = e.target.value as StaffRole;
                      setEditRole(nextR);
                      if (nextR === 'Trainer') setEditRoleLabel('Trainer');
                      else if (nextR === 'Reception') setEditRoleLabel('Receptionist');
                      else if (nextR === 'Management') setEditRoleLabel('Manager');
                      else setEditRoleLabel('Floor Maintenance');
                    }}
                    className="w-full h-[36px] px-2.5 rounded-xl border border-[#E5E0D6] text-[12px] font-medium bg-white"
                  >
                    <option value="Trainer">Trainer</option>
                    <option value="Reception">Reception</option>
                    <option value="Management">Management</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                    Designation Title
                  </label>
                  <input
                    type="text"
                    value={editRoleLabel}
                    onChange={(e) => setEditRoleLabel(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-xl border border-[#E5E0D6] text-[12px] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-xl border border-[#E5E0D6] text-[12px] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                    Employment Type
                  </label>
                  <select
                    value={editEmploymentType}
                    onChange={(e) =>
                      setEditEmploymentType(
                        e.target.value as 'Full Time' | 'Part Time' | 'Contract'
                      )
                    }
                    className="w-full h-[36px] px-2.5 rounded-xl border border-[#E5E0D6] text-[12px] font-medium bg-white"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="name@gym.com"
                    className="w-full h-[36px] px-3 rounded-xl border border-[#E5E0D6] text-[12px] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                    Shift Timings
                  </label>
                  <input
                    type="text"
                    value={editShiftLabel}
                    onChange={(e) => setEditShiftLabel(e.target.value)}
                    className="w-full h-[36px] px-3 rounded-xl border border-[#E5E0D6] text-[12px] font-medium"
                  />
                </div>
              </div>

              {editFormError && (
                <p className="text-[11px] font-semibold text-[#DC2626]">{editFormError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 h-[38px] rounded-xl border border-[#E5E0D6] text-[12px] font-bold text-[#52525B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-[38px] rounded-xl bg-[#1E3A8A] text-white text-[12px] font-bold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATE / REACTIVATE CONFIRMATION MODAL */}
      {isDeactivateConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-[#EAE5DC] shadow-2xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  staff.status === 'active'
                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                    : 'bg-[#DCFCE7] text-[#15803D]'
                }`}
              >
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-[14.5px] font-bold text-[#191919]">
                  {staff.status === 'active'
                    ? `Deactivate ${staff.name}?`
                    : `Reactivate ${staff.name}?`}
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  {staff.status === 'active'
                    ? 'Revokes app access while preserving all historical attendance, salary, and audit records.'
                    : 'Restores active staff status and configured permissions.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeactivateConfirmOpen(false)}
                className="flex-1 h-[36px] rounded-xl border border-[#E5E0D6] text-[11.5px] font-bold text-[#52525B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleStaffActiveStatus(staff.id);
                  setIsDeactivateConfirmOpen(false);
                  setSaveFeedback({
                    type: 'success',
                    message:
                      staff.status === 'active'
                        ? `${staff.name} has been deactivated. Historical records preserved.`
                        : `${staff.name} has been reactivated.`,
                  });
                }}
                className={`flex-1 h-[36px] rounded-xl text-white text-[11.5px] font-bold cursor-pointer ${
                  staff.status === 'active' ? 'bg-[#DC2626]' : 'bg-[#16A34A]'
                }`}
              >
                {staff.status === 'active' ? 'Confirm Deactivate' : 'Confirm Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES BACK CONFIRMATION MODAL */}
      {isDiscardConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-[#EAE5DC] shadow-2xl p-4 space-y-3">
            <h3 className="text-[14.5px] font-bold text-[#191919]">Discard unsaved changes?</h3>
            <p className="text-[11.5px] text-[#71717A]">
              You have modified permission settings for {staff.name} that haven&apos;t been saved
              yet.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDiscardConfirmOpen(false)}
                className="flex-1 h-[36px] rounded-xl border border-[#E5E0D6] text-[11.5px] font-bold text-[#52525B] cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDiscardConfirmOpen(false);
                  onBack();
                }}
                className="flex-1 h-[36px] rounded-xl bg-[#DC2626] text-white text-[11.5px] font-bold cursor-pointer"
              >
                Discard & Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
