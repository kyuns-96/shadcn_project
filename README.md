# shadcn_project 🚀

**Minimal React + TypeScript + Vite starter** using shadcn UI components, Tailwind CSS, Radix primitives, ag-grid, and dnd-kit. This project is a well-structured React application with comprehensive testing, multiple data visualization libraries, and state management.

## Features ✨
- **React 19 + TypeScript** - Latest React features with type safety
- **Vite** - Superfast dev server with HMR and optimized builds
- **Tailwind CSS 4** - Modern utility-first styling
- **shadcn/ui** - High-quality, accessible components built on Radix UI primitives
- **Data Visualization** - ag-grid for complex tables, TanStack Table for headless tables, and Recharts for interactive charts
- **State Management** - Redux Toolkit for predictable state transitions
- **Drag & Drop** - Flexible dnd-kit suite for interactive layouts
- **Robust Testing** - Unit testing with Vitest and E2E testing with Playwright
- **API Mocking** - Mock Service Worker (MSW) for reliable development and testing

## Quickstart ⚡
**Prerequisites:** Node.js 18+ and npm

Install and run:

```bash
npm install
npm run dev        # start dev server
npm run build      # build production assets
npm run preview    # preview production build
npm run lint       # run eslint
```

## Scripts (from `package.json`) 🧭
- `dev` — Start Vite dev server
- `build` — Build production assets
- `lint` — Run ESLint for code quality
- `preview` — Preview production build locally
- `test` — Run unit tests once using Vitest
- `test:watch` — Run unit tests in watch mode
- `test:e2e` — Run end-to-end tests using Playwright
- `test:e2e:ui` — Run Playwright E2E tests with UI mode

## Project structure 🔧
- `src/` — application source
  - `api/` — API layer with fetch functions
  - `components/` — UI components
    - `shadcn-studio/` — Specialized shadcn-style components
    - `ui/` — Base shadcn UI components (Radix primitives)
    - `graph/` — Charting and visualization components
  - `hooks/` — Custom React hooks
  - `lib/` — Shared utilities
  - `mocks/` — MSW mocks for API simulation
  - `pages/` — Page-level components
  - `store/` — Redux store and slice definitions
  - `test/` — Test utilities and setup (Vitest/Playwright)
  - `variables/` — Variable configurations, templates, and helpers
  - `assets/`, `main.tsx`, `App.tsx`
- `public/` — static files
- `package.json` — scripts & dependencies
- `vite.config.ts`, `tsconfig.*.json`, `eslint.config.js`

## Testing 🧪
The project uses a multi-layered testing strategy:
- **Unit Testing:** Powered by [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
- **E2E Testing:** Powered by [Playwright](https://playwright.dev/).
- **Mocking:** [MSW (Mock Service Worker)](https://mswjs.io/) is used to intercept and mock network requests at the browser level.

### Test Commands
```bash
npm run test          # Run Vitest unit tests
npm run test:watch    # Run Vitest in watch mode
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run Playwright E2E tests with UI
```

## Major Dependencies 📦
- **UI:** React 19, Tailwind CSS 4, Radix UI, Lucide React
- **Tables & Charts:** ag-grid-react, @tanstack/react-table, Recharts
- **State:** @reduxjs/toolkit, react-redux
- **DnD:** @dnd-kit suite (core, sortable, modifiers)
- **Testing:** Vitest, Playwright, MSW, Testing Library

## Notes & tips 💡
- Tailwind is configured; adjust styles in `index.css`/`App.css`.
- Component templates for the shadcn UI are in `src/components/shadcn-studio/`.
- MSW handlers are located in `src/mocks/handlers.ts`.

## Contributing 🤝
Contributions welcome — open an issue or submit a PR with a clear description and test steps.
