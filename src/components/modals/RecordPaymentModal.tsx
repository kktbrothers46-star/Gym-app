/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Search,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { Member } from '../../types/dashboard';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onRecordPayment: (data: {
    memberId: string;
    memberName: string;
    amount: number;
    paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
    plan: string;
    planFee?: number;
    notes?: string;
    date?: string;
    referenceId?: string;
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
  // Sort members so those with pending balances appear first
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if ((a.pendingAmount || 0) > 0 && (b.pendingAmount || 0) === 0) return -1;
      if ((a.pendingAmount || 0) === 0 && (b.pendingAmount || 0) > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [members]);

  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(
    initialMemberId || sortedMembers[0]?.id || ''
  );
  const [amount, setAmount] = useState('2000');
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [method, setMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer' | 'Other'>('UPI');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    memberName: string;
    amount: number;
    remaining: number;
  } | null>(null);

  const currentMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || sortedMembers[0],
    [members, selectedMemberId, sortedMembers]
  );

  const targetFeeOrDue = useMemo(() => {
    if (!currentMember) return 2000;
    if ((currentMember.pendingAmount || 0) > 0) return currentMember.pendingAmount;
    return parseNumericPlanFee(currentMember.planFee, currentMember.membershipPlan);
  }, [currentMember]);

  // Sync state whenever modal opens or initialMemberId changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessInfo(null);
    setIsSubmitting(false);
    setTransactionRef('');
    setNotes('');
    setMemberSearchQuery('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    const targetId = initialMemberId || sortedMembers[0]?.id || '';
    setSelectedMemberId(targetId);
    const mem = members.find((m) => m.id === targetId) || sortedMembers[0];
    if (mem) {
      const defaultAmt =
        (mem.pendingAmount || 0) > 0
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

  const parsedAmount = Math.max(0, parseFloat(amount) || 0);
  const remainingBalance = Math.max(0, targetFeeOrDue - parsedAmount);

  const handleMemberChange = (newId: string) => {
    setSelectedMemberId(newId);
    setErrorMsg(null);
    const mem = members.find((m) => m.id === newId);
    if (mem) {
      const defaultAmt =
        (mem.pendingAmount || 0) > 0
          ? mem.pendingAmount
          : parseNumericPlanFee(mem.planFee, mem.membershipPlan);
      setAmount(defaultAmt.toString());
      setPaymentMode('full');
    }
  };

  const filteredMembersForDropdown = memberSearchQuery.trim()
    ? sortedMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
          (m.phone || '').includes(memberSearchQuery) ||
          (m.memberCode || '').toLowerCase().includes(memberSearchQuery.toLowerCase())
      )
    : sortedMembers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentMember) {
      setErrorMsg('Please select a member to record payment.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const combinedNotes = [
      transactionRef.trim() ? `Ref: ${transactionRef.trim()}` : '',
      notes.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      onRecordPayment({
        memberId: currentMember.id,
        memberName: currentMember.name,
        amount: parsedAmount,
        paymentMethod: method,
        plan: currentMember.membershipPlan,
        planFee: targetFeeOrDue,
        notes: notes.trim() || undefined,
        date: paymentDate,
        referenceId: transactionRef.trim() || undefined,
      });

      setSuccessInfo({
        memberName: currentMember.name,
        amount: parsedAmount,
        remaining: remainingBalance,
      });

      // Brief delay to let user see positive confirmation before closing
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Failed to save payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Success Confirmation Screen */}
        {successInfo ? (
          <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h3 className="text-[17px] font-bold text-[#191919]">
              Payment Recorded Successfully!
            </h3>
            <p className="text-xs text-[#52525B] max-w-xs mx-auto leading-relaxed">
              Collected <span className="font-bold text-[#191919]">₹{successInfo.amount.toLocaleString('en-IN')}</span> for{' '}
              <span className="font-bold text-[#191919]">{successInfo.memberName}</span>.
            </p>
            {successInfo.remaining > 0 ? (
              <div className="inline-block px-3 py-1 rounded-lg bg-[#FEF3C7] text-[#B45309] text-[11.5px] font-semibold">
                Remaining Balance: ₹{successInfo.remaining.toLocaleString('en-IN')}
              </div>
            ) : (
              <div className="inline-block px-3 py-1 rounded-lg bg-[#E8FAF0] text-[#15803D] text-[11.5px] font-semibold">
                All Dues Cleared (₹0 Remaining)
              </div>
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#102A71] text-white text-xs font-bold hover:bg-[#0D225D] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
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
              {/* Member Selection with search filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Select Member
                </label>
                {sortedMembers.length > 5 && (
                  <div className="mb-1.5 relative">
                    <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Filter members by name or phone..."
                      className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-lg focus:outline-hidden focus:border-[#102A71]"
                    />
                  </div>
                )}
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-[13px] font-medium bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                >
                  {filteredMembersForDropdown.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.memberCode || m.id}) —{' '}
                      {(m.pendingAmount || 0) > 0
                        ? `Due: ₹${(m.pendingAmount || 0).toLocaleString('en-IN')}`
                        : m.membershipPlan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Member Balance Summary Strip */}
              {currentMember && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    (currentMember.pendingAmount || 0) > 0
                      ? 'bg-[#FFFBEB] border-[#FDE68A]'
                      : 'bg-[#FAF8F5] border-[#EAE5DC]'
                  }`}
                >
                  <div>
                    <span className="text-[10.5px] text-[#71717A] block leading-none">
                      {currentMember.membershipPlan}
                    </span>
                    <span className="font-bold text-[#191919] text-[12px] mt-1 block leading-none">
                      {(currentMember.pendingAmount || 0) > 0
                        ? `Pending Due: ₹${(currentMember.pendingAmount || 0).toLocaleString('en-IN')}`
                        : `Plan Fee: ₹${targetFeeOrDue.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      (currentMember.pendingAmount || 0) > 0
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#E8FAF0] text-[#15803D]'
                    }`}
                  >
                    {(currentMember.pendingAmount || 0) > 0 ? 'Balance Due' : 'Paid / Active'}
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

              {/* Payment Method Selector — All 5 methods supported */}
              <div>
                <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: 'UPI', label: 'UPI', icon: Smartphone },
                      { id: 'Cash', label: 'Cash', icon: Wallet },
                      { id: 'Card', label: 'Card', icon: CreditCard },
                      { id: 'Bank Transfer', label: 'Bank', icon: Building2 },
                      { id: 'Other', label: 'Other', icon: HelpCircle },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setMethod(item.id)}
                        className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          method === item.id
                            ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71] shadow-2xs font-bold'
                            : 'bg-white border-[#E5E0D6] text-[#4B5563] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Optional Transaction Reference */}
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
                    Transaction Ref (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. UTR / UPI Ref"
                      className="w-full pl-8 pr-2.5 py-1.5 text-[11.5px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-[10.5px] font-semibold text-[#71717A] mb-1">
                  Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid in 2 installments / Cheque clearance"
                  className="w-full px-3 py-1.5 text-[11.5px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                />
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
                  disabled={isSubmitting}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D6] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#102A71] hover:bg-[#0D225D] active:scale-98 text-white font-semibold text-xs sm:text-[13px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : `Confirm Payment (₹${parsedAmount.toLocaleString('en-IN')})`}
                  </span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
