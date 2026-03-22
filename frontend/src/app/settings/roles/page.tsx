"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  Users,
  AlertCircle,
  X,
  UserCog,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useUsers, useUpdateUser } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { User, UserRole } from "@/types";

const ROLE_INFO: Record<
  UserRole,
  { label: string; description: string; color: string; bgColor: string; capabilities: string[] }
> = {
  ADMIN: {
    label: "관리자",
    description: "시스템 전체 관리 권한",
    color: "#F04452",
    bgColor: "#FFEAED",
    capabilities: [
      "사용자 관리",
      "시스템 설정",
      "전체 데이터 조회/수정/삭제",
      "권한 관리",
    ],
  },
  MANAGER: {
    label: "매니저",
    description: "운영 관리 및 보고서 접근",
    color: "#3182F6",
    bgColor: "#E8F2FF",
    capabilities: [
      "입출고 관리",
      "재고 조정",
      "보고서 조회",
      "창고/품목 관리",
    ],
  },
  OPERATOR: {
    label: "운영자",
    description: "일상 운영 업무 수행",
    color: "#FF8B00",
    bgColor: "#FFF3E0",
    capabilities: [
      "입출고 처리",
      "재고 조회",
      "이동 처리",
      "실사 수행",
    ],
  },
  VIEWER: {
    label: "뷰어",
    description: "조회 전용 접근",
    color: "#8B95A1",
    bgColor: "#F2F4F6",
    capabilities: [
      "대시보드 조회",
      "재고 조회",
      "보고서 조회",
    ],
  },
};

const ROLES: UserRole[] = ["ADMIN", "MANAGER", "OPERATOR", "VIEWER"];

export default function RolesPage() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("VIEWER");
  const addToast = useToastStore((s) => s.addToast);

  const { data: usersResponse, isLoading, error } = useUsers({ limit: 500 });
  const users = usersResponse?.data ?? [];

  const updateUser = useUpdateUser();

  // Group by role
  const usersByRole = useMemo(() => {
    const map: Record<UserRole, User[]> = {
      ADMIN: [],
      MANAGER: [],
      OPERATOR: [],
      VIEWER: [],
    };
    users.forEach((u) => {
      if (map[u.role]) {
        map[u.role].push(u);
      } else {
        map.VIEWER.push(u);
      }
    });
    return map;
  }, [users]);

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        payload: { role: newRole },
      });
      addToast({ type: "success", message: `${editingUser.name}의 권한이 변경되었습니다.` });
      setEditingUser(null);
    } catch {
      addToast({ type: "error", message: "권한 변경에 실패했습니다." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#191F28]">권한관리</h1>
        <p className="mt-1 text-sm text-[#8B95A1]">TMSYS020 - 사용자 역할 및 권한을 관리합니다.</p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => {
          const info = ROLE_INFO[role];
          const count = usersByRole[role].length;
          return (
            <div
              key={role}
              className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: info.bgColor }}
                >
                  <Shield className="h-6 w-6" style={{ color: info.color }} />
                </div>
                <span className="text-3xl font-bold text-[#191F28]">{count}</span>
              </div>
              <h3 className="text-base font-bold text-[#191F28]">{info.label}</h3>
              <p className="mt-1 text-xs text-[#8B95A1]">{info.description}</p>
              <div className="mt-4 space-y-1.5">
                {info.capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-2 text-xs text-[#6B7684]">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    {cap}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* Tables per role */}
      {ROLES.map((role) => {
        const info = ROLE_INFO[role];
        const roleUsers = usersByRole[role];
        if (roleUsers.length === 0 && !isLoading) return null;

        return (
          <div
            key={role}
            className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: info.bgColor }}
              >
                <Users className="h-4 w-4" style={{ color: info.color }} />
              </div>
              <h2 className="text-lg font-bold text-[#191F28]">
                {info.label}
                <span className="ml-2 text-sm font-normal text-[#8B95A1]">
                  ({roleUsers.length}명)
                </span>
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8FA]">
                    <tr>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">
                        이름
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">
                        이메일
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">
                        상태
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">
                        가입일
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-[#191F28]">{user.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-[#4E5968]">{user.email}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={user.isActive ? "ACTIVE" : "INACTIVE"} />
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-[#8B95A1]">
                            {formatDate(user.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleEditRole(user)}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#3182F6] transition-colors hover:bg-[#E8F2FF]"
                          >
                            <UserCog className="h-3.5 w-3.5" />
                            권한변경
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#191F28]">권한 변경</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[#8B95A1] hover:text-[#4E5968]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl bg-[#F7F8FA] p-4">
                <p className="text-sm font-medium text-[#191F28]">{editingUser.name}</p>
                <p className="text-xs text-[#8B95A1]">{editingUser.email}</p>
                <div className="mt-2">
                  <Badge status={editingUser.role} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4E5968]">
                  새 역할 선택
                </label>
                <div className="space-y-2">
                  {ROLES.map((role) => {
                    const info = ROLE_INFO[role];
                    return (
                      <label
                        key={role}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                          newRole === role
                            ? "border-[#3182F6] bg-[#E8F2FF]"
                            : "border-[#E5E8EB] bg-white hover:bg-[#F7F8FA]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={newRole === role}
                          onChange={() => setNewRole(role)}
                          className="h-4 w-4 text-[#3182F6]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#191F28]">{info.label}</p>
                          <p className="text-xs text-[#8B95A1]">{info.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  취소
                </Button>
                <Button
                  onClick={handleSaveRole}
                  isLoading={updateUser.isPending}
                  disabled={newRole === editingUser.role}
                >
                  변경 저장
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
