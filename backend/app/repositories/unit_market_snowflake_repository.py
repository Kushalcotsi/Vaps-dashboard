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

    def _process_dataframe(self, df) -> List[UnitMarketSegmentRate]:
        rows = []
        for _, source_row in df.iterrows():
            rows.append(UnitMarketSegmentRate(
                unit=self._text(source_row.get("unit_code") or source_row.get("UNIT_CODE")),
                market=self._text(source_row.get("market_segment") or source_row.get("MARKET_SEGMENT")),
                year=int(self._number(source_row.get("year") or source_row.get("YEAR"))),
                quarter=int(self._number(source_row.get("quarter") or source_row.get("QUARTER"))),
                unitMarketActivations=int(self._number(source_row.get("latest_unit_market_activations") or source_row.get("unit_market_activations") or source_row.get("LATEST_UNIT_MARKET_ACTIVATIONS"))),
                unitActivations=int(self._number(source_row.get("latest_unit_activations") or source_row.get("unit_activations") or source_row.get("LATEST_UNIT_ACTIVATIONS"))),
                marketActivations=int(self._number(source_row.get("latest_market_activations") or source_row.get("market_activations") or source_row.get("LATEST_MARKET_ACTIVATIONS"))),
                marketContributionToProduct=self._number(source_row.get("latest_market_contribution_to_product") or source_row.get("market_contribution_to_product") or source_row.get("LATEST_MARKET_CONTRIBUTION_TO_PRODUCT")),
                productShareInMarket=self._number(source_row.get("latest_product_share_in_market") or source_row.get("product_share_in_market") or source_row.get("LATEST_PRODUCT_SHARE_IN_MARKET")),
                productName=self._text(source_row.get("product_name") or source_row.get("PRODUCT_NAME")),
                unitDescription=self._text(source_row.get("unit_description") or source_row.get("UNIT_DESCRIPTION")),
                unitDetailedDescription=self._text(source_row.get("unit_detaileddescription") or source_row.get("UNIT_DETAILEDDESCRIPTION")),
                unitL1Purpose=self._text(source_row.get("unit_l1_purpose") or source_row.get("UNIT_L1_PURPOSE")),
                unitL2CoreSolution=self._text(source_row.get("unit_l2_core_solution") or source_row.get("UNIT_L2_CORE_SOLUTION")),
                unitL3Products=self._text(source_row.get("unit_l3_products") or source_row.get("UNIT_L3_PRODUCTS")),
                
                latestActivations=int(self._number(source_row.get("latest_activations") or source_row.get("LATEST_ACTIVATIONS"))),
                historicalActivations=int(self._number(source_row.get("historical_activations") or source_row.get("HISTORICAL_ACTIVATIONS"))),
                periodsObserved=int(self._number(source_row.get("periods_observed") or source_row.get("PERIODS_OBSERVED", 1))),
                
                historicalProductShareInMarket=self._number(source_row.get("historical_product_share_in_market") or source_row.get("HISTORICAL_PRODUCT_SHARE_IN_MARKET")),
                historicalMarketContributionToProduct=self._number(source_row.get("historical_market_contribution_to_product") or source_row.get("HISTORICAL_MARKET_CONTRIBUTION_TO_PRODUCT")),
                
                blendedProductShareInMarket=self._number(source_row.get("blended_product_share_in_market") or source_row.get("BLENDED_PRODUCT_SHARE_IN_MARKET")),
                blendedMarketContributionToProduct=self._number(source_row.get("blended_market_contribution_to_product") or source_row.get("BLENDED_MARKET_CONTRIBUTION_TO_PRODUCT")),
                
                momentumScore=self._number(source_row.get("momentum_score") or source_row.get("MOMENTUM_SCORE")),
                trendScore=self._number(source_row.get("trend_score") or source_row.get("TREND_SCORE")),
                supportScore=self._number(source_row.get("support_score") or source_row.get("SUPPORT_SCORE")),
                
                confidenceLevel=self._text(source_row.get("confidence_level") or source_row.get("CONFIDENCE_LEVEL", "Medium")),
                recommendationScore=self._number(source_row.get("recommendation_score") or source_row.get("RECOMMENDATION_SCORE")),
                recommendationLabel=self._text(source_row.get("recommendation_label") or source_row.get("RECOMMENDATION_LABEL", "Core Recommendation")),
                reviewReason=self._text(source_row.get("review_reason") or source_row.get("REVIEW_REASON"))
            ))
        return rows

    def _ensure_loaded(self):
        if hasattr(self, "_is_loaded") and self._is_loaded:
            return
        self._latest_cache = []
        self._high_cache = []
        self._low_cache = []
        try:
            conn = self._get_connection()
            with conn.cursor(snowflake.connector.DictCursor) as cur:
                query = f"SELECT * FROM {self.view_name}"
                logger.info(f"Executing Snowflake Query for UnitMarket: {query}")
                cur.execute(query)
                raw_rows = cur.fetchall()
                if raw_rows:
                    try:
                        import pandas as pd
                        import sys
                        import os
                        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
                        if root_dir not in sys.path:
                            sys.path.insert(0, root_dir)
                        from build_recommendation_report import (
                            prepare_schema,
                            calculate_time_aware_features,
                            build_latest_recommendations,
                            build_primary_recommendations,
                            build_high_confidence_recommendations,
                            build_low_confidence_review_items,
                        )
                        df = pd.DataFrame(raw_rows)
                        df, schema = prepare_schema(df)
                        if "recommendation_score" not in df.columns or df["recommendation_score"].isna().all() or (df["recommendation_score"] == 0).all():
                            df = calculate_time_aware_features(df, schema)
                        latest_df = build_latest_recommendations(df, schema)
                        primary_df = build_primary_recommendations(latest_df, schema)
                        high_df = build_high_confidence_recommendations(primary_df)
                        low_df = build_low_confidence_review_items(latest_df, schema)

                        self._latest_cache = self._process_dataframe(latest_df)
                        self._high_cache = self._process_dataframe(high_df)
                        self._low_cache = self._process_dataframe(low_df)
                        self._is_loaded = True
                        logger.info(f"UnitMarket Snowflake auto-transformation succeeded: {len(self._latest_cache)} latest records loaded.")
                        return
                    except Exception as transform_err:
                        logger.warning(f"Snowflake auto-transformation fallback due to: {transform_err}")

                    # Fallback to direct row mapping if transformation is skipped
                    for row in raw_rows:
                        unit_code = self._text(self._get_val(row, "UNIT_CODE", "PRODUCT_CODE", "SKU", "ITEM_CODE", "UNIT_SKU", "UNIT", "CODE"))
                        if not unit_code:
                            continue
                        self._latest_cache.append(UnitMarketSegmentRate(
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
                    self._high_cache = [r for r in self._latest_cache if r.confidenceLevel.lower() in ("high", "medium") and r.recommendationLabel in ("Core Recommendation", "Emerging Opportunity", "White Space Opportunity")]
                    self._low_cache = [r for r in self._latest_cache if r.confidenceLevel.lower() == "low" or r.recommendationLabel in ("Insufficient Data", "Low Priority") or (r.reviewReason and "No review flag" not in str(r.reviewReason))]
        except Exception as e:
            logger.error(f"❌ SNOWFLAKE ERROR in UnitMarket get_latest_recommendations: {str(e)}")
            raise e
        self._is_loaded = True

    def get_latest_recommendations(self) -> List[UnitMarketSegmentRate]:
        self._ensure_loaded()
        return self._latest_cache

    def get_high_confidence(self) -> List[UnitMarketSegmentRate]:
        self._ensure_loaded()
        return self._high_cache

    def get_low_confidence(self) -> List[UnitMarketSegmentRate]:
        self._ensure_loaded()
        return self._low_cache
