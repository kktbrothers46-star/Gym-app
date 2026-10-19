/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Calendar, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { GymStoreState } from '../../types/dashboard';

interface AttentionSectionProps {
  state: GymStoreState;
  onFilterMembers: (filter: 'overdue' | 'expiring' | 'inactive') => void;
  onSeeAllAttention: () => void;
}

export const AttentionSection: React.FC<AttentionSectionProps> = ({
  state,
  onFilterMembers,
  onSeeAllAttention,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const hasAnyAttention =
    state.overdueCount > 0 || state.expiringSoonCount > 0 || state.inactiveCount > 0;

  return (
    <section className="w-full mt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <h2 className="text-[16px] sm:text-[17px] font-bold text-[#191919] tracking-tight">
          Needs Your Attention
        </h2>
        <button
          onClick={onSeeAllAttention}
          className="text-[11.5px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
        >
          See All
        </button>
      </div>

      {state.isEmptyState || !hasAnyAttention ? (
        <div className="bg-white rounded-xl border border-[#EAE5DC] p-3 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mb-1">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-bold text-[#191919] text-xs">All caught up!</h3>
          <p className="text-[10.5px] text-[#71717A] mt-0.5">
            No overdue payments, expiring plans, or inactive members requiring attention today.
          </p>
        </div>
      ) : (
        /* 3 Attention Cards in a responsive horizontal flex / grid */
        <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          
          {/* 1. Overdue Payments */}
          <div
            onClick={() => onFilterMembers('overdue')}
            className="flex-1 min-w-[175px] sm:min-w-[190px] snap-start bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-2 sm:p-2.5 hover:shadow-2xs hover:border-[#FCA5A5] transition-all cursor-pointer group flex items-center gap-2"
            role="button"
            tabIndex={0}
            aria-label={`${state.overdueCount} Overdue Payments totalling ${formatCurrency(state.overdueTotal)}`}
          >
            {/* Red alert icon circle */}
            <div className="w-7 h-7 rounded-md bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-[14px] font-bold text-[#191919] leading-none">
                  {state.overdueCount}
                </span>
                <span className="text-[11px] font-semibold text-[#191919] truncate">
                  Overdue
                </span>
                <ChevronRight className="w-3 h-3 text-[#EF4444] ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-[#71717A] mt-0.5 font-medium leading-none truncate">
                Total: {formatCurrency(state.overdueTotal)}
              </p>
            </div>
          </div>

          {/* 2. Expiring Soon */}
          <div
            onClick={() => onFilterMembers('expiring')}
            className="flex-1 min-w-[175px] sm:min-w-[190px] snap-start bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-2 sm:p-2.5 hover:shadow-2xs hover:border-[#FCD34D] transition-all cursor-pointer group flex items-center gap-2"
            role="button"
            tabIndex={0}
            aria-label={`${state.expiringSoonCount} Memberships Expiring Soon`}
          >
            {/* Amber calendar icon circle */}
            <div className="w-7 h-7 rounded-md bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-[14px] font-bold text-[#191919] leading-none">
                  {state.expiringSoonCount}
                </span>
                <span className="text-[11px] font-semibold text-[#191919] truncate">
                  Expiring
                </span>
                <ChevronRight className="w-3 h-3 text-[#D97706] ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-[#71717A] mt-0.5 font-medium leading-none truncate">
                Within 7 days
              </p>
            </div>
          </div>

          {/* 3. Inactive Members */}
          <div
            onClick={() => onFilterMembers('inactive')}
            className="flex-1 min-w-[175px] sm:min-w-[190px] snap-start bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-2 sm:p-2.5 hover:shadow-2xs hover:border-[#A5B4FC] transition-all cursor-pointer group flex items-center gap-2"
            role="button"
            tabIndex={0}
            aria-label={`${state.inactiveCount} Inactive Members`}
          >
            {/* Blue users icon circle */}
            <div className="w-7 h-7 rounded-md bg-[#E0E7FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-[14px] font-bold text-[#191919] leading-none">
                  {state.inactiveCount}
                </span>
                <span className="text-[11px] font-semibold text-[#191919] truncate">
                  Inactive
                </span>
                <ChevronRight className="w-3 h-3 text-[#3B82F6] ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-[#71717A] mt-0.5 font-medium leading-none truncate">
                14+ days absent
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
