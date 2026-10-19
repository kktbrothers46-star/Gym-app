/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserPlus, ArrowDownRight, QrCode, Receipt } from 'lucide-react';
import { RecentActivity } from '../../types/dashboard';

interface RecentActivityProps {
  activities: RecentActivity[];
  isEmptyState?: boolean;
}

export const RecentActivitySection: React.FC<RecentActivityProps> = ({
  activities,
  isEmptyState = false,
}) => {
  const getIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'payment_received':
        return <ArrowDownRight className="w-4 h-4 text-[#16A34A]" />;
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-[#7C3AED]" />;
      case 'attendance':
        return <QrCode className="w-4 h-4 text-[#2563EB]" />;
      case 'expense':
        return <Receipt className="w-4 h-4 text-[#D97706]" />;
      default:
        return <ArrowDownRight className="w-4 h-4 text-[#1E3A8A]" />;
    }
  };

  const getBadgeBg = (type: RecentActivity['type']) => {
    switch (type) {
      case 'payment_received':
        return 'bg-[#DCFCE7]';
      case 'member_joined':
        return 'bg-[#F3E8FF]';
      case 'attendance':
        return 'bg-[#DBEAFE]';
      case 'expense':
        return 'bg-[#FEF3C7]';
      default:
        return 'bg-[#E0E7FF]';
    }
  };

  return (
    <section className="w-full mt-3 mb-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <h2 className="text-[16px] sm:text-[17px] font-bold text-[#191919] tracking-tight">
          Recent Activity
        </h2>
        <span className="text-[10.5px] text-[#71717A] font-medium">Live Feed</span>
      </div>

      {/* Activity Card Container */}
      <div className="w-full bg-white border border-[#EAE5DC] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-2xs divide-y divide-[#F2EFE8]">
        {isEmptyState || activities.length === 0 ? (
          <div className="py-5 text-center text-[#71717A]">
            <p className="text-xs font-semibold text-[#191919]">No recent activity</p>
            <p className="text-[10.5px] mt-0.5">Actions you take will immediately show up in this timeline.</p>
          </div>
        ) : (
          activities.slice(0, 5).map((act) => (
            <div key={act.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Type Icon */}
                <div className={`w-7 h-7 rounded-md ${getBadgeBg(act.type)} flex items-center justify-center shrink-0`}>
                  {getIcon(act.type)}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-[#191919] truncate leading-tight">
                    {act.title}
                  </div>
                  <div className="text-[10.5px] text-[#71717A] truncate mt-0.5 leading-none">
                    {act.description}
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#A1A1AA] font-medium whitespace-nowrap">
                  {act.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
