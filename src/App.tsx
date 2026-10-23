/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGymStore } from './data/gymStore';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/dashboard/Header';
import { BannerCard } from './components/dashboard/BannerCard';
import { BusinessOverview } from './components/dashboard/BusinessOverview';
import { QuickActions } from './components/dashboard/QuickActions';
import { AttentionSection } from './components/dashboard/AttentionSection';
import { BottomNav, NavTab } from './components/dashboard/BottomNav';

import { MembersScreen } from './components/members/MembersScreen';
import { MembershipPlansScreen } from './components/plans/MembershipPlansScreen';
import { RenewalsScreen } from './components/renewals/RenewalsScreen';
import { PaymentsScreen, PaymentsViewMode } from './components/payments/PaymentsScreen';
import { ExpensesScreen } from './components/expenses/ExpensesScreen';
import { LeadsScreen } from './components/leads/LeadsScreen';
import { FollowUpsScreen } from './components/followups/FollowUpsScreen';
import { AttendanceScreen } from './components/attendance/AttendanceScreen';
import { RevenueReportScreen } from './components/reports/RevenueReportScreen';
import { MembershipReportScreen } from './components/reports/MembershipReportScreen';
import { RetentionReportScreen, ReportTabType } from './components/reports/RetentionReportScreen';
import { StaffReportScreen } from './components/reports/StaffReportScreen';
import { StaffDetailPermissionsScreen } from './components/staff/StaffDetailPermissionsScreen';
import { HelpSupportScreen } from './components/support/HelpSupportScreen';
import { GymProfileSettingsScreen } from './components/settings/GymProfileSettingsScreen';
import { NotificationsScreen } from './components/notifications/NotificationsScreen';
import { ReportsOverviewScreen } from './components/reports/ReportsOverviewScreen';
import { ComplaintsSupportScreen } from './components/support/ComplaintsSupportScreen';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { INITIAL_SETTINGS, INITIAL_ONBOARDING } from './data/gymStore';
import { Expense, GymNotificationItem } from './types/dashboard';

// Modals
import { AddMemberModal } from './components/modals/AddMemberModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { AttendanceModal } from './components/modals/AttendanceModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { SearchModal } from './components/modals/SearchModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { ReportsModal } from './components/modals/ReportsModal';
import { RenewMembershipModal } from './components/modals/RenewMembershipModal';
import { ImportMembersModal } from './components/modals/ImportMembersModal';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AuthScreen } from './components/auth/AuthScreen';
import {
  auth,
  testFirebaseConnection,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
} from './lib/firebase';
import { loadGymFromFirestore } from './lib/firestoreSync';

export default function App() {
  const {
    state,
    addMember,
    updateMember,
    archiveMember,
    recordPayment,
    reversePayment,
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
    setFullGymStore,
    addPaymentPromise,
    updatePaymentPromise,
    cancelPaymentPromise,
    completePaymentPromise,
    saveCashReconciliation,
    importMembersBatch,
  } = useGymStore();

  // Screen Flow: splash -> roles -> auth -> onboarding -> dashboard
  const [currentScreen, setCurrentScreen] = useState<
    'splash' | 'roles' | 'auth' | 'onboarding' | 'dashboard'
  >('splash');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<'signup' | 'login'>('signup');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [membersView, setMembersView] = useState<'leads' | 'followups' | 'renewals' | 'directory'>(
    'directory'
  );
  const [paymentsView, setPaymentsView] = useState<'payments' | 'expenses'>('payments');
  const [reportsView, setReportsView] = useState<ReportTabType>('overview');
  const [selectedStaffForPermissionsId, setSelectedStaffForPermissionsId] =
    useState<string>('');

  // Interactive Modals State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [preselectedPlanForAddMember, setPreselectedPlanForAddMember] = useState<{
    name?: string;
    price?: number;
  }>({});
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentPreselectedMemberId, setPaymentPreselectedMemberId] = useState<string | undefined>(undefined);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingMemberId, setRenewingMemberId] = useState<string | null>(null);
  const [isImportMembersOpen, setIsImportMembersOpen] = useState(false);
  const [paymentsInitialViewMode, setPaymentsInitialViewMode] =
    useState<PaymentsViewMode>('transactions');
  const [attendanceInitialTab, setAttendanceInitialTab] = useState<
    'all' | 'present' | 'absent' | 'inactive'
  >('all');

  // Simulation states for testing acceptance criteria
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(false);
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  // Firebase Auth & Live Cloud Firestore Synchronization
  useEffect(() => {
    testFirebaseConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const firestoreData = await loadGymFromFirestore(
            user.uid,
            user.email,
            user.displayName
          );

          setFullGymStore({
            gym: firestoreData.gym,
            settings: firestoreData.settings,
            onboarding: firestoreData.onboarding,
            members: firestoreData.members,
            plans: firestoreData.plans,
            payments: firestoreData.payments,
            renewals: firestoreData.renewals,
            expenses: firestoreData.expenses,
            attendance: firestoreData.attendance,
            leads: firestoreData.leads,
            followUpTasks: firestoreData.followUpTasks,
            staff: firestoreData.staff,
            complaints: firestoreData.complaints,
            notifications: firestoreData.notifications,
            isEmptyState: false,
          });

          // Route according to onboarding status
          if (firestoreData.onboarding?.hasCompletedOnboarding) {
            setCurrentScreen('dashboard');
          } else {
            setCurrentScreen('onboarding');
          }
        } catch (err) {
          console.error('Failed to load gym from Firestore on auth change:', err);
          if (state.onboarding?.hasCompletedOnboarding) {
            setCurrentScreen('dashboard');
          } else {
            setCurrentScreen('onboarding');
          }
        }
      } else {
        setCurrentUser(null);
        // If unauthenticated, ensure protected dashboard is not active
        setCurrentScreen((prev) => (prev === 'dashboard' ? 'roles' : prev));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentScreen('roles');
      setActiveTab('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Handle bottom navigation tab clicks
  const handleTabChange = (tab: NavTab) => {
    if (tab === 'members' && activeTab === 'members') {
      setMembersView((prev) =>
        prev === 'leads'
          ? 'followups'
          : prev === 'followups'
          ? 'renewals'
          : prev === 'renewals'
          ? 'directory'
          : 'leads'
      );
      return;
    }
    if (tab === 'payments' && activeTab === 'payments') {
      setPaymentsView((prev) => (prev === 'payments' ? 'expenses' : 'payments'));
      return;
    }
    if (tab === 'reports' && activeTab === 'reports') {
      setReportsView((prev) =>
        prev === 'overview'
          ? 'complaints'
          : prev === 'complaints'
          ? 'revenue'
          : prev === 'revenue'
          ? 'membership'
          : prev === 'membership'
          ? 'retention'
          : prev === 'retention'
          ? 'staff'
          : prev === 'staff'
          ? 'staff_permissions'
          : prev === 'staff_permissions'
          ? 'gym_settings'
          : prev === 'gym_settings'
          ? 'notifications'
          : prev === 'notifications'
          ? 'support'
          : 'overview'
      );
      return;
    }
    setActiveTab(tab);
  };

  const handleOpenMembersFilter = (filter: string = 'all') => {
    if (filter === 'expiring') {
      setMembersView('renewals');
      setActiveTab('members');
    } else if (filter === 'overdue') {
      setPaymentsView('payments');
      setPaymentsInitialViewMode('pending_dues');
      setActiveTab('payments');
    } else if (filter === 'inactive') {
      setAttendanceInitialTab('inactive');
      setActiveTab('attendance');
    } else {
      setMembersView('directory');
      setActiveTab('members');
    }
  };

  const handleOpenPaymentForMember = (memberId?: string) => {
    setPaymentPreselectedMemberId(memberId);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenRenewModal = (memberId?: string) => {
    setRenewingMemberId(memberId || null);
    setIsRenewModalOpen(true);
  };

  // 1. Splash Screen
  if (currentScreen === 'splash') {
    return (
      <SplashScreen
        onEnterDashboard={() => {
          if (currentUser) {
            if (state.onboarding?.hasCompletedOnboarding) {
              setCurrentScreen('dashboard');
            } else {
              setCurrentScreen('onboarding');
            }
          } else {
            setCurrentScreen('roles');
          }
        }}
      />
    );
  }

  // 2. Role Selection (Owner vs Member, with Member Coming Soon)
  if (currentScreen === 'roles') {
    return (
      <OnboardingScreen
        gym={state.gym}
        settings={state.settings || INITIAL_SETTINGS}
        plans={state.plans}
        onboarding={{ ...state.onboarding, selectedRole: null }}
        isEmptyState={state.isEmptyState}
        initialStep="role"
        onRoleSelectedOwner={() => {
          setAuthInitialMode('signup');
          setCurrentScreen('auth');
        }}
        onSaveProgress={saveOnboardingProgress}
        onCompleteOnboarding={() => {}}
        onBackToSplash={() => setCurrentScreen('splash')}
      />
    );
  }

  // 3. Owner Authentication (Sign Up & Login)
  if (currentScreen === 'auth') {
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onAuthSuccess={async (authUser) => {
          try {
            const firestoreData = await loadGymFromFirestore(
              authUser.uid,
              authUser.email,
              authUser.displayName,
              authUser.gymName
            );

            setFullGymStore({
              gym: firestoreData.gym,
              settings: firestoreData.settings,
              onboarding: firestoreData.onboarding,
              members: firestoreData.members,
              plans: firestoreData.plans,
              payments: firestoreData.payments,
              renewals: firestoreData.renewals,
              expenses: firestoreData.expenses,
              attendance: firestoreData.attendance,
              leads: firestoreData.leads,
              followUpTasks: firestoreData.followUpTasks,
              staff: firestoreData.staff,
              complaints: firestoreData.complaints,
              notifications: firestoreData.notifications,
              isEmptyState: false,
            });

            if (firestoreData.onboarding?.hasCompletedOnboarding) {
              setCurrentScreen('dashboard');
            } else {
              setCurrentScreen('onboarding');
            }
          } catch (err) {
            console.error('Error hydrating store after auth:', err);
            setCurrentScreen('onboarding');
          }
        }}
        onBackToRoles={() => setCurrentScreen('roles')}
      />
    );
  }

  // 4. Owner Onboarding Flow (Duolingo-style 7 question screens + checklist)
  if (currentScreen === 'onboarding') {
    return (
      <OnboardingScreen
        gym={state.gym}
        settings={state.settings || INITIAL_SETTINGS}
        plans={state.plans}
        onboarding={state.onboarding || INITIAL_ONBOARDING}
        isEmptyState={state.isEmptyState}
        membersCount={state.members.length}
        plansCount={state.plans.length}
        paymentsCount={state.payments.length}
        attendanceCount={state.attendance.length}
        onSaveProgress={saveOnboardingProgress}
        onCompleteOnboarding={(payload, nextAction) => {
          completeOnboarding(payload);
          setCurrentScreen('dashboard');
          if (nextAction === 'add_member') {
            setActiveTab('home');
            setPreselectedPlanForAddMember({});
            setIsAddMemberOpen(true);
          } else if (nextAction === 'plans') {
            setActiveTab('plans');
          } else if (nextAction === 'record_payment') {
            setActiveTab('home');
            setPaymentPreselectedMemberId(undefined);
            setIsRecordPaymentOpen(true);
          } else if (nextAction === 'attendance') {
            setActiveTab('attendance');
          } else {
            setActiveTab('home');
          }
        }}
        onBackToSplash={() => setCurrentScreen('roles')}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F2EFE8] text-[#191919] flex flex-col items-center">
      {/* Mobile-first Constrained Container */}
      <div className="w-full max-w-md sm:max-w-lg min-h-screen flex flex-col justify-between px-2.5 sm:px-4 pb-16 sm:pb-18 relative">
        
        {/* Error State Banner if simulated */}
        {simulatedError ? (
          <div className="mt-8 p-6 bg-white rounded-3xl border border-[#FECACA] shadow-lg text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#191919]">Unable to load gym data</h3>
            <p className="text-xs text-[#71717A] mt-1 max-w-xs">{simulatedError}</p>
            <button
              onClick={() => {
                setIsSimulatedLoading(true);
                setTimeout(() => {
                  setSimulatedError(null);
                  setIsSimulatedLoading(false);
                }, 600);
              }}
              className="mt-4 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </button>
          </div>
        ) : isSimulatedLoading ? (
          /* Skeleton Loading State */
          <div className="w-full pt-4 space-y-4 animate-pulse">
            <div className="h-14 bg-white/60 rounded-2xl" />
            <div className="h-40 bg-white/60 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-28 bg-white/60 rounded-2xl" />
              <div className="h-28 bg-white/60 rounded-2xl" />
              <div className="h-28 bg-white/60 rounded-2xl" />
              <div className="h-28 bg-white/60 rounded-2xl" />
            </div>
          </div>
        ) : activeTab === 'members' ? (
          <main className="w-full flex-1">
            {membersView === 'leads' ? (
              <LeadsScreen
                leads={state.leads || []}
                members={state.members}
                plans={state.plans}
                isEmptyState={state.isEmptyState}
                onAddLead={addLead}
                onUpdateLead={updateLead}
                onConvertLead={convertLeadToMember}
                onScheduleFollowUp={scheduleFollowUpTask}
                onOpenFollowUpsScreen={() => setMembersView('followups')}
                onOpenMembersDirectory={() => setMembersView('directory')}
                onRecordPayment={handleOpenPaymentForMember}
                onRenewMembership={(memberId) => handleOpenRenewModal(memberId)}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
              />
            ) : membersView === 'followups' ? (
              <FollowUpsScreen
                followUpTasks={state.followUpTasks || []}
                leads={state.leads || []}
                members={state.members}
                isEmptyState={state.isEmptyState}
                onScheduleFollowUp={scheduleFollowUpTask}
                onCompleteFollowUp={completeFollowUpTask}
                onRescheduleFollowUp={rescheduleFollowUpTask}
                onOpenLeadsScreen={() => setMembersView('leads')}
                onOpenMembersDirectory={() => setMembersView('directory')}
                onRecordPayment={handleOpenPaymentForMember}
                onRenewMembership={(memberId) => handleOpenRenewModal(memberId)}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
              />
            ) : membersView === 'renewals' ? (
              <RenewalsScreen
                members={state.members}
                renewals={state.renewals || []}
                isEmptyState={state.isEmptyState}
                onOpenRenewModal={(memberId) => handleOpenRenewModal(memberId)}
                onRecordPayment={handleOpenPaymentForMember}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
                onSwitchToDirectory={() => setMembersView('directory')}
                onOpenLeads={() => setMembersView('leads')}
                onOpenFollowUps={() => setMembersView('followups')}
              />
            ) : (
              <MembersScreen
                members={state.members}
                onOpenAddMember={() => {
                  setPreselectedPlanForAddMember({});
                  setIsAddMemberOpen(true);
                }}
                onOpenImportMembers={() => setIsImportMembersOpen(true)}
                onRecordPayment={handleOpenPaymentForMember}
                onRenewMembership={(memberId) => handleOpenRenewModal(memberId)}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
                onOpenRenewals={() => setMembersView('renewals')}
                onOpenLeads={() => setMembersView('leads')}
                onOpenFollowUps={() => setMembersView('followups')}
              />
            )}
          </main>
        ) : activeTab === 'plans' ? (
          <main className="w-full flex-1">
            <MembershipPlansScreen
              plans={state.plans}
              members={state.members}
              isEmptyState={state.isEmptyState}
              onAddPlan={addPlan}
              onUpdatePlan={updatePlan}
              onTogglePlanStatus={togglePlanStatus}
              onDuplicatePlan={duplicatePlan}
              onDeletePlan={deletePlan}
              onEnrollMemberWithPlan={(planName, price) => {
                setPreselectedPlanForAddMember({ name: planName, price });
                setIsAddMemberOpen(true);
              }}
              onNavigateToMembers={() => setActiveTab('members')}
            />
          </main>
        ) : activeTab === 'attendance' ? (
          <main className="w-full flex-1">
            <AttendanceScreen
              members={state.members}
              attendance={state.attendance || []}
              activeMembersCount={state.activeMembersCount}
              isEmptyState={state.isEmptyState}
              initialTab={attendanceInitialTab}
              onMarkAttendance={markAttendance}
              onUnmarkAttendance={unmarkAttendance}
              onRecordPayment={(memberId) => handleOpenPaymentForMember(memberId)}
              onRenewMembership={(memberId) => handleOpenRenewModal(memberId)}
              onUpdateMember={updateMember}
              onArchiveMember={archiveMember}
              onAddFollowUp={addFollowUp}
              onOpenAddMember={() => {
                setPreselectedPlanForAddMember({});
                setIsAddMemberOpen(true);
              }}
            />
          </main>
        ) : activeTab === 'payments' ? (
          <main className="w-full flex-1">
            {paymentsView === 'expenses' ? (
              <ExpensesScreen
                expenses={state.expenses}
                isEmptyState={state.isEmptyState}
                onOpenAddExpense={(expToEdit) => {
                  setEditingExpense(expToEdit || null);
                  setIsAddExpenseOpen(true);
                }}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onSwitchToPayments={() => setPaymentsView('payments')}
              />
            ) : (
              <PaymentsScreen
                payments={state.payments}
                expenses={state.expenses}
                members={state.members}
                paymentPromises={state.paymentPromises || []}
                cashReconciliations={state.cashReconciliations || []}
                gymName={state.gym?.name || 'MuscleFit Gym'}
                collectedThisMonth={state.collectedThisMonth}
                isEmptyState={state.isEmptyState}
                initialViewMode={paymentsInitialViewMode}
                onOpenRecordPayment={(memberId) => handleOpenPaymentForMember(memberId)}
                onOpenRenewModal={(memberId) => handleOpenRenewModal(memberId)}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
                onReversePayment={reversePayment}
                onSwitchToExpenses={() => setPaymentsView('expenses')}
                onAddPaymentPromise={addPaymentPromise}
                onUpdatePaymentPromise={updatePaymentPromise}
                onCancelPaymentPromise={cancelPaymentPromise}
                onCompletePaymentPromise={completePaymentPromise}
                onSaveCashReconciliation={saveCashReconciliation}
              />
            )}
          </main>
        ) : activeTab === 'reports' ? (
          <main className="w-full flex-1">
            {reportsView === 'overview' ? (
              <ReportsOverviewScreen
                members={state.members}
                payments={state.payments}
                expenses={state.expenses}
                renewals={state.renewals || []}
                attendance={state.attendance || []}
                staff={state.staff || []}
                monthlyMetrics={state.monthlyMetrics}
                isEmptyState={state.isEmptyState}
                onBack={() => setActiveTab('home')}
                onSelectReportTab={(t) => setReportsView(t)}
                onOpenAttendanceReport={() => setActiveTab('attendance')}
                onOpenExpenseReport={() => {
                  setPaymentsView('expenses');
                  setActiveTab('payments');
                }}
                onOpenPaymentsScreen={() => {
                  setPaymentsView('payments');
                  setActiveTab('payments');
                }}
              />
            ) : reportsView === 'complaints' ? (
              <ComplaintsSupportScreen
                complaints={state.complaints || []}
                members={state.members}
                staff={state.staff || []}
                isEmptyState={state.isEmptyState}
                onBack={() => setReportsView('overview')}
                onSelectReportTab={(t) => setReportsView(t)}
                onAddComplaint={addComplaint}
                onUpdateComplaintStatus={updateComplaintStatus}
                onAssignComplaintStaff={assignComplaintStaff}
                onAddComplaintNote={addComplaintResolutionNote}
              />
            ) : reportsView === 'gym_settings' ? (
              <GymProfileSettingsScreen
                gym={state.gym}
                settings={state.settings || INITIAL_SETTINGS}
                members={state.members}
                plans={state.plans}
                staff={state.staff || []}
                unreadNotificationsCount={
                  state.isEmptyState
                    ? 0
                    : (state.notifications || []).filter((n) => !n.isRead).length
                }
                userEmail={currentUser?.email || state.gym.email}
                onLogout={handleLogout}
                onBack={() => setActiveTab('home')}
                onSelectReportTab={(t) => setReportsView(t)}
                onUpdateGymProfile={updateGymProfile}
                onUpdateGymSettings={updateGymSettings}
                onOpenNotifications={() => setReportsView('notifications')}
                onOpenStaffPermissions={() => setReportsView('staff_permissions')}
                onOpenPlans={() => setActiveTab('plans')}
                onOpenHelpSupport={() => setReportsView('support')}
              />
            ) : reportsView === 'notifications' ? (
              <NotificationsScreen
                notifications={state.notifications || []}
                members={state.members}
                gym={state.gym}
                settings={state.settings || INITIAL_SETTINGS}
                isEmptyState={state.isEmptyState}
                onBack={() => setActiveTab('home')}
                onSelectReportTab={(t) => setReportsView(t)}
                onMarkRead={markNotificationRead}
                onToggleRead={toggleNotificationRead}
                onMarkAllRead={markAllNotificationsRead}
                onDismissNotification={dismissNotification}
                onOpenSettings={() => setReportsView('gym_settings')}
                onPerformAction={(notif: GymNotificationItem) => {
                  if (notif.actionTarget === 'renew_member') {
                    handleOpenRenewModal(notif.memberId);
                  } else if (notif.actionTarget === 'record_payment') {
                    handleOpenPaymentForMember(notif.memberId);
                  } else if (notif.actionTarget === 'followups') {
                    setMembersView('followups');
                    setActiveTab('members');
                  } else if (notif.actionTarget === 'renewals') {
                    setMembersView('renewals');
                    setActiveTab('members');
                  } else if (notif.actionTarget === 'payments') {
                    setPaymentsView('payments');
                    setActiveTab('payments');
                  } else if (notif.actionTarget === 'attendance') {
                    setActiveTab('attendance');
                  } else if (notif.actionTarget === 'staff') {
                    setReportsView('staff');
                  } else if (notif.actionTarget === 'revenue_report') {
                    setReportsView('revenue');
                  } else if (notif.actionTarget === 'members') {
                    setMembersView('directory');
                    setActiveTab('members');
                  }
                }}
              />
            ) : reportsView === 'staff_permissions' ? (
              (() => {
                const staffList = state.staff || [];
                const activeStaffObj =
                  staffList.find((s) => s.id === selectedStaffForPermissionsId) || staffList[0];

                if (!activeStaffObj || state.isEmptyState) {
                  return (
                    <div className="mt-6 bg-white rounded-2xl p-6 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
                      <h2 className="text-[15px] font-bold text-[#191919]">
                        No staff records available
                      </h2>
                      <p className="text-[11.5px] text-[#71717A]">
                        Add staff members to view profiles and configure role permissions.
                      </p>
                      <button
                        type="button"
                        onClick={() => setReportsView('staff')}
                        className="mt-2 h-[34px] px-4 rounded-xl bg-[#1E3A8A] text-white text-[11.5px] font-bold cursor-pointer"
                      >
                        Go to Staff Report
                      </button>
                    </div>
                  );
                }

                return (
                  <StaffDetailPermissionsScreen
                    staff={activeStaffObj}
                    allStaff={staffList}
                    onSelectStaff={(id) => setSelectedStaffForPermissionsId(id)}
                    onSelectReportTab={(t) => setReportsView(t)}
                    onBack={() => setReportsView('staff')}
                    onSavePermissions={saveStaffPermissions}
                    onUpdateStaffMember={updateStaffMember}
                    onToggleStaffActiveStatus={toggleStaffActiveStatus}
                    onMarkStaffAttendance={markStaffAttendance}
                    onPayStaffSalary={payStaffSalary}
                  />
                );
              })()
            ) : reportsView === 'support' ? (
              <HelpSupportScreen
                supportTickets={state.supportTickets || []}
                onBack={() => setActiveTab('home')}
                onSelectReportTab={(t) => setReportsView(t)}
                onCreateSupportTicket={createSupportTicket}
                onNavigateToDestination={(dest) => {
                  if (dest === 'members') {
                    setMembersView('directory');
                    setActiveTab('members');
                  } else if (dest === 'renewals') {
                    setMembersView('renewals');
                    setActiveTab('members');
                  } else if (dest === 'plans') {
                    setActiveTab('plans');
                  } else if (dest === 'payments') {
                    setPaymentsView('payments');
                    setActiveTab('payments');
                  } else if (dest === 'attendance') {
                    setActiveTab('attendance');
                  } else if (dest === 'staff_report') {
                    setReportsView('staff_permissions');
                    setActiveTab('reports');
                  } else if (dest === 'reports') {
                    setReportsView('revenue');
                    setActiveTab('reports');
                  } else {
                    setActiveTab('home');
                  }
                }}
              />
            ) : reportsView === 'retention' ? (
              <RetentionReportScreen
                members={state.members}
                renewals={state.renewals || []}
                isEmptyState={state.isEmptyState}
                onBack={() => setReportsView('overview')}
                onSelectReportTab={(t) => setReportsView(t)}
                onOpenFollowUpsScreen={() => {
                  setMembersView('followups');
                  setActiveTab('members');
                }}
                onOpenMembersDirectory={() => {
                  setMembersView('directory');
                  setActiveTab('members');
                }}
                onOpenRecordPayment={(memberId) => handleOpenPaymentForMember(memberId)}
                onOpenRenewModal={(memberId) => handleOpenRenewModal(memberId)}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
              />
            ) : reportsView === 'staff' ? (
              <StaffReportScreen
                staff={state.staff || []}
                expenses={state.expenses}
                isEmptyState={state.isEmptyState}
                onBack={() => setReportsView('overview')}
                onSelectReportTab={(t) => setReportsView(t)}
                onMarkStaffAttendance={markStaffAttendance}
                onPayStaffSalary={payStaffSalary}
                onSaveStaffPermissions={saveStaffPermissions}
                onUpdateStaffMember={updateStaffMember}
                onToggleStaffActiveStatus={toggleStaffActiveStatus}
                onAddStaffMember={addStaffMember}
                onOpenExpensesScreen={() => {
                  setPaymentsView('expenses');
                  setActiveTab('payments');
                }}
              />
            ) : reportsView === 'membership' ? (
              <MembershipReportScreen
                members={state.members}
                plans={state.plans}
                renewals={state.renewals || []}
                monthlyMetrics={state.monthlyMetrics}
                isEmptyState={state.isEmptyState}
                onBack={() => setReportsView('overview')}
                onSwitchToRevenueReport={() => setReportsView('revenue')}
                onSelectReportTab={(t) => setReportsView(t)}
                onOpenRenewalsScreen={() => {
                  setMembersView('renewals');
                  setActiveTab('members');
                }}
                onOpenMembersDirectory={() => {
                  setMembersView('directory');
                  setActiveTab('members');
                }}
                onOpenRecordPayment={(memberId) => handleOpenPaymentForMember(memberId)}
                onOpenRenewModal={(memberId) => handleOpenRenewModal(memberId)}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
              />
            ) : (
              <RevenueReportScreen
                payments={state.payments}
                expenses={state.expenses}
                members={state.members}
                isEmptyState={state.isEmptyState}
                onBack={() => setReportsView('overview')}
                onSwitchToMembershipReport={() => setReportsView('membership')}
                onSelectReportTab={(t) => setReportsView(t)}
                onOpenPaymentsScreen={() => {
                  setPaymentsView('payments');
                  setActiveTab('payments');
                }}
                onOpenExpensesScreen={() => {
                  setPaymentsView('expenses');
                  setActiveTab('payments');
                }}
                onOpenRecordPayment={(memberId) => handleOpenPaymentForMember(memberId)}
                onOpenRenewModal={(memberId) => handleOpenRenewModal(memberId)}
                onMarkAttendance={markAttendance}
                onUpdateMember={updateMember}
                onArchiveMember={archiveMember}
                onAddFollowUp={addFollowUp}
                onReversePayment={reversePayment}
              />
            )}
          </main>
        ) : (
          <main className="w-full flex-1">
            {/* A. Header */}
            <Header
              gym={state.gym}
              unreadNotificationsCount={
                state.isEmptyState
                  ? 0
                  : (state.notifications || []).filter((n) => !n.isRead).length
              }
              onUpdateGymName={updateGymName}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenNotifications={() => {
                setReportsView('notifications');
                setActiveTab('reports');
              }}
              onOpenGymSettings={() => {
                setReportsView('gym_settings');
                setActiveTab('reports');
              }}
              onOpenStaffPermissions={() => {
                setReportsView('staff_permissions');
                setActiveTab('reports');
              }}
              onOpenHelpSupport={() => {
                setReportsView('support');
                setActiveTab('reports');
              }}
            />

            {/* Motivational Hero Banner */}
            <div className="mt-2">
              <BannerCard />
            </div>

            {/* B. Business Overview with Today's Attendance and Daily Pulse */}
            <BusinessOverview
              state={state}
              onOpenMembers={handleOpenMembersFilter}
              onOpenPayments={() => {
                setPaymentsView('payments');
                setActiveTab('payments');
              }}
              onOpenProfitReport={() => {
                setReportsView('revenue');
                setActiveTab('reports');
              }}
              onOpenAttendance={() => setActiveTab('attendance')}
            />

            {/* C. Quick Actions */}
            <QuickActions
              onAddMember={() => {
                setPreselectedPlanForAddMember({});
                setIsAddMemberOpen(true);
              }}
              onRecordPayment={() => {
                setPaymentPreselectedMemberId(undefined);
                setIsRecordPaymentOpen(true);
              }}
              onRenewMembership={() => {
                setRenewingMemberId(null);
                setIsRenewModalOpen(true);
              }}
              onAddExpense={() => {
                setEditingExpense(null);
                setIsAddExpenseOpen(true);
              }}
              onOpenImportMembers={() => setIsImportMembersOpen(true)}
              onOpenDailyCollection={() => {
                setPaymentsView('payments');
                setPaymentsInitialViewMode('daily_summary');
                setActiveTab('payments');
              }}
              onOpenPaymentPromises={() => {
                setPaymentsView('payments');
                setPaymentsInitialViewMode('promises');
                setActiveTab('payments');
              }}
            />

            {/* D. Needs Your Attention + Feature 5: Consolidated Daily Action List */}
            <AttentionSection
              state={state}
              onSelectCategory={(cat) => {
                if (cat === 'renewals') {
                  setMembersView('renewals');
                  setActiveTab('members');
                } else if (cat === 'pending_payments') {
                  setPaymentsView('payments');
                  setPaymentsInitialViewMode('pending_dues');
                  setActiveTab('payments');
                } else if (cat === 'payment_promises') {
                  setPaymentsView('payments');
                  setPaymentsInitialViewMode('promises');
                  setActiveTab('payments');
                } else if (cat === 'inactive_members') {
                  setAttendanceInitialTab('inactive');
                  setActiveTab('attendance');
                } else if (cat === 'follow_ups') {
                  setMembersView('followups');
                  setActiveTab('members');
                }
              }}
            />
          </main>
        )}

        {/* G. Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* ============================================================== */}
      {/* INTERACTIVE WORKFLOW MODALS                                   */}
      {/* ============================================================== */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setPreselectedPlanForAddMember({});
        }}
        onAddMember={addMember}
        plans={state.plans}
        initialPlanName={preselectedPlanForAddMember.name}
        initialFeeAmount={preselectedPlanForAddMember.price}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        members={state.members}
        initialMemberId={paymentPreselectedMemberId}
        onRecordPayment={recordPayment}
      />

      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        members={state.members}
        onMarkAttendance={markAttendance}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onAddExpense={addExpense}
        initialExpense={editingExpense}
        onUpdateExpense={updateExpense}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        members={state.members}
        onSelectMember={(m) => setActiveTab('members')}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        state={state}
      />

      <RenewMembershipModal
        isOpen={isRenewModalOpen || !!renewingMemberId}
        member={state.members.find((m) => m.id === renewingMemberId) || null}
        members={state.members}
        plans={state.plans}
        onClose={() => {
          setIsRenewModalOpen(false);
          setRenewingMemberId(null);
        }}
        onConfirmRenewal={(memberId, data) => {
          renewMembership(memberId, data);
          setIsRenewModalOpen(false);
          setRenewingMemberId(null);
        }}
      />

      <ImportMembersModal
        isOpen={isImportMembersOpen}
        onClose={() => setIsImportMembersOpen(false)}
        existingMembers={state.members}
        plans={state.plans}
        onConfirmImport={(rows) => importMembersBatch(rows)}
      />
    </div>
  );
}
