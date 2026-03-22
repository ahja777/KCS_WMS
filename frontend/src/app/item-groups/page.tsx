"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Trash2, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useItemGroups,
  useCreateItemGroup,
  useUpdateItemGroup,
  useDeleteItemGroup,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import type { ItemGroup } from "@/types";

const itemGroupSchema = z.object({
  code: z.string().min(1, "상품군코드를 입력해주세요"),
  name: z.string().min(1, "상품군명을 입력해주세요"),
  type: z.string().min(1, "타입을 입력해주세요"),
  description: z.string().optional(),
});

type ItemGroupFormData = z.infer<typeof itemGroupSchema>;

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function ItemGroupsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ItemGroup | undefined>();
  const [deletingGroup, setDeletingGroup] = useState<ItemGroup | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useItemGroups({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const deleteMutation = useDeleteItemGroup();

  const groups = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingGroup(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (g: ItemGroup) => {
    setEditingGroup(g);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, g: ItemGroup) => {
    e.stopPropagation();
    setDeletingGroup(g);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGroup) return;
    try {
      await deleteMutation.mutateAsync(deletingGroup.id);
      addToast({ type: "success", message: `"${deletingGroup.name}" 상품군이 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingGroup(undefined);
    }
  };

  const columns: Column<ItemGroup>[] = [
    { key: "code", header: "상품군코드", sortable: true },
    { key: "name", header: "상품군명", sortable: true },
    {
      key: "type",
      header: "타입",
      render: (row) => (
        <span className="inline-flex rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-xs font-medium text-[#4E5968]">
          {row.type}
        </span>
      ),
    },
    {
      key: "description",
      header: "설명",
      render: (row) => (
        <span className="max-w-[300px] truncate text-[#6B7684]">
          {row.description || "-"}
        </span>
      ),
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
        <h1 className="text-2xl font-bold text-[#191F28]">상품군 관리</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          <Plus className="h-4 w-4" />
          상품군 등록
        </button>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="상품군코드, 상품군명 검색..."
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
            data={groups}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleEdit}
          />
        )}
      </div>

      <ItemGroupFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        group={editingGroup}
      />

      <ConfirmModal
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(undefined)}
        onConfirm={handleDeleteConfirm}
        title="상품군 삭제"
        message={`"${deletingGroup?.name}" 상품군을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// --- Form Modal ---
function ItemGroupFormModal({
  isOpen,
  onClose,
  group,
}: {
  isOpen: boolean;
  onClose: () => void;
  group?: ItemGroup;
}) {
  const isEdit = !!group;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateItemGroup();
  const updateMutation = useUpdateItemGroup();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemGroupFormData>({
    resolver: zodResolver(itemGroupSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (group) {
        reset({
          code: group.code,
          name: group.name,
          type: group.type,
          description: group.description ?? "",
        });
      } else {
        reset({ code: "", name: "", type: "", description: "" });
      }
    }
  }, [isOpen, group, reset]);

  const onSubmit = async (data: ItemGroupFormData) => {
    try {
      if (isEdit && group) {
        await updateMutation.mutateAsync({ id: group.id, payload: data });
        addToast({ type: "success", message: "상품군이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "상품군이 등록되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "상품군 수정" : "상품군 등록"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              상품군코드 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("code")}
              placeholder="GRP-001"
              className={inputBase}
              disabled={isEdit}
            />
            {errors.code && (
              <p className="mt-1.5 text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              상품군명 <span className="text-red-500">*</span>
            </label>
            <input {...register("name")} placeholder="상품군명" className={inputBase} />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            타입 <span className="text-red-500">*</span>
          </label>
          <input {...register("type")} placeholder="타입" className={inputBase} />
          {errors.type && (
            <p className="mt-1.5 text-xs text-red-500">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">설명</label>
          <textarea
            {...register("description")}
            placeholder="설명"
            rows={3}
            className={inputBase}
          />
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
