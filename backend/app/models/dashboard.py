from pydantic import BaseModel
from typing import List, Optional

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
    marketRows: List[VapsAttachRate]
    divisionRows: List[VapsAttachRate]
    regionRows: List[VapsAttachRate]
    recommendationRows: List[RecommendationEntry]
