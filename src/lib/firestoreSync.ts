/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from './firebase';
import {
  GymProfile,
  GymSettings,
  OnboardingPreferences,
  Member,
  MembershipPlan,
  Payment,
  PaymentPromise,
  CashReconciliation,
  RenewalRecord,
  Expense,
  AttendanceRecord,
  Lead,
  FollowUpTask,
  StaffMember,
  ComplaintRecord,
  GymNotificationItem,
  GymStoreState,
} from '../types/dashboard';
import { INITIAL_SETTINGS, INITIAL_ONBOARDING } from '../data/gymStore';

export interface UserAccountProfile {
  uid: string;
  email: string | null;
  name: string;
  role: 'owner' | 'member';
  gymId: string;
  createdAt: string;
  updatedAt?: string;
}

// Holds signup metadata captured immediately before createUserWithEmailAndPassword
// so that onAuthStateChanged has access to the ownerName and gymName right away.
let pendingSignupDetails: { ownerName?: string; gymName?: string } | null = null;

export function setPendingSignupDetails(
  details: { ownerName?: string; gymName?: string } | null
) {
  pendingSignupDetails = details;
}

/**
 * Recursively strips `undefined` fields from objects/arrays before writing to Firestore,
 * preventing Firestore SDK errors on optional TypeScript properties.
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned as T;
}

/**
 * Loads the user's registered account document and all associated gym documents from Firestore.
 */
export async function loadGymFromFirestore(
  userId: string,
  userEmail: string | null = null,
  userName: string | null = null,
  initialGymName?: string
): Promise<{
  userProfile: UserAccountProfile;
  gym: GymProfile;
  settings: GymSettings;
  onboarding: OnboardingPreferences;
  members: Member[];
  plans: MembershipPlan[];
  payments: Payment[];
  paymentPromises: PaymentPromise[];
  cashReconciliations: CashReconciliation[];
  renewals: RenewalRecord[];
  expenses: Expense[];
  attendance: AttendanceRecord[];
  leads: Lead[];
  followUpTasks: FollowUpTask[];
  staff: StaffMember[];
  complaints: ComplaintRecord[];
  notifications: GymNotificationItem[];
  isNewGymCreated: boolean;
}> {
  const effectiveOwnerName =
    userName?.trim() || pendingSignupDetails?.ownerName?.trim() || null;
  const effectiveGymName =
    initialGymName?.trim() || pendingSignupDetails?.gymName?.trim() || undefined;

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  let userProfile: UserAccountProfile;
  let isNewGymCreated = false;

  if (userSnap.exists()) {
    userProfile = userSnap.data() as UserAccountProfile;
    if (
      effectiveOwnerName &&
      (userProfile.name === 'Gym Owner' || !userProfile.name)
    ) {
      userProfile = {
        ...userProfile,
        name: effectiveOwnerName,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, sanitizeForFirestore(userProfile), { merge: true });
    }
  } else {
    // Generate deterministic sanitized gymId for new owner
    const cleanId = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'main';
    const newGymId = `gym-${cleanId}`;

    userProfile = {
      uid: userId,
      email: userEmail || '',
      name: effectiveOwnerName || 'Gym Owner',
      role: 'owner',
      gymId: newGymId,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, sanitizeForFirestore(userProfile));
    isNewGymCreated = true;
  }

  const gymId = userProfile.gymId;
  const gymRef = doc(db, 'gyms', gymId);
  const gymSnap = await getDoc(gymRef);

  let gym: GymProfile;

  if (gymSnap.exists()) {
    const rawGym = gymSnap.data() as GymProfile;
    gym = {
      ...rawGym,
      id: gymId,
    };
    // If gym was just created with default 'My Gym' during auth state change before gymName arrived, update it
    let needsUpdate = rawGym.id !== gymId;
    if (effectiveGymName && (!gym.name || gym.name === 'My Gym')) {
      gym = { ...gym, name: effectiveGymName };
      needsUpdate = true;
    }
    if (
      effectiveOwnerName &&
      (!gym.ownerName || gym.ownerName === 'Gym Owner')
    ) {
      gym = { ...gym, ownerName: effectiveOwnerName };
      needsUpdate = true;
    }
    if (needsUpdate) {
      await setDoc(
        gymRef,
        sanitizeForFirestore({
          ...gym,
          id: gymId,
          ownerId: userId,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    }
  } else {
    gym = {
      id: gymId,
      name: effectiveGymName || 'My Gym',
      ownerName: effectiveOwnerName || userProfile.name || 'Gym Owner',
      location: 'India',
      currency: 'INR',
      phone: '',
      email: userEmail || '',
      address: '',
      city: '',
      pincode: '',
      gstNumber: '',
      openingHours: '6:00 AM – 10:00 PM',
      sundayHours: '7:00 AM – 12:00 PM',
      establishedYear: String(new Date().getFullYear()),
      branchCode: 'MAIN-01',
    };

    await setDoc(
      gymRef,
      sanitizeForFirestore({
        ...gym,
        ownerId: userId,
        createdAt: new Date().toISOString(),
      })
    );
    isNewGymCreated = true;
  }

  // Clear pending signup details once consumed
  if (effectiveGymName || effectiveOwnerName) {
    pendingSignupDetails = null;
  }

  // Load Settings
  let settings: GymSettings = { ...INITIAL_SETTINGS };
  const settingsRef = doc(db, 'gyms', gymId, 'settings', 'current');
  const settingsSnap = await getDoc(settingsRef);
  if (settingsSnap.exists()) {
    settings = { ...settings, ...settingsSnap.data() };
  } else if (isNewGymCreated) {
    await setDoc(
      settingsRef,
      sanitizeForFirestore({
        ...settings,
        gymId,
        ownerId: userId,
      })
    );
  }

  // Load Onboarding
  let onboarding: OnboardingPreferences = {
    ...INITIAL_ONBOARDING,
    hasCompletedOnboarding: false,
    selectedRole: 'owner',
    currentStep: 'gym_name',
    gymName: gym.name,
  };

  const onboardingRef = doc(db, 'gyms', gymId, 'onboarding', 'current');
  const onboardingSnap = await getDoc(onboardingRef);
  if (onboardingSnap.exists()) {
    const savedOnb = onboardingSnap.data() as OnboardingPreferences;
    const isPreAuthStep =
      !savedOnb.currentStep ||
      savedOnb.currentStep === 'welcome' ||
      savedOnb.currentStep === 'role' ||
      savedOnb.currentStep === 'member_coming_soon';
    const normalizedStep = isPreAuthStep ? 'gym_name' : savedOnb.currentStep;
    const isCompleted =
      Boolean(savedOnb.hasCompletedOnboarding) ||
      savedOnb.currentStep === 'complete' ||
      Boolean(savedOnb.completedAt);

    onboarding = {
      ...onboarding,
      ...savedOnb,
      selectedRole: 'owner',
      currentStep: isCompleted ? 'complete' : normalizedStep,
      hasCompletedOnboarding: isCompleted,
      gymName: savedOnb.gymName || gym.name,
    };

    if (isPreAuthStep || savedOnb.selectedRole !== 'owner' || isCompleted !== savedOnb.hasCompletedOnboarding) {
      await setDoc(
        onboardingRef,
        sanitizeForFirestore({
          ...onboarding,
          gymId,
          ownerId: userId,
        }),
        { merge: true }
      );
    }
  } else {
    await setDoc(
      onboardingRef,
      sanitizeForFirestore({
        ...onboarding,
        gymId,
        ownerId: userId,
      })
    );
  }

  // Load subcollections using query with ownerId enforcer
  const fetchCollection = async <T>(collName: string): Promise<T[]> => {
    try {
      const q = query(
        collection(db, 'gyms', gymId, collName),
        where('ownerId', '==', userId)
      );
      const snap = await getDocs(q);
      const items: T[] = [];
      snap.forEach((d) => {
        items.push(d.data() as T);
      });
      return items;
    } catch (err) {
      console.warn(`Notice fetching ${collName}:`, err);
      return [];
    }
  };

  const [
    members,
    plans,
    payments,
    paymentPromises,
    cashReconciliations,
    renewals,
    expenses,
    attendance,
    leads,
    followUpTasks,
    staff,
    complaints,
    notifications,
  ] = await Promise.all([
    fetchCollection<Member>('members'),
    fetchCollection<MembershipPlan>('plans'),
    fetchCollection<Payment>('payments'),
    fetchCollection<PaymentPromise>('paymentPromises'),
    fetchCollection<CashReconciliation>('cashReconciliations'),
    fetchCollection<RenewalRecord>('renewals'),
    fetchCollection<Expense>('expenses'),
    fetchCollection<AttendanceRecord>('attendance'),
    fetchCollection<Lead>('leads'),
    fetchCollection<FollowUpTask>('followUpTasks'),
    fetchCollection<StaffMember>('staff'),
    fetchCollection<ComplaintRecord>('complaints'),
    fetchCollection<GymNotificationItem>('notifications'),
  ]);

  // If the gym already has operational records or completed setup fields on the profile, ensure onboarding is marked completed
  const hasExistingGymActivity =
    members.length > 0 ||
    plans.length > 0 ||
    payments.length > 0 ||
    expenses.length > 0 ||
    Boolean(gym.startingMemberRange) ||
    Boolean(gym.managementMethod);

  if (hasExistingGymActivity && !onboarding.hasCompletedOnboarding) {
    onboarding = {
      ...onboarding,
      hasCompletedOnboarding: true,
      currentStep: 'complete',
      selectedRole: 'owner',
    };
    await setDoc(
      onboardingRef,
      sanitizeForFirestore({
        ...onboarding,
        gymId,
        ownerId: userId,
      }),
      { merge: true }
    );
  }

  return {
    userProfile,
    gym,
    settings,
    onboarding,
    members,
    plans,
    payments,
    paymentPromises,
    cashReconciliations,
    renewals,
    expenses,
    attendance,
    leads,
    followUpTasks,
    staff,
    complaints,
    notifications,
    isNewGymCreated,
  };
}

/**
 * Persists Gym Profile changes to Firestore
 */
export async function syncGymProfileToFirestore(
  gymId: string,
  gymData: Partial<GymProfile>,
  userId: string
) {
  try {
    const gymRef = doc(db, 'gyms', gymId);
    await setDoc(
      gymRef,
      sanitizeForFirestore({
        ...gymData,
        id: gymId,
        ownerId: userId,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to sync gym profile to Firestore:', err);
  }
}

/**
 * Persists Settings to Firestore
 */
export async function syncGymSettingsToFirestore(
  gymId: string,
  settings: Partial<GymSettings>,
  userId: string
) {
  try {
    const ref = doc(db, 'gyms', gymId, 'settings', 'current');
    await setDoc(
      ref,
      sanitizeForFirestore({
        ...settings,
        gymId,
        ownerId: userId,
      }),
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to sync settings to Firestore:', err);
  }
}

/**
 * Persists Onboarding progress to Firestore
 */
export async function syncGymOnboardingToFirestore(
  gymId: string,
  onboarding: Partial<OnboardingPreferences>,
  userId: string
) {
  try {
    const ref = doc(db, 'gyms', gymId, 'onboarding', 'current');
    await setDoc(
      ref,
      sanitizeForFirestore({
        ...onboarding,
        gymId,
        ownerId: userId,
      }),
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to sync onboarding to Firestore:', err);
  }
}

/**
 * Generic helper to save an item to a subcollection
 */
export async function syncEntityToFirestore(
  gymId: string,
  collName: string,
  docId: string,
  data: any,
  userId: string
) {
  try {
    const cleanDocId = String(docId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const ref = doc(db, 'gyms', gymId, collName, cleanDocId);
    await setDoc(
      ref,
      sanitizeForFirestore({
        ...data,
        gymId,
        ownerId: userId,
      }),
      { merge: true }
    );
  } catch (err) {
    console.error(`Failed to sync ${collName}/${docId} to Firestore:`, err);
  }
}

/**
 * Generic helper to delete an item from a subcollection
 */
export async function deleteEntityFromFirestore(
  gymId: string,
  collName: string,
  docId: string
) {
  try {
    const cleanDocId = String(docId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const ref = doc(db, 'gyms', gymId, collName, cleanDocId);
    await deleteDoc(ref);
  } catch (err) {
    console.error(`Failed to delete ${collName}/${docId} from Firestore:`, err);
  }
}

/**
 * Automatically synchronizes state changes between prev and next GymStoreState to Firestore
 * whenever an authenticated owner is logged in.
 */
export function syncStoreDiffToFirestore(
  prev: GymStoreState,
  next: GymStoreState
) {
  const user = auth.currentUser;
  if (!user) return;

  const userId = user.uid;
  const cleanId = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'main';
  const rawGymId = next.gym?.id;
  const gymId =
    rawGymId && rawGymId !== 'gym-1' && rawGymId !== 'gym-iron-pulse'
      ? rawGymId
      : `gym-${cleanId}`;

  if (prev.gym !== next.gym) {
    syncGymProfileToFirestore(gymId, next.gym, userId);
  }
  if (prev.settings !== next.settings && next.settings) {
    syncGymSettingsToFirestore(gymId, next.settings, userId);
  }
  if (prev.onboarding !== next.onboarding && next.onboarding) {
    syncGymOnboardingToFirestore(gymId, next.onboarding, userId);
  }

  const collections: Array<{
    key: keyof GymStoreState;
    collName: string;
  }> = [
    { key: 'members', collName: 'members' },
    { key: 'plans', collName: 'plans' },
    { key: 'payments', collName: 'payments' },
    { key: 'paymentPromises', collName: 'paymentPromises' },
    { key: 'cashReconciliations', collName: 'cashReconciliations' },
    { key: 'renewals', collName: 'renewals' },
    { key: 'expenses', collName: 'expenses' },
    { key: 'attendance', collName: 'attendance' },
    { key: 'leads', collName: 'leads' },
    { key: 'followUpTasks', collName: 'followUpTasks' },
    { key: 'staff', collName: 'staff' },
    { key: 'complaints', collName: 'complaints' },
  ];

  for (const { key, collName } of collections) {
    const prevList = (prev[key] as Array<{ id: string }> | undefined) || [];
    const nextList = (next[key] as Array<{ id: string }> | undefined) || [];

    if (prevList === nextList) continue;

    const prevMap = new Map<string, any>();
    for (const item of prevList) {
      if (item && item.id) prevMap.set(item.id, item);
    }

    const nextIds = new Set<string>();
    for (const item of nextList) {
      if (!item || !item.id) continue;
      nextIds.add(item.id);
      const prevItem = prevMap.get(item.id);
      if (prevItem !== item) {
        syncEntityToFirestore(gymId, collName, item.id, item, userId);
      }
    }

    for (const prevItem of prevList) {
      if (prevItem && prevItem.id && !nextIds.has(prevItem.id)) {
        deleteEntityFromFirestore(gymId, collName, prevItem.id);
      }
    }
  }
}
