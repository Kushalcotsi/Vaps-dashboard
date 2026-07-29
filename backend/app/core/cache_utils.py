import os
import pickle
import time
import logging
from typing import Any, Optional, Callable
from functools import wraps

logger = logging.getLogger(__name__)

CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.cache"))
os.makedirs(CACHE_DIR, exist_ok=True)

DEFAULT_TTL_SECONDS = 3600 * 12  # 12 hours

def get_disk_cache(key: str, ttl: int = DEFAULT_TTL_SECONDS) -> Optional[Any]:
    """
    Retrieves a cached item from disk if it exists and has not expired.
    """
    file_path = os.path.join(CACHE_DIR, f"{key}.pkl")
    if not os.path.exists(file_path):
        return None
    try:
        mtime = os.path.getmtime(file_path)
        if (time.time() - mtime) > ttl:
            logger.info(f"Disk cache expired for key: {key}")
            return None
        with open(file_path, "rb") as f:
            data = pickle.load(f)
            logger.info(f"⚡ Loaded from high-speed disk cache: {key}")
            return data
    except Exception as e:
        logger.warning(f"Failed to read disk cache {key}: {e}")
        return None

def set_disk_cache(key: str, data: Any) -> None:
    """
    Saves an item to disk cache.
    """
    file_path = os.path.join(CACHE_DIR, f"{key}.pkl")
    try:
        with open(file_path, "wb") as f:
            pickle.dump(data, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.info(f"💾 Saved to disk cache: {key}")
    except Exception as e:
        logger.warning(f"Failed to save disk cache {key}: {e}")

def clear_disk_cache(key: Optional[str] = None) -> None:
    """
    Clears disk cache for a specific key or all keys if key is None.
    """
    try:
        if key:
            file_path = os.path.join(CACHE_DIR, f"{key}.pkl")
            if os.path.exists(file_path):
                os.remove(file_path)
        else:
            for fname in os.listdir(CACHE_DIR):
                if fname.endswith(".pkl"):
                    os.remove(os.path.join(CACHE_DIR, fname))
        logger.info(f"🧹 Disk cache cleared (key={key})")
    except Exception as e:
        logger.warning(f"Error clearing disk cache: {e}")

def disk_cached(key_prefix: str, ttl: int = DEFAULT_TTL_SECONDS):
    """
    Decorator to cache function return value on disk + memory.
    """
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Construct a simple cache key
            cache_key = key_prefix
            if args and hasattr(args[0], "__class__"):
                # Avoid hashing self
                sub_args = args[1:]
            else:
                sub_args = args
            if sub_args or kwargs:
                cache_key += "_" + str(hash((sub_args, tuple(sorted(kwargs.items())))))
            
            cached = get_disk_cache(cache_key, ttl=ttl)
            if cached is not None:
                return cached
            
            res = fn(*args, **kwargs)
            if res is not None:
                set_disk_cache(cache_key, res)
            return res
        return wrapper
    return decorator
