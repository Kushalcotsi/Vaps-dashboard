from app.repositories.csv_repository import CSVRepository
from app.repositories.snowflake_repository import SnowflakeRepository
from app.repositories.base import BaseRepository
from app.services.dashboard_service import DashboardService
from app.repositories.unit_market_csv_repository import UnitMarketCSVRepository
from app.repositories.unit_market_snowflake_repository import UnitMarketSnowflakeRepository
from app.services.unit_market_service import UnitMarketService
from app.core.config import settings

import threading
_repository_instance: BaseRepository = None
_unit_market_repo_instance = None
_repo_lock = threading.Lock()

def get_repository() -> BaseRepository:
    global _repository_instance
    if _repository_instance is None:
        with _repo_lock:
            if _repository_instance is None:
                if settings.is_snowflake_enabled:
                    _repository_instance = SnowflakeRepository()
                else:
                    _repository_instance = CSVRepository()
    return _repository_instance

def get_unit_market_repository():
    global _unit_market_repo_instance
    if _unit_market_repo_instance is None:
        with _repo_lock:
            if _unit_market_repo_instance is None:
                if settings.is_snowflake_enabled:
                    _unit_market_repo_instance = UnitMarketSnowflakeRepository()
                else:
                    _unit_market_repo_instance = UnitMarketCSVRepository()
    return _unit_market_repo_instance

def get_dashboard_service() -> DashboardService:
    repo = get_repository()
    return DashboardService(repo)

def get_unit_market_service() -> UnitMarketService:
    repo = get_unit_market_repository()
    return UnitMarketService(repo)
