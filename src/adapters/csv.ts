import {
  Customer,
  Deal,
  RevenueEvent,
  CustomerSegment,
  DealStage,
  ChurnReason,
  RevenueEventType,
} from "../types";

type Row = Record<string, string>;

function parseDate(s: string): Date {
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d;
}

function parseOptionalDate(s: string | undefined): Date | undefined {
  if (!s || s.trim() === "") return undefined;
  return parseDate(s);
}

/**
 * Parses CSV text into an array of row objects (assumes first row = header).
 */
export function parseCsv(csv: string): Row[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return headers.reduce<Row>((row, h, i) => {
      row[h] = values[i] ?? "";
      return row;
    }, {});
  });
}

/**
 * Converts a CSV string with customer data to Customer objects.
 *
 * Expected columns: id, name, segment, arr, mrr, contractStartDate,
 *   contractEndDate?, churnDate?, churnReason?, acquisitionChannel?,
 *   csm?, industry?, region?, employees?
 */
export function customersFromCsv(csv: string): Customer[] {
  return parseCsv(csv).map((row) => ({
    id: row.id,
    name: row.name,
    segment: row.segment as CustomerSegment,
    arr: parseFloat(row.arr) || 0,
    mrr: parseFloat(row.mrr) || 0,
    contractStartDate: parseDate(row.contractStartDate),
    contractEndDate: parseOptionalDate(row.contractEndDate),
    churnDate: parseOptionalDate(row.churnDate),
    churnReason: (row.churnReason || undefined) as ChurnReason | undefined,
    acquisitionChannel: row.acquisitionChannel || undefined,
    csm: row.csm || undefined,
    industry: row.industry || undefined,
    region: row.region || undefined,
    employees: row.employees ? parseInt(row.employees) : undefined,
  }));
}

/**
 * Converts a CSV string with deal data to Deal objects.
 *
 * Expected columns: id, name, accountId, stage, amount, arr, closeDate,
 *   createdDate, ownerId, segment, forecastCategory?, probability?,
 *   wonDate?, lostDate?, lostReason?, leadSource?, ownerName?
 */
export function dealsFromCsv(csv: string): Deal[] {
  return parseCsv(csv).map((row) => ({
    id: row.id,
    name: row.name,
    accountId: row.accountId,
    stage: row.stage as DealStage,
    amount: parseFloat(row.amount) || 0,
    arr: parseFloat(row.arr) || 0,
    closeDate: parseDate(row.closeDate),
    createdDate: parseDate(row.createdDate),
    ownerId: row.ownerId,
    segment: row.segment as CustomerSegment,
    wonDate: parseOptionalDate(row.wonDate),
    lostDate: parseOptionalDate(row.lostDate),
    lostReason: row.lostReason || undefined,
    leadSource: row.leadSource || undefined,
    ownerName: row.ownerName || undefined,
    forecastCategory: (row.forecastCategory as Deal["forecastCategory"]) || undefined,
    probability: row.probability ? parseFloat(row.probability) : undefined,
  }));
}

/**
 * Converts a CSV string with revenue events to RevenueEvent objects.
 *
 * Expected columns: id, customerId, type, mrr, arr, date, previousMrr?, dealId?
 */
export function eventsFromCsv(csv: string): RevenueEvent[] {
  return parseCsv(csv).map((row) => ({
    id: row.id,
    customerId: row.customerId,
    type: row.type as RevenueEventType,
    mrr: parseFloat(row.mrr) || 0,
    arr: parseFloat(row.arr) || 0,
    date: parseDate(row.date),
    previousMrr: row.previousMrr ? parseFloat(row.previousMrr) : undefined,
    dealId: row.dealId || undefined,
  }));
}

/**
 * Serialises any array of objects to CSV string.
 */
export function toCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val instanceof Date ? val.toISOString() : String(val ?? "");
      return str.includes(",") ? `"${str}"` : str;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
