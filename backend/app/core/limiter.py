from collections.abc import Callable
from typing import Any

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings


def _get_client_ip(request: Request) -> str:
    """Return the client IP, honouring X-Forwarded-For when behind a proxy.

    In containerised deployments the immediate remote address is usually the
    reverse proxy, so we prefer the forwarded header. The last item in
    X-Forwarded-For is typically the closest proxy; the first is the original
    client. We use the first non-empty value and fall back to the socket IP.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[0]
    return get_remote_address(request)


limiter = Limiter(key_func=_get_client_ip)


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
