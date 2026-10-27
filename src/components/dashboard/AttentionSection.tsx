/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Clock,
  CreditCard,
  UserX,
  PhoneCall,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  ListChecks,
} from 'lucide-react';
import { GymStoreState } from '../../types/dashboard';
import { getTodayIso } from '../../utils/dateUtils';

export type DailyActionCategoryKey =
  | 'renewals'
  | 'pending_payments'
  | 'inactive_members'
  | 'follow_ups'
  | 'payment_promises';

interface AttentionSectionProps {
  state: GymStoreState;
  onSelectCategory?: (category: DailyActionCategoryKey) => void;
}

interface ConsolidatedActionRow {
  id: string;
  category: DailyActionCategoryKey;
  categoryLabel: string;
  count: number;
  urgency: 'overdue' | 'due_today' | 'upcoming';
  urgencyLabel: string;
  title: string;
  subtitle: string;
}

export const AttentionSection: React.FC<AttentionSectionProps> = ({
  state,
  onSelectCategory,
}) => {
  const [showActionList, setShowActionList] = useState(true);
  const todayIso = getTodayIso();
  const isEmptyState = Boolean(state.isEmptyState);
  const members = state.members || [];
  const paymentPromises = state.paymentPromises || [];
  const leads = state.leads || [];
  const followUpTasks = state.followUpTasks || [];

  // Compute the 4 attention metrics from live store state
  const metrics = useMemo(() => {
    if (isEmptyState) {
      return {
        expiringIn7Days: 0,
        pendingPaymentsAmount: 0,
        pendingPaymentsMembersCount: 0,
        inactiveMembersCount: 0,
        followUpsTodayCount: 0,
      };
    }

    const expiringIn7Days = members.filter(
      (m) =>
        m.status !== 'inactive' &&
        m.daysUntilExpiry !== undefined &&
        m.daysUntilExpiry >= 0 &&
        m.daysUntilExpiry <= 7
    ).length;

    const dueMembers = members.filter(
      (m) => (m.pendingAmount || 0) > 0 && m.status !== 'inactive'
    );
    const pendingPaymentsAmount = dueMembers.reduce(
      (sum, m) => sum + (m.pendingAmount || 0),
      0
    );
    const pendingPaymentsMembersCount = dueMembers.length;

    const inactiveMembersCount = members.filter(
      (m) =>
        m.status !== 'expired' &&
        m.status !== 'inactive' &&
        (m.daysUntilExpiry === undefined || m.daysUntilExpiry >= 0) &&
        m.daysSinceLastVisit !== undefined &&
        m.daysSinceLastVisit >= 7
    ).length;

    const pendingTasksDue = followUpTasks.filter(
      (t) => t.status === 'pending' && t.dueDate <= todayIso
    );
    const taskPersonIds = new Set(pendingTasksDue.map((t) => t.personId));
    const extraLeadsDue = leads.filter(
      (l) =>
        !taskPersonIds.has(l.id) &&
        l.status !== 'Converted' &&
        l.status !== 'Joined' &&
        l.status !== 'Lost' &&
        l.status !== 'Not Interested' &&
        ((l.nextFollowUpDate && l.nextFollowUpDate <= todayIso) || l.status === 'New')
    );

    const followUpsTodayCount = pendingTasksDue.length + extraLeadsDue.length;

    return {
      expiringIn7Days,
      pendingPaymentsAmount,
      pendingPaymentsMembersCount,
      inactiveMembersCount,
      followUpsTodayCount,
    };
  }, [isEmptyState, members, followUpTasks, leads, todayIso]);

  const userChallenges = state.onboarding?.challenges || [];

  const isRenewalPriority = userChallenges.some((c) =>
    c.toLowerCase().includes('expiry') || c.toLowerCase().includes('renewal')
  );
  const isPaymentPriority = userChallenges.some((c) =>
    c.toLowerCase().includes('payment') || c.toLowerCase().includes('balance')
  );
  const isInactivePriority = userChallenges.some((c) =>
    c.toLowerCase().includes('inactive') || c.toLowerCase().includes('retention')
  );
  const isAttendancePriority = userChallenges.some((c) =>
    c.toLowerCase().includes('attendance')
  );

  const rawCards = [
    {
      key: 'renewals' as const,
      title: 'Expiring in 7 Days',
      value: isEmptyState ? 0 : metrics.expiringIn7Days,
      sublabel: isEmptyState
        ? 'No expiring plans'
        : `${metrics.expiringIn7Days} ${metrics.expiringIn7Days === 1 ? 'member' : 'members'} to renew`,
      bgClass: 'bg-[#FBF3DF] border-[#F3E5C3]',
      iconBgClass: 'bg-[#F5E4BC]',
      iconColorClass: 'text-[#D97706]',
      arrowBgClass: 'bg-[#EFE0BA] text-[#5C4822]',
      Icon: Clock,
      isPriority: isRenewalPriority,
      priorityRank: isRenewalPriority ? 0 : 2,
    },
    {
      key: 'pending_payments' as const,
      title: 'Pending Payments',
      value: isEmptyState
        ? '₹0'
        : `₹${metrics.pendingPaymentsAmount.toLocaleString('en-IN')}`,
      sublabel: isEmptyState
        ? '0 members due'
        : `${metrics.pendingPaymentsMembersCount} ${
            metrics.pendingPaymentsMembersCount === 1 ? 'member' : 'members'
          } due`,
      bgClass: 'bg-[#FCEAEA] border-[#F6D3D3]',
      iconBgClass: 'bg-[#F8D7D7]',
      iconColorClass: 'text-[#DC2626]',
      arrowBgClass: 'bg-[#F0CACA] text-[#642626]',
      Icon: CreditCard,
      isPriority: isPaymentPriority,
      priorityRank: isPaymentPriority ? 0 : 1,
    },
    {
      key: 'inactive_members' as const,
      title: 'Inactive Members',
      value: isEmptyState ? 0 : metrics.inactiveMembersCount,
      sublabel: isEmptyState ? 'No inactive members' : 'No visit in 7+ days',
      bgClass: 'bg-[#F4EDFB] border-[#E7DAFA]',
      iconBgClass: 'bg-[#E9D8FA]',
      iconColorClass: 'text-[#7C3AED]',
      arrowBgClass: 'bg-[#DEC9F4] text-[#482778]',
      Icon: UserX,
      isPriority: isInactivePriority || isAttendancePriority,
      priorityRank: isInactivePriority || isAttendancePriority ? 0 : 3,
    },
    {
      key: 'follow_ups' as const,
      title: 'Follow-ups Today',
      value: isEmptyState ? 0 : metrics.followUpsTodayCount,
      sublabel: isEmptyState ? 'No follow-ups due' : 'Pending contact',
      bgClass: 'bg-[#E8F2FC] border-[#CFE3F8]',
      iconBgClass: 'bg-[#D3E5F8]',
      iconColorClass: 'text-[#2563EB]',
      arrowBgClass: 'bg-[#C4DBF4] text-[#1E3F72]',
      Icon: PhoneCall,
      isPriority: false,
      priorityRank: 4,
    },
  ];

  const cards = [...rawCards].sort((a, b) => a.priorityRank - b.priorityRank);

  // Build consolidated, urgency-sorted Daily Action List categories without duplicate tasks
  const consolidatedActions = useMemo<ConsolidatedActionRow[]>(() => {
    if (isEmptyState) return [];

    const rows: ConsolidatedActionRow[] = [];

    // 1. Overdue & Pending Payments
    const dueMembers = members.filter(
      (m) => (m.pendingAmount || 0) > 0 && m.status !== 'inactive'
    );
    if (dueMembers.length > 0) {
      const overdueMembers = dueMembers.filter(
        (m) =>
          m.status === 'pending' ||
          m.status === 'expired' ||
          (m.daysUntilExpiry !== undefined && m.daysUntilExpiry < 0)
      );
      const totalDueAmt = dueMembers.reduce((sum, m) => sum + (m.pendingAmount || 0), 0);
      const isOverdue = overdueMembers.length > 0;
      const topNames = dueMembers
        .slice(0, 2)
        .map((m) => m.name)
        .join(', ');

      rows.push({
        id: 'action-pending-payments',
        category: 'pending_payments',
        categoryLabel: 'Overdue & Pending Payments',
        count: dueMembers.length,
        urgency: isOverdue ? 'overdue' : 'due_today',
        urgencyLabel: isOverdue
          ? `${overdueMembers.length} Overdue`
          : `${dueMembers.length} Due`,
        title: `₹${totalDueAmt.toLocaleString('en-IN')} outstanding across ${dueMembers.length} ${
          dueMembers.length === 1 ? 'member' : 'members'
        }`,
        subtitle:
          dueMembers.length > 2
            ? `${topNames} +${dueMembers.length - 2} more`
            : topNames,
      });
    }

    // 2. Payment Promises Due Today or Overdue
    const actionablePromises = paymentPromises.filter(
      (p) => p.status === 'pending' && p.promisedDate <= todayIso
    );
    const upcomingPromises = paymentPromises.filter(
      (p) => p.status === 'pending' && p.promisedDate > todayIso
    );
    if (actionablePromises.length > 0 || upcomingPromises.length > 0) {
      const targetPromises =
        actionablePromises.length > 0 ? actionablePromises : upcomingPromises;
      const overduePromises = actionablePromises.filter((p) => p.promisedDate < todayIso);
      const dueTodayPromises = actionablePromises.filter((p) => p.promisedDate === todayIso);
      const promisedSum = targetPromises.reduce((s, p) => s + (p.promisedAmount || 0), 0);

      const urgency: 'overdue' | 'due_today' | 'upcoming' =
        overduePromises.length > 0
          ? 'overdue'
          : dueTodayPromises.length > 0
          ? 'due_today'
          : 'upcoming';

      const urgencyLabel =
        overduePromises.length > 0
          ? `${overduePromises.length} Overdue`
          : dueTodayPromises.length > 0
          ? `${dueTodayPromises.length} Due Today`
          : `${upcomingPromises.length} Upcoming`;

      rows.push({
        id: 'action-payment-promises',
        category: 'payment_promises',
        categoryLabel: 'Payment Promises',
        count: targetPromises.length,
        urgency,
        urgencyLabel,
        title: `₹${promisedSum.toLocaleString('en-IN')} promised by ${targetPromises.length} ${
          targetPromises.length === 1 ? 'member' : 'members'
        }`,
        subtitle: targetPromises
          .slice(0, 2)
          .map((p) => `${p.memberName} (₹${p.promisedAmount.toLocaleString('en-IN')})`)
          .join(', '),
      });
    }

    // 3. Memberships Expiring Soon (Today, within 3 days, within 7 days) or Recently Expired
    const expiringMembers = members.filter(
      (m) =>
        m.status !== 'inactive' &&
        m.daysUntilExpiry !== undefined &&
        m.daysUntilExpiry >= -7 &&
        m.daysUntilExpiry <= 7
    );
    if (expiringMembers.length > 0) {
      const expiredCount = expiringMembers.filter((m) => m.daysUntilExpiry < 0).length;
      const todayCount = expiringMembers.filter((m) => m.daysUntilExpiry === 0).length;
      const urgency: 'overdue' | 'due_today' | 'upcoming' =
        expiredCount > 0 ? 'overdue' : todayCount > 0 ? 'due_today' : 'upcoming';
      const urgencyLabel =
        expiredCount > 0
          ? `${expiredCount} Expired`
          : todayCount > 0
          ? `${todayCount} Expiring Today`
          : `Within 7 Days`;

      const topNames = expiringMembers
        .slice(0, 2)
        .map((m) => m.name)
        .join(', ');

      rows.push({
        id: 'action-renewals',
        category: 'renewals',
        categoryLabel: 'Memberships Expiring Soon',
        count: expiringMembers.length,
        urgency,
        urgencyLabel,
        title: `${expiringMembers.length} ${
          expiringMembers.length === 1 ? 'membership requires' : 'memberships require'
        } renewal reminder`,
        subtitle:
          expiringMembers.length > 2
            ? `${topNames} +${expiringMembers.length - 2} more`
            : topNames,
      });
    }

    // 4. Leads & Follow-Ups Requiring Contact (Deduplicated across followUpTasks and Leads)
    const pendingTasksDue = followUpTasks.filter(
      (t) => t.status === 'pending' && t.dueDate <= todayIso
    );
    const taskPersonIds = new Set(pendingTasksDue.map((t) => t.personId));
    const extraLeadsDue = leads.filter(
      (l) =>
        !taskPersonIds.has(l.id) &&
        l.status !== 'Converted' &&
        l.status !== 'Joined' &&
        l.status !== 'Lost' &&
        l.status !== 'Not Interested' &&
        ((l.nextFollowUpDate && l.nextFollowUpDate <= todayIso) || l.status === 'New')
    );

    const totalFollowUpCount = pendingTasksDue.length + extraLeadsDue.length;
    if (totalFollowUpCount > 0) {
      const overdueTasksCount =
        pendingTasksDue.filter((t) => t.dueDate < todayIso).length +
        extraLeadsDue.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate < todayIso).length;

      const urgency: 'overdue' | 'due_today' | 'upcoming' =
        overdueTasksCount > 0 ? 'overdue' : 'due_today';
      const urgencyLabel =
        overdueTasksCount > 0 ? `${overdueTasksCount} Overdue` : `${totalFollowUpCount} Due Today`;

      const sampleNames = [
        ...pendingTasksDue.map((t) => t.personName),
        ...extraLeadsDue.map((l) => l.name),
      ].slice(0, 2);

      rows.push({
        id: 'action-followups',
        category: 'follow_ups',
        categoryLabel: 'Leads & Follow-Ups',
        count: totalFollowUpCount,
        urgency,
        urgencyLabel,
        title: `${totalFollowUpCount} ${
          totalFollowUpCount === 1 ? 'contact requires' : 'contacts require'
        } follow-up`,
        subtitle:
          totalFollowUpCount > 2
            ? `${sampleNames.join(', ')} +${totalFollowUpCount - 2} more`
            : sampleNames.join(', '),
      });
    }

    // 5. Inactive Active Members (7+ days since last recorded attendance)
    const activeCustomerMembers = members.filter(
      (m) =>
        m.status !== 'expired' &&
        m.status !== 'inactive' &&
        (m.daysUntilExpiry === undefined || m.daysUntilExpiry >= 0) &&
        m.daysSinceLastVisit !== undefined &&
        m.daysSinceLastVisit >= 7
    );
    if (activeCustomerMembers.length > 0) {
      const over14DaysCount = activeCustomerMembers.filter(
        (m) => (m.daysSinceLastVisit || 0) >= 14
      ).length;
      const topNames = activeCustomerMembers
        .slice(0, 2)
        .map((m) => `${m.name} (${m.daysSinceLastVisit}d)`)
        .join(', ');

      rows.push({
        id: 'action-inactive',
        category: 'inactive_members',
        categoryLabel: 'Inactive Members',
        count: activeCustomerMembers.length,
        urgency: over14DaysCount > 0 ? 'due_today' : 'upcoming',
        urgencyLabel: over14DaysCount > 0 ? `${over14DaysCount} Absent 14d+` : 'Absent 7d+',
        title: `${activeCustomerMembers.length} active ${
          activeCustomerMembers.length === 1 ? 'member has' : 'members have'
        } not visited in 7+ days`,
        subtitle:
          activeCustomerMembers.length > 2
            ? `${topNames} +${activeCustomerMembers.length - 2} more`
            : topNames,
      });
    }

    const priorityMap: Record<'overdue' | 'due_today' | 'upcoming', number> = {
      overdue: 0,
      due_today: 1,
      upcoming: 2,
    };

    return rows.sort((a, b) => priorityMap[a.urgency] - priorityMap[b.urgency]);
  }, [isEmptyState, members, paymentPromises, leads, followUpTasks, todayIso]);

  return (
    <section className="w-full mt-3.5 sm:mt-4">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h2 className="text-[15px] sm:text-base font-bold text-[#191919] tracking-tight">
          Today&apos;s Attention
        </h2>
        <button
          type="button"
          onClick={() => setShowActionList(!showActionList)}
          className="flex items-center gap-1 text-[11px] font-bold text-[#102A71] hover:underline cursor-pointer"
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>
            {showActionList
              ? `Daily Action List (${consolidatedActions.length})`
              : `Show Action List (${consolidatedActions.length})`}
          </span>
        </button>
      </div>

      {/* 4 Compact Summary Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {cards.map((card) => {
          const IconComponent = card.Icon;
          return (
            <button
              type="button"
              key={card.key}
              onClick={() => onSelectCategory?.(card.key)}
              className={`${card.bgClass} rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between text-left border transition-all hover:brightness-98 active:scale-[0.99] cursor-pointer shadow-2xs`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${card.iconBgClass} flex items-center justify-center shrink-0`}
                >
                  <IconComponent
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.iconColorClass} stroke-[2.2]`}
                  />
                </div>
                {card.isPriority && (
                  <span className="text-[9px] font-bold text-[#102A71] bg-white/85 border border-[#102A71]/20 px-1.5 py-0.5 rounded-md shadow-2xs">
                    Priority
                  </span>
                )}
              </div>

              <div className="mt-2 sm:mt-2.5">
                <span className="text-[#4B5563] text-[11px] sm:text-xs font-medium block leading-tight">
                  {card.title}
                </span>

                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none">
                    {card.value}
                  </span>

                  <span
                    className={`w-5 h-5 rounded-full ${card.arrowBgClass} flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5`}
                  >
                    <ChevronRight className="w-3 h-3 stroke-[2.3]" />
                  </span>
                </div>
              </div>

              <span className="text-[10px] sm:text-[11px] text-[#6B7280] mt-1 sm:mt-1.5 block leading-none">
                {card.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feature 5: Consolidated Urgency-Sorted Daily Action List */}
      {showActionList && (
        <div className="mt-2.5 bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F2EFE8]">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-[#102A71]" />
              <span className="text-[12px] font-bold text-[#191919]">
                Daily Action List
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                Overdue
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                Due Today
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Upcoming
              </span>
            </div>
          </div>

          {consolidatedActions.length === 0 ? (
            <div className="py-3 text-center flex items-center justify-center gap-2 text-xs text-[#15803D] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>All urgent daily actions are clear for today!</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {consolidatedActions.map((item) => {
                const badgeClass =
                  item.urgency === 'overdue'
                    ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]'
                    : item.urgency === 'due_today'
                    ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                    : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onSelectCategory?.(item.category)}
                    className="w-full p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#EAE5DC] flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11.5px] font-bold text-[#191919] group-hover:text-[#102A71] transition-colors">
                          {item.categoryLabel}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold border leading-tight ${badgeClass}`}
                        >
                          {item.urgencyLabel}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-[#4B5563] mt-0.5 truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[10px] text-[#71717A] truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-[#EAE5DC] text-[11px] font-bold text-[#102A71]">
                        {item.count}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#102A71]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
