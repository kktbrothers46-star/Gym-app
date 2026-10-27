/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  UserPlus,
  CreditCard,
  RefreshCw,
  Receipt,
  Upload,
  CalendarClock,
  IndianRupee,
} from 'lucide-react';

interface QuickActionsProps {
  challenges?: string[];
  managementMethod?: string;
  onAddMember: () => void;
  onRecordPayment: () => void;
  onRenewMembership: () => void;
  onAddExpense: () => void;
  onOpenImportMembers?: () => void;
  onOpenDailyCollection?: () => void;
  onOpenPaymentPromises?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  challenges = [],
  managementMethod = '',
  onAddMember,
  onRecordPayment,
  onRenewMembership,
  onAddExpense,
  onOpenImportMembers,
  onOpenDailyCollection,
  onOpenPaymentPromises,
}) => {
  // Determine dynamic priority based on Question 5 (Management Challenges)
  const isRenewalsPriority = challenges.some((c) =>
    c.toLowerCase().includes('expiry') || c.toLowerCase().includes('renewal')
  );
  const isPaymentsPriority = challenges.some((c) =>
    c.toLowerCase().includes('payment') || c.toLowerCase().includes('balance')
  );
  const isFinancePriority = challenges.some((c) =>
    c.toLowerCase().includes('income') || c.toLowerCase().includes('expense')
  );

  const baseActions = [
    {
      id: 'member',
      label: 'Add Member',
      icon: UserPlus,
      onClick: onAddMember,
      priority: 2,
    },
    {
      id: 'payment',
      label: 'Record Payment',
      icon: CreditCard,
      onClick: onRecordPayment,
      priority: isPaymentsPriority ? 0 : 1,
    },
    {
      id: 'renewal',
      label: 'Renew Membership',
      icon: RefreshCw,
      onClick: onRenewMembership,
      priority: isRenewalsPriority ? 0 : 3,
    },
    {
      id: 'expense',
      label: 'Add Expense',
      icon: Receipt,
      onClick: onAddExpense,
      priority: isFinancePriority ? 1 : 4,
    },
  ];

  const actions = [...baseActions].sort((a, b) => a.priority - b.priority);

  return (
    <section className="w-full mt-3.5 sm:mt-4">
      <div className="mb-2 px-0.5 flex items-center justify-between">
        <h2 className="text-[15px] sm:text-base font-bold text-[#191919] tracking-tight">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              type="button"
              key={index}
              onClick={action.onClick}
              className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 border border-[#EAE5DC] shadow-2xs hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EBF1FA] flex items-center justify-center shrink-0">
                <IconComponent className="w-4 h-4 text-[#1E3A8A] stroke-[2.2]" />
              </div>
              <span className="text-[12.5px] sm:text-[13px] font-bold text-[#191919] leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Compact Utility Shortcuts for Member Import, Daily Collection & Payment Promises */}
      {(onOpenImportMembers || onOpenDailyCollection || onOpenPaymentPromises) && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {onOpenImportMembers && (
            <button
              type="button"
              onClick={onOpenImportMembers}
              className={`py-1.5 px-2 rounded-xl border text-[10.5px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-2xs truncate transition-all ${
                managementMethod.toLowerCase().includes('excel') ||
                managementMethod.toLowerCase().includes('spreadsheet')
                  ? 'bg-[#EEF2FF] hover:bg-[#E0E7FF] border-[#93C5FD] text-[#102A71] font-bold ring-1 ring-[#102A71]/15'
                  : 'bg-white hover:bg-[#FAF8F5] border-[#EAE5DC] text-[#191919]'
              }`}
            >
              <Upload className="w-3 h-3 text-[#102A71] shrink-0" />
              <span className="truncate">
                {managementMethod.toLowerCase().includes('excel')
                  ? 'Import Excel/CSV ★'
                  : 'Import CSV/XLSX'}
              </span>
            </button>
          )}
          {onOpenDailyCollection && (
            <button
              type="button"
              onClick={onOpenDailyCollection}
              className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#EAE5DC] text-[10.5px] sm:text-[11px] font-semibold text-[#191919] flex items-center justify-center gap-1 cursor-pointer shadow-2xs truncate"
            >
              <IndianRupee className="w-3 h-3 text-[#16A34A] shrink-0" />
              <span className="truncate">Daily Collection</span>
            </button>
          )}
          {onOpenPaymentPromises && (
            <button
              type="button"
              onClick={onOpenPaymentPromises}
              className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#EAE5DC] text-[10.5px] sm:text-[11px] font-semibold text-[#191919] flex items-center justify-center gap-1 cursor-pointer shadow-2xs truncate"
            >
              <CalendarClock className="w-3 h-3 text-[#D97706] shrink-0" />
              <span className="truncate">Payment Promises</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};
