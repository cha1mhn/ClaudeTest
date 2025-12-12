export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    closedate: string;
    dealstage: string;
    pipeline: string;
    hubspot_owner_id: string;
    createdate: string;
    hs_lastmodifieddate: string;
    days_to_close?: string;
    hs_deal_stage_probability?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotContact {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    phone?: string;
    company?: string;
    hs_lead_status?: string;
  };
}

export interface HubSpotOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userId: number;
}

export interface HubSpotNote {
  id: string;
  properties: {
    hs_note_body: string;
    hs_timestamp: string;
    hubspot_owner_id: string;
  };
  associations?: {
    deals?: string[];
    contacts?: string[];
  };
}

export interface HubSpotPipeline {
  id: string;
  label: string;
  displayOrder: number;
  stages: HubSpotPipelineStage[];
}

export interface HubSpotPipelineStage {
  id: string;
  label: string;
  displayOrder: number;
  probability: number;
  metadata: {
    probability?: string;
  };
}

export interface DealRiskIndicator {
  dealId: string;
  dealName: string;
  ownerName: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
  amount: number;
  stage: string;
  daysInStage: number;
  lastActivity: string;
  hubspotUrl: string;
}

export interface PipelineVelocity {
  pipelineId: string;
  pipelineName: string;
  averageDaysToClose: number;
  conversionRate: number;
  dealsInPipeline: number;
  totalValue: number;
  stageMetrics: StageMetrics[];
}

export interface StageMetrics {
  stageName: string;
  dealsCount: number;
  averageDaysInStage: number;
  conversionRate: number;
  stuckDeals: number;
}

export interface CoachingMoment {
  id: string;
  type: 'deal_at_risk' | 'stuck_deal' | 'no_activity' | 'low_engagement' | 'overdue_task';
  priority: 'high' | 'medium' | 'low';
  dealId?: string;
  dealName?: string;
  repName: string;
  repId: string;
  message: string;
  actionItems: string[];
  hubspotUrl: string;
  createdAt: string;
}

export interface RepPerformance {
  repId: string;
  repName: string;
  dealsInProgress: number;
  dealsAtRisk: number;
  averageDealVelocity: number;
  winRate: number;
  totalPipelineValue: number;
  coachingMoments: CoachingMoment[];
}
