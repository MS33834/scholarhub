"""Sprint 3: Database stability tests (STAB-01 ~ STAB-03).

STAB-01: Connection pool configuration
STAB-02: Startup retry + readiness probe
STAB-03: PostgreSQL integration (skipped when PG is unavailable)
"""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import Settings
from app.db.session import _build_engine, check_db_connection


# ---------------------------------------------------------------------------
# STAB-01: Connection pool configuration
# ---------------------------------------------------------------------------


class TestPoolConfig:
    """Verify that pool settings are applied correctly per backend."""

    def test_sqlite_engine_has_no_pool_size(self):
        """SQLite engines must not receive pool_size/max_overflow kwargs."""
        engine = _build_engine_with_url("sqlite+aiosqlite:///:memory:")
        # SQLite uses SingletonThreadPool or StaticPool, not QueuePool.
        # QueuePool has pool_size/max_overflow; others don't.
        pool = engine.pool
        assert not hasattr(pool, "pool_size") or pool.__class__.__name__ in (
            "SingletonThreadPool",
            "StaticPool",
            "NullPool",
        ), f"SQLite should not use QueuePool, got {pool.__class__.__name__}"
        # Clean up
        asyncio.get_event_loop().run_until_complete(engine.dispose()) if False else None

    def test_postgres_engine_has_pool_settings(self):
        """PostgreSQL engines should use a QueuePool with configured settings."""
        engine = _build_engine_with_url(
            "postgresql+asyncpg://user:pass@localhost:5432/db",
            db_pool_size=5,
            db_max_overflow=10,
            db_pool_recycle=600,
            db_pool_pre_ping=True,
            db_pool_timeout=15,
        )
        pool = engine.pool
        # AsyncAdaptedQueuePool is the default for non-SQLite async engines.
        pool_class_name = pool.__class__.__name__
        assert "QueuePool" in pool_class_name, (
            f"PostgreSQL should use QueuePool, got {pool_class_name}"
        )
        # AsyncAdaptedQueuePool wraps a sync QueuePool; access size via the
        # underlying pool's maxsize, or fall back to the pool_size property.
        pool_size = getattr(pool, "pool_size", None)
        if pool_size is None:
            # SQLAlchemy 2.x: the wrapped pool is in _pool
            inner = getattr(pool, "_pool", None)
            if inner is not None:
                pool_size = getattr(inner, "maxsize", None)
        assert pool_size == 5, f"Expected pool_size=5, got {pool_size}"
        # Verify pre_ping is enabled.
        assert engine.pool._pre_ping is True

    def test_pool_recycle_zero_means_no_recycle(self):
        """db_pool_recycle=0 should translate to -1 (never recycle)."""
        engine = _build_engine_with_url(
            "postgresql+asyncpg://user:pass@localhost:5432/db",
            db_pool_recycle=0,
        )
        # -1 means never recycle in SQLAlchemy.
        assert engine.pool._recycle == -1

    def test_pool_pre_ping_defaults_true(self):
        """Pre-ping should default to True to avoid stale connections."""
        s = Settings(environment="test")
        assert s.db_pool_pre_ping is True

    def test_pool_config_defaults(self):
        """Default pool config values are sensible for production."""
        s = Settings(environment="test")
        assert s.db_pool_size == 10
        assert s.db_max_overflow == 20
        assert s.db_pool_recycle == 1800
        assert s.db_pool_timeout == 30
        assert s.db_startup_retries == 5
        assert s.db_startup_retry_delay == 2.0


def _build_engine_with_url(url: str, **overrides) -> "object":
    """Build an engine with a custom URL and overridden settings."""
    # Patch settings temporarily.
    with patch("app.db.session.settings") as mock_settings:
        defaults = {
            "database_url": url,
            "debug": False,
            "db_pool_size": 10,
            "db_max_overflow": 20,
            "db_pool_recycle": 1800,
            "db_pool_pre_ping": True,
            "db_pool_timeout": 30,
        }
        defaults.update(overrides)
        for key, value in defaults.items():
            setattr(mock_settings, key, value)
        return _build_engine()


# ---------------------------------------------------------------------------
# STAB-02: Startup retry + readiness probe
# ---------------------------------------------------------------------------


class TestReadinessProbe:
    """Tests for the /health/ready endpoint."""

    @pytest.mark.asyncio
    async def test_health_liveness(self, client):
        """Liveness probe always returns 200."""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    @pytest.mark.asyncio
    async def test_health_ready_ok(self, client):
        """Readiness probe returns 200 when DB is reachable."""
        response = await client.get("/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"

    @pytest.mark.asyncio
    async def test_health_ready_503_on_db_failure(self, client):
        """Readiness probe returns 503 when DB query fails."""
        # Override get_db to return a session that raises on execute.
        from app.db.session import get_db
        from app.main import app

        async def failing_db():
            from unittest.mock import AsyncMock as _AM

            mock_session = _AM()
            mock_session.execute.side_effect = Exception("connection lost")
            yield mock_session

        original = app.dependency_overrides.get(get_db)
        app.dependency_overrides[get_db] = failing_db
        try:
            response = await client.get("/health/ready")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "error"
            assert data["database"] == "unavailable"
        finally:
            # Restore the original override from conftest.
            from tests.conftest import override_get_db

            app.dependency_overrides[get_db] = override_get_db


class TestStartupRetry:
    """Tests for the _verify_db_with_retry function."""

    @pytest.mark.asyncio
    async def test_retry_succeeds_on_second_attempt(self):
        """The retry loop succeeds when the DB becomes available."""
        from app.main import _verify_db_with_retry

        call_count = 0

        async def flaky_check():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise ConnectionError("not ready")

        with patch("app.main.check_db_connection", side_effect=flaky_check):
            with patch("app.main.settings") as mock_settings:
                mock_settings.db_startup_retries = 3
                mock_settings.db_startup_retry_delay = 0.01
                await _verify_db_with_retry()

        assert call_count == 2

    @pytest.mark.asyncio
    async def test_retry_raises_after_max_attempts(self):
        """The retry loop raises after exhausting all attempts."""
        from app.main import _verify_db_with_retry

        call_count = 0

        async def always_fail():
            nonlocal call_count
            call_count += 1
            raise ConnectionError("permanently down")

        with patch("app.main.check_db_connection", side_effect=always_fail):
            with patch("app.main.settings") as mock_settings:
                mock_settings.db_startup_retries = 2
                mock_settings.db_startup_retry_delay = 0.01
                with pytest.raises(ConnectionError, match="permanently down"):
                    await _verify_db_with_retry()

        # 1 initial + 2 retries = 3 total attempts.
        assert call_count == 3

    @pytest.mark.asyncio
    async def test_retry_succeeds_first_try(self):
        """No retries needed when DB is immediately available."""
        from app.main import _verify_db_with_retry

        mock_check = AsyncMock()
        with patch("app.main.check_db_connection", mock_check):
            with patch("app.main.settings") as mock_settings:
                mock_settings.db_startup_retries = 3
                mock_settings.db_startup_retry_delay = 0.01
                await _verify_db_with_retry()

        assert mock_check.call_count == 1

    @pytest.mark.asyncio
    async def test_zero_retries_means_one_attempt(self):
        """db_startup_retries=0 means exactly one attempt, no retries."""
        from app.main import _verify_db_with_retry

        call_count = 0

        async def always_fail():
            nonlocal call_count
            call_count += 1
            raise ConnectionError("down")

        with patch("app.main.check_db_connection", side_effect=always_fail):
            with patch("app.main.settings") as mock_settings:
                mock_settings.db_startup_retries = 0
                mock_settings.db_startup_retry_delay = 0.01
                with pytest.raises(ConnectionError):
                    await _verify_db_with_retry()

        assert call_count == 1


# ---------------------------------------------------------------------------
# STAB-03: PostgreSQL integration (skipped when PG is unavailable)
# ---------------------------------------------------------------------------

PG_AVAILABLE = False  # Set by the module-level check below.

try:
    import asyncpg  # noqa: F401

    _PG_TEST_URL = "postgresql+asyncpg://scholarhub:scholarhub@localhost:5432/scholarhub"
    # Quick connectivity probe — if this fails, PG tests are skipped.
    import asyncio as _asyncio

    async def _probe_pg():
        engine = create_async_engine(_PG_TEST_URL)
        try:
            from sqlalchemy import text

            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
        finally:
            await engine.dispose()

    PG_AVAILABLE = _asyncio.get_event_loop().run_until_complete(_probe_pg())
except Exception:
    PG_AVAILABLE = False


@pytest.mark.skipif(not PG_AVAILABLE, reason="PostgreSQL not available for integration test")
class TestPostgreSQLIntegration:
    """Integration tests that run against a real PostgreSQL instance.

    These tests verify that the pool configuration and queries work correctly
    with the actual PostgreSQL driver (asyncpg). They are skipped when no
    PostgreSQL server is reachable at the configured URL.
    """

    @pytest.mark.asyncio
    async def test_pg_select_one(self):
        """A simple SELECT 1 works against PostgreSQL."""
        from sqlalchemy import text

        engine = create_async_engine(
            _PG_TEST_URL,
            pool_size=2,
            max_overflow=2,
            pool_pre_ping=True,
        )
        try:
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                assert result.scalar() == 1
        finally:
            await engine.dispose()

    @pytest.mark.asyncio
    async def test_pg_pool_pre_ping_avoids_stale(self):
        """Pre-ping detects and replaces stale connections."""
        engine = create_async_engine(
            _PG_TEST_URL,
            pool_size=1,
            pool_pre_ping=True,
            pool_recycle=1,
        )
        try:
            from sqlalchemy import text

            # First connection.
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            # Wait for recycle.
            await asyncio.sleep(1.5)
            # Second connection should work despite potential staleness.
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                assert result.scalar() == 1
        finally:
            await engine.dispose()
