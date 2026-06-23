"""Middleware that rejects request bodies exceeding a size limit.

This protects against memory exhaustion from oversized payloads. The limit
is enforced at the ASGI level by checking the Content-Length header before
the application processes the request. Nginx's ``client_max_body_size``
provides a first line of defence at the proxy layer; this middleware
covers direct access to the backend (e.g. in development or when
bypassing the proxy). Pydantic ``max_length`` validators on individual
fields act as a third line of defence for field-level limits.
"""

from __future__ import annotations

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send


class MaxBodySizeMiddleware:
    """Reject HTTP requests whose Content-Length exceeds ``max_size`` bytes."""

    def __init__(self, app: ASGIApp, max_size: int = 1_048_576) -> None:
        # Default: 1 MiB, matching nginx client_max_body_size.
        self.app = app
        self.max_size = max_size

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Check Content-Length header before the app reads the body.
        for name, value in scope.get("headers", []):
            if name == b"content-length":
                try:
                    if int(value) > self.max_size:
                        response = JSONResponse(
                            status_code=413,
                            content={"detail": "Request body too large"},
                        )
                        await response(scope, receive, send)
                        return
                except ValueError:
                    pass
                break

        await self.app(scope, receive, send)
