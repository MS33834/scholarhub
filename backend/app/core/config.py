from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # JWT
    secret_key: str = Field(
        default="change-me-in-production-use-openssl-rand-hex-32", min_length=32
    )
    # Access tokens are short-lived; refresh tokens are long-lived but stored
    # only on the client (cookie/localStorage) and rotated on refresh.
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

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

    # Reverse proxy trust. Number of trusted proxies in front of the app.
    # X-Forwarded-For is parsed from the right; 1 = trust the immediate proxy.
    trusted_proxies_count: int = Field(default=1, ge=0)

    # Logging
    log_level: str = Field(default="INFO", pattern=r"^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    json_logs: bool = Field(default=False)

    # Admin
    admin_email: str = "admin@scholarhub.local"
    admin_password: str = Field(default="changeme", min_length=8)

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
    def validate_production(self):
        if self.is_production:
            if self.secret_key == "change-me-in-production-use-openssl-rand-hex-32":
                raise ValueError("SCHOLARHUB_SECRET_KEY must be changed in production")
            hosts = self.allowed_hosts_list
            if not hosts or hosts == ["*"]:
                raise ValueError("SCHOLARHUB_ALLOWED_HOSTS must be explicitly set in production")
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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
