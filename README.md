# Subutai Playground 🚀

**Subutai Playground** is a comprehensive React + TypeScript dashboard designed for advanced data analysis. It features complex data tables, interactive charting, and a robust testing suite, providing a scalable foundation for data-intensive applications.

## 📋 Table of Contents
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Architecture](#-project-architecture)
- [Development Workflow](#-development-workflow)
- [Testing Strategy](#-testing-strategy)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

## ✨ Features
- **Data Matrix Tables**: Advanced data grid implementations using `ag-grid-react` optimized for Timing and Power analysis.
- **Interactive Graphs**: Dynamic charting with `Recharts`, featuring floating windows, customizable axis configurations, and PNG export.
- **FC Check Tool**: A specialized validation and checking utility for data consistency.
- **QOR Compare**: Quality of Results comparison tool for benchmarking different data sets.
- **State Management**: Predictable state handling with **Redux Toolkit**, featuring normalized data slices and async thunks.
- **Mocked API Layer**: Full API simulation using **MSW (Mock Service Worker)** for seamless offline development and reliable testing.
- **Modern UI/UX**: Accessible and themed components built with **shadcn/ui**, **Tailwind CSS 4**, and **Lucide React**.
- **Drag & Drop**: Interactive and flexible dashboard layouts powered by **dnd-kit**.
- **Theming**: First-class support for Dark and Light modes with persistent user preference.

## 📸 Screenshots

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

### QOR Compare
Quality of Results comparison tool for benchmarking different data sets and configurations.

![QOR Compare](./public/screenshots/qor-compare.png)

## 🛠 Tech Stack
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Tables**: [ag-grid](https://www.ag-grid.com/), [TanStack Table](https://tanstack.com/table)
- **Charts**: [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **API Mocking**: [MSW](https://mswjs.io/)

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd shadcn_project
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running Locally
- **Start the development server:**
  ```bash
  npm run dev
  ```
- **Open your browser:** Navigate to [http://localhost:5173](http://localhost:5173).

### Environment Variables
The project uses `Vite`'s environment variable system. Create a `.env` file in the root directory if you need to override defaults:
```env
VITE_MSW_ENABLED=true # Set to 'true' to enable API mocking in development
```

## 🏗 Project Architecture

### State Management (Redux)
The application uses a centralized Redux store located in `src/store.ts`. It follows a feature-based slice pattern for high maintainability:
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
- **API Layer**: `src/api/` contains clean fetch functions for data retrieval.
- **MSW**: `src/mocks/` provides a complete mock backend. This allows developers to build and test features without a live backend, ensuring 100% uptime for the development environment.

## 🔄 Development Workflow

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

## 🧪 Testing Strategy
- **Unit Testing**: Powered by [Vitest](https://vitest.dev/) and [React Testing Library].
- **E2E Testing**: Powered by [Playwright](https://playwright.dev/).
- **Mocking**: [MSW](https://mswjs.io/) intercepts requests at the network level, providing identical data to both the app and the tests.

```bash
npm run test          # Run Vitest unit tests
npm run test:watch    # Run Vitest in watch mode
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run Playwright E2E tests with UI mode
```

## ⚙️ Configuration
- **Tailwind CSS 4**: Configuration is handled via CSS-based configuration in `src/index.css` and the `@tailwindcss/vite` plugin.
- **MSW**: Handlers are defined in `src/mocks/handlers.ts`. To add new API mocks, update this file and provide fixture data in `src/mocks/data/fixtures.ts`.
- **Vite**: Configured in `vite.config.ts` with support for path aliases (`@/`).

## ❓ Troubleshooting
- **MSW not working**: Ensure `VITE_MSW_ENABLED=true` is set in your environment or check the `enableMocking` logic in `src/main.tsx`.
- **ag-grid Styles**: If the grid looks unstyled, verify that `ag-theme-quartz.min.css` is imported in `src/main.tsx`.
- **Typescript Errors**: Run `npm run build` to check for project-wide type issues.
- **Sidebar not appearing**: Check if `SidebarProvider` is correctly wrapping the layout in `src/App.tsx`.

## 📂 Project Structure
- `src/` — Application source code
  - `api/` — API layer with fetch functions
  - `components/` — UI component library
    - `shadcn-studio/` — Specialized project components
    - `ui/` — Base shadcn UI primitives
    - `graph/` — Charting and visualization suite
  - `hooks/` — Shared custom React hooks
  - `lib/` — Shared utilities and helper functions
  - `mocks/` — MSW mock definitions and data fixtures
  - `pages/` — Top-level page components
  - `store/` — Redux slices and store configuration
  - `test/` — Global test utilities and setup
- `public/` — Static assets
- `package.json` — Scripts and dependency management

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
Built with ❤️ for the data community.
