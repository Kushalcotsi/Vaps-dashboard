import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_units_endpoint(self):
        response = self.client.get("/api/v1/units")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        
        if len(response.json()) > 0:
            unit = response.json()[0]
            self.assertIn("code", unit)

    def test_dashboard_endpoint(self):
        response = self.client.get("/api/v1/dashboard/10W")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("unitRows", data)
        self.assertIn("marketRows", data)
        self.assertIn("divisionRows", data)
        self.assertIn("regionRows", data)
        self.assertIn("cutoff", data)

if __name__ == '__main__':
    unittest.main()
