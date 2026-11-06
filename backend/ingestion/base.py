from abc import ABC, abstractmethod
from typing import List
from backend.ingestion.models import NormalizedJob

class BaseConnector(ABC):
    """
    Abstract base class for all job ingestion connectors.
    Ensures unified error handling and normalized output.
    """
    name: str = "Base"

    @abstractmethod
    def fetch_jobs(self, limit: int = 50) -> List[NormalizedJob]:
        """Fetch and return normalized job listings."""
        pass

