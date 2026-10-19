/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { MonthlyMetric } from '../../types/dashboard';

interface RevenueChartProps {
  metrics: MonthlyMetric[];
  isEmptyState?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  metrics,
  isEmptyState = false,
}) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'members' | 'attendance'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatNumber = (num: number) => {
    if (activeTab === 'revenue') {
      return `₹${num.toLocaleString('en-IN')}`;
    }
    if (activeTab === 'attendance') {
      return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
    }
    return num.toString();
  };

  const currentMonthMetric = metrics[metrics.length - 1] || {
    revenue: 0,
    members: 0,
    attendance: 0,
  };

  const prevMonthMetric =
    metrics.length >= 2 ? metrics[metrics.length - 2] : null;

  const hasAnyDataForTab = metrics.some((m) =>
    activeTab === 'revenue'
      ? m.revenue > 0
      : activeTab === 'members'
      ? m.members > 0
      : m.attendance > 0
  );

  // Determine dynamic ceiling for chart scaling
  const maxVal = Math.max(
    activeTab === 'revenue' ? 10000 : activeTab === 'members' ? 20 : 100,
    ...metrics.map((m) =>
      activeTab === 'revenue'
        ? m.revenue
        : activeTab === 'members'
        ? m.members
        : m.attendance
    )
  );

  // Y-axis ticks
  const yAxisTicks =
    activeTab === 'revenue'
      ? [
          `${Math.round(maxVal / 1000)}K`,
          `${Math.round((maxVal * 0.75) / 1000)}K`,
          `${Math.round((maxVal * 0.5) / 1000)}K`,
          `${Math.round((maxVal * 0.25) / 1000)}K`,
          '0',
        ]
      : [
          String(maxVal),
          String(Math.round(maxVal * 0.75)),
          String(Math.round(maxVal * 0.5)),
          String(Math.round(maxVal * 0.25)),
          '0',
        ];

  const currentDisplayValue =
    activeTab === 'revenue'
      ? `₹${currentMonthMetric.revenue.toLocaleString('en-IN')}`
      : activeTab === 'members'
      ? currentMonthMetric.members.toString()
      : currentMonthMetric.attendance.toLocaleString('en-IN');

  const metricLabel =
    activeTab === 'revenue'
      ? 'This month'
      : activeTab === 'members'
      ? 'Total enrolled'
      : 'Visits this month';

  const currRaw =
    activeTab === 'revenue'
      ? currentMonthMetric.revenue
      : activeTab === 'members'
      ? currentMonthMetric.members
      : currentMonthMetric.attendance;
  const prevRaw = prevMonthMetric
    ? activeTab === 'revenue'
      ? prevMonthMetric.revenue
      : activeTab === 'members'
      ? prevMonthMetric.members
      : prevMonthMetric.attendance
    : 0;

  const growthRate =
    prevRaw > 0
      ? `${currRaw >= prevRaw ? '+' : ''}${Math.round(((currRaw - prevRaw) / prevRaw) * 100)}%`
      : null;

  return (
    <section className="w-full mt-3">
      {/* Header & Segmented Control (flex-wrap for narrow Android screens) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5 px-1">
        <h2 className="text-[16px] sm:text-[17px] font-bold text-[#191919] tracking-tight">
          Revenue Trend
        </h2>

        {/* Tab Controls */}
        <div className="flex items-center gap-0.5 p-0.5 bg-[#EBE7DF] rounded-full">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${
              activeTab === 'revenue'
                ? 'bg-[#0F2566] text-white shadow-2xs'
                : 'text-[#71717A] hover:text-[#191919]'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-[#0F2566] text-white shadow-2xs'
                : 'text-[#71717A] hover:text-[#191919]'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-[#0F2566] text-white shadow-2xs'
                : 'text-[#71717A] hover:text-[#191919]'
            }`}
          >
            Attendance
          </button>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="w-full bg-white border border-[#EAE5DC] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs">
        {isEmptyState || !hasAnyDataForTab ? (
          <div className="py-6 text-center text-[#71717A]">
            <p className="text-xs font-semibold text-[#191919]">Not enough data yet.</p>
            <p className="text-[10.5px] mt-0.5">
              Recorded monthly revenue and member attendance will visualize here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
            
            {/* Left summary column */}
            <div className="flex flex-row sm:flex-col justify-between sm:justify-between items-center sm:items-start shrink-0">
              <div>
                <div className="text-[19px] sm:text-[21px] font-bold text-[#191919] tracking-tight leading-none">
                  {currentDisplayValue}
                </div>
                <span className="text-[#71717A] text-[11px] font-normal block mt-0.5">
                  {metricLabel}
                </span>
              </div>

              {/* Growth pill */}
              {growthRate && (
                <div className="sm:mt-2.5 flex items-center gap-1">
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[10.5px] font-bold">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {growthRate}
                  </span>
                  <span className="text-[10px] text-[#71717A] font-medium hidden sm:inline">
                    vs last month
                  </span>
                </div>
              )}
            </div>

            {/* Right: Bar Chart Area */}
            <div className="flex-1 max-w-full sm:max-w-[340px] md:max-w-[400px]">
              <div className="relative flex items-end justify-between h-24 sm:h-28 pt-2 pb-1 border-b border-[#F2EFE8]">
                
                {/* Horizontal reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-[#71717A] w-full" />
                  <div className="border-b border-[#71717A] w-full" />
                  <div className="border-b border-[#71717A] w-full" />
                  <div className="border-b border-[#71717A] w-full" />
                </div>

                {/* Bars */}
                {metrics.map((item, index) => {
                  const val =
                    activeTab === 'revenue'
                      ? item.revenue
                      : activeTab === 'members'
                      ? item.members
                      : item.attendance;
                  const heightPercent = Math.min(100, Math.max(12, (val / maxVal) * 100));
                  const isCurrentMonth = index === metrics.length - 1;
                  const isHovered = hoveredIndex === index;

                  return (
                    <div
                      key={item.shortMonth}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setHoveredIndex(index)}
                      className="relative flex flex-col items-center justify-end h-full flex-1 max-w-[36px] cursor-pointer group px-0.5"
                    >
                      {/* Tooltip on hover/tap */}
                      {isHovered && (
                        <div className="absolute -top-7 z-20 px-1.5 py-0.5 bg-[#191919] text-white text-[10px] font-semibold rounded shadow-md whitespace-nowrap animate-in fade-in zoom-in-90 duration-100">
                          {item.shortMonth}: {formatNumber(val)}
                        </div>
                      )}

                      {/* Bar body */}
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isCurrentMonth
                            ? 'bg-[#0F2566] group-hover:bg-[#1E3A8A]'
                            : 'bg-[#819BD9] group-hover:bg-[#6885C9]'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}

                {/* Y-Axis scale on far right */}
                <div className="flex flex-col justify-between h-full pl-1.5 text-[9.5px] text-[#A1A1AA] font-medium text-right shrink-0">
                  {yAxisTicks.map((tick) => (
                    <span key={tick}>{tick}</span>
                  ))}
                </div>
              </div>

              {/* X-Axis Month Labels */}
              <div className="flex items-center justify-between pt-1 text-[10.5px] text-[#71717A] font-medium pr-6">
                {metrics.map((item) => (
                  <span key={item.shortMonth} className="flex-1 text-center">
                    {item.shortMonth}
                  </span>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  );
};
