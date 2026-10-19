/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getTodayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getTodayIso(d);
}

export function getDaysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getTodayIso(d);
}

export function getDaysAheadIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getTodayIso(d);
}

export function getCurrentMonthLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getShortMonthYearLabel(d: Date = new Date()): string {
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function formatIndianDate(isoStr?: string): string {
  if (!isoStr) return '—';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  const parsed = new Date(isoStr);
  if (isNaN(parsed.getTime())) return isoStr;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface DynamicDateBounds {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
  label: string;
}

export function computeDynamicDateBounds(
  preset: 'this_week' | 'this_month' | 'last_month' | 'last_3_months' | 'custom',
  customStart?: string,
  customEnd?: string
): DynamicDateBounds {
  const now = new Date();
  const todayIso = getTodayIso(now);

  if (preset === 'this_week') {
    // Current week: last 7 days ending today (or Monday to Sunday)
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    const prevEnd = new Date(start);
    prevEnd.setDate(start.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - 6);

    const sIso = getTodayIso(start);
    const pEndIso = getTodayIso(prevEnd);
    const pStartIso = getTodayIso(prevStart);

    return {
      startDate: sIso,
      endDate: todayIso,
      prevStartDate: pStartIso,
      prevEndDate: pEndIso,
      label: `${formatIndianDate(sIso)} - ${formatIndianDate(todayIso)}`,
    };
  }

  if (preset === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

    const sIso = getTodayIso(start);
    const eIso = getTodayIso(end);
    return {
      startDate: sIso,
      endDate: eIso,
      prevStartDate: getTodayIso(prevStart),
      prevEndDate: getTodayIso(prevEnd),
      label: `${formatIndianDate(sIso)} - ${formatIndianDate(eIso)}`,
    };
  }

  if (preset === 'last_3_months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth() - 2, 0);

    const sIso = getTodayIso(start);
    const eIso = getTodayIso(end);
    return {
      startDate: sIso,
      endDate: eIso,
      prevStartDate: getTodayIso(prevStart),
      prevEndDate: getTodayIso(prevEnd),
      label: `${formatIndianDate(sIso)} - ${formatIndianDate(eIso)}`,
    };
  }

  if (preset === 'custom') {
    const s = customStart || getTodayIso(new Date(now.getFullYear(), now.getMonth(), 1));
    const e = customEnd || todayIso;
    const sDate = new Date(s + 'T00:00:00');
    const eDate = new Date(e + 'T00:00:00');
    const spanDays = Math.max(
      1,
      Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const pEnd = new Date(sDate);
    pEnd.setDate(pEnd.getDate() - 1);
    const pStart = new Date(pEnd);
    pStart.setDate(pStart.getDate() - (spanDays - 1));

    return {
      startDate: s,
      endDate: e,
      prevStartDate: getTodayIso(pStart),
      prevEndDate: getTodayIso(pEnd),
      label: `${formatIndianDate(s)} - ${formatIndianDate(e)}`,
    };
  }

  // Default: this_month (1st to last day of current month)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevLast = new Date(now.getFullYear(), now.getMonth(), 0);

  const sIso = getTodayIso(firstOfMonth);
  const eIso = getTodayIso(lastOfMonth);

  return {
    startDate: sIso,
    endDate: eIso,
    prevStartDate: getTodayIso(prevFirst),
    prevEndDate: getTodayIso(prevLast),
    label: `${formatIndianDate(sIso)} - ${formatIndianDate(eIso)}`,
  };
}

export function getLast7DaysSeries(): Array<{ date: string; label: string }> {
  const result: Array<{ date: string; label: string }> = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const date = getTodayIso(d);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    result.push({ date, label });
  }
  return result;
}

export function getLast3MonthsSeries(): Array<{ prefix: string; label: string }> {
  const result: Array<{ prefix: string; label: string }> = [];
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    result.push({ prefix, label });
  }
  return result;
}
