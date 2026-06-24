"""SEC-04: Refresh token HttpOnly cookie tests.

Verifies that:
1. Login/register set the refresh token as an HttpOnly cookie.
2. The cookie has the correct attributes (HttpOnly, SameSite, path).
3. Refresh works via cookie (no body needed).
4. Refresh still works via body (backward compatibility).
5. Logout clears the cookie.
6. Cookie takes priority over body when both are present.
"""

import pytest

from app.core.config import settings


@pytest.mark.asyncio
async def test_login_sets_refresh_cookie(client, test_user):
    """Login response includes a Set-Cookie header for the refresh token."""
    response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    assert response.status_code == 200

    cookie_name = settings.refresh_token_cookie_name
    cookies = response.cookies
    assert cookie_name in cookies
    refresh_cookie_value = cookies[cookie_name]
    assert len(refresh_cookie_value) > 0


@pytest.mark.asyncio
async def test_login_cookie_is_httponly(client, test_user):
    """The refresh token cookie must be HttpOnly (not readable by JS)."""
    response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    set_cookie_header = response.headers.get("set-cookie", "")
    assert "httponly" in set_cookie_header.lower()


@pytest.mark.asyncio
async def test_login_cookie_has_samesite(client, test_user):
    """The refresh token cookie must have a SameSite attribute."""
    response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    set_cookie_header = response.headers.get("set-cookie", "").lower()
    assert "samesite=" in set_cookie_header


@pytest.mark.asyncio
async def test_register_sets_refresh_cookie(client):
    """Register response includes a Set-Cookie header for the refresh token."""
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "cookietest@example.com",
            "username": "cookietest",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    cookie_name = settings.refresh_token_cookie_name
    assert cookie_name in response.cookies


@pytest.mark.asyncio
async def test_refresh_via_cookie(client, test_user):
    """Refresh works using only the cookie (no body needed)."""
    # Login to get the cookie set
    login_response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    assert login_response.status_code == 200

    # The httpx client automatically stores cookies; refresh without a body
    response = await client.post("/api/auth/refresh")
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["userId"] == test_user["user_id"]


@pytest.mark.asyncio
async def test_refresh_via_body_still_works(client, test_user):
    """Refresh via request body still works (backward compatibility)."""
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    # Login via the shared client to get a valid refresh token in the body
    login_response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    refresh_token = login_response.json()["refreshToken"]

    # Use a fresh client (no cookies) to test body-only refresh
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/auth/refresh",
            json={"refreshToken": refresh_token},
        )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data


@pytest.mark.asyncio
async def test_refresh_without_cookie_or_body_returns_401(client):
    """Refresh with no cookie and no body returns 401."""
    # Use a fresh client with no cookies
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/refresh")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout_clears_cookie(client, test_user):
    """Logout clears the refresh token cookie."""
    # Login to set the cookie
    await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )

    # Logout
    response = await client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 204

    # Check that the cookie is cleared (Set-Cookie with empty/max-age=0)
    set_cookie_header = response.headers.get("set-cookie", "").lower()
    cookie_name = settings.refresh_token_cookie_name.lower()
    assert cookie_name in set_cookie_header


@pytest.mark.asyncio
async def test_cookie_takes_priority_over_body(client, test_user):
    """When both cookie and body are present, cookie takes priority."""
    # Login as test_user to get a valid cookie
    login_response = await client.post(
        "/api/auth/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    assert login_response.status_code == 200

    # Now try refresh with an invalid body token but valid cookie
    response = await client.post(
        "/api/auth/refresh",
        json={"refreshToken": "invalid-body-token"},
    )
    # Should succeed because cookie takes priority over the invalid body
    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == test_user["user_id"]
