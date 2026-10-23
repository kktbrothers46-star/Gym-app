/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  IndianRupee,
  Wallet,
  AlertTriangle,
  Phone,
  MessageCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  X,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Receipt,
  Check,
  Info,
} from 'lucide-react';
import {
  Member,
  Payment,
  PaymentPromise,
  CashReconciliation,
  Expense,
} from '../../types/dashboard';
import { WhatsAppFollowUpTarget } from '../modals/WhatsAppFollowUpModal';

function getLocalIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getYesterdayIso(todayIso: string): string {
  const dt = new Date(todayIso + 'T00:00:00');
  dt.setDate(dt.getDate() - 1);
  return getLocalIso(dt);
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parsePlanFeeNumber(planFeeStr?: string, planName?: string): number {
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

// ============================================================================
// FEATURE 2: PENDING PAYMENT TRACKER PANEL
// ============================================================================
interface PendingPaymentTrackerProps {
  members: Member[];
  payments: Payment[];
  searchQuery: string;
  onRecordPayment: (memberId: string) => void;
  onOpenMemberDetail: (memberId: string) => void;
  onOpenWhatsApp: (target: WhatsAppFollowUpTarget) => void;
  onOpenPromiseForMember: (memberId: string, defaultAmount: number) => void;
}

export const PendingPaymentTrackerPanel: React.FC<PendingPaymentTrackerProps> = ({
  members,
  payments,
  searchQuery,
  onRecordPayment,
  onOpenMemberDetail,
  onOpenWhatsApp,
  onOpenPromiseForMember,
}) => {
  const [dueFilter, setDueFilter] = useState<
    'all' | 'recently_due' | 'overdue' | 'older_dues'
  >('all');

  const todayIso = useMemo(() => getLocalIso(), []);
  const todayMidnight = useMemo(
    () => new Date(todayIso + 'T00:00:00').getTime(),
    [todayIso]
  );

  // Build accurate member balance items from actual recorded charges & payments
  const outstandingItems = useMemo(() => {
    return members
      .filter((m) => (m.pendingAmount || 0) > 0)
      .map((m) => {
        const memberPayments = payments.filter(
          (p) => p.memberId === m.id && p.status !== 'refunded'
        );
        const totalPaidRecorded = memberPayments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );
        const latestPlanFee =
          memberPayments[0]?.planFee ||
          parsePlanFeeNumber(m.planFee, m.membershipPlan);
        const originalAmount = Math.max(
          latestPlanFee,
          totalPaidRecorded + m.pendingAmount
        );
        const amountPaid = Math.max(0, originalAmount - m.pendingAmount);

        // Calculate days overdue from startDate / dueDate / expiryDate
        let daysOverdue = 0;
        if (m.daysUntilExpiry < 0) {
          daysOverdue = Math.abs(m.daysUntilExpiry);
        } else if (m.startDate) {
          const parsedStart = new Date(m.startDate);
          if (!isNaN(parsedStart.getTime())) {
            const startIso = getLocalIso(parsedStart);
            const startMid = new Date(startIso + 'T00:00:00').getTime();
            daysOverdue = Math.max(
              0,
              Math.round((todayMidnight - startMid) / (1000 * 60 * 60 * 24))
            );
          }
        }

        const isOverdue = m.daysUntilExpiry < 0 || daysOverdue > 7;
        const isOlderDue = daysOverdue > 30 || m.daysUntilExpiry < -15;

        return {
          member: m,
          originalAmount,
          amountPaid,
          amountDue: m.pendingAmount,
          daysOverdue,
          isOverdue,
          isOlderDue,
        };
      })
      .sort((a, b) => {
        if (b.daysOverdue !== a.daysOverdue) return b.daysOverdue - a.daysOverdue;
        return b.amountDue - a.amountDue;
      });
  }, [members, payments, todayMidnight]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return outstandingItems.filter((item) => {
      if (q) {
        const matchName = item.member.name.toLowerCase().includes(q);
        const matchPhone = (item.member.phone || '').toLowerCase().includes(q);
        const matchCode = (item.member.memberCode || item.member.id)
          .toLowerCase()
          .includes(q);
        if (!matchName && !matchPhone && !matchCode) return false;
      }
      if (dueFilter === 'recently_due') {
        return !item.isOverdue && item.daysOverdue <= 7;
      }
      if (dueFilter === 'overdue') {
        return item.isOverdue && !item.isOlderDue;
      }
      if (dueFilter === 'older_dues') {
        return item.isOlderDue;
      }
      return true;
    });
  }, [outstandingItems, searchQuery, dueFilter]);

  const totalOutstandingSum = useMemo(
    () => outstandingItems.reduce((s, i) => s + i.amountDue, 0),
    [outstandingItems]
  );

  return (
    <div className="mt-3 space-y-2.5">
      {/* Header & Filter Pills */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold text-[#191919]">
              Pending Payment Tracker
            </h2>
            <p className="text-[11px] text-[#71717A]">
              {outstandingItems.length} member
              {outstandingItems.length === 1 ? '' : 's'} with outstanding balance ·
              Total Due:{' '}
              <strong className="text-[#DC2626]">
                ₹{totalOutstandingSum.toLocaleString('en-IN')}
              </strong>
            </p>
          </div>
        </div>

        {/* Filters: All Outstanding, Recently Due, Overdue, Older Dues */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {(
            [
              { id: 'all', label: `All Balances (${outstandingItems.length})` },
              {
                id: 'recently_due',
                label: `Recently Due (${
                  outstandingItems.filter((i) => !i.isOverdue && i.daysOverdue <= 7)
                    .length
                })`,
              },
              {
                id: 'overdue',
                label: `Overdue (${
                  outstandingItems.filter((i) => i.isOverdue && !i.isOlderDue).length
                })`,
              },
              {
                id: 'older_dues',
                label: `Older Dues 30d+ (${
                  outstandingItems.filter((i) => i.isOlderDue).length
                })`,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDueFilter(f.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                dueFilter === f.id
                  ? 'bg-[#102A71] text-white shadow-2xs'
                  : 'bg-[#FAF8F5] border border-[#EAE5DC] text-[#52525B] hover:bg-[#F2EFE8]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-[#ECFDF5] text-[#15803D] flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[#191919]">
            No outstanding balances in this category
          </h4>
          <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
            All member dues for the selected filter have been settled.
          </p>
        </div>
      ) : (
        filteredItems.map((item) => {
          const { member } = item;
          const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');

          return (
            <div
              key={member.id}
              onClick={() => onOpenMemberDetail(member.id)}
              className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3 shadow-2xs hover:border-[#D5CFC2] transition-all cursor-pointer space-y-2.5"
            >
              {/* Top Row: Member Name, Phone, Overdue Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[14.5px] sm:text-[15.5px] text-[#191919] leading-snug break-normal">
                    {member.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#52525B] mt-0.5 flex-wrap">
                    <span className="font-semibold text-[#71717A] bg-[#F4F1EA] px-1.5 py-0.5 rounded text-[10px]">
                      {member.memberCode || member.id}
                    </span>
                    <span>•</span>
                    <span>+91 {member.phone || '—'}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#102A71]">
                      {member.membershipPlan}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.isOlderDue ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                      {item.daysOverdue}d Overdue
                    </span>
                  ) : item.isOverdue ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEECEB] text-[#DC2626]">
                      {item.daysOverdue > 0
                        ? `${item.daysOverdue}d Overdue`
                        : 'Overdue'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E5] text-[#D97706]">
                      {item.daysOverdue > 0
                        ? `Due (${item.daysOverdue}d)`
                        : 'Recently Due'}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Original Fee, Paid Amount, Balance Due */}
              <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-center">
                <div>
                  <span className="text-[10px] text-[#71717A] block">
                    Original Fee
                  </span>
                  <span className="text-xs font-bold text-[#191919]">
                    ₹{item.originalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-x border-[#EAE5DC]">
                  <span className="text-[10px] text-[#71717A] block">
                    Amount Paid
                  </span>
                  <span className="text-xs font-bold text-[#15803D]">
                    ₹{item.amountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71717A] block">
                    Amount Due
                  </span>
                  <span className="text-xs font-extrabold text-[#DC2626]">
                    ₹{item.amountDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Bottom Action Row: Call, WhatsApp, Promise, Record Payment */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-7.5 h-7.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors"
                    title={`Call ${member.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWhatsApp({
                        personId: member.id,
                        personType: 'Member',
                        name: member.name,
                        phone: member.phone,
                        planName: member.membershipPlan,
                        pendingAmount: item.amountDue,
                        defaultCategory: 'payment',
                      });
                    }}
                    className="w-7.5 h-7.5 rounded-lg bg-[#ECFDF5] text-[#16A34A] hover:bg-[#D1FAE5] flex items-center justify-center transition-colors cursor-pointer"
                    title={`WhatsApp payment reminder to ${member.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPromiseForMember(member.id, item.amountDue);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#EAE5DC] text-[10.5px] font-bold text-[#52525B] flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3 h-3 text-[#D97706]" />
                    <span>+ Promise</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecordPayment(member.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <IndianRupee className="w-3 h-3" />
                  <span>Record Payment</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// ============================================================================
// FEATURE 7: DAILY COLLECTION SUMMARY PANEL
// ============================================================================
interface DailyCollectionSummaryProps {
  payments: Payment[];
  expenses: Expense[];
  members: Member[];
  cashReconciliations: CashReconciliation[];
  onSaveCashReconciliation: (
    date: string,
    physicalCashCounted: number,
    recordedCashAmount: number,
    note?: string
  ) => void;
  onSelectTransaction: (paymentId: string) => void;
  onRecordPayment: () => void;
}

export const DailyCollectionSummaryPanel: React.FC<DailyCollectionSummaryProps> = ({
  payments,
  expenses,
  members,
  cashReconciliations,
  onSaveCashReconciliation,
  onSelectTransaction,
  onRecordPayment,
}) => {
  const todayIso = useMemo(() => getLocalIso(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Filter successful recorded payment collections for a specific ISO date
  // Exclude refunded/cancelled or 0-amount unpaid records
  const getCollectionsForDate = (isoDate: string) => {
    return payments.filter(
      (p) =>
        p.date === isoDate &&
        p.status !== 'refunded' &&
        p.status !== 'pending' &&
        p.status !== 'overdue' &&
        (p.amount || 0) > 0
    );
  };

  const todayTransactions = useMemo(
    () => getCollectionsForDate(selectedDate),
    [payments, selectedDate]
  );

  const prevDateIso = useMemo(() => getYesterdayIso(selectedDate), [selectedDate]);
  const prevDayTransactions = useMemo(
    () => getCollectionsForDate(prevDateIso),
    [payments, prevDateIso]
  );

  const breakdown = useMemo(() => {
    let total = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;
    let bank = 0;
    let other = 0;

    todayTransactions.forEach((p) => {
      const amt = p.amount || 0;
      total += amt;
      if (p.paymentMethod === 'Cash') cash += amt;
      else if (p.paymentMethod === 'UPI') upi += amt;
      else if (p.paymentMethod === 'Card') card += amt;
      else if (p.paymentMethod === 'Bank Transfer') bank += amt;
      else other += amt;
    });

    const prevTotal = prevDayTransactions.reduce((s, p) => s + (p.amount || 0), 0);
    return {
      total,
      cash,
      upi,
      card,
      bank,
      other,
      prevTotal,
      hasPrevData: prevDayTransactions.length > 0,
    };
  }, [todayTransactions, prevDayTransactions]);

  // Day's expenses and gym-wide pending dues for clear financial distinction
  const selectedDayExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date === selectedDate && e.status !== 'unpaid')
      .reduce((s, e) => s + (e.amount || 0), 0);
  }, [expenses, selectedDate]);

  const totalPendingDues = useMemo(
    () => members.reduce((s, m) => s + (m.pendingAmount || 0), 0),
    [members]
  );

  // Existing Cash Reconciliation for selectedDate
  const existingReconciliation = useMemo(
    () => cashReconciliations.find((r) => r.date === selectedDate),
    [cashReconciliations, selectedDate]
  );

  const [physicalCashInput, setPhysicalCashInput] = useState<string>('');
  const [reconcileNote, setReconcileNote] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (existingReconciliation) {
      setPhysicalCashInput(String(existingReconciliation.physicalCashCounted));
      setReconcileNote(existingReconciliation.note || '');
    } else {
      setPhysicalCashInput('');
      setReconcileNote('');
    }
    setSavedNotice(false);
  }, [selectedDate, existingReconciliation]);

  const shiftDate = (delta: number) => {
    const dt = new Date(selectedDate + 'T00:00:00');
    dt.setDate(dt.getDate() + delta);
    const nextIso = getLocalIso(dt);
    if (nextIso <= todayIso) setSelectedDate(nextIso);
  };

  const parsedPhysicalCash =
    physicalCashInput.trim() !== ''
      ? Math.max(0, parseFloat(physicalCashInput) || 0)
      : null;
  const cashDifference =
    parsedPhysicalCash !== null ? parsedPhysicalCash - breakdown.cash : null;

  const handleSaveReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedPhysicalCash === null) return;
    onSaveCashReconciliation(
      selectedDate,
      parsedPhysicalCash,
      breakdown.cash,
      reconcileNote
    );
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="mt-3 space-y-2.5">
      {/* Date Selector & Total Collection Hero Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
              Daily Collection Summary
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-[22px] sm:text-[24px] font-extrabold text-[#191919] leading-none">
                ₹{breakdown.total.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-semibold text-[#15803D]">
                ({todayTransactions.length} transaction
                {todayTransactions.length === 1 ? '' : 's'})
              </span>
            </div>
          </div>

          {/* Date Controls */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl p-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="w-7 h-7 rounded-lg hover:bg-white text-[#52525B] flex items-center justify-center cursor-pointer"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              max={todayIso}
              onChange={(e) => {
                if (e.target.value && e.target.value <= todayIso) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="bg-transparent text-[11px] font-bold text-[#191919] px-1.5 py-0.5 focus:outline-hidden cursor-pointer"
            />
            <button
              type="button"
              onClick={() => shiftDate(1)}
              disabled={selectedDate >= todayIso}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                selectedDate >= todayIso
                  ? 'text-[#D1D5DB] cursor-not-allowed'
                  : 'hover:bg-white text-[#52525B] cursor-pointer'
              }`}
              aria-label="Next day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Comparison with Previous Day */}
        <div className="text-[11px] text-[#52525B] flex items-center justify-between pt-2 border-t border-[#F2EFE8]">
          <span>
            Previous Day ({formatDisplayDate(prevDateIso)}):{' '}
            <strong>₹{breakdown.prevTotal.toLocaleString('en-IN')}</strong>
          </span>
          {breakdown.hasPrevData || breakdown.total > 0 ? (
            <span
              className={`font-bold ${
                breakdown.total >= breakdown.prevTotal
                  ? 'text-[#15803D]'
                  : 'text-[#D97706]'
              }`}
            >
              {breakdown.total >= breakdown.prevTotal ? '+' : '-'}₹
              {Math.abs(breakdown.total - breakdown.prevTotal).toLocaleString(
                'en-IN'
              )}{' '}
              vs prev day
            </span>
          ) : (
            <span className="text-[#71717A]">No collections on prev day</span>
          )}
        </div>

        {/* Breakdown by Payment Method */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#CDEEDB]">
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-[#15803D]">
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash</span>
            </div>
            <div className="text-sm font-bold text-[#191919] mt-1">
              ₹{breakdown.cash.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-[#1D4ED8]">
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI</span>
            </div>
            <div className="text-sm font-bold text-[#191919] mt-1">
              ₹{breakdown.upi.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F3E8FF] border border-[#E9D5FF]">
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-[#7C3AED]">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card</span>
            </div>
            <div className="text-sm font-bold text-[#191919] mt-1">
              ₹{breakdown.card.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-[#B45309]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Bank / Other</span>
            </div>
            <div className="text-sm font-bold text-[#191919] mt-1">
              ₹{(breakdown.bank + breakdown.other).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Clear Financial Distinction Strip (Collections vs Pending Dues vs Day's Expenses) */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-[10.5px]">
          <div>
            <span className="text-[#71717A] block">Collected on Date</span>
            <strong className="text-[#15803D]">
              ₹{breakdown.total.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="border-x border-[#EAE5DC] pl-2">
            <span className="text-[#71717A] block">Day's Expenses</span>
            <strong className="text-[#191919]">
              ₹{selectedDayExpenses.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="pl-1">
            <span className="text-[#71717A] block">Gym Pending Dues</span>
            <strong className="text-[#DC2626]">
              ₹{totalPendingDues.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>

      {/* Optional Manual Cash Drawer Reconciliation */}
      <form
        onSubmit={handleSaveReconciliation}
        className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#191919]">
              Physical Cash Reconciliation (Optional)
            </h3>
            <p className="text-[10.5px] text-[#71717A]">
              Compare cash counted in drawer against recorded Cash collections (₹
              {breakdown.cash.toLocaleString('en-IN')})
            </p>
          </div>
          {savedNotice && (
            <span className="text-[10.5px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10.5px] font-semibold text-[#52525B] block mb-1">
              Physical Cash Counted (₹)
            </label>
            <input
              type="number"
              min="0"
              value={physicalCashInput}
              onChange={(e) => setPhysicalCashInput(e.target.value)}
              placeholder={`e.g. ${breakdown.cash}`}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#191919] focus:border-[#102A71] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="text-[10.5px] font-semibold text-[#52525B] block mb-1">
              Reconciliation Note (Optional)
            </label>
            <input
              type="text"
              value={reconcileNote}
              onChange={(e) => setReconcileNote(e.target.value)}
              placeholder="e.g. Evening drawer count by owner"
              className="w-full px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs text-[#191919] focus:border-[#102A71] focus:outline-hidden"
            />
          </div>
        </div>

        {cashDifference !== null && (
          <div
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              cashDifference === 0
                ? 'bg-[#ECFDF5] border-[#CDEEDB] text-[#15803D]'
                : cashDifference < 0
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
            }`}
          >
            <span>
              {cashDifference === 0
                ? 'Exact Match with Recorded Cash'
                : cashDifference < 0
                ? 'Cash Shortfall Detected'
                : 'Excess Cash in Drawer'}
            </span>
            <span>
              {cashDifference >= 0 ? '+' : '-'}₹
              {Math.abs(cashDifference).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <p className="text-[10px] text-[#71717A] flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            <span>
              Uses recorded app transactions & manual cash count (does not auto-read external UPI apps).
            </span>
          </p>
          <button
            type="submit"
            disabled={parsedPhysicalCash === null}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 ${
              parsedPhysicalCash !== null
                ? 'bg-[#102A71] text-white hover:bg-[#0D225D] cursor-pointer'
                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            Save Count
          </button>
        </div>
      </form>

      {/* Underlying Transactions for Selected Date */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#191919] px-0.5">
          Recorded Transactions on {formatDisplayDate(selectedDate)} (
          {todayTransactions.length})
        </h3>
        {todayTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#EAE5DC] p-5 text-center">
            <Receipt className="w-5 h-5 text-[#71717A] mx-auto mb-1.5" />
            <p className="text-xs font-bold text-[#191919]">
              No payment collections recorded for {formatDisplayDate(selectedDate)}
            </p>
            <button
              type="button"
              onClick={onRecordPayment}
              className="mt-2 px-3 py-1.5 rounded-xl bg-[#102A71] text-white text-[11px] font-bold cursor-pointer"
            >
              + Record Payment
            </button>
          </div>
        ) : (
          todayTransactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx.id)}
              className="bg-white rounded-xl border border-[#EAE5DC] p-2.5 flex items-center justify-between gap-2 hover:border-[#D5CFC2] cursor-pointer shadow-2xs"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#191919] break-normal">
                  {tx.memberName}{' '}
                  <span className="text-[10px] font-normal text-[#71717A]">
                    ({tx.receiptNumber || tx.id})
                  </span>
                </p>
                <p className="text-[10.5px] text-[#71717A]">
                  {tx.plan} · {tx.paymentMethod}{' '}
                  {tx.time ? `· ${tx.time}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-[#15803D] block">
                  +₹{tx.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#71717A]">Completed</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FEATURE 8: PAYMENT PROMISE TRACKER PANEL
// ============================================================================
interface PaymentPromiseTrackerProps {
  promises: PaymentPromise[];
  members: Member[];
  preselectedMemberForPromise: { memberId: string; amount: number } | null;
  onClearPreselectedPromise: () => void;
  onAddPromise: (data: {
    memberId: string;
    promisedAmount: number;
    promisedDate: string;
    note?: string;
  }) => void;
  onUpdatePromise: (promiseId: string, updates: Partial<PaymentPromise>) => void;
  onCancelPromise: (promiseId: string) => void;
  onRecordPaymentForMember: (memberId: string) => void;
  onOpenWhatsApp: (target: WhatsAppFollowUpTarget) => void;
}

export const PaymentPromiseTrackerPanel: React.FC<PaymentPromiseTrackerProps> = ({
  promises,
  members,
  preselectedMemberForPromise,
  onClearPreselectedPromise,
  onAddPromise,
  onUpdatePromise,
  onCancelPromise,
  onRecordPaymentForMember,
  onOpenWhatsApp,
}) => {
  const todayIso = useMemo(() => getLocalIso(), []);
  const [promiseFilter, setPromiseFilter] = useState<
    'all' | 'due_today' | 'overdue' | 'pending' | 'completed'
  >('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromiseId, setEditingPromiseId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [promisedAmount, setPromisedAmount] = useState<string>('');
  const [promisedDate, setPromisedDate] = useState<string>(todayIso);
  const [promiseNote, setPromiseNote] = useState<string>('');

  useEffect(() => {
    if (preselectedMemberForPromise) {
      setEditingPromiseId(null);
      setSelectedMemberId(preselectedMemberForPromise.memberId);
      setPromisedAmount(String(preselectedMemberForPromise.amount || ''));
      setPromisedDate(todayIso);
      setPromiseNote('');
      setIsFormOpen(true);
      onClearPreselectedPromise();
    }
  }, [preselectedMemberForPromise, todayIso, onClearPreselectedPromise]);

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const activePromises = useMemo(
    () =>
      promises
        .filter((p) => p.status !== 'cancelled')
        .map((p) => {
          const liveMember = memberMap.get(p.memberId);
          const liveOutstanding =
            liveMember !== undefined ? liveMember.pendingAmount : p.promisedAmount;
          let category: 'due_today' | 'overdue' | 'pending' | 'completed' = 'pending';
          if (p.status === 'completed' || (liveMember && liveMember.pendingAmount === 0)) {
            category = 'completed';
          } else if (p.promisedDate < todayIso) {
            category = 'overdue';
          } else if (p.promisedDate === todayIso) {
            category = 'due_today';
          } else {
            category = 'pending';
          }
          return {
            ...p,
            liveMember,
            liveOutstanding,
            category,
          };
        })
        .sort((a, b) => a.promisedDate.localeCompare(b.promisedDate)),
    [promises, memberMap, todayIso]
  );

  const counts = useMemo(() => {
    return {
      all: activePromises.length,
      due_today: activePromises.filter((p) => p.category === 'due_today').length,
      overdue: activePromises.filter((p) => p.category === 'overdue').length,
      pending: activePromises.filter((p) => p.category === 'pending').length,
      completed: activePromises.filter((p) => p.category === 'completed').length,
    };
  }, [activePromises]);

  const filteredPromises = useMemo(() => {
    if (promiseFilter === 'all') return activePromises;
    return activePromises.filter((p) => p.category === promiseFilter);
  }, [activePromises, promiseFilter]);

  const handleOpenAddPromise = () => {
    const firstDueMember =
      members.find((m) => (m.pendingAmount || 0) > 0) || members[0];
    setEditingPromiseId(null);
    setSelectedMemberId(firstDueMember?.id || '');
    setPromisedAmount(
      firstDueMember ? String(firstDueMember.pendingAmount || 2000) : '2000'
    );
    setPromisedDate(todayIso);
    setPromiseNote('');
    setIsFormOpen(true);
  };

  const handleOpenEditPromise = (p: PaymentPromise) => {
    setEditingPromiseId(p.id);
    setSelectedMemberId(p.memberId);
    setPromisedAmount(String(p.promisedAmount));
    setPromisedDate(p.promisedDate);
    setPromiseNote(p.note || '');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.max(0, parseFloat(promisedAmount) || 0);
    if (!selectedMemberId || amt <= 0 || !promisedDate) return;

    if (editingPromiseId) {
      onUpdatePromise(editingPromiseId, {
        promisedAmount: amt,
        promisedDate,
        note: promiseNote.trim() || undefined,
      });
    } else {
      onAddPromise({
        memberId: selectedMemberId,
        promisedAmount: amt,
        promisedDate,
        note: promiseNote.trim() || undefined,
      });
    }
    setIsFormOpen(false);
    setEditingPromiseId(null);
  };

  return (
    <div className="mt-3 space-y-2.5">
      {/* Header & Add Promise Button */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold text-[#191919]">
              Payment Promise Tracker
            </h2>
            <p className="text-[11px] text-[#71717A]">
              Track promised payment dates without altering actual balances until paid
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddPromise}
            className="px-3 py-1.5 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Promise</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {(
            [
              { id: 'all', label: `All (${counts.all})` },
              { id: 'due_today', label: `Due Today (${counts.due_today})` },
              { id: 'overdue', label: `Overdue (${counts.overdue})` },
              { id: 'pending', label: `Pending (${counts.pending})` },
              { id: 'completed', label: `Completed (${counts.completed})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPromiseFilter(tab.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                promiseFilter === tab.id
                  ? 'bg-[#102A71] text-white shadow-2xs'
                  : 'bg-[#FAF8F5] border border-[#EAE5DC] text-[#52525B] hover:bg-[#F2EFE8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add / Edit Promise Form Card */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white rounded-xl sm:rounded-2xl border border-[#102A71] p-3.5 shadow-md space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#191919]">
              {editingPromiseId ? 'Edit Payment Promise' : 'Record New Payment Promise'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-[#71717A] hover:text-[#191919] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10.5px] font-semibold text-[#52525B] block mb-1">
                Select Member
              </label>
              <select
                value={selectedMemberId}
                disabled={Boolean(editingPromiseId)}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedMemberId(id);
                  const mem = members.find((m) => m.id === id);
                  if (mem && mem.pendingAmount > 0) {
                    setPromisedAmount(String(mem.pendingAmount));
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#191919]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.memberCode || m.id}) — Due ₹
                    {(m.pendingAmount || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-[#52525B] block mb-1">
                Promised Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                required
                value={promisedAmount}
                onChange={(e) => setPromisedAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#191919]"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-[#52525B] block mb-1">
                Promised Date
              </label>
              <input
                type="date"
                required
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#191919]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10.5px] font-semibold text-[#52525B] block mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={promiseNote}
              onChange={(e) => setPromiseNote(e.target.value)}
              placeholder="e.g. Member promised to pay via UPI after salary credit"
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs text-[#191919]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#52525B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#102A71] text-white text-xs font-bold cursor-pointer"
            >
              {editingPromiseId ? 'Update Promise' : 'Save Promise'}
            </button>
          </div>
        </form>
      )}

      {/* Promises List */}
      {filteredPromises.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
          <Clock className="w-6 h-6 text-[#71717A] mx-auto mb-1.5" />
          <h4 className="text-xs font-bold text-[#191919]">
            No payment promises in this view
          </h4>
          <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
            When a member commits to paying their pending balance on a specific date, record it here to get timely reminders.
          </p>
        </div>
      ) : (
        filteredPromises.map((p) => {
          const phone = p.liveMember?.phone || p.memberPhone || '';
          const cleanPhone = phone.replace(/[^0-9]/g, '');

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-3 shadow-2xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-[14.5px] text-[#191919] break-normal">
                      {p.memberName}
                    </h3>
                    <span className="text-[10px] font-semibold text-[#71717A] bg-[#F4F1EA] px-1.5 py-0.5 rounded">
                      {p.memberCode || p.memberId}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#52525B] mt-0.5">
                    Promised Date:{' '}
                    <strong className="text-[#191919]">
                      {formatDisplayDate(p.promisedDate)}
                    </strong>{' '}
                    · +91 {phone || '—'}
                  </p>
                  {p.note && (
                    <p className="text-[11px] text-[#71717A] italic mt-0.5">
                      "{p.note}"
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {p.category === 'completed' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                      Completed
                    </span>
                  ) : p.category === 'overdue' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                      Overdue Promise
                    </span>
                  ) : p.category === 'due_today' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">
                      Due Today
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8]">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Promised Amount vs Live Outstanding Balance */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs">
                <div>
                  <span className="text-[10px] text-[#71717A] block">
                    Promised Amount
                  </span>
                  <strong className="text-[#102A71]">
                    ₹{p.promisedAmount.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="border-l border-[#EAE5DC] pl-2">
                  <span className="text-[10px] text-[#71717A] block">
                    Actual Balance Due
                  </span>
                  <strong
                    className={
                      p.liveOutstanding > 0 ? 'text-[#DC2626]' : 'text-[#15803D]'
                    }
                  >
                    ₹{p.liveOutstanding.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Actions */}
              {p.category !== 'completed' && (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="w-7.5 h-7.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center"
                      title={`Call ${p.memberName}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenWhatsApp({
                          personId: p.memberId,
                          personType: 'Member',
                          name: p.memberName,
                          phone,
                          planName: p.planName || p.liveMember?.membershipPlan,
                          pendingAmount: p.liveOutstanding,
                          promisedAmount: p.promisedAmount,
                          promisedDate: formatDisplayDate(p.promisedDate),
                          defaultCategory: 'promise',
                        })
                      }
                      className="w-7.5 h-7.5 rounded-lg bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center cursor-pointer"
                      title="Send WhatsApp reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditPromise(p)}
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[10.5px] font-semibold text-[#52525B] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelPromise(p.id)}
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[10.5px] font-semibold text-[#DC2626] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRecordPaymentForMember(p.memberId)}
                    className="px-3 py-1.5 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <IndianRupee className="w-3 h-3" />
                    <span>Record Payment</span>
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
