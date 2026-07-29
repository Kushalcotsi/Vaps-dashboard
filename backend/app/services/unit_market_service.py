from typing import List, Dict, Union
from app.models.unit_market import UnitMarketDashboardData, UnitMarketSegmentRate
from app.repositories.unit_market_csv_repository import UnitMarketCSVRepository
from app.repositories.unit_market_snowflake_repository import UnitMarketSnowflakeRepository
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class UnitMarketService:
    def __init__(self, repo: Union[UnitMarketCSVRepository, UnitMarketSnowflakeRepository]):
        self.repo = repo

    def get_dashboard_data(self, unit_id: str, market_id: str = "all") -> UnitMarketDashboardData:
        # 1. Fetch raw data
        all_latest = self.repo.get_latest_recommendations()
        all_high = self.repo.get_high_confidence()
        all_low = self.repo.get_low_confidence()
        
        # 2. Filter by unit
        if unit_id.lower() != 'all':
            all_latest = [r for r in all_latest if r.unit == unit_id]
            all_high = [r for r in all_high if r.unit == unit_id]
            all_low = [r for r in all_low if r.unit == unit_id]
            
        # 3. Filter by market
        if market_id and market_id.lower() != 'all':
            all_latest = [r for r in all_latest if r.market == market_id]
            all_high = [r for r in all_high if r.market == market_id]
            all_low = [r for r in all_low if r.market == market_id]
            
        summary = {
            "total_recommendations": len(all_latest),
            "high_confidence_count": len(all_high),
            "low_confidence_count": len(all_low)
        }
        
        return UnitMarketDashboardData(
            latestRecommendations=all_latest,
            highConfidenceRecommendations=all_high,
            lowConfidenceReviewItems=all_low,
            summary=summary
        )

    def get_metadata(self) -> Dict:
        # Generate metadata from latest recommendations for dropdowns
        all_latest = self.repo.get_latest_recommendations()
        
        units = {}
        markets = set()
        
        for r in all_latest:
            if r.unit not in units:
                units[r.unit] = r.productName
            if r.market and str(r.market).strip().lower() not in ("all", "all markets", "all market"):
                markets.add(str(r.market).strip())
                
        return {
            "units": [{"code": k, "name": v} for k, v in sorted(units.items())],
            "markets": sorted(list(markets))
        }
