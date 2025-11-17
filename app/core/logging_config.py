from __future__ import annotations

import logging
from logging.config import dictConfig


def setup_logging(level: str = "INFO") -> None:
    """Configure application-wide structured logging."""

    log_level = level.upper() if isinstance(level, str) else "INFO"

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            }
        },
        "handlers": {
            "default": {
                "level": log_level,
                "class": "logging.StreamHandler",
                "formatter": "standard",
            }
        },
        "loggers": {
            "": {"handlers": ["default"], "level": log_level},
            "uvicorn.error": {"handlers": ["default"], "level": log_level, "propagate": False},
            "uvicorn.access": {"handlers": ["default"], "level": log_level, "propagate": False},
        },
    }

    dictConfig(logging_config)
