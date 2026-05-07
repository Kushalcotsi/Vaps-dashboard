from pydantic import BaseModel
from typing import List, Optional, Dict

class VapsAttachRate(BaseModel):
    unit: str
    vaps: str
    vapsDesc: str
    activations: int
    associated: int
    attachRate: float
    unitName: str
    unitDescription: str
    unitL2: Optional[str] = ""
    unitL3: Optional[str] = ""
    mainGroup: str
    detailedGroup: str
    tier: str
    source: str
    coveredByRecommendationLogic: bool = False
    market: Optional[str] = ""
    division: Optional[str] = ""
    region: Optional[str] = ""
    # Enrichment fields for parity
    decision: Optional[str] = ""
    decisionReason: Optional[str] = ""
    elbowCutoff: Optional[float] = 0.0
    cutoffStatus: Optional[str] = ""
    coveredText: Optional[str] = ""
    unitAttachRate: Optional[float] = 0.0
    unitCutoff: Optional[float] = 0.0
    industrySignal: Optional[str] = ""
    industrySignalReason: Optional[str] = ""
    opportunityScore: Optional[float] = 0.0
    leverage: Optional[float] = None
    recommendationValue: Optional[str] = ""
    recommendationKind: Optional[str] = ""

class RecommendationEntry(BaseModel):
    unit: str
    vaps: str
    vapsDesc: str
    recommendationValue: str
    coveredByRecommendationLogic: bool
    recommendationKind: str
    sequence: int

class DashboardData(BaseModel):
    unitRows: List[VapsAttachRate]
    recommendationRows: List[VapsAttachRate]
    industryRecommendationRows: List[VapsAttachRate]
    segments: Dict[str, List[VapsAttachRate]]
    summary: Dict[str, float]
