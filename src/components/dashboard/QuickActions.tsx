/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserPlus, QrCode, Receipt } from 'lucide-react';

interface QuickActionsProps {
  onAddMember: () => void;
  onTakeAttendance: () => void;
  onRecordPayment: () => void;
  onAddExpense: () => void;
  onSeeAllActions: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddMember,
  onTakeAttendance,
  onRecordPayment,
  onAddExpense,
  onSeeAllActions,
}) => {
  return (
    <section className="w-full mt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <h2 className="text-[16px] sm:text-[17px] font-bold text-[#191919] tracking-tight">
          Quick Actions
        </h2>
        <button
          onClick={onSeeAllActions}
          className="text-[11.5px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
        >
          See All
        </button>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        
        {/* 1. Add Member */}
        <button
          onClick={onAddMember}
          className="flex flex-col items-center group cursor-pointer focus:outline-hidden"
          aria-label="Add new member"
        >
          <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-xl bg-[#1E3A8A] hover:bg-[#163073] active:scale-95 transition-all duration-150 flex items-center justify-center text-white shadow-2xs">
            <UserPlus className="w-4.5 h-4.5 transition-transform group-hover:scale-105" />
          </div>
          <span className="text-[10.5px] sm:text-[11px] font-medium text-[#191919] mt-1 text-center group-hover:text-[#1E3A8A] transition-colors leading-tight">
            Add Member
          </span>
        </button>

        {/* 2. Attendance */}
        <button
          onClick={onTakeAttendance}
          className="flex flex-col items-center group cursor-pointer focus:outline-hidden"
          aria-label="Mark attendance or scan QR"
        >
          <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-xl bg-[#FF7418] hover:bg-[#E8640C] active:scale-95 transition-all duration-150 flex items-center justify-center text-white shadow-2xs">
            <QrCode className="w-4.5 h-4.5 transition-transform group-hover:scale-105" />
          </div>
          <span className="text-[10.5px] sm:text-[11px] font-medium text-[#191919] mt-1 text-center group-hover:text-[#FF7418] transition-colors leading-tight">
            Attendance
          </span>
        </button>

        {/* 3. Record Payment */}
        <button
          onClick={onRecordPayment}
          className="flex flex-col items-center group cursor-pointer focus:outline-hidden"
          aria-label="Record member payment"
        >
          <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-xl bg-[#10B981] hover:bg-[#0D9A6B] active:scale-95 transition-all duration-150 flex items-center justify-center text-white shadow-2xs">
            <span className="text-[18px] font-bold leading-none select-none transition-transform group-hover:scale-105">
              ₹
            </span>
          </div>
          <span className="text-[10.5px] sm:text-[11px] font-medium text-[#191919] mt-1 text-center group-hover:text-[#10B981] transition-colors leading-tight">
            Payment
          </span>
        </button>

        {/* 4. Add Expense */}
        <button
          onClick={onAddExpense}
          className="flex flex-col items-center group cursor-pointer focus:outline-hidden"
          aria-label="Add gym expense"
        >
          <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-xl bg-[#8B5CF6] hover:bg-[#7747EE] active:scale-95 transition-all duration-150 flex items-center justify-center text-white shadow-2xs">
            <Receipt className="w-4.5 h-4.5 transition-transform group-hover:scale-105" />
          </div>
          <span className="text-[10.5px] sm:text-[11px] font-medium text-[#191919] mt-1 text-center group-hover:text-[#8B5CF6] transition-colors leading-tight">
            Expense
          </span>
        </button>

      </div>
    </section>
  );
};
