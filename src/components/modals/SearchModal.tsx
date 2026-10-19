/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, User } from 'lucide-react';
import { Member } from '../../types/dashboard';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSelectMember: (member: Member) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  members,
  onSelectMember,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = query.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.phone.includes(query) ||
          m.membershipPlan.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <h3 className="text-base font-bold text-[#191919]">Search Gym Business OS</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative mt-2.5">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type member name, phone number, or plan..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#1E3A8A]"
          />
        </div>

        <div className="mt-2.5 flex-1 overflow-y-auto divide-y divide-[#F4F1EA]">
          {query.trim() === '' ? (
            <div className="py-6 text-center text-xs text-[#71717A]">
              Quickly find any member, phone number, or active plan.
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#71717A]">
              No members matched "{query}".
            </div>
          ) : (
            results.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMember(m);
                  onClose();
                }}
                className="py-2 px-2 hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[#191919] leading-tight">{m.name}</div>
                    <div className="text-[11px] text-[#71717A]">{m.membershipPlan} · {m.phone}</div>
                  </div>
                </div>
                {m.pendingAmount > 0 && (
                  <span className="text-[11px] font-bold text-[#EF4444]">
                    Due ₹{m.pendingAmount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
