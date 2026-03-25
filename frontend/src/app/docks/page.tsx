"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Trash2, Pencil, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useDocks,
  useCreateDock,
  useUpdateDock,
  useDeleteDock,
  useWarehouses,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatNumber } from "@/lib/utils";
import type { Dock } from "@/types";

const dockSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "도크명을 입력해주세요"),
  warehouseId: z.string().min(1, "창고를 선택해주세요"),
  maxTonnage: z.coerce.number().min(0, "0 이상 입력해주세요"),
  vehiclePlateNumber: z.string().optional(),
  status: z.string(),
});

type DockFormData = z.infer<typeof dockSchema>;

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function DocksPage() {
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDock, setEditingDock] = useState<Dock | undefined>();
  const [deletingDock, setDeletingDock] = useState<Dock | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: warehouseRes } = useWarehouses({ limit: 100 });
  const warehouses = warehouseRes?.data ?? [];

  const { data: response, isLoading, error } = useDocks({
    page,
    limit: 20,
    ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
  });

  const deleteMutation = useDeleteDock();

  const docks = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingDock(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (d: Dock) => {
    setEditingDock(d);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, d: Dock) => {
    e.stopPropagation();
    setDeletingDock(d);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDock) return;
    try {
      await deleteMutation.mutateAsync(deletingDock.id);
      addToast({ type: "success", message: `"${deletingDock.name}" 도크가 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingDock(undefined);
    }
  };

  const columns: Column<Dock>[] = [
    { key: "code", header: "도크코드", sortable: true },
    { key: "name", header: "도크명", sortable: true },
    {
      key: "warehouseId",
      header: "창고",
      sortable: true,
      render: (row) => row.warehouse?.name ?? "-",
    },
    {
      key: "maxTonnage",
      header: "진입가능톤수",
      sortable: true,
      render: (row) => `${formatNumber(row.maxTonnage)}톤`,
    },
    {
      key: "vehiclePlateNumber",
      header: "차량번호",
      sortable: true,
      render: (row) => row.vehiclePlateNumber || "-",
    },
    {
      key: "status",
      header: "상태",
      sortable: true,
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-[#FFF8E1] hover:text-[#F59E0B]"
            title="수정"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleDeleteClick(e, row)}
            className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">도크장 관리</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          <Plus className="h-4 w-4" />
          도크 등록
        </button>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            className={`max-w-xs ${selectBase}`}
          >
            <option value="">전체 창고</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={docks}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleEdit}
          />
        )}
      </div>

      <DockFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        dock={editingDock}
        warehouses={warehouses}
        defaultWarehouseId={warehouseFilter}
        existingDocks={docks}
      />

      <ConfirmModal
        isOpen={!!deletingDock}
        onClose={() => setDeletingDock(undefined)}
        onConfirm={handleDeleteConfirm}
        title="도크 삭제"
        message={`"${deletingDock?.name}" 도크를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// --- Form Modal ---
function DockFormModal({
  isOpen,
  onClose,
  dock,
  warehouses,
  defaultWarehouseId,
  existingDocks = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  dock?: Dock;
  warehouses: { id: string; name: string }[];
  defaultWarehouseId?: string;
  existingDocks?: Dock[];
}) {
  const isEdit = !!dock;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateDock();
  const updateMutation = useUpdateDock();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DockFormData>({
    resolver: zodResolver(dockSchema),
    defaultValues: {
      code: "",
      name: "",
      warehouseId: "",
      maxTonnage: 0,
      vehiclePlateNumber: "",
      status: "AVAILABLE",
    },
  });

  const watchedCode = watch("code");
  const isDuplicateCode = !isEdit && !!watchedCode && existingDocks.some(d => d.code === watchedCode);

  useEffect(() => {
    if (isOpen) {
      if (dock) {
        reset({
          code: dock.code,
          name: dock.name,
          warehouseId: dock.warehouseId,
          maxTonnage: dock.maxTonnage,
          vehiclePlateNumber: dock.vehiclePlateNumber ?? "",
          status: dock.status,
        });
      } else {
        reset({
          code: "",
          name: "",
          warehouseId: defaultWarehouseId ?? "",
          maxTonnage: 0,
          vehiclePlateNumber: "",
          status: "AVAILABLE",
        });
      }
    }
  }, [isOpen, dock, defaultWarehouseId, reset]);

  const onSubmit = async (data: DockFormData) => {
    if (!isEdit && data.code && existingDocks.some(d => d.code === data.code)) {
      addToast({ type: "error", message: "이미 존재하는 도크코드입니다." });
      return;
    }
    try {
      if (isEdit && dock) {
        await updateMutation.mutateAsync({ id: dock.id, payload: data });
        addToast({ type: "success", message: "저장이 완료되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "저장이 완료되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "도크 수정" : "도크 등록"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              도크코드
            </label>
            <input {...register("code")} placeholder={isEdit ? "도크코드" : "미입력시 자동생성"} className={inputBase} disabled={isEdit} />
            {errors.code && (
              <p className="mt-1.5 text-xs text-red-500">{errors.code.message}</p>
            )}
            {isDuplicateCode && (
              <p className="mt-1.5 text-xs text-orange-500">이미 존재하는 도크코드입니다.</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              도크명 <span className="text-red-500">*</span>
            </label>
            <input {...register("name")} placeholder="도크명" className={inputBase} />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            창고 <span className="text-red-500">*</span>
          </label>
          <select {...register("warehouseId")} className={selectBase}>
            <option value="">선택해주세요</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.warehouseId && (
            <p className="mt-1.5 text-xs text-red-500">{errors.warehouseId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">진입가능톤수</label>
            <input
              {...register("maxTonnage")}
              type="number"
              step="0.5"
              placeholder="0"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">차량번호</label>
            <input
              {...register("vehiclePlateNumber")}
              placeholder="차량번호"
              className={inputBase}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">상태</label>
          <select {...register("status")} className={selectBase}>
            <option value="AVAILABLE">사용가능</option>
            <option value="OCCUPIED">사용중</option>
            <option value="RESERVED">예약</option>
            <option value="BLOCKED">차단</option>
            <option value="MAINTENANCE">점검중</option>
          </select>
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
