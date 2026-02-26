import { fetchWithAuth } from "./fetchWithAuth";

export interface DoESetupResponse {
  id: string;
  name: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function listDoeSetups(): Promise<DoESetupResponse[]> {
  const resp = await fetchWithAuth("/api/v1/doe-setups");
  if (!resp.ok) throw new Error("Failed to fetch setups");
  return resp.json() as Promise<DoESetupResponse[]>;
}

export async function createDoeSetup(
  name: string,
  config: Record<string, unknown>,
): Promise<DoESetupResponse> {
  const resp = await fetchWithAuth("/api/v1/doe-setups", {
    method: "POST",
    body: JSON.stringify({ name, config }),
  });
  if (!resp.ok) throw new Error("Failed to save setup");
  return resp.json() as Promise<DoESetupResponse>;
}

export async function deleteDoeSetup(setupId: string): Promise<void> {
  const resp = await fetchWithAuth(`/api/v1/doe-setups/${setupId}`, {
    method: "DELETE",
  });
  if (!resp.ok) throw new Error("Failed to delete setup");
}
