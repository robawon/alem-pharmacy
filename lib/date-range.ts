export interface CalendarDay {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

const ADDIS_TIMEZONE = "Africa/Addis_Ababa";

/**
 * Returns YYYY-MM-DD date key in the official pharmacy timezone (Africa/Addis_Ababa, UTC+3).
 */
export function getLocalDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADDIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Generates the last 7 calendar days aligned to Africa/Addis_Ababa midnight boundaries.
 */
export function getLast7CalendarDays(referenceDate = new Date()): CalendarDay[] {
  const labelFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ADDIS_TIMEZONE,
    month: "short",
    day: "numeric",
  });

  const addisOffsetMs = 3 * 60 * 60 * 1000;
  const addisTime = new Date(referenceDate.getTime() + addisOffsetMs);
  const year = addisTime.getUTCFullYear();
  const month = addisTime.getUTCMonth();
  const date = addisTime.getUTCDate();
  const todayMidnightUTC = new Date(Date.UTC(year, month, date) - addisOffsetMs);

  return Array.from({ length: 7 }, (_, index) => {
    const start = new Date(todayMidnightUTC.getTime() - (6 - index) * 86400000);
    const end = new Date(start.getTime() + 86400000);

    return {
      key: getLocalDateKey(start),
      label: labelFormatter.format(start),
      start,
      end,
    };
  });
}

export function isDateIn7DayWindow(saleDate: Date, days: CalendarDay[]): boolean {
  if (!days || days.length === 0) return false;
  const time = saleDate.getTime();
  const windowStart = days[0].start.getTime();
  const windowEnd = days[days.length - 1].end.getTime();
  return time >= windowStart && time < windowEnd;
}

/**
 * Accurately determines if a timestamp falls within today's calendar day in Africa/Addis_Ababa.
 */
export function isToday(dateInput?: string | Date | null): boolean {
  if (!dateInput) return false;
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return false;
  return getLocalDateKey(d) === getLocalDateKey(new Date());
}