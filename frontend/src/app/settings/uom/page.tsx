"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Trash2, AlertCircle, Download } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useUoms, useCreateUom, useUpdateUom, useDeleteUom } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadExcel } from "@/lib/export";

interface UomItem {
  id: string;
  code: string;
  name: string;
  [key: string]: unknown;
}

const uomSchema = z.object({
  code: z.string().min(1, "UOM코드를 입력해주세요"),
  name: z.string().min(1, "UOM명을 입력해주세요"),
});

type UomFormData = z.infer<typeof uomSchema>;

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function UomPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<UomItem | undefined>();
  const [deletingUom, setDeletingUom] = useState<UomItem | undefined>();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useUoms({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const deleteMutation = useDeleteUom();

  const uoms = (response?.data ?? []) as UomItem[];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingUom(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (u: UomItem) => {
    setEditingUom(u);
    setIsFormOpen(true);
  };

  const handleDeleteClick = () => {
    if (selectedRows.size === 0) {
      addToast({ type: "error", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    const firstId = Array.from(selectedRows)[0];
    const uom = uoms.find((u) => u.id === firstId);
    if (uom) setDeletingUom(uom);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUom) return;
    try {
      await deleteMutation.mutateAsync(deletingUom.id);
      addToast({ type: "success", message: `"${deletingUom.name}" UOM이 삭제되었습니다.` });
      setSelectedRows(new Set());
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingUom(undefined);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: Column<UomItem>[] = [
    {
      key: "select",
      header: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={() => toggleRow(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
        />
      ),
    },
    {
      key: "code",
      header: "UOM코드",
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-[#191F28]">{row.code}</span>,
    },
    {
      key: "name",
      header: "UOM명",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.name}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Title */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; UOM정보</p>
          <h1 className="text-2xl font-bold text-[#191F28]">UOM 정보관리</h1>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">UOM코드</label>
            <input
              type="text"
              placeholder="UOM코드 검색..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={inputBase}
            />
          </div>
          <button
            onClick={() => setPage(1)}
            className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => addToast({ type: "success", message: "저장되었습니다." })}
          className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E03340]"
        >
          저장
        </button>
        <button
          onClick={handleCreate}
          className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          신규
        </button>
        <button
          onClick={handleDeleteClick}
          className="rounded-xl bg-[#8B95A1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B7684]"
        >
          삭제
        </button>
        <button
          onClick={() => downloadExcel("/export/uom", `UOM_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`)}
          className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#17A86B]"
        >
          엑셀
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 rounded-lg bg-[#4A5568] px-4 py-2">
          <h2 className="text-sm font-bold text-white">UOM목록</h2>
        </div>
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={uoms}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleEdit}
            emptyMessage="UOM 데이터가 없습니다."
          />
        )}
      </div>

      {/* Form Modal */}
      <UomFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        uom={editingUom}
      />

      <ConfirmModal
        isOpen={!!deletingUom}
        onClose={() => setDeletingUom(undefined)}
        onConfirm={handleDeleteConfirm}
        title="UOM 삭제"
        message={`"${deletingUom?.name}" UOM을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function UomFormModal({
  isOpen,
  onClose,
  uom,
}: {
  isOpen: boolean;
  onClose: () => void;
  uom?: UomItem;
}) {
  const isEdit = !!uom;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateUom();
  const updateMutation = useUpdateUom();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UomFormData>({
    resolver: zodResolver(uomSchema),
    defaultValues: { code: "", name: "" },
  });

  useEffect(() => {
    if (isOpen) {
      if (uom) {
        reset({ code: uom.code, name: uom.name });
      } else {
        reset({ code: "", name: "" });
      }
    }
  }, [isOpen, uom, reset]);

  const onSubmit = async (data: UomFormData) => {
    try {
      if (isEdit && uom) {
        await updateMutation.mutateAsync({ id: uom.id, payload: data });
        addToast({ type: "success", message: "UOM이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "UOM이 등록되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "UOM 수정" : "UOM 등록"} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            UOM코드 <span className="text-red-500">*</span>
          </label>
          <input {...register("code")} placeholder="EA" className={inputBase} disabled={isEdit} />
          {errors.code && <p className="mt-1.5 text-xs text-red-500">{errors.code.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            UOM명 <span className="text-red-500">*</span>
          </label>
          <input {...register("name")} placeholder="UOM명" className={inputBase} />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]">
            취소
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50">
            {isSubmitting ? "처리중..." : isEdit ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
