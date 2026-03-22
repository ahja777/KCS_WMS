"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, AlertCircle, RotateCcw } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import PageActions from "@/components/ui/PageActions";
import { useUsers, useDeleteUser } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import { formatDate } from "@/lib/utils";
import { downloadExcel, printPDF } from "@/lib/export";
import type { User, UserRole } from "@/types";
import UserFormModal from "@/components/users/UserFormModal";

const userTypeOptions = [
  { value: "", label: "선택" },
  { value: "ADMIN", label: "관리자" },
  { value: "MANAGER", label: "매니저" },
  { value: "OPERATOR", label: "운영자" },
  { value: "VIEWER", label: "뷰어" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");
  const [search, setSearch] = useState("");
  const [searchUserId, setSearchUserId] = useState("");
  const [searchUserName, setSearchUserName] = useState("");
  const debouncedSearch = useDebounce(search);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("users");

  const {
    data: response,
    isLoading,
    error,
  } = useUsers({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(searchUserId ? { userId: searchUserId } : {}),
    ...(searchUserName ? { name: searchUserName } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  });

  const deleteMutation = useDeleteUser();

  const users = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditingUser(user);
    setActiveTab("detail");
  };

  const handleSearch = () => {
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setSearchUserId("");
    setSearchUserName("");
    setRoleFilter("");
    setPage(1);
  };

  // Grid columns matching slide 09: 업체명, 사용자구분, 업무, 사용자ID, 사용자명, 전화번호, 핸드폰, 이메일
  const columns: Column<User>[] = [
    {
      key: "company",
      header: "업체명",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">-</span>
      ),
    },
    {
      key: "role",
      header: "사용자구분",
      render: (row) => {
        const labels: Record<string, string> = {
          ADMIN: "마스터",
          MANAGER: "매니저",
          OPERATOR: "운영자",
          VIEWER: "뷰어",
        };
        return <span className="text-sm text-[#4E5968]">{labels[row.role] || row.role}</span>;
      },
    },
    {
      key: "duty",
      header: "업무",
      render: (row) => <span className="text-sm text-[#4E5968]">마스터</span>,
    },
    {
      key: "email",
      header: "사용자 ID",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-medium text-[#191F28]">{row.email}</span>
      ),
    },
    {
      key: "name",
      header: "사용자명",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#4E5968]">{row.name}</span>
      ),
    },
    {
      key: "phone",
      header: "전화번호",
      render: () => <span className="text-sm text-[#8B95A1]">-</span>,
    },
    {
      key: "mobile",
      header: "핸드폰",
      render: () => <span className="text-sm text-[#8B95A1]">-</span>,
    },
    {
      key: "emailCol",
      header: "이메일",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">{row.email}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs: 사용자관리목록 | 사용자관리상세 */}
      <div className="flex items-center gap-0 border-b border-[#E5E8EB]">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "list"
              ? "border-b-2 border-[#3182F6] text-[#3182F6]"
              : "text-[#8B95A1] hover:text-[#4E5968]"
          }`}
        >
          사용자관리목록
        </button>
        <button
          onClick={() => setActiveTab("detail")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "detail"
              ? "border-b-2 border-[#3182F6] text-[#3182F6]"
              : "text-[#8B95A1] hover:text-[#4E5968]"
          }`}
        >
          사용자관리상세
        </button>
        <div className="ml-auto text-sm text-[#8B95A1]">시스템관리 &gt; 사용자관리</div>
      </div>

      {activeTab === "list" ? (
        <>
          {/* Search area matching slide 09 */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">거래처</label>
                <div className="flex gap-1">
                  <input type="text" className={inputBase + " max-w-[120px]"} placeholder="" />
                  <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">사용자구분</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
                  className={selectBase}
                >
                  {userTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">사용자아이디</label>
                <input
                  type="text"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className={inputBase}
                  placeholder=""
                />
              </div>
              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">사용자명</label>
                <input
                  type="text"
                  value={searchUserName}
                  onChange={(e) => setSearchUserName(e.target.value)}
                  className={inputBase}
                  placeholder=""
                />
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-sm text-[#8B95A1] hover:bg-[#F7F8FA]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={handleSearch}
                className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1B64DA]"
              >
                <Search className="h-4 w-4" />
                검색
              </button>
            </div>
          </div>

          {/* Users Grid */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
              <h2 className="text-sm font-semibold text-white">사용자관리목록</h2>
            </div>
            <div className="p-5">
              {error ? (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  데이터를 불러오는 중 오류가 발생했습니다.
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={users}
                  isLoading={isLoading}
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                  onRowClick={perm.canEdit ? handleEdit : undefined}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        /* Detail tab */
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {selectedUser ? (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-[#191F28]">사용자 상세 정보</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#8B95A1]">사용자 ID</label>
                  <p className="text-sm text-[#191F28]">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#8B95A1]">사용자명</label>
                  <p className="text-sm text-[#191F28]">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#8B95A1]">사용자구분</label>
                  <p className="text-sm text-[#191F28]">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#8B95A1]">상태</label>
                  <p className="text-sm text-[#191F28]">{selectedUser.isActive ? "활성" : "비활성"}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#8B95A1]">가입일</label>
                  <p className="text-sm text-[#191F28]">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingUser(selectedUser);
                    setIsFormOpen(true);
                  }}
                  className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
                >
                  수정
                </button>
                <button
                  onClick={() => setActiveTab("list")}
                  className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
                >
                  목록
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-[#8B95A1]">
              목록에서 사용자를 선택해주세요.
            </div>
          )}
        </div>
      )}

      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={editingUser}
      />
    </div>
  );
}
