/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E5E0D5] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EAE5DC] flex items-center justify-between bg-[#FBF9F5]">
          <div className="flex items-center gap-2">
            {activeTab === 'privacy' ? (
              <ShieldCheck className="w-5 h-5 text-[#102A71]" />
            ) : (
              <FileText className="w-5 h-5 text-[#102A71]" />
            )}
            <h2
              id="legal-modal-title"
              className="text-base sm:text-lg font-bold text-[#191919]"
            >
              {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#191919] hover:bg-[#EAE5DC]/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[#EAE5DC] bg-white px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'border-[#102A71] text-[#102A71]'
                : 'border-transparent text-[#71717A] hover:text-[#191919]'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-[#102A71] text-[#102A71]'
                : 'border-transparent text-[#71717A] hover:text-[#191919]'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
          {activeTab === 'terms' ? (
            <>
              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  1. Agreement to Terms
                </h3>
                <p>
                  By accessing or registering with Gym Business OS, you agree to
                  be bound by these Terms of Service. If you are registering on
                  behalf of a fitness business or gym facility, you represent that
                  you have the authority to act on behalf of that entity.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  2. Business Use & Account Security
                </h3>
                <p>
                  Gym Business OS is intended for commercial and operational gym
                  management. You are responsible for safeguarding your login
                  credentials and maintaining the confidentiality of your account.
                  You must immediately notify us of any unauthorized use of your
                  credentials.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  3. Member Data & Compliance
                </h3>
                <p>
                  As a gym owner or administrator, you act as the data controller
                  for member information (names, contact numbers, membership dates,
                  and payment records) entered into the system. You agree to comply
                  with applicable local consumer protection, electronic payment,
                  and personal data privacy regulations.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  4. Billing & Financial Records
                </h3>
                <p>
                  Financial transaction logs, receipt numbers, and fee collection
                  histories created within the application serve as operational
                  records for your business. The platform does not directly process
                  card transactions or hold user funds; all payments are recorded
                  between your facility and your members.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  5. Termination & Data Portability
                </h3>
                <p>
                  You may export your business reports or discontinue using the
                  service at any time. Upon account closure, your gym-level records
                  are permanently removed or disassociated in accordance with our
                  data retention procedures.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  1. Information We Collect
                </h3>
                <p>
                  To provide secure gym operating software, we collect:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    <strong>Account Information:</strong> Owner name, email
                    address, and encrypted authentication tokens.
                  </li>
                  <li>
                    <strong>Gym Business Profile:</strong> Gym name, location,
                    currency, phone, address, and operating hours.
                  </li>
                  <li>
                    <strong>Operational Data:</strong> Member directories,
                    membership plans, attendance check-ins, payment receipts,
                    operating expenses, and prospective leads.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  2. Strict Gym-Level Data Isolation
                </h3>
                <p>
                  Every gym's data is strictly partitioned. Data access is enforced
                  by backend security rules verifying that only the authenticated
                  owner or designated gym staff can query, read, or modify documents
                  belonging to their gym identifier. No other gym or third party can
                  access your private business records.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  3. How We Use Data
                </h3>
                <p>
                  Your data is used solely to operate the dashboard, calculate
                  revenue metrics, track membership expiries, generate receipts,
                  and deliver operational notifications. We never sell, rent, or
                  monetize your business or member information.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  4. Data Security & Storage
                </h3>
                <p>
                  All data in transit is encrypted using industry-standard TLS
                  encryption, and data at rest is protected by Cloud Firestore
                  security infrastructure. Passwords are never stored in plaintext.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#191919] text-sm mb-1">
                  5. Your Rights & Contact
                </h3>
                <p>
                  You have the right to inspect, update, or request the deletion
                  of your account and associated gym records. For privacy inquiries,
                  contact the administrative support team via the in-app support
                  center.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAE5DC] bg-[#FBF9F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#102A71] text-white text-xs sm:text-sm font-semibold hover:bg-[#0A1D54] transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
