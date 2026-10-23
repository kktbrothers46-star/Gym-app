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
  onAddMember: () => void;
  onRecordPayment: () => void;
  onRenewMembership: () => void;
  onAddExpense: () => void;
  onOpenImportMembers?: () => void;
  onOpenDailyCollection?: () => void;
  onOpenPaymentPromises?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddMember,
  onRecordPayment,
  onRenewMembership,
  onAddExpense,
  onOpenImportMembers,
  onOpenDailyCollection,
  onOpenPaymentPromises,
}) => {
  const actions = [
    {
      label: 'Add Member',
      icon: UserPlus,
      onClick: onAddMember,
    },
    {
      label: 'Record Payment',
      icon: CreditCard,
      onClick: onRecordPayment,
    },
    {
      label: 'Renew Membership',
      icon: RefreshCw,
      onClick: onRenewMembership,
    },
    {
      label: 'Add Expense',
      icon: Receipt,
      onClick: onAddExpense,
    },
  ];

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
              className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#EAE5DC] text-[10.5px] sm:text-[11px] font-semibold text-[#191919] flex items-center justify-center gap-1 cursor-pointer shadow-2xs truncate"
            >
              <Upload className="w-3 h-3 text-[#102A71] shrink-0" />
              <span className="truncate">Import CSV/XLSX</span>
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
