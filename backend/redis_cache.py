"""
smart-hire Redis Caching & Distributed Rate Limiting Engine
Provides distributed caching for hot search queries, market insights, and cross-worker rate limiting.
Gracefully falls back to in-memory caching when Redis is not configured or offline.
"""

import os
import json
import time
import logging
from typing import Optional, Any

logger = logging.getLogger("smart_hire.redis")

REDIS_URL = os.environ.get("REDIS_URL", "").strip()

_redis_client = None
_in_memory_cache = {}
_in_memory_expirations = {}

if REDIS_URL:
    try:
        import redis
        _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2.0)
        _redis_client.ping()
        logger.info(f"Connected to Redis at {REDIS_URL}")
    except Exception as e:
        logger.warning(f"Could not connect to Redis ({e}). Using in-memory cache fallback.")
        _redis_client = None

def get_cache(key: str) -> Optional[Any]:
    if _redis_client:
        try:
            val = _redis_client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning(f"Redis get error: {e}")
    else:
        now = time.time()
        exp = _in_memory_expirations.get(key)
        if exp and now > exp:
            _in_memory_cache.pop(key, None)
            _in_memory_expirations.pop(key, None)
            return None
        return _in_memory_cache.get(key)
    return None

def set_cache(key: str, val: Any, expire_seconds: int = 30) -> None:
    if _redis_client:
        try:
            _redis_client.set(key, json.dumps(val), ex=expire_seconds)
        except Exception as e:
            logger.warning(f"Redis set error: {e}")
    else:
        _in_memory_cache[key] = val
        _in_memory_expirations[key] = time.time() + expire_seconds

def invalidate_cache(pattern: str) -> None:
    if _redis_client:
        try:
            keys = _redis_client.keys(pattern)
            if keys:
                _redis_client.delete(*keys)
        except Exception as e:
            logger.warning(f"Redis invalidate error: {e}")
    else:
        now = time.time()
        for k in list(_in_memory_cache.keys()):
            if pattern.rstrip("*") in k:
                _in_memory_cache.pop(k, None)
                _in_memory_expirations.pop(k, None)

def check_distributed_rate_limit(key: str, limit: int = 5, window_seconds: int = 900) -> bool:
    """
    Returns True if allowed, False if rate limited.
    Uses Redis atomic INCR when available.
    """
    if _redis_client:
        try:
            current = _redis_client.incr(f"ratelimit:{key}")
            if current == 1:
                _redis_client.expire(f"ratelimit:{key}", window_seconds)
            return current <= limit
        except Exception as e:
            logger.warning(f"Redis rate limit error: {e}")
            return True
    return True

