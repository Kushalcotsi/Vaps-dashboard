import math
from typing import List, Dict, Optional, Tuple
from app.models.dashboard import VapsAttachRate, RecommendationEntry
from app.repositories.base import BaseRepository

class DashboardService:
    MIN_BASKETS = 25
    
    def __init__(self, repo: BaseRepository):
        self.repo = repo

    def calculate_elbow_cutoff(self, rates: List[float]) -> float:
        rates = sorted(list(set(rates)), reverse=True)
        if not rates:
            return 0.05
        if len(rates) < 3:
            return rates[-1]

        first_y = rates[0]
        last_y = rates[-1]
        denominator = math.sqrt(math.pow(last_y - first_y, 2) + 1)
        best_index = 0
        best_distance = -1.0

        for index, rate in enumerate(rates):
            x = index / (len(rates) - 1)
            distance = abs((last_y - first_y) * x - rate + first_y) / denominator
            if distance > best_distance:
                best_distance = distance
                best_index = index

        return rates[best_index]

    def get_recommendation_decision(self, row: VapsAttachRate, cutoff: float) -> Tuple[str, str]:
        kind = row.recommendationKind or "Fixed quantity"
        is_fixed = kind == "Fixed quantity"
        
        if row.coveredByRecommendationLogic and not is_fixed and row.attachRate >= cutoff:
            return "Keep Logic + Promote", f"Conditional or quantity-driven logic is already present and attach rate is at or above the unit cutoff of {row.attachRate*100:.1f}%."
        
        if row.coveredByRecommendationLogic and not is_fixed:
            return "Keep Logic", "Conditional or quantity-driven logic is already present; broad attach rate alone should not remove it."
            
        if row.coveredByRecommendationLogic and row.attachRate >= cutoff:
            return "Keep", f"Fixed recommendation is at or above the unit cutoff of {cutoff*100:.1f}%."
            
        if row.coveredByRecommendationLogic:
            return "Review Removal", f"Fixed recommendation is below the unit cutoff of {cutoff*100:.1f}%."
            
        if row.attachRate >= cutoff and row.associated > 0:
            return "Add", f"Not covered by recommendation logic and at or above the unit cutoff of {cutoff*100:.1f}%."
            
        if row.attachRate > 0:
            return "Monitor", f"Observed in transactions, but below the unit benchmark of {cutoff*100:.1f}%."
            
        return "No Action", "No observed attachment and not covered by recommendation logic."

    def get_industry_signal(self, row: VapsAttachRate, unit_cutoff: float, unit_attach_rate: float) -> Dict:
        opportunity_score = max(0, row.attachRate - unit_cutoff) * row.activations
        leverage = row.attachRate / unit_attach_rate if unit_attach_rate > 0 else None
        
        if row.attachRate <= 0:
            return {"score": opportunity_score, "leverage": leverage, "signal": "No Signal", "reason": "No observed attachment in this market segment."}
        
        if row.attachRate < unit_cutoff:
            return {"score": opportunity_score, "leverage": leverage, "signal": "Monitor", "reason": f"Observed in this market segment, but below the unit benchmark of {unit_cutoff*100:.1f}%."}
            
        if leverage is not None and leverage >= 1.5 and opportunity_score < 10:
            return {"score": opportunity_score, "leverage": leverage, "signal": "Niche Industry Signal", "reason": f"Over-indexes at {leverage:.2f}x versus the unit average, but volume is smaller."}
            
        if leverage is not None and leverage >= 1.2:
            return {"score": opportunity_score, "leverage": leverage, "signal": "Strong Industry Opportunity", "reason": f"Above the unit benchmark and over-indexes at {leverage:.2f}x versus the unit average."}
            
        return {"score": opportunity_score, "leverage": leverage, "signal": "Good General Fit", "reason": f"Above the unit benchmark of {unit_cutoff*100:.1f}%."}

    def get_dashboard_data(self, unit_id: str) -> Dict:
        # 1. Base Unit Data
        all_unit_rows = self.repo.get_unit_attach_rates()
        unit_rows = [r for r in all_unit_rows if r.unit == unit_id and r.activations >= self.MIN_BASKETS]
        
        # 2. Calculate Cutoff
        cutoff_rates = [r.attachRate for r in unit_rows if r.associated >= self.MIN_BASKETS]
        cutoff = self.calculate_elbow_cutoff(cutoff_rates)
        unit_attach_map = {r.vaps: r.attachRate for r in unit_rows}
        
        # 3. Process Unit Rows (Enrichment for detail tables and comparison)
        processed_unit_rows = []
        total_activations = 0
        total_associated = 0
        for r in unit_rows:
            decision, reason = self.get_recommendation_decision(r, cutoff)
            r_dict = r.dict()
            r_dict.update({
                "decision": decision,
                "decisionReason": reason,
                "elbowCutoff": cutoff,
                "cutoffStatus": "Above Cutoff" if r.attachRate >= cutoff else "Below Cutoff",
                "coveredText": "Yes" if r.coveredByRecommendationLogic else "No"
            })
            processed_unit_rows.append(r_dict)
            total_activations = max(total_activations, r.activations)
            total_associated += r.associated

        # 4. Process All Segments (Enrichment for heatmaps and detail tables)
        segment_data = self.repo.get_all_segments_data()
        processed_segments = {}
        for name, rows in segment_data.items():
            segment_processed = []
            for r in rows:
                if r.unit == unit_id and r.activations >= self.MIN_BASKETS:
                    unit_rate = unit_attach_map.get(r.vaps, 0.0)
                    sig = self.get_industry_signal(r, cutoff, unit_rate)
                    r_dict = r.dict()
                    r_dict.update({
                        "unitAttachRate": unit_rate,
                        "industrySignal": sig["signal"],
                        "industrySignalReason": sig["reason"],
                        "opportunityScore": sig["score"],
                        "leverage": sig["leverage"],
                        "unitCutoff": cutoff,
                        "coveredText": "Yes" if r.coveredByRecommendationLogic else "No"
                    })
                    segment_processed.append(r_dict)
            processed_segments[name] = segment_processed

        return {
            "unitRows": processed_unit_rows,
            "segments": processed_segments,
            "summary": {
                "totalActivations": total_activations,
                "totalAssociated": total_associated,
                "unitAttachRate": total_associated / total_activations if total_activations > 0 else 0,
                "cutoff": cutoff
            }
        }

    def get_metadata(self) -> Dict:
        rows = self.repo.get_unit_attach_rates()
        return {
            "sources": sorted(list(set(r.source for r in rows if r.source))),
            "groups": sorted(list(set(r.mainGroup for r in rows if r.mainGroup)))
        }
