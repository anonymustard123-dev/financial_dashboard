export type RevenueLevel =
  | "L1 Direct Digital Revenue"
  | "L1 Existing P&I-Other"
  | "Traditional Opportunities Expansion"
  | "Digital-Native Client Expansion";

export type SourceTab =
  | "L1-DAC-DATA"
  | "L1-Stablecoin-DATA"
  | "L1-TADA-DATA"
  | "L1-P&I-OTHER-DATA"
  | "L1-HARD-CODED-DATA"
  | "Bucket B Revenue Data"
  | "Bucket C Revenue Data";

export type LoadStatus = "missing" | "loaded" | "warning";

export type StatusBucket = "Won" | "Open" | "Mandated" | "Lost" | "Other";

export interface SourceSchema {
  sourceTab: SourceTab;
  displayName: string;
  expectedRows: number;
  expectedColumns: number;
  requiredColumns: string[];
  allowExtraColumns?: boolean;
}

export interface SourceLoadState {
  sourceTab: SourceTab;
  status: LoadStatus;
  fileName?: string;
  rowCount: number;
  warnings: string[];
  missingColumns: string[];
  loadedAt?: string;
}

export interface NormalizedOpportunity {
  id: string;
  sourceTab: SourceTab;
  revenueLevel: RevenueLevel;
  revenueSubcategory: string;
  platformBusinessLine: string;
  client: string;
  clientGroup: string;
  opportunityName: string;
  status: string;
  statusBucket: StatusBucket;
  probability: number;
  bidValue: number;
  weightedValue: number;
  closeDate: string;
  year?: number;
  quarter?: "Q1" | "Q2" | "Q3" | "Q4";
  included: boolean;
  pipelineTrackerMatch: boolean;
}

export interface RevenueLevelFilter {
  years: number[];
  minProbability: number;
  statuses: StatusBucket[];
}

export interface DashboardFilters {
  revenueLevelFilters: Partial<Record<RevenueLevel, RevenueLevelFilter>>;
  showPipelineMatches: boolean;
  levels: RevenueLevel[];
  businessLines: string[];
  search: string;
}

export interface LevelSummary {
  level: RevenueLevel | "Total Revenue Universe";
  value: number;
  weightedValue: number;
  wonValue: number;
  forecastValue: number;
  count: number;
  averageDealSize: number;
  quarters: Record<"Q1" | "Q2" | "Q3" | "Q4", number>;
}

export interface ClientSummary {
  name: string;
  value: number;
  weightedValue: number;
  count: number;
  largestOpportunity: string;
  dominantLevel: RevenueLevel;
}

export interface BusinessLineSummary {
  businessLine: string;
  [level: string]: string | number;
}
