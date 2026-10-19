/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Bell,
  CheckCheck,
  Settings,
  Search,
  X,
  RotateCcw,
  IndianRupee,
  AlertTriangle,
  Phone,
  CalendarCheck,
  Users,
  TrendingUp,
  MessageCircle,
  Check,
  ArrowRight,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  GymNotificationItem,
  NotificationCategory,
  Member,
  GymProfile,
  GymSettings,
} from '../../types/dashboard';
import { ReportTabType } from '../reports/RetentionReportScreen';

interface NotificationsScreenProps {
  notifications: GymNotificationItem[];
  members: Member[];
  gym: GymProfile;
  settings: GymSettings;
  isEmptyState: boolean;
  onBack: () => void;
  onSelectReportTab?: (tab: ReportTabType) => void;
  onMarkRead: (id: string) => void;
  onToggleRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismissNotification: (id: string) => void;
  onOpenSettings: () => void;
  onPerformAction: (notification: GymNotificationItem) => void;
}

type FilterTab =
  | 'All'
  | 'Unread'
  | 'Renewal'
  | 'Payment'
  | 'Follow-Up'
  | 'Attendance'
  | 'Staff';

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  members,
  gym,
  settings,
  isEmptyState,
  onBack,
  onSelectReportTab,
  onMarkRead,
  onToggleRead,
  onMarkAllRead,
  onDismissNotification,
  onOpenSettings,
  onPerformAction,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const effectiveNotifications = useMemo(
    () => (isEmptyState ? [] : notifications || []),
    [isEmptyState, notifications]
  );

  const unreadCount = useMemo(
    () => effectiveNotifications.filter((n) => !n.isRead).length,
    [effectiveNotifications]
  );

  const urgentCount = useMemo(
    () =>
      effectiveNotifications.filter((n) => n.priority === 'high' && !n.isRead)
        .length,
    [effectiveNotifications]
  );

  const todayCount = useMemo(
    () => effectiveNotifications.filter((n) => n.dateGroup === 'Today').length,
    [effectiveNotifications]
  );

  const filteredNotifications = useMemo(() => {
    return effectiveNotifications.filter((item) => {
      if (activeFilter === 'Unread' && item.isRead) return false;
      if (
        activeFilter !== 'All' &&
        activeFilter !== 'Unread' &&
        item.category !== activeFilter
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchMsg = item.message.toLowerCase().includes(q);
        const matchMember = (item.memberName || '').toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchMember && !matchCat) return false;
      }

      return true;
    });
  }, [effectiveNotifications, activeFilter, searchQuery]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<'Today' | 'Yesterday' | 'Earlier', GymNotificationItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    filteredNotifications.forEach((n) => {
      const grp = n.dateGroup || 'Today';
      groups[grp].push(n);
    });
    return groups;
  }, [filteredNotifications]);

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      showToast('All notifications are already marked as read.');
      return;
    }
    onMarkAllRead();
    showToast('Marked all notifications as read.');
  };

  const handleSendWhatsAppForNotification = (item: GymNotificationItem) => {
    const targetMember = item.memberId
      ? members.find((m) => m.id === item.memberId)
      : undefined;
    const phoneDigits = (targetMember?.phone || gym.phone || '9876543210').replace(
      /\D/g,
      ''
    );
    const fullPhone =
      phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

    let template =
      item.category === 'Payment'
        ? settings.whatsappPaymentTemplate
        : settings.whatsappRenewalTemplate;

    const messageText = (
      template ||
      `Hi {member_name}, this is a reminder from ${gym.name} regarding your membership.`
    )
      .replace('{member_name}', targetMember?.name || item.memberName || 'Member')
      .replace('{plan_name}', targetMember?.membershipPlan || 'Gym Membership')
      .replace('{gym_name}', gym.name)
      .replace('{expiry_date}', targetMember?.expiryDate || 'soon')
      .replace(
        '{pending_amount}',
        String(targetMember?.pendingAmount || item.amount || 0)
      )
      .replace('{upi_id}', settings.upiId || 'musclefitgym@okaxis');

    onMarkRead(item.id);
    showToast(
      `Prepared WhatsApp message for ${targetMember?.name || item.memberName || 'Member'}`
    );
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(messageText)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryVisuals = (item: GymNotificationItem) => {
    if (item.category === 'Renewal') {
      return {
        icon: <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />,
        iconBg: 'bg-[#FEF3C7]',
        badgeBg: 'bg-[#FEF3C7] text-[#B45309]',
        badgeLabel: item.priority === 'high' ? 'Expiring Soon' : 'Renewal',
      };
    }
    if (item.category === 'Payment') {
      const isOverdueOrDue = item.priority === 'high' || item.priority === 'medium';
      return {
        icon: isOverdueOrDue ? (
          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
        ) : (
          <IndianRupee className="w-3.5 h-3.5 text-[#16A34A]" />
        ),
        iconBg: isOverdueOrDue ? 'bg-[#FEE2E2]' : 'bg-[#DCFCE7]',
        badgeBg: isOverdueOrDue
          ? 'bg-[#FEE2E2] text-[#B91C1C]'
          : 'bg-[#DCFCE7] text-[#15803D]',
        badgeLabel:
          item.priority === 'high'
            ? 'Overdue'
            : item.priority === 'medium'
            ? 'Balance Due'
            : 'Paid',
      };
    }
    if (item.category === 'Follow-Up') {
      return {
        icon: <Phone className="w-3.5 h-3.5 text-[#2563EB]" />,
        iconBg: 'bg-[#DBEAFE]',
        badgeBg: 'bg-[#DBEAFE] text-[#1D4ED8]',
        badgeLabel: 'Follow-Up',
      };
    }
    if (item.category === 'Attendance') {
      return {
        icon: <CalendarCheck className="w-3.5 h-3.5 text-[#7C3AED]" />,
        iconBg: 'bg-[#F3E8FF]',
        badgeBg: 'bg-[#F3E8FF] text-[#6D28D9]',
        badgeLabel: 'Inactivity',
      };
    }
    if (item.category === 'Staff') {
      return {
        icon: <Users className="w-3.5 h-3.5 text-[#1E3A8A]" />,
        iconBg: 'bg-[#EEF2FF]',
        badgeBg: 'bg-[#EEF2FF] text-[#1E3A8A]',
        badgeLabel: 'Staff Alert',
      };
    }
    return {
      icon: <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />,
      iconBg: 'bg-[#DCFCE7]',
      badgeBg: 'bg-[#DCFCE7] text-[#15803D]',
      badgeLabel: 'Milestone',
    };
  };

  const filterChips: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: 'All', label: 'All', count: effectiveNotifications.length },
    { id: 'Unread', label: 'Unread', count: unreadCount },
    {
      id: 'Renewal',
      label: 'Renewals',
      count: effectiveNotifications.filter((n) => n.category === 'Renewal').length,
    },
    {
      id: 'Payment',
      label: 'Payments',
      count: effectiveNotifications.filter((n) => n.category === 'Payment').length,
    },
    {
      id: 'Follow-Up',
      label: 'Follow-Ups',
      count: effectiveNotifications.filter((n) => n.category === 'Follow-Up').length,
    },
    {
      id: 'Attendance',
      label: 'Attendance',
      count: effectiveNotifications.filter((n) => n.category === 'Attendance')
        .length,
    },
    {
      id: 'Staff',
      label: 'Staff',
      count: effectiveNotifications.filter((n) => n.category === 'Staff').length,
    },
  ];

  return (
    <div className="w-full pt-3 pb-6 space-y-2.5">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#191919] text-white text-[11.5px] font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="flex items-start gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-7 h-7 rounded-xl bg-white border border-[#EAE5DC] text-[#191919] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs hover:bg-[#F8F6F1] cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] sm:text-[22px] font-bold text-[#191919] tracking-tight leading-none">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-[#71717A] mt-1">
              Stay updated on renewals, payments, and gym activity.
            </p>
          </div>
        </div>

        {/* Right Actions: Mark All Read + Notification Preferences */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="h-[28px] px-2.5 rounded-xl bg-white hover:bg-[#F8F6F1] border border-[#EAE5DC] text-[#1E3A8A] text-[10.5px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-7 h-7 rounded-xl bg-white hover:bg-[#F8F6F1] border border-[#EAE5DC] text-[#52525B] flex items-center justify-center shadow-2xs cursor-pointer"
            title="Notification Preferences"
            aria-label="Notification Preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* REPORT / ADMIN SWITCHER PILLS */}
      {onSelectReportTab && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'overview', label: 'Reports Overview' },
              { id: 'complaints', label: 'Complaints & Support' },
              { id: 'gym_settings', label: 'Gym Settings' },
              { id: 'notifications', label: `Notifications (${unreadCount})` },
              { id: 'staff_permissions', label: 'Staff Permissions' },
              { id: 'support', label: 'Help & Support' },
              { id: 'retention', label: 'Retention' },
              { id: 'staff', label: 'Staff Report' },
              { id: 'revenue', label: 'Revenue' },
              { id: 'membership', label: 'Memberships' },
            ] as Array<{ id: ReportTabType; label: string }>
          ).map((t) => {
            const isActive = t.id === 'notifications';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectReportTab(t.id)}
                className={`h-[28px] px-3 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'bg-white text-[#52525B] border border-[#E5E0D6] hover:border-[#D6D0C4]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. COMPACT KPI SUMMARY ROW */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-2.5 border border-[#EAE5DC] shadow-2xs">
          <div className="text-[10px] font-semibold text-[#71717A]">
            Unread Alerts
          </div>
          <div className="text-[16px] font-extrabold text-[#1E3A8A] mt-0.5">
            {unreadCount}
          </div>
          <div className="text-[9.5px] text-[#71717A] mt-0.5">
            Needs review
          </div>
        </div>
        <div className="bg-white rounded-2xl p-2.5 border border-[#EAE5DC] shadow-2xs">
          <div className="text-[10px] font-semibold text-[#71717A]">
            High Priority
          </div>
          <div className="text-[16px] font-extrabold text-[#DC2626] mt-0.5">
            {urgentCount}
          </div>
          <div className="text-[9.5px] text-[#71717A] mt-0.5">
            Dues & expiry
          </div>
        </div>
        <div className="bg-white rounded-2xl p-2.5 border border-[#EAE5DC] shadow-2xs">
          <div className="text-[10px] font-semibold text-[#71717A]">
            Today's Activity
          </div>
          <div className="text-[16px] font-extrabold text-[#191919] mt-0.5">
            {todayCount}
          </div>
          <div className="text-[9.5px] text-[#71717A] mt-0.5">
            Events logged
          </div>
        </div>
      </div>

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications by member, plan, or alert..."
            className="w-full h-[36px] pl-8.5 pr-8 rounded-xl bg-white border border-[#EAE5DC] text-[12px] font-medium text-[#191919] placeholder:text-[#A1A1AA] focus:outline-hidden focus:border-[#1E3A8A] shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#191919] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterChips.map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id)}
                className={`h-[28px] px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#191919] text-white shadow-2xs'
                    : 'bg-white text-[#52525B] border border-[#EAE5DC] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F4F1EA] text-[#52525B]'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. NOTIFICATIONS FEED */}
      {isEmptyState ? (
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center mx-auto">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-[#191919]">
            No notifications yet
          </h3>
          <p className="text-[11.5px] text-[#71717A] max-w-xs mx-auto">
            Alerts for membership renewals, overdue payments, and daily check-ins will appear here automatically.
          </p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-[#191919]">
            {activeFilter === 'Unread'
              ? "You're all caught up!"
              : 'No matching notifications'}
          </h3>
          <p className="text-[11.5px] text-[#71717A] max-w-xs mx-auto">
            {activeFilter === 'Unread'
              ? 'There are no unread notifications right now.'
              : 'Try clearing your search or switching to "All" notifications.'}
          </p>
          {activeFilter !== 'All' && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter('All');
                setSearchQuery('');
              }}
              className="mt-1 h-[30px] px-3 rounded-xl bg-[#1E3A8A] text-white text-[11px] font-bold cursor-pointer"
            >
              Show All Notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(['Today', 'Yesterday', 'Earlier'] as const).map((groupKey) => {
            const groupItems = groupedNotifications[groupKey];
            if (!groupItems || groupItems.length === 0) return null;

            return (
              <div key={groupKey} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold text-[#52525B] uppercase tracking-wider">
                    {groupKey}
                  </span>
                  <span className="text-[10.5px] font-medium text-[#71717A]">
                    {groupItems.length}{' '}
                    {groupItems.length === 1 ? 'alert' : 'alerts'}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const visuals = getCategoryVisuals(item);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-3 border transition-all shadow-2xs ${
                          !item.isRead
                            ? 'bg-white border-[#1E3A8A]/30 ring-1 ring-[#1E3A8A]/10'
                            : 'bg-white/90 border-[#EAE5DC]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Category Icon Squircle */}
                          <div
                            className={`w-8 h-8 rounded-xl ${visuals.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            {visuals.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                {!item.isRead && (
                                  <span
                                    className="w-2 h-2 rounded-full bg-[#1E3A8A] shrink-0"
                                    title="Unread"
                                  />
                                )}
                                <h4
                                  className={`text-[12.5px] leading-snug ${
                                    !item.isRead
                                      ? 'font-extrabold text-[#191919]'
                                      : 'font-bold text-[#3F3F46]'
                                  }`}
                                >
                                  {item.title}
                                </h4>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold shrink-0 ${visuals.badgeBg}`}
                              >
                                {visuals.badgeLabel}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#52525B] leading-snug mt-1">
                              {item.message}
                            </p>

                            {/* Footer Row: Timestamp + Actions */}
                            <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#F4F1EA] flex-wrap">
                              <span className="text-[10px] font-medium text-[#71717A]">
                                {item.timestamp}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {/* Optional WhatsApp Reminder Button if Member-linked */}
                                {(item.memberId || item.memberName) &&
                                  (item.category === 'Renewal' ||
                                    item.category === 'Payment') && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSendWhatsAppForNotification(item)
                                      }
                                      className="h-[26px] px-2 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Send WhatsApp reminder"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </button>
                                  )}

                                {/* Primary Contextual Action Button */}
                                {item.actionLabel && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onMarkRead(item.id);
                                      onPerformAction(item);
                                    }}
                                    className="h-[26px] px-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#163172] text-white text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <span>{item.actionLabel}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Read / Unread Toggle */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onToggleRead(item.id);
                                    showToast(
                                      item.isRead
                                        ? 'Marked as unread'
                                        : 'Marked as read'
                                    );
                                  }}
                                  className="h-[26px] px-2 rounded-lg bg-[#F4F1EA] hover:bg-[#EAE5DC] text-[#52525B] text-[10px] font-semibold cursor-pointer"
                                  title={
                                    item.isRead
                                      ? 'Mark as unread'
                                      : 'Mark as read'
                                  }
                                >
                                  {item.isRead ? 'Unread' : 'Read'}
                                </button>

                                {/* Dismiss Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDismissNotification(item.id);
                                    showToast('Notification dismissed');
                                  }}
                                  className="w-6 h-6 rounded-lg bg-[#FAF8F5] hover:bg-[#FEE2E2] text-[#71717A] hover:text-[#DC2626] flex items-center justify-center cursor-pointer transition-colors"
                                  title="Dismiss notification"
                                  aria-label="Dismiss notification"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. NOTIFICATION SETTINGS FOOTER BANNER */}
      <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-[#191919] truncate">
              Customize Alert Preferences
            </div>
            <div className="text-[10.5px] text-[#71717A] truncate">
              Control expiry windows, payment reminders & WhatsApp templates
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="h-[30px] px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE8] border border-[#E5E0D6] text-[#1E3A8A] text-[11px] font-bold shrink-0 cursor-pointer"
        >
          Configure
        </button>
      </div>
    </div>
  );
};
