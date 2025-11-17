from __future__ import annotations

from typing import Any, Mapping, Optional

import httpx

from app.core.config import get_settings


class GitHubClient:
    """Thin wrapper around httpx for calling the GitHub API synchronously."""

    def __init__(self, base_url: str, token: Optional[str]) -> None:
        self._base_url = base_url.rstrip("/")
        self._token = token

    def _build_headers(self, extra: Optional[Mapping[str, str]] = None) -> Mapping[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "ryzl-pr-review-backend",
        }
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        if extra:
            headers.update(extra)
        return headers

    def get(self, path: str, *, headers: Optional[Mapping[str, str]] = None) -> httpx.Response:
        url = f"{self._base_url}/{path.lstrip('/') }"
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, headers=self._build_headers(headers))
        return resp

    def post(
        self,
        path: str,
        *,
        json: Optional[Mapping[str, Any]] = None,
        headers: Optional[Mapping[str, str]] = None,
    ) -> httpx.Response:
        url = f"{self._base_url}/{path.lstrip('/') }"
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=json, headers=self._build_headers(headers))
        return resp


def get_github_client() -> GitHubClient:
    settings = get_settings()
    return GitHubClient(base_url=settings.github_api_base, token=settings.github_private_key)
