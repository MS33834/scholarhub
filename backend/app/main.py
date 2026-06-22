from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler

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
from app.core.logging import configure_logging
from app.middleware.request_logging import RequestLoggingMiddleware

configure_logging()

app = FastAPI(
    title=settings.app_name,
    version="1.1.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class SecurityHeadersMiddleware:
    """Add baseline security headers to every response."""

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
                    ]
                )
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


# Middleware order matters: request logging first (outermost) so it captures
# the full request lifecycle, then security headers, CORS, and trusted host.
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
        "version": "1.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok"}
