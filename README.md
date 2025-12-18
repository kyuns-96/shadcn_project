# shadcn_project 🚀

**Minimal React + TypeScript + Vite starter** using shadcn UI components, Tailwind, Radix primitives, ag-grid, and dnd-kit.

## Features ✨
- React 19 + TypeScript
- Vite dev server with HMR
- Tailwind CSS
- shadcn-style components (see `src/components/shadcn-studio`)
- ag-grid tables and DnD support
- ESLint for basic linting

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

## Project structure 🔧
- `src/` — application source
  - `components/` — UI components (includes `shadcn-studio/`)
  - `store/` — Redux slices and store setup
  - `hooks/` — custom hooks
  - `lib/` — utilities
  - `assets/`, `main.tsx`, `App.tsx`
- `public/` — static files
- `package.json` — scripts & dependencies
- `vite.config.ts`, `tsconfig.*.json`, `eslint.config.js`

## Scripts (from `package.json`) 🧭
- `dev` — Start Vite dev server
- `build` — Build for production
- `preview` — Preview built app
- `lint` — Run ESLint

## Notes & tips 💡
- Tailwind is configured; adjust styles in `index.css`/`App.css`.
- Component templates for the shadcn UI are in `src/components/shadcn-studio/`.
- Add a `LICENSE` if you plan to open-source the project.

## Contributing 🤝
Contributions welcome — open an issue or submit a PR with a clear description and test steps.

