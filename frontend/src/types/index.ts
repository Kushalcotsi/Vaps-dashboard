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

export interface UnitMarketSegmentRate {
  unit: string;
  market: string;
  year: number;
  quarter: number;
  unitMarketActivations: number;
  unitActivations: number;
  marketActivations: number;
  marketContributionToProduct: number;
  productShareInMarket: number;
  productName: string;
  unitDescription: string;
  unitDetailedDescription: string;
  unitL1Purpose: string;
  unitL2CoreSolution: string;
  unitL3Products: string;
  
  latestActivations: number;
  historicalActivations: number;
  periodsObserved: number;
  
  historicalProductShareInMarket: number;
  historicalMarketContributionToProduct: number;
  
  blendedProductShareInMarket: number;
  blendedMarketContributionToProduct: number;
  
  momentumScore: number;
  trendScore: number;
  supportScore: number;
  
  confidenceLevel: string;
  recommendationScore: number;
  recommendationLabel: string;
  reviewReason: string;
}

export interface UnitMarketDashboardData {
  latestRecommendations: UnitMarketSegmentRate[];
  highConfidenceRecommendations: UnitMarketSegmentRate[];
  lowConfidenceReviewItems: UnitMarketSegmentRate[];
  summary: {
    total_recommendations: number;
    high_confidence_count: number;
    low_confidence_count: number;
  };
}
