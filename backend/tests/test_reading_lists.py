import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.models import ReadingList, ReadingListItem, User


@pytest_asyncio.fixture
async def another_user(client: AsyncClient, db_session: AsyncSession) -> dict:
    """Create a second standard user and return credentials + token."""
    payload = {
        "email": "other@example.com",
        "username": "otheruser",
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


@pytest.mark.asyncio
async def test_create_reading_list(client, test_user):
    response = await client.post(
        "/api/reading-lists/",
        json={"name": "My Reading List", "description": "A test list", "isPublic": True},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Reading List"
    assert data["description"] == "A test list"
    assert data["isPublic"] is True
    assert data["itemCount"] == 0
    assert "id" in data


@pytest.mark.asyncio
async def test_create_reading_list_unauthenticated(client):
    response = await client.post(
        "/api/reading-lists/",
        json={"name": "My Reading List"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_reading_lists(client, test_user):
    await client.post(
        "/api/reading-lists/",
        json={"name": "List One"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    await client.post(
        "/api/reading-lists/",
        json={"name": "List Two"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.get(
        "/api/reading-lists/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 2
    assert {item["name"] for item in data} == {"List One", "List Two"}
    assert all(item["itemCount"] == 0 for item in data)


@pytest.mark.asyncio
async def test_list_reading_lists_only_own(client, test_user, another_user):
    await client.post(
        "/api/reading-lists/",
        json={"name": "Own List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    await client.post(
        "/api/reading-lists/",
        json={"name": "Other List"},
        headers={"Authorization": f"Bearer {another_user['token']}"},
    )

    response = await client.get(
        "/api/reading-lists/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["name"] == "Own List"


@pytest.mark.asyncio
async def test_get_reading_list_detail(client, test_user, sample_resource):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Detail List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    await client.post(
        f"/api/reading-lists/{list_id}/items",
        json={"resourceId": sample_resource["id"]},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.get(
        f"/api/reading-lists/{list_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Detail List"
    assert len(data["items"]) == 1
    assert data["items"][0]["resource"]["id"] == sample_resource["id"]
    assert "addedAt" in data["items"][0]


@pytest.mark.asyncio
async def test_update_reading_list(client, test_user):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Old Name", "description": "Old desc", "isPublic": False},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/reading-lists/{list_id}",
        json={"name": "New Name", "isPublic": True},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["description"] == "Old desc"
    assert data["isPublic"] is True


@pytest.mark.asyncio
async def test_delete_reading_list(client, test_user, db_session):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "To Delete"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    response = await client.delete(
        f"/api/reading-lists/{list_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 204

    result = await db_session.execute(
        select(ReadingList).where(ReadingList.id == list_id)
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_cannot_access_other_user_list(client, test_user, another_user):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Private List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    response = await client.get(
        f"/api/reading-lists/{list_id}",
        headers={"Authorization": f"Bearer {another_user['token']}"},
    )
    assert response.status_code == 403

    response = await client.patch(
        f"/api/reading-lists/{list_id}",
        json={"name": "Hacked"},
        headers={"Authorization": f"Bearer {another_user['token']}"},
    )
    assert response.status_code == 403

    response = await client.delete(
        f"/api/reading-lists/{list_id}",
        headers={"Authorization": f"Bearer {another_user['token']}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_add_and_remove_item(client, test_user, sample_resource, db_session):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Item List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    add_response = await client.post(
        f"/api/reading-lists/{list_id}/items",
        json={"resourceId": sample_resource["id"]},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert add_response.status_code == 201
    assert add_response.json()["message"] == "Resource added to reading list"

    duplicate_response = await client.post(
        f"/api/reading-lists/{list_id}/items",
        json={"resourceId": sample_resource["id"]},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert duplicate_response.status_code == 201
    assert duplicate_response.json()["message"] == "Resource already in reading list"

    remove_response = await client.delete(
        f"/api/reading-lists/{list_id}/items/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert remove_response.status_code == 204

    result = await db_session.execute(
        select(ReadingListItem).where(
            ReadingListItem.reading_list_id == list_id,
            ReadingListItem.resource_id == sample_resource["id"],
        )
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_add_item_to_other_user_list(
    client, test_user, another_user, sample_resource
):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Private List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    response = await client.post(
        f"/api/reading-lists/{list_id}/items",
        json={"resourceId": sample_resource["id"]},
        headers={"Authorization": f"Bearer {another_user['token']}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_add_item_missing_resource(client, test_user):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Item List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    response = await client.post(
        f"/api/reading-lists/{list_id}/items",
        json={"resourceId": "nonexistent"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_remove_item_not_found(client, test_user, sample_resource):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Item List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    response = await client.delete(
        f"/api/reading-lists/{list_id}/items/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_reading_list_cascades_items(
    client, test_user, sample_resource, db_session
):
    create_response = await client.post(
        "/api/reading-lists/",
        json={"name": "Cascade List"},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    list_id = create_response.json()["id"]

    await client.post(
        f"/api/reading-lists/{list_id}/items",
        json={"resourceId": sample_resource["id"]},
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    items_before = await db_session.execute(
        select(ReadingListItem).where(ReadingListItem.reading_list_id == list_id)
    )
    assert len(items_before.scalars().all()) == 1

    await client.delete(
        f"/api/reading-lists/{list_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    items_after = await db_session.execute(
        select(ReadingListItem).where(ReadingListItem.reading_list_id == list_id)
    )
    assert len(items_after.scalars().all()) == 0
