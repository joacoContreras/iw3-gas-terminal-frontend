/** Calendar arithmetic uses UTC only; submitted values remain local Argentina dates. */
export function calendarDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

export function calendarISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function shiftCalendarDay(value: string, days: number): string {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return calendarISO(date);
}

export function shiftCalendarMonth(value: string, months: number): string {
  const date = calendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(date.getTime());
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(day, last.getUTCDate()));
  return calendarISO(date);
}

/** Complete weeks, Monday first, including adjacent months. */
export function calendarWeeks(month: string): string[][] {
  const first = `${month.slice(0, 7)}-01`;
  const start = shiftCalendarDay(first, -((calendarDate(first).getUTCDay() + 6) % 7));
  const end = shiftCalendarMonth(first, 1);
  const weeks: string[][] = [];
  for (let day = start; day < end;) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = shiftCalendarDay(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
