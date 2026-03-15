import { DateRange, PeriodType } from "../types";

export function getPeriodRange(date: Date, period: PeriodType): DateRange {
  const d = new Date(date);
  if (period === "monthly") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (period === "quarterly") {
    const quarter = Math.floor(d.getMonth() / 3);
    const start = new Date(d.getFullYear(), quarter * 3, 1);
    const end = new Date(d.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
    return { start, end };
  }
  // annual
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export function isInRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - duration - 1),
    end: new Date(range.start.getTime() - 1),
  };
}

export function formatPeriodLabel(range: DateRange, period: PeriodType): string {
  const s = range.start;
  if (period === "monthly") {
    return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}`;
  }
  if (period === "quarterly") {
    const q = Math.floor(s.getMonth() / 3) + 1;
    return `${s.getFullYear()}-Q${q}`;
  }
  return `${s.getFullYear()}`;
}
