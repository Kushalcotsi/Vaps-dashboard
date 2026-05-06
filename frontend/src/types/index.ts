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
  decision?: string;
  decisionReason?: string;
  elbowCutoff?: number;
  industrySignal?: string;
  industrySignalReason?: string;
  leverage?: number | null;
  opportunityScore?: number;
  unitAttachRate?: number;
  recommendationValue?: string;
  recommendationKind?: string;
  coveredText?: string;
  elbowCutoff?: number;
  cutoffStatus?: string;
}

export interface DashboardData {
  unitRows: VapsAttachRate[];
  segments: Record<string, VapsAttachRate[]>;
  marketRows: VapsAttachRate[];
  summary: {
    totalActivations: number;
    totalAssociated: number;
    unitAttachRate: number;
    cutoff: number;
  };
}
