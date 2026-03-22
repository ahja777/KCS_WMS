"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, AlertCircle, Download } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useCommonCodes,
  useCreateCommonCode,
  useUpdateCommonCode,
  useDeleteCommonCode,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import type { CommonCode } from "@/types";

const codeSchema = z.object({
  groupCode: z.string().min(1, "코드유형을 입력해주세요"),
  groupName: z.string().optional(),
  code: z.string().min(1, "코드를 입력해주세요"),
  codeName: z.string().min(1, "코드명을 입력해주세요"),
  value: z.string().optional(),
  sortOrder: z.coerce.number().min(0),
  isActive: z.boolean(),
});

type CodeFormData = z.infer<typeof codeSchema>;

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

export default function CommonCodesPage() {
  const [searchGroupCode, setSearchGroupCode] = useState("");
  const [searchGroupName, setSearchGroupName] = useState("");
  const [searchUserType, setSearchUserType] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRightFormOpen, setIsRightFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CommonCode | undefined>();
  const [deletingCode, setDeletingCode] = useState<CommonCode | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useCommonCodes({
    page: 1,
    limit: 500,
  });

  const deleteMutation = useDeleteCommonCode();

  const codes = response?.data ?? [];

  // Build left-panel group rows: unique groupCodes with their info
  const groupRows = useMemo(() => {
    const map = new Map<string, { groupCode: string; groupName: string; userType: string; codeLevel: string }>();
    for (const c of codes) {
      if (!map.has(c.groupCode)) {
        map.set(c.groupCode, {
          groupCode: c.groupCode,
          groupName: c.groupName ?? "",
          userType: "마스터",
          codeLevel: "삭제불가",
        });
      }
    }
    let result = Array.from(map.values());
    // Apply search filters
    if (searchGroupCode) {
      result = result.filter((r) => r.groupCode.toLowerCase().includes(searchGroupCode.toLowerCase()));
    }
    if (searchGroupName) {
      result = result.filter((r) => r.groupName.toLowerCase().includes(searchGroupName.toLowerCase()));
    }
    return result;
  }, [codes, searchGroupCode, searchGroupName]);

  // Right panel: codes filtered by selected group
  const rightCodes = useMemo(() => {
    if (!selectedGroup) return [];
    return codes.filter((c) => c.groupCode === selectedGroup);
  }, [codes, selectedGroup]);

  // Pagination for left
  const leftPerPage = 20;
  const leftTotalPages = Math.max(1, Math.ceil(groupRows.length / leftPerPage));
  const leftPagedData = groupRows.slice((leftPage - 1) * leftPerPage, leftPage * leftPerPage);

  // Pagination for right
  const rightPerPage = 20;
  const rightTotalPages = Math.max(1, Math.ceil(rightCodes.length / rightPerPage));
  const rightPagedData = rightCodes.slice((rightPage - 1) * rightPerPage, rightPage * rightPerPage);

  const handleSearch = () => {
    setLeftPage(1);
  };

  const handleGroupClick = (groupCode: string) => {
    setSelectedGroup(groupCode);
    setRightPage(1);
  };

  const handleCreateLeft = () => {
    setEditingCode(undefined);
    setIsFormOpen(true);
  };

  const handleCreateRight = () => {
    setEditingCode(undefined);
    setIsRightFormOpen(true);
  };

  const handleEditRight = (code: CommonCode) => {
    setEditingCode(code);
    setIsRightFormOpen(true);
  };

  const handleDeleteClick = (code: CommonCode) => {
    setDeletingCode(code);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCode) return;
    try {
      await deleteMutation.mutateAsync(deletingCode.id);
      addToast({ type: "success", message: `"${deletingCode.codeName}" 코드가 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingCode(undefined);
    }
  };

  // Left grid columns: 사용자구분, 유형코드, 유형명, 코드레벨
  const leftColumns: Column<typeof groupRows[number]>[] = [
    { key: "userType", header: "*사용자구분" },
    { key: "groupCode", header: "*유형코드", sortable: true },
    { key: "groupName", header: "*유형명", sortable: true },
    { key: "codeLevel", header: "*코드레벨" },
  ];

  // Right grid columns: 기초코드, 기초코드명, 값, 순서
  const rightColumns: Column<CommonCode>[] = [
    { key: "code", header: "기초코드", sortable: true },
    { key: "codeName", header: "*기초코드명", sortable: true },
    { key: "value", header: "값" },
    { key: "sortOrder", header: "순서", sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">기준관리</h1>
        <p className="text-sm text-[#8B95A1]">시스템관리 &gt; 기준코드</p>
      </div>

      {/* Search area */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">유형코드</label>
            <input
              type="text"
              value={searchGroupCode}
              onChange={(e) => setSearchGroupCode(e.target.value)}
              className={inputBase}
              placeholder="유형코드"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">유형명</label>
            <input
              type="text"
              value={searchGroupName}
              onChange={(e) => setSearchGroupName(e.target.value)}
              className={inputBase}
              placeholder="유형명"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">사용자구분</label>
            <select
              value={searchUserType}
              onChange={(e) => setSearchUserType(e.target.value)}
              className={selectBase}
            >
              <option value="">전체</option>
              <option value="마스터">마스터</option>
              <option value="고객사">고객사</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            검색
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left panel: 코드유형 목록 */}
        <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Left action buttons */}
          <div className="flex items-center justify-end gap-2 px-5 pt-5">
            <Button variant="danger" size="sm" onClick={() => addToast({ type: "info", message: "저장되었습니다." })}>
              저장
            </Button>
            <Button size="sm" onClick={handleCreateLeft}>
              신규
            </Button>
            <Button variant="secondary" size="sm" onClick={() => addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." })}>
              삭제
            </Button>
          </div>

          {/* Left grid header */}
          <div className="mx-5 mt-4 rounded-t-xl bg-[#4A5568] px-4 py-2.5">
            <h2 className="text-sm font-semibold text-white">코드유형 목록</h2>
          </div>

          <div className="px-5 pb-5">
            {error ? (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                데이터를 불러오는 중 오류가 발생했습니다.
              </div>
            ) : (
              <Table
                columns={leftColumns}
                data={leftPagedData}
                isLoading={isLoading}
                page={leftPage}
                totalPages={leftTotalPages}
                total={groupRows.length}
                onPageChange={setLeftPage}
                onRowClick={(row) => handleGroupClick(row.groupCode)}
                emptyMessage="코드유형이 없습니다."
              />
            )}
          </div>
        </div>

        {/* Right panel: 기초코드 목록 */}
        <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Right action buttons */}
          <div className="flex items-center justify-end gap-2 px-5 pt-5">
            <Button variant="danger" size="sm" onClick={() => addToast({ type: "info", message: "저장되었습니다." })}>
              저장
            </Button>
            <Button size="sm" onClick={handleCreateRight}>
              신규
            </Button>
            <Button variant="secondary" size="sm" onClick={() => {
              if (rightPagedData.length > 0) {
                handleDeleteClick(rightPagedData[0]);
              } else {
                addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." });
              }
            }}>
              삭제
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToast({ type: "info", message: "엑셀 다운로드" })}
              className="!bg-[#22C55E] !text-white !border-[#22C55E] hover:!bg-[#16A34A]"
            >
              엑셀
            </Button>
          </div>

          {/* Right grid header */}
          <div className="mx-5 mt-4 rounded-t-xl bg-[#4A5568] px-4 py-2.5">
            <h2 className="text-sm font-semibold text-white">기초코드 목록</h2>
          </div>

          <div className="px-5 pb-5">
            {!selectedGroup ? (
              <div className="py-16 text-center text-sm text-[#8B95A1]">
                좌측에서 코드유형을 선택해주세요.
              </div>
            ) : (
              <Table
                columns={rightColumns}
                data={rightPagedData}
                isLoading={isLoading}
                page={rightPage}
                totalPages={rightTotalPages}
                total={rightCodes.length}
                onPageChange={setRightPage}
                onRowClick={handleEditRight}
                emptyMessage="기초코드가 없습니다."
              />
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit form for left (code type) */}
      <CommonCodeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        code={editingCode}
        defaultGroupCode=""
      />

      {/* Create/Edit form for right (basic code) */}
      <CommonCodeFormModal
        isOpen={isRightFormOpen}
        onClose={() => setIsRightFormOpen(false)}
        code={editingCode}
        defaultGroupCode={selectedGroup}
      />

      <ConfirmModal
        isOpen={!!deletingCode}
        onClose={() => setDeletingCode(undefined)}
        onConfirm={handleDeleteConfirm}
        title="코드 삭제"
        message={`"${deletingCode?.codeName}" 코드를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// --- Form Modal ---
function CommonCodeFormModal({
  isOpen,
  onClose,
  code,
  defaultGroupCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  code?: CommonCode;
  defaultGroupCode?: string;
}) {
  const isEdit = !!code;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateCommonCode();
  const updateMutation = useUpdateCommonCode();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      groupCode: "",
      groupName: "",
      code: "",
      codeName: "",
      value: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (isOpen) {
      if (code) {
        reset({
          groupCode: code.groupCode,
          groupName: code.groupName ?? "",
          code: code.code,
          codeName: code.codeName,
          value: code.value ?? "",
          sortOrder: code.sortOrder,
          isActive: code.isActive,
        });
      } else {
        reset({
          groupCode: defaultGroupCode ?? "",
          groupName: "",
          code: "",
          codeName: "",
          value: "",
          sortOrder: 0,
          isActive: true,
        });
      }
    }
  }, [isOpen, code, defaultGroupCode, reset]);

  const onSubmit = async (data: CodeFormData) => {
    try {
      if (isEdit && code) {
        await updateMutation.mutateAsync({ id: code.id, payload: data });
        addToast({ type: "success", message: "코드가 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "코드가 등록되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "코드 수정" : "코드 등록"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              코드유형 <span className="text-red-500">*</span>
            </label>
            <input {...register("groupCode")} placeholder="GROUP_CODE" className={inputBase} />
            {errors.groupCode && (
              <p className="mt-1.5 text-xs text-red-500">{errors.groupCode.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">유형명</label>
            <input {...register("groupName")} placeholder="유형명" className={inputBase} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              코드 <span className="text-red-500">*</span>
            </label>
            <input {...register("code")} placeholder="코드" className={inputBase} disabled={isEdit} />
            {errors.code && (
              <p className="mt-1.5 text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              코드명 <span className="text-red-500">*</span>
            </label>
            <input {...register("codeName")} placeholder="코드명" className={inputBase} />
            {errors.codeName && (
              <p className="mt-1.5 text-xs text-red-500">{errors.codeName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">값</label>
            <input {...register("value")} placeholder="값" className={inputBase} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">순서</label>
            <input {...register("sortOrder")} type="number" placeholder="0" className={inputBase} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setValue("isActive", !isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
              isActive ? "bg-[#3182F6]" : "bg-[#D1D6DB]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isActive ? "translate-x-[22px]" : "translate-x-0.5"
              } mt-0.5`}
            />
          </button>
          <span className="text-sm font-medium text-[#4E5968]">
            {isActive ? "사용" : "미사용"}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            {isSubmitting ? "처리중..." : isEdit ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
