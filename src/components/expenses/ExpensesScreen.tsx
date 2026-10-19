/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Wallet,
  BarChart3,
  PieChart,
  Home,
  Zap,
  Users,
  Wrench,
  ShoppingCart,
  Megaphone,
  MoreHorizontal,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Receipt,
  Edit2,
  Trash2,
  Building2,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types/dashboard';
import { getCurrentMonthLabel, getTodayIso, getDaysAgoIso } from '../../utils/dateUtils';

interface ExpensesScreenProps {
  expenses: Expense[];
  isEmptyState?: boolean;
  onOpenAddExpense: (expenseToEdit?: Expense | null) => void;
  onUpdateExpense?: (expenseId: string, updates: Partial<Expense>) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onSwitchToPayments?: () => void;
}

type CanonicalCategory =
  | 'All'
  | 'Rent'
  | 'Utilities'
  | 'Staff'
  | 'Maintenance'
  | 'Supplies'
  | 'Marketing'
  | 'Other';

// Normalize legacy store category labels into the canonical 7 categories
export function normalizeExpenseCategory(cat: ExpenseCategory): Exclude<CanonicalCategory, 'All'> {
  if (cat === 'Trainer Salaries' || cat === 'Staff') return 'Staff';
  if (cat === 'Equipment' || cat === 'Maintenance') return 'Maintenance';
  if (cat === 'Supplements' || cat === 'Supplies') return 'Supplies';
  if (cat === 'Rent') return 'Rent';
  if (cat === 'Utilities') return 'Utilities';
  if (cat === 'Marketing') return 'Marketing';
  return 'Other';
}

function formatExpenseDate(dateStr?: string): string {
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

function getCategoryVisuals(cat: Exclude<CanonicalCategory, 'All'>) {
  switch (cat) {
    case 'Rent':
      return {
        icon: <Home className="w-4 h-4 stroke-[2.2]" />,
        pillIcon: <Home className="w-3 h-3 text-[#2563EB] stroke-[2.3]" />,
        boxBg: 'bg-[#FEE2E2] text-[#EF4444]',
      };
    case 'Utilities':
      return {
        icon: <Zap className="w-4 h-4 stroke-[2.2]" />,
        pillIcon: <Zap className="w-3 h-3 text-[#F59E0B] stroke-[2.3]" />,
        boxBg: 'bg-[#FEF3C7] text-[#F59E0B]',
      };
    case 'Staff':
      return {
        icon: <Users className="w-4 h-4 stroke-[2.2]" />,
        pillIcon: <Users className="w-3 h-3 text-[#2563EB] stroke-[2.3]" />,
        boxBg: 'bg-[#DBEAFE] text-[#2563EB]',
      };
    case 'Maintenance':
      return {
        icon: <Wrench className="w-4 h-4 stroke-[2.2]" />,
        pillIcon: <Wrench className="w-3 h-3 text-[#16A34A] stroke-[2.3]" />,
        boxBg: 'bg-[#DCFCE7] text-[#16A34A]',
      };
    case 'Supplies':
      return {
        icon: <ShoppingCart className="w-4 h-4 stroke-[2.2]" />,
        pillIcon: <ShoppingCart className="w-3 h-3 text-[#7C3AED] stroke-[2.3]" />,
        boxBg: 'bg-[#F3E8FF] text-[#7C3AED]',
      };
    case 'Marketing':
      return {
        icon: <Megaphone className="w-4 h-4 stroke-[2.2]" />,
        pillIcon: <Megaphone className="w-3 h-3 text-[#F97316] stroke-[2.3]" />,
        boxBg: 'bg-[#FFEDD5] text-[#F97316]',
      };
    case 'Other':
    default:
      return {
        icon: <MoreHorizontal className="w-4 h-4 stroke-[2.2]" />,
        pillIcon: <MoreHorizontal className="w-3 h-3 text-[#6B7280] stroke-[2.3]" />,
        boxBg: 'bg-[#F3F4F6] text-[#4B5563]',
      };
  }
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenses,
  isEmptyState = false,
  onOpenAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onSwitchToPayments,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CanonicalCategory>('All');
  const currentMonthLong = useMemo(() => getCurrentMonthLabel(), []);
  const prevMonthLong = useMemo(() => {
    const now = new Date();
    return getCurrentMonthLabel(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  }, []);
  const currentMonthPrefix = useMemo(() => getTodayIso().slice(0, 7), []);
  const prevMonthPrefix = useMemo(() => {
    const now = new Date();
    return getTodayIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
  }, []);

  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>(() => getCurrentMonthLabel());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Advanced Filter & Sort Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [methodFilter, setMethodFilter] = useState<
    'all' | 'UPI' | 'Cash' | 'Card' | 'Bank Transfer'
  >('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>(
    'date_desc'
  );

  // Selected expense for detail/edit/delete sheet
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const effectiveExpenses = useMemo(
    () => (isEmptyState ? [] : expenses),
    [expenses, isEmptyState]
  );

  // Filter expenses by selected month for the Summary Cards & List
  const monthFilteredExpenses = useMemo(() => {
    return effectiveExpenses.filter((e) => {
      if (selectedMonthLabel === currentMonthLong) {
        return (e.date && e.date.startsWith(currentMonthPrefix)) || (e.month && e.month.toLowerCase().startsWith(currentMonthLong.slice(0, 3).toLowerCase()));
      }
      if (selectedMonthLabel === prevMonthLong) {
        return (e.date && e.date.startsWith(prevMonthPrefix)) || (e.month && e.month.toLowerCase().startsWith(prevMonthLong.slice(0, 3).toLowerCase()));
      }
      return true;
    });
  }, [effectiveExpenses, selectedMonthLabel, currentMonthLong, currentMonthPrefix, prevMonthLong, prevMonthPrefix]);

  // Real Summary Card Calculations from actual expense records
  const summaryStats = useMemo(() => {
    // Only recognize expenses that are not unpaid when calculating cash outflow totals, or recognize all for the selected period
    const recognizedMonthExpenses = monthFilteredExpenses.filter((e) => e.status !== 'unpaid');
    const monthTotal = recognizedMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Previous month total for valid comparison
    const prevMonthExpenses = effectiveExpenses.filter(
      (e) =>
        ((e.date && e.date.startsWith(prevMonthPrefix)) ||
          (e.month && e.month.toLowerCase().startsWith(prevMonthLong.slice(0, 3).toLowerCase()))) &&
        e.status !== 'unpaid'
    );
    const prevTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthDeltaPct =
      selectedMonthLabel === currentMonthLong && prevTotal > 0 && monthTotal > 0
        ? Math.round(((monthTotal - prevTotal) / prevTotal) * 100)
        : null;

    // Expenses This Week (last 7 days) vs Previous Week (7 days prior)
    const thisWeekStart = getDaysAgoIso(6);
    const prevWeekStart = getDaysAgoIso(13);
    const prevWeekEnd = getDaysAgoIso(7);

    const thisWeekExpenses = recognizedMonthExpenses.filter((e) => {
      if (!e.date) return false;
      return e.date >= thisWeekStart && e.date <= getTodayIso();
    });
    const prevWeekExpenses = effectiveExpenses.filter((e) => {
      if (!e.date || e.status === 'unpaid') return false;
      return e.date >= prevWeekStart && e.date <= prevWeekEnd;
    });

    const weekTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevWeekTotal = prevWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const weekDeltaPct =
      prevWeekTotal > 0 && weekTotal > 0
        ? Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100)
        : null;

    // Top Category for selected period
    const categoryTotals = new Map<string, number>();
    recognizedMonthExpenses.forEach((e) => {
      const cat = normalizeExpenseCategory(e.category);
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + e.amount);
    });

    let topCategoryName: string | null = null;
    let topCategoryAmount = 0;
    categoryTotals.forEach((amt, cat) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategoryName = cat;
      }
    });

    const topCategoryPct =
      monthTotal > 0 && topCategoryAmount > 0
        ? Math.round((topCategoryAmount / monthTotal) * 100)
        : null;

    return {
      monthTotal,
      monthDeltaPct,
      weekTotal,
      weekDeltaPct,
      topCategoryName,
      topCategoryPct,
    };
  }, [monthFilteredExpenses, effectiveExpenses, selectedMonthLabel]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (statusFilter !== 'all') c++;
    if (methodFilter !== 'all') c++;
    if (sortBy !== 'date_desc') c++;
    return c;
  }, [statusFilter, methodFilter, sortBy]);

  // Filtered and Sorted Expenses for Expense History
  const filteredAndSortedExpenses = useMemo(() => {
    return monthFilteredExpenses
      .filter((e) => {
        const canonicalCat = normalizeExpenseCategory(e.category);

        // 1. Search by description, category, or vendor
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchCat =
            canonicalCat.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
          const matchVendor = (e.paidTo || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCat && !matchVendor) return false;
        }

        // 2. Category Pill Filter
        if (selectedCategory !== 'All' && canonicalCat !== selectedCategory) {
          return false;
        }

        // 3. Status Filter
        const expStatus = e.status || 'paid';
        if (statusFilter !== 'all' && expStatus !== statusFilter) {
          return false;
        }

        // 4. Payment Method Filter
        if (methodFilter !== 'all' && (e.paymentMethod || 'UPI') !== methodFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount_asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [
    monthFilteredExpenses,
    searchQuery,
    selectedCategory,
    statusFilter,
    methodFilter,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setStatusFilter('all');
    setMethodFilter('all');
    setSortBy('date_desc');
  };

  const categoryPills: CanonicalCategory[] = [
    'All',
    'Rent',
    'Utilities',
    'Staff',
    'Maintenance',
    'Supplies',
    'Marketing',
    'Other',
  ];

  return (
    <div className="w-full flex-1 pb-3">
      {/* ============================================================== */}
      {/* A. HEADER: Title, Subtitle, & "+ Add Expense" Button           */}
      {/* ============================================================== */}
      <header className="w-full flex flex-wrap items-center justify-between gap-2 pt-2.5 pb-2 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
              Expenses
            </h1>
            {onSwitchToPayments && (
              <button
                type="button"
                onClick={onSwitchToPayments}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Switch to Member Payments"
              >
                ← Payments
              </button>
            )}
          </div>
          <p className="text-[#71717A] text-[12px] font-normal mt-0.5 leading-none">
            Track your gym&apos;s spending.
          </p>
        </div>

        {/* Primary "+ Add Expense" Action Button */}
        <button
          type="button"
          onClick={() => onOpenAddExpense(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-95 text-white text-[12px] font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          aria-label="Add Expense"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>
      </header>

      {/* ============================================================== */}
      {/* B. SEARCH & FILTER BAR                                         */}
      {/* ============================================================== */}
      <div className="mt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses, category or vendor"
            className="w-full pl-9 pr-7 py-2 text-[12.5px] bg-white border border-[#EAE5DC] rounded-xl text-[#191919] placeholder-[#8E8E93] focus:outline-hidden focus:border-[#102A71] shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#191919] p-0.5 rounded-full cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer relative shrink-0 ${
            activeFilterCount > 0
              ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71]'
              : 'bg-white border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
          }`}
          aria-label="Open expense filters"
          title="Filter and sort expenses"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#102A71] text-white text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* C. THREE SUMMARY CARDS                                         */}
      {/* ============================================================== */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {/* 1. Total Expenses This Month (Soft Rose/Red) */}
        <div className="bg-[#FDF2F2] border border-[#FADBD8] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FDE0E0] text-[#DC2626] flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10px] sm:text-[10.5px] font-medium block leading-tight">
              Total Expenses This Month
            </span>
            <div className="text-[17px] sm:text-[20px] font-bold text-[#191919] tracking-tight leading-none mt-1 truncate">
              ₹{summaryStats.monthTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10px] text-[#DC2626] font-medium mt-1.5 block leading-none truncate">
            {summaryStats.monthDeltaPct !== null
              ? `${summaryStats.monthDeltaPct > 0 ? '+' : ''}${summaryStats.monthDeltaPct}% from last month`
              : summaryStats.monthTotal > 0
              ? `${monthFilteredExpenses.length} records`
              : 'No expenses yet'}
          </span>
        </div>

        {/* 2. Expenses This Week (Soft Blue) */}
        <div className="bg-[#EEF5FF] border border-[#DBEAFE] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10px] sm:text-[10.5px] font-medium block leading-tight">
              Expenses This Week
            </span>
            <div className="text-[17px] sm:text-[20px] font-bold text-[#191919] tracking-tight leading-none mt-1 truncate">
              ₹{summaryStats.weekTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <span
            className={`text-[9.5px] sm:text-[10px] font-medium mt-1.5 block leading-none truncate ${
              summaryStats.weekDeltaPct !== null && summaryStats.weekDeltaPct <= 0
                ? 'text-[#16A34A]'
                : 'text-[#6B7280]'
            }`}
          >
            {summaryStats.weekDeltaPct !== null
              ? `${summaryStats.weekDeltaPct > 0 ? '+' : ''}${summaryStats.weekDeltaPct}% from last week`
              : summaryStats.weekTotal > 0
              ? 'Current week'
              : '₹0 this week'}
          </span>
        </div>

        {/* 3. Top Category (Soft Cream/Amber) */}
        <div
          onClick={() => {
            if (summaryStats.topCategoryName) {
              setSelectedCategory(
                selectedCategory === summaryStats.topCategoryName
                  ? 'All'
                  : (summaryStats.topCategoryName as CanonicalCategory)
              );
            }
          }}
          className="bg-[#FFF8EB] border border-[#F7E3B5] hover:border-[#F2D08B] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs cursor-pointer transition-colors"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FCE8B2] text-[#D97706] flex items-center justify-center shrink-0">
            <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>

          <div className="mt-2">
            <span className="text-[#4B5563] text-[10px] sm:text-[10.5px] font-medium block leading-tight">
              Top Category
            </span>
            <div className="text-[17px] sm:text-[20px] font-bold text-[#191919] tracking-tight leading-none mt-1 truncate">
              {summaryStats.topCategoryName || '—'}
            </div>
          </div>

          <span className="text-[9.5px] sm:text-[10px] text-[#D97706] font-semibold mt-1.5 block leading-none truncate">
            {summaryStats.topCategoryPct !== null
              ? `${summaryStats.topCategoryPct}% of total`
              : 'No data yet'}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* D. CATEGORY FILTER PILLS                                       */}
      {/* ============================================================== */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x">
        {categoryPills.map((cat) => {
          const isSelected = selectedCategory === cat;
          const visuals = cat !== 'All' ? getCategoryVisuals(cat) : null;

          return (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-[11.5px] font-semibold whitespace-nowrap transition-all cursor-pointer snap-start ${
                isSelected
                  ? 'bg-[#102A71] text-white shadow-2xs'
                  : 'bg-white border border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
              }`}
            >
              {!isSelected && visuals?.pillIcon}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* E. EXPENSE HISTORY HEADING & MONTH SELECTOR                    */}
      {/* ============================================================== */}
      <div className="mt-3 mb-2 flex items-center justify-between gap-2 px-0.5 relative">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight">
            Expense History ({filteredAndSortedExpenses.length})
          </h2>

          {(searchQuery || selectedCategory !== 'All' || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-[#102A71] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Month Selector Pill */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full bg-white border border-[#EAE5DC] hover:bg-[#FAF8F5] text-[11px] font-semibold text-[#191919] shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3 h-3 text-[#71717A]" />
            <span>{selectedMonthLabel}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isMonthDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {[currentMonthLong, prevMonthLong, 'All Months'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    setSelectedMonthLabel(m);
                    setIsMonthDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[#FAF8F5] flex items-center justify-between cursor-pointer ${
                    selectedMonthLabel === m
                      ? 'text-[#102A71] font-bold bg-[#F4F1EA]'
                      : 'text-[#191919]'
                  }`}
                >
                  <span>{m}</span>
                  {selectedMonthLabel === m && <Check className="w-3 h-3 text-[#102A71]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* F. COMPACT EXPENSE HISTORY ROWS                                */}
      {/* ============================================================== */}
      <div className="space-y-2">
        {effectiveExpenses.length === 0 ? (
          /* Empty Gym State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Wallet className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No expenses recorded yet</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              Add your first gym expense (rent, electricity, salaries, or repairs) to track spending.
            </p>
            <button
              type="button"
              onClick={() => onOpenAddExpense(null)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#102A71] text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              + Add First Expense
            </button>
          </div>
        ) : filteredAndSortedExpenses.length === 0 ? (
          /* Filtered Empty State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">
              {searchQuery
                ? 'No matching expenses found'
                : `No ${selectedCategory !== 'All' ? selectedCategory.toLowerCase() : ''} expenses for ${selectedMonthLabel}`}
            </h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? `No expense records match "${searchQuery}". Try searching by title, category, or vendor.`
                : 'Try selecting another category or clearing your active filters.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-bold text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredAndSortedExpenses.map((expense) => {
            const canonicalCat = normalizeExpenseCategory(expense.category);
            const visuals = getCategoryVisuals(canonicalCat);
            const formattedDate = formatExpenseDate(expense.date);
            const isUnpaid = expense.status === 'unpaid';

            return (
              <div
                key={expense.id}
                onClick={() => {
                  setSelectedExpense(expense);
                  setIsConfirmingDelete(false);
                }}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`View expense details for ${expense.title}`}
              >
                {/* Left: Category Icon + Description & Category */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${visuals.boxBg}`}
                  >
                    {visuals.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[13px] sm:text-[13.5px] text-[#191919] truncate leading-tight group-hover:text-[#102A71] transition-colors">
                      {expense.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-[#71717A] truncate leading-none">
                        {canonicalCat}
                      </span>
                      {isUnpaid && (
                        <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-[9.5px] font-semibold leading-none">
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Divider + Expense Date */}
                <div className="border-l border-[#F0ECE3] pl-2.5 sm:pl-3 shrink-0">
                  <span className="text-[11px] sm:text-[11.5px] text-[#6B7280] font-medium whitespace-nowrap">
                    {formattedDate}
                  </span>
                </div>

                {/* Right: Amount + Chevron */}
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#191919] whitespace-nowrap">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#191919] transition-colors shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* G. EXPENSE DETAIL & EDIT MODAL                                 */}
      {/* ============================================================== */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    getCategoryVisuals(normalizeExpenseCategory(selectedExpense.category)).boxBg
                  }`}
                >
                  {getCategoryVisuals(normalizeExpenseCategory(selectedExpense.category)).icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#191919] leading-tight">
                    {selectedExpense.title}
                  </h3>
                  <p className="text-[11px] text-[#71717A] leading-none mt-0.5">
                    {normalizeExpenseCategory(selectedExpense.category)} ·{' '}
                    {formatExpenseDate(selectedExpense.date)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
                aria-label="Close expense detail"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
                <span className="text-[#71717A] font-medium">Expense Amount</span>
                <span className="text-[18px] font-extrabold text-[#191919]">
                  ₹{selectedExpense.amount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">Status</span>
                {selectedExpense.status === 'unpaid' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FEF3C7] text-[#B45309]">
                    <Clock className="w-3 h-3" />
                    <span>Unpaid</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E6F8EE] text-[#15803D]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Paid</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#71717A]">Payment Method</span>
                <span className="font-semibold text-[#191919]">
                  {selectedExpense.paymentMethod || 'UPI'}
                </span>
              </div>

              {selectedExpense.paidTo && (
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">Vendor / Paid To</span>
                  <span className="font-semibold text-[#191919]">{selectedExpense.paidTo}</span>
                </div>
              )}

              {selectedExpense.receiptRef && (
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">Bill / Receipt Ref</span>
                  <span className="font-semibold text-[#191919]">
                    {selectedExpense.receiptRef}
                  </span>
                </div>
              )}

              {selectedExpense.notes && (
                <div className="pt-1.5 border-t border-[#EAE5DC] text-[11px] text-[#4B5563]">
                  <span className="font-semibold text-[#191919]">Note: </span>
                  {selectedExpense.notes}
                </div>
              )}
            </div>

            {isConfirmingDelete ? (
              <div className="mt-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                <p className="text-xs text-[#DC2626] font-semibold">
                  Delete &ldquo;{selectedExpense.title}&rdquo; (₹
                  {selectedExpense.amount.toLocaleString('en-IN')})?
                </p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-3 py-1 rounded-lg bg-white border border-[#EAE5DC] text-xs font-semibold text-[#4B5563] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteExpense) {
                        onDeleteExpense(selectedExpense.id);
                      }
                      setSelectedExpense(null);
                      setIsConfirmingDelete(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#DC2626] text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 flex flex-col gap-2">
                {selectedExpense.status === 'unpaid' && onUpdateExpense && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateExpense(selectedExpense.id, { status: 'paid' });
                      setSelectedExpense(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Paid</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const exp = selectedExpense;
                      setSelectedExpense(null);
                      onOpenAddExpense(exp);
                    }}
                    className="py-2 px-3 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Expense</span>
                  </button>

                  {onDeleteExpense ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="py-2 px-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedExpense(null)}
                      className="py-2 px-3 rounded-xl border border-[#EAE5DC] bg-white text-xs font-semibold text-[#4B5563] cursor-pointer"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* H. ADVANCED FILTER & SORT MODAL FOR EXPENSES                   */}
      {/* ============================================================== */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191919] leading-tight">
                    Filter & Sort Expenses
                  </h3>
                  <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                    Filter by status, payment method, or sort order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {/* Sort By */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'date_desc', label: 'Latest Date (Default)' },
                    { id: 'date_asc', label: 'Oldest Date' },
                    { id: 'amount_desc', label: 'Amount: High to Low' },
                    { id: 'amount_asc', label: 'Amount: Low to High' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setSortBy(opt.id as any)}
                      className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        sortBy === opt.id
                          ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#102A71]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Expense Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'paid', label: 'Paid Only' },
                    { id: 'unpaid', label: 'Unpaid Only' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setStatusFilter(opt.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-[11.5px] font-semibold transition-all cursor-pointer ${
                        statusFilter === opt.id
                          ? 'bg-[#102A71] text-white border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11.5px] font-bold text-[#191919] mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Modes' },
                    { id: 'UPI', label: 'UPI' },
                    { id: 'Cash', label: 'Cash' },
                    { id: 'Card', label: 'Card' },
                    { id: 'Bank Transfer', label: 'Bank Transfer' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setMethodFilter(opt.id as any)}
                      className={`py-1.5 px-2.5 rounded-xl border text-[11.5px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        methodFilter === opt.id
                          ? 'bg-[#EFF6FF] text-[#102A71] border-[#102A71]'
                          : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {methodFilter === opt.id && (
                        <Check className="w-3.5 h-3.5 text-[#102A71]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#F2EFE8] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setMethodFilter('all');
                  setSortBy('date_desc');
                  setIsFilterModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2 px-4 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
