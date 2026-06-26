"""SEC-05: Resource field validation tests.

Verifies that resource creation/update/submission reject:
1. Resource IDs with path traversal or invalid characters.
2. Disciplines not in the canonical catalog.
3. Tags that are too long or contain dangerous characters.
4. Authors that are empty or too long.
5. URLs with invalid schemes (not http/https).
6. Valid inputs are accepted.
"""

import pytest


def _valid_resource_payload(**overrides) -> dict:
    """Return a valid resource payload with optional overrides."""
    payload = {
        "id": "valid-paper-1",
        "type": "paper",
        "title": "A Valid Paper",
        "authors": ["Alice Author"],
        "year": 2024,
        "discipline": "computer-science",
        "subdiscipline": "machine-learning",
        "tags": ["test", "pytest"],
        "venue": "Journal of Testing",
        "abstract": "This is a valid abstract.",
        "preview": "This is a valid preview.",
        "doi": "10.1234/test.1",
        "downloadUrl": "https://example.com/download.pdf",
        "externalUrl": "https://example.com/paper",
        "addedAt": "2024-01-01",
        "citation": {
            "apa": "Author, A. (2024). A Valid Paper. Journal of Testing.",
            "mla": 'Author, Alice. "A Valid Paper." Journal of Testing, 2024.',
            "gbt": "Author A. A Valid Paper[J]. Journal of Testing, 2024.",
            "bibtex": "@article{test, title={A Valid Paper}}",
        },
        "citations": 42,
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Resource ID validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reject_resource_id_with_path_traversal(client, admin_user):
    """Resource IDs containing slashes are rejected (path traversal)."""
    payload = _valid_resource_payload(id="../etc/passwd")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reject_resource_id_with_leading_dot(client, admin_user):
    """Resource IDs starting with a dot are rejected."""
    payload = _valid_resource_payload(id=".hidden")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reject_resource_id_with_spaces(client, admin_user):
    """Resource IDs containing spaces are rejected."""
    payload = _valid_resource_payload(id="has space")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_accept_valid_resource_id(client, admin_user):
    """Resource IDs with alphanumeric, dots, dashes, underscores are accepted."""
    payload = _valid_resource_payload(id="valid.paper-1_test")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 201


# ---------------------------------------------------------------------------
# Discipline validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reject_invalid_discipline(client, admin_user):
    """Disciplines not in the canonical catalog are rejected."""
    payload = _valid_resource_payload(discipline="fake-discipline")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_accept_valid_discipline(client, admin_user):
    """Valid discipline slugs are accepted."""
    for slug in [
        "computer-science",
        "mathematics",
        "physics",
        "life-sciences",
        "social-sciences",
        "humanities",
    ]:
        payload = _valid_resource_payload(id=f"test-{slug}", discipline=slug)
        response = await client.post(
            "/api/resources/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 201, f"Failed for discipline={slug}: {response.text}"


# ---------------------------------------------------------------------------
# Tags validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reject_tag_too_long(client, admin_user):
    """Tags exceeding 50 characters are rejected."""
    payload = _valid_resource_payload(tags=["a" * 51])
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reject_tag_with_html(client, admin_user):
    """Tags containing HTML angle brackets are rejected."""
    payload = _valid_resource_payload(tags=["<script>alert(1)</script>"])
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reject_empty_tag(client, admin_user):
    """Empty string tags are rejected."""
    payload = _valid_resource_payload(tags=[""])
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Authors validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reject_empty_author(client, admin_user):
    """Empty author names are rejected."""
    payload = _valid_resource_payload(authors=[""])
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reject_author_too_long(client, admin_user):
    """Author names exceeding 200 characters are rejected."""
    payload = _valid_resource_payload(authors=["A" * 201])
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# URL validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reject_javascript_url(client, admin_user):
    """download_url with javascript: scheme is rejected."""
    payload = _valid_resource_payload(downloadUrl="javascript:alert(1)")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reject_ftp_url(client, admin_user):
    """external_url with ftp: scheme is rejected."""
    payload = _valid_resource_payload(externalUrl="ftp://example.com/file")
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_accept_https_url(client, admin_user):
    """HTTPS URLs are accepted."""
    payload = _valid_resource_payload(
        downloadUrl="https://example.com/paper.pdf",
        externalUrl="https://example.com/page",
    )
    response = await client.post(
        "/api/resources/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 201


# ---------------------------------------------------------------------------
# Submission validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_submission_rejects_invalid_discipline(client, test_user):
    """Submissions also validate discipline."""
    payload = {
        "title": "Test Submission",
        "type": "paper",
        "authors": ["Author"],
        "year": 2024,
        "discipline": "fake-discipline",
        "abstract": "Test abstract.",
    }
    response = await client.post(
        "/api/submissions/",
        json=payload,
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submission_rejects_javascript_url(client, test_user):
    """Submissions also validate URL schemes."""
    payload = {
        "title": "Test Submission",
        "type": "paper",
        "authors": ["Author"],
        "year": 2024,
        "discipline": "computer-science",
        "abstract": "Test abstract.",
        "downloadUrl": "javascript:alert(1)",
    }
    response = await client.post(
        "/api/submissions/",
        json=payload,
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 422
