import pytest


@pytest.mark.asyncio
async def test_register_new_user(client):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["username"] == "newuser"
    assert data["isAdmin"] is False


@pytest.mark.asyncio
async def test_register_duplicate_user(client, test_user):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": test_user["email"],
            "username": test_user["username"],
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_short_password(client):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "short@example.com",
            "username": "shortpass",
            "password": "1234567",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client, test_user):
    response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["userId"] == test_user["user_id"]


@pytest.mark.asyncio
async def test_refresh_token(client, test_user):
    login_response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    refresh_token = login_response.json()["refreshToken"]

    response = await client.post(
        "/api/auth/refresh",
        json={"refreshToken": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["userId"] == test_user["user_id"]


@pytest.mark.asyncio
async def test_refresh_token_invalid(client):
    response = await client.post(
        "/api/auth/refresh",
        json={"refreshToken": "invalid-token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_invalid_password(client, test_user):
    response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_user(client):
    response = await client.post(
        "/api/auth/login",
        json={"username": "nosuchuser", "password": "password123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client, test_user):
    response = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user["username"]
    assert data["email"] == test_user["email"]


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
