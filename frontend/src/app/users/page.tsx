"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, AlertCircle } from "lucide-react";
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

const roleFilters: { value: UserRole | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "ADMIN", label: "관리자" },
  { value: "MANAGER", label: "매니저" },
  { value: "OPERATOR", label: "운영자" },
  { value: "VIEWER", label: "뷰어" },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();

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
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "이름",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-[#191F28]">{row.name}</span>
      ),
    },
    { key: "email", header: "이메일", sortable: true },
    {
      key: "role",
      header: "역할",
      render: (row) => <Badge status={row.role} />,
    },
    {
      key: "isActive",
      header: "상태",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              row.isActive ? "bg-[#00C853]" : "bg-[#8B95A1]"
            }`}
          />
          <span
            className={`text-sm ${
              row.isActive ? "text-[#191F28]" : "text-[#8B95A1]"
            }`}
          >
            {row.isActive ? "활성" : "비활성"}
          </span>
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "가입일",
      sortable: true,
      render: (row) => (
        <span className="text-[#8B95A1]">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">사용자 관리</h1>
        <PageActions
          canCreate={perm.canCreate}
          canExport={perm.canExport}
          onCreateClick={handleCreate}
          onExcelDownload={() => downloadExcel("/export/warehouses", "사용자목록.xlsx")}
          onPdfPrint={() => printPDF("사용자 관리")}
          createLabel="사용자 등록"
        />
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Search + Role pill filter */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="이름, 이메일 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          {/* Pill tabs for role filter */}
          <div className="flex gap-2">
            {roleFilters.map((rf) => (
              <button
                key={rf.value}
                onClick={() => {
                  setRoleFilter(rf.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  roleFilter === rf.value
                    ? "bg-[#191F28] text-white"
                    : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>

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

      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={editingUser}
      />
    </div>
  );
}
