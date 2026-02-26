import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchCurrentUser, loginUser, registerUser } from "@/api/auth";
import type { UserResponse } from "@/api/auth";

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  status: "idle",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { username: string; password: string }) => {
    const tokenResp = await loginUser(payload);
    const user = await fetchCurrentUser(tokenResp.access_token);
    return { token: tokenResp.access_token, user };
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload: { username: string; email: string; password: string }) => {
    await registerUser(payload);
    const tokenResp = await loginUser({
      username: payload.username,
      password: payload.password,
    });
    const user = await fetchCurrentUser(tokenResp.access_token);
    return { token: tokenResp.access_token, user };
  },
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    if (!auth.token) throw new Error("No token");
    const user = await fetchCurrentUser(auth.token);
    return { token: auth.token, user };
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("token");
    },
    clearError(state) {
      state.error = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.status = "loading";
      state.error = null;
    };
    const handleFulfilled = (
      state: AuthState,
      action: { payload: { token: string; user: UserResponse } },
    ) => {
      state.status = "idle";
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
    };
    const handleRejected = (
      state: AuthState,
      action: { error: { message?: string } },
    ) => {
      state.status = "failed";
      state.error = action.error.message ?? "Authentication failed";
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
    };

    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected)
      .addCase(restoreSession.pending, handlePending)
      .addCase(restoreSession.fulfilled, handleFulfilled)
      .addCase(restoreSession.rejected, handleRejected);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
