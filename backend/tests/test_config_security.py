"""Tests for security-critical configuration validation (SEC-01)."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_test_environment_uses_test_secret():
    """In test mode, missing secrets are auto-filled with test values."""
    s = Settings(_env_file=None, environment="test", secret_key="", admin_password="")
    assert s.secret_key  # non-empty
    assert len(s.secret_key) >= 32
    assert s.admin_password  # non-empty
    assert len(s.admin_password) >= 12


def test_development_rejects_empty_secret():
    """Development mode must refuse to start without a secret key."""
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(
            _env_file=None,
            environment="development",
            secret_key="",
            admin_password="strong_password_12345",
        )


def test_development_rejects_default_secret():
    """Development mode must reject the old default secret."""
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(
            _env_file=None,
            environment="development",
            secret_key="change-me-in-production-use-openssl-rand-hex-32",
            admin_password="strong_password_12345",
        )


def test_development_rejects_short_secret():
    """Secret shorter than 32 chars must be rejected."""
    with pytest.raises(ValidationError, match="32 characters"):
        Settings(
            _env_file=None,
            environment="development",
            secret_key="too_short",
            admin_password="strong_password_12345",
        )


def test_development_rejects_weak_admin_password():
    """Common weak admin passwords must be rejected."""
    for weak in ("changeme", "admin", "password", "admin123", ""):
        with pytest.raises(ValidationError, match="ADMIN_PASSWORD"):
            Settings(
                _env_file=None, environment="development", secret_key="a" * 64, admin_password=weak
            )


def test_development_rejects_short_admin_password():
    """Admin password shorter than 12 chars must be rejected."""
    with pytest.raises(ValidationError, match="12 characters"):
        Settings(
            _env_file=None,
            environment="development",
            secret_key="a" * 64,
            admin_password="short123",
        )


def test_development_accepts_strong_credentials():
    """Strong secret + password should initialise without error."""
    s = Settings(
        _env_file=None,
        environment="development",
        secret_key="a" * 64,
        admin_password="strong_password_12345",
    )
    assert s.secret_key == "a" * 64
    assert s.admin_password == "strong_password_12345"


def test_production_rejects_wildcard_hosts():
    """Production must reject wildcard ALLOWED_HOSTS."""
    with pytest.raises(ValidationError, match="ALLOWED_HOSTS"):
        Settings(
            _env_file=None,
            environment="production",
            secret_key="a" * 64,
            admin_password="strong_password_12345",
            allowed_hosts="*",
            cors_origins="https://example.com",
        )


def test_production_rejects_wildcard_cors():
    """Production must reject wildcard CORS."""
    with pytest.raises(ValidationError, match="CORS"):
        Settings(
            _env_file=None,
            environment="production",
            secret_key="a" * 64,
            admin_password="strong_password_12345",
            allowed_hosts="example.com",
            cors_origins="*",
        )


def test_production_accepts_full_config():
    """Production with all proper settings should initialise."""
    s = Settings(
        _env_file=None,
        environment="production",
        secret_key="a" * 64,
        admin_password="strong_password_12345",
        allowed_hosts="example.com,api.example.com",
        cors_origins="https://example.com,https://www.example.com",
    )
    assert s.is_production


def test_test_secret_not_accepted_in_development():
    """The test-only secret must not be usable in development."""
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(
            _env_file=None,
            environment="development",
            secret_key="TEST_ONLY_DO_NOT_USE_IN_PRODUCTION_0123456789abcdef",
            admin_password="strong_password_12345",
        )


def test_test_admin_password_not_accepted_in_development():
    """The test-only admin password must not be usable in development."""
    with pytest.raises(ValidationError, match="ADMIN_PASSWORD"):
        Settings(
            _env_file=None,
            environment="development",
            secret_key="a" * 64,
            admin_password="test_admin_password_12345",
        )
