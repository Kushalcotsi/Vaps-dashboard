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
  unitCutoff?: number;
  industrySignal?: string;
  industrySignalReason?: string;
  leverage?: number | null;
  opportunityScore?: number;
  unitAttachRate?: number;
  recommendationValue?: string;
  recommendationKind?: string;
  coveredText?: string;
  cutoffStatus?: string;
}

export interface DashboardData {
  unitRows: VapsAttachRate[];
  recommendationRows: VapsAttachRate[];
  industryRecommendationRows: VapsAttachRate[];
  segments: Record<string, VapsAttachRate[]>;
  summary: {
    cutoff: number;
    activations: number;
    associated: number;
    unitName: string;
    unitDescription: string;
    unitL2: string;
    unitL3: string;
  };
}
