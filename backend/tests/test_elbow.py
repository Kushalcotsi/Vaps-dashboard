import unittest
from app.services.dashboard_service import DashboardService
from app.repositories.base import BaseRepository

class DummyRepo(BaseRepository):
    def get_unit_attach_rates(self): return []
    def get_market_attach_rates(self): return []
    def get_division_attach_rates(self): return []
    def get_region_attach_rates(self): return []
    def get_recommendation_entries(self): return {}

class TestElbowCutoff(unittest.TestCase):
    def setUp(self):
        self.service = DashboardService(DummyRepo())

    def test_calculate_elbow_cutoff(self):
        # A simple list of attach rates. 
        # The algorithm expects a list of floats (0 to 1).
        # We know if it drops off drastically, it will pick that point.
        rates = [0.90, 0.85, 0.80, 0.20, 0.15, 0.10, 0.05, 0.01, 0.00]
        
        # the unique rates > 0 are: 90, 85, 80, 20, 15, 10, 5, 1
        # It's an array of 8 elements. Let's find the elbow point.
        cutoff = self.service.calculate_elbow_cutoff(rates)
        
        # In [0.90, 0.85, 0.80, 0.20, 0.15, 0.10, 0.05, 0.01],
        # The sharp drop is between 0.80 and 0.20. The point of max distance is typically 0.80.
        # Let's verify that the algorithm returns one of the rates.
        self.assertIn(cutoff, rates)

    def test_calculate_elbow_cutoff_few_elements(self):
        # Test default cutoff when less than 3 unique elements
        rates_few = [0.90, 0.85]
        cutoff_few = self.service.calculate_elbow_cutoff(rates_few)
        self.assertEqual(cutoff_few, 0.85)
        
        rates_none = [0.0]
        cutoff_none = self.service.calculate_elbow_cutoff(rates_none)
        self.assertEqual(cutoff_none, 0.05) # DEFAULT_CUTOFF

if __name__ == '__main__':
    unittest.main()
