# Agent Handoff: Login + Database Feature

**Project:** `/home/lee/workspace/shadcn_project`
**Branch:** `main`
**Last updated:** 2026-02-26

---

## What This Feature Is

Adding user authentication (login/register) with a FastAPI + PostgreSQL backend so users can save and load DoE configurations. The sidebar footer shows the logged-in user with a logout button.

**Full plan:** `docs/plans/2026-02-26-login-database-plan.md`

---

## Completed Tasks (all committed to main)

| Task | Commit | Status |
|------|--------|--------|
| Task 1: Backend scaffolding | 73efbb5 | ✅ Done |
| Task 2: DB models + Alembic migration | ae44645 | ✅ Done |
| Task 3: Pydantic schemas | (included in scaffolding) | ✅ Done |
| Task 4: Auth utilities (JWT + bcrypt) | (included in scaffolding) | ✅ Done |
| Task 5: Auth router + tests | cf88d91 | ✅ Done |
| Task 6: DoE setups CRUD router + isolation tests | 7ecc7e2 | ✅ Done |
| Task 7: Vite proxy + CSP config | f79e0e6 | ✅ Done |
| Task 8: Frontend auth API functions | f79e0e6 | ✅ Done |
| Task 8b: fetchWithAuth interceptor (401 → logout) | f79e0e6 | ✅ Done |
| Task 9: Auth Redux slice | 6774fa1 | ✅ Done |
| Task 10: Login page | 8373c37 + 3909e22 | ✅ Done |
| Task 11: Register page | ba72851 + 3909e22 | ✅ Done |
| Task 12: Sidebar user menu | a4894ae + 03deed4 | ✅ Done |

---

## Remaining Tasks

### Task 13: Wire Up Auth in App.tsx and DashboardSidebar

**Files to modify:**
- `src/App.tsx` (currently minimal: just `<ThemeProvider><DashboardSidebar /></ThemeProvider>`)
- `src/components/DashboardSidebar.tsx` (add `<SidebarUserMenu />` inside `<Sidebar>` after `</SidebarContent>`)

**What App.tsx should become:**
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

**What to add to DashboardSidebar.tsx:**

Add import:
```typescript
import { SidebarUserMenu } from "@/components/SidebarUserMenu";
```

Add `<SidebarUserMenu />` AFTER `</SidebarContent>` and BEFORE `</Sidebar>` (line 166 in the current file):
```tsx
<Sidebar>
  <SidebarContent>
    {/* existing navigation — DO NOT CHANGE */}
  </SidebarContent>
  <SidebarUserMenu />    {/* ADD THIS */}
</Sidebar>
```

**Commit message:** `feat(auth): wire up auth flow in App and add user menu to sidebar`

---

### Task 14: PostgreSQL Docker + Env Config

**Create `docker-compose.yml` at project root:**
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

**Create `backend/.env.example`:**
```
SUBUTAI_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/subutai
SUBUTAI_JWT_SECRET=change-me-to-a-random-secret
SUBUTAI_ENV=development
```

**Commit message:** `chore: add docker-compose for PostgreSQL and backend env example`

---

### Task 14b: DoE Save/Load UI

**Files:**
- Create: `src/store/reducers/savedSetupsReducer.ts`
- Modify: `src/store.ts` (add savedSetups reducer + export thunks)
- Create: `src/components/SavedSetupsDialog.tsx`
- Modify: `src/components/SidebarUserMenu.tsx` (add SavedSetupsDialog between avatar and logout)

**`src/store/reducers/savedSetupsReducer.ts`:**
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

**Additions to `src/store.ts`:**
```typescript
import savedSetupsReducer from "@/store/reducers/savedSetupsReducer";
// add to combineReducers:
savedSetups: savedSetupsReducer,
// export thunks:
export { fetchSavedSetups, saveCurrentSetup, removeSetup } from "@/store/reducers/savedSetupsReducer";
```

Also add this export to `src/store.ts` (needed by SavedSetupsDialog):
```typescript
export { setDoEs } from "@/store/doeRegistry";
```

**`src/components/SavedSetupsDialog.tsx`:**
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

**Update `src/components/SidebarUserMenu.tsx`:** Add `<SavedSetupsDialog />` between the username display block and the logout `SidebarMenuItem`.

Import it: `import { SavedSetupsDialog } from "@/components/SavedSetupsDialog";`

Add it between the username SidebarMenuItem and the logout SidebarMenuItem:
```tsx
<SidebarMenuItem>
  <SavedSetupsDialog />
</SidebarMenuItem>
```

**Commit message:** `feat(ui): add DoE save/load UI with savedSetups Redux slice and dialog`

---

### Task 15: End-to-End Smoke Test (manual + build verification)

This is the final verification task:

1. Run `npx tsc --noEmit` — must pass clean
2. Run `npm run build` — must produce a clean build

For full e2e you'd need Docker + PostgreSQL running, but the TypeScript/build check can be done without.

**Commit message (if any fixes needed):** `test: verify full auth flow end-to-end`

---

## Key Architecture Facts

- **Auth transport:** JWT Bearer token in `localStorage` (accepted XSS tradeoff for internal SPA)
- **401 handling:** `src/api/fetchWithAuth.ts` dispatches Redux `logout()` on 401 → App.tsx re-renders login page
- **Session restore:** `App.tsx` dispatches `restoreSession()` on mount if token exists in localStorage but user is null
- **Data isolation:** All DoE setup queries scoped to `current_user.id` on the backend
- **State shape:** `state.auth.{ user, token, status, error }` and `state.savedSetups.{ setups, status, error }`

## Key File Locations

- Backend entry: `backend/app/main.py`
- Auth router: `backend/app/routers/auth.py`
- DoE router: `backend/app/routers/doe_setups.py`
- Auth Redux slice: `src/store/reducers/authReducer.ts`
- Auth API functions: `src/api/auth.ts`
- DoE API functions: `src/api/doeSetups.ts` (uses fetchWithAuth)
- fetchWithAuth: `src/api/fetchWithAuth.ts`
- Store: `src/store.ts`
- Login page: `src/pages/LoginPage.tsx`
- Register page: `src/pages/RegisterPage.tsx`
- Sidebar user menu: `src/components/SidebarUserMenu.tsx`
- doeRegistry: `src/store/doeRegistry.ts` (has `setDoEs` action, `DoERegistryState` type)

## Important Notes for Implementer

- `setDoEs` action is exported from `src/store/doeRegistry.ts` but NOT yet from `src/store.ts` — you must add it in Task 14b
- `DoERegistryState` is exported from `src/store/doeRegistry.ts` directly
- `Dialog` shadcn/ui component needs to exist at `src/components/ui/dialog.tsx` — check before using
- Backend tests are skipped (PostgreSQL not running in dev environment)
- `npx tsc --noEmit` must pass before every commit
- Follow subagent-driven-development workflow: implement → spec review → code quality review → fix → next task
