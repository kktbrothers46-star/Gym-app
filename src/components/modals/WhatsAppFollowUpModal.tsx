/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type WhatsAppTemplateCategory =
  | 'renewal'
  | 'payment'
  | 'lead'
  | 'inactive'
  | 'promise';

export interface WhatsAppFollowUpTarget {
  personId: string;
  personType: 'Member' | 'Lead';
  name: string;
  phone?: string;
  planName?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  pendingAmount?: number;
  lastVisitDate?: string;
  daysSinceLastVisit?: number;
  promisedAmount?: number;
  promisedDate?: string;
  defaultCategory: WhatsAppTemplateCategory;
  followUpTaskId?: string;
}

interface WhatsAppFollowUpModalProps {
  isOpen: boolean;
  target: WhatsAppFollowUpTarget | null;
  gymName?: string;
  upiId?: string;
  onClose: () => void;
  onConfirmSent?: (payload: {
    personId: string;
    personType: 'Member' | 'Lead';
    category: WhatsAppTemplateCategory;
    messageText: string;
    phoneUsed: string;
    followUpTaskId?: string;
  }) => void;
}

export function formatIndianPhoneForWhatsApp(rawPhone?: string): {
  clean10: string;
  waNumber: string;
  formattedDisplay: string;
  isValid: boolean;
} {
  const digits = (rawPhone || '').replace(/[^0-9]/g, '');
  let clean10 = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    clean10 = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    clean10 = digits.slice(1);
  } else if (digits.length > 10) {
    clean10 = digits.slice(-10);
  }

  const isValid = /^[6-9]\d{9}$/.test(clean10);
  const waNumber = isValid ? `91${clean10}` : '';
  const formattedDisplay = isValid
    ? `+91 ${clean10.slice(0, 5)} ${clean10.slice(5)}`
    : rawPhone || '';

  return {
    clean10,
    waNumber,
    formattedDisplay,
    isValid,
  };
}

function buildPreparedMessage(
  category: WhatsAppTemplateCategory,
  target: WhatsAppFollowUpTarget,
  gymName: string,
  upiId?: string
): string {
  const name = target.name || 'Member';
  const plan = target.planName || 'Membership Plan';
  const gym = gymName || 'our gym';

  switch (category) {
    case 'renewal': {
      const exp = target.expiryDate || 'soon';
      if (target.daysUntilExpiry !== undefined && target.daysUntilExpiry < 0) {
        return `Hi ${name}, your ${plan} at ${gym} expired on ${exp}. Let us know if you would like to renew your membership and continue your workouts!`;
      }
      if (target.daysUntilExpiry === 0) {
        return `Hi ${name}, a quick reminder from ${gym} — your ${plan} expires today (${exp}). Reply here or visit reception to renew seamlessly!`;
      }
      return `Hi ${name}, your ${plan} membership at ${gym} is due for renewal on ${exp}. Renew on time to keep your workout routine uninterrupted!`;
    }

    case 'payment': {
      const dueStr =
        target.pendingAmount && target.pendingAmount > 0
          ? `₹${target.pendingAmount.toLocaleString('en-IN')}`
          : 'your pending balance';
      const upiPart = upiId ? ` via UPI (${upiId}) or` : '';
      return `Hi ${name}, a gentle reminder from ${gym} regarding your pending balance of ${dueStr} for ${plan}. You can clear it${upiPart} at the gym reception. Thank you!`;
    }

    case 'inactive': {
      const visitNote =
        target.daysSinceLastVisit && target.daysSinceLastVisit > 0
          ? `it's been ${target.daysSinceLastVisit} days since your last check-in`
          : `we haven't seen you at the gym recently`;
      return `Hi ${name}, we missed seeing you at ${gym} (${visitNote})! Consistency is key to your fitness goals — let us know when we'll see you for your next workout.`;
    }

    case 'lead': {
      return `Hi ${name}, thank you for visiting ${gym}! Following up on your enquiry regarding our ${plan}. Let us know if you'd like to book a trial session or join this week!`;
    }

    case 'promise': {
      const prmAmt =
        target.promisedAmount && target.promisedAmount > 0
          ? `₹${target.promisedAmount.toLocaleString('en-IN')}`
          : target.pendingAmount && target.pendingAmount > 0
          ? `₹${target.pendingAmount.toLocaleString('en-IN')}`
          : 'your pending fee';
      const prmDate = target.promisedDate || 'today';
      return `Hi ${name}, a polite follow-up from ${gym} regarding your promised fee payment of ${prmAmt} scheduled for ${prmDate}. Please let us know once paid. Thank you!`;
    }
  }
}

export const WhatsAppFollowUpModal: React.FC<WhatsAppFollowUpModalProps> = ({
  isOpen,
  target,
  gymName = 'My Gym',
  upiId,
  onClose,
  onConfirmSent,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<WhatsAppTemplateCategory>('renewal');
  const [phoneInput, setPhoneInput] = useState('');
  const [messageText, setMessageText] = useState('');
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const [isConfirmedSent, setIsConfirmedSent] = useState(false);

  useEffect(() => {
    if (!isOpen || !target) return;
    setSelectedCategory(target.defaultCategory);
    setPhoneInput(target.phone || '');
    setMessageText(
      buildPreparedMessage(target.defaultCategory, target, gymName, upiId)
    );
    setHasOpenedWhatsApp(false);
    setIsConfirmedSent(false);
  }, [isOpen, target, gymName, upiId]);

  const phoneInfo = useMemo(
    () => formatIndianPhoneForWhatsApp(phoneInput),
    [phoneInput]
  );

  if (!isOpen || !target) return null;

  const handleCategorySwitch = (cat: WhatsAppTemplateCategory) => {
    setSelectedCategory(cat);
    setMessageText(buildPreparedMessage(cat, target, gymName, upiId));
  };

  const whatsappHref =
    phoneInfo.isValid && messageText.trim()
      ? `https://wa.me/${phoneInfo.waNumber}?text=${encodeURIComponent(
          messageText.trim()
        )}`
      : undefined;

  const handleConfirmLogged = () => {
    if (onConfirmSent) {
      onConfirmSent({
        personId: target.personId,
        personType: target.personType,
        category: selectedCategory,
        messageText: messageText.trim(),
        phoneUsed: phoneInfo.clean10 || phoneInput.trim(),
        followUpTaskId: target.followUpTaskId,
      });
    }
    setIsConfirmedSent(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#191919] leading-tight">
                One-Tap WhatsApp Follow-Up
              </h3>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                Review or edit message for {target.name} ({target.personType})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
            aria-label="Close WhatsApp modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {isConfirmedSent ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h4 className="text-sm font-bold text-[#191919]">
              Follow-Up Logged as Completed
            </h4>
            <p className="text-xs text-[#71717A]">
              Saved WhatsApp follow-up note for {target.name}.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {/* Template Category Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#191919] mb-1.5">
                Message Template
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(
                  [
                    { id: 'renewal', label: 'Renewal' },
                    { id: 'payment', label: 'Overdue Fee' },
                    { id: 'inactive', label: 'Inactive' },
                    { id: 'lead', label: 'New Lead' },
                    { id: 'promise', label: 'Promise Due' },
                  ] as Array<{ id: WhatsAppTemplateCategory; label: string }>
                ).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleCategorySwitch(tpl.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === tpl.id
                        ? 'bg-[#102A71] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] border border-[#EAE5DC] text-[#52525B] hover:bg-[#F2EFE8]'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Indian Phone Number Input & Validation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#191919] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#71717A]" />
                  <span>Recipient Mobile Number (India +91)</span>
                </label>
                {phoneInfo.isValid ? (
                  <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded">
                    Valid: {phoneInfo.formattedDisplay}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>Enter 10-digit number</span>
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="e.g. 9876543210"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold text-[#191919] focus:outline-hidden ${
                  phoneInfo.isValid
                    ? 'bg-[#FAF8F5] border-[#EAE5DC] focus:border-[#102A71]'
                    : 'bg-[#FEF2F2] border-[#FECACA] focus:border-[#DC2626]'
                }`}
              />
            </div>

            {/* Editable Message Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#191919] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#102A71]" />
                  <span>Personalized Message (Editable)</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setMessageText(
                      buildPreparedMessage(
                        selectedCategory,
                        target,
                        gymName,
                        upiId
                      )
                    )
                  }
                  className="text-[10.5px] font-semibold text-[#102A71] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset text</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write your WhatsApp follow-up message..."
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] focus:border-[#102A71] text-xs text-[#191919] leading-relaxed focus:outline-hidden resize-none"
              />
            </div>

            {/* Step 1: Open WhatsApp Click-to-Chat */}
            <div className="space-y-2 pt-1">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setHasOpenedWhatsApp(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 stroke-[2.3]" />
                  <span>Open WhatsApp with Prepared Message</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E5E7EB] text-[#9CA3AF] text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enter a valid 10-digit phone number to open WhatsApp</span>
                </button>
              )}

              {/* Step 2: Explicit Confirmation (Never mark completed automatically) */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  hasOpenedWhatsApp
                    ? 'bg-[#FFFBEB] border-[#FDE68A]'
                    : 'bg-[#FAF8F5] border-[#EAE5DC]'
                }`}
              >
                <p className="text-[10.5px] text-[#52525B] leading-snug">
                  <strong className="text-[#191919]">Note:</strong> Opening WhatsApp
                  does not automatically mark this follow-up as sent. Confirm below
                  only after sending the message in WhatsApp.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmLogged}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#102A71] hover:bg-[#0D225D] text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Message Sent & Log Follow-Up</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-1.5 px-3 rounded-lg bg-white border border-[#EAE5DC] text-[11px] font-semibold text-[#52525B] hover:bg-[#F2EFE8] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
