from __future__ import annotations

import logging

from fastapi import Header, HTTPException, Request, status
from redis.exceptions import RedisError

from app.core.config import get_settings
from app.core.redis_client import get_redis_client

logger = logging.getLogger(__name__)


def require_service_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    settings = get_settings()
    if not settings.service_api_key:
        raise HTTPException(status_code=503, detail="Service API key not configured")
    if x_api_key != settings.service_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


def enforce_rate_limit(api_key: str, request: Request) -> None:
    settings = get_settings()
    redis_client = get_redis_client()
    client_host = request.client.host if request.client else "unknown"
    key = f"rl:{api_key}:{client_host}"
    try:
        current = redis_client.incr(key)
        if current == 1:
            redis_client.expire(key, settings.rate_limit_window_seconds)
        if current > settings.rate_limit_max_requests:
            ttl = redis_client.ttl(key)
            retry_after = ttl if ttl and ttl > 0 else settings.rate_limit_window_seconds
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            )
    except RedisError:
        logger.warning("Redis unavailable for rate limiting; allowing request", exc_info=True)


def validate_diff_size(diff: str | None) -> None:
    if diff is None:
        return
    settings = get_settings()
    if len(diff) > settings.max_diff_chars:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Diff exceeds maximum allowed size of {settings.max_diff_chars} characters",
        )
