from app.repositories.csv_repository import CSVRepository
from app.repositories.snowflake_repository import SnowflakeRepository
from app.repositories.base import BaseRepository
from app.services.dashboard_service import DashboardService
from app.core.config import settings

def get_repository() -> BaseRepository:
    # This is where we toggle between CSV and Snowflake
    if settings.USE_SNOWFLAKE:
        return SnowflakeRepository()
    return CSVRepository()

def get_dashboard_service() -> DashboardService:
    repo = get_repository()
    return DashboardService(repo)
