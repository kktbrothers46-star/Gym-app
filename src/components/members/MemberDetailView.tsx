/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  MessageCircle,
  CreditCard,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  TrendingUp,
  FileText,
  User,
  ShieldAlert,
  ChevronRight,
  Check,
  Plus,
  Edit2,
  Trash2,
  Archive,
  QrCode,
} from 'lucide-react';
import { Member, FollowUpItem } from '../../types/dashboard';
import {
  WhatsAppFollowUpModal,
  WhatsAppFollowUpTarget,
  WhatsAppTemplateCategory,
} from '../modals/WhatsAppFollowUpModal';

interface MemberDetailViewProps {
  member: Member;
  onBack: () => void;
  onRecordPayment: (memberId: string) => void;
  onRenewMembership: (memberId: string) => void;
  onMarkAttendance: (memberId: string, memberName: string) => void;
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onArchiveMember?: (memberId: string) => void;
  onAddFollowUp?: (
    memberId: string,
    data: { note: string; type: 'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment' }
  ) => void;
}

export const MemberDetailView: React.FC<MemberDetailViewProps> = ({
  member,
  onBack,
  onRecordPayment,
  onRenewMembership,
  onMarkAttendance,
  onUpdateMember,
  onArchiveMember,
  onAddFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payments' | 'fitness'>('overview');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCopiedPhone, setIsCopiedPhone] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<WhatsAppFollowUpTarget | null>(null);

  // New Follow-up form state
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpType, setFollowUpType] = useState<'Call' | 'WhatsApp' | 'In-Person' | 'Renewal' | 'Payment'>('Call');

  // Edit Notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState(member.notes || '');

  const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');

  const handleCopyPhone = () => {
    if (member.phone) {
      navigator.clipboard.writeText(member.phone);
      setIsCopiedPhone(true);
      setTimeout(() => setIsCopiedPhone(false), 2000);
    }
  };

  const handleMarkAttendanceClick = () => {
    onMarkAttendance(member.id, member.name);
    setAttendanceSuccess(true);
    setTimeout(() => setAttendanceSuccess(false), 2500);
  };

  const handleSaveNotes = () => {
    if (onUpdateMember) {
      onUpdateMember(member.id, { notes: noteContent });
    }
    setIsEditingNotes(false);
  };

  const handleAddFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNote.trim()) return;
    if (onAddFollowUp) {
      onAddFollowUp(member.id, { note: followUpNote.trim(), type: followUpType });
    }
    setFollowUpNote('');
    setIsAddingFollowUp(false);
  };

  // Membership & Payment Status Badges according to business logic
  const renderMembershipBadge = () => {
    switch (member.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Active
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Expiring ({member.daysUntilExpiry}d left)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            Expired
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F4F6] text-[#4B5563]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
            Inactive ({member.daysSinceLastVisit}d absent)
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Active (Due)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F4F6] text-[#4B5563]">
            Active
          </span>
        );
    }
  };

  const renderPaymentBadge = () => {
    if (member.pendingAmount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          Pending ₹{member.pendingAmount.toLocaleString('en-IN')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
        Paid
      </span>
    );
  };

  return (
    <div className="w-full pb-8 animate-in fade-in duration-200">
      {/* ============================================================== */}
      {/* A. HEADER: Back Button, "Member Details", More Menu            */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between py-2 sm:py-3 border-b border-[#EAE5DC] mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#191919] hover:text-[#1E3A8A] transition-colors p-1.5 -ml-1 rounded-lg hover:bg-black/5"
          aria-label="Back to Members directory"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Members</span>
        </button>

        <h1 className="text-base sm:text-lg font-bold text-[#191919] tracking-tight">
          Member Details
        </h1>

        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-8 h-8 rounded-lg border border-[#EAE5DC] bg-white hover:bg-[#FAF8F5] flex items-center justify-center text-[#71717A] hover:text-[#191919] transition-colors cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#EAE5DC] py-1 z-30 text-xs">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setIsEditingNotes(true);
                }}
                className="w-full px-3 py-2 text-left text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Edit Notes</span>
              </button>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleMarkAttendanceClick();
                }}
                className="w-full px-3 py-2 text-left text-[#191919] hover:bg-[#FAF8F5] flex items-center gap-2"
              >
                <QrCode className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Check-in Member</span>
              </button>
              {onArchiveMember && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (window.confirm(`Mark ${member.name} as inactive/archived?`)) {
                      onArchiveMember(member.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 border-t border-[#F2EFE8]"
                >
                  <Archive className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Archive Member</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Success Toast Notification */}
      {attendanceSuccess && (
        <div className="mb-3 p-2.5 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center gap-2 text-xs font-semibold text-[#15803D] animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>Attendance recorded successfully for {member.name}!</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* B. MEMBER PROFILE CARD (Page 3 reference styling)              */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 sm:p-4 shadow-2xs relative">
        <div className="flex items-start gap-3">
          {/* Avatar or Photo */}
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border border-[#EAE5DC] shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center font-bold text-xl shrink-0 border border-[#C7D2FE]">
              {member.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <h2 className="text-base sm:text-lg font-bold text-[#191919] break-words leading-tight">
                {member.name}
              </h2>
            </div>

            <p className="text-[11px] text-[#71717A] mt-0.5">
              ID: <span className="font-semibold text-[#191919]">{member.memberCode || member.id}</span>
              {member.gender ? ` · ${member.gender}` : ''}
              {member.emergencyContact ? ` · Emg: ${member.emergencyContact}` : ''}
            </p>

            {/* Separate Membership & Payment Status Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {renderMembershipBadge()}
              {renderPaymentBadge()}
            </div>
          </div>
        </div>

        {/* Contact Actions Row: Call, WhatsApp, Copy */}
        {cleanPhone && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F4F1EA]">
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold hover:bg-[#DBEAFE] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>

            <button
              type="button"
              onClick={() => {
                let tpl: WhatsAppTemplateCategory = 'renewal';
                if ((member.pendingAmount || 0) > 0) {
                  tpl = 'payment';
                } else if ((member.daysUntilExpiry ?? 99) <= 7) {
                  tpl = 'renewal';
                } else if ((member.daysSinceLastVisit ?? 0) >= 7) {
                  tpl = 'inactive';
                }
                setWhatsAppTarget({
                  personType: 'Member',
                  personId: member.id,
                  name: member.name,
                  phone: member.phone,
                  defaultCategory: tpl,
                  planName: member.membershipPlan,
                  expiryDate: member.expiryDate,
                  daysUntilExpiry: member.daysUntilExpiry,
                  pendingAmount: member.pendingAmount,
                  lastVisitDate: member.lastVisitDate,
                  daysSinceLastVisit: member.daysSinceLastVisit,
                });
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#ECFDF5] text-[#16A34A] text-[11px] font-bold hover:bg-[#D1FAE5] transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyPhone}
              className="px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-[#71717A] hover:text-[#191919] text-[11px] font-medium transition-colors cursor-pointer"
              title="Copy phone number"
            >
              {isCopiedPhone ? 'Copied!' : member.phone}
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* C. PRIMARY ACTION BUTTONS: Record Payment & Renew Membership   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-3">
        <button
          onClick={() => onRecordPayment(member.id)}
          className="py-2.5 px-3 bg-[#1E3A8A] hover:bg-[#163073] active:scale-98 text-white text-xs sm:text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Payment</span>
        </button>

        <button
          onClick={() => onRenewMembership(member.id)}
          className="py-2.5 px-3 bg-white hover:bg-[#FAF8F5] active:scale-98 text-[#1E3A8A] border-2 border-[#1E3A8A] text-xs sm:text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Renew Membership</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* D. SECTION NAVIGATION TABS: Overview / Attendance / Payments / Fitness */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1 mt-4 p-1 bg-[#EAE5DC]/60 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'payments', label: 'Payments' },
          { key: 'fitness', label: 'Fitness & Goals' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-[#71717A] hover:text-[#191919]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB CONTENT: Overview                                          */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="mt-3 space-y-3">
          {/* 1. Membership Summary Card */}
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2.5">
              Membership Information
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[11px] text-[#71717A] block">Current Plan</span>
                <span className="font-bold text-[#191919] mt-0.5 block truncate">
                  {member.membershipPlan}
                </span>
                <span className="text-[10px] text-[#2563EB] font-medium">
                  {member.planFee || '₹2,000 / month'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[11px] text-[#71717A] block">Validity Expiry</span>
                <span className="font-bold text-[#191919] mt-0.5 block">
                  {member.expiryDate}
                </span>
                <span className={`text-[10px] font-semibold ${
                  member.daysUntilExpiry <= 0
                    ? 'text-[#DC2626]'
                    : member.daysUntilExpiry <= 7
                    ? 'text-[#D97706]'
                    : 'text-[#16A34A]'
                }`}>
                  {member.daysUntilExpiry <= 0
                    ? `Expired ${Math.abs(member.daysUntilExpiry)}d ago`
                    : `${member.daysUntilExpiry} days remaining`}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[11px] text-[#71717A] block">Start / Enrolled Date</span>
                <span className="font-bold text-[#191919] mt-0.5 block">
                  {member.startDate || 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[11px] text-[#71717A] block">Assigned Trainer</span>
                <span className="font-bold text-[#191919] mt-0.5 block truncate">
                  {member.assignedTrainer || 'General Floor Trainer'}
                </span>
              </div>
            </div>

            {member.membershipHistory && member.membershipHistory.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-[#F2EFE8]">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#71717A] block mb-1.5">
                  Previous Membership Periods ({member.membershipHistory.length})
                </span>
                <div className="space-y-1.5">
                  {member.membershipHistory.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-2 rounded-lg bg-[#FAF8F5] border border-[#F2EFE8] flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-semibold text-[#191919]">{hist.planName}</span>
                        <span className="text-[#71717A] ml-1.5">
                          ({hist.startDate} → {hist.expiryDate})
                        </span>
                      </div>
                      <span className="font-bold text-[#16A34A]">{hist.planFee}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Outstanding Balance Warning / Paid Status */}
          {member.pendingAmount > 0 ? (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#DC2626]">
                    Pending Balance: ₹{member.pendingAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10.5px] text-[#71717A]">
                    Due for current membership subscription
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRecordPayment(member.id)}
                className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Collect
              </button>
            </div>
          ) : (
            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#15803D] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>All dues and membership fees are fully cleared.</span>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-md">
                ₹0 Due
              </span>
            </div>
          )}

          {/* 3. Follow-Ups & Communication Notes Section */}
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Follow-ups & Retention History
              </h3>
              <button
                onClick={() => setIsAddingFollowUp(!isAddingFollowUp)}
                className="text-[11px] font-bold text-[#1E3A8A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Log</span>
              </button>
            </div>

            {isAddingFollowUp && (
              <form onSubmit={handleAddFollowUpSubmit} className="mb-3 p-2.5 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={followUpType}
                    onChange={(e) => setFollowUpType(e.target.value as any)}
                    className="text-xs bg-white border border-[#EAE5DC] rounded-lg px-2 py-1"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Renewal">Renewal Pitch</option>
                    <option value="Payment">Payment Follow-up</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="E.g. Called member, confirmed renewing next Monday"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full text-xs bg-white border border-[#EAE5DC] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-[#1E3A8A]"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingFollowUp(false)}
                    className="px-2.5 py-1 text-[11px] text-[#71717A] hover:text-[#191919]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#1E3A8A] text-white text-[11px] font-bold rounded-lg"
                  >
                    Save Log
                  </button>
                </div>
              </form>
            )}

            {member.followUps && member.followUps.length > 0 ? (
              <div className="space-y-2">
                {member.followUps.map((flw) => (
                  <div key={flw.id} className="p-2 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8] flex items-start justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#1E3A8A] text-[11px] bg-[#E0E7FF] px-1.5 py-0.5 rounded">
                          {flw.type}
                        </span>
                        <span className="text-[10px] text-[#71717A]">{flw.date}</span>
                      </div>
                      <p className="text-[11.5px] text-[#191919] mt-1">{flw.note}</p>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-[#71717A]">
                No follow-up logs recorded yet. Tap "+ Add Log" after contacting member.
              </div>
            )}
          </div>

          {/* 4. Notes & Medical / Locker Info */}
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Member Notes & Preferences
              </h3>
              {!isEditingNotes ? (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-[11px] text-[#1E3A8A] font-semibold hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveNotes}
                  className="text-[11px] text-[#10B981] font-bold hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Save</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add special notes, locker number, fitness notes..."
                rows={3}
                className="w-full text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl p-2.5 focus:outline-hidden focus:border-[#1E3A8A]"
              />
            ) : (
              <p className="text-xs text-[#191919] leading-relaxed">
                {member.notes || 'No special notes or restrictions recorded for this member.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT: Attendance & Check-in History                     */}
      {/* ============================================================== */}
      {activeTab === 'attendance' && (
        <div className="mt-3 space-y-3">
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                  Attendance Summary
                </h3>
                <p className="text-[11px] text-[#71717A]">Current month's workout frequency</p>
              </div>

              <button
                onClick={handleMarkAttendanceClick}
                className="py-1.5 px-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mark Present</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[10px] text-[#71717A] uppercase block">This Month</span>
                <span className="text-base font-bold text-[#191919]">
                  {member.visitsThisMonth || 14} days
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[10px] text-[#71717A] uppercase block">Streak</span>
                <span className="text-base font-bold text-[#FF7418]">
                  {member.attendanceStreak || 4} days 🔥
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[10px] text-[#71717A] uppercase block">Last Visit</span>
                <span className="text-xs font-bold text-[#191919] truncate block mt-0.5">
                  {member.lastVisitDate}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Check-ins List */}
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2.5">
              Recent Check-in Logs
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { date: member.lastVisitDate || 'Today, 10:30 AM', type: 'QR Code at Turnstile', status: 'On-time' },
                { date: 'Yesterday, 06:15 PM', type: 'Manual Check-in', status: 'Evening Slot' },
                { date: '3 days ago, 07:00 AM', type: 'QR Code at Turnstile', status: 'Morning Slot' },
                { date: '5 days ago, 06:45 PM', type: 'QR Code at Turnstile', status: 'Evening Slot' },
              ].map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center font-bold text-[10px]">
                      IN
                    </div>
                    <div>
                      <span className="font-semibold text-[#191919] block">{log.date}</span>
                      <span className="text-[10px] text-[#71717A]">{log.type}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#10B981] bg-[#DCFCE7] px-2 py-0.5 rounded-md">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT: Payments History & Invoices                       */}
      {/* ============================================================== */}
      {activeTab === 'payments' && (
        <div className="mt-3 space-y-3">
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Payment Ledger
              </h3>
              <button
                onClick={() => onRecordPayment(member.id)}
                className="text-[11px] font-bold text-[#1E3A8A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Record New</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#191919]">
                    {member.membershipPlan} Subscription
                  </div>
                  <div className="text-[10px] text-[#71717A] mt-0.5">
                    Paid on {member.startDate || 'Enrollment'} · Membership Fee
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#10B981]">
                    + {member.planFee || '₹2,000'}
                  </div>
                  <span className="text-[9.5px] font-bold text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded">
                    Completed
                  </span>
                </div>
              </div>

              {member.pendingAmount > 0 && (
                <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#DC2626]">
                      Pending Balance Due
                    </div>
                    <div className="text-[10px] text-[#71717A] mt-0.5">
                      Installment pending
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#DC2626]">
                      ₹{member.pendingAmount.toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => onRecordPayment(member.id)}
                      className="text-[10px] font-bold text-white bg-[#DC2626] px-2 py-0.5 rounded mt-0.5"
                    >
                      Collect Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT: Fitness, Weight Tracking & Personal Goals         */}
      {/* ============================================================== */}
      {activeTab === 'fitness' && (
        <div className="mt-3 space-y-3">
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2.5">
              Member Fitness Overview
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[10.5px] text-[#71717A] block">Primary Goal</span>
                <span className="font-bold text-[#191919] mt-0.5 block truncate">
                  {member.fitnessGoal || 'Strength & Conditioning'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8]">
                <span className="text-[10.5px] text-[#71717A] block">Current Weight</span>
                <span className="font-bold text-[#191919] mt-0.5 block">
                  {member.weightProgress?.currentKg || 74.5} kg
                </span>
                <span className="text-[9.5px] text-[#10B981] font-medium">
                  -2.5 kg from baseline
                </span>
              </div>
            </div>

            <div className="mt-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F2EFE8] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-[#71717A]">Workout Routine</span>
              </div>
              <span className="font-bold text-[#191919]">Push / Pull / Legs (PPL)</span>
            </div>
          </div>
        </div>
      )}

      {/* One-Tap WhatsApp Follow-Up Modal */}
      <WhatsAppFollowUpModal
        isOpen={Boolean(whatsAppTarget)}
        target={whatsAppTarget}
        onClose={() => setWhatsAppTarget(null)}
        onConfirmSent={(payload) => {
          if (onAddFollowUp) {
            onAddFollowUp(member.id, {
              type: 'WhatsApp',
              note: `WhatsApp follow-up confirmed sent: "${payload.messageText.slice(0, 90)}${payload.messageText.length > 90 ? '...' : ''}"`,
            });
          }
          setWhatsAppTarget(null);
        }}
      />
    </div>
  );
};
