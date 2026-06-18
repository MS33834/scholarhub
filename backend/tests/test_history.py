import pytest
from sqlalchemy import select

from app.models.models import ReadingHistory


@pytest.mark.asyncio
async def test_add_to_history(client, test_user, sample_resource):
    response = await client.post(
        f"/api/history/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 201
    assert response.json()["message"] == "Added to history"


@pytest.mark.asyncio
async def test_add_to_history_unauthenticated(client, sample_resource):
    response = await client.post(f"/api/history/{sample_resource['id']}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_history(client, test_user, sample_resource):
    await client.post(
        f"/api/history/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.get(
        "/api/history/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["history"]) == 1
    assert data["history"][0]["resource"]["id"] == sample_resource["id"]
    assert "viewedAt" in data["history"][0]


@pytest.mark.asyncio
async def test_list_history_ordered_by_viewed_at(client, test_user, sample_resource, admin_user):
    second_resource = {
        **sample_resource,
        "id": "test-paper-2",
        "title": "Second Test Paper",
    }
    await client.post(
        "/api/resources/",
        json=second_resource,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )

    await client.post(
        f"/api/history/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    await client.post(
        f"/api/history/{second_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.get(
        "/api/history/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    data = response.json()
    assert data["history"][0]["resource"]["id"] == second_resource["id"]


@pytest.mark.asyncio
async def test_remove_from_history(client, test_user, sample_resource, db_session):
    await client.post(
        f"/api/history/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.delete(
        f"/api/history/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 204

    result = await db_session.execute(
        select(ReadingHistory).where(
            ReadingHistory.user_id == test_user["user_id"],
            ReadingHistory.resource_id == sample_resource["id"],
        )
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_history_isolated_per_user(client, test_user, admin_user, sample_resource):
    await client.post(
        f"/api/history/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.get(
        "/api/history/",
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 200
    assert response.json()["history"] == []
