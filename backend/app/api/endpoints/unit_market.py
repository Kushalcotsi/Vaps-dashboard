from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from app.api.deps import get_unit_market_service
from app.services.unit_market_service import UnitMarketService

router = APIRouter()

@router.get("/metadata")
async def get_metadata(
    service: UnitMarketService = Depends(get_unit_market_service)
):
    """
    Returns unique lists of units and markets for Unit Market Segment section.
    """
    return service.get_metadata()

@router.get("/dashboard/{unit_id}")
async def get_dashboard_data(
    unit_id: str,
    market: str = "all",
    service: UnitMarketService = Depends(get_unit_market_service)
):
    """
    Returns the analytical payload for a unit market segment.
    """
    try:
        data = service.get_dashboard_data(unit_id, market)
        if not data.latestRecommendations and unit_id.lower() != 'all':
            raise HTTPException(status_code=404, detail=f"Data for Unit {unit_id} and Market {market} not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
