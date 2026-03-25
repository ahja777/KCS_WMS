"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { getStatusLabel } from "@/lib/utils";

export default function Header() {
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

  const initial = user?.name?.charAt(0) || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:px-6 lg:justify-end">
      {/* Hamburger - mobile & tablet only */}
      <button
        onClick={toggleMobileSidebar}
        className="rounded-xl p-2.5 text-[#4E5968] transition-all duration-200 hover:bg-[#F7F8FA] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative rounded-xl p-2.5 text-[#B0B8C1] transition-all duration-200 hover:bg-[#F7F8FA] hover:text-[#4E5968]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F04452]" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-[#F2F4F6]" />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3182F6] text-xs font-bold text-white">
            {initial}
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#191F28]">
                {user?.name || "사용자"}
              </p>
              {user?.role && (
                <span className="rounded-md bg-[#F2F4F6] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7684]">
                  {getStatusLabel(user.role)}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8B95A1]">{user?.email || ""}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-xl p-2 text-[#B0B8C1] transition-all duration-200 hover:bg-[#F7F8FA] hover:text-[#4E5968]"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
