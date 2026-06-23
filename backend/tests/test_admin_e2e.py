"""End-to-end tests for admin creation, authz, and user flows.

This module exercises the complete lifecycle used by the development team:

1. Bootstrap an admin user via the create_admin script.
2. Admin authenticates and performs privileged resource management.
3. A regular user registers, logs in, favorites a resource, and builds reading history.
4. Data isolation is verified between users.
"""

import pytest
from sqlalchemy import select

from app.core.config import settings
from app.models.models import Favorite, ReadingHistory, User
from scripts.create_admin import create_admin


@pytest.mark.asyncio
async def test_create_admin_script_bootstraps_admin(db_session, test_engine, test_async_session):
    """The create_admin script should create the configured admin user once."""
    await create_admin(engine_override=test_engine, session_factory=test_async_session)

    result = await db_session.execute(select(User).where(User.username == "admin"))
    admin = result.scalar_one()

    assert admin.email == "admin@scholarhub.local"
    assert admin.is_admin is True
    assert admin.is_active is True

    # Re-running should be idempotent.
    await create_admin(engine_override=test_engine, session_factory=test_async_session)
    result = await db_session.execute(select(User).where(User.username == "admin"))
    assert result.scalar_one().id == admin.id


@pytest.mark.asyncio
async def test_admin_login_and_token_refresh(client, test_engine, test_async_session):
    """Admin can log in with configured credentials and refresh tokens."""
    await create_admin(engine_override=test_engine, session_factory=test_async_session)

    login = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": settings.admin_password},
    )
    assert login.status_code == 200
    data = login.json()
    assert data["username"] == "admin"
    assert data["isAdmin"] is True
    assert "accessToken" in data
    assert "refreshToken" in data

    refresh = await client.post(
        "/api/auth/refresh",
        json={"refreshToken": data["refreshToken"]},
    )
    assert refresh.status_code == 200
    refreshed = refresh.json()
    assert "accessToken" in refreshed
    assert refreshed["username"] == "admin"
    assert refreshed["isAdmin"] is True


@pytest.mark.asyncio
async def test_admin_resource_crud_is_isolated_from_regular_users(
    client, test_engine, test_async_session
):
    """Only admins can create, update, and delete resources."""
    await create_admin(engine_override=test_engine, session_factory=test_async_session)

    admin_login = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": settings.admin_password},
    )
    admin_token = admin_login.json()["accessToken"]

    regular = await client.post(
        "/api/auth/register",
        json={
            "email": "regular@example.com",
            "username": "regularuser",
            "password": "password123",
        },
    )
    regular_token = regular.json()["accessToken"]

    payload = {
        "id": "admin-only-paper",
        "type": "paper",
        "title": "Admin Only Paper",
        "authors": ["Admin Author"],
        "year": 2024,
        "discipline": "computer-science",
        "subdiscipline": "machine-learning",
        "tags": ["admin", "test"],
        "venue": "Journal of Admin",
        "abstract": "Abstract.",
        "preview": "Preview.",
        "citation": {
            "apa": "Admin, A. (2024). Admin Only Paper.",
            "mla": 'Admin, A. "Admin Only Paper." 2024.',
            "gbt": "Admin A. Admin Only Paper[J]. 2024.",
            "bibtex": "@article{admin, title={Admin Only Paper}}",
        },
        "citations": 10,
        "addedAt": "2024-01-01",
    }

    # Regular users cannot create resources.
    denied = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {regular_token}"},
    )
    assert denied.status_code == 403

    # Admin creates the resource.
    created = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert created.status_code == 201
    assert created.json()["title"] == "Admin Only Paper"

    # Admin updates the resource.
    updated = await client.put(
        "/api/resources/admin-only-paper",
        json={"title": "Updated Admin Paper"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Admin Paper"

    # Regular users cannot delete resources.
    denied_delete = await client.delete(
        "/api/resources/admin-only-paper",
        headers={"Authorization": f"Bearer {regular_token}"},
    )
    assert denied_delete.status_code == 403

    # Admin deletes the resource.
    deleted = await client.delete(
        "/api/resources/admin-only-paper",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert deleted.status_code == 204

    not_found = await client.get("/api/resources/admin-only-paper")
    assert not_found.status_code == 404


@pytest.mark.asyncio
async def test_user_registration_login_favorite_history_flow(
    client, db_session, test_engine, test_async_session
):
    """A new user can register, log in, favorite resources, and track history."""
    await create_admin(engine_override=test_engine, session_factory=test_async_session)

    # Admin creates a resource for the user to interact with.
    admin_login = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": settings.admin_password},
    )
    admin_token = admin_login.json()["accessToken"]

    resource_payload = {
        "id": "interaction-paper",
        "type": "paper",
        "title": "Interaction Paper",
        "authors": ["Test Author"],
        "year": 2024,
        "discipline": "computer-science",
        "subdiscipline": "nlp",
        "tags": ["nlp", "test"],
        "venue": "Test Venue",
        "abstract": "Abstract text.",
        "preview": "Preview text.",
        "citation": {
            "apa": "Author, T. (2024). Interaction Paper.",
            "mla": 'Author, T. "Interaction Paper." 2024.',
            "gbt": "Author T. Interaction Paper[J]. 2024.",
            "bibtex": "@article{interaction, title={Interaction Paper}}",
        },
        "citations": 5,
        "addedAt": "2024-02-01",
    }
    await client.post(
        "/api/resources/",
        json=resource_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # User registration.
    register = await client.post(
        "/api/auth/register",
        json={
            "email": "flow@example.com",
            "username": "flowuser",
            "password": "password123",
        },
    )
    assert register.status_code == 201
    user_id = register.json()["userId"]
    token = register.json()["accessToken"]
    assert register.json()["isAdmin"] is False

    # /auth/me reflects the authenticated user.
    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["username"] == "flowuser"
    assert me.json()["isAdmin"] is False

    # Add favorite.
    fav = await client.post(
        "/api/favorites/interaction-paper",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert fav.status_code == 201
    assert fav.json()["message"] == "Added to favorites"

    favorites = await client.get("/api/favorites/", headers={"Authorization": f"Bearer {token}"})
    assert favorites.status_code == 200
    assert len(favorites.json()["favorites"]) == 1
    assert favorites.json()["favorites"][0]["id"] == "interaction-paper"

    # Add reading history.
    history = await client.post(
        "/api/history/interaction-paper",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert history.status_code == 201
    assert history.json()["message"] == "Added to history"

    history_list = await client.get("/api/history/", headers={"Authorization": f"Bearer {token}"})
    assert history_list.status_code == 200
    assert len(history_list.json()["history"]) == 1
    assert history_list.json()["history"][0]["resource"]["id"] == "interaction-paper"

    # Verify database rows.
    fav_rows = await db_session.execute(select(Favorite).where(Favorite.user_id == user_id))
    assert len(fav_rows.scalars().all()) == 1

    hist_rows = await db_session.execute(
        select(ReadingHistory).where(ReadingHistory.user_id == user_id)
    )
    assert len(hist_rows.scalars().all()) == 1


@pytest.mark.asyncio
async def test_favorites_and_history_are_isolated_between_users(
    client, test_engine, test_async_session
):
    """One user's favorites and history must not leak to another user."""
    await create_admin(engine_override=test_engine, session_factory=test_async_session)
    admin_token = (
        await client.post(
            "/api/auth/login",
            json={"username": "admin", "password": settings.admin_password},
        )
    ).json()["accessToken"]

    await client.post(
        "/api/resources/",
        json={
            "id": "isolation-paper",
            "type": "paper",
            "title": "Isolation Paper",
            "authors": ["A"],
            "year": 2024,
            "discipline": "computer-science",
            "subdiscipline": "nlp",
            "tags": ["test"],
            "venue": "V",
            "abstract": "A",
            "preview": "P",
            "citation": {
                "apa": "A (2024).",
                "mla": "A (2024).",
                "gbt": "A (2024).",
                "bibtex": "@article{a}",
            },
            "citations": 1,
            "addedAt": "2024-03-01",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    alice = await client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "username": "alice",
            "password": "password123",
        },
    )
    bob = await client.post(
        "/api/auth/register",
        json={
            "email": "bob@example.com",
            "username": "bob",
            "password": "password123",
        },
    )
    alice_token = alice.json()["accessToken"]
    bob_token = bob.json()["accessToken"]

    await client.post(
        "/api/favorites/isolation-paper",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    await client.post(
        "/api/history/isolation-paper",
        headers={"Authorization": f"Bearer {alice_token}"},
    )

    bob_favorites = await client.get(
        "/api/favorites/", headers={"Authorization": f"Bearer {bob_token}"}
    )
    bob_history = await client.get(
        "/api/history/", headers={"Authorization": f"Bearer {bob_token}"}
    )

    assert bob_favorites.json()["favorites"] == []
    assert bob_history.json()["history"] == []
