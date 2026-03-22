import api from "./api";
import type { LoginRequest, LoginResponse, User } from "@/types";

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // TransformInterceptor wraps response in { success, data, timestamp }
  const { data: wrapped } = await api.post("/auth/login", credentials);
  const result: LoginResponse = wrapped.data;
  localStorage.setItem("accessToken", result.accessToken);
  return result;
}

export async function logout(): Promise<void> {
  // Backend has no logout endpoint; just clear local storage
  localStorage.removeItem("accessToken");
}

export async function getCurrentUser(): Promise<User> {
  // Backend endpoint is GET /auth/profile (not /auth/me)
  const { data: wrapped } = await api.get("/auth/profile");
  return wrapped.data;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
