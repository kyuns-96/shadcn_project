import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # Register
    resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "secret123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "testuser"

    # Login
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "secret123"},
    )
    assert resp.status_code == 200
    tokens = resp.json()
    assert "access_token" in tokens

    # Get me
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "testuser"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "user2", "email": "u2@example.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "user2", "password": "wrong"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_registration(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"username": "dup", "email": "dup@example.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "dup", "email": "dup2@example.com", "password": "secret123"},
    )
    assert resp.status_code == 409
