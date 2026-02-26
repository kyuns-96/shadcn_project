import pytest
from httpx import AsyncClient


SAMPLE_CONFIG = {
    "byId": {
        "doe-1": {"id": "doe-1", "label": "DoE-001", "PROJECT_NAME": "proj1"}
    },
    "allIds": ["doe-1"],
}


async def register_and_login(client: AsyncClient, username: str) -> dict:
    """Helper: register a user and return auth headers."""
    await client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": f"{username}@test.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": "secret123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_crud_doe_setup(client: AsyncClient):
    headers = await register_and_login(client, "doeuser")

    # Create
    resp = await client.post(
        "/api/v1/doe-setups",
        json={"name": "My Setup", "config": SAMPLE_CONFIG},
        headers=headers,
    )
    assert resp.status_code == 201
    setup = resp.json()
    setup_id = setup["id"]
    assert setup["name"] == "My Setup"

    # List
    resp = await client.get("/api/v1/doe-setups", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Update
    resp = await client.put(
        f"/api/v1/doe-setups/{setup_id}",
        json={"name": "Renamed"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed"

    # Delete
    resp = await client.delete(
        f"/api/v1/doe-setups/{setup_id}", headers=headers
    )
    assert resp.status_code == 204

    # Verify deleted
    resp = await client.get("/api/v1/doe-setups", headers=headers)
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_doe_setup_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/doe-setups")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_cross_user_isolation(client: AsyncClient):
    """User A cannot see, update, or delete User B's setups."""
    headers_a = await register_and_login(client, "user_a")
    headers_b = await register_and_login(client, "user_b")

    # User A creates a setup
    resp = await client.post(
        "/api/v1/doe-setups",
        json={"name": "A's Setup", "config": SAMPLE_CONFIG},
        headers=headers_a,
    )
    setup_id = resp.json()["id"]

    # User B cannot see it
    resp = await client.get("/api/v1/doe-setups", headers=headers_b)
    assert len(resp.json()) == 0

    # User B cannot update it
    resp = await client.put(
        f"/api/v1/doe-setups/{setup_id}",
        json={"name": "Hacked"},
        headers=headers_b,
    )
    assert resp.status_code == 404

    # User B cannot delete it
    resp = await client.delete(
        f"/api/v1/doe-setups/{setup_id}", headers=headers_b
    )
    assert resp.status_code == 404

    # User A can still see it
    resp = await client.get("/api/v1/doe-setups", headers=headers_a)
    assert len(resp.json()) == 1
