"""Create the default admin user if it does not already exist."""

import asyncio
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import async_session, engine
from app.models.models import Base, User

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import async_sessionmaker


async def create_admin(
    engine_override: AsyncEngine | None = None,
    session_factory: "async_sessionmaker[AsyncSession] | None" = None,
) -> None:
    """Create the configured admin user if missing.

    Optional overrides allow tests to inject an isolated engine/session
    instead of touching the production database.
    """
    db_engine = engine_override or engine
    db_session_factory = session_factory or async_session

    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with db_session_factory() as session:
        session: AsyncSession
        result = await session.execute(
            select(User).where((User.email == settings.admin_email) | (User.username == settings.admin_username))
        )
        existing = result.first()

        if existing:
            print(f"Admin user already exists: {settings.admin_email}")
            return

        admin = User(
            email=settings.admin_email,
            username=settings.admin_username,
            hashed_password=hash_password(settings.admin_password),
            is_active=True,
            is_admin=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Created admin user: {settings.admin_email}")


if __name__ == "__main__":
    asyncio.run(create_admin())
