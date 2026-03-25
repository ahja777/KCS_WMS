"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { getCurrentUser, isAuthenticated } from "@/lib/auth";
import type { UserRole } from "@/types";

const PUBLIC_PATHS = ["/login"];

// 역할별 접근 가능 경로 정의 (미정의 경로는 모든 인증 사용자 접근 가능)
const ROLE_ROUTES: { pattern: string; roles: UserRole[] }[] = [
  { pattern: "/users", roles: ["ADMIN", "MANAGER"] },
  { pattern: "/warehouse", roles: ["ADMIN", "MANAGER"] },
  { pattern: "/items", roles: ["ADMIN", "MANAGER"] },
  { pattern: "/partners", roles: ["ADMIN", "MANAGER"] },
  { pattern: "/channels", roles: ["ADMIN", "MANAGER"] },
  { pattern: "/inventory/adjustments", roles: ["ADMIN", "MANAGER"] },
  { pattern: "/inventory/cycle-counts", roles: ["ADMIN", "MANAGER", "OPERATOR"] },
  { pattern: "/settings", roles: ["ADMIN", "MANAGER"] },
];

function isRouteAllowed(pathname: string, role?: UserRole): boolean {
  if (!role) return false;
  const rule = ROLE_ROUTES.find(
    (r) => pathname === r.pattern || pathname.startsWith(r.pattern + "/")
  );
  if (!rule) return true; // 제한 규칙이 없으면 허용
  return rule.roles.includes(role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        if (!isAuthenticated()) {
          setUser(null);
          if (!PUBLIC_PATHS.includes(pathname)) {
            router.push("/login");
          }
          return;
        }

        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [pathname, router, setUser, setLoading]);

  // 역할 기반 라우트 보호
  useEffect(() => {
    if (isLoading || !user || PUBLIC_PATHS.includes(pathname)) return;
    if (!isRouteAllowed(pathname, user.role)) {
      router.replace("/");
    }
  }, [pathname, user, isLoading, router]);

  // Safety timeout: if loading takes too long, force stop loading
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, setLoading]);

  if (isLoading && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E5E8EB] border-t-[#3182F6]" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
