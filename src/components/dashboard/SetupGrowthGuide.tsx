/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
  BookOpen,
  ArrowRight,
  UserPlus,
  Calendar,
  CreditCard,
  Check,
  Building2,
  X,
} from 'lucide-react';
import { GymProfile, OnboardingPreferences } from '../../types/dashboard';

interface SetupGrowthGuideProps {
  gym: GymProfile;
  onboarding: OnboardingPreferences;
  membersCount: number;
  plansCount: number;
  paymentsCount: number;
  attendanceCount: number;
  onOpenAddMember: () => void;
  onOpenImportMembers: () => void;
  onOpenPlans: () => void;
  onOpenRecordPayment: () => void;
  onOpenAttendance: () => void;
}

export const SetupGrowthGuide: React.FC<SetupGrowthGuideProps> = ({
  gym,
  onboarding,
  membersCount,
  plansCount,
  paymentsCount,
  attendanceCount,
  onOpenAddMember,
  onOpenImportMembers,
  onOpenPlans,
  onOpenRecordPayment,
  onOpenAttendance,
}) => {
  const LAUNCH_APPEAR_KEY = `gym_new_launch_appear_count_${gym.name ? gym.name.replace(/\s+/g, '_') : 'default'}`;

  // Keep open permanently once user clicks any button like Add Member until they click the X button
  const [keepVisible, setKeepVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Appears only 2 times total in the app
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const rawCount = localStorage.getItem(LAUNCH_APPEAR_KEY);
      const count = rawCount ? parseInt(rawCount, 10) : 0;
      if (count >= 2) {
        return true; // Already appeared 2 times
      }
      localStorage.setItem(LAUNCH_APPEAR_KEY, String(count + 1));
      return false;
    } catch {
      return false;
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-dismiss after 4.5 - 5 seconds unless user clicks any button or interacts
  useEffect(() => {
    if (isDismissed || keepVisible) {
      setIsFadingOut(false);
      return;
    }

    // Start subtle fade-out at 4.2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 4200);

    // Auto-dismiss at 4.8 seconds (between 4-5 seconds)
    const dismissTimer = setTimeout(() => {
      setIsDismissed(true);
    }, 4800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [isDismissed, keepVisible]);

  // When user interacts or clicks any button (e.g. Add Member), cancel timer and keep until X is clicked
  const pinOpen = () => {
    setKeepVisible(true);
    setIsFadingOut(false);
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDismissed(true);
    try {
      localStorage.setItem(LAUNCH_APPEAR_KEY, '2');
    } catch {
      // ignore
    }
  };

  const isMemberStepDone = membersCount > 0;
  const isPlanStepDone = plansCount > 0;
  const isPaymentStepDone = paymentsCount > 0;
  const isAttendanceStepDone = attendanceCount > 0;

  const completedStepsCount =
    (isMemberStepDone ? 1 : 0) +
    (isPlanStepDone ? 1 : 0) +
    (isPaymentStepDone ? 1 : 0) +
    (isAttendanceStepDone ? 1 : 0);

  const allStepsDone = completedStepsCount === 4;

  if (isDismissed) return null;

  // Question 3: Tailored Starting Size Guidance
  const memberOption = onboarding?.memberCountOption || gym.startingMemberRange || '';
  const isNewGym =
    memberOption.includes('starting') ||
    memberOption.includes('No members') ||
    onboarding?.managementMethod?.includes('new gym');
  const isSmallGym = memberOption.includes('1–50') || memberOption.includes('1-50');
  const isGrowingGym =
    memberOption.includes('51') ||
    memberOption.includes('101') ||
    memberOption.includes('251') ||
    memberOption.includes('500') ||
    memberOption.includes('Other / Custom');

  // Question 4: Tailored Record-Keeping Migration Assistance
  const method = onboarding?.managementMethod || gym.managementMethod || '';
  const isExcel = method.includes('Excel') || method.includes('spreadsheets');
  const isNotebook = method.includes('Notebook') || method.includes('register');
  const isAnotherApp = method.includes('Another') || method.includes('app');

  const getTailoredHeader = () => {
    if (isNewGym) {
      return {
        badge: 'New Gym Launch Track',
        title: `Welcome to ${gym.name || 'your gym'}`,
        subtitle:
          'Set up your core membership packages first, then enroll your initial members.',
      };
    }
    if (isExcel) {
      return {
        badge: 'Spreadsheet Migration',
        title: `Migrating to ${gym.name || 'your gym'}`,
        subtitle:
          'You manage records in Excel/spreadsheets. Use our one-tap CSV/XLSX import to migrate your existing member roster in seconds.',
      };
    }
    if (isNotebook) {
      return {
        badge: 'Digital Register Upgrade',
        title: `Digitizing ${gym.name || 'your gym'}`,
        subtitle:
          'Switching from a paper notebook? Add members and record payments digitally to generate clean receipts and track pending dues automatically.',
      };
    }
    if (isSmallGym) {
      return {
        badge: 'Setup Guide (1–50 Members)',
        title: `Setup for ${gym.name || 'your gym'}`,
        subtitle:
          'Quickly add or import your active members and set up plan durations to start monitoring expiries.',
      };
    }
    if (isGrowingGym) {
      return {
        badge: 'Roster Migration Track',
        title: `Scale Setup for ${gym.name || 'your gym'}`,
        subtitle:
          'Import your member roster to establish renewal expiries and payment balances without manual re-entry.',
      };
    }
    return {
      badge: 'Quick Setup Guide',
      title: `Get started with ${gym.name || 'your gym'}`,
      subtitle:
        'Complete the key operational setup steps below to start tracking memberships and collections.',
    };
  };

  const advice = getTailoredHeader();

  const checklistItems = [
    {
      id: 'plans',
      label: 'Create membership plans',
      detail:
        plansCount > 0
          ? `${plansCount} ${plansCount === 1 ? 'plan' : 'plans'} active`
          : 'Define monthly, quarterly or custom rates',
      isDone: isPlanStepDone,
      icon: Calendar,
      action: onOpenPlans,
      actionLabel: 'Set Plans',
    },
    {
      id: 'members',
      label: isExcel ? 'Import or add members' : 'Add your first member',
      detail:
        membersCount > 0
          ? `${membersCount} ${membersCount === 1 ? 'member' : 'members'} enrolled`
          : isExcel
          ? 'Upload Excel/CSV file or enroll directly'
          : 'Save member phone, plan & start date',
      isDone: isMemberStepDone,
      icon: UserPlus,
      action: isExcel ? onOpenImportMembers : onOpenAddMember,
      actionLabel: isExcel ? 'Import Members' : 'Add Member',
      secondaryAction: isExcel ? onOpenAddMember : undefined,
      secondaryLabel: isExcel ? '+ Add Single' : undefined,
    },
    {
      id: 'payments',
      label: 'Record your first payment',
      detail:
        paymentsCount > 0
          ? `${paymentsCount} ${paymentsCount === 1 ? 'payment' : 'payments'} recorded`
          : 'Collect fee via accepted payment methods',
      isDone: isPaymentStepDone,
      icon: CreditCard,
      action: onOpenRecordPayment,
      actionLabel: 'Record Payment',
    },
    {
      id: 'attendance',
      label: 'Set up member attendance',
      detail:
        attendanceCount > 0
          ? `${attendanceCount} ${attendanceCount === 1 ? 'visit' : 'visits'} logged`
          : 'Track check-ins to spot inactive members',
      isDone: isAttendanceStepDone,
      icon: CheckCircle2,
      action: onOpenAttendance,
      actionLabel: 'Check-in Desk',
    },
  ];

  return (
    <div
      onClick={pinOpen}
      onMouseEnter={pinOpen}
      className={`w-full mt-3 bg-white rounded-2xl border border-[#EAE5DC] p-3.5 sm:p-4 shadow-2xs transition-all duration-500 relative cursor-default ${
        isFadingOut ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#F2EFE8]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#102A71] bg-[#EEF2FF]">
              <Sparkles className="w-3 h-3 text-[#102A71]" />
              {advice.badge}
            </span>
            <span className="text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
              {completedStepsCount} of 4 Complete
            </span>
            {keepVisible ? (
              <span className="text-[10px] font-medium text-[#71717A] bg-[#F4F1EA] px-2 py-0.5 rounded-full">
                Kept open until closed
              </span>
            ) : (
              <span className="text-[10px] text-[#A1A1AA] animate-pulse">
                Auto-closing in 5s • Click to keep
              </span>
            )}
          </div>
          <h2 className="text-[14px] sm:text-[15px] font-bold text-[#191919] mt-1 leading-snug truncate">
            {advice.title}
          </h2>
          <p className="text-[11px] sm:text-[11.5px] text-[#71717A] mt-0.5 leading-relaxed">
            {advice.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pinOpen();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded-lg text-[#71717A] hover:bg-[#F4F1EA] cursor-pointer"
            title={isCollapsed ? 'Expand guide' : 'Minimize guide'}
            aria-label={isCollapsed ? 'Expand guide' : 'Minimize guide'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 cursor-pointer" />
            ) : (
              <ChevronRight className="w-4 h-4 rotate-90 cursor-pointer" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-[#71717A] hover:bg-[#F4F1EA] cursor-pointer"
            title="Close guide"
            aria-label="Close guide"
          >
            <X className="w-4 h-4 cursor-pointer" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 w-full bg-[#EAE5DC] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#102A71] h-full transition-all duration-300 rounded-full"
          style={{ width: `${(completedStepsCount / 4) * 100}%` }}
        />
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="mt-3 space-y-2">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                  item.isDone
                    ? 'bg-[#F0FDF4]/50 border-[#86EFAC]/70'
                    : 'bg-[#FAF8F5] border-[#EAE5DC] hover:border-[#102A71]/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.isDone
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : 'bg-white border border-[#CBD5E1] text-[#102A71]'
                    }`}
                  >
                    {item.isDone ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-[12px] font-bold leading-tight truncate ${
                        item.isDone ? 'text-[#16A34A]' : 'text-[#191919]'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10.5px] text-[#71717A] truncate mt-0.5">
                      {item.detail}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.secondaryAction && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pinOpen();
                        item.secondaryAction?.();
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#EAE5DC] text-[#102A71] text-[11px] font-semibold hover:bg-[#F4F1EA] cursor-pointer shadow-2xs active:scale-95 transition-all"
                    >
                      {item.secondaryLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      pinOpen();
                      item.action();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs ${
                      item.isDone
                        ? 'bg-white border border-[#CBD5E1] text-[#191919] hover:bg-[#FAF8F5]'
                        : 'bg-[#102A71] hover:bg-[#0D225D] text-white active:scale-95'
                    }`}
                  >
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {allStepsDone && (
            <div className="mt-2 text-center p-2 rounded-xl bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>All 4 operational setup steps completed! Your gym is fully functional.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
