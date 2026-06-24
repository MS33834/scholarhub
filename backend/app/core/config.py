from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Test-only secrets. These are NEVER used outside the test environment and
# exist solely so the test suite can run without manual .env configuration.
_TEST_SECRET_KEY = "TEST_ONLY_DO_NOT_USE_IN_PRODUCTION_0123456789abcdef"
_TEST_ADMIN_PASSWORD = "test_admin_password_12345"

# Secrets that must never appear in any real environment.
_WEAK_SECRET_KEYS = frozenset({
    "",
    "change-me-in-production-use-openssl-rand-hex-32",
    _TEST_SECRET_KEY,
})
_WEAK_ADMIN_PASSWORDS = frozenset({
    "",
    "changeme",
    "change-me",
    "admin",
    "password",
    "admin123",
    _TEST_ADMIN_PASSWORD,
})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="SCHOLARHUB_",
        extra="ignore",
    )

    app_name: str = "ScholarHUB API"
    environment: str = "development"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://scholarhub:scholarhub@localhost:5432/scholarhub"
    # Connection pool tuning (ignored for SQLite, which uses a single connection).
    db_pool_size: int = Field(default=10, ge=1, description="Base number of connections in the pool")
    db_max_overflow: int = Field(default=20, ge=0, description="Connections allowed beyond pool_size")
    db_pool_recycle: int = Field(default=1800, ge=0, description="Seconds before a connection is recycled (0 = never)")
    db_pool_pre_ping: bool = Field(default=True, description="Test connections before use to avoid stale-connection errors")
    db_pool_timeout: int = Field(default=30, ge=1, description="Seconds to wait for an available connection")
    # Startup retry — number of times to retry the initial DB connectivity check.
    db_startup_retries: int = Field(default=5, ge=0)
    db_startup_retry_delay: float = Field(default=2.0, ge=0.1, description="Seconds between retries")

    # JWT — no default; must be provided via environment in any non-test env.
    secret_key: str = Field(default="")
    # Access tokens are short-lived; refresh tokens are long-lived but stored
    # only on the client (cookie/localStorage) and rotated on refresh.
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # Refresh token cookie settings. In production the cookie is Secure and
    # SameSite=Strict (same-origin only). In development SameSite=Lax allows
    # cross-port testing; Secure is off because dev usually runs over HTTP.
    refresh_token_cookie_name: str = "scholarhub_refresh"
    refresh_token_cookie_secure: bool | None = None  # None → auto from environment
    refresh_token_cookie_samesite: str = "strict"  # strict | lax | none

    # CORS — accepts a JSON array string or comma-separated origins.
    # Example: '["https://example.com"]' or 'https://a.com,https://b.com'
    # Development defaults cover the common Vite ports so the dev server
    # can land on 5173 or 5174 without manual CORS reconfiguration.
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    # Trusted hosts / CSRF — comma-separated hostnames.
    # Example: 'api.scholarhub.example,scholarhub.example'
    allowed_hosts: str = "*"

    # Rate limiting (requests per minute, per endpoint/IP)
    rate_limit_per_minute: int = Field(default=60, ge=1)

    # Redis for distributed rate limiting. When empty, falls back to
    # in-memory storage (single-process only). In multi-worker deployments
    # a Redis URL is strongly recommended so limits are shared across workers.
    redis_url: str = ""

    # Reverse proxy trust. Number of trusted proxies in front of the app.
    # X-Forwarded-For is parsed from the right; 1 = trust the immediate proxy.
    # Default is 0 (trust nothing) so misconfigured deployments cannot be
    # spoofed. Set explicitly when behind a known proxy chain.
    trusted_proxies_count: int = Field(default=0, ge=0)

    # Logging
    log_level: str = Field(default="INFO", pattern=r"^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    json_logs: bool = Field(default=False)

    # Admin — no default password; must be provided via environment.
    admin_email: str = "admin@scholarhub.local"
    admin_username: str = "admin"
    admin_password: str = Field(default="")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, list):
            return ",".join(str(item) for item in value)
        if isinstance(value, str):
            import json

            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return ",".join(str(item) for item in parsed)
            except json.JSONDecodeError:
                pass
        return value

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, value):
        if isinstance(value, list):
            return ",".join(str(item) for item in value)
        return value

    @model_validator(mode="after")
    def validate_secrets(self):
        """Enforce strong secrets in every non-test environment."""

        # ---- Test environment: auto-fill test secrets if not provided ----
        if self.environment == "test":
            if not self.secret_key:
                self.secret_key = _TEST_SECRET_KEY
            if not self.admin_password:
                self.admin_password = _TEST_ADMIN_PASSWORD
            return self

        # ---- Non-test environments: reject weak/missing secrets ----
        if self.secret_key in _WEAK_SECRET_KEYS:
            raise ValueError(
                "SCHOLARHUB_SECRET_KEY is missing or uses a known-weak value. "
                "Generate a strong key with: openssl rand -hex 32"
            )
        if len(self.secret_key) < 32:
            raise ValueError(
                "SCHOLARHUB_SECRET_KEY must be at least 32 characters long. "
                "Generate with: openssl rand -hex 32"
            )

        if self.admin_password in _WEAK_ADMIN_PASSWORDS:
            raise ValueError(
                "SCHOLARHUB_ADMIN_PASSWORD is missing or uses a common weak value. "
                "Provide a strong password of at least 12 characters."
            )
        if len(self.admin_password) < 12:
            raise ValueError(
                "SCHOLARHUB_ADMIN_PASSWORD must be at least 12 characters long."
            )

        # ---- Production-specific checks ----
        if self.is_production:
            hosts = self.allowed_hosts_list
            if not hosts or hosts == ["*"]:
                raise ValueError(
                    "SCHOLARHUB_ALLOWED_HOSTS must be explicitly set in production"
                )
            if "*" in self.cors_origins_list:
                raise ValueError("CORS wildcard '*' is not allowed in production")

        return self

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [host.strip() for host in self.allowed_hosts.split(",") if host.strip()]

    @property
    def cors_methods(self) -> list[str]:
        # Production uses a restricted method set; development allows all for convenience.
        if self.is_production:
            return ["GET", "POST", "PUT", "DELETE", "PATCH"]
        return ["*"]

    @property
    def cors_headers(self) -> list[str]:
        if self.is_production:
            return ["Authorization", "Content-Type"]
        return ["*"]

    @property
    def cookie_secure(self) -> bool:
        """Whether the refresh token cookie should be Secure (HTTPS only)."""
        if self.refresh_token_cookie_secure is not None:
            return self.refresh_token_cookie_secure
        return self.is_production

    @property
    def cookie_samesite(self) -> str:
        """SameSite attribute for the refresh token cookie."""
        mode = self.refresh_token_cookie_samesite.lower()
        if mode not in ("strict", "lax", "none"):
            return "strict" if self.is_production else "lax"
        return mode


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
