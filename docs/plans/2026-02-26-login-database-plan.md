# Login + Database Implementation Plan (Revision 3)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add user authentication (login/register) with a FastAPI + PostgreSQL backend so users can save and load DoE configurations.

**Architecture:** React SPA communicates with a FastAPI backend via REST API using JWT Bearer tokens stored in localStorage (accepted XSS trade-off for SPA simplicity; CSP headers mitigate). PostgreSQL stores users and their saved DoE setups as JSONB. The sidebar footer shows the logged-in user with logout capability.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, bcrypt, python-jose (JWT), Pydantic v2, Alembic, React 19, Redux Toolkit, shadcn/ui

**Auth transport decision:** Bearer token in localStorage. Rationale: This is an internal tool SPA where httpOnly cookies add CORS/CSRF complexity for marginal benefit. CSP `script-src 'self'` header will be set to mitigate XSS.

**Test database:** PostgreSQL (same as production). Tests run against a separate `subutai_test` database using the same Docker PostgreSQL container. This avoids SQLite/JSONB/UUID incompatibility. Tests reset schema between runs using `DROP/CREATE` via Alembic.

**401 handling:** A shared `fetchWithAuth` utility wraps all authenticated fetch calls and dispatches `logout` on 401 responses, ensuring consistent auth state across all API calls.

**DoE save/load UI:** A minimal "Saved Setups" dialog is included in this plan — a button in the sidebar to open a list of saved setups, with save-current and load/delete actions. This completes the core goal.

---

## Task 1: Backend Project Scaffolding

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`
- Create: `backend/app/routers/__init__.py`

**Step 1: Create backend directory and pyproject.toml**

```bash
mkdir -p backend/app/routers backend/tests
```

`backend/pyproject.toml`:
```toml
[project]
name = "subutai-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.9",
    "email-validator>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
    "aiosqlite>=0.20.0",
    "ruff>=0.8.0",
]

[tool.ruff]
line-length = 88

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

**Step 2: Create config.py**

`backend/app/config.py`:
```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/subutai"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    model_config = {"env_prefix": "SUBUTAI_"}


settings = Settings()
```

**Step 3: Create database.py**

`backend/app/database.py`:
```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(settings.database_url)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        yield session
```

**Step 4: Create main.py**

`backend/app/main.py`:
```python
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
from app.routers import auth, doe_setups


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only auto-create tables in development; production uses Alembic migrations
    if os.getenv("SUBUTAI_ENV", "development") == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Subutai API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(doe_setups.router, prefix="/api/v1/doe-setups", tags=["doe-setups"])
```

**Step 5: Create empty __init__.py files**

```bash
touch backend/app/__init__.py backend/app/routers/__init__.py backend/tests/__init__.py
```

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat(backend): scaffold FastAPI project with config and database"
```

---

## Task 2: Database Models + Alembic Baseline Migration

**Files:**
- Create: `backend/app/models.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/001_initial.py`

**Step 1: Write the models**

`backend/app/models.py`:
```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    doe_setups: Mapped[list["DoESetup"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class DoESetup(Base):
    __tablename__ = "doe_setups"
    __table_args__ = (
        Index("ix_doe_setups_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="doe_setups")
```

**Step 2: Initialize Alembic**

```bash
cd backend && uv run alembic init alembic
```

Edit `backend/alembic/env.py` to use async engine and import models:

```python
# In env.py, key changes:
from app.models import Base
from app.config import settings

target_metadata = Base.metadata
# ... configure async engine with settings.database_url
```

**Step 3: Generate initial migration**

```bash
cd backend && uv run alembic revision --autogenerate -m "initial: users and doe_setups tables"
```

**Step 4: Commit**

```bash
git add backend/
git commit -m "feat(backend): add models with Alembic baseline migration"
```

---

## Task 3: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas.py`

**Step 1: Write request/response schemas**

`backend/app/schemas.py`:
```python
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- DoE Setups ---

class DoESetupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    config: dict


class DoESetupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    config: dict | None = None


class DoESetupResponse(BaseModel):
    id: uuid.UUID
    name: str
    config: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

**Step 2: Commit**

```bash
git add backend/app/schemas.py
git commit -m "feat(backend): add Pydantic schemas for auth and DoE setups"
```

---

## Task 4: Auth Utilities (JWT + Password Hashing)

**Files:**
- Create: `backend/app/auth.py`

**Step 1: Write auth utilities**

`backend/app/auth.py`:
```python
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(user_id), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None or payload.get("type") != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
```

**Step 2: Commit**

```bash
git add backend/app/auth.py
git commit -m "feat(backend): add JWT and password hashing auth utilities"
```

---

## Task 5: Auth Router (Register, Login, Me) + Tests

**Files:**
- Create: `backend/app/routers/auth.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

**Step 1: Write test conftest (PostgreSQL test DB)**

Use a dedicated `subutai_test` PostgreSQL database — same types as production (JSONB, UUID), no SQLite incompatibility.

Add `SUBUTAI_TEST_DATABASE_URL` to `backend/.env.example`:
```
SUBUTAI_TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/subutai_test
```

`backend/tests/conftest.py`:
```python
import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models import Base

TEST_DATABASE_URL = os.getenv(
    "SUBUTAI_TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/subutai_test",
)

engine = create_async_engine(TEST_DATABASE_URL)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

Remove `aiosqlite` from dev dependencies (no longer needed). The `subutai_test` database must exist before running tests:
```bash
docker compose up -d
docker exec -it <container> psql -U postgres -c "CREATE DATABASE subutai_test;"
```

**Step 2: Write the failing auth tests**

`backend/tests/test_auth.py`:
```python
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
```

**Step 3: Run tests to verify they fail**

```bash
cd backend && uv run pytest tests/test_auth.py -v
```

Expected: FAIL (router not implemented)

**Step 4: Write the auth router**

`backend/app/routers/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import User
from app.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            (User.username == body.username) | (User.email == body.email)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username or email already taken")

    user = User(
        username=body.username,
        email=body.email,
        password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.username == body.username)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Step 5: Run tests to verify they pass**

```bash
cd backend && uv run pytest tests/test_auth.py -v
```

Expected: ALL PASS

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat(backend): add auth router with register, login, me + tests"
```

---

## Task 6: DoE Setups Router (CRUD) + Data Isolation Tests

**Files:**
- Create: `backend/app/routers/doe_setups.py`
- Create: `backend/tests/test_doe_setups.py`

**Step 1: Write tests including cross-user isolation**

`backend/tests/test_doe_setups.py`:
```python
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
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && uv run pytest tests/test_doe_setups.py -v
```

**Step 3: Write the DoE setups router (all queries scoped to current_user.id)**

`backend/app/routers/doe_setups.py`:
```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DoESetup, User
from app.schemas import DoESetupCreate, DoESetupResponse, DoESetupUpdate

router = APIRouter()


@router.get("", response_model=list[DoESetupResponse])
async def list_setups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoESetup)
        .where(DoESetup.user_id == current_user.id)
        .order_by(DoESetup.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=DoESetupResponse, status_code=201)
async def create_setup(
    body: DoESetupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    setup = DoESetup(
        user_id=current_user.id,
        name=body.name,
        config=body.config,
    )
    db.add(setup)
    await db.commit()
    await db.refresh(setup)
    return setup


@router.put("/{setup_id}", response_model=DoESetupResponse)
async def update_setup(
    setup_id: uuid.UUID,
    body: DoESetupUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoESetup).where(
            DoESetup.id == setup_id, DoESetup.user_id == current_user.id
        )
    )
    setup = result.scalar_one_or_none()
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")

    if body.name is not None:
        setup.name = body.name
    if body.config is not None:
        setup.config = body.config

    await db.commit()
    await db.refresh(setup)
    return setup


@router.delete("/{setup_id}", status_code=204)
async def delete_setup(
    setup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoESetup).where(
            DoESetup.id == setup_id, DoESetup.user_id == current_user.id
        )
    )
    setup = result.scalar_one_or_none()
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")

    await db.delete(setup)
    await db.commit()
```

**Step 4: Run all tests**

```bash
cd backend && uv run pytest tests/ -v
```

Expected: ALL PASS (including cross-user isolation)

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): add DoE setups CRUD with per-user ownership + isolation tests"
```

---

## Task 7: Vite Proxy + CSP Header Configuration

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add proxy and CSP header to dev server**

In `vite.config.ts`, add to `defineConfig`:

```typescript
server: {
  proxy: {
    "/api/v1": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
  headers: {
    "Content-Security-Policy": "script-src 'self'",
  },
},
```

**Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "feat(config): add Vite proxy for FastAPI backend and CSP header"
```

---

## Task 8: Frontend Auth API Functions

**Files:**
- Create: `src/api/auth.ts`
- Create: `src/api/doeSetups.ts`

**Step 1: Write auth API functions**

`src/api/auth.ts`:
```typescript
interface LoginPayload {
  username: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  return response.json();
}

export async function registerUser(payload: RegisterPayload): Promise<UserResponse> {
  const response = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  return response.json();
}

export async function fetchCurrentUser(token: string): Promise<UserResponse> {
  const response = await fetch("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Not authenticated");
  return response.json();
}
```

**Step 2: Write DoE setups API functions**

`src/api/doeSetups.ts`:
```typescript
export interface DoESetupResponse {
  id: string;
  name: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listDoeSetups(token: string): Promise<DoESetupResponse[]> {
  const resp = await fetch("/api/v1/doe-setups", {
    headers: authHeaders(token),
  });
  if (!resp.ok) throw new Error("Failed to fetch setups");
  return resp.json();
}

export async function createDoeSetup(
  token: string,
  name: string,
  config: Record<string, unknown>,
): Promise<DoESetupResponse> {
  const resp = await fetch("/api/v1/doe-setups", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name, config }),
  });
  if (!resp.ok) throw new Error("Failed to save setup");
  return resp.json();
}

export async function deleteDoeSetup(
  token: string,
  setupId: string,
): Promise<void> {
  const resp = await fetch(`/api/v1/doe-setups/${setupId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!resp.ok) throw new Error("Failed to delete setup");
}
```

**Step 3: Commit**

```bash
git add src/api/auth.ts src/api/doeSetups.ts
git commit -m "feat(api): add frontend auth and DoE setup API functions"
```

---

## Task 8b: Shared fetchWithAuth Utility + 401 Interceptor

**Files:**
- Create: `src/api/fetchWithAuth.ts`
- Modify: `src/api/doeSetups.ts` (use fetchWithAuth)

**Step 1: Write the shared fetch utility**

`src/api/fetchWithAuth.ts`:
```typescript
import { store } from "@/store";
import { logout } from "@/store/reducers/authReducer";

/**
 * Authenticated fetch wrapper. Automatically attaches Bearer token and
 * dispatches logout on 401 so all API callers handle auth expiry uniformly.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = store.getState().auth.token;
  const resp = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (resp.status === 401) {
    store.dispatch(logout());
    throw new Error("Session expired. Please log in again.");
  }

  return resp;
}
```

**Step 2: Update doeSetups.ts to use fetchWithAuth**

Replace all `fetch(` calls in `src/api/doeSetups.ts` with `fetchWithAuth(` and remove the manual `authHeaders` helper (token is injected automatically):

```typescript
import { fetchWithAuth } from "./fetchWithAuth";

export async function listDoeSetups(): Promise<DoESetupResponse[]> {
  const resp = await fetchWithAuth("/api/v1/doe-setups");
  if (!resp.ok) throw new Error("Failed to fetch setups");
  return resp.json();
}

export async function createDoeSetup(
  name: string,
  config: Record<string, unknown>,
): Promise<DoESetupResponse> {
  const resp = await fetchWithAuth("/api/v1/doe-setups", {
    method: "POST",
    body: JSON.stringify({ name, config }),
  });
  if (!resp.ok) throw new Error("Failed to save setup");
  return resp.json();
}

export async function deleteDoeSetup(setupId: string): Promise<void> {
  const resp = await fetchWithAuth(`/api/v1/doe-setups/${setupId}`, {
    method: "DELETE",
  });
  if (!resp.ok) throw new Error("Failed to delete setup");
}
```

Note: `src/api/auth.ts` (login/register/me) does NOT use fetchWithAuth — those calls are pre-auth and handle their own errors.

**Step 3: Commit**

```bash
git add src/api/fetchWithAuth.ts src/api/doeSetups.ts
git commit -m "feat(api): add fetchWithAuth interceptor with 401 → logout handling"
```

---

## Task 9: Auth Redux Slice

**Files:**
- Create: `src/store/reducers/authReducer.ts`
- Modify: `src/store.ts` (add auth reducer)

**Step 1: Write the auth reducer**

`src/store/reducers/authReducer.ts`:
```typescript
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchCurrentUser, loginUser, registerUser } from "@/api/auth";
import type { UserResponse } from "@/api/auth";

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  status: "idle",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { username: string; password: string }) => {
    const tokenResp = await loginUser(payload);
    const user = await fetchCurrentUser(tokenResp.access_token);
    return { token: tokenResp.access_token, user };
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload: { username: string; email: string; password: string }) => {
    await registerUser(payload);
    const tokenResp = await loginUser({
      username: payload.username,
      password: payload.password,
    });
    const user = await fetchCurrentUser(tokenResp.access_token);
    return { token: tokenResp.access_token, user };
  },
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.token) throw new Error("No token");
    const user = await fetchCurrentUser(auth.token);
    return { token: auth.token, user };
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("token");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.status = "loading";
      state.error = null;
    };
    const handleFulfilled = (
      state: AuthState,
      action: { payload: { token: string; user: UserResponse } },
    ) => {
      state.status = "idle";
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
    };
    const handleRejected = (
      state: AuthState,
      action: { error: { message?: string } },
    ) => {
      state.status = "failed";
      state.error = action.error.message || "Authentication failed";
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
    };

    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected)
      .addCase(restoreSession.pending, handlePending)
      .addCase(restoreSession.fulfilled, handleFulfilled)
      .addCase(restoreSession.rejected, handleRejected);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

**Step 2: Add auth reducer to the store**

In `src/store.ts`, add:
```typescript
import authReducer from "@/store/reducers/authReducer";
```

Add `auth: authReducer` to the `combineReducers` call.

Export the new actions:
```typescript
export { login, register, restoreSession, logout, clearError } from "@/store/reducers/authReducer";
```

**Step 3: Commit**

```bash
git add src/store/reducers/authReducer.ts src/store.ts
git commit -m "feat(store): add auth Redux slice with login, register, and session restore"
```

---

## Task 10: Login Page

**Files:**
- Create: `src/pages/LoginPage.tsx`

**Step 1: Write the login page**

`src/pages/LoginPage.tsx`:
```tsx
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector, login, clearError } from "@/store";

export function LoginPage({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(login({ username, password }));
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Subutai Playground</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat(ui): add login page component"
```

---

## Task 11: Register Page

**Files:**
- Create: `src/pages/RegisterPage.tsx`

**Step 1: Write the register page**

`src/pages/RegisterPage.tsx`:
```tsx
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector, register, clearError } from "@/store";

export function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(register({ username, email, password }));
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Register for Subutai Playground
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/RegisterPage.tsx
git commit -m "feat(ui): add register page component"
```

---

## Task 12: Sidebar User Menu

**Files:**
- Create: `src/components/SidebarUserMenu.tsx`

**Step 1: Write the sidebar user menu component**

`src/components/SidebarUserMenu.tsx`:
```tsx
import { LogOut } from "lucide-react";

import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector, logout } from "@/store";

export function SidebarUserMenu() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {user.username[0].toUpperCase()}
            </div>
            <span className="truncate text-sm font-medium">{user.username}</span>
          </div>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => dispatch(logout())}
            className="cursor-pointer text-muted-foreground"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/SidebarUserMenu.tsx
git commit -m "feat(ui): add sidebar user menu with logout"
```

---

## Task 13: Wire Up Auth in App.tsx and DashboardSidebar + 401 Handling

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/DashboardSidebar.tsx`

**Step 1: Update App.tsx to handle auth routing**

Replace `src/App.tsx` content:
```tsx
import { useEffect, useState } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import DashboardSidebar from "@/components/DashboardSidebar";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { useAppDispatch, useAppSelector, restoreSession } from "@/store";

function App() {
  const dispatch = useAppDispatch();
  const { user, token, status } = useAppSelector((state) => state.auth);
  const [authView, setAuthView] = useState<"login" | "register">("login");

  // Restore session from stored token on mount
  useEffect(() => {
    if (token && !user) {
      dispatch(restoreSession());
    }
  }, [dispatch, token, user]);

  // Show loading while restoring session
  if (token && !user && status === "loading") {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </ThemeProvider>
    );
  }

  // Show login/register if not authenticated
  if (!user) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {authView === "login" ? (
          <LoginPage onSwitchToRegister={() => setAuthView("register")} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setAuthView("login")} />
        )}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DashboardSidebar />
    </ThemeProvider>
  );
}

export default App;
```

**Step 2: Add SidebarUserMenu to DashboardSidebar**

In `src/components/DashboardSidebar.tsx`:

Add import:
```typescript
import { SidebarUserMenu } from "@/components/SidebarUserMenu";
```

Add `<SidebarUserMenu />` after `</SidebarContent>` and before `</Sidebar>`:
```tsx
<Sidebar>
  <SidebarContent>
    {/* existing navigation groups */}
  </SidebarContent>
  <SidebarUserMenu />
</Sidebar>
```

**Step 3: Add 401 handling**

The `authReducer` already handles 401s via `restoreSession.rejected` — it clears the token and user, which causes `App.tsx` to render the login page. When any API call returns 401 (expired token), the fetch functions in `src/api/auth.ts` throw errors, and the thunk's `rejected` handler logs the user out.

No additional code needed — the existing flow naturally handles 401 → logout → redirect to login.

**Step 4: Commit**

```bash
git add src/App.tsx src/components/DashboardSidebar.tsx
git commit -m "feat(auth): wire up auth flow in App and add user menu to sidebar"
```

---

## Task 14: PostgreSQL Setup and Run Scripts

**Files:**
- Create: `docker-compose.yml` (project root)
- Create: `backend/.env.example`

**Step 1: Create docker-compose for PostgreSQL**

`docker-compose.yml` (project root):
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: subutai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Step 2: Create .env.example**

`backend/.env.example`:
```
SUBUTAI_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/subutai
SUBUTAI_JWT_SECRET=change-me-to-a-random-secret
SUBUTAI_ENV=development
```

**Step 3: Commit**

```bash
git add docker-compose.yml backend/.env.example
git commit -m "chore: add docker-compose for PostgreSQL and backend env example"
```

---

## Task 14b: DoE Save/Load UI (Minimal)

**Files:**
- Create: `src/components/SavedSetupsDialog.tsx`
- Modify: `src/components/SidebarUserMenu.tsx` (add "Saved Setups" button)
- Create: `src/store/reducers/savedSetupsReducer.ts`
- Modify: `src/store.ts` (add savedSetups reducer)

This completes the core goal: users can save and load their DoE configurations.

**Step 1: Create savedSetups Redux slice**

`src/store/reducers/savedSetupsReducer.ts`:
```typescript
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createDoeSetup,
  deleteDoeSetup,
  listDoeSetups,
  type DoESetupResponse,
} from "@/api/doeSetups";

interface SavedSetupsState {
  setups: DoESetupResponse[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: SavedSetupsState = {
  setups: [],
  status: "idle",
  error: null,
};

export const fetchSavedSetups = createAsyncThunk(
  "savedSetups/fetch",
  async () => listDoeSetups(),
);

export const saveCurrentSetup = createAsyncThunk(
  "savedSetups/save",
  async ({ name, config }: { name: string; config: Record<string, unknown> }) =>
    createDoeSetup(name, config),
);

export const removeSetup = createAsyncThunk(
  "savedSetups/remove",
  async (setupId: string) => {
    await deleteDoeSetup(setupId);
    return setupId;
  },
);

const savedSetupsSlice = createSlice({
  name: "savedSetups",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedSetups.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSavedSetups.fulfilled, (state, action) => {
        state.status = "idle";
        state.setups = action.payload;
      })
      .addCase(fetchSavedSetups.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load setups";
      })
      .addCase(saveCurrentSetup.fulfilled, (state, action) => {
        state.setups.unshift(action.payload);
      })
      .addCase(removeSetup.fulfilled, (state, action) => {
        state.setups = state.setups.filter((s) => s.id !== action.payload);
      });
  },
});

export default savedSetupsSlice.reducer;
```

**Step 2: Add to store.ts**

```typescript
import savedSetupsReducer from "@/store/reducers/savedSetupsReducer";
// add to combineReducers:
savedSetups: savedSetupsReducer,
// export thunks:
export { fetchSavedSetups, saveCurrentSetup, removeSetup } from "@/store/reducers/savedSetupsReducer";
```

**Step 3: Create SavedSetupsDialog**

`src/components/SavedSetupsDialog.tsx`:
```tsx
import { useState } from "react";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useAppDispatch,
  useAppSelector,
  fetchSavedSetups,
  saveCurrentSetup,
  removeSetup,
  setDoEs,
} from "@/store";
import type { DoERegistryState } from "@/store/doeRegistry";

export function SavedSetupsDialog() {
  const dispatch = useAppDispatch();
  const { setups, status } = useAppSelector((state) => state.savedSetups);
  const doeRegistry = useAppSelector((state) => state.doeRegistry);
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) dispatch(fetchSavedSetups());
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    dispatch(saveCurrentSetup({ name: saveName.trim(), config: doeRegistry as unknown as Record<string, unknown> }));
    setSaveName("");
  };

  const handleLoad = (config: Record<string, unknown>) => {
    dispatch(setDoEs((config as unknown as DoERegistryState).allIds.map(
      (id) => (config as unknown as DoERegistryState).byId[id]
    )));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          Saved Setups
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saved DoE Setups</DialogTitle>
        </DialogHeader>

        {/* Save current */}
        <div className="flex gap-2">
          <Input
            placeholder="Setup name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button onClick={handleSave} disabled={!saveName.trim()}>
            Save
          </Button>
        </div>

        {/* List */}
        {status === "loading" && <p className="text-sm text-muted-foreground">Loading...</p>}
        {setups.length === 0 && status !== "loading" && (
          <p className="text-sm text-muted-foreground">No saved setups yet.</p>
        )}
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {setups.map((setup) => (
            <li key={setup.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted">
              <button
                className="flex-1 text-left text-sm"
                onClick={() => handleLoad(setup.config)}
              >
                {setup.name}
              </button>
              <button
                onClick={() => dispatch(removeSetup(setup.id))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${setup.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: Add to SidebarUserMenu**

In `src/components/SidebarUserMenu.tsx`, import and add `<SavedSetupsDialog />` between the username display and the logout button.

**Step 5: Commit**

```bash
git add src/store/reducers/savedSetupsReducer.ts src/store.ts src/components/SavedSetupsDialog.tsx src/components/SidebarUserMenu.tsx
git commit -m "feat(ui): add DoE save/load UI with savedSetups Redux slice and dialog"
```

---

## Task 15: End-to-End Smoke Test

**Step 1: Start the stack**

```bash
# Terminal 1: Start PostgreSQL
docker compose up -d

# Terminal 2: Start backend
cd backend && uv run uvicorn app.main:app --reload

# Terminal 3: Start frontend
npm run dev
```

**Step 2: Manual verification checklist**

1. Open `http://localhost:5173` — should see login page (no sidebar)
2. Click "Register" — create an account (username, email, password)
3. After registration, should auto-login and redirect to dashboard
4. Sidebar footer shows username avatar + "Saved Setups" button + logout button
5. Add a DoE entry in QOR Compare page
6. Click "Saved Setups" → enter a name → click "Save" — setup appears in the list
7. Clear all DoEs, then load the saved setup — DoEs restore
8. Delete the saved setup from the dialog
9. Click logout — returns to login page
10. Login with the same credentials — dashboard loads
11. Refresh page — session should restore (token persisted in localStorage)
12. Open second browser/incognito — register different user — verify "Saved Setups" shows 0 entries (isolation)

**Step 3: Run all backend tests**

```bash
cd backend && uv run pytest -v
```

Expected: ALL PASS (auth + CRUD + cross-user isolation)

**Step 4: Run frontend build to check for type errors**

```bash
npm run build
```

Expected: Clean build

**Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "test: verify full auth flow end-to-end"
```
