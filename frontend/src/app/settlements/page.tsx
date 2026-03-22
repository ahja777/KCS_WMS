"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useSettlements,
  useCreateSettlement,
  useUpdateSettlement,
  useDeleteSettlement,
  useConfirmSettlement,
  useWarehouses,
  usePartners,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Settlement } from "@/types";

const detailSchema = z.object({
  description: z.string().min(1, "항목을 입력해주세요"),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
});

const settlementSchema = z.object({
  partnerId: z.string().min(1, "거래처를 선택해주세요"),
  warehouseId: z.string().min(1, "창고를 선택해주세요"),
  periodFrom: z.string().min(1, "시작일을 입력해주세요"),
  periodTo: z.string().min(1, "종료일을 입력해주세요"),
  details: z.array(detailSchema).min(1, "항목을 추가해주세요"),
  notes: z.string().optional(),
});

type SettlementFormData = z.infer<typeof settlementSchema>;

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

const statusFilters = [
  { value: "", label: "전체" },
  { value: "DRAFT", label: "초안" },
  { value: "CALCULATED", label: "산출" },
  { value: "CONFIRMED", label: "확정" },
  { value: "BILLED", label: "청구" },
];

export default function SettlementsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | undefined>();
  const [deletingSettlement, setDeletingSettlement] = useState<Settlement | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useSettlements({
    page,
    limit: 20,
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const deleteMutation = useDeleteSettlement();
  const confirmMutation = useConfirmSettlement();

  const settlements = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingSettlement(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (s: Settlement) => {
    setEditingSettlement(s);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, s: Settlement) => {
    e.stopPropagation();
    setDeletingSettlement(s);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSettlement) return;
    try {
      await deleteMutation.mutateAsync(deletingSettlement.id);
      addToast({ type: "success", message: "정산이 삭제되었습니다." });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingSettlement(undefined);
    }
  };

  const handleConfirm = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await confirmMutation.mutateAsync(id);
      addToast({ type: "success", message: "정산이 확정되었습니다." });
    } catch {
      addToast({ type: "error", message: "확정 중 오류가 발생했습니다." });
    }
  };

  const columns: Column<Settlement>[] = [
    { key: "settlementNumber", header: "정산번호", sortable: true },
    {
      key: "partnerId",
      header: "거래처",
      render: (row) => row.partner?.name ?? "-",
    },
    {
      key: "warehouseId",
      header: "창고",
      render: (row) => row.warehouse?.name ?? "-",
    },
    {
      key: "period",
      header: "기간",
      render: (row) => `${formatDate(row.periodFrom)} ~ ${formatDate(row.periodTo)}`,
    },
    {
      key: "totalAmount",
      header: "금액",
      render: (row) => `${formatNumber(row.totalAmount)}원`,
    },
    {
      key: "status",
      header: "상태",
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-2">
          {(row.status === "DRAFT" || row.status === "CALCULATED") && (
            <button
              onClick={(e) => handleConfirm(e, row.id)}
              className="rounded-lg bg-[#E8F7EF] px-3 py-1 text-xs font-semibold text-[#1FC47D] transition-colors hover:bg-[#D0F0DE]"
            >
              확정
            </button>
          )}
          {row.status === "DRAFT" && (
            <button
              onClick={(e) => handleDeleteClick(e, row)}
              className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">정산 관리</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          <Plus className="h-4 w-4" />
          정산 등록
        </button>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Status filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-[#3182F6] text-white"
                  : "bg-[#F2F4F6] text-[#6B7684] hover:bg-[#E5E8EB]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={settlements}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleEdit}
          />
        )}
      </div>

      <SettlementFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        settlement={editingSettlement}
      />

      <ConfirmModal
        isOpen={!!deletingSettlement}
        onClose={() => setDeletingSettlement(undefined)}
        onConfirm={handleDeleteConfirm}
        title="정산 삭제"
        message={`"${deletingSettlement?.settlementNumber}" 정산을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// --- Form Modal ---
function SettlementFormModal({
  isOpen,
  onClose,
  settlement,
}: {
  isOpen: boolean;
  onClose: () => void;
  settlement?: Settlement;
}) {
  const isEdit = !!settlement;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateSettlement();
  const updateMutation = useUpdateSettlement();

  const { data: warehouseRes } = useWarehouses({ limit: 100 });
  const { data: partnerRes } = usePartners({ limit: 100 });
  const warehouses = warehouseRes?.data ?? [];
  const partners = partnerRes?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      partnerId: "",
      warehouseId: "",
      periodFrom: "",
      periodTo: "",
      details: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details",
  });

  const watchDetails = watch("details");

  useEffect(() => {
    if (isOpen) {
      if (settlement) {
        reset({
          partnerId: settlement.partnerId,
          warehouseId: settlement.warehouseId,
          periodFrom: settlement.periodFrom?.slice(0, 10) ?? "",
          periodTo: settlement.periodTo?.slice(0, 10) ?? "",
          details: settlement.details?.length
            ? settlement.details
            : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
          notes: settlement.notes ?? "",
        });
      } else {
        reset({
          partnerId: "",
          warehouseId: "",
          periodFrom: "",
          periodTo: "",
          details: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
          notes: "",
        });
      }
    }
  }, [isOpen, settlement, reset]);

  // Auto-calculate amount
  const handleDetailChange = (index: number) => {
    const detail = watchDetails[index];
    if (detail) {
      const amount = (detail.quantity ?? 0) * (detail.unitPrice ?? 0);
      setValue(`details.${index}.amount`, amount);
    }
  };

  const onSubmit = async (data: SettlementFormData) => {
    try {
      if (isEdit && settlement) {
        await updateMutation.mutateAsync({ id: settlement.id, payload: data });
        addToast({ type: "success", message: "정산이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "정산이 등록되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "정산 수정" : "정산 등록"} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              거래처 <span className="text-red-500">*</span>
            </label>
            <select {...register("partnerId")} className={selectBase}>
              <option value="">선택해주세요</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.partnerId && (
              <p className="mt-1.5 text-xs text-red-500">{errors.partnerId.message}</p>
            )}
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              시작일 <span className="text-red-500">*</span>
            </label>
            <input {...register("periodFrom")} type="date" className={inputBase} />
            {errors.periodFrom && (
              <p className="mt-1.5 text-xs text-red-500">{errors.periodFrom.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              종료일 <span className="text-red-500">*</span>
            </label>
            <input {...register("periodTo")} type="date" className={inputBase} />
            {errors.periodTo && (
              <p className="mt-1.5 text-xs text-red-500">{errors.periodTo.message}</p>
            )}
          </div>
        </div>

        {/* Detail items */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-[#191F28]">정산 항목</label>
            <button
              type="button"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0, amount: 0 })}
              className="flex items-center gap-1 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-xs font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
            >
              <Plus className="h-3.5 w-3.5" />
              항목 추가
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 rounded-xl bg-[#F7F8FA] p-4">
                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <input
                      {...register(`details.${index}.description`)}
                      placeholder="항목"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <input
                      {...register(`details.${index}.quantity`)}
                      type="number"
                      placeholder="수량"
                      className={inputBase}
                      onChange={(e) => {
                        register(`details.${index}.quantity`).onChange(e);
                        setTimeout(() => handleDetailChange(index), 0);
                      }}
                    />
                  </div>
                  <div>
                    <input
                      {...register(`details.${index}.unitPrice`)}
                      type="number"
                      placeholder="단가"
                      className={inputBase}
                      onChange={(e) => {
                        register(`details.${index}.unitPrice`).onChange(e);
                        setTimeout(() => handleDetailChange(index), 0);
                      }}
                    />
                  </div>
                  <div>
                    <input
                      {...register(`details.${index}.amount`)}
                      type="number"
                      placeholder="금액"
                      className={`${inputBase} bg-[#E5E8EB]`}
                      readOnly
                    />
                  </div>
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="mt-2 rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.details && (
            <p className="mt-1.5 text-xs text-red-500">
              {typeof errors.details.message === "string" ? errors.details.message : "항목을 확인해주세요"}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">비고</label>
          <textarea {...register("notes")} placeholder="비고" rows={2} className={inputBase} />
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
