import pytest
from sqlalchemy import select

from app.models.models import Resource


SAMPLE_RESOURCE = {
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


@pytest.fixture
def sample_resource_payload():
    return SAMPLE_RESOURCE.copy()


@pytest.mark.asyncio
async def test_list_resources_empty(client):
    response = await client.get("/api/resources/")
    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []
    assert data["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_create_resource_as_admin(client, admin_user, sample_resource_payload):
    response = await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == sample_resource_payload["id"]
    assert data["title"] == sample_resource_payload["title"]
    assert data["authors"] == sample_resource_payload["authors"]


@pytest.mark.asyncio
async def test_create_resource_as_non_admin(client, test_user, sample_resource_payload):
    response = await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_duplicate_resource(client, admin_user, sample_resource_payload):
    await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    response = await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_get_resource(client, admin_user, sample_resource_payload):
    await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    response = await client.get(f"/api/resources/{sample_resource_payload['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_resource_payload["id"]


@pytest.mark.asyncio
async def test_get_resource_not_found(client):
    response = await client.get("/api/resources/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_resource(client, admin_user, sample_resource_payload):
    await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )

    response = await client.put(
        f"/api/resources/{sample_resource_payload['id']}",
        json={"title": "Updated Title", "year": 2025},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["year"] == 2025
    assert data["authors"] == sample_resource_payload["authors"]


@pytest.mark.asyncio
async def test_delete_resource(client, admin_user, sample_resource_payload, db_session):
    await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )

    response = await client.delete(
        f"/api/resources/{sample_resource_payload['id']}",
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 204

    result = await db_session.execute(
        select(Resource).where(Resource.id == sample_resource_payload["id"])
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_search_resources(client, admin_user, sample_resource_payload):
    await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )

    response = await client.get("/api/resources/?q=pytest")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1

    response = await client.get("/api/resources/?q=nomatch")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0
