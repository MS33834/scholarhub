import pytest


@pytest.mark.asyncio
async def test_add_favorite(client, test_user, sample_resource):
    response = await client.post(
        f"/api/favorites/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 201
    assert response.json()["message"] == "Added to favorites"


@pytest.mark.asyncio
async def test_add_favorite_duplicate(client, test_user, sample_resource):
    await client.post(
        f"/api/favorites/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    response = await client.post(
        f"/api/favorites/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 201
    assert response.json()["message"] == "Already favorited"


@pytest.mark.asyncio
async def test_add_favorite_missing_resource(client, test_user):
    response = await client.post(
        "/api/favorites/nonexistent",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_favorite_unauthenticated(client, sample_resource):
    response = await client.post(f"/api/favorites/{sample_resource['id']}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_favorites(client, test_user, sample_resource):
    await client.post(
        f"/api/favorites/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.get(
        "/api/favorites/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["favorites"]) == 1
    assert data["favorites"][0]["id"] == sample_resource["id"]


@pytest.mark.asyncio
async def test_list_favorites_empty(client, test_user):
    response = await client.get(
        "/api/favorites/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    assert response.json()["favorites"] == []


@pytest.mark.asyncio
async def test_remove_favorite(client, test_user, sample_resource):
    await client.post(
        f"/api/favorites/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )

    response = await client.delete(
        f"/api/favorites/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 204

    response = await client.get(
        "/api/favorites/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.json()["favorites"] == []


@pytest.mark.asyncio
async def test_remove_favorite_not_found(client, test_user, sample_resource):
    response = await client.delete(
        f"/api/favorites/{sample_resource['id']}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 404
