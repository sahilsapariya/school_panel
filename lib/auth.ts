/**
 * Auth helpers.
 * JWT is stored in httpOnly cookie by backend — no localStorage.
 */

import { api } from "./api";
import type { LoginPayload, LoginResponse } from "@/types";

const AUTH_LOGIN_PATH = "/api/auth/login";
const AUTH_LOGOUT_PATH = "/api/auth/logout";
const AUTH_ME_PATH = "/api/auth/profile";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>(AUTH_LOGIN_PATH, payload);
  return res;
}

export async function logout(): Promise<void> {
  await api.post(AUTH_LOGOUT_PATH);
}

export async function getSession(): Promise<{ email?: string; name?: string } | null> {
  try {
    const res = await api.get<{ data?: { user?: { email: string; name?: string } } }>(AUTH_ME_PATH);
    return res?.data?.user ?? null;
  } catch {
    return null;
  }
}
