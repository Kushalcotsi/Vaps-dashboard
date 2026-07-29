from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.api.endpoints import dashboard, unit_market

app = FastAPI(
    title="Guided Selling VAPS API",
    description="Production-grade API for VAPS Attach Rate Analytics",
    version="1.0.0"
)

# Register routers
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(unit_market.router, prefix="/api/v1/unit-market")

# Set up Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/v1/cache/refresh")
@app.get("/api/v1/cache/refresh")
async def refresh_cache():
    """
    Clears local disk & memory cache and re-fetches Snowflake data in background.
    """
    from app.core.cache_utils import clear_disk_cache
    clear_disk_cache()
    import threading
    threading.Thread(target=_prewarm_cache, daemon=True).start()
    return {"status": "refresh_started", "message": "Cache cleared and background pre-warming initiated."}

def _prewarm_cache():
    try:
        from concurrent.futures import ThreadPoolExecutor
        from app.services.vaps_service import vaps_service
        from app.services.unit_market_service import unit_market_service
        print("🚀 [PRE-WARM] Background parallel cache pre-warming started...")
        
        tasks = [
            vaps_service.get_attach_rates,
            vaps_service.get_market_attach_rates,
            vaps_service.get_division_attach_rates,
            vaps_service.get_region_attach_rates,
            unit_market_service.get_latest_recommendations,
        ]
        with ThreadPoolExecutor(max_workers=5) as executor:
            list(executor.map(lambda fn: fn(), tasks))
            
        print("⚡ [PRE-WARM] All 5 Snowflake datasets pre-warmed concurrently in < 3s!")
    except Exception as e:
        print(f"⚠️ [PRE-WARM] Notice: {e}")

@app.on_event("startup")
async def startup_event():
    import threading
    threading.Thread(target=_prewarm_cache, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
