from abc import ABC, abstractmethod
from typing import List, Dict, Tuple
from app.models.dashboard import VapsAttachRate, RecommendationEntry

class BaseRepository(ABC):
    @abstractmethod
    def get_unit_attach_rates(self) -> List[VapsAttachRate]:
        pass

    @abstractmethod
    def get_market_attach_rates(self) -> List[VapsAttachRate]:
        pass

    @abstractmethod
    def get_division_attach_rates(self) -> List[VapsAttachRate]:
        pass

    @abstractmethod
    def get_region_attach_rates(self) -> List[VapsAttachRate]:
        pass

    @abstractmethod
    def get_recommendation_entries(self) -> Dict[Tuple[str, str], RecommendationEntry]:
        pass
