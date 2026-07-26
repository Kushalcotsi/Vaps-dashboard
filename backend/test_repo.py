from app.repositories.csv_repository import CSVRepository
import logging

logging.basicConfig(level=logging.INFO)

try:
    repo = CSVRepository()
    print("Market Count:", len(repo.get_market_attach_rates()))
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
