import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import async_session, engine
from app.models.models import Base, User


async def _run_migrations():
    """Run Alembic migrations when available; fall back to create_all only if Alembic is missing."""
    try:
        from alembic import command
        from alembic.config import Config
    except ImportError:
        print("Alembic not installed; falling back to create_all")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        return

    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("Migrations applied successfully")


async def _ensure_admin(db: AsyncSession):
    result = await db.execute(
        select(User).where(
            (User.email == settings.admin_email) | (User.username == settings.admin_username)
        )
    )
    if not result.first():
        admin = User(
            email=settings.admin_email,
            username=settings.admin_username,
            hashed_password=hash_password(settings.admin_password),
            is_active=True,
            is_admin=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Admin user created: {settings.admin_email}")
    else:
        print("Admin user already exists")


async def init_db():
    await _run_migrations()

    async with async_session() as db:
        await _ensure_admin(db)


if __name__ == "__main__":
    asyncio.run(init_db())
