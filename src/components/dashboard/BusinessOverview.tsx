/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  IndianRupee,
  Wallet,
  BarChart3,
  ChevronRight,
  TrendingUp,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { GymStoreState } from '../../types/dashboard';

interface BusinessOverviewProps {
  state: GymStoreState;
  onOpenMembers: (filter?: string) => void;
  onOpenPayments: () => void;
  onOpenProfitReport: () => void;
}

export const BusinessOverview: React.FC<BusinessOverviewProps> = ({
  state,
  onOpenMembers,
  onOpenPayments,
  onOpenProfitReport,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(
    () => state.selectedMonth || new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  );
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const months = React.useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
    }
    return list;
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const activeSharePct =
    state.totalMembersCount > 0
      ? Math.round((state.activeMembersCount / state.totalMembersCount) * 100)
      : null;

  const prevMonthMetric =
    state.monthlyMetrics && state.monthlyMetrics.length >= 2
      ? state.monthlyMetrics[state.monthlyMetrics.length - 2]
      : null;

  const revenueDeltaPct =
    prevMonthMetric && prevMonthMetric.revenue > 0
      ? Math.round(
          ((state.collectedThisMonth - prevMonthMetric.revenue) / prevMonthMetric.revenue) * 100
        )
      : null;

  const membersDeltaPct =
    prevMonthMetric && prevMonthMetric.members > 0
      ? Math.round(
          ((state.totalMembersCount - prevMonthMetric.members) / prevMonthMetric.members) * 100
        )
      : null;

  return (
    <section className="w-full mt-3">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <h2 className="text-[16px] sm:text-[17px] font-bold text-[#191919] tracking-tight">
          Business Overview
        </h2>

        {/* Month Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#E5E0D6] text-[10.5px] font-semibold text-[#191919] shadow-2xs hover:bg-[#FAF8F5] transition-colors"
            aria-expanded={isMonthPickerOpen}
          >
            <Calendar className="w-3 h-3 text-[#71717A]" />
            <span>{selectedMonth}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isMonthPickerOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#E5E0D6] py-1 z-30">
              {months.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedMonth(m);
                    setIsMonthPickerOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-[#F4F1EA] transition-colors flex items-center justify-between ${
                    selectedMonth === m ? 'text-[#1E3A8A] font-bold bg-[#F4F1EA]' : 'text-[#191919]'
                  }`}
                >
                  <span>{m}</span>
                  {selectedMonth === m && <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2x2 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        
        {/* CARD 1: Active Members */}
        <div
          onClick={() => onOpenMembers('active')}
          className="relative bg-[#F4F7FF] border border-[#DCE4FA] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-xs hover:border-[#BFD0F8] transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label={`Active Members: ${state.activeMembersCount}`}
        >
          <div>
            {/* Top row: Icon */}
            <div className="w-7 h-7 rounded-md bg-[#E0E7FF] flex items-center justify-center text-[#3730A3] mb-1">
              <Users className="w-3.5 h-3.5" />
            </div>

            {/* Label */}
            <span className="text-[#71717A] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
              Active Members
            </span>

            {/* Metric Value */}
            <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-1">
              {state.isEmptyState ? '0' : state.activeMembersCount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Footer: Trend Delta + Chevron */}
          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#E8EEFC]">
            <div className="flex items-center gap-1 text-[10px]">
              {state.isEmptyState || state.totalMembersCount === 0 ? (
                <span className="text-[#71717A] font-medium">No members yet</span>
              ) : (
                <>
                  <span className="text-[#22C55E] font-semibold flex items-center">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    {activeSharePct}%
                  </span>
                  <span className="text-[#71717A] hidden sm:inline">active rate</span>
                </>
              )}
            </div>

            <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center text-[#71717A] border border-[#DCE4FA] group-hover:text-[#1E3A8A] group-hover:border-[#1E3A8A] transition-colors">
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* CARD 2: Collected This Month */}
        <div
          onClick={onOpenPayments}
          className="relative bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-xs hover:border-[#BBF7D0] transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label={`Collected This Month: ${formatCurrency(state.collectedThisMonth)}`}
        >
          <div>
            {/* Top row: Icon */}
            <div className="w-7 h-7 rounded-md bg-[#DCFCE7] flex items-center justify-center text-[#15803D] mb-1">
              <span className="text-[14px] font-bold leading-none">₹</span>
            </div>

            {/* Label */}
            <span className="text-[#71717A] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
              Collected This Month
            </span>

            {/* Metric Value */}
            <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-1">
              {state.isEmptyState ? '₹0' : formatCurrency(state.collectedThisMonth)}
            </div>
          </div>

          {/* Footer: Trend Delta + Chevron */}
          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#E2FBE9]">
            <div className="flex items-center gap-1 text-[10px]">
              {state.isEmptyState || state.collectedThisMonth === 0 ? (
                <span className="text-[#71717A] font-medium">No collections yet</span>
              ) : revenueDeltaPct !== null ? (
                <>
                  <span className="text-[#22C55E] font-semibold flex items-center">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    {revenueDeltaPct >= 0 ? `+${revenueDeltaPct}%` : `${revenueDeltaPct}%`}
                  </span>
                  <span className="text-[#71717A] hidden sm:inline">vs last month</span>
                </>
              ) : (
                <span className="text-[#15803D] font-semibold">
                  {state.payments.filter((p) => p.status !== 'refunded' && p.amount > 0).length} collected
                </span>
              )}
            </div>

            <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center text-[#71717A] border border-[#DCFCE7] group-hover:text-[#15803D] group-hover:border-[#15803D] transition-colors">
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* CARD 3: Pending Payments */}
        <div
          onClick={() => onOpenMembers('overdue')}
          className="relative bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-xs hover:border-[#FDE68A] transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label={`Pending Payments: ${formatCurrency(state.pendingPaymentsTotal)}`}
        >
          <div>
            {/* Top row: Icon */}
            <div className="w-7 h-7 rounded-md bg-[#FEF3C7] flex items-center justify-center text-[#B45309] mb-1">
              <Wallet className="w-3.5 h-3.5" />
            </div>

            {/* Label */}
            <span className="text-[#71717A] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
              Pending Payments
            </span>

            {/* Metric Value */}
            <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-1">
              {state.isEmptyState ? '₹0' : formatCurrency(state.pendingPaymentsTotal)}
            </div>
          </div>

          {/* Footer: Trend Delta + Chevron */}
          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#FDF3D0]">
            <div className="flex items-center gap-1 text-[10px]">
              {state.isEmptyState || state.pendingPaymentsTotal === 0 ? (
                <span className="text-[#22C55E] font-semibold">All dues cleared</span>
              ) : (
                <span className="text-[#EF4444] font-semibold">
                  {state.overdueCount} member{state.overdueCount === 1 ? '' : 's'} due
                </span>
              )}
            </div>

            <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center text-[#71717A] border border-[#FEF3C7] group-hover:text-[#B45309] group-hover:border-[#B45309] transition-colors">
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* CARD 4: Total Members */}
        <div
          onClick={() => onOpenMembers('all')}
          className="relative bg-[#FAF5FF] border border-[#F3E8FF] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-xs hover:border-[#E9D5FF] transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label={`Total Members: ${state.totalMembersCount}`}
        >
          <div>
            {/* Top row: Icon */}
            <div className="w-7 h-7 rounded-md bg-[#F3E8FF] flex items-center justify-center text-[#7E22CE] mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>

            {/* Label */}
            <span className="text-[#71717A] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
              Total Members
            </span>

            {/* Metric Value */}
            <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-1">
              {state.isEmptyState ? '0' : state.totalMembersCount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Footer: Trend Delta + Chevron */}
          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#F5E9FF]">
            <div className="flex items-center gap-1 text-[10px]">
              {state.isEmptyState || state.totalMembersCount === 0 ? (
                <span className="text-[#71717A] font-medium">No members yet</span>
              ) : membersDeltaPct !== null ? (
                <>
                  <span className="text-[#22C55E] font-semibold flex items-center">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    {membersDeltaPct >= 0 ? `+${membersDeltaPct}%` : `${membersDeltaPct}%`}
                  </span>
                  <span className="text-[#71717A] hidden sm:inline">vs last month</span>
                </>
              ) : (
                <span className="text-[#7E22CE] font-semibold">
                  {state.activeMembersCount} active
                </span>
              )}
            </div>

            <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center text-[#71717A] border border-[#F3E8FF] group-hover:text-[#7E22CE] group-hover:border-[#7E22CE] transition-colors">
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
