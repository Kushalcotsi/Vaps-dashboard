import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
from app.models.dashboard import VapsAttachRate, RecommendationEntry
from app.repositories.base import BaseRepository

class DashboardService:
    def __init__(self, repository: BaseRepository):
        self.repo = repository
        self.DEFAULT_CUTOFF = 0.05
        self.MIN_BASKETS = 25

    def calculate_elbow_cutoff(self, rates: List[float]) -> float:
        """
        Calculates the elbow point using the exact logic from the reference script:
        distance from point to line segment [first, last] in the fraction space [0, 1].
        """
        unique_rates = sorted(list(set([r for r in rates if r > 0])), reverse=True)
        
        if not unique_rates:
            return self.DEFAULT_CUTOFF
        if len(unique_rates) < 3:
            return unique_rates[-1]

        first = unique_rates[0]
        last = unique_rates[-1]
        denominator = np.sqrt((last - first)**2 + 1)
        
        best_index = 0
        best_distance = -1
        
        for index, rate in enumerate(unique_rates):
            x = index / (len(unique_rates) - 1)
            distance = abs((last - first) * x - rate + first) / denominator
            if distance > best_distance:
                best_distance = distance
                best_index = index
                
        return unique_rates[best_index]

    def get_decision(self, recommended: bool, attach_rate: float, associated: int, cutoff: float, kind: str = "Not covered") -> Tuple[str, str]:
        """
        Implements the exact Decision Matrix from recommendationDecision in the reference script.
        """
        cutoff_pct = f"{cutoff * 100:.1f}%"
        is_fixed = (kind == "Fixed quantity")
        
        if recommended and not is_fixed and attach_rate >= cutoff:
            return "Keep Logic + Promote", f"Conditional or quantity-driven logic is already present and attach rate is at or above the unit cutoff of {cutoff_pct}."
            
        if recommended and not is_fixed:
            return "Keep Logic", "Conditional or quantity-driven logic is already present; broad attach rate alone should not remove it."
            
        if recommended and attach_rate >= cutoff:
            return "Keep", f"Fixed recommendation is at or above the unit cutoff of {cutoff_pct}."
            
        if recommended:
            return "Review Removal", f"Fixed recommendation is below the unit cutoff of {cutoff_pct}."
            
        if attach_rate >= cutoff and associated > 0:
            return "Add", f"Not covered by recommendation logic and at or above the unit cutoff of {cutoff_pct}."
            
        if attach_rate > 0:
            return "Monitor", f"Observed in transactions, but below the unit cutoff of {cutoff_pct}."
            
        return "No Action", "No observed attachment and not covered by recommendation logic."

    def get_industry_signal(self, attach_rate: float, associated: int, activations: int, unit_attach_rate: float, unit_cutoff: float) -> Tuple[str, str, float, Optional[float]]:
        """
        Implements the industrySignal logic from the reference script.
        Returns (industrySignal, industrySignalReason, opportunityScore, leverage)
        """
        if associated == 0 or activations == 0:
            return "No Signal", "No observed attachment in this segment.", 0.0, None
            
        if unit_attach_rate > 0:
            leverage = attach_rate / unit_attach_rate
        else:
            leverage = 99.99 if attach_rate > 0 else 0.0
            
        score = max(0.0, attach_rate - unit_cutoff) * activations
        pct_cutoff = f"{unit_cutoff * 100:.1f}%"
        
        if attach_rate >= unit_cutoff and leverage >= 1.5:
            return "Strong Industry Opportunity", f"Attach rate is significantly higher ({leverage:.2f}x) than the unit's baseline.", score, leverage
            
        if attach_rate >= unit_cutoff and attach_rate > unit_attach_rate:
            return "Good General Fit", f"Above the unit benchmark of {pct_cutoff} and trending positively vs the unit average.", score, leverage
            
        if attach_rate >= unit_cutoff:
            return "Good General Fit", f"Above the unit benchmark of {pct_cutoff} and consistent with the unit's overall pattern.", score, leverage
            
        if leverage >= 1.5:
            return "Niche Industry Signal", f"Below the unit cutoff of {pct_cutoff}, but outperforms the unit average significantly.", score, leverage
            
        return "Monitor", f"Present but below the unit cutoff of {pct_cutoff} without significant leverage.", score, leverage

    def get_metadata(self) -> Dict[str, List[str]]:
        rows = self.repo.get_unit_attach_rates()
        sources = sorted(list(set(r.source for r in rows if r.source)))
        groups = sorted(list(set(r.mainGroup for r in rows if r.mainGroup)))
        return {
            "sources": sources,
            "groups": groups
        }

    def get_dashboard_data(self, unit_id: str) -> Dict:
        # Fetch data from repository and filter by MIN_ACTIVATIONS
        unit_rows = [r for r in self.repo.get_unit_attach_rates() if r.unit == unit_id and r.activations >= self.MIN_BASKETS]
        market_rows = [r for r in self.repo.get_market_attach_rates() if r.unit == unit_id and r.activations >= self.MIN_BASKETS]
        division_rows = [r for r in self.repo.get_division_attach_rates() if r.unit == unit_id and r.activations >= self.MIN_BASKETS]
        region_rows = [r for r in self.repo.get_region_attach_rates() if r.unit == unit_id and r.activations >= self.MIN_BASKETS]
        recommendations = self.repo.get_recommendation_entries()

        # 1. Calculate Cutoff for this unit using rows with associated >= 25
        all_rates = [r.attachRate for r in unit_rows if r.associated >= self.MIN_BASKETS]
        cutoff = self.calculate_elbow_cutoff(all_rates)

        # Create lookup for unit attach rates to calculate leverage
        unit_attach_rates = {r.vaps: r.attachRate for r in unit_rows}

        def enrich_base(r):
            rec = recommendations.get((r.unit, r.vaps))
            kind = rec.recommendationKind if rec else "Not covered"
            recommended = rec.coveredByRecommendationLogic if rec else False
            decision, reason = self.get_decision(recommended, r.attachRate, r.associated, cutoff, kind)
            row_dict = r.model_dump()
            row_dict.update({
                "decision": decision,
                "decisionReason": reason,
                "elbowCutoff": cutoff,
                "recommendationKind": kind,
                "recommendationValue": rec.recommendationValue if rec else "",
                "coveredText": "Yes" if recommended else "No"
            })
            return row_dict

        enriched_unit_rows = [enrich_base(r) for r in unit_rows]

        def enrich_segment(r):
            base_dict = enrich_base(r)
            unit_rate = unit_attach_rates.get(r.vaps, 0.0)
            signal, sig_reason, score, leverage = self.get_industry_signal(
                r.attachRate, r.associated, r.activations, unit_rate, cutoff
            )
            base_dict.update({
                "unitAttachRate": unit_rate,
                "unitCutoff": cutoff,
                "industrySignal": signal,
                "industrySignalReason": sig_reason,
                "opportunityScore": score,
                "leverage": leverage
            })
            return base_dict

        enriched_market_rows = [enrich_segment(r) for r in market_rows]
        enriched_division_rows = [enrich_segment(r) for r in division_rows]
        enriched_region_rows = [enrich_segment(r) for r in region_rows]

        return {
            "unitRows": enriched_unit_rows,
            "marketRows": enriched_market_rows,
            "divisionRows": enriched_division_rows,
            "regionRows": enriched_region_rows,
            "cutoff": cutoff
        }
