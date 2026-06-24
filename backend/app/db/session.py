from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def _build_engine():
    """Create the async engine with pool settings appropriate for the backend.

    SQLite (used in tests) does not support ``pool_size`` / ``max_overflow``
    and defaults to ``SingletonThreadPool``; passing those kwargs raises a
    ``PoolError``.  For PostgreSQL (and other network databases) we configure
    a bounded pool with pre-ping and recycling to avoid stale connections.
    """
    url = settings.database_url
    kwargs = {"echo": settings.debug}

    if url.startswith("sqlite"):
        # SQLite uses a single in-process connection; no pool tuning applies.
        return create_async_engine(url, **kwargs)

    kwargs.update(
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_recycle=settings.db_pool_recycle or -1,  # -1 = never recycle
        pool_pre_ping=settings.db_pool_pre_ping,
        pool_timeout=settings.db_pool_timeout,
    )
    return create_async_engine(url, **kwargs)


engine = _build_engine()
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def check_db_connection() -> None:
    """Run ``SELECT 1`` to verify the database is reachable.

    Raises the underlying exception if the connection fails so callers can
    catch and retry.
    """
    from sqlalchemy import text

    async with async_session() as session:
        await session.execute(text("SELECT 1"))
