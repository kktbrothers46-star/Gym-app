/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Store,
  Check,
  Plus,
  Calendar,
  IndianRupee,
  UserCheck,
  BarChart3,
  Users,
  Settings,
  UserPlus,
  CreditCard,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  GymProfile,
  GymSettings,
  MembershipPlan,
  OnboardingPreferences,
} from '../../types/dashboard';
import { GymBuildingIllustration } from './GymBuildingIllustration';
import { MemberCountCardIllustration } from './MemberCountCardIllustration';

export type OnboardingChecklistAction =
  | 'dashboard'
  | 'add_member'
  | 'plans'
  | 'record_payment'
  | 'attendance';

interface OnboardingScreenProps {
  gym: GymProfile;
  settings: GymSettings;
  plans: MembershipPlan[];
  onboarding: OnboardingPreferences;
  isEmptyState: boolean;
  initialStep?: StepId;
  onRoleSelectedOwner?: () => void;
  membersCount?: number;
  plansCount?: number;
  paymentsCount?: number;
  attendanceCount?: number;
  onSaveProgress: (partial: Partial<OnboardingPreferences>) => void;
  onCompleteOnboarding: (
    payload: {
      gymProfile?: Partial<GymProfile>;
      settings?: Partial<GymSettings>;
      onboarding?: Partial<OnboardingPreferences>;
      updatedPlanPrices?: Record<string, number>;
      startWithEmptyGym?: boolean;
    },
    nextAction?: OnboardingChecklistAction
  ) => void;
  onBackToSplash: () => void;
}

type StepId = NonNullable<OnboardingPreferences['currentStep']>;

const MEMBER_COUNT_OPTIONS = [
  {
    id: 'Just starting — No members yet',
    title: 'Just starting',
    subtitle: 'No members yet',
    tier: 'starting' as const,
  },
  {
    id: '1–50 members',
    title: '1–50',
    subtitle: 'members',
    tier: '1-50' as const,
  },
  {
    id: '51–100 members',
    title: '51–100',
    subtitle: 'members',
    tier: '51-100' as const,
  },
  {
    id: '101–250 members',
    title: '101–250',
    subtitle: 'members',
    tier: '101-250' as const,
  },
  {
    id: '251–500 members',
    title: '251–500',
    subtitle: 'members',
    tier: '251-500' as const,
  },
  {
    id: 'More than 500 members',
    title: 'More than 500',
    subtitle: 'members',
    tier: '500+' as const,
  },
] as const;

const MANAGEMENT_METHODS = [
  { id: 'Notebook or register', label: 'Notebook or register', iconType: 'notebook' },
  { id: 'Excel or spreadsheets', label: 'Excel or spreadsheets', iconType: 'excel' },
  { id: 'Another gym management app', label: 'Another gym management app', iconType: 'app' },
  { id: 'A combination of methods', label: 'A combination of methods', iconType: 'combo' },
  { id: "I'm opening a new gym", label: "I'm opening a new gym", iconType: 'new_gym' },
] as const;

const CHALLENGE_OPTIONS = [
  {
    id: 'Tracking membership expiry and renewals',
    label: 'Tracking membership expiry and renewals',
    icon: 'expiry',
  },
  {
    id: 'Collecting payments and pending balances',
    label: 'Collecting payments and pending balances',
    icon: 'payments',
  },
  {
    id: 'Recording attendance',
    label: 'Recording attendance',
    icon: 'attendance',
  },
  {
    id: 'Tracking income and expenses',
    label: 'Tracking income and expenses',
    icon: 'finances',
  },
  {
    id: 'Following up with inactive members',
    label: 'Following up with inactive members',
    icon: 'retention',
  },
  {
    id: 'Managing everything in one place',
    label: 'Managing everything in one place',
    icon: 'all_in_one',
  },
] as const;

const PLAN_OPTIONS = [
  { id: 'Monthly', label: 'Monthly', badge: '1M', type: 'calendar' },
  { id: 'Quarterly', label: 'Quarterly', badge: '3M', type: 'calendar' },
  { id: 'Half-yearly', label: 'Half-yearly', badge: '6M', type: 'calendar' },
  { id: 'Annual', label: 'Annual', badge: '1Y', type: 'calendar' },
  { id: 'Custom duration', label: 'Custom duration', badge: '+', type: 'custom' },
  { id: "Haven't created plans yet", label: "Haven't created plans yet", badge: '', type: 'none' },
] as const;

const PAYMENT_OPTIONS = [
  { id: 'Cash', label: 'Cash', iconType: 'cash' },
  { id: 'UPI (GPay, PhonePe, etc.)', label: 'UPI (GPay, PhonePe, etc.)', iconType: 'upi' },
  { id: 'Bank transfer', label: 'Bank transfer', iconType: 'bank' },
  { id: 'Card', label: 'Card', iconType: 'card' },
] as const;

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  gym,
  settings,
  onboarding,
  initialStep,
  onRoleSelectedOwner,
  membersCount = 0,
  plansCount = 0,
  paymentsCount = 0,
  attendanceCount = 0,
  onSaveProgress,
  onCompleteOnboarding,
  onBackToSplash,
}) => {
  const isRoleSelectionOnly = initialStep === 'role';

  // Resume from saved step or initialStep if provided (never show pre-auth role steps to authenticated owner onboarding)
  const [step, setStep] = useState<StepId>(() => {
    if (initialStep) return initialStep;
    const savedStep = onboarding?.currentStep;
    if (
      savedStep &&
      !onboarding?.hasCompletedOnboarding &&
      savedStep !== 'welcome' &&
      savedStep !== 'role' &&
      savedStep !== 'member_coming_soon'
    ) {
      return savedStep;
    }
    return 'gym_name';
  });

  // Track horizontal slide direction ('forward' | 'backward') and reduced-motion preference
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const navigateToStep = (nextStep: StepId, direction: 'forward' | 'backward') => {
    setSlideDirection(direction);
    setStep(nextStep);
  };

  // Screen 2: Role selection ('owner' | 'member' | null)
  const [selectedRole, setSelectedRole] = useState<'owner' | 'member' | null>(
    isRoleSelectionOnly ? (onboarding?.selectedRole ?? null) : 'owner'
  );

  // Screen 4: Gym Name
  const [gymName, setGymName] = useState<string>(
    onboarding?.gymName || (gym?.name && gym.name !== 'My Gym' ? gym.name : '')
  );
  const [gymNameTouched, setGymNameTouched] = useState<boolean>(false);

  // Screen 5: Member Count (Single-select + Custom)
  const [memberCountOption, setMemberCountOption] = useState<string>(
    onboarding?.memberCountOption ?? ''
  );
  const [customMemberCount, setCustomMemberCount] = useState<string>(
    onboarding?.customMemberCount ?? ''
  );

  // Screen 6: Current Management Method (Single-select + Custom)
  const [managementMethod, setManagementMethod] = useState<string>(
    onboarding?.managementMethod ?? ''
  );
  const [customManagementMethod, setCustomManagementMethod] = useState<string>(
    onboarding?.customManagementMethod ?? ''
  );

  // Screen 7: Biggest Challenge (Multi-select + Custom)
  const [challenges, setChallenges] = useState<string[]>(onboarding?.challenges ?? []);
  const [customChallenge, setCustomChallenge] = useState<string>(
    onboarding?.customChallenge ?? ''
  );

  // Screen 8: Membership Plans (Multi-select + Custom duration)
  const [offeredPlans, setOfferedPlans] = useState<string[]>(onboarding?.offeredPlans ?? []);
  const [customPlanDuration, setCustomPlanDuration] = useState<string>(
    onboarding?.customPlanDuration ?? ''
  );

  // Screen 9: Payment Methods (Multi-select + Custom)
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    onboarding?.paymentMethods ?? []
  );
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>(
    onboarding?.customPaymentMethod ?? ''
  );

  // Sync gymName if gym profile loads asynchronously from Firestore
  useEffect(() => {
    if (!gymName && gym?.name && gym.name !== 'My Gym') {
      setGymName(gym.name);
    }
  }, [gym?.name]);

  // Persist current state whenever answers or step change (only during actual post-auth owner onboarding)
  useEffect(() => {
    if (isRoleSelectionOnly) return;
    onSaveProgress({
      currentStep: step,
      selectedRole: 'owner',
      gymName,
      memberCountOption,
      customMemberCount,
      managementMethod,
      customManagementMethod,
      challenges,
      customChallenge,
      offeredPlans,
      customPlanDuration,
      paymentMethods,
      customPaymentMethod,
    });
  }, [
    isRoleSelectionOnly,
    step,
    selectedRole,
    gymName,
    memberCountOption,
    customMemberCount,
    managementMethod,
    customManagementMethod,
    challenges,
    customChallenge,
    offeredPlans,
    customPlanDuration,
    paymentMethods,
    customPaymentMethod,
  ]);

  // Validation per screen
  const isStepValid = (): boolean => {
    switch (step) {
      case 'welcome':
        return true;
      case 'role':
        return selectedRole === 'owner' || selectedRole === 'member';
      case 'member_coming_soon':
        return true;
      case 'gym_name':
        return gymName.trim().length >= 1;
      case 'member_count':
        return !!memberCountOption;
      case 'management_method':
        return !!managementMethod;
      case 'challenges':
        return challenges.length > 0;
      case 'plans':
        return offeredPlans.length > 0;
      case 'payment_methods':
        return paymentMethods.length > 0;
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  // Back button handler
  const handleBack = () => {
    switch (step) {
      case 'welcome':
        onBackToSplash();
        break;
      case 'role':
        onBackToSplash();
        break;
      case 'member_coming_soon':
        navigateToStep('role', 'backward');
        break;
      case 'gym_name':
        if (isRoleSelectionOnly) {
          navigateToStep('role', 'backward');
        }
        break;
      case 'member_count':
        navigateToStep('gym_name', 'backward');
        break;
      case 'management_method':
        navigateToStep('member_count', 'backward');
        break;
      case 'challenges':
        navigateToStep('management_method', 'backward');
        break;
      case 'plans':
        navigateToStep('challenges', 'backward');
        break;
      case 'payment_methods':
        navigateToStep('plans', 'backward');
        break;
      case 'complete':
        navigateToStep('payment_methods', 'backward');
        break;
    }
  };

  // Custom option add handlers that save the user's custom entry into state without navigating away
  const handleAddCustomMemberCount = () => {
    const val = customMemberCount.trim() || 'Custom';
    setCustomMemberCount(val);
    setMemberCountOption('Other / Custom');
  };

  const handleAddCustomManagementMethod = () => {
    const val = customManagementMethod.trim() || 'Custom method';
    setCustomManagementMethod(val);
    setManagementMethod('Other / Custom');
  };

  const handleAddCustomChallenge = () => {
    const val = customChallenge.trim() || 'Custom challenge';
    setCustomChallenge(val);
    if (!challenges.includes('Other / Custom')) {
      setChallenges((prev) => [...prev, 'Other / Custom']);
    }
  };

  const handleAddCustomPlanDuration = () => {
    const val = customPlanDuration.trim() || 'Custom duration';
    setCustomPlanDuration(val);
    if (!offeredPlans.includes('Custom duration')) {
      setOfferedPlans((prev) => [...prev, 'Custom duration']);
    }
  };

  const handleAddCustomPaymentMethod = () => {
    const val = customPaymentMethod.trim() || 'Custom payment method';
    setCustomPaymentMethod(val);
    if (!paymentMethods.includes('Other / Custom')) {
      setPaymentMethods((prev) => [...prev, 'Other / Custom']);
    }
  };

  // Continue button handler — advances to the next step when the user is ready
  const handleContinue = () => {
    if (!isStepValid()) {
      if (step === 'gym_name') setGymNameTouched(true);
      return;
    }

    switch (step) {
      case 'welcome':
        navigateToStep('role', 'forward');
        break;
      case 'role':
        if (selectedRole === 'member') {
          navigateToStep('member_coming_soon', 'forward');
        } else {
          if (onRoleSelectedOwner) {
            onRoleSelectedOwner();
          } else {
            navigateToStep('gym_name', 'forward');
          }
        }
        break;
      case 'member_coming_soon':
        navigateToStep('role', 'backward');
        break;
      case 'gym_name':
        navigateToStep('member_count', 'forward');
        break;
      case 'member_count':
        if (memberCountOption === 'Other / Custom' && !customMemberCount.trim()) {
          setCustomMemberCount('Custom');
        }
        navigateToStep('management_method', 'forward');
        break;
      case 'management_method':
        if (managementMethod === 'Other / Custom' && !customManagementMethod.trim()) {
          setCustomManagementMethod('Custom method');
        }
        navigateToStep('challenges', 'forward');
        break;
      case 'challenges':
        if (challenges.includes('Other / Custom') && !customChallenge.trim()) {
          setCustomChallenge('Custom challenge');
        }
        navigateToStep('plans', 'forward');
        break;
      case 'plans':
        if (offeredPlans.includes('Custom duration') && !customPlanDuration.trim()) {
          setCustomPlanDuration('Custom duration');
        }
        navigateToStep('payment_methods', 'forward');
        break;
      case 'payment_methods':
        if (paymentMethods.includes('Other / Custom') && !customPaymentMethod.trim()) {
          setCustomPaymentMethod('Custom payment method');
        }
        navigateToStep('complete', 'forward');
        break;
      case 'complete':
        handleCompleteAndOpenDashboard('dashboard');
        break;
    }
  };

  // Toggle multi-select helper
  const toggleMultiItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setList((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  // Finalize and save into store
  const handleCompleteAndOpenDashboard = (action: OnboardingChecklistAction = 'dashboard') => {
    // Map selected payment methods to store's acceptedPaymentMethods
    const mappedMethods: Array<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'> = [];
    if (paymentMethods.includes('UPI (GPay, PhonePe, etc.)')) mappedMethods.push('UPI');
    if (paymentMethods.includes('Cash')) mappedMethods.push('Cash');
    if (paymentMethods.includes('Bank transfer')) mappedMethods.push('Bank Transfer');
    if (paymentMethods.includes('Card')) mappedMethods.push('Card');

    const finalMethods: Array<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'> =
      mappedMethods.length > 0 ? mappedMethods : settings.acceptedPaymentMethods;

    onCompleteOnboarding(
      {
        gymProfile: {
          name: gymName.trim() || gym.name || 'My Gym',
        },
        settings: {
          acceptedPaymentMethods: finalMethods,
          defaultPaymentMethod: finalMethods.includes('UPI') ? 'UPI' : finalMethods[0],
        },
        onboarding: {
          hasCompletedOnboarding: true,
          currentStep: 'complete',
          selectedRole: 'owner',
          gymName: gymName.trim() || gym.name || 'My Gym',
          memberCountOption,
          customMemberCount: customMemberCount.trim(),
          managementMethod,
          customManagementMethod: customManagementMethod.trim(),
          challenges,
          customChallenge: customChallenge.trim(),
          offeredPlans,
          customPlanDuration: customPlanDuration.trim(),
          paymentMethods,
          customPaymentMethod: customPaymentMethod.trim(),
        },
      },
      action
    );
  };

  // Progress configuration matching the reference image
  const getProgressMeta = (): {
    totalSegments: number;
    filledSegments: number;
    label: string | null;
  } => {
    switch (step) {
      case 'role':
        return { totalSegments: 6, filledSegments: 1, label: '1 of 6' };
      case 'member_coming_soon':
        return { totalSegments: 6, filledSegments: 1, label: null };
      case 'gym_name':
        return { totalSegments: 5, filledSegments: 1, label: '1 of 5' };
      case 'member_count':
        return { totalSegments: 5, filledSegments: 2, label: '2 of 5' };
      case 'management_method':
        return { totalSegments: 5, filledSegments: 3, label: '3 of 5' };
      case 'challenges':
        return { totalSegments: 5, filledSegments: 4, label: '4 of 5' };
      case 'plans':
        return { totalSegments: 5, filledSegments: 5, label: '5 of 5' };
      case 'payment_methods':
        return { totalSegments: 5, filledSegments: 5, label: '5 of 5' };
      default:
        return { totalSegments: 5, filledSegments: 5, label: null };
    }
  };

  const progressMeta = getProgressMeta();
  const canContinue = isStepValid();

  return (
    <div className="min-h-[100dvh] w-full bg-[#F2EFE8] text-[#191919] flex flex-col items-center justify-center sm:py-4 select-none">
      {/* Question Surface Card matching reference image & Owner Dashboard scale */}
      <div className="w-full max-w-md min-h-[100dvh] sm:min-h-[680px] sm:max-h-[860px] bg-[#FAF8F5] sm:rounded-3xl sm:border sm:border-[#EAE5DC] sm:shadow-sm flex flex-col justify-between px-4 sm:px-6 py-4 sm:py-5 overflow-hidden">
        {/* ============================================================== */}
        {/* TOP HEADER FOR STEPS 2 – 9                                     */}
        {/* ============================================================== */}
        {step !== 'welcome' && step !== 'complete' && (
          <header className="w-full pt-1 pb-1 shrink-0">
            {step === 'gym_name' || step === 'member_count' ? (
              <div className="relative flex items-center justify-center w-full min-h-[44px]">
                <button
                  type="button"
                  onClick={handleBack}
                  className="absolute left-0 w-11 h-11 rounded-full bg-[#EEF2F6] hover:bg-[#E2E8F0] active:scale-95 transition-all flex items-center justify-center text-[#0B2545] cursor-pointer"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </button>

                <div className="flex flex-col items-center justify-center">
                  {/* Five-part progress indicator matching reference design */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-[4.5px] w-9 sm:w-11 rounded-full transition-colors duration-200 ${
                          idx < (step === 'gym_name' ? 1 : 2) ? 'bg-[#0B3A82]' : 'bg-[#DCE4EF]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-center text-[13px] font-medium text-[#64748B] mt-1.5">
                    {step === 'gym_name' ? '1 of 5' : '2 of 5'}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-8 h-8 rounded-full hover:bg-[#EBE7DF] active:scale-95 transition-all flex items-center justify-center text-[#191919] -ml-1 cursor-pointer"
                    aria-label="Go back"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
                  </button>

                  {/* Segmented Progress Bar */}
                  <div className="flex-1 flex items-center gap-1.5 pr-6">
                    {Array.from({ length: progressMeta.totalSegments }).map((_, idx) => {
                      const isFilled = idx < progressMeta.filledSegments;
                      return (
                        <div
                          key={idx}
                          className={`h-[5px] flex-1 rounded-full transition-colors duration-200 ${
                            isFilled ? 'bg-[#0F347C]' : 'bg-[#E2DFD9]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {progressMeta.label && (
                  <div className="text-center text-[11px] font-medium text-[#6B7280] mt-1">
                    {progressMeta.label}
                  </div>
                )}
              </>
            )}
          </header>
        )}

        {/* Animated Step Viewport */}
        <div
          key={step}
          className={`flex-1 flex flex-col justify-between min-h-0 ${
            prefersReducedMotion
              ? ''
              : slideDirection === 'forward'
              ? 'animate-onboarding-forward'
              : 'animate-onboarding-backward'
          }`}
        >
        {/* ============================================================== */}
        {/* SCREEN 1: WELCOME                                              */}
        {/* ============================================================== */}
        {step === 'welcome' && (
          <>
            <div className="pt-2" />

            <main className="flex-1 flex flex-col items-center justify-center text-center px-2">
              {/* 3D Navy & Orange Dumbbell Illustration on Soft Periwinkle Glow */}
              <div className="relative w-44 h-40 flex items-center justify-center mb-3">
                <div
                  className="absolute inset-2 rounded-full opacity-85"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, #DDE8FF 0%, #EBF2FF 55%, rgba(250,248,245,0) 75%)',
                  }}
                />
                {/* Soft ground shadow */}
                <div className="absolute bottom-4 w-28 h-4 rounded-full bg-[#1E3A8A]/12 blur-[5px]" />

                <svg
                  className="relative z-10 w-36 h-32 drop-shadow-[0_10px_16px_rgba(15,37,102,0.22)]"
                  viewBox="0 0 180 140"
                  fill="none"
                >
                  {/* Isometric 3D Dumbbell with Orange Inner Rings */}
                  <g transform="rotate(-18 90 70)">
                    {/* Left Outer Navy Plate */}
                    <rect x="26" y="38" width="14" height="64" rx="7" fill="#172554" />
                    <rect x="28" y="40" width="5" height="60" rx="2.5" fill="#1E3A8A" />
                    {/* Left Orange Accent Ring */}
                    <rect x="39" y="32" width="10" height="76" rx="5" fill="#F97316" />
                    <rect x="41" y="34" width="4" height="72" rx="2" fill="#FB923C" />
                    {/* Left Inner Navy Plate */}
                    <rect x="47" y="32" width="16" height="76" rx="7" fill="#1E293B" />
                    <rect x="49" y="35" width="6" height="70" rx="3" fill="#334155" />

                    {/* Center Metallic Handle */}
                    <rect x="61" y="62" width="58" height="16" rx="4" fill="#475569" />
                    <rect x="61" y="64" width="58" height="5" fill="#94A3B8" />

                    {/* Right Inner Navy Plate */}
                    <rect x="117" y="32" width="16" height="76" rx="7" fill="#1E293B" />
                    <rect x="119" y="35" width="6" height="70" rx="3" fill="#334155" />
                    {/* Right Orange Accent Ring */}
                    <rect x="131" y="32" width="10" height="76" rx="5" fill="#F97316" />
                    <rect x="133" y="34" width="4" height="72" rx="2" fill="#FB923C" />
                    {/* Right Outer Navy Plate */}
                    <rect x="140" y="38" width="14" height="64" rx="7" fill="#172554" />
                    <rect x="142" y="40" width="5" height="60" rx="2.5" fill="#1E3A8A" />
                  </g>
                </svg>
              </div>

              <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#111827] tracking-tight">
                Gym Business OS
              </h1>
              <p className="text-[13px] font-medium text-[#374151] mt-1">
                Run your gym smarter.
              </p>

              <p className="text-[12.5px] text-[#4B5563] mt-5 max-w-[250px] leading-relaxed">
                Manage members, memberships, payments, attendance and more in one simple app.
              </p>
            </main>

            <footer className="w-full pt-3 pb-1 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-[44px] rounded-full bg-[#0F347C] hover:bg-[#1E3A8A] active:scale-[0.99] transition-all text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 4 subtle pagination dots */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F347C]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
              </div>
            </footer>
          </>
        )}

        {/* ============================================================== */}
        {/* SCREEN 2: ROLE SELECTION                                       */}
        {/* ============================================================== */}
        {step === 'role' && (
          <>
            <main className="flex-1 flex flex-col justify-start pt-2 space-y-4">
              <div className="text-center px-2">
                <h1 className="text-[19px] sm:text-[21px] font-extrabold text-[#111827] tracking-tight leading-snug">
                  How will you use
                  <br />
                  Gym Business OS?
                </h1>
                <p className="text-[12px] text-[#6B7280] mt-1">
                  Choose the option that best describes you.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {/* Option 1: Gym Owner */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('owner')}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-all flex items-center gap-3.5 cursor-pointer ${
                    selectedRole === 'owner'
                      ? 'bg-[#F5F8FF] border-[#2563EB] ring-1 ring-[#2563EB]/25 shadow-2xs'
                      : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1]'
                  }`}
                >
                  {/* Gym Owner Illustration */}
                  <div className="w-[72px] h-[72px] rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden p-1">
                    <img
                      src="/images/IMG_da965a2b-bf61-42b1-89f9-fb805281c804.jpg"
                      alt="Gym Owner illustration"
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[#111827]">
                      I'm a Gym Owner
                    </div>
                    <p className="text-[11.5px] text-[#4B5563] mt-1 leading-snug">
                      Manage members, memberships, payments and gym operations.
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch py-0.5 shrink-0">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedRole === 'owner'
                          ? 'border-[#2563EB] bg-[#2563EB]'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {selectedRole === 'owner' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </div>
                </button>

                {/* Option 2: Gym Member */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('member')}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-all flex items-center gap-3.5 cursor-pointer ${
                    selectedRole === 'member'
                      ? 'bg-[#F5F8FF] border-[#2563EB] ring-1 ring-[#2563EB]/25 shadow-2xs'
                      : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1]'
                  }`}
                >
                  {/* Gym Member Illustration */}
                  <div className="w-[72px] h-[72px] rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden p-1">
                    <img
                      src="/images/IMG_c3196f6c-d45d-40f9-8eef-88c7eb06ed87.jpg"
                      alt="Gym Member illustration"
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[#111827]">
                      I'm a Gym Member
                    </div>
                    <p className="text-[11.5px] text-[#4B5563] mt-1 leading-snug">
                      View the member experience when it becomes available.
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch py-0.5 shrink-0">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedRole === 'member'
                          ? 'border-[#2563EB] bg-[#2563EB]'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {selectedRole === 'member' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </div>
                </button>
              </div>
            </main>

            <footer className="w-full pt-3 pb-1">
              <button
                type="button"
                disabled={!canContinue}
                onClick={handleContinue}
                className={`w-full h-[44px] rounded-full text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-[#0F347C] hover:bg-[#1E3A8A] cursor-pointer shadow-xs'
                    : 'bg-[#9CAEC5] cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* ============================================================== */}
        {/* SCREEN 3: MEMBER COMING SOON                                   */}
        {/* ============================================================== */}
        {step === 'member_coming_soon' && (
          <>
            <main className="flex-1 flex flex-col items-center justify-center text-center px-3">
              {/* Illustration of Member with Phone & Profile Speech Bubble */}
              <div className="relative w-44 h-44 flex items-center justify-center mb-3">
                <div
                  className="absolute inset-2 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, #DDE8FF 0%, #EBF2FF 58%, rgba(250,248,245,0) 75%)',
                  }}
                />
                <svg className="relative z-10 w-36 h-36" viewBox="0 0 140 140" fill="none">
                  {/* Torso */}
                  <path
                    d="M34 122C34 98 48 86 70 86C92 86 106 98 106 122"
                    fill="#1E3A8A"
                  />
                  {/* Neck & Face */}
                  <rect x="62" y="68" width="16" height="20" rx="6" fill="#FDBA74" />
                  <circle cx="70" cy="52" r="18" fill="#FDBA74" />
                  <path
                    d="M52 48C52 35 60 28 73 28C83 28 89 35 88 48C84 42 77 40 69 40C60 40 55 43 52 48Z"
                    fill="#0F172A"
                  />
                  {/* Smartphone in hand */}
                  <rect
                    x="74"
                    y="84"
                    width="18"
                    height="28"
                    rx="3.5"
                    transform="rotate(-12 74 84)"
                    fill="#0F172A"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                  />
                  {/* Floating Blue Profile Bubble */}
                  <circle cx="104" cy="48" r="16" fill="#2563EB" />
                  <circle cx="104" cy="44" r="5" fill="#FFFFFF" />
                  <path
                    d="M95 56C95 51.5 99 49 104 49C109 49 113 51.5 113 56"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h1 className="text-[21px] sm:text-[23px] font-extrabold text-[#111827] tracking-tight">
                Coming Soon
              </h1>
              <p className="text-[12.5px] text-[#4B5563] mt-2.5 max-w-[265px] leading-relaxed">
                We're building a better way for gym members to connect with their gyms.
                The member experience will be available in a future version.
              </p>
            </main>

            <footer className="w-full pt-3 pb-1">
              <button
                type="button"
                onClick={() => navigateToStep('role', 'backward')}
                className="w-full h-[44px] rounded-full bg-[#0F347C] hover:bg-[#1E3A8A] text-white text-[13px] font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                Back to Role Selection
              </button>
            </footer>
          </>
        )}

        {/* ============================================================== */}
        {/* SCREEN 4: GYM NAME                                             */}
        {/* ============================================================== */}
        {/* ============================================================== */}
        {/* SCREEN 4: GYM NAME (Exact Reference Design)                   */}
        {/* ============================================================== */}
        {step === 'gym_name' && (
          <div className="flex-1 flex flex-col justify-between pt-2 pb-1">
            <main className="flex-1 flex flex-col items-center text-center">
              {/* Prominent Question Heading */}
              <h1 className="text-[25px] sm:text-[27px] font-extrabold text-[#0A1931] tracking-tight leading-tight mt-1">
                What is your gym called?
              </h1>

              {/* Subtitle */}
              <p className="text-[14.5px] sm:text-[15.5px] font-normal text-[#596780] mt-1.5 leading-relaxed max-w-[280px]">
                This will appear in your workspace and reports.
              </p>

              {/* Uploaded Gym Building Image */}
              <div className="w-full max-w-[360px] my-2 sm:my-3.5 flex items-center justify-center">
                <img
                  src="/images/Screenshot_2026_1019_170605.jpg"
                  alt="What is your gym called"
                  className="w-full h-auto max-h-[220px] object-contain select-none"
                  style={{ objectFit: 'contain' }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Outlined Gym-Name Input */}
              <div className="w-full text-left">
                <div
                  className={`w-full h-[56px] sm:h-[58px] rounded-2xl bg-white border px-4 flex items-center gap-3.5 transition-all shadow-2xs ${
                    gymNameTouched && !gymName.trim()
                      ? 'border-[#EF4444]'
                      : 'border-[#E2E8F0] focus-within:border-[#0B3A82] focus-within:ring-2 focus-within:ring-[#0B3A82]/10'
                  }`}
                >
                  {/* Building / Storefront Icon in Soft Rounded Badge */}
                  <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#1E293B] flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 stroke-[1.8]" />
                  </div>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={gymName}
                    onChange={(e) => {
                      setGymName(e.target.value);
                      if (gymNameTouched && e.target.value.trim().length > 0) {
                        setGymNameTouched(false);
                      }
                    }}
                    onBlur={() => setGymNameTouched(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && gymName.trim().length > 0) {
                        handleContinue();
                      }
                    }}
                    placeholder="Enter your gym name"
                    className="w-full bg-transparent text-[15.5px] sm:text-[16px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden"
                    autoFocus
                  />
                </div>

                {/* Helper text matching reference */}
                <div className="flex items-center justify-between px-1 mt-1.5">
                  <span className="text-[13px] font-normal text-[#64748B]">
                    e.g. MuscleFit Gym
                  </span>
                  {gymNameTouched && !gymName.trim() && (
                    <span className="text-[11.5px] font-medium text-[#EF4444]">
                      Enter your official gym or studio name
                    </span>
                  )}
                </div>
              </div>

              {/* Large Empty Space between input and bottom button */}
              <div className="flex-1 min-h-[36px] sm:min-h-[64px]" />
            </main>

            {/* Bottom Continue Button matching reference */}
            <footer className="w-full pt-2 pb-1 shrink-0">
              <button
                type="button"
                disabled={!gymName.trim()}
                onClick={handleContinue}
                className={`w-full h-[54px] sm:h-[56px] rounded-2xl text-[16px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  gymName.trim()
                    ? 'bg-[#0B3A82] hover:bg-[#092E6B] active:scale-[0.99] text-white cursor-pointer shadow-xs'
                    : 'bg-[#9BB0CF] text-white/80 cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 stroke-[2.4]" />
              </button>
            </footer>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 5: MEMBER COUNT                                         */}
        {/* ============================================================== */}
        {/* ============================================================== */}
        {/* SCREEN 5: MEMBER COUNT (Exact Reference Design)               */}
        {/* ============================================================== */}
        {step === 'member_count' && (
          <div className="flex-1 flex flex-col justify-between pt-2 pb-1 overflow-hidden">
            <main className="flex-1 flex flex-col justify-start overflow-y-auto pr-0.5">
              {/* Heading */}
              <div className="text-center px-1">
                <h1 className="text-[25px] sm:text-[27px] font-extrabold text-[#0A1931] tracking-tight leading-tight mt-1">
                  How many members
                  <br />
                  do you have?
                </h1>
                <p className="text-[14px] sm:text-[15px] font-normal text-[#596780] mt-1.5 leading-relaxed max-w-[310px] mx-auto">
                  Choose the closest option. You can enter
                  <br />
                  your own answer too.
                </p>
              </div>

              {/* 2x3 Grid of Member Count Cards matching reference */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-3 w-full">
                {MEMBER_COUNT_OPTIONS.map((item) => {
                  const isSelected =
                    memberCountOption === item.id ||
                    memberCountOption === item.title ||
                    (item.id.startsWith('Just starting') &&
                      (memberCountOption.startsWith('Just starting') || memberCountOption === 'Just starting')) ||
                    memberCountOption.replace(/[\s–—-]+/g, '') === item.id.replace(/[\s–—-]+/g, '');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMemberCountOption(item.id);
                      }}
                      className={`rounded-2xl p-2.5 sm:p-3 border text-center transition-all flex flex-col items-center cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'border-2 border-[#0B3A82] ring-2 ring-[#0B3A82]/10 bg-[#F8FAFD]'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      {/* Gym Floor Capacity Illustration */}
                      <div className="w-full h-[62px] sm:h-[70px] rounded-xl overflow-hidden mb-2 relative">
                        <MemberCountCardIllustration tier={item.tier} />
                      </div>

                      <div className="text-[13.5px] sm:text-[14px] font-bold text-[#0F172A] leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[11.5px] sm:text-[12px] text-[#64748B] font-normal leading-tight mt-0.5">
                        {item.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Other / Custom Option Card matching reference */}
              <div
                className={`w-full rounded-2xl bg-white border transition-all shadow-2xs overflow-hidden ${
                  memberCountOption === 'Other / Custom'
                    ? 'border-2 border-[#0B3A82] ring-2 ring-[#0B3A82]/10 bg-[#F8FAFD]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setMemberCountOption('Other / Custom')}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border-2 border-[#2563EB] text-[#2563EB] flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-[13.5px] sm:text-[14px] font-bold text-[#0F172A] leading-tight">
                        Other / Custom
                      </div>
                      <div className="text-[11.5px] sm:text-[12px] text-[#64748B] leading-tight mt-0.5">
                        Enter your own number or range
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#2563EB] stroke-[2.2]" />
                </button>

                {memberCountOption === 'Other / Custom' && (
                  <div className="px-3.5 pb-3.5 pt-0.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customMemberCount}
                        onChange={(e) => setCustomMemberCount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomMemberCount();
                          }
                        }}
                        placeholder="Enter your member count, range, or answer..."
                        className="flex-1 h-[44px] px-3.5 rounded-xl bg-white border border-[#CBD5E1] focus:border-[#0B3A82] focus:ring-2 focus:ring-[#0B3A82]/10 text-[13.5px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomMemberCount}
                        className="h-[44px] px-4 rounded-xl bg-[#0B3A82] hover:bg-[#092E6B] active:scale-95 transition-all text-white text-[13.5px] font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Add</span>
                      </button>
                    </div>

                    {customMemberCount.trim() && (
                      <div className="flex items-center gap-1.5 px-1 text-[12px] text-[#0B3A82] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0B3A82]" />
                        <span>Added: &ldquo;{customMemberCount.trim()}&rdquo;</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>

            {/* Bottom Continue Button matching reference */}
            <footer className="w-full pt-2.5 pb-1 shrink-0">
              <button
                type="button"
                disabled={!canContinue}
                onClick={handleContinue}
                className={`w-full h-[54px] sm:h-[56px] rounded-2xl text-[16px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-[#0B3A82] hover:bg-[#092E6B] active:scale-[0.99] text-white cursor-pointer shadow-xs'
                    : 'bg-[#9BB0CF] text-white/80 cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 stroke-[2.4]" />
              </button>
            </footer>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 6: CURRENT MANAGEMENT METHOD                            */}
        {/* ============================================================== */}
        {step === 'management_method' && (
          <>
            <main className="flex-1 flex flex-col justify-start pt-1 space-y-2.5 overflow-y-auto">
              <div className="text-center px-1">
                <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#111827] tracking-tight leading-snug">
                  How do you currently
                  <br />
                  manage your gym records?
                </h1>
                <p className="text-[11.5px] text-[#6B7280] mt-0.5">
                  Choose the option that best describes your current method.
                </p>
              </div>

              <div className="space-y-2 pt-0.5">
                {MANAGEMENT_METHODS.map((item) => {
                  const isSelected = managementMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setManagementMethod(item.id)}
                      className={`w-full rounded-xl px-3 py-2.5 border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F5F8FF] border-[#2563EB] ring-1 ring-[#2563EB]/25 shadow-2xs'
                          : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1]'
                      }`}
                    >
                      {/* Custom Icon Illustration */}
                      <div className="w-9 h-8 rounded-lg flex items-center justify-center shrink-0">
                        {item.iconType === 'notebook' && (
                          <svg className="w-8 h-7" viewBox="0 0 36 28" fill="none">
                            <path d="M3 6L18 4V24L3 26V6Z" fill="#FDE68A" stroke="#92400E" strokeWidth="1.2" />
                            <path d="M33 6L18 4V24L33 26V6Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.2" />
                            <line x1="7" y1="10" x2="15" y2="9" stroke="#B45309" strokeWidth="1" />
                            <line x1="7" y1="14" x2="15" y2="13" stroke="#B45309" strokeWidth="1" />
                            <line x1="21" y1="9" x2="29" y2="10" stroke="#B45309" strokeWidth="1" />
                            <line x1="21" y1="13" x2="29" y2="14" stroke="#B45309" strokeWidth="1" />
                          </svg>
                        )}
                        {item.iconType === 'excel' && (
                          <svg className="w-8 h-7" viewBox="0 0 36 28" fill="none">
                            <rect x="8" y="3" width="22" height="22" rx="3" fill="#DCFCE7" stroke="#15803D" strokeWidth="1.2" />
                            <rect x="4" y="6" width="12" height="16" rx="2" fill="#15803D" />
                            <text x="10" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">
                              X
                            </text>
                            <line x1="19" y1="9" x2="26" y2="9" stroke="#16A34A" strokeWidth="1.5" />
                            <line x1="19" y1="14" x2="26" y2="14" stroke="#16A34A" strokeWidth="1.5" />
                            <line x1="19" y1="19" x2="26" y2="19" stroke="#16A34A" strokeWidth="1.5" />
                          </svg>
                        )}
                        {item.iconType === 'app' && (
                          <svg className="w-8 h-7" viewBox="0 0 36 28" fill="none">
                            <rect x="4" y="3" width="28" height="22" rx="3" fill="#1E293B" />
                            <rect x="6" y="5" width="24" height="18" rx="1.5" fill="#F8FAFC" />
                            <rect x="9" y="14" width="3" height="6" rx="1" fill="#3B82F6" />
                            <rect x="14" y="11" width="3" height="9" rx="1" fill="#22C55E" />
                            <rect x="19" y="8" width="3" height="12" rx="1" fill="#1E3A8A" />
                            <circle cx="25" cy="11" r="2.5" fill="#F59E0B" />
                          </svg>
                        )}
                        {item.iconType === 'combo' && (
                          <svg className="w-8 h-7" viewBox="0 0 36 28" fill="none">
                            <path d="M2 12L11 9L16 18L7 21L2 12Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="1" />
                            <rect x="15" y="6" width="18" height="13" rx="2" fill="#1E293B" />
                            <rect x="17" y="8" width="14" height="9" fill="#E0F2FE" />
                            <path d="M13 19H35L33 22H15L13 19Z" fill="#64748B" />
                          </svg>
                        )}
                        {item.iconType === 'new_gym' && (
                          <svg className="w-8 h-7" viewBox="0 0 36 28" fill="none">
                            <rect x="6" y="10" width="24" height="15" rx="1.5" fill="#334155" />
                            <rect x="4" y="7" width="28" height="4" rx="1" fill="#1E3A8A" />
                            <rect x="11" y="4" width="14" height="5" rx="1" fill="#0F172A" />
                            <text x="18" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="4.5" fontWeight="800">
                              GYM
                            </text>
                            <rect x="10" y="14" width="7" height="11" fill="#F59E0B" fillOpacity="0.5" />
                            <rect x="19" y="14" width="7" height="11" fill="#38BDF8" fillOpacity="0.4" />
                          </svg>
                        )}
                      </div>

                      <span className="text-[12.5px] font-bold text-[#111827] flex-1">
                        {item.label}
                      </span>

                      {isSelected && (
                        <span className="w-4.5 h-4.5 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Other / Custom */}
                <div
                  className={`w-full rounded-xl border transition-all bg-white ${
                    managementMethod === 'Other / Custom'
                      ? 'border-[#2563EB] ring-1 ring-[#2563EB]/25 bg-[#F5F8FF]'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setManagementMethod('Other / Custom')}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-[#2563EB] text-[#2563EB] flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-[#111827]">
                          Other / Custom
                        </div>
                        <div className="text-[10.5px] text-[#6B7280]">
                          Enter your own answer
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </button>

                  {managementMethod === 'Other / Custom' && (
                    <div className="px-3 pb-2.5 pt-0.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customManagementMethod}
                          onChange={(e) => setCustomManagementMethod(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomManagementMethod();
                            }
                          }}
                          placeholder="Describe how you currently manage records..."
                          className="flex-1 h-[36px] px-3 rounded-lg bg-white border border-[#CBD5E1] focus:border-[#1E3A8A] text-[12px] font-medium text-[#111827] focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomManagementMethod}
                          className="h-[36px] px-3 rounded-lg bg-[#0F347C] hover:bg-[#1E3A8A] active:scale-95 transition-all text-white text-[12px] font-semibold flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add</span>
                        </button>
                      </div>

                      {customManagementMethod.trim() && (
                        <div className="flex items-center gap-1.5 px-1 text-[12px] text-[#0B3A82] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0B3A82]" />
                          <span>Added: &ldquo;{customManagementMethod.trim()}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </main>

            <footer className="w-full pt-2.5 pb-1">
              <button
                type="button"
                disabled={!canContinue}
                onClick={handleContinue}
                className={`w-full h-[44px] rounded-full text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-[#0F347C] hover:bg-[#1E3A8A] cursor-pointer shadow-xs'
                    : 'bg-[#9CAEC5] cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* ============================================================== */}
        {/* SCREEN 7: BIGGEST CHALLENGE (MULTI-SELECT)                     */}
        {/* ============================================================== */}
        {step === 'challenges' && (
          <>
            <main className="flex-1 flex flex-col justify-start pt-1 space-y-2.5 overflow-y-auto">
              <div className="text-center px-1">
                <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#111827] tracking-tight leading-snug">
                  What do you most want
                  <br />
                  to improve?
                </h1>
                <p className="text-[11.5px] text-[#6B7280] mt-0.5">
                  Choose all that apply.
                </p>
              </div>

              <div className="space-y-2 pt-0.5">
                {CHALLENGE_OPTIONS.map((item) => {
                  const isChecked = challenges.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleMultiItem(challenges, setChallenges, item.id)}
                      className={`w-full rounded-xl px-3 py-2.5 border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'bg-[#F5F8FF] border-[#2563EB] ring-1 ring-[#2563EB]/25 shadow-2xs'
                          : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1]'
                      }`}
                    >
                      {/* Checkbox on Left */}
                      <span
                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-[#2563EB] border-[#2563EB] text-white'
                            : 'bg-white border-[#9CA3AF]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>

                      {/* Category Icon */}
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        {item.icon === 'expiry' && (
                          <Calendar className="w-5 h-5 text-[#DC2626]" />
                        )}
                        {item.icon === 'payments' && (
                          <IndianRupee className="w-5 h-5 text-[#1E3A8A]" />
                        )}
                        {item.icon === 'attendance' && (
                          <UserCheck className="w-5 h-5 text-[#16A34A]" />
                        )}
                        {item.icon === 'finances' && (
                          <BarChart3 className="w-5 h-5 text-[#1E3A8A]" />
                        )}
                        {item.icon === 'retention' && (
                          <Users className="w-5 h-5 text-[#2563EB]" />
                        )}
                        {item.icon === 'all_in_one' && (
                          <Settings className="w-5 h-5 text-[#1E3A8A]" />
                        )}
                      </div>

                      <span className="text-[12px] font-semibold text-[#111827] leading-snug flex-1">
                        {item.label}
                      </span>
                    </button>
                  );
                })}

                {/* Other / Custom */}
                <div
                  className={`w-full rounded-xl border transition-all bg-white ${
                    challenges.includes('Other / Custom')
                      ? 'border-[#2563EB] ring-1 ring-[#2563EB]/25 bg-[#F5F8FF]'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleMultiItem(challenges, setChallenges, 'Other / Custom')}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full border-2 border-[#2563EB] text-[#2563EB] flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-[#111827]">
                          Other / Custom
                        </div>
                        <div className="text-[10.5px] text-[#6B7280]">
                          Enter your own answer
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </button>

                  {challenges.includes('Other / Custom') && (
                    <div className="px-3 pb-2.5 pt-0.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customChallenge}
                          onChange={(e) => setCustomChallenge(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomChallenge();
                            }
                          }}
                          placeholder="Enter another area you want to improve..."
                          className="flex-1 h-[36px] px-3 rounded-lg bg-white border border-[#CBD5E1] focus:border-[#1E3A8A] text-[12px] font-medium text-[#111827] focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomChallenge}
                          className="h-[36px] px-3 rounded-lg bg-[#0F347C] hover:bg-[#1E3A8A] active:scale-95 transition-all text-white text-[12px] font-semibold flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add</span>
                        </button>
                      </div>

                      {customChallenge.trim() && (
                        <div className="flex items-center gap-1.5 px-1 text-[12px] text-[#0B3A82] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0B3A82]" />
                          <span>Added: &ldquo;{customChallenge.trim()}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </main>

            <footer className="w-full pt-2.5 pb-1">
              <button
                type="button"
                disabled={!canContinue}
                onClick={handleContinue}
                className={`w-full h-[44px] rounded-full text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-[#0F347C] hover:bg-[#1E3A8A] cursor-pointer shadow-xs'
                    : 'bg-[#9CAEC5] cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* ============================================================== */}
        {/* SCREEN 8: MEMBERSHIP PLANS (MULTI-SELECT)                      */}
        {/* ============================================================== */}
        {step === 'plans' && (
          <>
            <main className="flex-1 flex flex-col justify-start pt-1 space-y-2.5 overflow-y-auto">
              <div className="text-center px-1">
                <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#111827] tracking-tight leading-snug">
                  Which membership plans
                  <br />
                  do you offer?
                </h1>
                <p className="text-[11.5px] text-[#6B7280] mt-0.5">
                  Choose all that apply.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {PLAN_OPTIONS.map((plan) => {
                  const isSelected = offeredPlans.includes(plan.id);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => toggleMultiItem(offeredPlans, setOfferedPlans, plan.id)}
                      className={`rounded-xl p-2.5 border text-center transition-all flex flex-col items-center cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#F5F8FF] border-[#2563EB] ring-1 ring-[#2563EB]/25 shadow-2xs'
                          : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1]'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}

                      {/* Calendar / Plan Illustration */}
                      <div className="w-full h-[52px] rounded-lg bg-[#F5F4F0] flex items-center justify-center mb-2">
                        {plan.type === 'calendar' && (
                          <svg className="w-12 h-11" viewBox="0 0 54 48" fill="none">
                            <rect
                              x="9"
                              y="8"
                              width="34"
                              height="32"
                              rx="5"
                              transform="rotate(-6 9 8)"
                              fill="#FFFFFF"
                              stroke="#CBD5E1"
                              strokeWidth="1.2"
                            />
                            <path
                              d="M9 13C8.5 10 10.5 8 13.5 7.5L36.5 5C39.5 4.5 41.5 6.5 42 9.5L42.5 14L9.5 17.5L9 13Z"
                              fill="#F97316"
                            />
                            <circle cx="17" cy="9" r="1.8" fill="#1E293B" />
                            <circle cx="34" cy="7" r="1.8" fill="#1E293B" />
                            <text
                              x="27"
                              y="31"
                              textAnchor="middle"
                              fill="#1E3A8A"
                              fontSize="12"
                              fontWeight="800"
                              fontFamily="sans-serif"
                            >
                              {plan.badge}
                            </text>
                          </svg>
                        )}
                        {plan.type === 'custom' && (
                          <svg className="w-12 h-11" viewBox="0 0 54 48" fill="none">
                            <rect
                              x="8"
                              y="8"
                              width="32"
                              height="30"
                              rx="4"
                              fill="#FFFFFF"
                              stroke="#CBD5E1"
                              strokeWidth="1.2"
                            />
                            <rect x="8" y="8" width="32" height="8" rx="3" fill="#1E3A8A" />
                            <circle cx="16" cy="22" r="1.5" fill="#64748B" />
                            <circle cx="24" cy="22" r="1.5" fill="#64748B" />
                            <circle cx="32" cy="22" r="1.5" fill="#64748B" />
                            <circle cx="16" cy="29" r="1.5" fill="#64748B" />
                            <circle cx="24" cy="29" r="1.5" fill="#64748B" />
                            <circle cx="38" cy="31" r="8" fill="#2563EB" />
                            <path
                              d="M38 27.5V34.5M34.5 31H41.5"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                        {plan.type === 'none' && (
                          <svg className="w-12 h-11" viewBox="0 0 54 48" fill="none">
                            <rect
                              x="15"
                              y="7"
                              width="24"
                              height="32"
                              rx="3"
                              fill="#334155"
                            />
                            <line x1="20" y1="15" x2="34" y2="15" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                            <line x1="20" y1="21" x2="34" y2="21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                            <line x1="20" y1="27" x2="29" y2="27" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>

                      <div className="text-[12px] font-bold text-[#111827] leading-tight">
                        {plan.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Duration Input when 'Custom duration' is selected */}
              {offeredPlans.includes('Custom duration') && (
                <div className="bg-white rounded-xl p-3 border border-[#2563EB] shadow-2xs space-y-2">
                  <label className="block text-[11px] font-bold text-[#1E3A8A]">
                    Custom Plan Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customPlanDuration}
                      onChange={(e) => setCustomPlanDuration(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomPlanDuration();
                        }
                      }}
                      placeholder="e.g. 15 Days Trial, 45 Days Transformation"
                      className="flex-1 h-[36px] px-3 rounded-lg bg-[#F9F7F3] border border-[#CBD5E1] focus:border-[#1E3A8A] focus:bg-white text-[12px] font-medium text-[#111827] focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPlanDuration}
                      className="h-[36px] px-3 rounded-lg bg-[#0F347C] hover:bg-[#1E3A8A] active:scale-95 transition-all text-white text-[12px] font-semibold flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add</span>
                    </button>
                  </div>

                  {customPlanDuration.trim() && (
                    <div className="flex items-center gap-1.5 px-1 text-[12px] text-[#0B3A82] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0B3A82]" />
                      <span>Added: &ldquo;{customPlanDuration.trim()}&rdquo;</span>
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="w-full pt-2.5 pb-1">
              <button
                type="button"
                disabled={!canContinue}
                onClick={handleContinue}
                className={`w-full h-[44px] rounded-full text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-[#0F347C] hover:bg-[#1E3A8A] cursor-pointer shadow-xs'
                    : 'bg-[#9CAEC5] cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* ============================================================== */}
        {/* SCREEN 9: PAYMENT METHODS (MULTI-SELECT)                       */}
        {/* ============================================================== */}
        {step === 'payment_methods' && (
          <>
            <main className="flex-1 flex flex-col justify-start pt-1 space-y-2.5 overflow-y-auto">
              <div className="text-center px-1">
                <h1 className="text-[18px] sm:text-[20px] font-extrabold text-[#111827] tracking-tight leading-snug">
                  How do your members
                  <br />
                  usually pay?
                </h1>
                <p className="text-[11.5px] text-[#6B7280] mt-0.5">
                  Choose all that apply.
                </p>
              </div>

              <div className="space-y-2.5 pt-0.5">
                {PAYMENT_OPTIONS.map((pm) => {
                  const isChecked = paymentMethods.includes(pm.id);
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => toggleMultiItem(paymentMethods, setPaymentMethods, pm.id)}
                      className={`w-full rounded-xl px-3.5 py-3 border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-[#F5F8FF] border-[#2563EB] ring-1 ring-[#2563EB]/25 shadow-2xs'
                          : 'bg-white border-[#E5E7EB] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Payment Method Illustration */}
                        <div className="w-10 h-7 flex items-center justify-center shrink-0">
                          {pm.iconType === 'cash' && (
                            <svg className="w-9 h-7" viewBox="0 0 40 28" fill="none">
                              <rect x="4" y="8" width="30" height="15" rx="2" fill="#86EFAC" stroke="#15803D" strokeWidth="1.2" />
                              <rect x="6" y="5" width="30" height="15" rx="2" fill="#BBF7D0" stroke="#15803D" strokeWidth="1.2" />
                              <circle cx="21" cy="12.5" r="3.5" fill="#15803D" fillOpacity="0.25" />
                            </svg>
                          )}
                          {pm.iconType === 'upi' && (
                            <div className="px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center">
                              <span className="text-[11px] font-black italic tracking-tighter text-[#1E293B]">
                                UPI
                              </span>
                              <span className="text-[10px] font-bold text-[#F97316] ml-0.5">
                                ▸
                              </span>
                            </div>
                          )}
                          {pm.iconType === 'bank' && (
                            <svg className="w-8 h-7" viewBox="0 0 36 28" fill="none">
                              <polygon points="18,3 4,10 32,10" fill="#64748B" />
                              <rect x="7" y="10" width="3" height="11" fill="#94A3B8" />
                              <rect x="13" y="10" width="3" height="11" fill="#94A3B8" />
                              <rect x="20" y="10" width="3" height="11" fill="#94A3B8" />
                              <rect x="26" y="10" width="3" height="11" fill="#94A3B8" />
                              <rect x="4" y="21" width="28" height="3.5" rx="1" fill="#475569" />
                            </svg>
                          )}
                          {pm.iconType === 'card' && (
                            <svg className="w-9 h-7" viewBox="0 0 40 28" fill="none">
                              <rect x="4" y="5" width="32" height="19" rx="3" fill="#1E3A8A" />
                              <rect x="4" y="9" width="32" height="4" fill="#0F172A" />
                              <rect x="8" y="16" width="6" height="4" rx="1" fill="#FBBF24" />
                            </svg>
                          )}
                        </div>

                        <span className="text-[12.5px] font-bold text-[#111827]">
                          {pm.label}
                        </span>
                      </div>

                      <span
                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-[#2563EB] border-[#2563EB] text-white'
                            : 'bg-white border-[#9CA3AF]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}

                {/* Other / Custom */}
                <div
                  className={`w-full rounded-xl border transition-all bg-white ${
                    paymentMethods.includes('Other / Custom')
                      ? 'border-[#2563EB] ring-1 ring-[#2563EB]/25 bg-[#F5F8FF]'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleMultiItem(paymentMethods, setPaymentMethods, 'Other / Custom')
                    }
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-[#2563EB] text-[#2563EB] flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-[#111827]">
                          Other / Custom
                        </div>
                        <div className="text-[10.5px] text-[#6B7280]">
                          Enter your own answer
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </button>

                  {paymentMethods.includes('Other / Custom') && (
                    <div className="px-3.5 pb-2.5 pt-0.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customPaymentMethod}
                          onChange={(e) => setCustomPaymentMethod(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomPaymentMethod();
                            }
                          }}
                          placeholder="e.g. Cheque, Paytm POS, Razorpay link..."
                          className="flex-1 h-[36px] px-3 rounded-lg bg-white border border-[#CBD5E1] focus:border-[#1E3A8A] text-[12px] font-medium text-[#111827] focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomPaymentMethod}
                          className="h-[36px] px-3 rounded-lg bg-[#0F347C] hover:bg-[#1E3A8A] active:scale-95 transition-all text-white text-[12px] font-semibold flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add</span>
                        </button>
                      </div>

                      {customPaymentMethod.trim() && (
                        <div className="flex items-center gap-1.5 px-1 text-[12px] text-[#0B3A82] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0B3A82]" />
                          <span>Added: &ldquo;{customPaymentMethod.trim()}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </main>

            <footer className="w-full pt-2.5 pb-1">
              <button
                type="button"
                disabled={!canContinue}
                onClick={handleContinue}
                className={`w-full h-[44px] rounded-full text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-[#0F347C] hover:bg-[#1E3A8A] cursor-pointer shadow-xs'
                    : 'bg-[#9CAEC5] cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          </>
        )}

        {/* ============================================================== */}
        {/* SCREEN 10: SETUP COMPLETE                                      */}
        {/* ============================================================== */}
        {step === 'complete' && (
          <>
            <main className="flex-1 flex flex-col items-center justify-start pt-2 text-center">
              {/* Celebratory Clipboard + Dumbbell + Checkmark Illustration */}
              <div className="relative w-44 h-36 flex items-center justify-center mb-2">
                <div
                  className="absolute inset-2 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, #DDE8FF 0%, #EBF2FF 58%, rgba(250,248,245,0) 75%)',
                  }}
                />
                <svg className="relative z-10 w-40 h-32" viewBox="0 0 180 140" fill="none">
                  {/* Confetti dots */}
                  <rect x="26" y="28" width="5" height="3" rx="1" transform="rotate(-25 26 28)" fill="#EF4444" />
                  <circle cx="45" cy="18" r="2.5" fill="#F59E0B" />
                  <rect x="142" y="22" width="5" height="3" rx="1" transform="rotate(20 142 22)" fill="#3B82F6" />
                  <circle cx="154" cy="42" r="2.5" fill="#F97316" />
                  <circle cx="28" cy="54" r="2" fill="#22C55E" />

                  {/* Background Dumbbell behind Clipboard */}
                  <g transform="rotate(-12 90 82)">
                    <rect x="24" y="64" width="10" height="36" rx="4" fill="#1E293B" />
                    <rect x="33" y="60" width="7" height="44" rx="3" fill="#F97316" />
                    <rect x="39" y="60" width="10" height="44" rx="4" fill="#334155" />
                    <rect x="131" y="60" width="10" height="44" rx="4" fill="#334155" />
                    <rect x="140" y="60" width="7" height="44" rx="3" fill="#F97316" />
                    <rect x="146" y="64" width="10" height="36" rx="4" fill="#1E293B" />
                  </g>

                  {/* Clipboard */}
                  <rect
                    x="55"
                    y="24"
                    width="70"
                    height="88"
                    rx="8"
                    fill="#1E3A8A"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                  <rect x="61" y="32" width="58" height="74" rx="5" fill="#FFFFFF" />
                  {/* Top Clip */}
                  <rect x="74" y="18" width="32" height="12" rx="4" fill="#475569" />
                  <rect x="82" y="21" width="16" height="5" rx="2" fill="#CBD5E1" />

                  {/* Blue Check Circle inside Clipboard */}
                  <circle cx="90" cy="64" r="16" fill="#2563EB" />
                  <path
                    d="M83 64.5L88 69.5L97.5 59.5"
                    stroke="#FFFFFF"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="73" y1="90" x2="107" y2="90" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
                  <line x1="79" y1="97" x2="101" y2="97" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#111827] tracking-tight leading-snug">
                Your gym workspace
                <br />
                is ready!
              </h1>
              <p className="text-[12px] text-[#4B5563] mt-1 max-w-[260px]">
                You can now start managing{' '}
                <span className="font-semibold text-[#111827]">
                  {gymName.trim() || gym.name || 'your gym'}
                </span>{' '}
                with Gym Business OS.
              </p>

              {/* Setup Checklist (Reflects real saved data) */}
              <div className="w-full space-y-2 mt-4 text-left">
                {[
                  {
                    id: 'add_member' as OnboardingChecklistAction,
                    label: 'Add your first member',
                    icon: UserPlus,
                    iconColor: 'text-[#1E3A8A] bg-[#EEF2FF]',
                    isDone: membersCount > 0,
                  },
                  {
                    id: 'plans' as OnboardingChecklistAction,
                    label: 'Create membership plans',
                    icon: Calendar,
                    iconColor: 'text-[#16A34A] bg-[#DCFCE7]',
                    isDone: plansCount > 0,
                  },
                  {
                    id: 'record_payment' as OnboardingChecklistAction,
                    label: 'Record your first payment',
                    icon: CreditCard,
                    iconColor: 'text-[#1E3A8A] bg-[#EEF2FF]',
                    isDone: paymentsCount > 0,
                  },
                  {
                    id: 'attendance' as OnboardingChecklistAction,
                    label: 'Set up attendance',
                    icon: CheckCircle2,
                    iconColor: 'text-[#16A34A] bg-[#DCFCE7]',
                    isDone: attendanceCount > 0,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCompleteAndOpenDashboard(item.id)}
                      className={`w-full rounded-xl bg-white border px-3.5 py-2.5 flex items-center justify-between transition-all shadow-2xs cursor-pointer ${
                        item.isDone
                          ? 'border-[#86EFAC] bg-[#F0FDF4]/50'
                          : 'border-[#E5E7EB] hover:border-[#2563EB]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg ${
                            item.isDone ? 'bg-[#DCFCE7] text-[#16A34A]' : item.iconColor
                          } flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[12.5px] font-semibold text-[#111827]">
                          {item.label}
                        </span>
                      </div>
                      {item.isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </main>

            <footer className="w-full pt-3 pb-1 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleCompleteAndOpenDashboard('dashboard')}
                className="w-full h-[44px] rounded-full bg-[#0F347C] hover:bg-[#1E3A8A] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleCompleteAndOpenDashboard('dashboard')}
                className="text-[12px] font-semibold text-[#1E3A8A] hover:underline py-1 cursor-pointer"
              >
                I'll do this later
              </button>
            </footer>
          </>
        )}
        </div>
      </div>
    </div>
  );
};
