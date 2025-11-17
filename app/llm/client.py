from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING

from prometheus_client import Counter, Histogram

from app.core.config import get_settings

if TYPE_CHECKING:  # pragma: no cover - only for type hints
    from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)

LLM_REQUESTS = Counter(
    "llm_requests_total",
    "Total LLM requests",
    ["provider", "status"],
)
LLM_LATENCY = Histogram(
    "llm_latency_seconds",
    "LLM request latency",
    ["provider"],
)
LLM_TOKENS_PROMPT = Histogram(
    "llm_tokens_prompt",
    "Prompt tokens used",
    ["provider"],
)
LLM_TOKENS_COMPLETION = Histogram(
    "llm_tokens_completion",
    "Completion tokens generated",
    ["provider"],
)


@dataclass
class LLMResponse:
    content: str
    tokens_prompt: int
    tokens_completion: int
    latency_ms: float


class LLMClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: "ChatOpenAI | None" = None

    def _ensure_client(self) -> "ChatOpenAI":
        if self._client:
            return self._client

        provider = self.settings.llm_provider.lower()
        if provider == "mock":
            raise RuntimeError("Mock provider should not create real client")

        from langchain_openai import ChatOpenAI

        if provider == "openai":
            if not self.settings.openai_api_key:
                raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
            self._client = ChatOpenAI(
                model=self.settings.llm_model,
                temperature=self.settings.llm_temperature,
                timeout=self.settings.llm_timeout_seconds,
                api_key=self.settings.openai_api_key,
                organization=self.settings.openai_organization,
            )
        elif provider == "azure":
            if not self.settings.azure_openai_api_key or not self.settings.azure_openai_endpoint:
                raise ValueError("AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT required when LLM_PROVIDER=azure")
            if not self.settings.azure_openai_deployment:
                raise ValueError("AZURE_OPENAI_DEPLOYMENT is required when LLM_PROVIDER=azure")
            self._client = ChatOpenAI(
                model=self.settings.llm_model,
                temperature=self.settings.llm_temperature,
                timeout=self.settings.llm_timeout_seconds,
                azure_endpoint=self.settings.azure_openai_endpoint,
                azure_deployment=self.settings.azure_openai_deployment,
                api_version=self.settings.azure_openai_api_version,
                api_key=self.settings.azure_openai_api_key,
            )
        else:
            raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")

        return self._client

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        provider = self.settings.llm_provider.lower()

        if provider == "mock" or self.settings.llm_deterministic:
            return self._mock_response(system_prompt, user_prompt)

        client = self._ensure_client()
        started = time.perf_counter()
        status = "success"

        try:
            result = client.invoke(
                [
                    ("system", system_prompt),
                    ("user", user_prompt),
                ]
            )
            latency_ms = (time.perf_counter() - started) * 1000
            usage = result.response_metadata.get("token_usage", {})
            tokens_prompt = int(usage.get("prompt_tokens", 0))
            tokens_completion = int(usage.get("completion_tokens", 0))

            LLM_LATENCY.labels(provider=provider).observe(latency_ms / 1000.0)
            LLM_TOKENS_PROMPT.labels(provider=provider).observe(tokens_prompt)
            LLM_TOKENS_COMPLETION.labels(provider=provider).observe(tokens_completion)

            return LLMResponse(
                content=result.content,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                latency_ms=latency_ms,
            )
        except Exception as exc:
            status = "error"
            logger.exception("LLM generation failed for provider %s: %s", provider, exc)
            raise
        finally:
            LLM_REQUESTS.labels(provider=provider, status=status).inc()

    def _mock_response(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        body = {
            "summary": "Mock summary for testing.",
            "comments": [
                {
                    "file_path": "app/example.py",
                    "line_number_start": 10,
                    "line_number_end": 15,
                    "category": "logic",
                    "severity": "info",
                    "title": "Mock comment",
                    "body": "This is a deterministic mock comment for tests.",
                    "suggested_fix": "Replace with real LLM output.",
                    "agent": "llm-mock-agent",
                }
            ],
        }
        return LLMResponse(
            content=json.dumps(body),
            tokens_prompt=100,
            tokens_completion=50,
            latency_ms=5.0,
        )