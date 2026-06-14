from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ScholarHUB API"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://scholarhub:scholarhub@localhost:5432/scholarhub"

    # JWT
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    algorithm: str = "HS256"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Admin
    admin_email: str = "admin@scholarhub.local"
    admin_password: str = "changeme"

    model_config = {"env_prefix": "SCHOLARHUB_", "env_file": ".env"}


settings = Settings()
