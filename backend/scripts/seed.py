"""Convenience entry point that seeds all sample resources.

This module mirrors the Makefile `make seed` target and delegates to
seed_resources.py. It is idempotent and safe to run repeatedly.
"""

import asyncio

from app.db.session import async_session, engine
from app.models.models import Base
from scripts.seed_resources import seed_resources


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        await seed_resources(session)


if __name__ == "__main__":
    asyncio.run(main())
