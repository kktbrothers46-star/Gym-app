/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Bell, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { GymNotificationItem } from '../../types/dashboard';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: GymNotificationItem[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications = [],
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-bold text-[#191919]">Gym Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs font-semibold text-[#191919]">No notifications yet</p>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Renewal reminders, payment alerts, and follow-ups will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto">
            {notifications.map((n) => {
              const Icon =
                n.priority === 'high'
                  ? AlertTriangle
                  : n.category === 'Renewal'
                  ? Calendar
                  : CheckCircle;
              const color =
                n.priority === 'high'
                  ? 'text-[#DC2626] bg-[#FEE2E2]'
                  : n.category === 'Renewal'
                  ? 'text-[#D97706] bg-[#FEF3C7]'
                  : 'text-[#16A34A] bg-[#DCFCE7]';
              return (
                <div
                  key={n.id}
                  className="p-2.5 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-start gap-2.5"
                >
                  <div
                    className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#191919] leading-tight">
                      {n.title}
                    </div>
                    <div className="text-[11px] text-[#71717A] mt-0.5 leading-snug">
                      {n.message}
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] mt-0.5">{n.timestamp}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
