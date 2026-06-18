"""Structured logging configuration for ScholarHUB.

Production logs are emitted as JSON lines so they can be aggregated by
container log drivers (e.g. Docker / CloudWatch / Loki). Development logs are
human-readable with the request ID prepended.
"""

from __future__ import annotations

import json
import logging
import sys
import time
import uuid
from contextvars import ContextVar
from typing import Any

from app.core.config import settings

REQUEST_ID_CTX: ContextVar[str] = ContextVar("request_id", default="-")

ACCESS_LOG_NAME = "scholarhub.access"
APP_LOG_NAME = "scholarhub.app"


class RequestIdFilter(logging.Filter):
    """Inject the current request id into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = REQUEST_ID_CTX.get()  # type: ignore[attr-defined]
        return True


class JsonFormatter(logging.Formatter):
    """JSON line formatter for production log aggregation."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created))
            + f".{record.msecs:03.0f}Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


class ColouredFormatter(logging.Formatter):
    """Readable console formatter for development."""

    _colours = {
        "DEBUG": "\033[36m",
        "INFO": "\033[32m",
        "WARNING": "\033[33m",
        "ERROR": "\033[31m",
        "CRITICAL": "\033[35m",
        "RESET": "\033[0m",
    }

    def format(self, record: logging.LogRecord) -> str:
        colour = self._colours.get(record.levelname, self._colours["RESET"])
        reset = self._colours["RESET"]
        record.colour = colour  # type: ignore[attr-defined]
        record.reset = reset  # type: ignore[attr-defined]
        return super().format(record)


def configure_logging() -> None:
    """Configure root logging for the application."""
    root = logging.getLogger()
    root.setLevel(settings.log_level.upper())

    # Remove any pre-existing handlers (e.g. uvicorn defaults) to avoid duplicates.
    for handler in root.handlers[:]:
        root.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(settings.log_level.upper())
    handler.addFilter(RequestIdFilter())

    if settings.json_logs:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            ColouredFormatter(
                fmt="%(colour)s%(levelname)-8s%(reset)s [%(request_id)s] %(name)s: %(message)s"
            )
        )

    root.addHandler(handler)

    # Silence overly chatty third-party loggers in production.
    if settings.is_production:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a logger that includes the request ID filter."""
    logger = logging.getLogger(name)
    logger.addFilter(RequestIdFilter())
    return logger


def generate_request_id() -> str:
    """Generate a unique request id."""
    return uuid.uuid4().hex[:16]
