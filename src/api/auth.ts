interface LoginPayload {
  username: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail || "Login failed");
  }
  return response.json() as Promise<TokenResponse>;
}

export async function registerUser(payload: RegisterPayload): Promise<UserResponse> {
  const response = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail || "Registration failed");
  }
  return response.json() as Promise<UserResponse>;
}

export async function fetchCurrentUser(token: string): Promise<UserResponse> {
  const response = await fetch("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Not authenticated");
  return response.json() as Promise<UserResponse>;
}
