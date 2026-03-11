# Subutai Playground

Frontend data analysis dashboard built with React and TypeScript. The primary workflow is frontend-only mode with MSW-powered mocks for local development.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Redux Toolkit |
| Tables | ag-grid, TanStack Table |
| Charts | Recharts |
| Testing | Vitest, Playwright, MSW |

## Quick Start

### Prerequisites

- Node.js 18+

### Setup

```bash
# Clone
git clone git@github.com:kyuns-96/shadcn_project.git
cd shadcn_project

# Frontend
npm install
```

### Run

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |

### Frontend-Only Mode (Default)

Frontend-only mode is the default and primary development workflow.

Set `VITE_MSW_ENABLED=true` in a root `.env` file to use MSW mock handlers instead of an external backend service.

## Environment Variables

### Frontend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_MSW_ENABLED` | No | `false` | Enable MSW mock API layer |

## Backend Service

The backend has been extracted to a separate repository:

- https://github.com/kyuns-96/subutai-backend

Use that repository if you need the API service or server-side setup.

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
├── e2e/                        # Playwright E2E tests
└── public/                     # Static assets and screenshots
```

## Testing

```bash
npm run test              # Vitest unit tests
npm run test:watch        # Vitest watch mode
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright E2E with UI
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
