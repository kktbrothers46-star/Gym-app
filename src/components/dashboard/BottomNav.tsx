/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Users, Layers, CalendarCheck, CreditCard, BarChart3 } from 'lucide-react';

export type NavTab = 'home' | 'members' | 'plans' | 'attendance' | 'payments' | 'reports';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'members' as NavTab, label: 'Members', icon: Users },
    { id: 'plans' as NavTab, label: 'Plans', icon: Layers },
    { id: 'attendance' as NavTab, label: 'Attendance', icon: CalendarCheck },
    { id: 'payments' as NavTab, label: 'Payments', icon: CreditCard },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE5DC] px-1 py-0.5 sm:py-1 max-w-xl mx-auto safe-area-bottom shadow-xs h-[52px] sm:h-[54px] flex items-center justify-around"
      aria-label="Bottom Navigation"
    >
      <div className="w-full flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[44px] py-0.5 px-1 rounded-lg transition-all cursor-pointer focus:outline-hidden ${
                isActive
                  ? 'text-[#1E3A8A] font-bold'
                  : 'text-[#71717A] hover:text-[#191919] font-medium'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex flex-col items-center">
                <Icon
                  className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform ${
                    isActive ? 'text-[#1E3A8A] stroke-[2.3]' : 'text-[#71717A] stroke-[1.8]'
                  }`}
                />
              </div>
              <span className={`text-[10.5px] sm:text-[11px] mt-0.5 leading-none ${isActive ? 'text-[#1E3A8A] font-bold' : 'text-[#71717A] font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 bg-[#1E3A8A] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
