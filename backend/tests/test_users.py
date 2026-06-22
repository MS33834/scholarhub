import pytest
import pytest_asyncio
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.models.models import User


@pytest_asyncio.fixture
async def disabled_user(db_session):
    """Create a disabled user and return an auth token for it."""
    user = User(
        email="disabled@example.com",
        username="disableduser",
        hashed_password=hash_password("password123"),
        is_active=False,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"user_id": user.id, "username": user.username, "token": token}


@pytest.mark.asyncio
async def test_disabled_user_token_is_rejected(client, disabled_user):
    """A disabled user must receive 403 when using a valid access token."""
    response = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {disabled_user['token']}"}
    )
    assert response.status_code == 403
    assert "disabled" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_can_list_users(client, admin_user, db_session):
    """Admins can retrieve a paginated list of users without password hashes."""
    db_session.add(
        User(
            email="alice@example.com",
            username="alice",
            hashed_password=hash_password("password123"),
            is_active=True,
            is_admin=False,
        )
    )
    db_session.add(
        User(
            email="bob@example.com",
            username="bob",
            hashed_password=hash_password("password123"),
            is_active=True,
            is_admin=False,
        )
    )
    await db_session.commit()

    response = await client.get(
        "/api/users/", headers={"Authorization": f"Bearer {admin_user['token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "meta" in data
    assert data["meta"]["total"] >= 3
    assert all("hashedPassword" not in user and "password" not in user for user in data["data"])


@pytest.mark.asyncio
async def test_admin_can_get_user_detail(client, admin_user, test_user):
    """Admins can fetch a single user's details."""
    response = await client.get(
        f"/api/users/{test_user['user_id']}",
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user["user_id"]
    assert data["username"] == test_user["username"]
    assert "hashedPassword" not in data and "password" not in data


@pytest.mark.asyncio
async def test_admin_can_update_user_status(client, admin_user, test_user, db_session):
    """Admins can toggle is_active and is_admin for another user."""
    response = await client.patch(
        f"/api/users/{test_user['user_id']}",
        json={"isActive": False, "isAdmin": True},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["isActive"] is False
    assert data["isAdmin"] is True

    result = await db_session.execute(select(User).where(User.id == test_user["user_id"]))
    user = result.scalar_one()
    assert user.is_active is False
    assert user.is_admin is True


@pytest.mark.asyncio
async def test_admin_cannot_delete_self(client, admin_user):
    """Admins must not be able to delete their own account."""
    response = await client.delete(
        f"/api/users/{admin_user['user_id']}",
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 400
    assert "own" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_can_delete_other_user(client, admin_user, test_user, db_session):
    """Admins can delete another user, who then becomes unreachable."""
    response = await client.delete(
        f"/api/users/{test_user['user_id']}",
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 204

    result = await db_session.execute(select(User).where(User.id == test_user["user_id"]))
    assert result.scalar_one_or_none() is None

    get_response = await client.get(
        f"/api/users/{test_user['user_id']}",
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_non_admin_cannot_access_user_management(client, test_user):
    """Regular users must receive 403 on admin-only user management endpoints."""
    endpoints = [
        ("get", "/api/users/"),
        ("get", f"/api/users/{test_user['user_id']}"),
        ("patch", f"/api/users/{test_user['user_id']}"),
        ("delete", f"/api/users/{test_user['user_id']}"),
    ]
    for method, url in endpoints:
        response = await client.request(
            method,
            url,
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={"isActive": False} if method == "patch" else None,
        )
        assert response.status_code == 403, f"{method.upper()} {url} should be forbidden"
