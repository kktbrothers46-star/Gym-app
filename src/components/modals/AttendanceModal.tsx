/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, UserCheck } from 'lucide-react';
import { Member } from '../../types/dashboard';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onMarkAttendance: (memberId: string, memberName: string) => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  members,
  onMarkAttendance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lastCheckedIn, setLastCheckedIn] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckIn = (m: Member) => {
    onMarkAttendance(m.id, m.name);
    setLastCheckedIn(m.name);
    setTimeout(() => {
      setLastCheckedIn(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF7418] text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191919] leading-tight">
                Attendance Check-in
              </h3>
              <p className="text-[11px] text-[#71717A] leading-none mt-0.5">
                Reception check-in & QR scanner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {lastCheckedIn && (
          <div className="mt-2.5 p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-center gap-2 text-[11px] text-[#065F46] font-semibold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Checked in: {lastCheckedIn}</span>
          </div>
        )}

        {/* Search */}
        <div className="mt-2.5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member by name..."
            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl focus:outline-hidden focus:border-[#FF7418]"
          />
        </div>

        {/* Member List */}
        <div className="mt-2.5 flex-1 overflow-y-auto divide-y divide-[#F4F1EA] pr-1">
          {filtered.slice(0, 15).map((m) => (
            <div key={m.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs sm:text-sm text-[#191919]">{m.name}</div>
                <div className="text-[11px] text-[#71717A]">{m.membershipPlan} · Last: {m.lastVisitDate}</div>
              </div>
              <button
                onClick={() => handleCheckIn(m)}
                className="px-2.5 py-1 rounded-lg bg-[#FF7418] hover:bg-[#E8640C] text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <UserCheck className="w-3 h-3" />
                <span>Check In</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
