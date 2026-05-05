from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.api.deps import get_dashboard_service
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("/metadata")
async def get_metadata(
    service: DashboardService = Depends(get_dashboard_service)
):
    """
    Returns unique lists of VAPS sources and main groups across all units.
    """
    return service.get_metadata()

@router.get("/units")
async def get_units(
    service: DashboardService = Depends(get_dashboard_service)
):
    """
    Returns a unique list of available units with their names.
    """
    rows = service.repo.get_unit_attach_rates()
    # Create unique mapping of unit_code -> unit_name
    units = {}
    for r in rows:
        if r.unit not in units:
            units[r.unit] = r.unitName
    
    # Format for frontend
    return [{"code": k, "name": v} for k, v in sorted(units.items())]

@router.get("/dashboard/{unit_id}")
async def get_dashboard_data(
    unit_id: str,
    service: DashboardService = Depends(get_dashboard_service)
):
    """
    Returns the complete analytical payload for a unit.
    """
    try:
        data = service.get_dashboard_data(unit_id)
        if not data["unitRows"]:
            raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found or has no data")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
