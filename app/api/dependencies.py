from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import Header, HTTPException, Request, status

from app.core.config import get_settings

_RATE_LIMIT_WINDOW = 60  # seconds
_RATE_LIMIT_MAX = 30  # requests per window per API key
_request_history: Dict[str, Deque[float]] = defaultdict(deque)


def require_service_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    settings = get_settings()
    if not settings.service_api_key:
        raise HTTPException(status_code=503, detail="Service API key not configured")
    if x_api_key != settings.service_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


def enforce_rate_limit(api_key: str) -> None:
    now = time.monotonic()
    history = _request_history[api_key]
    # Remove entries outside the window
    while history and now - history[0] > _RATE_LIMIT_WINDOW:
        history.popleft()
    if len(history) >= _RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    history.append(now)


def validate_diff_size(diff: str | None) -> None:
    if diff is None:
        return
    settings = get_settings()
    if len(diff) > settings.max_diff_chars:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Diff exceeds maximum allowed size of {settings.max_diff_chars} characters",
        )
