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


def _resource_payload(
    resource_id: str,
    authors: list[str] | None = None,
    tags: list[str] | None = None,
    discipline: str = "computer-science",
    citation_authors: list[str] | None = None,
) -> dict:
    payload = {
        "id": resource_id,
        "type": "paper",
        "title": f"Paper {resource_id}",
        "authors": authors or ["Charlie Other"],
        "year": 2024,
        "discipline": discipline,
        "subdiscipline": "machine-learning",
        "tags": tags or [],
        "venue": "Journal of Testing",
        "abstract": "Test abstract.",
        "preview": "Test preview.",
        "doi": f"10.1234/test.{resource_id}",
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
    if citation_authors:
        payload["citation"]["authors"] = citation_authors
    return payload


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


@pytest.mark.asyncio
async def test_get_related_resources_sorted(client, admin_user):
    target = _resource_payload(
        "target-paper",
        authors=["Alice Author", "Bob Author"],
        tags=["machine-learning", "ai"],
        discipline="computer-science",
    )
    same_author = _resource_payload(
        "same-author-paper",
        authors=["Alice Author"],
        tags=[],
        discipline="physics",
    )
    same_tag = _resource_payload(
        "same-tag-paper",
        authors=["Charlie Other"],
        tags=["ai"],
        discipline="physics",
    )
    same_discipline = _resource_payload(
        "same-discipline-paper",
        authors=["Charlie Other"],
        tags=[],
        discipline="computer-science",
    )
    unrelated = _resource_payload(
        "unrelated-paper",
        authors=["Dave Other"],
        tags=["biology-tag"],
        discipline="life-sciences",
    )

    for payload in [target, same_author, same_tag, same_discipline, unrelated]:
        response = await client.post(
            "/api/resources/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 201

    response = await client.get("/api/resources/target-paper/related")
    assert response.status_code == 200
    data = response.json()["data"]
    related_ids = [item["id"] for item in data]

    assert "target-paper" not in related_ids
    assert "unrelated-paper" not in related_ids
    assert related_ids == [
        "same-author-paper",
        "same-tag-paper",
        "same-discipline-paper",
    ]


@pytest.mark.asyncio
async def test_get_related_resources_by_citation_authors(client, admin_user):
    target = _resource_payload(
        "target-citation-paper",
        authors=["Eve Author"],
        tags=[],
        discipline="computer-science",
        citation_authors=["Alice Author"],
    )
    related_by_citation = _resource_payload(
        "related-citation-paper",
        authors=["Alice Author"],
        tags=[],
        discipline="physics",
    )

    for payload in [target, related_by_citation]:
        response = await client.post(
            "/api/resources/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 201

    response = await client.get("/api/resources/target-citation-paper/related")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["id"] == "related-citation-paper"


@pytest.mark.asyncio
async def test_get_related_resources_not_found(client):
    response = await client.get("/api/resources/nonexistent/related")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_related_resources_limit(client, admin_user):
    target = _resource_payload(
        "target-limit-paper",
        authors=["Alice Author"],
        tags=["shared-tag"],
        discipline="computer-science",
    )
    same_tag_1 = _resource_payload(
        "same-tag-limit-1",
        authors=["Bob Other"],
        tags=["shared-tag"],
        discipline="physics",
    )
    same_tag_2 = _resource_payload(
        "same-tag-limit-2",
        authors=["Charlie Other"],
        tags=["shared-tag"],
        discipline="physics",
    )

    for payload in [target, same_tag_1, same_tag_2]:
        response = await client.post(
            "/api/resources/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 201

    response = await client.get("/api/resources/target-limit-paper/related?limit=1")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1


@pytest.mark.asyncio
async def test_search_resources_empty(client, admin_user, sample_resource_payload):
    await client.post(
        "/api/resources/",
        json=sample_resource_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )

    response = await client.get("/api/resources/?q=definitelynotfound")
    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []
    assert data["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_search_resources_with_filters(client, admin_user):
    paper = _resource_payload("search-filter-paper", discipline="computer-science")
    paper["title"] = "Machine Learning Survey"
    paper["type"] = "paper"
    paper["year"] = 2024

    book = _resource_payload("search-filter-book", discipline="computer-science")
    book["title"] = "Machine Learning Textbook"
    book["type"] = "book"
    book["year"] = 2024

    for payload in [paper, book]:
        response = await client.post(
            "/api/resources/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 201

    response = await client.get("/api/resources/?q=machine&discipline=computer-science&year=2024")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 2

    response = await client.get("/api/resources/?q=machine&type=paper&year=2024")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["id"] == "search-filter-paper"


@pytest.mark.asyncio
async def test_list_resources_filter_by_tag(client, admin_user):
    tagged = _resource_payload("tagged-paper", tags=["neural-networks", "pytorch"])
    untagged = _resource_payload("untagged-paper", tags=["other"])

    for payload in [tagged, untagged]:
        response = await client.post(
            "/api/resources/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 201

    response = await client.get("/api/resources/?tags=neural-networks")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["id"] == "tagged-paper"


@pytest.mark.asyncio
async def test_search_resources_relevance_ranking(client, admin_user, db_session):
    if db_session.bind.dialect.name != "postgresql":
        pytest.skip("Full-text relevance ranking requires PostgreSQL")

    title_match = _resource_payload("title-match-paper", tags=["other"])
    title_match["title"] = "Quantum Computing Advances"

    tag_match = _resource_payload("tag-match-paper", tags=["quantum"])
    tag_match["title"] = "Some Other Paper"

    for payload in [title_match, tag_match]:
        response = await client.post(
            "/api/resources/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 201

    response = await client.get("/api/resources/?q=quantum&sort=relevance")
    assert response.status_code == 200
    data = response.json()["data"]
    assert [item["id"] for item in data] == ["title-match-paper", "tag-match-paper"]
