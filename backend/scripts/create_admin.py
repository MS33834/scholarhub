"""Create the default admin user if it does not already exist."""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import async_session, engine
from app.models.models import Base, User


async def create_admin() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        session: AsyncSession
        result = await session.execute(select(User).where(User.email == settings.admin_email))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"Admin user already exists: {settings.admin_email}")
            return

        admin = User(
            email=settings.admin_email,
            username="admin",
            hashed_password=hash_password(settings.admin_password),
            is_active=True,
            is_admin=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Created admin user: {settings.admin_email}")


if __name__ == "__main__":
    asyncio.run(create_admin())
