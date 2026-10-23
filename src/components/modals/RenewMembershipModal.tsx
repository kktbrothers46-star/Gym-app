/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  User,
} from 'lucide-react';
import { Member, MembershipPlan } from '../../types/dashboard';

interface RenewMembershipModalProps {
  member: Member | null;
  members?: Member[];
  isOpen: boolean;
  onClose: () => void;
  plans?: MembershipPlan[];
  onConfirmRenewal: (
    memberId: string,
    data: {
      membershipPlan: string;
      planFee: string;
      monthsToAdd: number;
      daysToAdd?: number;
      planPrice?: number;
      paymentAmount: number;
      paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    }
  ) => void;
}

const DEFAULT_RENEWAL_PLANS = [
  { name: 'Monthly Plan', months: 1, days: 30, fee: '₹2,000', amount: 2000, isCustom: false },
  { name: '3 Months Plan', months: 3, days: 90, fee: '₹5,500', amount: 5500, isCustom: false },
  { name: '6 Months Plan', months: 6, days: 180, fee: '₹10,000', amount: 10000, isCustom: false },
  { name: 'Annual Plan', months: 12, days: 365, fee: '₹14,000', amount: 14000, isCustom: false },
];

export const RenewMembershipModal: React.FC<RenewMembershipModalProps> = ({
  member,
  members = [],
  isOpen,
  onClose,
  plans = [],
  onConfirmRenewal,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial' | 'pending'>('full');
  const [partialAmountInput, setPartialAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>('UPI');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort members by earliest expiry so expired/expiring members appear at top of selector
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [members]);

  const activePlans = useMemo(() => plans.filter((p) => p.status === 'active'), [plans]);
  const renewalOptions = useMemo(() => {
    return activePlans.length > 0
      ? activePlans.map((p) => ({
          name: p.name,
          months:
            p.durationUnit === 'months'
              ? p.durationValue
              : Math.max(1, Math.round(p.durationDays / 30)),
          days: p.durationDays,
          fee: `₹${p.price.toLocaleString('en-IN')}`,
          amount: p.price,
          isCustom: p.isCustom || p.durationUnit === 'days',
        }))
      : DEFAULT_RENEWAL_PLANS;
  }, [activePlans]);

  // Sync selected member and matching plan when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setErrorMsg(null);
      return;
    }

    const targetMember =
      member ||
      sortedMembers.find((m) => m.daysUntilExpiry <= 30) ||
      sortedMembers[0] ||
      null;

    if (targetMember) {
      setSelectedMemberId(targetMember.id);
      const matchedIdx = renewalOptions.findIndex(
        (opt) =>
          opt.name.toLowerCase() === (targetMember.membershipPlan || '').toLowerCase()
      );
      const nextIdx = matchedIdx >= 0 ? matchedIdx : 0;
      setSelectedPlanIndex(nextIdx);
      const defaultAmt = renewalOptions[nextIdx]?.amount || 2000;
      setPartialAmountInput(String(Math.round(defaultAmt / 2)));
    }
    setPaymentMode('full');
    setErrorMsg(null);
    setIsSubmitting(false);
  }, [isOpen, member]);

  if (!isOpen) return null;

  const activeMember =
    member ||
    members.find((m) => m.id === selectedMemberId) ||
    sortedMembers[0] ||
    null;

  if (!activeMember) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#EAE5DC] text-center">
          <div className="w-11 h-11 rounded-full bg-[#EEF2FF] text-[#1E3A8A] mx-auto flex items-center justify-center mb-3">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-bold text-[#191919] mb-1">No Members to Renew</h3>
          <p className="text-xs text-[#71717A] mb-4 leading-relaxed">
            There are no members enrolled in your gym yet. Add a member first to record membership renewals.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#162D6E] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const safeIndex = selectedPlanIndex < renewalOptions.length ? selectedPlanIndex : 0;
  const currentPlan = renewalOptions[safeIndex];

  // Calculate new expiry date using established rules:
  // If current expiry is in the future, extend from current expiry; otherwise start from today.
  const baseDate = new Date();
  const currExp = new Date(activeMember.expiryDate);
  const effectiveStart =
    !isNaN(currExp.getTime()) && currExp > baseDate ? currExp : baseDate;
  const nextExpiry = new Date(effectiveStart);
  if (currentPlan.isCustom && currentPlan.days > 0) {
    nextExpiry.setDate(nextExpiry.getDate() + currentPlan.days);
  } else {
    nextExpiry.setMonth(nextExpiry.getMonth() + currentPlan.months);
  }

  const effectiveStartFormatted = effectiveStart.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const newExpiryFormatted = nextExpiry.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const computedPaidAmount =
    paymentMode === 'full'
      ? currentPlan.amount
      : paymentMode === 'partial'
      ? Math.max(0, parseFloat(partialAmountInput) || 0)
      : 0;

  const remainingDueOnRenewal = Math.max(0, currentPlan.amount - computedPaidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (paymentMode === 'partial') {
      if (computedPaidAmount <= 0) {
        setErrorMsg('Enter a valid partial payment amount greater than ₹0, or select Pay Later.');
        return;
      }
      if (computedPaidAmount >= currentPlan.amount) {
        setErrorMsg('Partial amount equals or exceeds full fee. Choose Full Payment instead.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    onConfirmRenewal(activeMember.id, {
      membershipPlan: currentPlan.name,
      planFee: currentPlan.fee,
      monthsToAdd: currentPlan.months,
      daysToAdd: currentPlan.isCustom ? currentPlan.days : undefined,
      planPrice: currentPlan.amount,
      paymentAmount: computedPaidAmount,
      paymentMethod,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center font-bold text-base shadow-2xs">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191919] leading-tight">
                Renew Membership
              </h3>
              <p className="text-[11px] text-[#71717A] leading-none mt-0.5">
                Extend validity & record renewal payment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2.5 p-2 rounded-xl bg-[#FEECEB] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {/* Step 1: Member Selector & Current Status Review */}
          <div>
            <label className="block text-[11px] font-bold text-[#191919] mb-1">
              1. Member & Current Expiry
            </label>
            {!member && sortedMembers.length > 0 ? (
              <select
                value={activeMember.id}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedMemberId(nextId);
                  const found = members.find((m) => m.id === nextId);
                  if (found) {
                    const idx = renewalOptions.findIndex(
                      (o) =>
                        o.name.toLowerCase() === (found.membershipPlan || '').toLowerCase()
                    );
                    if (idx >= 0) setSelectedPlanIndex(idx);
                  }
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71] mb-2"
              >
                {sortedMembers.map((m) => {
                  const statusText =
                    m.daysUntilExpiry < 0
                      ? `${Math.abs(m.daysUntilExpiry)}d overdue`
                      : `${m.daysUntilExpiry}d left`;
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.memberCode || m.id}) — {statusText}
                    </option>
                  );
                })}
              </select>
            ) : null}

            {/* Current Membership Review Box */}
            <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-start justify-between gap-2.5 text-xs">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#E0E7FF] text-[#102A71] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {activeMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[13.5px] sm:text-[14px] text-[#191919] leading-snug break-normal">
                    {activeMember.name}
                  </div>
                  <div className="text-[11px] text-[#71717A] mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#EAE5DC] text-[#4B5563] px-1.5 py-0.5 rounded text-[10px] font-medium leading-none">
                      {activeMember.memberCode || activeMember.id}
                    </span>
                    <span className="text-[#D1D5DB]">•</span>
                    <span>
                      Current: <strong className="text-[#191919] font-semibold">{activeMember.membershipPlan}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10.5px] text-[#71717A]">
                  Expires: <span className="font-semibold text-[#191919]">{activeMember.expiryDate}</span>
                </div>
                <div
                  className={`text-[10.5px] font-bold mt-0.5 ${
                    activeMember.daysUntilExpiry < 0
                      ? 'text-[#DC2626]'
                      : activeMember.daysUntilExpiry <= 7
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {activeMember.daysUntilExpiry < 0
                    ? `${Math.abs(activeMember.daysUntilExpiry)} days overdue`
                    : `${activeMember.daysUntilExpiry} days remaining`}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Select Renewal Plan */}
          <div>
            <label className="block text-[11px] font-bold text-[#191919] mb-1">
              2. Choose Membership Plan
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
              {renewalOptions.map((plan, idx) => (
                <button
                  type="button"
                  key={plan.name}
                  onClick={() => {
                    setSelectedPlanIndex(idx);
                    setPartialAmountInput(String(Math.round(plan.amount / 2)));
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    safeIndex === idx
                      ? 'border-[#102A71] bg-[#EFF6FF] shadow-2xs'
                      : 'border-[#EAE5DC] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="text-xs font-bold text-[#191919] truncate">{plan.name}</div>
                  <div className="text-[11.5px] text-[#102A71] font-bold mt-0.5">{plan.fee}</div>
                  <div className="text-[10px] text-[#71717A] mt-0.5">
                    {plan.isCustom ? `+${plan.days} days` : `+${plan.months} mo (${plan.days}d)`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: New Membership Period Confirmation */}
          <div className="p-2.5 rounded-xl bg-[#EBF1FE] border border-[#DCE6FC] text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#1E3A8A]">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>
                Period: <strong className="font-semibold">{effectiveStartFormatted}</strong> →{' '}
                <strong className="font-bold text-[#102A71]">{newExpiryFormatted}</strong>
              </span>
            </div>
            <span className="text-[10.5px] font-bold text-[#16A34A] bg-white px-2 py-0.5 rounded-md border border-[#DCE6FC]">
              +{currentPlan.days}d
            </span>
          </div>

          {/* Step 4: Payment Collection & Method */}
          <div>
            <label className="block text-[11px] font-bold text-[#191919] mb-1">
              3. Payment Collection (Plan Fee: ₹{currentPlan.amount.toLocaleString('en-IN')})
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { id: 'full', label: 'Full Paid' },
                { id: 'partial', label: 'Partial' },
                { id: 'pending', label: 'Pay Later' },
              ].map((mode) => (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => setPaymentMode(mode.id as any)}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                    paymentMode === mode.id
                      ? 'bg-[#102A71] text-white border-[#102A71]'
                      : 'bg-[#FAF8F5] text-[#4B5563] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {paymentMode === 'partial' && (
              <div className="mb-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-[#71717A] mb-0.5">
                    Amount Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={currentPlan.amount - 1}
                    value={partialAmountInput}
                    onChange={(e) => setPartialAmountInput(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs font-bold bg-white border border-[#E5E0D6] rounded-lg focus:outline-hidden focus:border-[#102A71]"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#71717A] block">Balance Due</span>
                  <span className="text-xs font-bold text-[#DC2626]">
                    ₹{remainingDueOnRenewal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {paymentMode === 'pending' && (
              <div className="mb-2 p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[11px] text-[#DC2626] font-medium">
                Renewal will be saved with <strong>₹{currentPlan.amount.toLocaleString('en-IN')} pending balance</strong>. Not marked as paid until payment is collected.
              </div>
            )}

            {paymentMode !== 'pending' && (
              <div className="grid grid-cols-4 gap-1.5">
                {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 px-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer truncate ${
                      paymentMethod === m
                        ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-bold shadow-2xs'
                        : 'bg-white border-[#E5E0D6] text-[#71717A] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {m === 'Bank Transfer' ? 'Bank' : m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-[#102A71] hover:bg-[#0D225D] active:scale-98 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {paymentMode === 'pending'
                  ? 'Confirm Renewal (Due)'
                  : `Confirm & Save (₹${computedPaidAmount.toLocaleString('en-IN')})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
