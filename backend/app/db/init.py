import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import async_session, engine
from app.models.models import Base, User


async def _run_migrations():
    """Run Alembic migrations when available; fall back to create_all."""
    try:
        from alembic import command
        from alembic.config import Config

        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("Migrations applied successfully")
    except Exception as exc:
        print(f"Alembic migration failed ({exc}); falling back to create_all")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


async def _ensure_admin(db: AsyncSession):
    result = await db.execute(select(User).where(User.email == settings.admin_email))
    if not result.scalar_one_or_none():
        admin = User(
            email=settings.admin_email,
            username="admin",
            hashed_password=hash_password(settings.admin_password),
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
