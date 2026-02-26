# Login + Database Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add user authentication (login/register) with a FastAPI + PostgreSQL backend so users can save and load DoE configurations.

**Architecture:** React SPA communicates with a FastAPI backend via REST API using JWT tokens stored in httpOnly cookies. PostgreSQL stores users and their saved DoE setups as JSONB. The sidebar footer shows the logged-in user with logout capability.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, bcrypt, python-jose (JWT), Pydantic v2, Alembic, React 19, Redux Toolkit, shadcn/ui

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
mkdir -p backend/app/routers
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
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
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
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
from app.routers import auth, doe_setups


@asynccontextmanager
async def lifespan(app: FastAPI):
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
touch backend/app/__init__.py backend/app/routers/__init__.py
```

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat(backend): scaffold FastAPI project with config and database"
```

---

## Task 2: Database Models

**Files:**
- Create: `backend/app/models.py`

**Step 1: Write the models**

`backend/app/models.py`:
```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
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

**Step 2: Commit**

```bash
git add backend/app/models.py
git commit -m "feat(backend): add User and DoESetup SQLAlchemy models"
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

**Step 2: Add email-validator dependency**

Add `"email-validator>=2.0.0"` to the dependencies list in `backend/pyproject.toml`.

**Step 3: Commit**

```bash
git add backend/app/schemas.py backend/pyproject.toml
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

## Task 5: Auth Router (Register, Login, Refresh, Me)

**Files:**
- Create: `backend/app/routers/auth.py`
- Test: `backend/tests/test_auth.py`

**Step 1: Write the failing test**

Create `backend/tests/__init__.py` and `backend/tests/test_auth.py`:

```python
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


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
```

**Step 2: Run test to verify it fails**

```bash
cd backend && uv run pytest tests/test_auth.py -v
```

Expected: FAIL (router not implemented)

**Step 3: Write the auth router**

`backend/app/routers/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    create_refresh_token,
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
    # Check existing username or email
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

    return TokenResponse(
        access_token=create_access_token(user.id),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Step 4: Run test to verify it passes**

```bash
cd backend && uv run pytest tests/test_auth.py -v
```

Note: Tests need a test database. For testing, override the database to use SQLite in-memory. Create `backend/tests/conftest.py`:

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db
```

Add `aiosqlite>=0.20.0` to dev dependencies in `pyproject.toml`.

Expected: PASS

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): add auth router with register, login, and me endpoints"
```

---

## Task 6: DoE Setups Router (CRUD)

**Files:**
- Create: `backend/app/routers/doe_setups.py`
- Test: `backend/tests/test_doe_setups.py`

**Step 1: Write the failing test**

`backend/tests/test_doe_setups.py`:
```python
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"username": "doeuser", "email": "doe@test.com", "password": "secret123"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "doeuser", "password": "secret123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


SAMPLE_CONFIG = {
    "byId": {
        "doe-1": {"id": "doe-1", "label": "DoE-001", "PROJECT_NAME": "proj1"}
    },
    "allIds": ["doe-1"],
}


@pytest.mark.asyncio
async def test_crud_doe_setup(client: AsyncClient, auth_headers: dict):
    # Create
    resp = await client.post(
        "/api/v1/doe-setups",
        json={"name": "My Setup", "config": SAMPLE_CONFIG},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    setup = resp.json()
    setup_id = setup["id"]
    assert setup["name"] == "My Setup"

    # List
    resp = await client.get("/api/v1/doe-setups", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Update
    resp = await client.put(
        f"/api/v1/doe-setups/{setup_id}",
        json={"name": "Renamed"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed"

    # Delete
    resp = await client.delete(
        f"/api/v1/doe-setups/{setup_id}", headers=auth_headers
    )
    assert resp.status_code == 204

    # Verify deleted
    resp = await client.get("/api/v1/doe-setups", headers=auth_headers)
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_doe_setup_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/doe-setups")
    assert resp.status_code == 401
```

**Step 2: Run test to verify it fails**

```bash
cd backend && uv run pytest tests/test_doe_setups.py -v
```

**Step 3: Write the DoE setups router**

`backend/app/routers/doe_setups.py`:
```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
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

**Step 4: Run tests**

```bash
cd backend && uv run pytest tests/ -v
```

Expected: ALL PASS

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): add DoE setups CRUD router with tests"
```

---

## Task 7: Vite Proxy Configuration

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add proxy to dev server**

Add a `server.proxy` section so the frontend can call `/api/v1/*` endpoints during development:

```typescript
// In vite.config.ts, add to defineConfig:
server: {
  proxy: {
    "/api/v1": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
},
```

**Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "feat(config): add Vite proxy for FastAPI backend"
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

And add `auth: authReducer` to the `combineReducers` call.

Also export the new actions:
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
import { LogOut, User } from "lucide-react";

import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
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

## Task 13: Wire Up Auth in App.tsx and DashboardSidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/DashboardSidebar.tsx`
- Modify: `src/pages/index.ts` (if barrel export exists, add new pages)

**Step 1: Update App.tsx to handle auth routing**

`src/App.tsx` — Replace existing content:
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

In `src/components/DashboardSidebar.tsx`, import and add the user menu:

```typescript
import { SidebarUserMenu } from "@/components/SidebarUserMenu";
```

Add `<SidebarUserMenu />` right before the closing `</Sidebar>` tag (after `</SidebarContent>`):

```tsx
<Sidebar>
  <SidebarContent>
    {/* existing navigation */}
  </SidebarContent>
  <SidebarUserMenu />
</Sidebar>
```

**Step 3: Commit**

```bash
git add src/App.tsx src/components/DashboardSidebar.tsx
git commit -m "feat(auth): wire up auth flow in App and add user menu to sidebar"
```

---

## Task 14: PostgreSQL Setup and Run Scripts

**Files:**
- Create: `backend/.env.example`
- Create: `docker-compose.yml` (project root, for PostgreSQL)

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
```

**Step 3: Commit**

```bash
git add docker-compose.yml backend/.env.example
git commit -m "chore: add docker-compose for PostgreSQL and backend env example"
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

**Step 2: Manual verification**

1. Open `http://localhost:5173` — should see login page
2. Click "Register" — create an account
3. Login — should redirect to dashboard with sidebar
4. Sidebar footer shows username and logout button
5. Click logout — returns to login page
6. Refresh page — session should restore if token is valid

**Step 3: Run backend tests**

```bash
cd backend && uv run pytest -v
```

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "test: verify full auth flow end-to-end"
```
