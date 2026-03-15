import { Customer, Deal, RevenueEvent, SalesActivity, DateRange } from "../src/types";

export const JAN: DateRange = {
  start: new Date("2024-01-01"),
  end: new Date("2024-01-31"),
};
export const FEB: DateRange = {
  start: new Date("2024-02-01"),
  end: new Date("2024-02-29"),
};

export const customers: Customer[] = [
  {
    id: "c1",
    name: "Acme Corp",
    segment: "enterprise",
    arr: 120000,
    mrr: 10000,
    contractStartDate: new Date("2023-01-01"),
  },
  {
    id: "c2",
    name: "Beta Inc",
    segment: "mid_market",
    arr: 48000,
    mrr: 4000,
    contractStartDate: new Date("2023-06-01"),
  },
  {
    id: "c3",
    name: "Gamma LLC",
    segment: "smb",
    arr: 12000,
    mrr: 1000,
    contractStartDate: new Date("2023-03-01"),
    churnDate: new Date("2024-01-15"),
    churnReason: "price",
  },
];

export const events: RevenueEvent[] = [
  // Jan: new business
  {
    id: "e1",
    customerId: "c4",
    type: "new_business",
    mrr: 2000,
    arr: 24000,
    date: new Date("2024-01-10"),
  },
  // Jan: expansion from c1
  {
    id: "e2",
    customerId: "c1",
    type: "expansion",
    mrr: 1000,
    arr: 12000,
    date: new Date("2024-01-20"),
  },
  // Jan: churn from c3
  {
    id: "e3",
    customerId: "c3",
    type: "churn",
    mrr: -1000,
    arr: -12000,
    date: new Date("2024-01-15"),
  },
];

export const deals: Deal[] = [
  {
    id: "d1",
    name: "Acme Renewal",
    accountId: "c1",
    stage: "proposal",
    amount: 150000,
    arr: 150000,
    closeDate: new Date("2024-01-31"),
    createdDate: new Date("2023-11-01"),
    ownerId: "rep1",
    segment: "enterprise",
    forecastCategory: "commit",
    probability: 80,
  },
  {
    id: "d2",
    name: "Delta Deal",
    accountId: "c5",
    stage: "closed_won",
    amount: 60000,
    arr: 60000,
    closeDate: new Date("2024-01-25"),
    createdDate: new Date("2023-10-01"),
    ownerId: "rep2",
    segment: "mid_market",
    wonDate: new Date("2024-01-25"),
    probability: 100,
  },
  {
    id: "d3",
    name: "Epsilon Lost",
    accountId: "c6",
    stage: "closed_lost",
    amount: 30000,
    arr: 30000,
    closeDate: new Date("2024-01-20"),
    createdDate: new Date("2023-11-15"),
    ownerId: "rep1",
    segment: "smb",
    lostDate: new Date("2024-01-20"),
    lostReason: "price",
  },
];

export const activities: SalesActivity[] = [
  {
    repId: "rep1",
    repName: "Alice",
    period: JAN,
    calls: 80,
    emails: 150,
    meetings: 20,
    proposalsSent: 8,
    closedWon: 1,
    closedLost: 1,
    quota: 100000,
    quotaAttainment: 60,
    actualRevenue: 60000,
  },
  {
    repId: "rep2",
    repName: "Bob",
    period: JAN,
    calls: 60,
    emails: 120,
    meetings: 18,
    proposalsSent: 6,
    closedWon: 1,
    closedLost: 0,
    quota: 80000,
    quotaAttainment: 75,
    actualRevenue: 60000,
  },
];
