# Login + Database Design for DoE Setup Saving

**Date**: 2026-02-26
**Status**: Approved

## Summary

Add user authentication (login/register) with a FastAPI + PostgreSQL backend. Users can save and load DoE configurations. User info is displayed in the sidebar footer.

## Architecture

```
┌─────────────┐     HTTP/JSON     ┌──────────────┐     SQLAlchemy    ┌────────────┐
│  React SPA   │ ◄──────────────► │  FastAPI      │ ◄──────────────► │ PostgreSQL │
│  (Vite)      │   JWT tokens     │  Backend      │                  │            │
│  port 5173   │                  │  port 8000    │                  │ port 5432  │
└─────────────┘                   └──────────────┘                   └────────────┘
```

- **Auth**: Simple username/password with bcrypt hashing
- **Tokens**: JWT (access token short-lived, refresh token for session persistence)
- **Storage**: httpOnly cookies for tokens

## Database Schema

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,  -- bcrypt hashed
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE doe_setups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    config      JSONB NOT NULL,  -- serialized DoE registry state
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

## Backend Structure

```
backend/
  app/
    __init__.py
    main.py              # FastAPI app, CORS, lifespan
    config.py            # Settings (DB URL, JWT secret)
    models.py            # SQLAlchemy models
    schemas.py           # Pydantic request/response models
    auth.py              # JWT, password hashing, auth dependencies
    database.py          # Async engine, session factory
    routers/
      auth.py            # POST /register, POST /login, POST /refresh, GET /me
      doe_setups.py      # CRUD: GET/POST/PUT/DELETE /doe-setups
  alembic/               # DB migrations
  pyproject.toml
  alembic.ini
```

### API Endpoints

**Auth**:
- `POST /api/v1/auth/register` — create account (username, email, password)
- `POST /api/v1/auth/login` — authenticate, returns JWT tokens
- `POST /api/v1/auth/refresh` — refresh access token
- `GET /api/v1/auth/me` — get current user info

**DoE Setups**:
- `GET /api/v1/doe-setups` — list user's saved setups
- `POST /api/v1/doe-setups` — save current DoE config
- `PUT /api/v1/doe-setups/{id}` — update a saved setup
- `DELETE /api/v1/doe-setups/{id}` — delete a saved setup

## Frontend Changes

### New Files

- `src/pages/LoginPage.tsx` — login form
- `src/pages/RegisterPage.tsx` — registration form
- `src/store/reducers/authReducer.ts` — auth state (user, token, status)
- `src/api/auth.ts` — login, register, refresh, getMe API calls
- `src/api/doeSetups.ts` — CRUD for saved DoE setups
- `src/components/SidebarUserMenu.tsx` — user widget in sidebar footer

### Sidebar User Widget

Located in `SidebarFooter` at the bottom of the sidebar:

```
┌──────────────────────┐
│ 🔵 FC Check Tool     │
│    QOR Compare       │
│    Timing            │
│    Power             │
│                      │
│ ─────────────────── │
│ 👤 username          │  ← SidebarFooter
│    Saved Setups | Logout
└──────────────────────┘
```

### Auth Flow

1. Unauthenticated users see the login page (no sidebar)
2. After login, JWT tokens stored in httpOnly cookies
3. `authReducer` holds user info fetched via `GET /me`
4. `DashboardSidebar` wraps content with auth check — redirects to login if not authenticated
5. Sidebar footer shows username + logout button

### DoE Setup Save/Load

- "Save Setup" button in DoE area serializes current `doeRegistry` state
- User names the setup and POSTs to backend
- "Load Setup" opens a list of saved setups, selecting one restores the DoE registry

## Decisions

- **JSONB for config**: Flexible, no schema migration needed when DoE shape changes
- **JWT in httpOnly cookies**: More secure than localStorage (no XSS access)
- **FastAPI over Express**: Better auto-docs, Pydantic validation, async native
- **PostgreSQL**: Standard for shared server, supports JSONB natively
- **Start with DoE only**: Graph template saving deferred to future iteration
