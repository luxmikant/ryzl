from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="PR Review Backend")
    app_version: str = Field(default="0.1.0")
    database_url: str = Field(default="sqlite:///./reviews.db")
    redis_url: str = Field(default="redis://localhost:6379/0")

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
