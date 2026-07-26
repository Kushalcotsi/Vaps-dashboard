from pydantic import BaseModel
from typing import List, Optional, Dict

class UnitMarketSegmentRate(BaseModel):
    unit: str
    market: str
    year: int
    quarter: int
    unitMarketActivations: int
    unitActivations: int
    marketActivations: int
    marketContributionToProduct: float
    productShareInMarket: float
    productName: str
    unitDescription: str
    unitDetailedDescription: str
    unitL1Purpose: str
    unitL2CoreSolution: str
    unitL3Products: str
    
    latestActivations: int
    historicalActivations: int
    periodsObserved: int
    
    historicalProductShareInMarket: float
    historicalMarketContributionToProduct: float
    
    blendedProductShareInMarket: float
    blendedMarketContributionToProduct: float
    
    momentumScore: float
    trendScore: float
    supportScore: float
    
    confidenceLevel: str
    recommendationScore: float
    recommendationLabel: str
    reviewReason: str

class UnitMarketDashboardData(BaseModel):
    latestRecommendations: List[UnitMarketSegmentRate]
    highConfidenceRecommendations: List[UnitMarketSegmentRate]
    lowConfidenceReviewItems: List[UnitMarketSegmentRate]
    summary: Dict[str, float]
