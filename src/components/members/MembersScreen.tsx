/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  SlidersHorizontal,
  Users,
  UserCheck,
  ChevronRight,
  Phone,
  MessageCircle,
  Calendar,
  Dumbbell,
  BarChart2,
  X,
  ArrowUpDown,
  CheckCircle,
} from 'lucide-react';
import { Member } from '../../types/dashboard';
import { AdvancedFilterModal, AdvancedFilterOptions } from './AdvancedFilterModal';
import { MemberDetailView } from './MemberDetailView';

interface MembersScreenProps {
  members: Member[];
  onOpenAddMember: () => void;
  onRecordPayment: (memberId: string) => void;
  onRenewMembership?: (memberId: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
  onOpenRenewals?: () => void;
  onOpenLeads?: () => void;
  onOpenFollowUps?: () => void;
}

export const MembersScreen: React.FC<MembersScreenProps> = ({
  members,
  onOpenAddMember,
  onRecordPayment,
  onRenewMembership,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
  onOpenRenewals,
  onOpenLeads,
  onOpenFollowUps,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'expiry' | 'balance' | 'inactivity'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterOptions>({
    status: 'all',
    paymentStatus: 'all',
    plan: 'all',
    attendance: 'all',
    gender: 'all',
  });

  // Selected Member for Detail View (Page 3)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Keep selectedMember live from members list
  const activeMember = members.find((m) => m.id === selectedMemberId) || null;

  const handleOpenDetail = (member: Member) => {
    setSelectedMemberId(member.id);
  };

  const handleCloseDetail = () => {
    setSelectedMemberId(null);
  };

  // Total & Active counts
  const totalCount = members.length;
  const activeCount = members.filter(
    (m) => m.status === 'active' || m.status === 'expiring' || (m.status === 'pending' && m.daysUntilExpiry > 0)
  ).length;

  // Active advanced filters counter
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.status !== 'all') count++;
    if (advancedFilters.paymentStatus !== 'all') count++;
    if (advancedFilters.plan !== 'all') count++;
    if (advancedFilters.attendance !== 'all') count++;
    if (advancedFilters.gender !== 'all') count++;
    return count;
  }, [advancedFilters]);

  // Filter & Search Logic
  const filteredAndSortedMembers = useMemo(() => {
    return members
      .filter((m) => {
        // 1. Search Query (Name, Phone, or Member ID)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = m.name.toLowerCase().includes(q);
          const matchesPhone = m.phone.toLowerCase().includes(q);
          const matchesCode = (m.memberCode || m.id).toLowerCase().includes(q);
          if (!matchesName && !matchesPhone && !matchesCode) return false;
        }

        // 2. Primary Status Tab
        if (selectedStatusTab !== 'all') {
          if (selectedStatusTab === 'active' && m.status !== 'active') return false;
          if (selectedStatusTab === 'expiring' && m.status !== 'expiring') return false;
          if (selectedStatusTab === 'expired' && m.status !== 'expired') return false;
          if (selectedStatusTab === 'pending' && m.pendingAmount <= 0) return false;
          if (selectedStatusTab === 'inactive' && m.status !== 'inactive' && m.daysSinceLastVisit < 14) return false;
        }

        // 3. Advanced Filters
        if (advancedFilters.status !== 'all') {
          if (advancedFilters.status !== m.status) return false;
        }
        if (advancedFilters.paymentStatus === 'paid' && m.pendingAmount > 0) return false;
        if (advancedFilters.paymentStatus === 'pending' && m.pendingAmount <= 0) return false;
        if (advancedFilters.plan !== 'all' && !m.membershipPlan.toLowerCase().includes(advancedFilters.plan.toLowerCase())) {
          return false;
        }
        if (advancedFilters.attendance === 'absent_7' && m.daysSinceLastVisit <= 7) return false;
        if (advancedFilters.attendance === 'absent_14' && m.daysSinceLastVisit < 14) return false;
        if (advancedFilters.gender !== 'all' && m.gender !== advancedFilters.gender) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'expiry') return a.daysUntilExpiry - b.daysUntilExpiry;
        if (sortBy === 'balance') return b.pendingAmount - a.pendingAmount;
        if (sortBy === 'inactivity') return b.daysSinceLastVisit - a.daysSinceLastVisit;
        // default: 'recent'
        return 0;
      });
  }, [members, searchQuery, selectedStatusTab, advancedFilters, sortBy]);

  const getStatusBadge = (member: Member) => {
    if (member.pendingAmount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#FEECEB] text-[#DC2626]">
          <span className="text-[10px] leading-none">💳</span>
          <span>Pending ₹{member.pendingAmount.toLocaleString('en-IN')}</span>
        </span>
      );
    }
    switch (member.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#E8FAF0] text-[#16A34A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>Active</span>
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#FEF6E6] text-[#D97706]">
            <span className="text-[10px] leading-none">⏱</span>
            <span>Expiring</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#FEECEB] text-[#DC2626]">
            <span className="w-3 h-3 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[8px] font-bold">!</span>
            <span>Expired</span>
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#F1F3F6] text-[#4B5563]">
            <span className="text-[10px] leading-none">🌙</span>
            <span>Inactive</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#E8FAF0] text-[#16A34A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>Active</span>
          </span>
        );
    }
  };

  // If a member is selected, display the full Member Detail Screen (Page 3)
  if (activeMember) {
    return (
      <MemberDetailView
        member={activeMember}
        onBack={handleCloseDetail}
        onRecordPayment={onRecordPayment}
        onRenewMembership={(id) => {
          if (onRenewMembership) {
            onRenewMembership(id);
          }
        }}
        onMarkAttendance={onMarkAttendance}
        onUpdateMember={onUpdateMember}
        onArchiveMember={onArchiveMember}
        onAddFollowUp={onAddFollowUp}
      />
    );
  }

  return (
    <div className="w-full flex-1 pb-3">
      {/* ============================================================== */}
      {/* A. HEADER: Title, Subtitle, & "+ Add Member" Button            */}
      {/* ============================================================== */}
      <header className="w-full flex items-center justify-between pt-2.5 pb-2 px-0.5">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-[22px] sm:text-[24px] font-bold text-[#191919] tracking-tight leading-tight">
              Members
            </h1>
            {onOpenRenewals && (
              <button
                type="button"
                onClick={onOpenRenewals}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#D97706] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Open Renewals & Membership Expiry screen"
              >
                Renewals
              </button>
            )}
            {onOpenLeads && (
              <button
                type="button"
                onClick={onOpenLeads}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Open Leads screen"
              >
                Leads
              </button>
            )}
            {onOpenFollowUps && (
              <button
                type="button"
                onClick={onOpenFollowUps}
                className="px-2 py-0.5 rounded-full bg-white/80 hover:bg-white border border-[#EAE5DC] text-[10.5px] font-semibold text-[#4B5563] hover:text-[#102A71] transition-colors cursor-pointer"
                title="Open Follow-Ups screen"
              >
                Follow-Ups
              </button>
            )}
          </div>
          <p className="text-[#71717A] text-[12px] font-normal mt-0.5 leading-none">
            Manage your gym community
          </p>
        </div>

        {/* Prominent "+ Add Member" Button */}
        <button
          onClick={onOpenAddMember}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#102A71] hover:bg-[#0D225D] active:scale-95 text-white text-[12px] font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
          aria-label="Add Member"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Add Member</span>
        </button>
      </header>

      {/* ============================================================== */}
      {/* B. SEARCH & ADVANCED FILTER BAR                                */}
      {/* ============================================================== */}
      <div className="mt-1 flex items-center gap-2">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone or member ID"
            className="w-full pl-9 pr-7 py-2 text-[12.5px] bg-white border border-[#EAE5DC] rounded-xl text-[#191919] placeholder-[#8E8E93] focus:outline-hidden focus:border-[#102A71] shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#191919] p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsAdvancedFilterOpen(true)}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer relative shrink-0 ${
            activeFilterCount > 0
              ? 'bg-[#EFF6FF] border-[#102A71] text-[#102A71]'
              : 'bg-white border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
          }`}
          aria-label="Open advanced filter options"
          title="Filter options"
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
      {/* C. SUMMARY CARDS: Total Members & Active Members               */}
      {/* ============================================================== */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:gap-2.5">
        
        {/* Card 1: Total Members (Light soft blue tint background) */}
        <div className="bg-[#EBF1FE] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between border border-[#DCE6FC] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D6E3FD] text-[#2563EB] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[#4B5563] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
                Total Members
              </span>
              <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
                {totalCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] sm:text-[10.5px] text-[#6B7280] mt-1.5 block leading-none font-normal">
            All registered members
          </span>
        </div>

        {/* Card 2: Active Members (Light soft green tint background) */}
        <div className="bg-[#EAF7EE] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between border border-[#D5EEDC] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D2F2DB] text-[#16A34A] flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[#4B5563] text-[11px] sm:text-[11.5px] font-medium block leading-tight">
                Active Members
              </span>
              <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none mt-0.5">
                {activeCount}
              </div>
            </div>
          </div>
          <span className="text-[10px] sm:text-[10.5px] text-[#15803D] font-medium mt-1.5 block leading-none">
            Membership currently valid
          </span>
        </div>

      </div>

      {/* ============================================================== */}
      {/* D. MEMBERSHIP STATUS HORIZONTALLY SCROLLABLE ROW               */}
      {/* ============================================================== */}
      <div className="mt-3">
        <h2 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight mb-1.5 px-0.5">
          Membership Status
        </h2>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {[
            { id: 'all', label: 'All', dot: null },
            { id: 'active', label: 'Active', dot: '#16A34A' },
            { id: 'expiring', label: 'Expiring', dot: '#D97706' },
            { id: 'expired', label: 'Expired', dot: '#DC2626' },
            { id: 'pending', label: 'Pending', dot: '#EA580C' },
            { id: 'inactive', label: 'Inactive', dot: '#9CA3AF' },
          ].map((tab) => {
            const isSelected = selectedStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11.5px] sm:text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer snap-start ${
                  isSelected
                    ? 'bg-[#102A71] text-white shadow-2xs'
                    : 'bg-white border border-[#EAE5DC] text-[#191919] hover:bg-[#FAF8F5]'
                }`}
              >
                {tab.dot && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tab.dot }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* E. DIRECTORY HEADING & SORTING ROW                             */}
      {/* ============================================================== */}
      <div className="mt-3 mb-1.5 flex items-center justify-between relative px-0.5">
        <h3 className="text-[15px] sm:text-[16px] font-bold text-[#191919] tracking-tight">
          Members ({filteredAndSortedMembers.length})
        </h3>

        {/* Sort selector */}
        <div className="relative">
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-1 text-[11.5px] font-medium text-[#4B5563] hover:text-[#191919] cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 stroke-[2]" />
            <span>
              Sort by:{' '}
              <span className="font-semibold text-[#191919]">
                {sortBy === 'recent'
                  ? 'Recent'
                  : sortBy === 'name'
                  ? 'Name'
                  : sortBy === 'expiry'
                  ? 'Expiry'
                  : sortBy === 'balance'
                  ? 'Balance'
                  : 'Inactivity'}
              </span>
            </span>
            <span className="text-[9px] ml-0.5">▼</span>
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {[
                { id: 'recent', label: 'Recent' },
                { id: 'name', label: 'Name: A–Z' },
                { id: 'expiry', label: 'Expiry: Soonest' },
                { id: 'balance', label: 'Highest balance' },
                { id: 'inactivity', label: 'Least recent visit' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSortBy(s.id as any);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-[#FAF8F5] transition-colors flex items-center justify-between ${
                    sortBy === s.id ? 'text-[#102A71] font-bold bg-[#F4F1EA]' : 'text-[#191919]'
                  }`}
                >
                  <span>{s.label}</span>
                  {sortBy === s.id && <CheckCircle className="w-3 h-3 text-[#102A71]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* F. MEMBER CARDS LIST                                           */}
      {/* ============================================================== */}
      <div className="space-y-2 sm:space-y-2.5">
        {filteredAndSortedMembers.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-6 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] text-[#71717A] flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-[#191919]">No members found</h4>
            <p className="text-[11px] text-[#71717A] mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? `No members match "${searchQuery}". Check spelling or clear filters.`
                : 'No members match the selected status or filters.'}
            </p>
            {(searchQuery || selectedStatusTab !== 'all' || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusTab('all');
                  setAdvancedFilters({
                    status: 'all',
                    paymentStatus: 'all',
                    plan: 'all',
                    attendance: 'all',
                    gender: 'all',
                  });
                }}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] font-bold text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedMembers.map((m) => {
            const cleanPhone = m.phone.replace(/[^0-9]/g, '');

            return (
              <div
                key={m.id}
                onClick={() => handleOpenDetail(m)}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE5DC] p-2.5 sm:p-3 shadow-2xs hover:shadow-xs hover:border-[#D5CFC2] transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`View details for ${m.name}`}
              >
                {/* Top Row: Avatar, Identity, Status Badge, & Direct Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Circular Avatar Photo */}
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 border border-[#EAE5DC] shadow-2xs"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E0E7FF] text-[#102A71] font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-[#C7D2FE]">
                        {m.name.charAt(0)}
                      </div>
                    )}

                    {/* Name & ID / Phone */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-[13.5px] sm:text-[14px] text-[#191919] truncate leading-tight group-hover:text-[#102A71] transition-colors">
                        {m.name}
                      </h4>
                      <p className="text-[11px] text-[#71717A] mt-0.5 truncate leading-none font-normal">
                        ID: {m.memberCode || m.id} &nbsp;•&nbsp; {m.phone}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Status Badge + Call + WhatsApp + Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Status Pill */}
                    {getStatusBadge(m)}

                    {/* Direct Phone Call Button */}
                    <a
                      href={`tel:${cleanPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors"
                      title="Call member"
                      aria-label={`Call ${m.name}`}
                    >
                      <Phone className="w-3.5 h-3.5 stroke-[2.2]" />
                    </a>

                    {/* Direct WhatsApp Button */}
                    <a
                      href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(m.name)},%20greetings%20from%20MuscleFit%20Gym!`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-[#ECFDF5] text-[#16A34A] hover:bg-[#D1FAE5] flex items-center justify-center transition-colors"
                      title="WhatsApp message"
                      aria-label={`Send WhatsApp to ${m.name}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                    </a>

                    {/* Detail Chevron */}
                    <div className="w-3.5 h-3.5 flex items-center justify-center text-[#9CA3AF] group-hover:text-[#191919] transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  </div>
                </div>

                {/* Bottom Row: 3 Detail Columns (Plan, Expiry, Last Visit) */}
                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-[#F2EFE8]">
                  
                  {/* Col 1: Plan & Fee */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
                      <Dumbbell className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[#6B7280] text-[10px] block truncate leading-none font-normal">
                        {m.membershipPlan}
                      </span>
                      <span className="font-bold text-[#191919] text-[11.5px] truncate block mt-0.5 leading-none">
                        {m.planFee || '₹2,000 / month'}
                      </span>
                    </div>
                  </div>

                  {/* Col 2: Expiry Date */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                      <Calendar className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[#6B7280] text-[10px] block truncate leading-none font-normal">
                        {m.status === 'expired' ? 'Expired On' : 'Expires On'}
                      </span>
                      <span className="font-bold text-[#191919] text-[11.5px] truncate block mt-0.5 leading-none">
                        {m.expiryDate}
                      </span>
                    </div>
                  </div>

                  {/* Col 3: Last Visit */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                      <BarChart2 className="w-3 h-3 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[#6B7280] text-[10px] block truncate leading-none font-normal">
                        Last Visit
                      </span>
                      <span className="font-bold text-[#191919] text-[11.5px] truncate block mt-0.5 leading-none">
                        {m.lastVisitDate}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* MODALS: Advanced Filter Sheet                                  */}
      {/* ============================================================== */}
      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        filters={advancedFilters}
        onApply={(updated) => setAdvancedFilters(updated)}
        onReset={() =>
          setAdvancedFilters({
            status: 'all',
            paymentStatus: 'all',
            plan: 'all',
            attendance: 'all',
            gender: 'all',
          })
        }
      />
    </div>
  );
};
