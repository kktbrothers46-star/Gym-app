/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Calendar,
  CreditCard,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Member } from '../../types/dashboard';

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (memberId: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  onRecordPayment,
  onMarkAttendance,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen || !member) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(member.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getStatusBadge = () => {
    switch (member.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Active
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Expiring ({member.daysUntilExpiry}d left)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            Expired
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#DC2626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            Pending ₹{member.pendingAmount.toLocaleString('en-IN')}
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#4B5563]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
            Inactive ({member.daysSinceLastVisit}d absent)
          </span>
        );
      default:
        return null;
    }
  };

  const cleanPhone = member.phone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-4.5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header Close */}
        <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE8]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
            Member Profile
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Identity Section */}
        <div className="mt-3 flex items-start gap-3">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#EAE5DC] shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center font-bold text-lg shrink-0">
              {member.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="text-base font-bold text-[#191919] truncate leading-tight">
                {member.name}
              </h3>
              {getStatusBadge()}
            </div>

            <p className="text-[11px] text-[#71717A] mt-0.5">
              ID: {member.memberCode || member.id} {member.gender ? `· ${member.gender}` : ''}
            </p>

            {/* Direct Contact Bar */}
            <div className="flex items-center gap-1.5 mt-2">
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-[11px] font-semibold hover:bg-[#DBEAFE] transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>

              <a
                href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(member.name)},%20greetings%20from%20MuscleFit%20Gym!`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#16A34A] text-[11px] font-semibold hover:bg-[#D1FAE5] transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={handleCopyPhone}
                className="px-2 py-1 rounded-lg bg-[#F4F1EA] text-[#71717A] text-[11px] font-medium hover:text-[#191919]"
                title="Copy phone"
              >
                {copiedPhone ? 'Copied!' : member.phone}
              </button>
            </div>
          </div>
        </div>

        {/* Membership Details Card */}
        <div className="mt-3.5 p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A] flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-[#7C3AED]" />
              Membership Plan
            </span>
            <span className="font-bold text-[#191919]">{member.membershipPlan}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#10B981]" />
              Plan Price
            </span>
            <span className="font-bold text-[#191919]">{member.planFee || '₹2,000 / month'}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              Validity Expiry
            </span>
            <span className="font-bold text-[#191919]">{member.expiryDate}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0284C7]" />
              Last Visit
            </span>
            <span className="font-bold text-[#191919]">{member.lastVisitDate}</span>
          </div>
        </div>

        {/* Financial Balance Callout */}
        {member.pendingAmount > 0 ? (
          <div className="mt-3 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#EF4444]" />
              <div>
                <div className="text-xs font-bold text-[#EF4444]">
                  Pending Balance: ₹{member.pendingAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#71717A]">Due for current membership period</div>
              </div>
            </div>
            <button
              onClick={() => {
                onRecordPayment(member.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold cursor-pointer shadow-2xs"
            >
              Collect
            </button>
          </div>
        ) : (
          <div className="mt-3 p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#15803D]">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>All membership fees are fully cleared.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              onMarkAttendance(member.id, member.name);
              onClose();
            }}
            className="py-2.5 px-3 bg-[#FF7418] hover:bg-[#E8640C] active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => {
              onRecordPayment(member.id);
              onClose();
            }}
            className="py-2.5 px-3 bg-[#1E3A8A] hover:bg-[#163073] active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>

      </div>
    </div>
  );
};
