"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Trash2, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
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

export default function CommonCodesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CommonCode | undefined>();
  const [deletingCode, setDeletingCode] = useState<CommonCode | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useCommonCodes({
    page,
    limit: 100,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(selectedGroup ? { groupCode: selectedGroup } : {}),
  });

  const deleteMutation = useDeleteCommonCode();

  const codes = response?.data ?? [];

  // Extract unique group codes
  const allGroupCodes = Array.from(
    new Set(codes.map((c) => c.groupCode))
  ).sort();

  const filteredCodes = selectedGroup
    ? codes.filter((c) => c.groupCode === selectedGroup)
    : codes;

  const handleCreate = () => {
    setEditingCode(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (code: CommonCode) => {
    setEditingCode(code);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, code: CommonCode) => {
    e.stopPropagation();
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

  const columns: Column<CommonCode>[] = [
    { key: "code", header: "코드", sortable: true },
    { key: "codeName", header: "코드명", sortable: true },
    { key: "value", header: "값" },
    { key: "sortOrder", header: "순서", sortable: true },
    {
      key: "isActive",
      header: "사용여부",
      render: (row) => <Badge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={(e) => handleDeleteClick(e, row)}
          className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">공통코드 관리</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          <Plus className="h-4 w-4" />
          코드 등록
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left panel: Group list */}
        <div className="w-[260px] shrink-0 rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-sm font-semibold text-[#191F28]">코드유형</h2>
          <button
            onClick={() => setSelectedGroup("")}
            className={`mb-1 w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
              !selectedGroup
                ? "bg-[#E8F2FF] text-[#3182F6]"
                : "text-[#4E5968] hover:bg-[#F7F8FA]"
            }`}
          >
            전체
          </button>
          {allGroupCodes.map((group) => (
            <button
              key={group}
              onClick={() => {
                setSelectedGroup(group);
                setPage(1);
              }}
              className={`mb-1 w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                selectedGroup === group
                  ? "bg-[#E8F2FF] text-[#3182F6]"
                  : "text-[#4E5968] hover:bg-[#F7F8FA]"
              }`}
            >
              {group}
            </button>
          ))}
          {allGroupCodes.length === 0 && !isLoading && (
            <p className="py-4 text-center text-sm text-[#B0B8C1]">코드유형 없음</p>
          )}
        </div>

        {/* Right panel: Code list */}
        <div className="flex-1 rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
              <input
                type="text"
                placeholder="코드, 코드명 검색..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
              />
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
              data={filteredCodes}
              isLoading={isLoading}
              page={page}
              totalPages={1}
              total={filteredCodes.length}
              onPageChange={setPage}
              onRowClick={handleEdit}
            />
          )}
        </div>
      </div>

      <CommonCodeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
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
