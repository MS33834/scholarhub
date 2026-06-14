from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import async_session, engine
from app.models.models import Base, User


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        from sqlalchemy import select

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


if __name__ == "__main__":
    import asyncio

    asyncio.run(init_db())
