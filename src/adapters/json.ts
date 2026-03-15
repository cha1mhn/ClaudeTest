import { Customer, Deal, RevenueEvent, SalesActivity } from "../types";

/**
 * Parses customers from a JSON array, ensuring dates are Date objects.
 */
export function customersFromJson(data: unknown[]): Customer[] {
  return data.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      ...(r as Customer),
      contractStartDate: new Date(r.contractStartDate as string),
      contractEndDate: r.contractEndDate
        ? new Date(r.contractEndDate as string)
        : undefined,
      churnDate: r.churnDate ? new Date(r.churnDate as string) : undefined,
    };
  });
}

/**
 * Parses deals from a JSON array, ensuring dates are Date objects.
 */
export function dealsFromJson(data: unknown[]): Deal[] {
  return data.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      ...(r as Deal),
      closeDate: new Date(r.closeDate as string),
      createdDate: new Date(r.createdDate as string),
      wonDate: r.wonDate ? new Date(r.wonDate as string) : undefined,
      lostDate: r.lostDate ? new Date(r.lostDate as string) : undefined,
      closedDate: r.closedDate ? new Date(r.closedDate as string) : undefined,
    };
  });
}

/**
 * Parses revenue events from a JSON array, ensuring dates are Date objects.
 */
export function eventsFromJson(data: unknown[]): RevenueEvent[] {
  return data.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      ...(r as RevenueEvent),
      date: new Date(r.date as string),
    };
  });
}

/**
 * Parses sales activities from a JSON array, ensuring date ranges are correct.
 */
export function activitiesFromJson(data: unknown[]): SalesActivity[] {
  return data.map((raw) => {
    const r = raw as Record<string, unknown>;
    const period = r.period as Record<string, unknown>;
    return {
      ...(r as SalesActivity),
      period: {
        start: new Date(period.start as string),
        end: new Date(period.end as string),
      },
    };
  });
}
