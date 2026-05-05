export interface Unit {
  code: string;
  name: string;
}

export interface VapsAttachRate {
  unit: string;
  vaps: string;
  vapsDesc: string;
  activations: number;
  associated: number;
  attachRate: number;
  unitName: string;
  unitDescription: string;
  unitL2?: string;
  unitL3?: string;
  mainGroup: string;
  detailedGroup: string;
  tier: string;
  source: string;
  coveredByRecommendationLogic: boolean;
  market?: string;
  division?: string;
  region?: string;
  // Enriched fields from backend
  decision: string;
  decisionReason: string;
  elbowCutoff: number;
  recommendationKind: string;
  recommendationValue: string;
  coveredText: string;
  industrySignal: string;
  industrySignalReason: string;
  leverage: number;
  opportunityScore: number;
  unitAttachRate: number;
  unitCutoff: number;
}

export interface DashboardData {
  unitRows: VapsAttachRate[];
  marketRows: VapsAttachRate[];
  divisionRows: VapsAttachRate[];
  regionRows: VapsAttachRate[];
  cutoff: number;
}
