"""SEC-03: Request body size limit tests.

Verifies the three layers of defence against oversized payloads:
1. ASGI ``MaxBodySizeMiddleware`` rejects bodies whose Content-Length exceeds
   the limit (HTTP 413) before the application processes them.
2. Pydantic ``max_length`` validators reject individual fields that exceed
   their per-field limit (HTTP 422).
3. Normal-sized requests continue to work unchanged.
"""

import json

import pytest

from app.middleware.max_body import MaxBodySizeMiddleware


def _resource_payload(abstract: str = "Test abstract.") -> dict:
    return {
        "id": "sec03-paper-1",
        "type": "paper",
        "title": "SEC-03 Test Paper",
        "authors": ["Alice Author"],
        "year": 2024,
        "discipline": "computer-science",
        "subdiscipline": "machine-learning",
        "tags": ["test"],
        "venue": "Journal of Testing",
        "abstract": abstract,
        "preview": "Test preview.",
        "doi": "10.1234/sec03.1",
        "downloadUrl": "https://example.com/download.pdf",
        "externalUrl": "https://example.com/paper",
        "addedAt": "2024-01-01",
        "citation": {
            "apa": "Author. (2024). Test.",
            "mla": 'Author. "Test." 2024.',
            "gbt": "Author. Test[J]. 2024.",
            "bibtex": "@article{test, title={Test}}",
        },
        "citations": 1,
    }


# ---------------------------------------------------------------------------
# Layer 1: ASGI MaxBodySizeMiddleware
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_max_body_middleware_rejects_oversized_body(client):
    """Bodies exceeding 1 MiB are rejected with 413 by the middleware."""
    # Build a JSON body just over 1 MiB. A long abstract value ensures the
    # serialized JSON exceeds the limit.
    big_payload = _resource_payload(abstract="A" * 1_100_000)
    body = json.dumps(big_payload).encode("utf-8")
    assert len(body) > 1_048_576  # sanity check: body exceeds 1 MiB

    response = await client.post(
        "/api/resources/",
        content=body,
        headers={
            "Authorization": "Bearer dummy",
            "Content-Type": "application/json",
        },
    )
    assert response.status_code == 413
    assert "too large" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_max_body_middleware_allows_normal_body(client):
    """Normal-sized bodies pass through the middleware (may still fail on auth)."""
    payload = _resource_payload(abstract="A small abstract.")
    body = json.dumps(payload).encode("utf-8")
    assert len(body) < 1_048_576

    # We don't authenticate, so we expect 401/422 — NOT 413. The point is
    # that the middleware does not block a reasonably-sized request.
    response = await client.post(
        "/api/resources/",
        content=body,
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code != 413


@pytest.mark.asyncio
async def test_max_body_middleware_passes_non_http_scopes():
    """WebSocket and lifespan scopes are passed through untouched."""
    from starlette.types import Scope

    called = False

    async def app(scope: Scope, receive, send):
        nonlocal called
        called = True

    middleware = MaxBodySizeMiddleware(app, max_size=100)
    await middleware({"type": "lifespan"}, lambda: None, lambda m: None)
    assert called


# ---------------------------------------------------------------------------
# Layer 2: Pydantic max_length field validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_resource_rejects_oversized_abstract(client, admin_user):
    """An abstract exceeding 20 000 characters is rejected with 422."""
    payload = _resource_payload(abstract="A" * 20_001)
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_resource_rejects_oversized_title(client, admin_user):
    """A title exceeding 1 000 characters is rejected with 422."""
    payload = _resource_payload()
    payload["abstract"] = "Valid abstract."
    payload["title"] = "T" * 1001
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_resource_rejects_oversized_authors_list(client, admin_user):
    """An authors list exceeding 200 entries is rejected with 422."""
    payload = _resource_payload()
    payload["abstract"] = "Valid abstract."
    payload["authors"] = [f"Author {i}" for i in range(201)]
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Layer 3: Normal requests still work
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_normal_resource_creation_still_works(client, admin_user):
    """A valid, normal-sized resource is created successfully (201)."""
    payload = _resource_payload(abstract="A perfectly normal abstract.")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 201
    assert response.json()["id"] == payload["id"]
