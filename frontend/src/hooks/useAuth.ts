"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { login as loginApi, logout as logoutApi } from "@/lib/auth";
import type { LoginRequest } from "@/types";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, reset } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await loginApi(credentials);
      setUser(response.user);
      router.push("/");
      return response;
    },
    [setUser, router]
  );

  const logout = useCallback(async () => {
    await logoutApi();
    reset();
    router.push("/login");
  }, [reset, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
