/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Check,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  Loader2,
  Paperclip,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types/dashboard';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (data: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    date?: string;
    paidTo?: string;
    paymentMethod?: Expense['paymentMethod'];
    status?: 'paid' | 'unpaid';
    notes?: string;
    receiptRef?: string;
  }) => void;
  initialExpense?: Expense | null;
  onUpdateExpense?: (expenseId: string, updates: Partial<Expense>) => void;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'Rent', label: 'Rent (Facility Lease)' },
  { value: 'Utilities', label: 'Utilities (Electricity, Water, WiFi)' },
  { value: 'Staff', label: 'Staff & Trainer Salaries' },
  { value: 'Maintenance', label: 'Equipment Repairs & Maintenance' },
  { value: 'Supplies', label: 'Cleaning & Gym Supplies' },
  { value: 'Marketing', label: 'Marketing & Promotions' },
  { value: 'Other', label: 'Other Expenses' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  initialExpense = null,
  onUpdateExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<
    'UPI' | 'Cash' | 'Card' | 'Bank Transfer'
  >('UPI');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('paid');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setIsSaving(false);

    if (initialExpense) {
      setTitle(initialExpense.title);
      setAmount(initialExpense.amount.toString());
      setCategory(
        initialExpense.category === 'Trainer Salaries'
          ? 'Staff'
          : initialExpense.category === 'Equipment'
          ? 'Maintenance'
          : initialExpense.category === 'Supplements'
          ? 'Supplies'
          : initialExpense.category
      );
      setDate(initialExpense.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(initialExpense.paymentMethod || 'UPI');
      setStatus(initialExpense.status || 'paid');
      setPaidTo(initialExpense.paidTo || '');
      setNotes(initialExpense.notes || '');
      setReceiptRef(initialExpense.receiptRef || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('Utilities');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setStatus('paid');
      setPaidTo('');
      setNotes('');
      setReceiptRef('');
    }
  }, [isOpen, initialExpense]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Please enter an expense description.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than ₹0.');
      return;
    }

    if (!date) {
      setErrorMsg('Please select a valid expense date.');
      return;
    }

    setErrorMsg(null);
    setIsSaving(true);

    setTimeout(() => {
      if (initialExpense && onUpdateExpense) {
        onUpdateExpense(initialExpense.id, {
          title: trimmedTitle,
          category,
          amount: parsedAmount,
          date,
          paidTo: paidTo.trim() || undefined,
          paymentMethod,
          status,
          notes: notes.trim() || undefined,
          receiptRef: receiptRef.trim() || undefined,
        });
      } else {
        onAddExpense({
          title: trimmedTitle,
          category,
          amount: parsedAmount,
          date,
          paidTo: paidTo.trim() || undefined,
          paymentMethod,
          status,
          notes: notes.trim() || undefined,
          receiptRef: receiptRef.trim() || undefined,
        });
      }
      setIsSaving(false);
      onClose();
    }, 220);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-bold text-[#191919] leading-tight">
                {initialExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <p className="text-[11px] text-[#71717A] leading-none mt-0.5">
                Track operating costs and vendor payments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          {/* 1. Expense Description */}
          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Expense Description *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. Gym Rent, Electricity Bill, Cable Repair"
              className="w-full px-3 py-2 text-xs sm:text-[13px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
            />
          </div>

          {/* 2. Amount & Category Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                Amount (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#71717A]">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="2500"
                  className="w-full pl-6.5 pr-2.5 py-2 text-xs sm:text-[13px] font-bold bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-2.5 py-2 text-xs sm:text-[13px] font-medium bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Expense Date & Payment Status */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                Expense Date *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#191919] mb-1">
                Payment Status
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[#FAF8F5] p-0.5 rounded-xl border border-[#E5E0D6]">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    status === 'paid'
                      ? 'bg-[#16A34A] text-white shadow-2xs'
                      : 'text-[#6B7280] hover:text-[#191919]'
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('unpaid')}
                  className={`py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    status === 'unpaid'
                      ? 'bg-[#D97706] text-white shadow-2xs'
                      : 'text-[#6B7280] hover:text-[#191919]'
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>
          </div>

          {/* 4. Payment Method */}
          <div>
            <label className="block text-[11px] font-semibold text-[#191919] mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold truncate transition-all cursor-pointer ${
                    paymentMethod === m
                      ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71] shadow-2xs'
                      : 'bg-white border-[#E5E0D6] text-[#4B5563] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {m === 'Bank Transfer' ? 'Bank' : m}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Vendor / Recipient & Receipt Attachment Ref */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10.5px] font-semibold text-[#71717A] mb-1">
                Vendor / Paid To (Optional)
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="e.g. BESCOM / Landlord"
                  className="w-full pl-8 pr-2.5 py-1.5 text-[11.5px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-[#71717A] mb-1">
                Bill / Receipt No. (Optional)
              </label>
              <div className="relative">
                <Paperclip className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  placeholder="e.g. INV-1042"
                  className="w-full pl-8 pr-2.5 py-1.5 text-[11.5px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block text-[10.5px] font-semibold text-[#71717A] mb-1">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add remarks or invoice details..."
                className="w-full pl-8 pr-2.5 py-1.5 text-[11.5px] bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#102A71]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-1.5 text-[11px] text-[#DC2626] font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D6] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-[#102A71] hover:bg-[#0D225D] active:scale-98 disabled:opacity-60 text-white font-semibold text-xs sm:text-[13px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialExpense ? 'Save Changes' : 'Save Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
