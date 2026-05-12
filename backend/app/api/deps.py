from app.repositories.csv_repository import CSVRepository
from app.repositories.snowflake_repository import SnowflakeRepository
from app.repositories.base import BaseRepository
from app.services.dashboard_service import DashboardService
from app.core.config import settings

import threading
_repository_instance: BaseRepository = None
_repo_lock = threading.Lock()

def get_repository() -> BaseRepository:
    global _repository_instance
    if _repository_instance is None:
        with _repo_lock:
            if _repository_instance is None:
                if settings.USE_SNOWFLAKE:
                    _repository_instance = SnowflakeRepository()
                else:
                    _repository_instance = CSVRepository()
    return _repository_instance

def get_dashboard_service() -> DashboardService:
    repo = get_repository()
    return DashboardService(repo)
