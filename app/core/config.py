from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="PR Review Backend")
    app_version: str = Field(default="0.1.0")
    database_url: str = Field(default="sqlite:///./reviews.db")
    redis_url: str = Field(default="redis://localhost:6379/0")
    pipeline_mode: str = Field(default="multi-agent", description="multi-agent or stub")
    github_app_id: str | None = Field(default=None, description="GitHub App ID or client id")
    github_private_key: str | None = Field(
        default=None,
        description=(
            "PEM-encoded GitHub App private key or a token that can access the GitHub API. "
            "For local development you can paste a classic PAT here."
        ),
    )
    github_webhook_secret: str | None = Field(default=None, description="Shared secret for GitHub webhooks")
    github_api_base: str = Field(default="https://api.github.com", description="Base URL for GitHub API")
    service_api_key: str | None = Field(default=None, description="API key required for write endpoints")
    max_diff_chars: int = Field(default=200000, description="Maximum allowed diff size for manual submissions")
    rate_limit_window_seconds: int = Field(default=60)
    rate_limit_max_requests: int = Field(default=30)
    github_comment_sync_enabled: bool = Field(default=False)
    github_comment_max_inline: int = Field(default=10)
    log_level: str = Field(default="INFO", description="Application log level")
    enable_prometheus_metrics: bool = Field(default=True)
    prometheus_metrics_path: str = Field(default="/metrics")
    llm_provider: str = Field(default="mock", description="Provider backing the LLM orchestrator (mock|openai|azure)")
    llm_model: str = Field(default="gpt-4o-mini", description="LLM model identifier")
    llm_temperature: float = Field(default=0.2, ge=0.0, le=1.0)
    llm_timeout_seconds: int = Field(default=60)
    llm_deterministic: bool = Field(
        default=True,
        description="When true, the orchestrator returns canned responses for tests",
    )
    openai_api_key: str | None = Field(default=None, description="OpenAI API key")
    openai_organization: str | None = Field(default=None, description="OpenAI organization ID (optional)")
    azure_openai_api_key: str | None = Field(default=None, description="Azure OpenAI API key")
    azure_openai_endpoint: str | None = Field(default=None, description="Azure OpenAI endpoint URL")
    azure_openai_deployment: str | None = Field(default=None, description="Azure OpenAI deployment name")
    azure_openai_api_version: str = Field(default="2024-02-15-preview", description="Azure OpenAI API version")

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
