"""Request logging middleware with request ID propagation.

Each incoming request receives a unique request id (reused from the
X-Request-ID header when provided by the upstream proxy). The id is stored in
a context variable so every log record emitted during the request is tagged
with it, and it is returned in the X-Request-ID response header for client
correlation.
"""

from __future__ import annotations

import time

from app.core.logging import ACCESS_LOG_NAME, REQUEST_ID_CTX, generate_request_id, get_logger

access_logger = get_logger(ACCESS_LOG_NAME)

REQUEST_ID_HEADER = "x-request-id"


class RequestLoggingMiddleware:
    """Generate/request a request id and log request details."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = None
        for name, value in scope.get("headers", []):
            if name.lower() == REQUEST_ID_HEADER.encode():
                request_id = value.decode()
                break
        if request_id is None:
            request_id = generate_request_id()

        token = REQUEST_ID_CTX.set(request_id)
        start = time.perf_counter()
        status_code = 500

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((REQUEST_ID_HEADER.encode(), request_id.encode()))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = (time.perf_counter() - start) * 1000

            client_ip = "-"
            for name, value in scope.get("headers", []):
                if name.lower() == b"x-forwarded-for":
                    client_ip = value.decode().split(",")[0].strip()
                    break
            else:
                client = scope.get("client")
                if client:
                    client_ip = client[0]

            user_agent = "-"
            for name, value in scope.get("headers", []):
                if name.lower() == b"user-agent":
                    user_agent = value.decode()
                    break

            access_logger.info(
                "%(method)s %(path)s %(status)s %(duration).2fms %(client_ip)s",
                {
                    "method": scope["method"],
                    "path": scope["path"],
                    "status": status_code,
                    "duration": duration_ms,
                    "client_ip": client_ip,
                },
                extra={
                    "method": scope["method"],
                    "path": scope["path"],
                    "query": str(scope.get("query_string", b""), "utf-8"),
                    "status_code": status_code,
                    "duration_ms": round(duration_ms, 2),
                    "client_ip": client_ip,
                    "user_agent": user_agent,
                },
            )

            REQUEST_ID_CTX.reset(token)
