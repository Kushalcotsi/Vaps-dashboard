import logging
import re
from typing import List, Optional
from functools import lru_cache
import snowflake.connector
from app.models.unit_market import UnitMarketSegmentRate
from app.core.config import settings
from app.repositories.snowflake_repository import SnowflakeRepository

logger = logging.getLogger(__name__)

class UnitMarketSnowflakeRepository(SnowflakeRepository):
    def __init__(self):
        super().__init__()
        db = settings.SNOWFLAKE_DATABASE or "AI_AGENT_LOGS"
        schema = settings.SNOWFLAKE_SCHEMA or "TEST"
        self.view_name = f"{db}.{schema}.GS_UNIT_MARKET_SEGMENT_ATTACH_RATE"
        logger.info(f"Initialized UnitMarketSnowflakeRepository for view: {self.view_name}")

    def _text(self, val) -> str:
        if val is None:
            return ""
        return str(val).strip()

    def _number(self, val) -> float:
        if val is None:
            return 0.0
        try:
            return float(str(val).replace(",", ""))
        except (ValueError, TypeError):
            return 0.0

    def _get_val(self, row: dict, *keys, default=None):
        normalized_map = {re.sub(r"[^a-zA-Z0-9]+", "_", str(k).strip().lower()).strip("_"): v for k, v in row.items()}
        for key in keys:
            val = row.get(key)
            if val is None:
                val = row.get(key.upper())
            if val is None:
                val = row.get(key.lower())
            if val is None:
                norm_key = re.sub(r"[^a-zA-Z0-9]+", "_", str(key).strip().lower()).strip("_")
                val = normalized_map.get(norm_key)
            if val is not None and str(val).strip() != "":
                return val
        return default

    @lru_cache(maxsize=1)
    def get_latest_recommendations(self) -> List[UnitMarketSegmentRate]:
        rows = []
        try:
            conn = self._get_connection()
            with conn.cursor(snowflake.connector.DictCursor) as cur:
                query = f"SELECT * FROM {self.view_name}"
                logger.info(f"Executing Snowflake Query for UnitMarket: {query}")
                cur.execute(query)
                for row in cur:
                    unit_code = self._text(self._get_val(row, "UNIT_CODE", "PRODUCT_CODE", "SKU", "ITEM_CODE", "UNIT_SKU", "UNIT", "CODE"))
                    if not unit_code:
                        continue

                    rows.append(UnitMarketSegmentRate(
                        unit=unit_code,
                        market=self._text(self._get_val(row, "MARKET_SEGMENT", "MARKET_SEGMENT_DESCRIPTION", "SEGMENT", "MARKET", "MARKET_NAME", default="All")),
                        year=int(self._number(self._get_val(row, "YEAR", "FISCAL_YEAR", default=2024))),
                        quarter=int(self._number(self._get_val(row, "QUARTER", "QTR", "FISCAL_QUARTER", default=1))),
                        unitMarketActivations=int(self._number(self._get_val(row, "LATEST_UNIT_MARKET_ACTIVATIONS", "UNIT_MARKET_ACTIVATIONS", "PRODUCT_MARKET_ACTIVATIONS", "PRODUCT_SEGMENT_ACTIVATIONS"))),
                        unitActivations=int(self._number(self._get_val(row, "LATEST_UNIT_ACTIVATIONS", "UNIT_ACTIVATIONS", "PRODUCT_ACTIVATIONS", "TOTAL_UNIT_ACTIVATIONS"))),
                        marketActivations=int(self._number(self._get_val(row, "LATEST_MARKET_ACTIVATIONS", "MARKET_ACTIVATIONS", "SEGMENT_ACTIVATIONS", "TOTAL_MARKET_ACTIVATIONS"))),
                        marketContributionToProduct=self._number(self._get_val(row, "LATEST_MARKET_CONTRIBUTION_TO_PRODUCT", "MARKET_CONTRIBUTION_TO_PRODUCT", "CONTRIBUTION_TO_PRODUCT", "MARKET_CONTRIBUTION")),
                        productShareInMarket=self._number(self._get_val(row, "LATEST_PRODUCT_SHARE_IN_MARKET", "PRODUCT_SHARE_IN_MARKET", "SHARE_IN_MARKET", "MARKET_SHARE")),
                        productName=self._text(self._get_val(row, "PRODUCT_NAME", "UNIT_PRODUCTNAME_SF", "PRODUCT", "ITEM_NAME")),
                        unitDescription=self._text(self._get_val(row, "UNIT_DESCRIPTION", "DESCRIPTION")),
                        unitDetailedDescription=self._text(self._get_val(row, "UNIT_DETAILEDDESCRIPTION", "UNIT_DETAILED_DESCRIPTION")),
                        unitL1Purpose=self._text(self._get_val(row, "UNIT_L1_PURPOSE", "L1_PURPOSE")),
                        unitL2CoreSolution=self._text(self._get_val(row, "UNIT_L2_CORE_SOLUTION", "L2_CORE_SOLUTION")),
                        unitL3Products=self._text(self._get_val(row, "UNIT_L3_PRODUCTS", "L3_PRODUCTS")),
                        
                        latestActivations=int(self._number(self._get_val(row, "LATEST_ACTIVATIONS", "ACTIVATIONS"))),
                        historicalActivations=int(self._number(self._get_val(row, "HISTORICAL_ACTIVATIONS"))),
                        periodsObserved=int(self._number(self._get_val(row, "PERIODS_OBSERVED", default=1))),
                        
                        historicalProductShareInMarket=self._number(self._get_val(row, "HISTORICAL_PRODUCT_SHARE_IN_MARKET")),
                        historicalMarketContributionToProduct=self._number(self._get_val(row, "HISTORICAL_MARKET_CONTRIBUTION_TO_PRODUCT")),
                        
                        blendedProductShareInMarket=self._number(self._get_val(row, "BLENDED_PRODUCT_SHARE_IN_MARKET")),
                        blendedMarketContributionToProduct=self._number(self._get_val(row, "BLENDED_MARKET_CONTRIBUTION_TO_PRODUCT")),
                        
                        momentumScore=self._number(self._get_val(row, "MOMENTUM_SCORE", "MOMENTUM")),
                        trendScore=self._number(self._get_val(row, "TREND_SCORE", "TREND")),
                        supportScore=self._number(self._get_val(row, "SUPPORT_SCORE", "SUPPORT")),
                        
                        confidenceLevel=self._text(self._get_val(row, "CONFIDENCE_LEVEL", "CONFIDENCE", default="Medium")),
                        recommendationScore=self._number(self._get_val(row, "RECOMMENDATION_SCORE", "SCORE")),
                        recommendationLabel=self._text(self._get_val(row, "RECOMMENDATION_LABEL", "LABEL", default="Core Recommendation")),
                        reviewReason=self._text(self._get_val(row, "REVIEW_REASON", "REASON"))
                    ))
        except Exception as e:
            logger.error(f"❌ SNOWFLAKE ERROR in UnitMarket get_latest_recommendations: {str(e)}")
            raise e

        return rows

    def get_high_confidence(self) -> List[UnitMarketSegmentRate]:
        all_rows = self.get_latest_recommendations()
        return [
            r for r in all_rows 
            if r.confidenceLevel.lower() in ("high", "medium")
            and r.recommendationLabel in ("Core Recommendation", "Emerging Opportunity", "White Space Opportunity")
        ]

    def get_low_confidence(self) -> List[UnitMarketSegmentRate]:
        all_rows = self.get_latest_recommendations()
        return [
            r for r in all_rows 
            if r.confidenceLevel.lower() == "low" 
            or r.recommendationLabel in ("Insufficient Data", "Low Priority")
            or (r.reviewReason and "No review flag" not in str(r.reviewReason))
        ]
