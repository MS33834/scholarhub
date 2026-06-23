import logging
from collections.abc import Callable
from typing import Any

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.util import get_client_ip_from_forwarded

logger = logging.getLogger(__name__)


def _get_client_ip(request: Request) -> str:
    """Return the client IP, honouring X-Forwarded-For when behind a proxy.

    The rightmost entries in X-Forwarded-For are added by the proxies closest
    to the application. By taking the entry ``trusted_proxies_count`` from the
    right we prevent clients from spoofing the header with fake leftmost IPs.
    """
    forwarded = request.headers.get("x-forwarded-for")
    ip = get_client_ip_from_forwarded(forwarded, settings.trusted_proxies_count)
    if ip:
        return ip
    return get_remote_address(request)


def _create_limiter() -> Limiter:
    """Create a rate limiter backed by Redis when available.

    Falls back to in-memory storage if Redis is not configured or unreachable.
    In multi-worker deployments the in-memory fallback means each worker has
    its own independent counter, so the effective limit is multiplied by the
    worker count — always configure Redis in production.
    """
    if settings.environment == "test":
        return Limiter(key_func=_get_client_ip, storage_uri="memory://")

    if not settings.redis_url:
        logger.warning(
            "SCHOLARHUB_REDIS_URL is not set; rate limiting falls back to "
            "in-memory storage. Limits are per-process and will not be shared "
            "across workers. Configure Redis for production deployments."
        )
        return Limiter(key_func=_get_client_ip, storage_uri="memory://")

    try:
        limiter = Limiter(key_func=_get_client_ip, storage_uri=settings.redis_url)
        # Verify connectivity by checking the storage backend.
        from limits.storage import storage_from_string

        storage = storage_from_string(settings.redis_url)
        if not storage.check():
            raise ConnectionError("Redis storage check failed")
        logger.info("Rate limiter connected to Redis: %s", settings.redis_url)
        return limiter
    except Exception:
        logger.error(
            "Failed to connect to Redis at %s; falling back to in-memory "
            "rate limiting. This means limits are NOT shared across workers.",
            settings.redis_url,
            exc_info=True,
        )
        return Limiter(key_func=_get_client_ip, storage_uri="memory://")


limiter = _create_limiter()


def rate_limit(limit_value: str | None = None, **kwargs: Any) -> Callable[[Any], Any]:
    """Rate-limit decorator that is automatically disabled in tests.

    slowapi evaluates the limit string at import time, so overriding
    ``settings.rate_limit_per_minute`` in tests has no effect once the
    decorators have already been applied. This wrapper skips the limiter
    entirely in the test environment while keeping the production limits
    intact.
    """
    if settings.environment == "test":
        return lambda f: f
    return limiter.limit(limit_value, **kwargs)
