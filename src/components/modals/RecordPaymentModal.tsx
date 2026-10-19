/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, IndianRupee, AlertCircle, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { Member } from '../../types/dashboard';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onRecordPayment: (data: {
    memberId: string;
    memberName: string;
    amount: number;
    paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    plan: string;
    planFee?: number;
    notes?: string;
    date?: string;
  }) => void;
  initialMemberId?: string;
}

function parseNumericPlanFee(planFeeStr?: string, planName?: string): number {
  if (planFeeStr) {
    const digits = planFeeStr.replace(/[^0-9]/g, '');
    const parsed = parseInt(digits, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const lower = (planName || '').toLowerCase();
  if (lower.includes('annual') || lower.includes('12')) return 14000;
  if (lower.includes('6') || lower.includes('half')) return 9000;
  if (lower.includes('3') || lower.includes('quarter')) return 5500;
  return 2000;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  members,
  onRecordPayment,
  initialMemberId,
}) => {
  // Sort members so those with pending balances appear first when no member is preselected
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.pendingAmount > 0 && b.pendingAmount === 0) return -1;
      if (a.pendingAmount === 0 && b.pendingAmount > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [members]);

  const [selectedMemberId, setSelectedMemberId] = useState(
    initialMemberId || sortedMembers[0]?.id || ''
  );
  const [amount, setAmount] = useState('2000');
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [method, setMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>('UPI');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || sortedMembers[0],
    [members, selectedMemberId, sortedMembers]
  );

  const targetFeeOrDue = useMemo(() => {
    if (!currentMember) return 2000;
    if (currentMember.pendingAmount > 0) return currentMember.pendingAmount;
    return parseNumericPlanFee(currentMember.planFee, currentMember.membershipPlan);
  }, [currentMember]);

  // Sync state whenever modal opens or initialMemberId changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    const targetId = initialMemberId || sortedMembers[0]?.id || '';
    setSelectedMemberId(targetId);
    const mem = members.find((m) => m.id === targetId) || sortedMembers[0];
    if (mem) {
      const defaultAmt =
        mem.pendingAmount > 0
          ? mem.pendingAmount
          : parseNumericPlanFee(mem.planFee, mem.membershipPlan);
      setAmount(defaultAmt.toString());
      setPaymentMode('full');
    }
  }, [initialMemberId, isOpen, members, sortedMembers]);

  if (!isOpen) return null;

  if (sortedMembers.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#EAE5DC] text-center">
          <div className="w-11 h-11 rounded-full bg-[#EEF2FF] text-[#1E3A8A] mx-auto flex items-center justify-center mb-3">
            <IndianRupee className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-bold text-[#191919] mb-1">No Members Available</h3>
          <p className="text-xs text-[#71717A] mb-4 leading-relaxed">
            There are no members enrolled in your gym yet. Add a member first before recording payments.
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

  const parsedAmount = parseFloat(amount) || 0;
  const remainingBalance = Math.max(0, targetFeeOrDue - parsedAmount);

  const handleMemberChange = (newId: string) => {
    setSelectedMemberId(newId);
    setErrorMsg(null);
    const mem = members.find((m) => m.id === newId);
    if (mem) {
      const defaultAmt =
        mem.pendingAmount > 0
          ? mem.pendingAmount
          : parseNumericPlanFee(mem.planFee, mem.membershipPlan);
      setAmount(defaultAmt.toString());
      setPaymentMode('full');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) {
      setErrorMsg('Please select a member to record payment.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }
    if (currentMember.pendingAmount > 0 && parsedAmount > currentMember.pendingAmount * 2) {
      setErrorMsg(
        `Amount exceeds pending balance (₹${currentMember.pendingAmount.toLocaleString('en-IN')}). Please verify.`
      );
      return;
    }

    onRecordPayment({
      memberId: currentMember.id,
      memberName: currentMember.name,
      amount: parsedAmount,
      paymentMethod: method,
      plan: currentMember.membershipPlan,
      planFee: targetFeeOrDue,
      notes: notes.trim() || undefined,
      date: paymentDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-bold text-[#191919] leading-tight">
                Record Payment
              </h3>
              <p className="text-[11px] text-[#71717A] leading-none mt-0.5">
                Collect membership fee or clear pending dues
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {/* Member Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-[13px] font-medium bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
            >
              {sortedMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberCode || m.id}) —{' '}
                  {m.pendingAmount > 0
                    ? `Due: ₹${m.pendingAmount.toLocaleString('en-IN')}`
                    : m.membershipPlan}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Member Balance Summary Strip */}
          {currentMember && (
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                currentMember.pendingAmount > 0
                  ? 'bg-[#FFFBEB] border-[#FDE68A]'
                  : 'bg-[#FAF8F5] border-[#EAE5DC]'
              }`}
            >
              <div>
                <span className="text-[10.5px] text-[#71717A] block leading-none">
                  {currentMember.membershipPlan}
                </span>
                <span className="font-bold text-[#191919] text-[12px] mt-1 block leading-none">
                  {currentMember.pendingAmount > 0
                    ? `Pending Due: ₹${currentMember.pendingAmount.toLocaleString('en-IN')}`
                    : `Standard Fee: ₹${targetFeeOrDue.toLocaleString('en-IN')}`}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentMember.pendingAmount > 0
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : 'bg-[#E8FAF0] text-[#15803D]'
                }`}
              >
                {currentMember.pendingAmount > 0 ? 'Balance Due' : 'No Pending Dues'}
              </span>
            </div>
          )}

          {/* Full vs Partial Quick Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#191919]">
                Amount Collected (₹ INR)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('full');
                    setAmount(targetFeeOrDue.toString());
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                    paymentMode === 'full'
                      ? 'bg-[#102A71] text-white'
                      : 'bg-[#F4F1EA] text-[#4B5563] hover:bg-[#EAE5DC]'
                  }`}
                >
                  Full (₹{targetFeeOrDue.toLocaleString('en-IN')})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('partial');
                    const half = Math.max(500, Math.round(targetFeeOrDue / 2));
                    setAmount(half.toString());
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                    paymentMode === 'partial'
                      ? 'bg-[#D97706] text-white'
                      : 'bg-[#F4F1EA] text-[#4B5563] hover:bg-[#EAE5DC]'
                  }`}
                >
                  Partial
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#71717A]">
                ₹
              </span>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  const val = parseFloat(e.target.value) || 0;
                  setPaymentMode(val < targetFeeOrDue ? 'partial' : 'full');
                  setErrorMsg(null);
                }}
                className="w-full pl-7 pr-3 py-2 text-[15px] font-bold bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
              />
            </div>

            {/* Live Balance Allocation Preview */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] px-0.5">
              <span className="text-[#71717A]">Balance after payment:</span>
              {remainingBalance > 0 ? (
                <span className="font-semibold text-[#D97706] flex items-center gap-1">
                  <span>₹{remainingBalance.toLocaleString('en-IN')} Pending (Partial)</span>
                </span>
              ) : (
                <span className="font-semibold text-[#16A34A] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>₹0 Due (Fully Paid)</span>
                </span>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    method === m
                      ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71] shadow-2xs'
                      : 'bg-white border-[#E5E0D6] text-[#4B5563] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Optional Reference Note */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10.5px] font-semibold text-[#71717A] mb-1">
                Payment Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-[11.5px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-[#71717A] mb-1">
                Note / UPI Ref (Optional)
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. GPay / Installment"
                  className="w-full pl-8 pr-2.5 py-1.5 text-[11.5px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-1.5 text-[11px] text-[#DC2626] font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D6] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#102A71] hover:bg-[#0D225D] active:scale-98 text-white font-semibold text-xs sm:text-[13px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Payment (₹{parsedAmount.toLocaleString('en-IN')})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
