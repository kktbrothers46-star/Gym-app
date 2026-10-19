/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';

export interface PlanFilterOptions {
  status: 'all' | 'active' | 'inactive';
  classification: 'all' | 'popular' | 'custom' | 'standard';
  priceRange: 'all' | 'under_3000' | '3000_to_8000' | 'above_8000';
  durationRange: 'all' | 'short' | 'quarterly' | 'long';
}

interface PlanFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PlanFilterOptions;
  onApply: (filters: PlanFilterOptions) => void;
  onReset: () => void;
}

export const PlanFilterModal: React.FC<PlanFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<PlanFilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetVal: PlanFilterOptions = {
      status: 'all',
      classification: 'all',
      priceRange: 'all',
      durationRange: 'all',
    };
    setLocalFilters(resetVal);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191919] leading-tight">
                Filter Membership Plans
              </h3>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                Refine packages by status, popularity, price or duration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
            aria-label="Close filter panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Sections */}
        <div className="mt-3 space-y-3">
          {/* 1. Plan Status */}
          <div>
            <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
              Plan Availability Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'All Plans' },
                { id: 'active', label: 'Active Only' },
                { id: 'inactive', label: 'Inactive Only' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() =>
                    setLocalFilters((prev) => ({ ...prev, status: opt.id as any }))
                  }
                  className={`py-1.5 px-2 rounded-xl border text-[11.5px] font-semibold transition-all cursor-pointer ${
                    localFilters.status === opt.id
                      ? 'bg-[#102A71] text-white border-[#102A71] shadow-2xs'
                      : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Plan Classification */}
          <div>
            <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
              Plan Classification
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'popular', label: 'Popular Plans' },
                { id: 'custom', label: 'Custom Duration' },
                { id: 'standard', label: 'Standard Duration' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      classification: opt.id as any,
                    }))
                  }
                  className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                    localFilters.classification === opt.id
                      ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                      : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {localFilters.classification === opt.id && (
                    <Check className="w-3.5 h-3.5 text-[#102A71]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Price Range */}
          <div>
            <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
              Fee Range (₹ INR)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'Any Price' },
                { id: 'under_3000', label: 'Under ₹3,000' },
                { id: '3000_to_8000', label: '₹3,000 – ₹8,000' },
                { id: 'above_8000', label: 'Above ₹8,000' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() =>
                    setLocalFilters((prev) => ({ ...prev, priceRange: opt.id as any }))
                  }
                  className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                    localFilters.priceRange === opt.id
                      ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                      : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {localFilters.priceRange === opt.id && (
                    <Check className="w-3.5 h-3.5 text-[#102A71]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Duration Range */}
          <div>
            <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
              Validity Duration
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All Durations' },
                { id: 'short', label: 'Up to 45 Days' },
                { id: 'quarterly', label: '2 to 4 Months' },
                { id: 'long', label: '6+ Months / Annual' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      durationRange: opt.id as any,
                    }))
                  }
                  className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                    localFilters.durationRange === opt.id
                      ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                      : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {localFilters.durationRange === opt.id && (
                    <Check className="w-3.5 h-3.5 text-[#102A71]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-4 pt-2.5 border-t border-[#F2EFE8] flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2 px-4 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
