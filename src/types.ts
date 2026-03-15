// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface DateRange {
  start: Date;
  end: Date;
}

export type PeriodType = "monthly" | "quarterly" | "annual";

export type DealStage =
  | "prospect"
  | "qualified"
  | "demo"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type CustomerSegment = "smb" | "mid_market" | "enterprise" | "strategic";

export type ChurnReason =
  | "price"
  | "product"
  | "competitor"
  | "no_budget"
  | "champion_left"
  | "poor_fit"
  | "other";

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  segment: CustomerSegment;
  arr: number;
  mrr: number;
  contractStartDate: Date;
  contractEndDate?: Date;
  churnDate?: Date;
  churnReason?: ChurnReason;
  expansionArr?: number;
  contractionArr?: number;
  acquisitionChannel?: string;
  csm?: string;
  industry?: string;
  region?: string;
  employees?: number;
}

// ─── Deal / Pipeline ──────────────────────────────────────────────────────────

export interface Deal {
  id: string;
  name: string;
  accountId: string;
  stage: DealStage;
  amount: number;
  arr: number;
  closeDate: Date;
  createdDate: Date;
  closedDate?: Date;
  wonDate?: Date;
  lostDate?: Date;
  lostReason?: string;
  ownerId: string;
  ownerName?: string;
  segment: CustomerSegment;
  leadSource?: string;
  forecastCategory?: "commit" | "best_case" | "pipeline" | "omitted";
  probability?: number;
  daysInStage?: number;
  touchCount?: number;
}

// ─── Revenue Events ───────────────────────────────────────────────────────────

export type RevenueEventType =
  | "new_business"
  | "expansion"
  | "contraction"
  | "churn"
  | "reactivation";

export interface RevenueEvent {
  id: string;
  customerId: string;
  type: RevenueEventType;
  mrr: number;
  arr: number;
  date: Date;
  previousMrr?: number;
  dealId?: string;
}

// ─── Sales Activity ───────────────────────────────────────────────────────────

export interface SalesActivity {
  repId: string;
  repName: string;
  period: DateRange;
  calls: number;
  emails: number;
  meetings: number;
  proposalsSent: number;
  closedWon: number;
  closedLost: number;
  quotaAttainment: number;
  quota: number;
  actualRevenue: number;
}

// ─── Metric Results ───────────────────────────────────────────────────────────

export interface MrrBreakdown {
  period: DateRange;
  openingMrr: number;
  newBusinessMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnMrr: number;
  reactivationMrr: number;
  closingMrr: number;
  netNewMrr: number;
  growthRate: number;
}

export interface ArrMetrics {
  arr: number;
  arrGrowthRate: number;
  newLogoArr: number;
  expansionArr: number;
  contractionArr: number;
  churnArr: number;
  netNewArr: number;
  ndrPercent: number;
}

export interface ChurnMetrics {
  period: DateRange;
  logoChurnRate: number;
  revenueChurnRate: number;
  churnedCustomers: number;
  churnedArr: number;
  averageCustomerLifetime: number;
  churnByReason: Record<ChurnReason, number>;
  churnBySegment: Record<CustomerSegment, number>;
}

export interface NrrMetrics {
  period: DateRange;
  nrr: number;
  grr: number;
  expansionRate: number;
  contractionRate: number;
  churnRate: number;
}

export interface PipelineMetrics {
  period: DateRange;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  pipelineCoverage: number;
  dealsCount: number;
  averageDealSize: number;
  averageSalesCycle: number;
  winRate: number;
  stageConversionRates: Record<DealStage, number>;
  pipelineBySegment: Record<CustomerSegment, number>;
  pipelineVelocity: number;
}

export interface SalesPerformanceMetrics {
  period: DateRange;
  totalRevenue: number;
  quota: number;
  quotaAttainment: number;
  repPerformance: RepPerformance[];
  averageRampTime: number;
  atRiskReps: string[];
}

export interface RepPerformance {
  repId: string;
  repName: string;
  quota: number;
  achieved: number;
  attainment: number;
  dealsWon: number;
  averageDealSize: number;
  pipelineCoverage: number;
}

export interface CohortRetentionData {
  cohortMonth: string;
  initialCustomers: number;
  initialMrr: number;
  periods: CohortPeriod[];
}

export interface CohortPeriod {
  monthOffset: number;
  retainedCustomers: number;
  retainedMrr: number;
  logoRetentionRate: number;
  mrrRetentionRate: number;
}

// ─── Report Output ────────────────────────────────────────────────────────────

export interface RevOpsReport {
  generatedAt: Date;
  period: DateRange;
  periodType: PeriodType;
  mrr?: MrrBreakdown;
  arr?: ArrMetrics;
  churn?: ChurnMetrics;
  nrr?: NrrMetrics;
  pipeline?: PipelineMetrics;
  salesPerformance?: SalesPerformanceMetrics;
  cohortRetention?: CohortRetentionData[];
  highlights: ReportHighlight[];
  alerts: ReportAlert[];
}

export interface ReportHighlight {
  metric: string;
  value: number | string;
  change?: number;
  direction: "up" | "down" | "flat";
  sentiment: "positive" | "negative" | "neutral";
  description: string;
}

export interface ReportAlert {
  severity: "critical" | "warning" | "info";
  metric: string;
  message: string;
  threshold?: number;
  actual?: number;
}
