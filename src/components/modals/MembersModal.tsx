/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, Phone, MessageSquare, AlertCircle, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Member } from '../../types/dashboard';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  initialFilter?: string;
  onRecordPaymentForMember: (memberId: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  isOpen,
  onClose,
  members,
  initialFilter = 'all',
  onRecordPaymentForMember,
  onMarkAttendance,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationSent, setNotificationSent] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    // Text search
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.membershipPlan.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'overdue') return m.pendingAmount > 0;
    if (activeFilter === 'expiring')
      return m.status === 'expiring' || (m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 7);
    if (activeFilter === 'inactive') return m.status === 'inactive' || m.daysSinceLastVisit >= 14;
    if (activeFilter === 'active') return m.status === 'active' || m.status === 'expiring';
    return true;
  });

  const handleSendReminder = (m: Member) => {
    setNotificationSent(`WhatsApp reminder dispatched to ${m.name}`);
    setTimeout(() => setNotificationSent(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#191919] leading-tight">
              Member Directory
            </h3>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Showing {filteredMembers.length} members
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {notificationSent && (
          <div className="mt-2 p-2 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-[11px] text-[#15803D] font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>{notificationSent}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: 'all', label: `All (${members.length})` },
            { id: 'active', label: 'Active' },
            { id: 'overdue', label: 'Overdue Dues' },
            { id: 'expiring', label: 'Expiring ≤ 7d' },
            { id: 'inactive', label: 'Inactive ≥ 14d' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-[#F4F1EA] text-[#71717A] hover:text-[#191919]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mt-0.5">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, plan..."
            className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
          />
        </div>

        {/* Members List */}
        <div className="mt-2.5 flex-1 overflow-y-auto divide-y divide-[#F2EFE8] pr-1">
          {filteredMembers.length === 0 ? (
            <div className="py-8 text-center text-[#71717A]">
              <p className="text-xs font-semibold text-[#191919]">No members found</p>
              <p className="text-[11px] mt-0.5">Try switching the filter or clear your search.</p>
            </div>
          ) : (
            filteredMembers.map((m) => (
              <div key={m.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-[13.5px] text-[#191919]">{m.name}</span>
                    {m.pendingAmount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#EF4444] text-[10px] font-bold flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Pending ₹{m.pendingAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                    {m.status === 'expiring' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        Expires in {m.daysUntilExpiry}d
                      </span>
                    )}
                    {m.status === 'inactive' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#E0E7FF] text-[#3730A3] text-[10px] font-bold flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {m.daysSinceLastVisit}d absent
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#71717A] mt-0.5">
                    {m.membershipPlan} · {m.phone} · Last visit: {m.lastVisitDate}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.pendingAmount > 0 ? (
                    <button
                      onClick={() => onRecordPaymentForMember(m.id)}
                      className="px-2 py-1 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
                    >
                      Collect ₹{m.pendingAmount}
                    </button>
                  ) : (
                    <button
                      onClick={() => onMarkAttendance(m.id, m.name)}
                      className="px-2 py-1 rounded-lg bg-[#FF7418] hover:bg-[#E8640C] text-white text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
                    >
                      Check In
                    </button>
                  )}

                  <button
                    onClick={() => handleSendReminder(m)}
                    className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D6] hover:bg-[#EBE7DF] text-[#191919] cursor-pointer"
                    title="Send WhatsApp notice"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#16A34A]" />
                  </button>

                  <a
                    href={`tel:${m.phone}`}
                    className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D6] hover:bg-[#EBE7DF] text-[#191919] cursor-pointer"
                    title="Call member"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
