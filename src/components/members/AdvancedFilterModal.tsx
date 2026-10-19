/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';

export interface AdvancedFilterOptions {
  status: string; // 'all' | 'active' | 'expiring' | 'expired' | 'pending' | 'inactive'
  paymentStatus: string; // 'all' | 'paid' | 'pending'
  plan: string; // 'all' | 'Monthly' | '3 Months' | '6 Months' | 'Annual'
  attendance: string; // 'all' | 'active_recent' | 'absent_7' | 'absent_14'
  gender: string; // 'all' | 'Male' | 'Female'
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilterOptions;
  onApply: (filters: AdvancedFilterOptions) => void;
  onReset: () => void;
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<AdvancedFilterOptions>(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: AdvancedFilterOptions = {
      status: 'all',
      paymentStatus: 'all',
      plan: 'all',
      attendance: 'all',
      gender: 'all',
    };
    setLocalFilters(defaultFilters);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom duration-200 max-h-[88vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center">
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#191919] leading-tight">
                Advanced Filters
              </h3>
              <p className="text-xs text-[#71717A]">
                Filter members by status, plan, & dues
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

        {/* Filter Sections */}
        <div className="mt-4 space-y-4">
          
          {/* 1. Membership Status */}
          <div>
            <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-2">
              Membership Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: '🟢 Active' },
                { id: 'expiring', label: '🟡 Expiring' },
                { id: 'expired', label: '🔴 Expired' },
                { id: 'pending', label: '🟠 Pending' },
                { id: 'inactive', label: '⚪ Inactive' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalFilters({ ...localFilters, status: opt.id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    localFilters.status === opt.id
                      ? 'bg-[#1E3A8A] text-white shadow-2xs'
                      : 'bg-[#F4F1EA] text-[#71717A] hover:text-[#191919]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Payment Status */}
          <div>
            <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Any' },
                { id: 'paid', label: 'Fully Paid' },
                { id: 'pending', label: 'Has Dues' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalFilters({ ...localFilters, paymentStatus: opt.id })}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    localFilters.paymentStatus === opt.id
                      ? 'bg-[#1E3A8A] text-white shadow-2xs'
                      : 'bg-[#F4F1EA] text-[#71717A] hover:text-[#191919]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Membership Plan */}
          <div>
            <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-2">
              Membership Plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All Plans' },
                { id: 'Monthly', label: 'Monthly' },
                { id: '3 Months', label: '3 Months' },
                { id: '6 Months', label: '6 Months' },
                { id: 'Annual', label: 'Annual Pro' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalFilters({ ...localFilters, plan: opt.id })}
                  className={`py-2 px-3 text-left rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    localFilters.plan === opt.id
                      ? 'bg-[#1E3A8A] text-white shadow-2xs'
                      : 'bg-[#F4F1EA] text-[#71717A] hover:text-[#191919]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Attendance Inactivity */}
          <div>
            <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-2">
              Attendance Activity
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Any Activity' },
                { id: 'absent_7', label: 'Absent > 7 days' },
                { id: 'absent_14', label: 'Absent > 14 days' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalFilters({ ...localFilters, attendance: opt.id })}
                  className={`py-2 px-3 text-left rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    localFilters.attendance === opt.id
                      ? 'bg-[#1E3A8A] text-white shadow-2xs'
                      : 'bg-[#F4F1EA] text-[#71717A] hover:text-[#191919]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Gender */}
          <div>
            <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-2">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'Male', label: 'Male' },
                { id: 'Female', label: 'Female' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalFilters({ ...localFilters, gender: opt.id })}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    localFilters.gender === opt.id
                      ? 'bg-[#1E3A8A] text-white shadow-2xs'
                      : 'bg-[#F4F1EA] text-[#71717A] hover:text-[#191919]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2.5 pt-5 border-t border-[#F2EFE8] mt-5">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 bg-[#FAF8F5] border border-[#E5E0D6] hover:bg-[#F2EFE8] text-[#191919] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 bg-[#1E3A8A] hover:bg-[#163073] active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>

      </div>
    </div>
  );
};
