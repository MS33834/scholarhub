import pytest


SAMPLE_SUBMISSION = {
    "title": "A Submitted Paper",
    "type": "paper",
    "authors": ["Submitted Author"],
    "year": 2024,
    "venue": "Journal of Submissions",
    "discipline": "computer-science",
    "subdiscipline": "machine-learning",
    "tags": ["submission", "test"],
    "abstract": "This is a submission abstract that is long enough to test preview truncation when the submission is approved by an administrator.",
    "doi": "10.1234/submitted.1",
}


@pytest.fixture
def sample_submission_payload():
    return SAMPLE_SUBMISSION.copy()


@pytest.mark.asyncio
async def test_create_submission_unauthenticated(client, sample_submission_payload):
    response = await client.post("/api/submissions/", json=sample_submission_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_my_submissions(client, test_user, sample_submission_payload):
    response = await client.post(
        "/api/submissions/",
        json=sample_submission_payload,
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == sample_submission_payload["title"]
    assert data["status"] == "pending"
    assert data["userId"] == test_user["user_id"]
    assert data["username"] == test_user["username"]

    response = await client.get(
        "/api/submissions/me",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["status"] == "pending"
    assert data["meta"]["total"] == 1


@pytest.mark.asyncio
async def test_user_cannot_access_admin_or_others_submissions(
    client, test_user, admin_user, sample_submission_payload
):
    # Admin creates a submission so the regular user can attempt to access it.
    response = await client.post(
        "/api/submissions/",
        json=sample_submission_payload,
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 201
    submission_id = response.json()["id"]

    response = await client.get(
        "/api/submissions/",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 403

    response = await client.get(
        f"/api/submissions/{submission_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_approve_creates_resource(
    client, test_user, admin_user, sample_submission_payload
):
    response = await client.post(
        "/api/submissions/",
        json=sample_submission_payload,
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 201
    submission_id = response.json()["id"]

    response = await client.patch(
        f"/api/submissions/{submission_id}",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["resourceId"] is not None

    resource_id = data["resourceId"]
    response = await client.get(f"/api/resources/{resource_id}")
    assert response.status_code == 200
    resource = response.json()
    assert resource["title"] == sample_submission_payload["title"]
    assert resource["preview"] == sample_submission_payload["abstract"][:200]


@pytest.mark.asyncio
async def test_admin_reject_with_note(
    client, test_user, admin_user, sample_submission_payload
):
    response = await client.post(
        "/api/submissions/",
        json=sample_submission_payload,
        headers={"Authorization": f"Bearer {test_user['token']}"},
    )
    assert response.status_code == 201
    submission_id = response.json()["id"]

    response = await client.patch(
        f"/api/submissions/{submission_id}",
        json={"status": "rejected", "adminNote": "Not suitable for the catalog"},
        headers={"Authorization": f"Bearer {admin_user['token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["adminNote"] == "Not suitable for the catalog"
    assert data["resourceId"] is None
