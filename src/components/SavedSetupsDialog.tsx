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
  fetchSavedSetups,
  removeSetup,
  saveCurrentSetup,
  setDoEs,
  useAppDispatch,
  useAppSelector,
} from "@/store";
import type { DoEEntry, DoERegistryState } from "@/store/doeRegistry";

interface SavedSetupConfig {
  doeRegistry: DoERegistryState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDoEEntry(value: unknown): value is DoEEntry {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.label === "string";
}

function isDoERegistryState(value: unknown): value is DoERegistryState {
  if (!isRecord(value)) return false;
  const { allIds, byId } = value;
  if (!Array.isArray(allIds)) return false;
  if (!isRecord(byId)) return false;

  return allIds.every((id) => {
    if (typeof id !== "string") return false;
    return isDoEEntry(byId[id]);
  });
}

function parseSavedConfig(config: Record<string, unknown>): SavedSetupConfig | null {
  const maybeRegistry = config.doeRegistry;
  if (!isDoERegistryState(maybeRegistry)) return null;
  return { doeRegistry: maybeRegistry };
}

export function SavedSetupsDialog() {
  const dispatch = useAppDispatch();
  const { setups, status, error } = useAppSelector((state) => state.savedSetups);
  const doeRegistry = useAppSelector((state) => state.doeRegistry);
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    setLoadError(null);
    if (isOpen) {
      dispatch(fetchSavedSetups());
    }
  };

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;

    dispatch(saveCurrentSetup({ name, config: { doeRegistry } }));
    setSaveName("");
  };

  const handleLoad = (config: Record<string, unknown>) => {
    const parsed = parseSavedConfig(config);
    if (!parsed) {
      setLoadError("This setup has an unsupported config shape.");
      return;
    }

    const entries = parsed.doeRegistry.allIds
      .map((id) => parsed.doeRegistry.byId[id])
      .filter((entry): entry is DoEEntry => entry !== undefined);

    dispatch(setDoEs(entries));
    setLoadError(null);
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

        <div className="flex gap-2">
          <Input
            aria-label="Setup name"
            placeholder="Setup name..."
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSave();
              }
            }}
          />
          <Button onClick={handleSave} disabled={!saveName.trim() || status === "loading"}>
            Save
          </Button>
        </div>

        {status === "loading" && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {setups.length === 0 && status !== "loading" && (
          <p className="text-sm text-muted-foreground">No saved setups yet.</p>
        )}

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {setups.map((setup) => (
            <li
              key={setup.id}
              className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted"
            >
              <button
                type="button"
                className="flex-1 text-left text-sm"
                onClick={() => handleLoad(setup.config)}
              >
                {setup.name}
              </button>
              <button
                type="button"
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
