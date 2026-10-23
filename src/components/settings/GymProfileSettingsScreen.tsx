/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  IndianRupee,
  CreditCard,
  CalendarCheck,
  Bell,
  Shield,
  HelpCircle,
  Download,
  Pencil,
  Check,
  RotateCcw,
  MessageCircle,
  FileText,
  Sparkles,
  X,
  Lock,
  LogOut,
} from 'lucide-react';
import {
  GymProfile,
  GymSettings,
  Member,
  MembershipPlan,
  StaffMember,
} from '../../types/dashboard';
import { ReportTabType } from '../reports/RetentionReportScreen';
import { LegalModal } from '../modals/LegalModal';

interface GymProfileSettingsScreenProps {
  gym: GymProfile;
  settings: GymSettings;
  members: Member[];
  plans: MembershipPlan[];
  staff: StaffMember[];
  unreadNotificationsCount: number;
  userEmail?: string | null;
  onLogout?: () => void;
  onBack: () => void;
  onSelectReportTab?: (tab: ReportTabType) => void;
  onUpdateGymProfile: (updates: Partial<GymProfile>) => void;
  onUpdateGymSettings: (updates: Partial<GymSettings>) => void;
  onOpenNotifications: () => void;
  onOpenStaffPermissions: () => void;
  onOpenPlans: () => void;
  onOpenHelpSupport: () => void;
}

export const GymProfileSettingsScreen: React.FC<GymProfileSettingsScreenProps> = ({
  gym,
  settings,
  members,
  plans,
  staff,
  unreadNotificationsCount,
  userEmail,
  onLogout,
  onBack,
  onSelectReportTab,
  onUpdateGymProfile,
  onUpdateGymSettings,
  onOpenNotifications,
  onOpenStaffPermissions,
  onOpenPlans,
  onOpenHelpSupport,
}) => {
  const [viewerRole, setViewerRole] = useState<'owner' | 'reception'>('owner');
  const isReadOnly = viewerRole !== 'owner';

  // Legal Modal
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Local draft state for settings so user can either auto-save or click Save Changes with feedback
  const [draftSettings, setDraftSettings] = useState<GymSettings>(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Gym Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: gym.name || 'MuscleFit Gym',
    ownerName: gym.ownerName || 'Vikram Sharma',
    phone: gym.phone || '+91 98765 43210',
    email: gym.email || 'contact@musclefitgym.in',
    location: gym.location || 'Indiranagar, Bengaluru',
    address: gym.address || '100 Feet Road, HAL 2nd Stage, Indiranagar',
    city: gym.city || 'Bengaluru, Karnataka',
    pincode: gym.pincode || '560038',
    gstNumber: gym.gstNumber || '29AABCM4821F1Z5',
    openingHours: gym.openingHours || '5:30 AM – 10:30 PM',
    sundayHours: gym.sundayHours || '6:00 AM – 1:00 PM',
  });
  const [profileError, setProfileError] = useState<string | null>(null);

  // WhatsApp Template Editor Accordion State
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);

  // Inline UPI & Prefix Editing
  const [isEditingBillingDetails, setIsEditingBillingDetails] = useState(false);
  const [upiInput, setUpiInput] = useState(settings.upiId || 'musclefitgym@okaxis');
  const [prefixInput, setPrefixInput] = useState(settings.receiptPrefix || 'PAY');

  useEffect(() => {
    setDraftSettings(settings);
    setUpiInput(settings.upiId || 'musclefitgym@okaxis');
    setPrefixInput(settings.receiptPrefix || 'PAY');
  }, [settings]);

  useEffect(() => {
    setProfileForm({
      name: gym.name || 'MuscleFit Gym',
      ownerName: gym.ownerName || 'Vikram Sharma',
      phone: gym.phone || '+91 98765 43210',
      email: gym.email || 'contact@musclefitgym.in',
      location: gym.location || 'Indiranagar, Bengaluru',
      address: gym.address || '100 Feet Road, HAL 2nd Stage, Indiranagar',
      city: gym.city || 'Bengaluru, Karnataka',
      pincode: gym.pincode || '560038',
      gstNumber: gym.gstNumber || '29AABCM4821F1Z5',
      openingHours: gym.openingHours || '5:30 AM – 10:30 PM',
      sundayHours: gym.sundayHours || '6:00 AM – 1:00 PM',
    });
  }, [gym]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleSettingChange = <K extends keyof GymSettings>(
    key: K,
    value: GymSettings[K]
  ) => {
    if (isReadOnly) {
      showToast('Only the Gym Owner can modify gym settings.');
      return;
    }
    const updated = { ...draftSettings, [key]: value };
    setDraftSettings(updated);
    setHasUnsavedChanges(true);
    onUpdateGymSettings({ [key]: value });
  };

  const handleTogglePaymentMethod = (
    method: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer'
  ) => {
    if (isReadOnly) {
      showToast('Only the Gym Owner can modify payment settings.');
      return;
    }
    const current = draftSettings.acceptedPaymentMethods || ['UPI', 'Cash'];
    const exists = current.includes(method);
    if (exists && current.length <= 1) {
      showToast('At least one payment method must remain enabled.');
      return;
    }
    const nextMethods = exists
      ? current.filter((m) => m !== method)
      : [...current, method];
    const nextDefault = nextMethods.includes(draftSettings.defaultPaymentMethod)
      ? draftSettings.defaultPaymentMethod
      : nextMethods[0];

    setDraftSettings((prev) => ({
      ...prev,
      acceptedPaymentMethods: nextMethods,
      defaultPaymentMethod: nextDefault,
    }));
    setHasUnsavedChanges(true);
    onUpdateGymSettings({
      acceptedPaymentMethods: nextMethods,
      defaultPaymentMethod: nextDefault,
    });
  };

  const handleSaveAllSettings = () => {
    if (isReadOnly) return;
    const cleanedUpi = upiInput.trim() || 'musclefitgym@okaxis';
    const cleanedPrefix = prefixInput.trim().toUpperCase() || 'PAY';
    const finalSettings: GymSettings = {
      ...draftSettings,
      upiId: cleanedUpi,
      receiptPrefix: cleanedPrefix,
    };
    onUpdateGymSettings(finalSettings);
    setIsEditingBillingDetails(false);
    setHasUnsavedChanges(false);
    showToast('Gym settings and preferences saved.');
  };

  const handleSaveProfileModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileError('Gym name is required.');
      return;
    }
    if (!profileForm.ownerName.trim()) {
      setProfileError('Owner name is required.');
      return;
    }
    if (profileForm.phone.replace(/\D/g, '').length < 10) {
      setProfileError('Enter a valid 10-digit Indian phone number.');
      return;
    }
    setProfileError(null);
    onUpdateGymProfile({
      name: profileForm.name.trim(),
      ownerName: profileForm.ownerName.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      location: profileForm.location.trim(),
      address: profileForm.address.trim(),
      city: profileForm.city.trim(),
      pincode: profileForm.pincode.trim(),
      gstNumber: profileForm.gstNumber.trim().toUpperCase(),
      openingHours: profileForm.openingHours.trim(),
      sundayHours: profileForm.sundayHours.trim(),
    });
    setIsEditProfileOpen(false);
    showToast('Gym profile details updated.');
  };

  const handleExportGymSummaryCsv = () => {
    const rows = [
      ['Section', 'Field', 'Value'],
      ['Gym Profile', 'Gym Name', gym.name],
      ['Gym Profile', 'Owner Name', gym.ownerName],
      ['Gym Profile', 'Phone', gym.phone],
      ['Gym Profile', 'Email', gym.email || 'contact@musclefitgym.in'],
      ['Gym Profile', 'Location', gym.location],
      ['Gym Profile', 'Address', gym.address || ''],
      ['Gym Profile', 'GSTIN', gym.gstNumber || ''],
      ['Gym Profile', 'Operating Hours', gym.openingHours || '5:30 AM – 10:30 PM'],
      ['Payment Settings', 'Currency', gym.currency],
      [
        'Payment Settings',
        'Accepted Methods',
        (draftSettings.acceptedPaymentMethods || []).join(', '),
      ],
      ['Payment Settings', 'Default Method', draftSettings.defaultPaymentMethod],
      ['Payment Settings', 'UPI ID', draftSettings.upiId],
      ['Payment Settings', 'Receipt Prefix', draftSettings.receiptPrefix],
      [
        'Attendance & Rules',
        'Expiry Reminder Window',
        `${draftSettings.expiryReminderDays} Days`,
      ],
      [
        'Attendance & Rules',
        'Renewal Grace Period',
        `${draftSettings.renewalGracePeriodDays} Days`,
      ],
      [
        'Attendance & Rules',
        'Auto-Mark Inactive Threshold',
        `${draftSettings.autoMarkInactiveDays} Days`,
      ],
      ['Counts', 'Total Members', String(members.length)],
      [
        'Counts',
        'Active Plans',
        String(plans.filter((p) => p.status === 'active').length),
      ],
      [
        'Counts',
        'Active Staff',
        String(staff.filter((s) => s.status === 'active').length),
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows
        .map((r) =>
          r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${gym.name.toLowerCase().replace(/\s+/g, '_')}_settings_backup.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Gym configuration and summary exported (CSV).');
  };

  const activeStaffCount = staff.filter((s) => s.status === 'active').length;
  const activePlansCount = plans.filter((p) => p.status === 'active').length;

  return (
    <div className="w-full pt-3 pb-6 space-y-2.5">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#191919] text-white text-[11.5px] font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              Gym Profile & Settings
            </h1>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Manage your gym details and preferences.
            </p>
          </div>
        </div>

        {/* Role Permission Preview Switcher */}
        <button
          type="button"
          onClick={() =>
            setViewerRole((prev) => (prev === 'owner' ? 'reception' : 'owner'))
          }
          className="h-[26px] px-2 rounded-lg bg-white border border-[#EAE5DC] text-[10px] font-bold text-[#52525B] flex items-center gap-1 shrink-0 shadow-2xs hover:bg-[#F8F6F1] cursor-pointer"
          title="Toggle role permission preview"
        >
          <Shield className="w-3 h-3 text-[#1E3A8A]" />
          <span>{viewerRole === 'owner' ? 'Owner View' : 'Staff View'}</span>
        </button>
      </div>

      {/* REPORT / ADMIN SWITCHER PILLS */}
      {onSelectReportTab && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'overview', label: 'Reports Overview' },
              { id: 'complaints', label: 'Complaints & Support' },
              { id: 'gym_settings', label: 'Gym Settings' },
              { id: 'notifications', label: `Notifications (${unreadNotificationsCount})` },
              { id: 'staff_permissions', label: 'Staff Permissions' },
              { id: 'support', label: 'Help & Support' },
              { id: 'retention', label: 'Retention' },
              { id: 'staff', label: 'Staff Report' },
              { id: 'revenue', label: 'Revenue' },
              { id: 'membership', label: 'Memberships' },
            ] as Array<{ id: ReportTabType; label: string }>
          ).map((t) => {
            const isActive = t.id === 'gym_settings';
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

      {/* Read-only notice for non-owner staff */}
      {isReadOnly && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-2.5 flex items-center gap-2 text-[#B45309]">
          <Lock className="w-4 h-4 shrink-0" />
          <p className="text-[11px] font-semibold leading-snug">
            Viewing in Staff Mode (Read-Only). Only the Gym Owner can edit gym profile and business settings.
          </p>
        </div>
      )}

      {/* 2. GYM IDENTITY HERO CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Brand Emblem Avatar */}
            <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-xs relative">
              <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                <rect x="34" y="47" width="32" height="6" rx="3" fill="#FFFFFF" />
                <rect x="26" y="38" width="7" height="24" rx="3.5" fill="#FFFFFF" />
                <rect x="34" y="32" width="7.5" height="36" rx="3.75" fill="#FFFFFF" />
                <rect x="58.5" y="32" width="7.5" height="36" rx="3.75" fill="#FFFFFF" />
                <rect x="67" y="38" width="7" height="24" rx="3.5" fill="#FFFFFF" />
              </svg>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-[15px] font-bold text-[#191919] truncate">
                  {gym.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[9.5px] font-bold">
                  Active Branch
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-[#52525B] mt-0.5 truncate">
                {gym.location} • Branch ID: {gym.branchCode || 'MFG-BLR-01'}
              </p>
              <p className="text-[10.5px] text-[#71717A] mt-0.5">
                Owner: <span className="font-semibold text-[#191919]">{gym.ownerName}</span> • Est. {gym.establishedYear || '2021'}
              </p>
            </div>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="h-[30px] px-2.5 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E3A8A] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Compact Summary Strip inside Identity Card */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#F4F1EA]">
          <div className="bg-[#FAF8F5] rounded-xl p-2 text-center border border-[#F2EFE8]">
            <div className="text-[13px] font-extrabold text-[#191919]">
              {members.length}
            </div>
            <div className="text-[9.5px] font-semibold text-[#71717A] mt-0.5">
              Total Members
            </div>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl p-2 text-center border border-[#F2EFE8]">
            <div className="text-[13px] font-extrabold text-[#1E3A8A]">
              {activePlansCount}
            </div>
            <div className="text-[9.5px] font-semibold text-[#71717A] mt-0.5">
              Active Plans
            </div>
          </div>
          <div className="bg-[#FAF8F5] rounded-xl p-2 text-center border border-[#F2EFE8]">
            <div className="text-[13px] font-extrabold text-[#16A34A]">
              {activeStaffCount}
            </div>
            <div className="text-[9.5px] font-semibold text-[#71717A] mt-0.5">
              Active Staff
            </div>
          </div>
        </div>
      </div>

      {/* 3. GYM INFORMATION DETAILS CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[13.5px] font-bold text-[#191919]">
              Gym Information
            </h3>
            <p className="text-[10.5px] text-[#71717A]">
              Contact details, address, and operating timings
            </p>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
            >
              Update Details
            </button>
          )}
        </div>

        <div className="divide-y divide-[#F4F1EA]">
          <div className="py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] text-[#71717A]">Gym Name</div>
                <div className="text-[12px] font-bold text-[#191919] truncate">
                  {gym.name}
                </div>
              </div>
            </div>
            <span className="text-[10.5px] font-semibold text-[#52525B] bg-[#F4F1EA] px-2 py-0.5 rounded-md">
              {gym.gstNumber || '29AABCM4821F1Z5'}
            </span>
          </div>

          <div className="py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] text-[#71717A]">Owner / Primary Admin</div>
                <div className="text-[12px] font-bold text-[#191919] truncate">
                  {gym.ownerName}
                </div>
              </div>
            </div>
          </div>

          <div className="py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] text-[#71717A]">Phone Number</div>
                <div className="text-[12px] font-bold text-[#191919]">
                  {gym.phone}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Mail className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
              <span className="text-[11px] font-medium text-[#52525B] truncate max-w-[140px]">
                {gym.email || 'contact@musclefitgym.in'}
              </span>
            </div>
          </div>

          <div className="py-2 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] text-[#71717A]">Gym Address</div>
              <div className="text-[12px] font-bold text-[#191919] leading-snug">
                {gym.address || '100 Feet Road, HAL 2nd Stage, Indiranagar'}, {gym.city || 'Bengaluru'} - {gym.pincode || '560038'}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] text-[#71717A]">Operating Hours</div>
              <div className="text-[12px] font-bold text-[#191919]">
                Mon – Sat: {gym.openingHours || '5:30 AM – 10:30 PM'}
              </div>
              <div className="text-[11px] font-medium text-[#71717A]">
                Sunday: {gym.sundayHours || '6:00 AM – 1:00 PM'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BUSINESS & PAYMENT SETTINGS CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-[13.5px] font-bold text-[#191919]">
                Business & Payment Settings
              </h3>
              <p className="text-[10.5px] text-[#71717A]">
                Currency, accepted payment modes, and receipt format
              </p>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsEditingBillingDetails((prev) => !prev)}
              className="text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
            >
              {isEditingBillingDetails ? 'Done' : 'Edit UPI / Prefix'}
            </button>
          )}
        </div>

        {/* Accepted Payment Methods */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold text-[#191919]">
              Accepted Payment Methods
            </span>
            <span className="text-[10.5px] font-medium text-[#71717A]">
              Currency: <strong className="text-[#191919]">₹ INR</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((method) => {
              const isSelected = (
                draftSettings.acceptedPaymentMethods || []
              ).includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleTogglePaymentMethod(method)}
                  className={`h-[32px] px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEF2FF] border-[#1E3A8A] text-[#1E3A8A]'
                      : 'bg-[#FAF8F5] border-[#E5E0D6] text-[#71717A]'
                  }`}
                >
                  <span className="truncate">{method}</span>
                  {isSelected && <Check className="w-3 h-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Payment Method Selector */}
        <div className="flex items-center justify-between pt-1 border-t border-[#F4F1EA]">
          <div>
            <div className="text-[12px] font-bold text-[#191919]">
              Default Payment Mode
            </div>
            <div className="text-[10.5px] text-[#71717A]">
              Pre-selected when recording member fees
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(draftSettings.acceptedPaymentMethods || ['UPI', 'Cash']).map(
              (m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSettingChange('defaultPaymentMethod', m)}
                  className={`h-[26px] px-2 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                    draftSettings.defaultPaymentMethod === m
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-[#F4F1EA] text-[#52525B] hover:bg-[#EAE5DC]'
                  }`}
                >
                  {m}
                </button>
              )
            )}
          </div>
        </div>

        {/* UPI ID & Receipt Prefix */}
        {isEditingBillingDetails ? (
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Gym Merchant UPI ID
                </label>
                <input
                  type="text"
                  value={upiInput}
                  onChange={(e) => {
                    setUpiInput(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full h-[32px] px-2.5 rounded-lg bg-white border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  placeholder="e.g. musclefitgym@okaxis"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Receipt Prefix
                </label>
                <input
                  type="text"
                  value={prefixInput}
                  onChange={(e) => {
                    setPrefixInput(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full h-[32px] px-2.5 rounded-lg bg-white border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  placeholder="e.g. PAY"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveAllSettings}
                className="h-[28px] px-3 rounded-lg bg-[#1E3A8A] text-white text-[11px] font-bold cursor-pointer"
              >
                Save Billing Details
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F4F1EA]">
            <div className="bg-[#FAF8F5] rounded-xl p-2 border border-[#F2EFE8]">
              <div className="text-[10px] font-medium text-[#71717A]">
                Merchant UPI ID
              </div>
              <div className="text-[11.5px] font-bold text-[#191919] truncate mt-0.5">
                {draftSettings.upiId || 'musclefitgym@okaxis'}
              </div>
            </div>
            <div className="bg-[#FAF8F5] rounded-xl p-2 border border-[#F2EFE8]">
              <div className="text-[10px] font-medium text-[#71717A]">
                Receipt Number Format
              </div>
              <div className="text-[11.5px] font-bold text-[#191919] truncate mt-0.5">
                #{draftSettings.receiptPrefix || 'PAY'}000143
              </div>
            </div>
          </div>
        )}

        {/* Partial Payments & GST Toggles */}
        <div className="divide-y divide-[#F4F1EA] pt-1 border-t border-[#F4F1EA]">
          <div className="py-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-bold text-[#191919]">
                Allow Partial / Split Payments
              </div>
              <div className="text-[10.5px] text-[#71717A]">
                Track pending balances and due dates automatically
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draftSettings.allowPartialPayments}
              onClick={() =>
                handleSettingChange(
                  'allowPartialPayments',
                  !draftSettings.allowPartialPayments
                )
              }
              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                draftSettings.allowPartialPayments
                  ? 'bg-[#1E3A8A]'
                  : 'bg-[#D4D4D8]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                  draftSettings.allowPartialPayments
                    ? 'translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-bold text-[#191919]">
                Include GST on Payment Receipts ({draftSettings.gstPercentage || 18}%)
              </div>
              <div className="text-[10.5px] text-[#71717A]">
                Display GSTIN ({gym.gstNumber || '29AABCM4821F1Z5'}) and tax split on receipts
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draftSettings.enableGstBilling}
              onClick={() =>
                handleSettingChange(
                  'enableGstBilling',
                  !draftSettings.enableGstBilling
                )
              }
              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                draftSettings.enableGstBilling ? 'bg-[#1E3A8A]' : 'bg-[#D4D4D8]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                  draftSettings.enableGstBilling
                    ? 'translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MEMBERSHIP & ATTENDANCE RULES CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
            <CalendarCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[13.5px] font-bold text-[#191919]">
              Membership & Attendance Rules
            </h3>
            <p className="text-[10.5px] text-[#71717A]">
              Renewal reminders, inactivity rules, and check-in controls
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Expiry Reminder Days */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[12px] font-bold text-[#191919]">
                Expiry Reminder Window
              </div>
              <div className="text-[10.5px] text-[#71717A]">
                Flag memberships as "Expiring Soon" before end date
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[3, 5, 7, 10].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSettingChange('expiryReminderDays', days)}
                  className={`h-[26px] px-2 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                    draftSettings.expiryReminderDays === days
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-[#F4F1EA] text-[#52525B] hover:bg-[#EAE5DC]'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Mark Inactive Threshold */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F4F1EA]">
            <div>
              <div className="text-[12px] font-bold text-[#191919]">
                Auto-Flag Inactive Members
              </div>
              <div className="text-[10.5px] text-[#71717A]">
                Alert when an active member hasn't visited the gym
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[14, 21, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() =>
                    handleSettingChange('autoMarkInactiveDays', days)
                  }
                  className={`h-[26px] px-2 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                    draftSettings.autoMarkInactiveDays === days
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-[#F4F1EA] text-[#52525B] hover:bg-[#EAE5DC]'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Default Check-in Method */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F4F1EA]">
            <div>
              <div className="text-[12px] font-bold text-[#191919]">
                Default Check-In Mode
              </div>
              <div className="text-[10.5px] text-[#71717A]">
                Primary attendance logging method at reception
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(
                [
                  { id: 'QR_Scan', label: 'QR Scan' },
                  { id: 'Manual', label: 'Manual' },
                  { id: 'Member_ID', label: 'ID Code' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    handleSettingChange('defaultCheckInMethod', mode.id)
                  }
                  className={`h-[26px] px-2 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                    draftSettings.defaultCheckInMethod === mode.id
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-[#F4F1EA] text-[#52525B] hover:bg-[#EAE5DC]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block Expired Member Check-In */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F4F1EA]">
            <div>
              <div className="text-[12px] font-bold text-[#191919]">
                Restrict Expired Member Check-In
              </div>
              <div className="text-[10.5px] text-[#71717A]">
                Show renewal prompt when an expired member tries to check in
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draftSettings.blockExpiredMemberCheckIn}
              onClick={() =>
                handleSettingChange(
                  'blockExpiredMemberCheckIn',
                  !draftSettings.blockExpiredMemberCheckIn
                )
              }
              className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                draftSettings.blockExpiredMemberCheckIn
                  ? 'bg-[#1E3A8A]'
                  : 'bg-[#D4D4D8]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                  draftSettings.blockExpiredMemberCheckIn
                    ? 'translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 6. NOTIFICATION PREFERENCES CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-[13.5px] font-bold text-[#191919]">
                Notification Preferences
              </h3>
              <p className="text-[10.5px] text-[#71717A]">
                Choose which business alerts and reminders you receive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="h-[26px] px-2.5 rounded-full bg-[#EEF2FF] text-[#1E3A8A] text-[10.5px] font-bold flex items-center gap-1 cursor-pointer hover:bg-[#E0E7FF]"
          >
            <span>View Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#EF4444] text-white text-[9.5px] font-extrabold">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        <div className="divide-y divide-[#F4F1EA]">
          {(
            [
              {
                key: 'notifyMembershipExpiry',
                title: 'Membership Expiry Alerts',
                desc: `Notify when memberships expire within ${draftSettings.expiryReminderDays} days`,
              },
              {
                key: 'notifyPendingPayments',
                title: 'Pending & Overdue Payment Alerts',
                desc: 'Remind about partial balances and overdue member fees',
              },
              {
                key: 'notifyInactiveMembers',
                title: 'Inactive Member Warnings',
                desc: `Alert when active members miss ${draftSettings.autoMarkInactiveDays}+ days`,
              },
              {
                key: 'notifyNewLeadsAndFollowUps',
                title: 'Lead & Follow-Up Reminders',
                desc: 'Daily alerts for scheduled trial and enquiry follow-ups',
              },
              {
                key: 'notifyStaffAttendanceAndSalary',
                title: 'Staff Attendance & Salary Alerts',
                desc: 'Notify on staff absences, late check-ins, and salary dues',
              },
              {
                key: 'notifyDailySummary',
                title: 'Daily Collection & Attendance Digest',
                desc: 'End-of-day summary of total revenue and gym check-ins',
              },
            ] as Array<{
              key: keyof GymSettings;
              title: string;
              desc: string;
            }>
          ).map((item) => {
            const isEnabled = Boolean(draftSettings[item.key]);
            return (
              <div
                key={item.key}
                className="py-2 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-[12px] font-bold text-[#191919]">
                    {item.title}
                  </div>
                  <div className="text-[10.5px] text-[#71717A]">{item.desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={() => handleSettingChange(item.key, !isEnabled as any)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                    isEnabled ? 'bg-[#1E3A8A]' : 'bg-[#D4D4D8]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-2xs transition-transform ${
                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Reminder Message Templates Accordion */}
        <div className="pt-2 border-t border-[#F4F1EA]">
          <button
            type="button"
            onClick={() => setIsTemplateEditorOpen((prev) => !prev)}
            className="w-full flex items-center justify-between py-1.5 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#191919]">
                  WhatsApp Reminder Templates
                </div>
                <div className="text-[10.5px] text-[#71717A]">
                  Customize automated renewal and fee reminder messages
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#71717A] transition-transform ${
                isTemplateEditorOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isTemplateEditorOpen && (
            <div className="mt-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2.5">
              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Renewal Reminder Message
                </label>
                <textarea
                  rows={2}
                  value={draftSettings.whatsappRenewalTemplate}
                  onChange={(e) =>
                    handleSettingChange(
                      'whatsappRenewalTemplate',
                      e.target.value
                    )
                  }
                  className="w-full p-2 rounded-lg bg-white border border-[#D6D0C4] text-[11px] text-[#191919] leading-snug"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-[#52525B] mb-1">
                  Pending Payment Reminder Message
                </label>
                <textarea
                  rows={2}
                  value={draftSettings.whatsappPaymentTemplate}
                  onChange={(e) =>
                    handleSettingChange(
                      'whatsappPaymentTemplate',
                      e.target.value
                    )
                  }
                  className="w-full p-2 rounded-lg bg-white border border-[#D6D0C4] text-[11px] text-[#191919] leading-snug"
                />
              </div>
              <div className="text-[10px] text-[#71717A]">
                Supported tags: <code className="font-bold">{'{member_name}'}</code>,{' '}
                <code className="font-bold">{'{plan_name}'}</code>,{' '}
                <code className="font-bold">{'{expiry_date}'}</code>,{' '}
                <code className="font-bold">{'{pending_amount}'}</code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. QUICK ADMINISTRATION & SUPPORT LINKS CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2">
        <h3 className="text-[13.5px] font-bold text-[#191919]">
          Gym Administration & Support
        </h3>
        <div className="divide-y divide-[#F4F1EA]">
          <button
            type="button"
            onClick={onOpenStaffPermissions}
            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAF8F5] rounded-xl px-1 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#191919]">
                  Staff & Role Permissions
                </div>
                <div className="text-[10.5px] text-[#71717A]">
                  {activeStaffCount} active staff • Configure Trainer, Reception & Manager access
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A]" />
          </button>

          <button
            type="button"
            onClick={onOpenPlans}
            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAF8F5] rounded-xl px-1 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#191919]">
                  Membership Plans & Pricing
                </div>
                <div className="text-[10.5px] text-[#71717A]">
                  {activePlansCount} active plans • Manage durations and joining fees
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A]" />
          </button>

          <button
            type="button"
            onClick={onOpenHelpSupport}
            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAF8F5] rounded-xl px-1 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#191919]">
                  Help & Support Center
                </div>
                <div className="text-[10.5px] text-[#71717A]">
                  FAQs, WhatsApp support, and issue reporting
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A]" />
          </button>
        </div>
      </div>

      {/* 8. ACCOUNT, SECURITY & LEGAL */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-3">
        <h3 className="text-[13.5px] font-bold text-[#191919]">
          Owner Account & Security
        </h3>
        
        <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#71717A]">Owner Profile</span>
            <span className="text-[11px] font-bold text-[#102A71] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
              Authenticated Owner
            </span>
          </div>
          <div className="text-[13px] font-bold text-[#191919]">{gym.ownerName}</div>
          <div className="text-[11.5px] text-[#52525B]">
            {userEmail || gym.email || 'Registered via Gym Business OS'}
          </div>
          <div className="text-[10px] text-[#A1A1AA] pt-1">
            Gym ID: <code className="font-mono">{gym.id}</code> • Branch: {gym.branchCode}
          </div>
        </div>

        {/* Legal & Compliance Links */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setLegalModalTab('terms');
              setIsLegalModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#E5E0D6] text-[11px] font-bold text-[#191919] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#102A71]" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#E5E0D6] text-[11px] font-bold text-[#191919] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-[#102A71]" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Sign Out Button */}
        {onLogout && (
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-full py-2.5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Gym Account</span>
          </button>
        )}
      </div>

      {/* 9. SAVE CHANGES & DATA EXPORT ACTIONS */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleExportGymSummaryCsv}
            className="h-[36px] px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#E5E0D6] text-[#191919] text-[11.5px] font-bold flex items-center justify-center gap-1.5 flex-1 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>Export Backup CSV</span>
          </button>

          <button
            type="button"
            disabled={isReadOnly}
            onClick={handleSaveAllSettings}
            className={`h-[36px] px-4 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer ${
              isReadOnly
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#1E3A8A] hover:bg-[#163172] text-white shadow-xs'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{hasUnsavedChanges ? 'Save Changes' : 'Settings Saved'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* EDIT GYM PROFILE MODAL                                         */}
      {/* ============================================================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 border border-[#EAE5DC] shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4F1EA]">
              <div>
                <h3 className="text-[15px] font-bold text-[#191919]">
                  Edit Gym Profile
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Update branch name, contact info, and timings
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {profileError && (
              <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-[11px] font-semibold">
                {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfileModal} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Gym Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.ownerName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        ownerName: e.target.value,
                      })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Area / City Label
                  </label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        location: e.target.value,
                      })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={profileForm.gstNumber}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        gstNumber: e.target.value,
                      })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Mon – Sat Hours
                  </label>
                  <input
                    type="text"
                    value={profileForm.openingHours}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        openingHours: e.target.value,
                      })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52525B] mb-1">
                    Sunday Hours
                  </label>
                  <input
                    type="text"
                    value={profileForm.sundayHours}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        sundayHours: e.target.value,
                      })
                    }
                    className="w-full h-[34px] px-2.5 rounded-xl border border-[#D6D0C4] text-[12px] font-semibold text-[#191919]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F4F1EA]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="h-[34px] px-3.5 rounded-xl bg-[#F4F1EA] text-[#52525B] text-[11.5px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[34px] px-4 rounded-xl bg-[#1E3A8A] text-white text-[11.5px] font-bold cursor-pointer shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#EAE5DC] shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-[#DC2626]">
              <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold text-[#191919]">
                Sign Out of Gym Account
              </h3>
            </div>
            <p className="text-[12px] text-[#52525B] leading-relaxed">
              Are you sure you want to sign out? Your gym data is securely synced and saved in your account.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F4F1EA]">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-3 py-2 rounded-xl bg-[#F4F1EA] text-[#52525B] text-[12px] font-bold cursor-pointer hover:bg-[#EAE5DC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  onLogout?.();
                }}
                className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-[12px] font-bold cursor-pointer hover:bg-[#B91C1C] shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEGAL & POLICIES MODAL */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
};
