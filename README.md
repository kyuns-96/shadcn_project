# Subutai Playground

Full-stack data analysis dashboard built with React, TypeScript, and FastAPI. Provides timing/power analysis tables, interactive charting, DoE configuration management, and JWT authentication with per-user data isolation.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Redux Toolkit |
| Backend | FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Alembic, Pydantic v2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Tables | ag-grid, TanStack Table |
| Charts | Recharts |
| Testing | Vitest, Playwright, pytest, MSW |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+ with [uv](https://docs.astral.sh/uv/)
- PostgreSQL 16+ (or Docker)

### Setup

```bash
# Clone
git clone git@github.com:kyuns-96/shadcn_project.git
cd shadcn_project

# Frontend
npm install

# Backend
cd backend
cp .env.example .env   # Set SUBUTAI_JWT_SECRET to a real secret
uv sync
cd ..

# Database
docker compose up -d
cd backend && alembic upgrade head && cd ..
```

### Run

```bash
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 - Frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Docs | http://localhost:8000/docs |

The Vite dev server proxies `/api/v1` requests to the backend automatically.

### Frontend-Only Mode (No Backend)

Set `VITE_MSW_ENABLED=true` in a root `.env` file to use MSW mock handlers instead of a real backend.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUBUTAI_JWT_SECRET` | Yes | - | JWT signing secret |
| `SUBUTAI_DATABASE_URL` | No | `postgresql+asyncpg://postgres:postgres@localhost:5432/subutai` | Database connection |
| `SUBUTAI_CORS_ORIGINS` | No | `["http://localhost:5173"]` | Allowed CORS origins |
| `SUBUTAI_ENV` | No | `development` | Environment (`development` auto-creates tables) |
| `SUBUTAI_ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | JWT token lifetime |

### Frontend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_MSW_ENABLED` | No | `false` | Enable MSW mock API layer |

## Project Structure

```
shadcn_project/
├── src/
│   ├── api/                    # API clients (auth, data, setups)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── shadcn-studio/      # Composed project components
│   │   └── graph/              # Chart and visualization suite
│   ├── hooks/                  # Shared React hooks
│   ├── lib/                    # Utilities
│   ├── mocks/                  # MSW handlers and fixtures
│   ├── pages/                  # LoginPage, RegisterPage, etc.
│   └── store/
│       └── reducers/           # auth, savedSetups, page, matrix, graph
├── backend/
│   ├── app/
│   │   ├── config.py           # Pydantic settings
│   │   ├── models.py           # SQLAlchemy models (User, DoESetup)
│   │   ├── schemas.py          # Request/response schemas
│   │   ├── auth.py             # JWT, password hashing, get_current_user
│   │   ├── database.py         # Async engine and session factory
│   │   └── routers/
│   │       ├── auth.py         # POST /register, POST /login, GET /me
│   │       └── doe_setups.py   # CRUD /doe-setups (per-user)
│   ├── alembic/                # Database migrations
│   └── tests/                  # pytest async tests
├── e2e/                        # Playwright E2E tests
└── docker-compose.yml          # PostgreSQL for development
```

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create account |
| POST | `/login` | Get JWT access token |
| GET | `/me` | Get current user (requires auth) |

### DoE Setups (`/api/v1/doe-setups`)

All endpoints require authentication. Data is scoped to the authenticated user.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List saved setups |
| POST | `/` | Create setup |
| PUT | `/:id` | Update setup |
| DELETE | `/:id` | Delete setup |

## Testing

```bash
# Frontend
npm run test              # Vitest unit tests
npm run test:watch        # Vitest watch mode
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright E2E with UI

# Backend
cd backend
pytest                    # All tests
pytest -v                 # Verbose
```

## Screenshots

### Dashboard
![Dashboard](./public/screenshots/dashboard.png)
![Dashboard with Data](./public/screenshots/dashboard-with-data.png)

### Timing Analysis
![Timing Data Table](./public/screenshots/timing-data-table.png)
![Timing with Data](./public/screenshots/timing-with-data.png)

### Power Analysis
![Power Analysis](./public/screenshots/power-analysis.png)
![Power with Data](./public/screenshots/power-with-data.png)

### FC Check
![FC Check Tool](./public/screenshots/fc-check-tool.png)
![FC Check with Data](./public/screenshots/fc-check-tool-with-data.png)

### QOR Compare
![QOR Compare](./public/screenshots/qor-compare.png)
![QOR Compare with Data](./public/screenshots/qor-compare-with-data.png)

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, etc.)
4. Push and open a Pull Request
