/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Calendar,
  Users,
  IndianRupee,
  Dumbbell,
  Sparkles,
  Clock,
  Edit2,
  Power,
  Copy,
  Trash2,
  MoreVertical,
  ArrowUpDown,
  CheckCircle,
  X,
  UserPlus,
  ChevronRight,
  Flame,
  Sliders,
} from 'lucide-react';
import { MembershipPlan, Member } from '../../types/dashboard';
import { PlanFilterModal, PlanFilterOptions } from './PlanFilterModal';
import { PlanFormModal } from './PlanFormModal';

interface MembershipPlansScreenProps {
  plans: MembershipPlan[];
  members: Member[];
  isEmptyState?: boolean;
  onAddPlan: (planData: Omit<MembershipPlan, 'id' | 'code' | 'createdAt'>) => void;
  onUpdatePlan: (planId: string, updates: Partial<MembershipPlan>) => void;
  onTogglePlanStatus: (planId: string) => void;
  onDuplicatePlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onEnrollMemberWithPlan?: (planName: string, price: number) => void;
  onNavigateToMembers?: (planFilter?: string) => void;
}

export const MembershipPlansScreen: React.FC<MembershipPlansScreenProps> = ({
  plans,
  members,
  isEmptyState = false,
  onAddPlan,
  onUpdatePlan,
  onTogglePlanStatus,
  onDuplicatePlan,
  onDeletePlan,
  onEnrollMemberWithPlan,
  onNavigateToMembers,
}) => {
  // Search, Category Tab, & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<
    'all' | 'active' | 'inactive' | 'popular' | 'custom'
  >('all');
  const [sortBy, setSortBy] = useState<
    'popularity' | 'price_asc' | 'price_desc' | 'duration' | 'recent'
  >('popularity');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Advanced Filter Options
  const [advancedFilters, setAdvancedFilters] = useState<PlanFilterOptions>({
    status: 'all',
    classification: 'all',
    priceRange: 'all',
    durationRange: 'all',
  });

  // Add / Edit Plan Modal State
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [selectedPlanForDetail, setSelectedPlanForDetail] = useState<MembershipPlan | null>(null);

  // Action Menu & Confirmation State
  const [openMenuPlanId, setOpenMenuPlanId] = useState<string | null>(null);
  const [inspectingPlanMembers, setInspectingPlanMembers] = useState<MembershipPlan | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Effective plans list (empty if empty state is active)
  const effectivePlans = useMemo(() => {
    return isEmptyState ? [] : plans;
  }, [plans, isEmptyState]);

  // Calculate real assigned member count per plan from authenticated gym's member records
  const planMemberStats = useMemo(() => {
    const map: Record<
      string,
      { totalAssigned: number; activeAssigned: number; memberList: Member[] }
    > = {};

    effectivePlans.forEach((p) => {
      const normalizedPlanName = p.name.toLowerCase().trim();
      const matchedMembers = isEmptyState
        ? []
        : members.filter((m) => {
            const mPlan = (m.membershipPlan || '').toLowerCase().trim();
            return (
              mPlan === normalizedPlanName ||
              mPlan.includes(normalizedPlanName) ||
              normalizedPlanName.includes(mPlan)
            );
          });

      const activeMatched = matchedMembers.filter(
        (m) => m.status === 'active' || m.status === 'expiring'
      );

      map[p.id] = {
        totalAssigned: matchedMembers.length,
        activeAssigned: activeMatched.length,
        memberList: matchedMembers,
      };
    });

    return map;
  }, [effectivePlans, members, isEmptyState]);

  // Determine Popularity threshold from real membership data:
  // A plan is Popular if it has >= 3 enrolled members (or is in the top enrolled plans with >= 2 members)
  const isPlanPopular = (planId: string) => {
    const count = planMemberStats[planId]?.totalAssigned || 0;
    return count >= 3;
  };

  // Summary card counts (never hardcoded)
  const totalPlansCount = effectivePlans.length;
  const activePlansCount = effectivePlans.filter((p) => p.status === 'active').length;

  // Count active advanced filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.status !== 'all') count++;
    if (advancedFilters.classification !== 'all') count++;
    if (advancedFilters.priceRange !== 'all') count++;
    if (advancedFilters.durationRange !== 'all') count++;
    return count;
  }, [advancedFilters]);

  // Filtered and Sorted Plans
  const filteredAndSortedPlans = useMemo(() => {
    return effectivePlans
      .filter((plan) => {
        // 1. Search by Plan Name, Duration, Code, or Description
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = plan.name.toLowerCase().includes(q);
          const matchDuration = plan.durationLabel.toLowerCase().includes(q);
          const matchDays = `${plan.durationDays} days`.includes(q);
          const matchCode = plan.code.toLowerCase().includes(q);
          const matchDesc = plan.description.toLowerCase().includes(q);
          if (!matchName && !matchDuration && !matchDays && !matchCode && !matchDesc) {
            return false;
          }
        }

        // 2. Category Tab Filter
        if (selectedCategoryTab === 'active' && plan.status !== 'active') return false;
        if (selectedCategoryTab === 'inactive' && plan.status !== 'inactive') return false;
        if (selectedCategoryTab === 'popular' && !isPlanPopular(plan.id)) return false;
        if (selectedCategoryTab === 'custom' && !plan.isCustom) return false;

        // 3. Advanced Filters Modal
        if (advancedFilters.status === 'active' && plan.status !== 'active') return false;
        if (advancedFilters.status === 'inactive' && plan.status !== 'inactive') return false;

        if (advancedFilters.classification === 'popular' && !isPlanPopular(plan.id)) {
          return false;
        }
        if (advancedFilters.classification === 'custom' && !plan.isCustom) return false;
        if (advancedFilters.classification === 'standard' && plan.isCustom) return false;

        if (advancedFilters.priceRange === 'under_3000' && plan.price >= 3000) return false;
        if (
          advancedFilters.priceRange === '3000_to_8000' &&
          (plan.price < 3000 || plan.price > 8000)
        ) {
          return false;
        }
        if (advancedFilters.priceRange === 'above_8000' && plan.price <= 8000) return false;

        if (advancedFilters.durationRange === 'short' && plan.durationDays > 45) return false;
        if (
          advancedFilters.durationRange === 'quarterly' &&
          (plan.durationDays <= 45 || plan.durationDays > 120)
        ) {
          return false;
        }
        if (advancedFilters.durationRange === 'long' && plan.durationDays < 180) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popularity') {
          const countA = planMemberStats[a.id]?.totalAssigned || 0;
          const countB = planMemberStats[b.id]?.totalAssigned || 0;
          if (countB !== countA) return countB - countA;
          return a.price - b.price;
        }
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'duration') return a.durationDays - b.durationDays;
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [effectivePlans, searchQuery, selectedCategoryTab, advancedFilters, sortBy, planMemberStats]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryTab('all');
    setAdvancedFilters({
      status: 'all',
      classification: 'all',
      priceRange: 'all',
      durationRange: 'all',
    });
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setIsPlanFormOpen(true);
  };

  const handleOpenEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setOpenMenuPlanId(null);
    setIsPlanFormOpen(true);
  };

  const handleSavePlan = (
    planData: Omit<MembershipPlan, 'id' | 'code' | 'createdAt'>,
    editingPlanId?: string
  ) => {
    if (editingPlanId) {
      onUpdatePlan(editingPlanId, planData);
      showToast(`Updated "${planData.name}" successfully.`);
    } else {
      onAddPlan(planData);
      showToast(`Created "${planData.name}" membership plan.`);
    }
  };

  const handleToggleStatus = (plan: MembershipPlan) => {
    onTogglePlanStatus(plan.id);
    setOpenMenuPlanId(null);
    const nextState = plan.status === 'active' ? 'deactivated' : 'activated';
    showToast(`"${plan.name}" has been ${nextState}.`);
  };

  const handleDuplicate = (plan: MembershipPlan) => {
    onDuplicatePlan(plan.id);
    setOpenMenuPlanId(null);
    showToast(`Duplicated "${plan.name}".`);
  };

  const handleDelete = (plan: MembershipPlan) => {
    const assigned = planMemberStats[plan.id]?.totalAssigned || 0;
    setOpenMenuPlanId(null);
    if (assigned > 0) {
      showToast(
        `Cannot delete "${plan.name}" while ${assigned} members are assigned. Deactivate it instead.`
      );
      return;
    }
    onDeletePlan(plan.id);
    showToast(`Deleted "${plan.name}".`);
  };

  return (
    <div className="w-full flex-1 pb-3">
      {/* ============================================================== */}
      {/* A. PAGE HEADER: Title, Subtitle, & "+ Add Plan" Button         */}
      {/* ============================================================== */}
      <header className="w-full flex flex-wrap items-center justify-between gap-2 pt-2.5 pb-2 px-0.5">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
            Membership Plans
          </h1>
          <p className="text-[#71717A] text-[12px] font-normal mt-0.5 leading-none">
            Manage your gym’s membership packages.
          </p>
        </div>

        {/* Primary "+ Add Plan" Button */}
        <button
          onClick={handleOpenCreatePlan}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-95 text-white text-[12px] font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          aria-label="Add Membership Plan"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Plan</span>
        </button>
      </header>

      {/* Action Feedback Toast Banner */}
      {feedbackBanner && (
        <div className="mb-2.5 px-3 py-2 rounded-xl bg-[#102A71] text-white text-[11.5px] font-semibold flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <span>{feedbackBanner}</span>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-white/80 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* B. SEARCH & FILTER BAR                                         */}
      {/* ============================================================== */}
      <div className="mt-1 flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plan name or duration"
            className="w-full pl-9 pr-7 py-2 text-[12.5px] bg-white border border-[#EAE5DC] rounded-xl text-[#191919] placeholder-[#8E8E93] focus:outline-hidden focus:border-[#102A71] shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#191919] p-0.5 rounded-full cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer relative shrink-0 ${
            activeFilterCount > 0
              ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71]'
              : 'bg-white border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
          }`}
          aria-label="Open plan filter options"
          title="Filter plans"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#102A71] text-white text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* C. SUMMARY CARDS: Total Plans & Active Plans                   */}
      {/* ============================================================== */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:gap-2.5">
        {/* Card 1: Total Plans (Pale-blue background) */}
        <div className="bg-[#EBF1FE] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between border border-[#DCE6FC] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D6E3FD] text-[#2563EB] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[#4B5563] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
                Total Plans
              </span>
              <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
                {totalPlansCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] sm:text-[10.5px] text-[#6B7280] mt-1.5 block leading-none font-normal">
            All configured packages
          </span>
        </div>

        {/* Card 2: Active Plans (Pale-green background) */}
        <div className="bg-[#EAF7EE] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between border border-[#D5EEDC] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D2F2DB] text-[#16A34A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[#4B5563] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
                Active Plans
              </span>
              <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
                {activePlansCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] sm:text-[10.5px] text-[#15803D] font-medium mt-1.5 block leading-none">
            Available for enrollment
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* D. PLAN CATEGORY TABS (Horizontally Scrollable Row)            */}
      {/* ============================================================== */}
      <div className="mt-3">
        <h2 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight mb-1.5 px-0.5">
          Plan Categories
        </h2>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {[
            { id: 'all', label: 'All', dot: null, icon: null },
            { id: 'active', label: 'Active', dot: '#16A34A', icon: null },
            { id: 'inactive', label: 'Inactive', dot: '#9CA3AF', icon: null },
            { id: 'popular', label: 'Popular', dot: '#F59E0B', icon: Flame },
            { id: 'custom', label: 'Custom', dot: '#7C3AED', icon: Sliders },
          ].map((tab) => {
            const isSelected = selectedCategoryTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategoryTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11.5px] sm:text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer snap-start ${
                  isSelected
                    ? 'bg-[#102A71] text-white shadow-2xs'
                    : 'bg-white border border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
                }`}
              >
                {TabIcon ? (
                  <TabIcon
                    className={`w-3 h-3 shrink-0 ${
                      isSelected ? 'text-white' : 'text-[#71717A]'
                    }`}
                  />
                ) : tab.dot ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tab.dot }}
                  />
                ) : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* E. PLANS LIST HEADING & SORTING CONTROL                        */}
      {/* ============================================================== */}
      <div className="mt-3 mb-1.5 flex items-center justify-between relative px-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight">
            Plans ({filteredAndSortedPlans.length})
          </h3>
          {(searchQuery || selectedCategoryTab !== 'all' || activeFilterCount > 0) && (
            <button
              onClick={handleResetAllFilters}
              className="text-[10.5px] font-bold text-[#102A71] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="relative">
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-1 text-[11.5px] font-medium text-[#4B5563] hover:text-[#191919] cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 stroke-[2]" />
            <span>
              Sort by:{' '}
              <span className="font-semibold text-[#191919]">
                {sortBy === 'popularity'
                  ? 'Popularity'
                  : sortBy === 'price_asc'
                  ? 'Price: Low–High'
                  : sortBy === 'price_desc'
                  ? 'Price: High–Low'
                  : sortBy === 'duration'
                  ? 'Duration'
                  : 'Recent'}
              </span>
            </span>
            <span className="text-[9px] ml-0.5">▼</span>
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {[
                { id: 'popularity', label: 'Popularity (Members)' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
                { id: 'duration', label: 'Duration: Short to Long' },
                { id: 'recent', label: 'Recently Created' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSortBy(s.id as any);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-[#FAF8F5] transition-colors flex items-center justify-between cursor-pointer ${
                    sortBy === s.id ? 'text-[#102A71] font-bold bg-[#F4F1EA]' : 'text-[#191919]'
                  }`}
                >
                  <span>{s.label}</span>
                  {sortBy === s.id && <CheckCircle className="w-3 h-3 text-[#102A71]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* F. MEMBERSHIP PLAN CARDS LIST                                  */}
      {/* ============================================================== */}
      <div className="space-y-2 sm:space-y-2.5">
        {effectivePlans.length === 0 ? (
          /* Real Empty State when gym has 0 plans */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#EBF1FE] text-[#102A71] flex items-center justify-center mx-auto mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No membership plans yet</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto leading-relaxed">
              Create your first membership package to start enrolling gym members and tracking renewals.
            </p>
            <button
              onClick={handleOpenCreatePlan}
              className="mt-3 px-3.5 py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Plan</span>
            </button>
          </div>
        ) : filteredAndSortedPlans.length === 0 ? (
          /* Filtered Empty State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Search className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No matching plans found</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? `No membership plans match "${searchQuery}".`
                : selectedCategoryTab === 'popular'
                ? 'No plans currently meet the popular enrollment threshold (3+ members).'
                : 'No plans match the selected category or filter rules.'}
            </p>
            <button
              onClick={handleResetAllFilters}
              className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-bold text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredAndSortedPlans.map((plan) => {
            const stats = planMemberStats[plan.id] || {
              totalAssigned: 0,
              activeAssigned: 0,
              memberList: [],
            };
            const popular = isPlanPopular(plan.id);
            const effectiveMonthly =
              plan.durationDays > 0
                ? Math.round((plan.price / plan.durationDays) * 30)
                : plan.price;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanForDetail(plan)}
                className={`bg-white rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all cursor-pointer group relative ${
                  plan.status === 'inactive' ? 'border-[#E5E0D6] opacity-80' : 'border-[#EAE5DC]'
                }`}
                role="button"
                tabIndex={0}
                aria-label={`Open plan details for ${plan.name}`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Icon + Title + Duration + Status */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        plan.status === 'inactive'
                          ? 'bg-[#F1F3F6] text-[#6B7280]'
                          : plan.isCustom
                          ? 'bg-[#F3E8FF] text-[#7C3AED]'
                          : popular
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#EBF1FE] text-[#102A71]'
                      }`}
                    >
                      {plan.isCustom ? (
                        <Sparkles className="w-5 h-5 stroke-[2]" />
                      ) : (
                        <Dumbbell className="w-5 h-5 stroke-[2]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-[14px] sm:text-[15px] text-[#191919] leading-tight truncate group-hover:text-[#102A71] transition-colors">
                          {plan.name}
                        </h4>
                        {popular && (
                          <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded-md">
                            Popular
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#71717A] mt-1 leading-none">
                        <span>{plan.durationLabel} ({plan.durationDays} Days)</span>
                        <span>·</span>
                        <span
                          className={`font-semibold ${
                            plan.status === 'active' ? 'text-[#16A34A]' : 'text-[#6B7280]'
                          }`}
                        >
                          {plan.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + Overflow Action Menu */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-[17px] sm:text-[19px] font-extrabold text-[#102A71] leading-none">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Clean Overflow Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuPlanId(openMenuPlanId === plan.id ? null : plan.id)
                        }
                        className="w-8 h-8 rounded-lg hover:bg-[#F4F1EA] text-[#71717A] hover:text-[#191919] flex items-center justify-center transition-colors cursor-pointer"
                        aria-label={`Actions for ${plan.name}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuPlanId === plan.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPlanId(null);
                              setSelectedPlanForDetail(plan);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#102A71]" />
                            <span>View Details</span>
                          </button>

                          {plan.status === 'active' && onEnrollMemberWithPlan && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuPlanId(null);
                                onEnrollMemberWithPlan(plan.name, plan.price);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#102A71] hover:bg-[#EFF6FF] flex items-center gap-2 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign Member</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPlanId(null);
                              handleOpenEditPlan(plan);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#4B5563]" />
                            <span>Edit Plan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPlanId(null);
                              handleToggleStatus(plan);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                          >
                            <Power
                              className={`w-3.5 h-3.5 ${
                                plan.status === 'active' ? 'text-[#D97706]' : 'text-[#16A34A]'
                              }`}
                            />
                            <span>{plan.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPlanId(null);
                              handleDuplicate(plan);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#71717A]" />
                            <span>Duplicate Plan</span>
                          </button>

                          <div className="my-1 border-t border-[#F2EFE8]" />

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPlanId(null);
                              handleDelete(plan);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                            <span>Delete Plan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* MODALS: Filter Modal, Plan Form Modal, & Enrolled Members View */}
      {/* ============================================================== */}
      <PlanFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={advancedFilters}
        onApply={(updated) => setAdvancedFilters(updated)}
        onReset={handleResetAllFilters}
      />

      <PlanFormModal
        isOpen={isPlanFormOpen}
        onClose={() => {
          setIsPlanFormOpen(false);
          setEditingPlan(null);
        }}
        initialPlan={editingPlan}
        onSavePlan={handleSavePlan}
      />

      {/* Enrolled Members Drawer/Modal for a specific Plan */}
      {inspectingPlanMembers && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-3.5 sm:p-4 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#191919]">
                  {inspectingPlanMembers.name} — Members
                </h3>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  {planMemberStats[inspectingPlanMembers.id]?.totalAssigned || 0} enrolled
                  members on this package
                </p>
              </div>
              <button
                onClick={() => setInspectingPlanMembers(null)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="my-2.5 flex-1 overflow-y-auto space-y-1.5">
              {(planMemberStats[inspectingPlanMembers.id]?.memberList || []).length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs font-semibold text-[#71717A]">
                    No members are currently assigned to this plan.
                  </p>
                </div>
              ) : (
                (planMemberStats[inspectingPlanMembers.id]?.memberList || []).map((m) => (
                  <div
                    key={m.id}
                    className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#191919]">{m.name}</div>
                      <div className="text-[10.5px] text-[#71717A] mt-0.5">
                        {m.memberCode || m.id} · Expires {m.expiryDate}
                      </div>
                    </div>
                    <span className="text-[10.5px] font-semibold capitalize text-[#102A71]">
                      {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#F2EFE8] flex items-center gap-2">
              {onNavigateToMembers && (
                <button
                  type="button"
                  onClick={() => {
                    const planName = inspectingPlanMembers.name;
                    setInspectingPlanMembers(null);
                    onNavigateToMembers(planName);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#102A71] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open in Members Directory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectingPlanMembers(null)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#4B5563] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Plan Detail Modal */}
      {selectedPlanForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-3.5">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#F2EFE8]">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPlanForDetail.status === 'inactive'
                      ? 'bg-[#F1F3F6] text-[#6B7280]'
                      : selectedPlanForDetail.isCustom
                      ? 'bg-[#F3E8FF] text-[#7C3AED]'
                      : isPlanPopular(selectedPlanForDetail.id)
                      ? 'bg-[#FEF3C7] text-[#D97706]'
                      : 'bg-[#EBF1FE] text-[#102A71]'
                  }`}
                >
                  {selectedPlanForDetail.isCustom ? (
                    <Sparkles className="w-5 h-5 stroke-[2]" />
                  ) : (
                    <Dumbbell className="w-5 h-5 stroke-[2]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-[17px] font-bold text-[#191919] leading-tight">
                      {selectedPlanForDetail.name}
                    </h3>
                    {isPlanPopular(selectedPlanForDetail.id) && (
                      <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded-md">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71717A] mt-1">
                    {selectedPlanForDetail.code} · {selectedPlanForDetail.durationLabel} ({selectedPlanForDetail.durationDays} Days)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanForDetail(null)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Price & Status Strip */}
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-semibold text-[#71717A] uppercase tracking-wider block">
                  Membership Fee
                </span>
                <div className="text-[20px] font-extrabold text-[#102A71] leading-none mt-1">
                  ₹{selectedPlanForDetail.price.toLocaleString('en-IN')}
                </div>
                {selectedPlanForDetail.durationDays > 0 && (
                  <span className="text-[10px] text-[#71717A] font-medium block mt-1">
                    ≈ ₹{Math.round((selectedPlanForDetail.price / selectedPlanForDetail.durationDays) * 30).toLocaleString('en-IN')}/month
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10.5px] font-semibold text-[#71717A] uppercase tracking-wider block">
                  Current Status
                </span>
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${
                    selectedPlanForDetail.status === 'active'
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {selectedPlanForDetail.status === 'active' ? '● Active' : '○ Inactive'}
                </span>
              </div>
            </div>

            {/* Plan Details & Benefits */}
            <div className="space-y-2.5 text-xs text-[#4B5563]">
              <div>
                <h4 className="font-bold text-[12px] text-[#191919] mb-1">
                  Description
                </h4>
                <p className="leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DC]">
                  {selectedPlanForDetail.description || 'Standard gym workout membership.'}
                </p>
              </div>

              {selectedPlanForDetail.features && selectedPlanForDetail.features.length > 0 && (
                <div>
                  <h4 className="font-bold text-[12px] text-[#191919] mb-1">
                    Included Benefits
                  </h4>
                  <div className="space-y-1.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DC]">
                    {selectedPlanForDetail.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#191919]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Joining Fee & Enrolled Members */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
                  <span className="text-[10.5px] text-[#71717A] font-semibold block">
                    Joining Fee
                  </span>
                  <span className="font-bold text-[13px] text-[#191919] mt-0.5 block">
                    {selectedPlanForDetail.registrationFee && selectedPlanForDetail.registrationFee > 0
                      ? `₹${selectedPlanForDetail.registrationFee.toLocaleString('en-IN')}`
                      : 'Free (₹0)'}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setInspectingPlanMembers(selectedPlanForDetail);
                  }}
                  className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] cursor-pointer hover:border-[#BFDBFE] transition-colors"
                >
                  <span className="text-[10.5px] text-[#71717A] font-semibold block">
                    Assigned Members
                  </span>
                  <span className="font-bold text-[13px] text-[#102A71] mt-0.5 block underline">
                    {planMemberStats[selectedPlanForDetail.id]?.totalAssigned || 0} Members →
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#F2EFE8] space-y-2">
              {selectedPlanForDetail.status === 'active' && onEnrollMemberWithPlan && (
                <button
                  type="button"
                  onClick={() => {
                    const name = selectedPlanForDetail.name;
                    const price = selectedPlanForDetail.price;
                    setSelectedPlanForDetail(null);
                    onEnrollMemberWithPlan(name, price);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Enroll Member with this Plan</span>
                </button>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPlanForDetail;
                    setSelectedPlanForDetail(null);
                    handleOpenEditPlan(p);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#191919] hover:bg-[#F2EFE8] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#102A71]" />
                  <span>Edit Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPlanForDetail;
                    setSelectedPlanForDetail(null);
                    handleToggleStatus(p);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#4B5563] hover:bg-[#F2EFE8] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Power
                    className={`w-3.5 h-3.5 ${
                      selectedPlanForDetail.status === 'active' ? 'text-[#D97706]' : 'text-[#16A34A]'
                    }`}
                  />
                  <span>
                    {selectedPlanForDetail.status === 'active' ? 'Deactivate' : 'Activate'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPlanForDetail;
                    setSelectedPlanForDetail(null);
                    handleDuplicate(p);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#71717A] hover:bg-[#F2EFE8] flex items-center justify-center cursor-pointer"
                  title="Duplicate Plan"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPlanForDetail;
                    setSelectedPlanForDetail(null);
                    handleDelete(p);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2] flex items-center justify-center cursor-pointer"
                  title="Delete Plan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
