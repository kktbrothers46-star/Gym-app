/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign, PieChart } from 'lucide-react';
import { GymStoreState, Expense } from '../../types/dashboard';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GymStoreState;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  if (!isOpen) return null;

  const totalRevenue = state.collectedThisMonth;
  const totalExpenses = (state.expenses || []).reduce((acc: number, curr: Expense) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-xs">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#191919] leading-tight">
                Operating Profit & Loss
              </h3>
              <p className="text-xs text-[#71717A]">
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Financial Performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Profit Hero */}
        <div className="mt-4 p-4 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider block">
              Net Operating Profit
            </span>
            <div className="text-3xl font-extrabold text-[#191919] mt-0.5">
              ₹{netProfit.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-[#15803D] font-medium mt-1 inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {profitMargin}% Operating Margin
            </span>
          </div>
        </div>

        {/* Breakdown comparison */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold">
              <ArrowDownRight className="w-4 h-4" />
              <span>Collected Revenue</span>
            </div>
            <div className="text-xl font-bold text-[#191919] mt-1">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-[#71717A] mt-0.5">
              From {state.activeMembersCount} active members
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <div className="flex items-center gap-1.5 text-xs text-[#EF4444] font-semibold">
              <ArrowUpRight className="w-4 h-4" />
              <span>Total Expenses</span>
            </div>
            <div className="text-xl font-bold text-[#191919] mt-1">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-[#71717A] mt-0.5">
              Rent, Salaries, Utilities
            </div>
          </div>
        </div>

        {/* Expenses Line Items */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-[#191919] uppercase tracking-wider mb-2">
            Recorded Expenses Breakdown
          </h4>
          <div className="space-y-2">
            {(state.expenses || []).map((exp: Expense) => (
              <div
                key={exp.id}
                className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-[#191919]">{exp.title}</div>
                  <div className="text-[#71717A] text-[11px]">{exp.category} · {exp.month}</div>
                </div>
                <div className="font-bold text-[#EF4444]">
                  -₹{exp.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl text-xs text-[#1E3A8A]">
          <strong>Note:</strong> Pending dues of ₹{state.pendingPaymentsTotal.toLocaleString('en-IN')} are not counted as revenue until collected in cash or UPI.
        </div>
      </div>
    </div>
  );
};
