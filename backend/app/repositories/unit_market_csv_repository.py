import pandas as pd
import os
import logging
from typing import List, Dict, Optional
from app.models.unit_market import UnitMarketSegmentRate, UnitMarketDashboardData
from app.core.config import settings

logger = logging.getLogger(__name__)

class UnitMarketCSVRepository:
    _cache: Dict[str, List[UnitMarketSegmentRate]] = {}
    _is_loaded = False

    def __init__(self):
        self.data_dir = settings.DATA_PATH
        if not UnitMarketCSVRepository._is_loaded:
            self._initialize_cache()

    def _text(self, val) -> str:
        if pd.isna(val):
            return ""
        return str(val or "").strip()

    def _number(self, val) -> float:
        if pd.isna(val):
            return 0.0
        try:
            return float(str(val or "").replace(",", ""))
        except ValueError:
            return 0.0

    def _initialize_cache(self):
        logger.info("Initializing UnitMarket CSV Cache...")
        
        files = {
            "latest": "latest_period_recommendations.csv",
            "high": "high_confidence_recommendations.csv",
            "low": "low_confidence_review_items.csv"
        }
        
        for key, filename in files.items():
            path = os.path.join(self.data_dir, filename)
            if os.path.exists(path):
                df = pd.read_csv(path)
                UnitMarketCSVRepository._cache[key] = self._process_dataframe(df)
            else:
                logger.warning(f"Data file {filename} not found!")
                UnitMarketCSVRepository._cache[key] = []
                
        UnitMarketCSVRepository._is_loaded = True
        logger.info("UnitMarket CSV Cache initialized.")

    def _process_dataframe(self, df: pd.DataFrame) -> List[UnitMarketSegmentRate]:
        rows = []
        for _, source_row in df.iterrows():
            rows.append(UnitMarketSegmentRate(
                unit=self._text(source_row.get("unit_code")),
                market=self._text(source_row.get("market_segment")),
                year=int(self._number(source_row.get("year"))),
                quarter=int(self._number(source_row.get("quarter"))),
                unitMarketActivations=int(self._number(source_row.get("latest_unit_market_activations"))),
                unitActivations=int(self._number(source_row.get("latest_unit_activations"))),
                marketActivations=int(self._number(source_row.get("latest_market_activations"))),
                marketContributionToProduct=self._number(source_row.get("latest_market_contribution_to_product")),
                productShareInMarket=self._number(source_row.get("latest_product_share_in_market")),
                productName=self._text(source_row.get("product_name")),
                unitDescription=self._text(source_row.get("unit_description")),
                unitDetailedDescription=self._text(source_row.get("unit_detaileddescription")),
                unitL1Purpose=self._text(source_row.get("unit_l1_purpose")),
                unitL2CoreSolution=self._text(source_row.get("unit_l2_core_solution")),
                unitL3Products=self._text(source_row.get("unit_l3_products")),
                
                latestActivations=int(self._number(source_row.get("latest_activations"))),
                historicalActivations=int(self._number(source_row.get("historical_activations"))),
                periodsObserved=int(self._number(source_row.get("periods_observed"))),
                
                historicalProductShareInMarket=self._number(source_row.get("historical_product_share_in_market")),
                historicalMarketContributionToProduct=self._number(source_row.get("historical_market_contribution_to_product")),
                
                blendedProductShareInMarket=self._number(source_row.get("blended_product_share_in_market")),
                blendedMarketContributionToProduct=self._number(source_row.get("blended_market_contribution_to_product")),
                
                momentumScore=self._number(source_row.get("momentum_score")),
                trendScore=self._number(source_row.get("trend_score")),
                supportScore=self._number(source_row.get("support_score")),
                
                confidenceLevel=self._text(source_row.get("confidence_level")),
                recommendationScore=self._number(source_row.get("recommendation_score")),
                recommendationLabel=self._text(source_row.get("recommendation_label")),
                reviewReason=self._text(source_row.get("review_reason"))
            ))
        return rows

    def get_latest_recommendations(self) -> List[UnitMarketSegmentRate]:
        return UnitMarketCSVRepository._cache.get("latest", [])

    def get_high_confidence(self) -> List[UnitMarketSegmentRate]:
        return UnitMarketCSVRepository._cache.get("high", [])

    def get_low_confidence(self) -> List[UnitMarketSegmentRate]:
        return UnitMarketCSVRepository._cache.get("low", [])
