/**
 * HubSpot CRM adapter.
 *
 * Maps HubSpot Deal and Company records to the library's canonical types.
 */

import { Customer, Deal, CustomerSegment, DealStage } from "../types";

// ─── HubSpot record shapes ────────────────────────────────────────────────────

export interface HSCompany {
  id: string;
  properties: {
    name: string;
    industry?: string;
    country?: string;
    numberofemployees?: string;
    annualrevenue?: string;
    // custom
    segment?: string;
    arr?: string;
    mrr?: string;
    contract_start_date?: string;
    contract_end_date?: string;
    churn_date?: string;
    churn_reason?: string;
  };
}

export interface HSDeal {
  id: string;
  properties: {
    dealname: string;
    associatedcompanyid?: string;
    dealstage: string;
    amount: string;
    arr?: string;
    closedate: string;
    createdate: string;
    hubspot_owner_id: string;
    hs_forecast_category?: string;
    hs_deal_stage_probability?: string;
    lead_source?: string;
    closed_won_date?: string;
    closed_lost_date?: string;
    closed_lost_reason?: string;
    segment?: string;
  };
}

// ─── Stage mapping (default HubSpot pipeline) ────────────────────────────────

const HS_STAGE_MAP: Record<string, DealStage> = {
  appointmentscheduled: "prospect",
  qualifiedtobuy: "qualified",
  presentationscheduled: "demo",
  decisionmakerboughtin: "proposal",
  contractsent: "negotiation",
  closedwon: "closed_won",
  closedlost: "closed_lost",
};

function mapHsStage(stage: string): DealStage {
  return HS_STAGE_MAP[stage.toLowerCase()] ?? "prospect";
}

const HS_SEGMENT_MAP: Record<string, CustomerSegment> = {
  smb: "smb",
  "mid-market": "mid_market",
  midmarket: "mid_market",
  enterprise: "enterprise",
  strategic: "strategic",
};

function mapHsSegment(raw?: string): CustomerSegment {
  return HS_SEGMENT_MAP[(raw ?? "").toLowerCase()] ?? "smb";
}

// ─── Public mappers ───────────────────────────────────────────────────────────

export function hsCompanyToCustomer(company: HSCompany): Customer {
  const p = company.properties;
  const arr = parseFloat(p.arr ?? "0") || 0;
  return {
    id: company.id,
    name: p.name,
    segment: mapHsSegment(p.segment),
    arr,
    mrr: parseFloat(p.mrr ?? "0") || arr / 12,
    contractStartDate: p.contract_start_date
      ? new Date(p.contract_start_date)
      : new Date(),
    contractEndDate: p.contract_end_date
      ? new Date(p.contract_end_date)
      : undefined,
    churnDate: p.churn_date ? new Date(p.churn_date) : undefined,
    churnReason: p.churn_reason as Customer["churnReason"],
    industry: p.industry,
    region: p.country,
    employees: p.numberofemployees ? parseInt(p.numberofemployees) : undefined,
  };
}

export function hsDealToDeal(deal: HSDeal): Deal {
  const p = deal.properties;
  const amount = parseFloat(p.amount) || 0;
  return {
    id: deal.id,
    name: p.dealname,
    accountId: p.associatedcompanyid ?? "",
    stage: mapHsStage(p.dealstage),
    amount,
    arr: parseFloat(p.arr ?? "0") || amount,
    closeDate: new Date(p.closedate),
    createdDate: new Date(p.createdate),
    ownerId: p.hubspot_owner_id,
    segment: mapHsSegment(p.segment),
    forecastCategory: p.hs_forecast_category?.toLowerCase().replace(
      /\s+/g,
      "_"
    ) as Deal["forecastCategory"],
    probability: p.hs_deal_stage_probability
      ? parseFloat(p.hs_deal_stage_probability)
      : undefined,
    leadSource: p.lead_source,
    wonDate: p.closed_won_date ? new Date(p.closed_won_date) : undefined,
    lostDate: p.closed_lost_date ? new Date(p.closed_lost_date) : undefined,
    lostReason: p.closed_lost_reason,
  };
}
