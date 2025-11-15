from fastapi import FastAPI

from app.api.routes import reviews
from app.core.config import get_settings
from app.core.db import Base, engine
from app import models  # noqa: F401


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    Base.metadata.create_all(bind=engine)

    app.include_router(reviews.router, prefix="/api/v1")

    @app.get("/health", tags=["health"], summary="Health check")
    def health_check():
        return {"status": "ok", "service": settings.app_name}

    return app


app = create_app()
