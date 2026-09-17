export interface CalendarDay {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLast7CalendarDays(referenceDate = new Date()): CalendarDay[] {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const start = new Date(today);
    start.setDate(today.getDate() - (6 - index));
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    return {
      key: getLocalDateKey(start),
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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