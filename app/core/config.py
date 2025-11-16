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

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
