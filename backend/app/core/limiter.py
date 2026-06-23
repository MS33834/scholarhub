from collections.abc import Callable
from typing import Any

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.util import get_client_ip_from_forwarded


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
