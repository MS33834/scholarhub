import os
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Keep tests out of production mode so middleware/validation stay permissive.
os.environ.setdefault("SCHOLARHUB_ENVIRONMENT", "test")

from app.core.config import settings  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.models import Base  # noqa: E402

settings.rate_limit_per_minute = 10_000

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with test_async_session() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def fresh_database() -> AsyncGenerator[None, None]:
    """Recreate tables for every test to guarantee isolation."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user(client: AsyncClient, db_session: AsyncSession) -> dict:
    """Create a standard user directly and return login credentials + token."""
    from app.core.security import hash_password
    from app.models.models import User

    payload = {
        "email": "user@example.com",
        "username": "testuser",
        "password": "password123",
    }
    db_session.add(
        User(
            email=payload["email"],
            username=payload["username"],
            hashed_password=hash_password(payload["password"]),
            is_admin=False,
        )
    )
    await db_session.commit()

    response = await client.post(
        "/api/auth/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    response.raise_for_status()
    data = response.json()
    return {
        "email": payload["email"],
        "username": payload["username"],
        "password": payload["password"],
        "token": data["accessToken"],
        "user_id": data["userId"],
        "is_admin": data["isAdmin"],
    }


@pytest_asyncio.fixture
async def sample_resource(client: AsyncClient, admin_user: dict) -> dict:
    """Create a sample resource and return its payload."""
    payload = {
        "id": "test-paper-1",
        "type": "paper",
        "title": "A Test Paper",
        "authors": ["Alice Author"],
        "year": 2024,
        "discipline": "computer-science",
        "subdiscipline": "machine-learning",
        "tags": ["test", "pytest"],
        "venue": "Journal of Testing",
        "abstract": "This is a test abstract.",
        "preview": "This is a test preview.",
        "doi": "10.1234/test.1",
        "downloadUrl": "https://example.com/download.pdf",
        "externalUrl": "https://example.com/paper",
        "addedAt": "2024-01-01",
        "citation": {
            "apa": "Author, A. (2024). A Test Paper. Journal of Testing.",
            "mla": 'Author, Alice. "A Test Paper." Journal of Testing, 2024.',
            "gbt": "Author A. A Test Paper[J]. Journal of Testing, 2024.",
            "bibtex": "@article{test, title={A Test Paper}}",
        },
        "citations": 42,
    }
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    response.raise_for_status()
    return payload


@pytest_asyncio.fixture
async def admin_user(client: AsyncClient, db_session: AsyncSession) -> dict:
    """Create an admin user directly and return login credentials + token."""
    from app.core.security import hash_password
    from app.models.models import User

    db_session.add(
        User(
            email="admin@example.com",
            username="adminuser",
            hashed_password=hash_password("adminpass123"),
            is_admin=True,
        )
    )
    await db_session.commit()

    response = await client.post(
        "/api/auth/login",
        json={"username": "adminuser", "password": "adminpass123"},
    )
    response.raise_for_status()
    data = response.json()
    return {
        "email": "admin@example.com",
        "username": "adminuser",
        "password": "adminpass123",
        "token": data["accessToken"],
        "user_id": data["userId"],
        "is_admin": data["isAdmin"],
    }
