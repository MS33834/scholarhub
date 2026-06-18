"""Request logging middleware with request ID propagation.

Each incoming request receives a unique request id (reused from the
X-Request-ID header when provided by the upstream proxy). The id is stored in
a context variable so every log record emitted during the request is tagged
with it, and it is returned in the X-Request-ID response header for client
correlation.
"""

from __future__ import annotations

import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import ACCESS_LOG_NAME, REQUEST_ID_CTX, generate_request_id, get_logger

access_logger = get_logger(ACCESS_LOG_NAME)

REQUEST_ID_HEADER = "x-request-id"


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Generate/request a request id and log request details."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(REQUEST_ID_HEADER) or generate_request_id()
        token = REQUEST_ID_CTX.set(request_id)

        start = time.perf_counter()
        response: Response | None = None
        try:
            response = await call_next(request)
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            status_code = response.status_code if response is not None else 500

            if response is not None:
                response.headers[REQUEST_ID_HEADER] = request_id

            client_ip = request.headers.get(
                "x-forwarded-for", request.client.host if request.client else "-"
            )
            if isinstance(client_ip, str) and "," in client_ip:
                client_ip = client_ip.split(",")[0].strip()

            access_logger.info(
                "%(method)s %(path)s %(status)s %(duration).2fms %(client_ip)s",
                {
                    "method": request.method,
                    "path": request.url.path,
                    "status": status_code,
                    "duration": duration_ms,
                    "client_ip": client_ip,
                },
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "query": str(request.query_params),
                    "status_code": status_code,
                    "duration_ms": round(duration_ms, 2),
                    "client_ip": client_ip,
                    "user_agent": request.headers.get("user-agent", "-"),
                },
            )

            REQUEST_ID_CTX.reset(token)

        return response
