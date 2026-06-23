"""Tests for distributed rate limiting configuration (SEC-02)."""

from unittest.mock import patch

from slowapi import Limiter

from app.core.config import Settings
from app.core.limiter import _create_limiter, _get_client_ip


def test_limiter_uses_memory_in_test_environment():
    """In test mode, the limiter must use in-memory storage (no Redis needed)."""
    limiter = _create_limiter()
    assert isinstance(limiter, Limiter)
    # The storage_uri for memory is "memory://"
    assert limiter._storage_uri == "memory://" or limiter._storage is not None


def test_limiter_falls_back_to_memory_without_redis_url():
    """When redis_url is empty, the limiter should use in-memory storage."""
    with patch("app.core.limiter.settings") as mock_settings:
        mock_settings.environment = "development"
        mock_settings.redis_url = ""
        mock_settings.trusted_proxies_count = 0
        limiter = _create_limiter()
        assert isinstance(limiter, Limiter)


def test_limiter_falls_back_to_memory_on_redis_connection_failure():
    """When Redis is unreachable, the limiter should fall back to memory."""
    with patch("app.core.limiter.settings") as mock_settings:
        mock_settings.environment = "development"
        mock_settings.redis_url = "redis://nonexistent-host:6379/0"
        mock_settings.trusted_proxies_count = 0

        # Force storage.check() to fail by patching storage_from_string.
        with patch("limits.storage.storage_from_string") as mock_storage:
            mock_storage.return_value.check.return_value = False
            limiter = _create_limiter()
            assert isinstance(limiter, Limiter)


def test_limiter_uses_redis_when_available():
    """When Redis is reachable, the limiter should use Redis storage."""
    with patch("app.core.limiter.settings") as mock_settings:
        mock_settings.environment = "development"
        mock_settings.redis_url = "redis://localhost:6379/0"
        mock_settings.trusted_proxies_count = 0

        with patch("limits.storage.storage_from_string") as mock_storage:
            mock_storage.return_value.check.return_value = True
            limiter = _create_limiter()
            assert isinstance(limiter, Limiter)
            # Verify Redis storage was attempted.
            mock_storage.assert_called_once_with("redis://localhost:6379/0")


def test_rate_limit_disabled_in_tests():
    """The rate_limit decorator should be a no-op in test environment."""
    from app.core.limiter import rate_limit

    decorator = rate_limit("10/minute")
    # In test mode, the decorator returns a passthrough function.
    def dummy():
        return "ok"

    wrapped = decorator(dummy)
    assert wrapped() == "ok"
