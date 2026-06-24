"""Sprint 4: API version header and production readiness tests."""

import pytest


class TestAPIVersion:
    """Verify the X-API-Version header is present on all responses."""

    @pytest.mark.asyncio
    async def test_version_header_on_api_response(self, client):
        """Every API response includes the X-API-Version header."""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.headers.get("x-api-version") == "1.2.0"

    @pytest.mark.asyncio
    async def test_version_header_on_error_response(self, client):
        """Error responses also include the version header."""
        response = await client.get("/api/resources/nonexistent-id-12345")
        # 404 or 401 depending on auth, but either way should have the header.
        assert response.status_code in (401, 404)
        assert response.headers.get("x-api-version") == "1.2.0"

    @pytest.mark.asyncio
    async def test_root_returns_version(self, client):
        """The root endpoint returns the current API version in the body."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "1.2.0"

    @pytest.mark.asyncio
    async def test_security_headers_present(self, client):
        """Baseline security headers are present on responses."""
        response = await client.get("/health")
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
