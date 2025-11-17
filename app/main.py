from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.routes import github, reviews, ui
from app.core.config import get_settings
from app.core.db import Base, engine
from app.core.logging_config import setup_logging
from app import models  # noqa: F401


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings.log_level)
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    Base.metadata.create_all(bind=engine)

    app.include_router(reviews.router, prefix="/api/v1")
    app.include_router(github.router, prefix="/api/v1")
    app.include_router(ui.router)

    if settings.enable_prometheus_metrics:
        Instrumentator().instrument(app).expose(
            app,
            endpoint=settings.prometheus_metrics_path,
        )

    @app.get("/health", tags=["health"], summary="Health check")
    def health_check():
        return {"status": "ok", "service": settings.app_name}

    return app


app = create_app()
