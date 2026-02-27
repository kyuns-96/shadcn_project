# Subutai Playground

**Subutai Playground** is a full-stack React + FastAPI dashboard for advanced data analysis, featuring authentication, complex data tables, interactive charting, and per-user saved setups.

## Table of Contents
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Features
- **Authentication**: JWT-based login/register with session restore and protected routes.
- **Per-User Saved Setups**: Save, load, and manage DoE configurations via the backend API.
- **Data Matrix Tables**: Advanced data grid implementations using `ag-grid-react` optimized for Timing and Power analysis.
- **Interactive Graphs**: Dynamic charting with `Recharts`, featuring floating windows, customizable axis configurations, and PNG export.
- **FC Check Tool**: A specialized validation and checking utility for data consistency.
- **QOR Compare**: Quality of Results comparison tool for benchmarking different data sets.
- **State Management**: Predictable state handling with **Redux Toolkit**, featuring normalized data slices and async thunks.
- **Mocked API Layer**: Full API simulation using **MSW (Mock Service Worker)** for seamless offline development and reliable testing.
- **Modern UI/UX**: Accessible and themed components built with **shadcn/ui**, **Tailwind CSS 4**, and **Lucide React**.
- **Drag & Drop**: Interactive and flexible dashboard layouts powered by **dnd-kit**.
- **Theming**: First-class support for Dark and Light modes with persistent user preference.

## Screenshots

### Main Dashboard
The landing page provides quick access to all major tools and features.

![Dashboard](./public/screenshots/dashboard.png)

*With example data loaded:*

![Dashboard with Data](./public/screenshots/dashboard-with-data.png)

### Timing Analysis
Advanced timing analysis with ag-grid data tables, featuring multi-level column headers and customizable decimal precision.

![Timing Data Table](./public/screenshots/timing-data-table.png)

*With populated data showing real timing metrics:*

![Timing with Data](./public/screenshots/timing-with-data.png)

### Power Analysis
Comprehensive power analysis tool with detailed metrics and data visualization.

![Power Analysis](./public/screenshots/power-analysis.png)

*With example power data displayed:*

![Power with Data](./public/screenshots/power-with-data.png)

### FC Check Tool
Specialized validation and checking utility for data consistency verification.

![FC Check Tool](./public/screenshots/fc-check-tool.png)

*With validation data loaded:*

![FC Check with Data](./public/screenshots/fc-check-with-data.png)

### QOR Compare
Quality of Results comparison tool for benchmarking different data sets and configurations.

![QOR Compare](./public/screenshots/qor-compare.png)

*With comparison data displayed:*

![QOR Compare with Data](./public/screenshots/qor-compare-with-data.png)

## Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Tables**: [ag-grid](https://www.ag-grid.com/), [TanStack Table](https://tanstack.com/table)
- **Charts**: [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **API Mocking**: [MSW](https://mswjs.io/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (async)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Auth**: JWT via `python-jose`, password hashing with `passlib[bcrypt]`
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Testing**: [pytest](https://pytest.org/) + `pytest-asyncio`, `httpx`

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: 3.11 or higher (with [uv](https://docs.astral.sh/uv/) recommended)
- **PostgreSQL**: 16+ (or use Docker)

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:kyuns-96/shadcn_project.git
   cd shadcn_project
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Set up the backend:**
   ```bash
   cd backend
   cp .env.example .env        # Edit .env and set a real SUBUTAI_JWT_SECRET
   uv sync                     # Install Python dependencies
   cd ..
   ```

4. **Start PostgreSQL** (if not already running):
   ```bash
   docker compose up -d
   ```

5. **Run database migrations:**
   ```bash
   cd backend
   alembic upgrade head
   cd ..
   ```

### Running Locally

**Start both frontend and backend:**

```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 — Frontend
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173) (proxies `/api/v1` to the backend)
- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Environment Variables

**Frontend** (`.env` in project root):
```env
VITE_MSW_ENABLED=true  # Enable API mocking (no backend needed)
```

**Backend** (`backend/.env`):
```env
SUBUTAI_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/subutai
SUBUTAI_JWT_SECRET=your-secret-here  # Required — no default
SUBUTAI_ENV=development
SUBUTAI_CORS_ORIGINS=["http://localhost:5173"]
```

## Project Architecture

### Backend (FastAPI)
- **`backend/app/`**: Application code — config, models, schemas, auth, routers.
- **`backend/app/routers/auth.py`**: Register, login, and session endpoints.
- **`backend/app/routers/doe_setups.py`**: CRUD for per-user saved DoE setups.
- **`backend/app/auth.py`**: JWT token creation/validation, password hashing, `get_current_user` dependency.
- **`backend/alembic/`**: Database migrations.
- **`backend/tests/`**: pytest async tests for auth and DoE setups (including cross-user isolation).

### Frontend State Management (Redux)
The application uses a centralized Redux store located in `src/store.ts`. It follows a feature-based slice pattern:
- **Auth Slice**: Manages login, register, session restore, and logout.
- **Saved Setups Slice**: Syncs per-user DoE setups with the backend API.
- **Matrix Slices**: Manages state for complex `ag-grid` tables (Timing, Power).
- **Graph Slice**: Handles dynamic chart configurations, axis settings, and data domains.
- **Registry Slices**: Maintains normalized lists for projects, blocks, revisions, and netvers.
- **Page Slice**: Controls the application's navigation state and URL synchronization.

### Component Philosophy
- **`src/components/ui/`**: Base atomic components from `shadcn/ui`. These are the building blocks.
- **`src/components/shadcn-studio/`**: Composed, project-specific components that follow `shadcn` patterns.
- **`src/components/graph/`**: A self-contained visualization suite including charts, control panels, and utilities.
- **`src/pages/`**: Orchestrator components that represent top-level views and manage data flow between the store and UI.

### Data Fetching & Mocking
- **API Layer**: `src/api/` contains clean fetch functions for data retrieval. `src/api/auth.ts` handles login/register/session calls with a `fetchWithAuth` interceptor for automatic 401 handling.
- **MSW**: `src/mocks/` provides a complete mock backend. This allows developers to build and test features without a live backend, ensuring 100% uptime for the development environment.

## Development Workflow

### Adding a New Page
1.  Create your page component in `src/pages/`.
2.  Define a new identifier in the `PageType` union in `src/store/reducers/pageReducer.ts`.
3.  Add the new entry to `NAVIGATION_PAGES` in `src/components/DashboardSidebar.tsx`.
4.  Implement the UI and link any necessary Redux actions.

### Adding UI Components
1.  Add base shadcn components: `npx shadcn-ui@latest add [component-name]`.
2.  For custom complex components, use `src/components/shadcn-studio/`.

### Writing Tests
- **Unit Tests**: Place `.test.tsx` files next to the component they test. Focus on edge cases and user interactions.
- **E2E Tests**: Use Playwright to test critical user journeys (e.g., navigating between tools, complex table interactions).

## Testing Strategy

### Frontend
- **Unit Testing**: Powered by [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
- **E2E Testing**: Powered by [Playwright](https://playwright.dev/).
- **Mocking**: [MSW](https://mswjs.io/) intercepts requests at the network level, providing identical data to both the app and the tests.

```bash
npm run test          # Run Vitest unit tests
npm run test:watch    # Run Vitest in watch mode
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run Playwright E2E tests with UI mode
```

### Backend
```bash
cd backend
pytest                # Run all backend tests
pytest -v             # Verbose output
pytest -n auto        # Parallel with pytest-xdist (if installed)
```

## Configuration
- **Tailwind CSS 4**: Configuration is handled via CSS-based configuration in `src/index.css` and the `@tailwindcss/vite` plugin.
- **MSW**: Handlers are defined in `src/mocks/handlers.ts`. To add new API mocks, update this file and provide fixture data in `src/mocks/data/fixtures.ts`.
- **Vite**: Configured in `vite.config.ts` with support for path aliases (`@/`).

## Troubleshooting
- **MSW not working**: Ensure `VITE_MSW_ENABLED=true` is set in your environment or check the `enableMocking` logic in `src/main.tsx`.
- **ag-grid Styles**: If the grid looks unstyled, verify that `ag-theme-quartz.min.css` is imported in `src/main.tsx`.
- **TypeScript Errors**: Run `npm run build` to check for project-wide type issues.
- **Sidebar not appearing**: Check if `SidebarProvider` is correctly wrapping the layout in `src/App.tsx`.
- **Backend won't start**: Ensure `SUBUTAI_JWT_SECRET` is set in `backend/.env`. The app requires this variable with no default.
- **Database connection refused**: Run `docker compose up -d` to start PostgreSQL, then `cd backend && alembic upgrade head`.

## Project Structure
```
shadcn_project/
  src/                        # Frontend source
    api/                      # Fetch functions (auth, data, setups)
    components/               # UI component library
      ui/                     # Base shadcn UI primitives
      shadcn-studio/          # Composed project components
      graph/                  # Charting and visualization suite
    hooks/                    # Shared custom React hooks
    lib/                      # Utilities and helper functions
    mocks/                    # MSW mock definitions and data fixtures
    pages/                    # Top-level page components (Login, Register, etc.)
    store/                    # Redux slices and store configuration
      reducers/               # authReducer, savedSetupsReducer, etc.
    test/                     # Global test utilities and setup
  backend/                    # FastAPI backend
    app/
      config.py               # Pydantic settings (env-based)
      models.py               # SQLAlchemy ORM models
      schemas.py              # Pydantic request/response schemas
      auth.py                 # JWT + password utilities
      database.py             # Async engine and session
      routers/
        auth.py               # /register, /login, /me
        doe_setups.py         # CRUD for saved setups
    alembic/                  # Database migrations
    tests/                    # pytest async tests
  e2e/                        # Playwright E2E tests
  docker-compose.yml          # PostgreSQL dev database
  package.json                # Frontend scripts and dependencies
```

## Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
Built with ❤️ for the data community.
