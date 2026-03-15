/**
 * Salesforce CRM adapter.
 *
 * Maps Salesforce Opportunity and Account records to the library's
 * canonical Deal and Customer types.
 *
 * In a real integration you would call the Salesforce REST/Bulk API or
 * use the jsforce client.  This module provides the mapping logic so that
 * the rest of the library stays CRM-agnostic.
 */

import { Customer, Deal, CustomerSegment, DealStage } from "../types";

// ─── Salesforce record shapes (minimal) ──────────────────────────────────────

export interface SFAccount {
  Id: string;
  Name: string;
  Type?: string;
  Industry?: string;
  BillingCountry?: string;
  NumberOfEmployees?: number;
  AnnualRevenue?: number;
  // custom fields
  Segment__c?: string;
  ARR__c?: number;
  MRR__c?: number;
  Contract_Start_Date__c?: string;
  Contract_End_Date__c?: string;
  Churn_Date__c?: string;
  Churn_Reason__c?: string;
}

export interface SFOpportunity {
  Id: string;
  Name: string;
  AccountId: string;
  StageName: string;
  Amount: number;
  ARR__c?: number;
  CloseDate: string;
  CreatedDate: string;
  OwnerId: string;
  Owner?: { Name: string };
  ForecastCategory: string;
  Probability: number;
  LeadSource?: string;
  // custom close dates
  Won_Date__c?: string;
  Lost_Date__c?: string;
  Lost_Reason__c?: string;
  Segment__c?: string;
}

// ─── Stage mapping ────────────────────────────────────────────────────────────

const STAGE_MAP: Record<string, DealStage> = {
  Prospecting: "prospect",
  Qualification: "qualified",
  "Value Proposition": "demo",
  "Id. Decision Makers": "demo",
  "Perception Analysis": "demo",
  "Proposal/Price Quote": "proposal",
  "Negotiation/Review": "negotiation",
  "Closed Won": "closed_won",
  "Closed Lost": "closed_lost",
};

function mapStage(sfStage: string): DealStage {
  return STAGE_MAP[sfStage] ?? "prospect";
}

const SEGMENT_MAP: Record<string, CustomerSegment> = {
  SMB: "smb",
  "Mid-Market": "mid_market",
  Enterprise: "enterprise",
  Strategic: "strategic",
};

function mapSegment(raw?: string): CustomerSegment {
  return SEGMENT_MAP[raw ?? ""] ?? "smb";
}

// ─── Public mappers ───────────────────────────────────────────────────────────

export function sfAccountToCustomer(account: SFAccount): Customer {
  const arr = account.ARR__c ?? 0;
  return {
    id: account.Id,
    name: account.Name,
    segment: mapSegment(account.Segment__c),
    arr,
    mrr: account.MRR__c ?? arr / 12,
    contractStartDate: account.Contract_Start_Date__c
      ? new Date(account.Contract_Start_Date__c)
      : new Date(),
    contractEndDate: account.Contract_End_Date__c
      ? new Date(account.Contract_End_Date__c)
      : undefined,
    churnDate: account.Churn_Date__c
      ? new Date(account.Churn_Date__c)
      : undefined,
    churnReason: account.Churn_Reason__c as Customer["churnReason"],
    industry: account.Industry,
    region: account.BillingCountry,
    employees: account.NumberOfEmployees,
  };
}

export function sfOpportunityToDeal(opp: SFOpportunity): Deal {
  const stage = mapStage(opp.StageName);
  return {
    id: opp.Id,
    name: opp.Name,
    accountId: opp.AccountId,
    stage,
    amount: opp.Amount ?? 0,
    arr: opp.ARR__c ?? opp.Amount ?? 0,
    closeDate: new Date(opp.CloseDate),
    createdDate: new Date(opp.CreatedDate),
    ownerId: opp.OwnerId,
    ownerName: opp.Owner?.Name,
    segment: mapSegment(opp.Segment__c),
    forecastCategory: opp.ForecastCategory?.toLowerCase().replace(
      /\s+/g,
      "_"
    ) as Deal["forecastCategory"],
    probability: opp.Probability,
    leadSource: opp.LeadSource,
    wonDate: opp.Won_Date__c ? new Date(opp.Won_Date__c) : undefined,
    lostDate: opp.Lost_Date__c ? new Date(opp.Lost_Date__c) : undefined,
    lostReason: opp.Lost_Reason__c,
  };
}
