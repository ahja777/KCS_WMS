"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, AlertCircle, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useUsers, useDeleteUser, useWarehouses, useCreateUser, useUpdateUser } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import type { User, UserRole, Warehouse } from "@/types";

const userTypeOptions = [
  { value: "", label: "선택" },
  { value: "ADMIN", label: "마스터" },
  { value: "MANAGER", label: "물류사" },
  { value: "OPERATOR", label: "고객사" },
  { value: "VIEWER", label: "뷰어" },
];

const inputBase =
  "w-full rounded border border-[#D1D6DB] bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded border border-[#D1D6DB] bg-white px-3 py-2 text-sm text-[#191F28] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

const formInputBase =
  "w-full rounded border border-[#D1D6DB] bg-white px-3 py-1.5 text-sm text-[#191F28] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

const formSelectBase =
  "w-full rounded border border-[#D1D6DB] bg-white px-3 py-1.5 text-sm text-[#191F28] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

interface UserFormState {
  company: string;
  userType: string;
  duty: string;
  userId: string;
  userName: string;
  password: string;
  department: string;
  phone: string;
  mobile: string;
  email: string;
  multiLogin: string;
}

const emptyForm: UserFormState = {
  company: "",
  userType: "ADMIN",
  duty: "마스터",
  userId: "",
  userName: "",
  password: "",
  department: "",
  phone: "",
  mobile: "",
  email: "",
  multiLogin: "N",
};

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchUserId, setSearchUserId] = useState("");
  const [searchUserName, setSearchUserName] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [formState, setFormState] = useState<UserFormState>(emptyForm);
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set());
  const [warehouseChecked, setWarehouseChecked] = useState<Set<string>>(new Set());
  const [warehouseInitAccess, setWarehouseInitAccess] = useState<Record<string, string>>({});
  const [whPage, setWhPage] = useState(1);

  const debouncedSearch = useDebounce(searchCompany);
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
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const { data: warehouseResponse } = useWarehouses({ page: 1, limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const usersRaw = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const { sortedData: users, sortKey, sortDir, handleSort } = useTableSort(usersRaw);

  const whPerPage = 10;
  const whTotalPages = Math.max(1, Math.ceil(warehouses.length / whPerPage));
  const whPagedData = warehouses.slice((whPage - 1) * whPerPage, whPage * whPerPage);
  const whStart = warehouses.length > 0 ? (whPage - 1) * whPerPage + 1 : 0;
  const whEnd = Math.min(whPage * whPerPage, warehouses.length);

  const startRow = total > 0 ? (page - 1) * 20 + 1 : 0;
  const endRow = Math.min(page * 20, total);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormState({
      company: "",
      userType: user.role,
      duty: "마스터",
      userId: user.email,
      userName: user.name,
      password: "",
      department: "",
      phone: "",
      mobile: "",
      email: user.email,
      multiLogin: "N",
    });
    setActiveTab("detail");
  };

  const handleSearch = () => {
    setPage(1);
  };

  const handleReset = () => {
    setSearchCompany("");
    setSearchUserId("");
    setSearchUserName("");
    setRoleFilter("");
    setPage(1);
  };

  const handleNewUser = () => {
    setSelectedUser(undefined);
    setFormState(emptyForm);
    setWarehouseChecked(new Set());
    setWarehouseInitAccess({});
    setActiveTab("detail");
  };

  const handleSave = async () => {
    if (!formState.userId || !formState.userName) {
      addToast({ type: "error", message: "필수 항목을 입력해주세요." });
      return;
    }
    try {
      if (selectedUser) {
        await updateMutation.mutateAsync({
          id: selectedUser.id,
          payload: {
            name: formState.userName,
            email: formState.email || formState.userId,
            role: formState.userType as UserRole,
          },
        });
        addToast({ type: "success", message: "사용자가 수정되었습니다." });
      } else {
        if (!formState.password) {
          addToast({ type: "error", message: "비밀번호를 입력해주세요." });
          return;
        }
        await createMutation.mutateAsync({
          name: formState.userName,
          email: formState.userId,
          password: formState.password,
          role: formState.userType as UserRole,
        });
        addToast({ type: "success", message: "사용자가 등록되었습니다." });
      }
      setActiveTab("list");
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) {
      addToast({ type: "warning", message: "삭제할 사용자를 선택해주세요." });
      return;
    }
    if (!confirm(`"${selectedUser.name}" 사용자를 삭제하시겠습니까?`)) return;
    try {
      await deleteMutation.mutateAsync(selectedUser.id);
      addToast({ type: "success", message: "사용자가 삭제되었습니다." });
      setSelectedUser(undefined);
      setActiveTab("list");
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    }
  };

  const toggleRowCheck = (id: string) => {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRows = () => {
    if (checkedRows.size === users.length) {
      setCheckedRows(new Set());
    } else {
      setCheckedRows(new Set(users.map((u) => u.id)));
    }
  };

  const toggleWarehouseCheck = (id: string) => {
    setWarehouseChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllWarehouses = () => {
    if (warehouseChecked.size === whPagedData.length) {
      setWarehouseChecked(new Set());
    } else {
      setWarehouseChecked(new Set(whPagedData.map((w) => w.id)));
    }
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "마스터",
      MANAGER: "매니저",
      OPERATOR: "운영자",
      VIEWER: "뷰어",
    };
    return labels[role] || role;
  };

  const updateForm = (field: keyof UserFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Tabs + Breadcrumb */}
      <div className="flex items-center gap-0 border-b border-[#E5E8EB]">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "list"
              ? "border-b-2 border-[#3182F6] text-[#3182F6]"
              : "text-[#8B95A1] hover:text-[#4E5968]"
          }`}
        >
          사용자관리목록
        </button>
        <button
          onClick={() => setActiveTab("detail")}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
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
          {/* Search area */}
          <div className="rounded-lg bg-white p-4 shadow-sm border border-[#E5E8EB]">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[150px]">
                <label className="mb-1 block text-xs font-medium text-[#6B7684]">거래처</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={searchCompany}
                    onChange={(e) => setSearchCompany(e.target.value)}
                    className={inputBase + " max-w-[120px]"}
                    placeholder=""
                  />
                  <button className="rounded border border-[#D1D6DB] bg-[#F7F8FA] p-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="min-w-[130px]">
                <label className="mb-1 block text-xs font-medium text-[#6B7684]">사용자구분</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
                  className={selectBase + " w-full"}
                >
                  {userTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-[#6B7684]">사용자아이디</label>
                <input
                  type="text"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className={inputBase}
                  placeholder=""
                />
              </div>
              <div className="min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-[#6B7684]">사용자명</label>
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
                className="flex items-center gap-1 rounded border border-[#D1D6DB] bg-white px-3 py-2 text-sm text-[#8B95A1] hover:bg-[#F7F8FA]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleSearch}
                className="flex items-center gap-1.5 rounded bg-[#3182F6] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B64DA]"
              >
                <Search className="h-4 w-4" />
                검색
              </button>
            </div>
          </div>

          {/* Users Grid */}
          <div className="rounded-lg bg-white border border-[#E5E8EB] overflow-hidden">
            <div className="bg-[#4A5568] px-4 py-2.5">
              <h2 className="text-sm font-semibold text-white">사용자관리목록</h2>
            </div>
            <div>
              {error ? (
                <div className="flex items-center gap-3 p-5 text-sm text-red-600">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  데이터를 불러오는 중 오류가 발생했습니다.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F7F8FA] border-b border-[#E5E8EB]">
                        <tr>
                          <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[50px] text-center">No</th>
                          <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[40px] text-center">
                            <input
                              type="checkbox"
                              checked={users.length > 0 && checkedRows.size === users.length}
                              onChange={toggleAllRows}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                          </th>
                          <SortableHeader field="company" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>업체명</SortableHeader>
                          <SortableHeader field="role" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>사용자구분</SortableHeader>
                          <SortableHeader field="duty" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>업무</SortableHeader>
                          <SortableHeader field="email" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>사용자 ID</SortableHeader>
                          <SortableHeader field="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>사용자명</SortableHeader>
                          <SortableHeader field="phone" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>전화번호</SortableHeader>
                          <SortableHeader field="mobile" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>핸드폰</SortableHeader>
                          <SortableHeader field="email" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>이메일</SortableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-[#F2F4F6]">
                              {Array.from({ length: 10 }).map((_, j) => (
                                <td key={j} className="px-3 py-3">
                                  <div className="h-4 w-full animate-pulse rounded bg-[#F2F4F6]" />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-3 py-12 text-center text-sm text-[#B0B8C1]">
                              사용자가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          users.map((user, idx) => (
                            <tr
                              key={user.id}
                              className="border-b border-[#F2F4F6] cursor-pointer transition-colors hover:bg-[#F7F8FA]"
                              onClick={() => perm.canEdit && handleEdit(user)}
                            >
                              <td className="px-3 py-2.5 text-center text-sm text-[#4E5968]">
                                {(page - 1) * 20 + idx + 1}
                              </td>
                              <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={checkedRows.has(user.id)}
                                  onChange={() => toggleRowCheck(user.id)}
                                  className="h-3.5 w-3.5 rounded border-gray-300"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-sm text-[#4E5968]">-</td>
                              <td className="px-3 py-2.5 text-sm text-[#4E5968]">{roleLabel(user.role)}</td>
                              <td className="px-3 py-2.5 text-sm text-[#4E5968]">마스터</td>
                              <td className="px-3 py-2.5 text-sm text-[#191F28] font-medium">{user.email}</td>
                              <td className="px-3 py-2.5 text-sm text-[#4E5968]">{user.name}</td>
                              <td className="px-3 py-2.5 text-sm text-[#8B95A1]">-</td>
                              <td className="px-3 py-2.5 text-sm text-[#8B95A1]">-</td>
                              <td className="px-3 py-2.5 text-sm text-[#4E5968]">{user.email}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E8EB]">
                    <p className="text-xs text-[#8B95A1]">
                      View {startRow}-{endRow} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-[#4E5968]">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ====== DETAIL TAB ====== */
        <div className="space-y-4">
          {/* Top action buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSave}
              className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#F04452] hover:bg-[#E03340]"
            >
              저장
            </button>
            <button
              onClick={handleNewUser}
              className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#3182F6] hover:bg-[#1B64DA]"
            >
              신규
            </button>
            <button
              onClick={handleDelete}
              className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#6B7684] hover:bg-[#4E5968]"
            >
              삭제
            </button>
          </div>

          {/* Two-panel layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT: 사용자정보 form */}
            <div className="rounded-lg bg-white border border-[#E5E8EB] overflow-hidden">
              <div className="bg-[#4A5568] px-4 py-2.5">
                <h2 className="text-sm font-semibold text-white">사용자정보</h2>
              </div>
              <div className="p-4 space-y-3">
                {/* 소속사 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">
                    <span className="text-red-500">*</span> 소속사
                  </label>
                  <div className="flex flex-1 gap-1">
                    <input
                      type="text"
                      value={formState.company}
                      onChange={(e) => updateForm("company", e.target.value)}
                      className={formInputBase}
                    />
                    <button className="rounded border border-[#D1D6DB] bg-[#F7F8FA] px-2 text-[#4E5968] hover:bg-[#E5E8EB] shrink-0">
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 사용자구분 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">
                    <span className="text-red-500">*</span> 사용자구분
                  </label>
                  <select
                    value={formState.userType}
                    onChange={(e) => updateForm("userType", e.target.value)}
                    className={formSelectBase}
                  >
                    <option value="ADMIN">마스터</option>
                    <option value="MANAGER">물류사</option>
                    <option value="OPERATOR">고객사</option>
                  </select>
                </div>

                {/* 업무 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">
                    <span className="text-red-500">*</span> 업무
                  </label>
                  <select
                    value={formState.duty}
                    onChange={(e) => updateForm("duty", e.target.value)}
                    className={formSelectBase}
                  >
                    <option value="마스터">마스터</option>
                  </select>
                </div>

                {/* 사용자 ID */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">
                    <span className="text-red-500">*</span> 사용자 ID
                  </label>
                  <input
                    type="text"
                    value={formState.userId}
                    onChange={(e) => updateForm("userId", e.target.value)}
                    className={formInputBase}
                    disabled={!!selectedUser}
                  />
                </div>

                {/* 사용자명 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">
                    <span className="text-red-500">*</span> 사용자명
                  </label>
                  <input
                    type="text"
                    value={formState.userName}
                    onChange={(e) => updateForm("userName", e.target.value)}
                    className={formInputBase}
                  />
                </div>

                {/* 비밀번호 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">
                    <span className="text-red-500">*</span> 비밀번호
                  </label>
                  <div className="flex flex-1 gap-1">
                    <input
                      type="password"
                      value={formState.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      className={formInputBase}
                      placeholder={selectedUser ? "변경시에만 입력" : ""}
                    />
                    <button
                      onClick={() => updateForm("password", "")}
                      className="rounded border border-[#D1D6DB] bg-[#F7F8FA] px-2.5 text-xs text-[#4E5968] hover:bg-[#E5E8EB] shrink-0 whitespace-nowrap"
                    >
                      RESET
                    </button>
                  </div>
                </div>

                {/* 부서 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">부서</label>
                  <input
                    type="text"
                    value={formState.department}
                    onChange={(e) => updateForm("department", e.target.value)}
                    className={formInputBase}
                  />
                </div>

                {/* 전화번호 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">전화번호</label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className={formInputBase}
                  />
                </div>

                {/* 핸드폰번호 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">핸드폰번호</label>
                  <input
                    type="text"
                    value={formState.mobile}
                    onChange={(e) => updateForm("mobile", e.target.value)}
                    className={formInputBase}
                  />
                </div>

                {/* e-mail */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">e-mail</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className={formInputBase}
                  />
                </div>

                {/* 다중접속여부 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">다중접속여부</label>
                  <select
                    value={formState.multiLogin}
                    onChange={(e) => updateForm("multiLogin", e.target.value)}
                    className={formSelectBase}
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>

                {/* 물류센터 */}
                <div className="flex items-center gap-2">
                  <label className="w-[100px] text-sm text-[#4E5968] shrink-0">물류센터</label>
                  <button
                    onClick={() => addToast({ type: "info", message: "물류센터 검색" })}
                    className="rounded border border-[#D1D6DB] bg-[#F7F8FA] px-3 py-1.5 text-xs text-[#4E5968] hover:bg-[#E5E8EB]"
                  >
                    검색
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: 물류센터목록 */}
            <div className="rounded-lg bg-white border border-[#E5E8EB] overflow-hidden">
              <div className="bg-[#4A5568] px-4 py-2.5">
                <h2 className="text-sm font-semibold text-white">물류센터목록</h2>
              </div>
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F7F8FA] border-b border-[#E5E8EB]">
                      <tr>
                        <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[50px] text-center">No</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[40px] text-center">
                          <input
                            type="checkbox"
                            checked={whPagedData.length > 0 && warehouseChecked.size === whPagedData.length}
                            onChange={toggleAllWarehouses}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                        </th>
                        <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">물류센터명</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[100px]">초기접속</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whPagedData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-12 text-center text-sm text-[#B0B8C1]">
                            물류센터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        whPagedData.map((wh, idx) => (
                          <tr key={wh.id} className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                            <td className="px-3 py-2.5 text-center text-sm text-[#4E5968]">
                              {(whPage - 1) * whPerPage + idx + 1}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={warehouseChecked.has(wh.id)}
                                onChange={() => toggleWarehouseCheck(wh.id)}
                                className="h-3.5 w-3.5 rounded border-gray-300"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-sm text-[#4E5968]">{wh.name}</td>
                            <td className="px-3 py-2.5">
                              <select
                                value={warehouseInitAccess[wh.id] ?? "N"}
                                onChange={(e) =>
                                  setWarehouseInitAccess((prev) => ({ ...prev, [wh.id]: e.target.value }))
                                }
                                className="rounded border border-[#D1D6DB] bg-white px-2 py-1 text-xs text-[#191F28] outline-none"
                              >
                                <option value="Y">Y</option>
                                <option value="N">N</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E8EB]">
                  <p className="text-xs text-[#8B95A1]">
                    View {whStart}-{whEnd} of {warehouses.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={whPage <= 1}
                      onClick={() => setWhPage(whPage - 1)}
                      className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-[#4E5968]">
                      Page {whPage} of {whTotalPages}
                    </span>
                    <button
                      disabled={whPage >= whTotalPages}
                      onClick={() => setWhPage(whPage + 1)}
                      className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
