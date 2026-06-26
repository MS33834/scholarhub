from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import router as auth_router
from app.api.disciplines import router as disciplines_router
from app.api.favorites import router as favorites_router
from app.api.history import router as history_router
from app.api.reading_lists import router as reading_lists_router
from app.api.resources import router as resources_router
from app.api.submissions import router as submissions_router
from app.api.users import router as users_router
from app.core.config import settings
from app.core.limiter import limiter, rate_limit
from app.core.logging import configure_logging, get_logger
from app.db.session import check_db_connection, engine, get_db
from app.middleware.max_body import MaxBodySizeMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware

configure_logging()
logger = get_logger("scholarhub.errors")
startup_logger = get_logger("scholarhub.startup")


async def _verify_db_with_retry() -> None:
    """Retry the DB connectivity check up to ``db_startup_retries`` times."""
    import asyncio

    last_exc: Exception | None = None
    for attempt in range(1, settings.db_startup_retries + 2):
        try:
            await check_db_connection()
            startup_logger.info(
                "Database connection verified (attempt %d/%d)",
                attempt,
                settings.db_startup_retries + 1,
            )
            return
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if attempt <= settings.db_startup_retries:
                startup_logger.warning(
                    "Database not ready (attempt %d/%d): %s — retrying in %.1fs",
                    attempt,
                    settings.db_startup_retries + 1,
                    exc,
                    settings.db_startup_retry_delay,
                )
                await asyncio.sleep(settings.db_startup_retry_delay)
            else:
                startup_logger.error(
                    "Database connection failed after %d attempts: %s",
                    attempt,
                    exc,
                )
    raise last_exc  # type: ignore[misc]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: verify DB on startup, dispose engine on shutdown."""
    # Skip DB verification in test mode — tests manage their own DB lifecycle
    # and the ASGITransport does not run lifespan events anyway.
    if settings.environment != "test":
        await _verify_db_with_retry()
    yield
    # Gracefully release all pooled connections.
    await engine.dispose()
    startup_logger.info("Database engine disposed")


app = FastAPI(
    title=settings.app_name,
    version="1.2.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a structured 422 response for Pydantic validation errors."""
    errors = []
    for err in exc.errors():
        loc = ".".join(str(part) for part in err.get("loc", []))
        errors.append(
            {
                "field": loc,
                "message": err.get("msg", "Invalid value"),
                "type": err.get("type", "value_error"),
            }
        )
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": errors},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensure HTTPException responses have a consistent format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions, log with request id, return generic 500.

    Stack traces are never sent to the client. The error is logged with the
    request id so it can be correlated with access logs.
    """
    request_id = "-"
    for name, value in request.scope.get("headers", []):
        if name == b"x-request-id":
            request_id = value.decode()
            break
    logger.error(
        "Unhandled exception on %s %s (request_id=%s): %s",
        request.method,
        request.url.path,
        request_id,
        exc,
        exc_info=True,
        extra={"request_id": request_id, "path": request.url.path},
    )
    detail = "Internal server error"
    if not settings.is_production:
        detail = f"{type(exc).__name__}: {exc}"
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )


class SecurityHeadersMiddleware:
    """Add baseline security headers and API version to every response."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.extend(
                    [
                        (b"x-content-type-options", b"nosniff"),
                        (b"x-frame-options", b"DENY"),
                        (b"x-xss-protection", b"1; mode=block"),
                        (b"referrer-policy", b"strict-origin-when-cross-origin"),
                        (
                            b"permissions-policy",
                            b"geolocation=(), microphone=(), camera=()",
                        ),
                        # CSP is intentionally minimal; tighten once asset hosts are known.
                        (
                            b"content-security-policy",
                            b"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
                        ),
                        # API version for client-side compatibility checks.
                        (b"x-api-version", b"1.2.0"),
                    ]
                )
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


# Middleware order matters: request logging first (outermost) so it captures
# the full request lifecycle, then security headers, CORS, and trusted host.
# MaxBodySizeMiddleware is added first (innermost) so that 413 responses still
# pass through RequestLogging (for correlation) and SecurityHeaders, and so
# CORS preflight (OPTIONS) requests handled by CORSMiddleware are not blocked.
app.add_middleware(MaxBodySizeMiddleware, max_size=1_048_576)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

if settings.is_production:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts_list)

# Routers
app.include_router(auth_router, prefix="/api")
app.include_router(resources_router, prefix="/api")
app.include_router(disciplines_router, prefix="/api")
app.include_router(favorites_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(reading_lists_router, prefix="/api")
app.include_router(submissions_router, prefix="/api")
app.include_router(users_router, prefix="/api")


@app.get("/")
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def root(request: Request):
    return {
        "name": "ScholarHUB API",
        "version": "1.2.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Liveness probe — always returns 200 if the process is alive."""
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready(db: AsyncSession = Depends(get_db)):
    """Readiness probe — verifies the database is reachable.

    Returns 503 when the DB connection fails so the load balancer stops
    routing traffic to this instance until it recovers.
    """
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Readiness check failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "unavailable"},
        )


@app.get("/api/health")
async def api_health():
    return {"status": "ok"}
