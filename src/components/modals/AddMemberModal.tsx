/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Member, MembershipPlan } from '../../types/dashboard';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  plans?: MembershipPlan[];
  initialPlanName?: string;
  initialFeeAmount?: number;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  plans = [],
  initialPlanName,
  initialFeeAmount,
}) => {
  const activePlans = plans.filter((p) => p.status === 'active');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState(
    initialPlanName || activePlans[0]?.name || 'Monthly Plan'
  );
  const [feeAmount, setFeeAmount] = useState(
    initialFeeAmount
      ? String(initialFeeAmount)
      : activePlans[0]
      ? String(activePlans[0].price)
      : '2000'
  );
  const [isPaid, setIsPaid] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialPlanName) {
        setPlan(initialPlanName);
        if (initialFeeAmount) setFeeAmount(String(initialFeeAmount));
      } else if (activePlans.length > 0 && !activePlans.some((p) => p.name === plan)) {
        setPlan(activePlans[0].name);
        setFeeAmount(String(activePlans[0].price));
      }
    }
  }, [isOpen, initialPlanName, initialFeeAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const parsedFee = parseFloat(feeAmount) || 0;
    const matchedPlan = activePlans.find((p) => p.name === plan);
    const daysToAdd = matchedPlan
      ? matchedPlan.durationDays
      : plan.includes('Monthly')
      ? 30
      : plan.includes('3 Months') || plan.includes('Quarterly')
      ? 90
      : plan.includes('6 Months') || plan.includes('Half-Yearly')
      ? 180
      : 365;

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + daysToAdd);

    onAddMember({
      name: name.trim(),
      phone: phone.trim(),
      status: 'active',
      membershipPlan: plan,
      planFee: `₹${parsedFee.toLocaleString('en-IN')}`,
      startDate: now.toISOString().split('T')[0],
      expiryDate: expiry.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      daysUntilExpiry: daysToAdd,
      pendingAmount: isPaid ? 0 : parsedFee,
      lastVisitDate: 'Today',
      daysSinceLastVisit: 0,
    });

    onClose();
    setName('');
    setPhone('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191919] leading-tight">
                Add New Member
              </h3>
              <p className="text-[11px] text-[#71717A] leading-none mt-0.5">
                Register member and allocate membership plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Member Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Mobile Number (India) *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Membership Plan
            </label>
            <select
              value={plan}
              onChange={(e) => {
                const chosen = e.target.value;
                setPlan(chosen);
                const found = activePlans.find((p) => p.name === chosen);
                if (found) {
                  setFeeAmount(String(found.price));
                }
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
            >
              {activePlans.length > 0 ? (
                activePlans.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.durationDays} Days - ₹{p.price.toLocaleString('en-IN')})
                  </option>
                ))
              ) : (
                <>
                  <option value="Monthly Plan">Monthly Plan (30 Days - ₹2,000)</option>
                  <option value="3 Months Plan">3 Months Plan (90 Days - ₹5,500)</option>
                  <option value="6 Months Plan">6 Months Plan (180 Days - ₹10,000)</option>
                  <option value="Annual Plan">Annual Plan (365 Days - ₹14,000)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Plan Fee (₹ INR)
            </label>
            <input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
            />
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="isPaidCheck"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-4 h-4 text-[#1E3A8A] rounded-md border-gray-300 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isPaidCheck" className="text-[11.5px] font-medium text-[#191919] cursor-pointer">
              Fee collected today (if unchecked, marks as Pending)
            </label>
          </div>

          {/* Submit */}
          <div className="pt-1.5">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#163073] active:scale-98 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Enroll Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
