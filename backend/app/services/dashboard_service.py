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
            return "Keep Logic + Promote", f"Conditional or quantity-driven logic is already present and attach rate is at or above the unit cutoff of {cutoff*100:.1f}%."
        
        if row.coveredByRecommendationLogic and not is_fixed:
            return "Keep Logic", "Conditional or quantity-driven logic is already present; broad attach rate alone should not remove it."
            
        if row.coveredByRecommendationLogic and row.attachRate >= cutoff:
            return "Keep", f"Fixed recommendation is at or above the unit cutoff of {cutoff*100:.1f}%."
            
        if row.coveredByRecommendationLogic:
            return "Review Removal", f"Fixed recommendation is below the unit cutoff of {cutoff*100:.1f}%."
            
        if row.attachRate >= cutoff and row.associated > 0:
            return "Add", f"Not covered by recommendation logic and at or above the unit cutoff of {cutoff*100:.1f}%."
            
        if row.attachRate > 0:
            return "Monitor", f"Observed in transactions, but below the unit cutoff of {cutoff*100:.1f}%."
            
        return "No Action", "No observed attachment and not covered by recommendation logic."

    def get_industry_signal(self, row: VapsAttachRate, unit_cutoff: float, unit_attach_rate: float) -> Dict:
        opportunity_score = max(0, row.attachRate - unit_cutoff) * row.activations
        leverage = row.attachRate / unit_attach_rate if unit_attach_rate > 0 else None
        
        if row.attachRate <= 0:
            return {
                "score": opportunity_score, 
                "leverage": leverage, 
                "signal": "No Signal", 
                "reason": "No observed attachment in this market segment."
            }
        
        if row.attachRate < unit_cutoff:
            return {
                "score": opportunity_score, 
                "leverage": leverage, 
                "signal": "Monitor", 
                "reason": f"Observed in this market segment, but below the unit benchmark of {unit_cutoff*100:.1f}%."
            }
            
        if leverage is not None and leverage >= 1.5 and opportunity_score < 10:
            return {
                "score": opportunity_score, 
                "leverage": leverage, 
                "signal": "Niche Industry Signal", 
                "reason": f"Over-indexes at {leverage:.2f}x versus the unit average, but volume is smaller."
            }
            
        if leverage is not None and leverage >= 1.2:
            return {
                "score": opportunity_score, 
                "leverage": leverage, 
                "signal": "Strong Industry Opportunity", 
                "reason": f"Above the unit benchmark and over-indexes at {leverage:.2f}x versus the unit average."
            }
            
        return {
            "score": opportunity_score, 
            "leverage": leverage, 
            "signal": "Good General Fit", 
            "reason": f"Above the unit benchmark of {unit_cutoff*100:.1f}% and consistent with the unit's overall pattern."
        }

    def get_dashboard_data(self, unit_id: str) -> Dict:
        # 1. Base Unit Data
        all_unit_rows = self.repo.get_unit_attach_rates()
        if unit_id.lower() == 'all':
            unit_rows = [r for r in all_unit_rows if r.activations >= self.MIN_BASKETS]
        else:
            unit_rows = [r for r in all_unit_rows if r.unit == unit_id and r.activations >= self.MIN_BASKETS]
        
        if not unit_rows:
            return {
                "unitRows": [], 
                "recommendationRows": [],
                "segments": {"Market": [], "Division": [], "Region": []}, 
                "summary": {"cutoff": 0.0, "activations": 0, "associated": 0}
            }

        # 2. Calculate Cutoff
        cutoff_rates = [r.attachRate for r in unit_rows if r.associated >= self.MIN_BASKETS]
        cutoff = self.calculate_elbow_cutoff(cutoff_rates)
        
        # 3. Process Unit Rows (Full observed dataset)
        processed_unit_rows = []
        for row in unit_rows:
            decision, reason = self.get_recommendation_decision(row, cutoff)
            row.decision = decision
            row.decisionReason = reason
            row.elbowCutoff = cutoff
            row.cutoffStatus = "Above cutoff" if row.attachRate >= cutoff else "Below cutoff"
            processed_unit_rows.append(row)
            
        # 4. Process Recommendation Rows (Strictly from Sheet)
        all_recommendations = self.repo.get_recommendation_entries()
        unit_recs = [rec for (uid, vid), rec in all_recommendations.items() if uid == unit_id]
        
        # Sort by sequence to match reference
        unit_recs.sort(key=lambda x: x.sequence)
        
        recommendation_rows = []
        attach_by_vaps = {r.vaps: r for r in unit_rows}
        
        for rec in unit_recs:
            attach = attach_by_vaps.get(rec.vaps)
            
            # Create a parity object starting from RecommendationEntry
            row_data = VapsAttachRate(
                unit=rec.unit,
                vaps=rec.vaps,
                vapsDesc=attach.vapsDesc if attach else rec.vapsDesc,
                activations=attach.activations if attach else 0,
                associated=attach.associated if attach else 0,
                attachRate=attach.attachRate if attach else 0.0,
                unitName=attach.unitName if attach else "",
                unitDescription=attach.unitDescription if attach else "",
                unitL2=attach.unitL2 if attach else "",
                unitL3=attach.unitL3 if attach else "",
                mainGroup=attach.mainGroup if attach else "Unmapped",
                detailedGroup=attach.detailedGroup if attach else "Unmapped",
                tier=attach.tier if attach else "Unmapped",
                source=attach.source if attach else "Unmapped",
                coveredByRecommendationLogic=rec.coveredByRecommendationLogic,
                recommendationValue=rec.recommendationValue,
                recommendationKind=rec.recommendationKind,
                coveredText="Yes" if rec.coveredByRecommendationLogic else "No"
            )
            
            decision, reason = self.get_recommendation_decision(row_data, cutoff)
            row_data.decision = decision
            row_data.decisionReason = reason
            row_data.elbowCutoff = cutoff
            recommendation_rows.append(row_data)

        # 5. Process Segments
        segments_data = self.repo.get_all_segments_data()
        processed_segments = {}
        
        unit_attach_by_vaps = {r.vaps: r.attachRate for r in unit_rows}
        
        for segment_name, rows in segments_data.items():
            segment_rows = [r for r in rows if r.unit == unit_id and r.activations >= self.MIN_BASKETS]
            for r in segment_rows:
                unit_rate = unit_attach_by_vaps.get(r.vaps, 0.0)
                sig = self.get_industry_signal(r, cutoff, unit_rate)
                r.industrySignal = sig["signal"]
                r.industrySignalReason = sig["reason"]
                r.opportunityScore = sig["score"]
                r.leverage = sig["leverage"]
                r.unitAttachRate = unit_rate
                r.unitCutoff = cutoff
            processed_segments[segment_name] = segment_rows

        # 6. Process Industry Recommendation Rows (Cross-join RecommendationSheet x Markets)
        industry_recommendation_rows = []
        market_rows = processed_segments.get("Market", [])
        unique_markets = sorted(list(set(r.market for r in market_rows if r.market)))
        
        # Helper to find market-specific metrics
        market_metrics_map = {(r.vaps, r.market): r for r in market_rows}
        
        for market in unique_markets:
            for rec_row in recommendation_rows:
                market_row = market_metrics_map.get((rec_row.vaps, market))
                
                # Create a new instance for this specific market comparison
                row_data = rec_row.copy()
                row_data.market = market
                row_data.activations = market_row.activations if market_row else 0
                row_data.associated = market_row.associated if market_row else 0
                row_data.attachRate = market_row.attachRate if market_row else 0.0
                row_data.unitAttachRate = rec_row.attachRate # Base unit rate for leverage
                row_data.unitCutoff = cutoff
                
                # Re-calculate industry signal for this market
                sig = self.get_industry_signal(row_data, cutoff, rec_row.attachRate)
                row_data.industrySignal = sig["signal"]
                row_data.industrySignalReason = sig["reason"]
                row_data.opportunityScore = sig["score"]
                row_data.leverage = sig["leverage"]
                
                industry_recommendation_rows.append(row_data)

        # 7. Summary Metrics
        first_row = unit_rows[0] if unit_rows else None
        summary = {
            "cutoff": cutoff,
            "activations": max([r.activations for r in unit_rows]) if unit_rows else 0,
            "associated": sum([r.associated for r in unit_rows]),
            "unitName": first_row.unitName if first_row else "",
            "unitDescription": first_row.unitDescription if first_row else "",
            "unitL2": first_row.unitL2 if first_row else "",
            "unitL3": first_row.unitL3 if first_row else ""
        }

        return {
            "unitRows": processed_unit_rows,
            "recommendationRows": recommendation_rows,
            "industryRecommendationRows": industry_recommendation_rows,
            "segments": processed_segments,
            "summary": summary
        }

    def get_metadata(self) -> Dict:
        rows = self.repo.get_unit_attach_rates()
        return {
            "sources": sorted(list(set(r.source for r in rows if r.source))),
            "groups": sorted(list(set(r.mainGroup for r in rows if r.mainGroup)))
        }
