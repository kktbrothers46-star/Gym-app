/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Check } from 'lucide-react';
import { GymProfile } from '../../types/dashboard';

interface HeaderProps {
  gym: GymProfile;
  unreadNotificationsCount?: number;
  onUpdateGymName: (name: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onViewSplash: () => void;
  onOpenGymSettings?: () => void;
  onOpenHelpSupport?: () => void;
  onOpenStaffPermissions?: () => void;
  onOpenOnboarding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gym,
  unreadNotificationsCount = 0,
  onUpdateGymName,
  onOpenSearch,
  onOpenNotifications,
  onViewSplash,
  onOpenGymSettings,
  onOpenHelpSupport,
  onOpenStaffPermissions,
  onOpenOnboarding,
}) => {
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(gym.name);

  // Formatted current date from actual browser local clock
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleSaveGymName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onUpdateGymName(editedName.trim());
      setIsEditingName(false);
      setIsGymDropdownOpen(false);
    }
  };

  return (
    <header className="w-full flex items-center justify-between pt-2 pb-1.5 px-1 relative">
      {/* Left: Greeting & Gym Name */}
      <div className="flex flex-col">
        <span className="text-[#71717A] text-[12px] font-normal leading-none">
          Good Morning,
        </span>

        {/* Gym Name Selector */}
        <div className="relative mt-0.5">
          <button
            onClick={() => setIsGymDropdownOpen(!isGymDropdownOpen)}
            className="flex items-center gap-1.5 text-left group focus:outline-hidden"
            aria-expanded={isGymDropdownOpen}
            aria-label="Switch gym profile or edit name"
          >
            <h1 className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight group-hover:text-[#1E3A8A] transition-colors leading-tight">
              {gym.name}
            </h1>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#191919] transition-transform duration-200 ${
                isGymDropdownOpen ? 'rotate-180 text-[#1E3A8A]' : ''
              }`}
            />
          </button>

          {/* Gym Selector & Profile Dropdown */}
          {isGymDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#EAE5DC] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10.5px] font-semibold text-[#71717A] uppercase tracking-wider px-2 py-0.5">
                Active Branch Profile
              </div>

              {isEditingName ? (
                <form onSubmit={handleSaveGymName} className="mt-1.5 space-y-1.5 px-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs font-semibold border border-[#1E3A8A] rounded-lg focus:outline-hidden"
                    placeholder="Enter gym name..."
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-[#1E3A8A] text-white text-[11px] font-medium rounded-lg hover:bg-[#152F75]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-medium rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => setIsGymDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#F4F1EA] text-left"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#191919]">
                        {gym.name}
                      </div>
                      <div className="text-[11px] text-[#71717A]">{gym.location}</div>
                    </div>
                    <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  </button>

                  <div className="pt-1.5 border-t border-[#F2EFE8] flex items-center justify-between px-1.5">
                    <button
                      onClick={() => {
                        setEditedName(gym.name);
                        setIsEditingName(true);
                      }}
                      className="text-[11px] font-medium text-[#1E3A8A] hover:underline"
                    >
                      Rename Gym
                    </button>
                    <span className="text-[10px] text-[#71717A]">
                      Owner: {gym.ownerName}
                    </span>
                  </div>

                  {(onOpenGymSettings || onOpenStaffPermissions || onOpenHelpSupport) && (
                    <div className="pt-1.5 border-t border-[#F2EFE8] space-y-1">
                      {onOpenGymSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsGymDropdownOpen(false);
                            onOpenGymSettings();
                          }}
                          className="w-full px-2 py-1.5 rounded-lg text-left text-[11.5px] font-semibold text-[#191919] hover:bg-[#F4F1EA] flex items-center justify-between cursor-pointer"
                        >
                          <span>Gym Profile & Settings</span>
                          <span className="text-[10px] text-[#1E3A8A] font-bold">Configure</span>
                        </button>
                      )}
                      {onOpenStaffPermissions && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsGymDropdownOpen(false);
                            onOpenStaffPermissions();
                          }}
                          className="w-full px-2 py-1.5 rounded-lg text-left text-[11.5px] font-semibold text-[#191919] hover:bg-[#F4F1EA] flex items-center justify-between cursor-pointer"
                        >
                          <span>Staff & Permissions</span>
                          <span className="text-[10px] text-[#1E3A8A] font-bold">Manage</span>
                        </button>
                      )}
                      {onOpenHelpSupport && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsGymDropdownOpen(false);
                            onOpenHelpSupport();
                          }}
                          className="w-full px-2 py-1.5 rounded-lg text-left text-[11.5px] font-semibold text-[#191919] hover:bg-[#F4F1EA] flex items-center justify-between cursor-pointer"
                        >
                          <span>Help & Support</span>
                          <span className="text-[10px] text-[#1E3A8A] font-bold">FAQs & Help</span>
                        </button>
                      )}
                      {onOpenOnboarding && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsGymDropdownOpen(false);
                            onOpenOnboarding();
                          }}
                          className="w-full px-2 py-1.5 rounded-lg text-left text-[11.5px] font-semibold text-[#191919] hover:bg-[#F4F1EA] flex items-center justify-between cursor-pointer"
                        >
                          <span>Setup Onboarding</span>
                          <span className="text-[10px] text-[#16A34A] font-bold">7-Step Guide</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Subtitle */}
        <span className="text-[#71717A] text-[11.5px] font-normal leading-none mt-0.5">
          {formattedDate}
        </span>
      </div>

      {/* Right Actions: Search, Notifications, App Emblem */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search Action */}
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 rounded-full bg-[#EBE7DF] hover:bg-[#E2DDD3] active:scale-95 transition-all flex items-center justify-center text-[#191919]"
          aria-label="Search members and records"
          title="Search members"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification Action with Unread Dot */}
        <button
          onClick={onOpenNotifications}
          className="w-9 h-9 rounded-full bg-[#EBE7DF] hover:bg-[#E2DDD3] active:scale-95 transition-all flex items-center justify-center text-[#191919] relative cursor-pointer"
          aria-label={`View notifications (${unreadNotificationsCount} unread)`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {/* Unread indicator */}
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#EBE7DF]" />
          )}
        </button>

        {/* Brand Squircle Dumbbell Emblem (Can view splash screen on click) */}
        <button
          onClick={onViewSplash}
          className="w-9 h-9 rounded-xl bg-[#1E3A8A] hover:bg-[#163172] active:scale-95 transition-all flex items-center justify-center text-white shadow-xs group"
          aria-label="Gym Business OS Emblem (Click to preview Splash Screen)"
          title="View Splash Screen"
        >
          {/* Subtle dumbbell mark */}
          <svg
            className="w-4.5 h-4.5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-105"
            viewBox="0 0 100 100"
            fill="none"
          >
            <rect x="34" y="47" width="32" height="6" rx="3" fill="#FFFFFF" />
            <rect x="26" y="38" width="7" height="24" rx="3.5" fill="#FFFFFF" />
            <rect x="34" y="32" width="7.5" height="36" rx="3.75" fill="#FFFFFF" />
            <rect x="58.5" y="32" width="7.5" height="36" rx="3.75" fill="#FFFFFF" />
            <rect x="67" y="38" width="7" height="24" rx="3.5" fill="#FFFFFF" />
          </svg>
        </button>
      </div>
    </header>
  );
};
