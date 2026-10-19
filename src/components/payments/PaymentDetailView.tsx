/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  MoreVertical,
  Check,
  ChevronRight,
  Dumbbell,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  User,
  Receipt,
  IndianRupee,
  AlertTriangle,
  Clock,
  RotateCcw,
  Share2,
  Printer,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Member } from '../../types/dashboard';
import { EnrichedPaymentItem } from './PaymentsScreen';

interface PaymentDetailViewProps {
  payment: EnrichedPaymentItem;
  member?: Member | null;
  gymName?: string;
  gymLocation?: string;
  gymPhone?: string;
  onBack: () => void;
  onViewMember: (memberId: string) => void;
  onCollectBalance: (memberId: string) => void;
  onReversePayment?: (paymentId: string, reason?: string) => void;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim().replace(/^0(\d\s)/, '$1');
  }
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPlanDurationLabel(planName: string): string {
  const lower = (planName || '').toLowerCase();
  if (lower.includes('annual') || lower.includes('12') || lower.includes('year')) {
    return '12 Months';
  }
  if (lower.includes('6') || lower.includes('half')) {
    return '6 Months';
  }
  if (lower.includes('3') || lower.includes('quarter')) {
    return '3 Months';
  }
  if (lower.includes('45')) {
    return '45 Days';
  }
  return '1 Month';
}

export const PaymentDetailView: React.FC<PaymentDetailViewProps> = ({
  payment,
  member,
  gymName = 'MuscleFit Gym',
  gymLocation = 'Indiranagar, Bengaluru',
  gymPhone = '+91 98765 43210',
  onBack,
  onViewMember,
  onCollectBalance,
  onReversePayment,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReverseConfirmOpen, setIsReverseConfirmOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState('');

  // Accurate breakdown math derived from actual payment & member records
  const totalAmountDue = payment.planFee;
  const previouslyPaid = payment.previouslyPaid || 0;
  const amountReceivedThisPayment = payment.uiStatus === 'refunded' ? 0 : payment.paidAmount;
  const remainingBalance =
    payment.uiStatus === 'refunded'
      ? totalAmountDue
      : Math.max(0, totalAmountDue - previouslyPaid - amountReceivedThisPayment);

  const formattedDate = formatDisplayDate(payment.date);
  const displayTime = payment.time || '10:24 AM';
  const durationLabel = getPlanDurationLabel(payment.plan);

  // Member status (distinct from payment status)
  const memberExpiryStatus: 'active' | 'expiring' | 'expired' = member
    ? member.daysUntilExpiry < 0 || member.status === 'expired'
      ? 'expired'
      : member.daysUntilExpiry <= 7 || member.status === 'expiring'
      ? 'expiring'
      : 'active'
    : 'active';

  const formattedExpiry = member?.expiryDate
    ? formatDisplayDate(member.expiryDate)
    : payment.dueDate
    ? formatDisplayDate(payment.dueDate)
    : '—';

  const cleanPhone = (member?.phone || payment.phone || '').replace(/[^0-9]/g, '');

  const handleConfirmReverse = () => {
    if (onReversePayment) {
      onReversePayment(payment.id, reverseReason.trim() || 'Reversed by gym owner');
    }
    setIsReverseConfirmOpen(false);
  };

  return (
    <div className="w-full flex-1 pb-4 animate-in fade-in duration-150">
      {/* ============================================================== */}
      {/* A. HEADER: Back Button, "Payment Details", Transaction ID, Menu*/}
      {/* ============================================================== */}
      <header className="w-full flex items-center justify-between gap-2 pt-2.5 pb-2 px-0.5 relative">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] flex items-center justify-center text-[#191919] shadow-2xs cursor-pointer shrink-0 transition-colors"
            aria-label="Back to Payments"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          <div className="min-w-0">
            <h1 className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-tight">
              Payment Details
            </h1>
            <p className="text-[11.5px] text-[#71717A] mt-0.5 truncate leading-none">
              Transaction ID: {payment.receiptNumber}
            </p>
          </div>
        </div>

        {/* Overflow Menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-xl bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] flex items-center justify-center text-[#191919] shadow-2xs cursor-pointer transition-colors"
            aria-label="More payment actions"
          >
            <MoreVertical className="w-4 h-4 text-[#4B5563]" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsReceiptModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-[#102A71]" />
                <span>View Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onViewMember(payment.memberId);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#102A71]" />
                <span>View Member Profile</span>
              </button>

              {remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCollectBalance(payment.memberId);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#16A34A] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Collect Balance (₹{remainingBalance.toLocaleString('en-IN')})</span>
                </button>
              )}

              {onReversePayment &&
                payment.uiStatus !== 'refunded' &&
                payment.paidAmount > 0 &&
                !payment.id.startsWith('due-') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsReverseConfirmOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 border-t border-[#F2EFE8] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reverse / Refund Payment</span>
                  </button>
                )}
            </div>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* B. PAYMENT SUMMARY CARD                                        */}
      {/* ============================================================== */}
      <div className="mt-2 bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Status Icon + Badge + Amount + Label */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {payment.uiStatus === 'paid' ? (
              <div className="w-11 h-11 rounded-2xl bg-[#E6F8EE] flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            ) : payment.uiStatus === 'partial' || payment.uiStatus === 'pending' ? (
              <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
            )}

            <div className="min-w-0">
              {/* Status Badge */}
              {payment.uiStatus === 'paid' ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E6F8EE] text-[#15803D] leading-tight">
                  Paid
                </span>
              ) : payment.uiStatus === 'partial' ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FEF3C7] text-[#B45309] leading-tight">
                  Partial
                </span>
              ) : payment.uiStatus === 'pending' ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FEF3C7] text-[#B45309] leading-tight">
                  Pending
                </span>
              ) : payment.uiStatus === 'refunded' ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FEE2E2] text-[#DC2626] leading-tight">
                  Refunded
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FEE2E2] text-[#DC2626] leading-tight">
                  Overdue
                </span>
              )}

              {/* Primary Monetary Figure */}
              <div className="text-[22px] sm:text-[24px] font-extrabold text-[#191919] tracking-tight leading-tight mt-1">
                ₹{amountReceivedThisPayment.toLocaleString('en-IN')}
              </div>

              <span className="text-[11.5px] text-[#71717A] block mt-0.5 leading-none">
                {payment.uiStatus === 'paid'
                  ? 'Payment received'
                  : payment.uiStatus === 'partial'
                  ? 'Partial payment received'
                  : payment.uiStatus === 'refunded'
                  ? 'Payment reversed'
                  : 'Balance attention needed'}
              </span>
            </div>
          </div>

          {/* Right: Date, Time & Method Pill */}
          <div className="border-l border-[#F0ECE3] pl-3.5 flex flex-col justify-center shrink-0 min-w-[105px]">
            <span className="text-[12px] font-bold text-[#191919] leading-tight">
              {formattedDate}
            </span>
            <span className="text-[11px] text-[#71717A] mt-0.5 leading-none">
              {displayTime}
            </span>

            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-semibold text-[#191919]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      payment.paymentMethod === 'UPI'
                        ? '#16A34A'
                        : payment.paymentMethod === 'Cash'
                        ? '#10B981'
                        : payment.paymentMethod === 'Card'
                        ? '#7C3AED'
                        : '#2563EB',
                  }}
                />
                <span>{payment.paymentMethod}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* C. MEMBER DETAILS CARD                                         */}
      {/* ============================================================== */}
      <div className="mt-2.5 bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
        <h2 className="text-[13.5px] sm:text-[14px] font-bold text-[#191919] mb-2.5">
          Member Details
        </h2>

        {/* Clickable Member Row */}
        <div
          onClick={() => onViewMember(payment.memberId)}
          className="flex items-center justify-between gap-2.5 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label={`Open member profile for ${payment.memberName}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {payment.photoUrl ? (
              <img
                src={payment.photoUrl}
                alt={payment.memberName}
                className="w-11 h-11 rounded-full object-cover border border-[#EAE5DC] shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#E0E7FF] text-[#102A71] font-bold text-sm flex items-center justify-center border border-[#C7D2FE] shrink-0">
                {payment.memberName.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-[14px] sm:text-[15px] font-bold text-[#191919] truncate group-hover:text-[#102A71] transition-colors leading-tight">
                {payment.memberName}
              </h3>
              <p className="text-[11.5px] text-[#71717A] mt-0.5 leading-none">
                ID: {payment.memberCode}
              </p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#71717A] group-hover:text-[#191919] shrink-0 transition-colors" />
        </div>

        {/* Bottom 2-Column Sub-cards: Plan Info & Validity Status */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Sub-card 1: Plan */}
          <div className="bg-[#F8F7F4] rounded-xl p-2.5 border border-[#EFECE6] flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
              <Dumbbell className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[12px] font-bold text-[#191919] block truncate leading-tight">
                {payment.plan}
              </span>
              <span className="text-[10.5px] text-[#71717A] block truncate mt-0.5 leading-none">
                {durationLabel} · ₹{totalAmountDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Sub-card 2: Membership Status & Expiry */}
          <div className="bg-[#F8F7F4] rounded-xl p-2.5 border border-[#EFECE6] flex flex-col justify-center min-w-0">
            <div>
              {memberExpiryStatus === 'active' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6F8EE] text-[#15803D] leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  <span>Active</span>
                </span>
              ) : memberExpiryStatus === 'expiring' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#B45309] leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span>Expiring</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEE2E2] text-[#DC2626] leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  <span>Expired</span>
                </span>
              )}
            </div>
            <span className="text-[10.5px] text-[#71717A] mt-1 block truncate leading-tight">
              {memberExpiryStatus === 'expired' ? 'Expired on ' : 'Valid till '}
              {formattedExpiry}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* D. PAYMENT BREAKDOWN CARD                                      */}
      {/* ============================================================== */}
      <div className="mt-2.5 bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
        <h2 className="text-[13.5px] sm:text-[14px] font-bold text-[#191919] mb-2.5">
          Payment Breakdown
        </h2>

        <div className="space-y-2 text-[12px] sm:text-[12.5px]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B7280]">Total Amount</span>
            <span className="font-bold text-[#191919]">
              ₹{totalAmountDue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#6B7280]">Previously Paid</span>
            <span className="font-bold text-[#191919]">
              ₹{previouslyPaid.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#6B7280]">Amount Received (This Payment)</span>
            <span className="font-bold text-[#191919]">
              ₹{amountReceivedThisPayment.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-[#F2EFE8]">
            <span className="text-[#4B5563] font-medium">Remaining Balance</span>
            <span
              className={`font-bold text-[13px] ${
                remainingBalance > 0 ? 'text-[#DC2626]' : 'text-[#191919]'
              }`}
            >
              ₹{remainingBalance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Quick Collect Balance Banner when Remaining Balance > 0 */}
        {remainingBalance > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#F2EFE8] flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#B45309] font-medium">
              ₹{remainingBalance.toLocaleString('en-IN')} pending on this membership
            </span>
            <button
              type="button"
              onClick={() => onCollectBalance(payment.memberId)}
              className="px-3 py-1.5 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-[11px] font-semibold cursor-pointer shadow-2xs shrink-0"
            >
              Collect Balance
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* E. ADDITIONAL INFORMATION CARD                                 */}
      {/* ============================================================== */}
      <div className="mt-2.5 bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
        <h2 className="text-[13.5px] sm:text-[14px] font-bold text-[#191919] mb-2.5">
          Additional Information
        </h2>

        <div className="space-y-2.5 text-[12px]">
          {/* Payment Date */}
          <div className="flex items-start gap-2.5">
            <Calendar className="w-3.5 h-3.5 text-[#71717A] shrink-0 mt-0.5" />
            <span className="text-[#6B7280] w-28 shrink-0">Payment Date</span>
            <span className="font-medium text-[#191919] flex-1">
              {formattedDate}, {displayTime}
            </span>
          </div>

          {/* Payment Method */}
          <div className="flex items-start gap-2.5">
            <CreditCard className="w-3.5 h-3.5 text-[#71717A] shrink-0 mt-0.5" />
            <span className="text-[#6B7280] w-28 shrink-0">Payment Method</span>
            <span className="font-medium text-[#191919] flex-1">{payment.paymentMethod}</span>
          </div>

          {/* Reference ID (shown if available) */}
          {(payment.referenceId || payment.receiptNumber) && (
            <div className="flex items-start gap-2.5">
              <FileText className="w-3.5 h-3.5 text-[#71717A] shrink-0 mt-0.5" />
              <span className="text-[#6B7280] w-28 shrink-0">Reference ID</span>
              <span className="font-medium text-[#191919] flex-1 break-all">
                {payment.referenceId || payment.receiptNumber}
              </span>
            </div>
          )}

          {/* Note (only shown when available) */}
          {payment.notes && (
            <div className="flex items-start gap-2.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#71717A] shrink-0 mt-0.5" />
              <span className="text-[#6B7280] w-28 shrink-0">Note</span>
              <span className="font-medium text-[#191919] flex-1">{payment.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* F. BOTTOM ACTIONS: "View Receipt" & "View Member"              */}
      {/* ============================================================== */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setIsReceiptModalOpen(true)}
          className="py-2.5 px-3 rounded-xl bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] active:scale-98 text-[#102A71] font-bold text-[12.5px] sm:text-[13px] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4 stroke-[2.2]" />
          <span>View Receipt</span>
        </button>

        <button
          type="button"
          onClick={() => onViewMember(payment.memberId)}
          className="py-2.5 px-3 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-98 text-white font-bold text-[12.5px] sm:text-[13px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <User className="w-4 h-4 stroke-[2.2]" />
          <span>View Member</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* OFFICIAL RECEIPT MODAL                                         */}
      {/* ============================================================== */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#191919] leading-tight">
                    Official Payment Receipt
                  </h3>
                  <p className="text-[11px] text-[#71717A] leading-none mt-0.5">
                    {gymName} · {gymLocation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="mt-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-dashed border-[#D5CFC2]">
                <div>
                  <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">
                    Receipt Number
                  </span>
                  <span className="font-bold text-[#191919] text-[13px]">
                    {payment.receiptNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">
                    Date & Time
                  </span>
                  <span className="font-semibold text-[#191919]">
                    {formattedDate}, {displayTime}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Member</span>
                  <span className="font-bold text-[#191919]">
                    {payment.memberName} ({payment.memberCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Plan</span>
                  <span className="font-semibold text-[#191919]">{payment.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Payment Mode</span>
                  <span className="font-semibold text-[#191919]">{payment.paymentMethod}</span>
                </div>
                {payment.referenceId && (
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Reference ID</span>
                    <span className="font-semibold text-[#191919]">{payment.referenceId}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-dashed border-[#D5CFC2] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Total Plan Amount</span>
                  <span className="font-semibold text-[#191919]">
                    ₹{totalAmountDue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[#191919]">Amount Received</span>
                  <span className="font-extrabold text-[14px] text-[#16A34A]">
                    ₹{amountReceivedThisPayment.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Remaining Balance</span>
                  <span
                    className={`font-bold ${
                      remainingBalance > 0 ? 'text-[#DC2626]' : 'text-[#191919]'
                    }`}
                  >
                    ₹{remainingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAE5DC] flex items-center justify-between text-[10.5px] text-[#71717A]">
                <span className="flex items-center gap-1 text-[#15803D] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Gym Receipt
                </span>
                <span>{gymPhone}</span>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(
                  payment.memberName
                )},%20here%20is%20your%20payment%20receipt%20(${encodeURIComponent(
                  payment.receiptNumber
                )})%20from%20${encodeURIComponent(
                  gymName
                )}:%0A•%20Plan:%20${encodeURIComponent(
                  payment.plan
                )}%0A•%20Amount%20Received:%20₹${amountReceivedThisPayment.toLocaleString(
                  'en-IN'
                )}%0A•%20Balance%20Due:%20₹${remainingBalance.toLocaleString('en-IN')}`}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REVERSE / REFUND CONFIRMATION MODAL                            */}
      {/* ============================================================== */}
      {isReverseConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-[#EAE5DC]">
            <div className="flex items-center gap-2 text-[#DC2626] mb-2">
              <RotateCcw className="w-4 h-4" />
              <h3 className="text-sm font-bold">Reverse / Refund Payment?</h3>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              This will mark transaction <strong>{payment.receiptNumber}</strong> (₹
              {payment.paidAmount.toLocaleString('en-IN')}) as reversed and restore ₹
              {payment.paidAmount.toLocaleString('en-IN')} to {payment.memberName}&apos;s pending
              balance.
            </p>
            <input
              type="text"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Reason for reversal (optional)"
              className="mt-2.5 w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl focus:outline-hidden focus:border-[#DC2626]"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReverseConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-[#EAE5DC] text-xs font-semibold text-[#4B5563] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReverse}
                className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
