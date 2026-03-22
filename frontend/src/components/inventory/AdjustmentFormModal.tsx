"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useWarehouses, useCreateAdjustment } from "@/hooks/useApi";
import type { Warehouse } from "@/types";

interface AdjustmentFormData {
  warehouseId: string;
  itemCode: string;
  locationCode: string;
  lotNo: string;
  adjustQty: number;
  reason: string;
  notes: string;
  performedBy: string;
}

interface AdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_OPTIONS = [
  { value: "DAMAGE", label: "파손" },
  { value: "LOSS", label: "분실" },
  { value: "FOUND", label: "발견" },
  { value: "CORRECTION", label: "보정" },
  { value: "RETURN", label: "반품" },
  { value: "EXPIRED", label: "유효기간 만료" },
];

const inputClass =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function AdjustmentFormModal({
  isOpen,
  onClose,
  onSuccess,
}: AdjustmentFormModalProps) {
  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const warehouses = (warehousesData?.data ?? []).filter(
    (w: Warehouse) => w.status === "ACTIVE"
  );
  const createMutation = useCreateAdjustment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdjustmentFormData>({
    defaultValues: {
      warehouseId: "",
      itemCode: "",
      locationCode: "",
      lotNo: "",
      adjustQty: 0,
      reason: "CORRECTION",
      notes: "",
      performedBy: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (formData: AdjustmentFormData) => {
    try {
      await createMutation.mutateAsync({
        warehouseId: formData.warehouseId,
        itemCode: formData.itemCode,
        locationCode: formData.locationCode || undefined,
        lotNo: formData.lotNo || undefined,
        adjustQty: Number(formData.adjustQty),
        reason: formData.reason,
        notes: formData.notes || undefined,
        performedBy: formData.performedBy,
      });
      onSuccess();
    } catch {
      // error handled by react-query
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="재고 조정" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 창고 선택 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            창고 <span className="text-[#F04452]">*</span>
          </label>
          <select
            {...register("warehouseId", { required: "창고를 선택해주세요" })}
            className={inputClass}
          >
            <option value="">선택하세요</option>
            {warehouses.map((w: Warehouse) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
          {errors.warehouseId && (
            <p className="mt-1 text-xs text-[#F04452]">{errors.warehouseId.message}</p>
          )}
        </div>

        {/* 품목코드 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            품목코드 <span className="text-[#F04452]">*</span>
          </label>
          <input
            {...register("itemCode", { required: "품목코드를 입력해주세요" })}
            placeholder="품목코드 입력"
            className={inputClass}
          />
          {errors.itemCode && (
            <p className="mt-1 text-xs text-[#F04452]">{errors.itemCode.message}</p>
          )}
        </div>

        {/* 로케이션 + LOT번호 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              로케이션코드
            </label>
            <input
              {...register("locationCode")}
              placeholder="로케이션코드 (선택)"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              LOT번호
            </label>
            <input
              {...register("lotNo")}
              placeholder="LOT번호 (선택)"
              className={inputClass}
            />
          </div>
        </div>

        {/* 조정수량 + 사유 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              조정수량 (+/-) <span className="text-[#F04452]">*</span>
            </label>
            <input
              type="number"
              {...register("adjustQty", {
                required: "조정수량을 입력해주세요",
                valueAsNumber: true,
                validate: (v) => v !== 0 || "0이 아닌 수량을 입력해주세요",
              })}
              placeholder="예: -5 또는 +10"
              className={inputClass}
            />
            {errors.adjustQty && (
              <p className="mt-1 text-xs text-[#F04452]">{errors.adjustQty.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              사유 <span className="text-[#F04452]">*</span>
            </label>
            <select
              {...register("reason", { required: "사유를 선택해주세요" })}
              className={inputClass}
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 담당자 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            담당자 <span className="text-[#F04452]">*</span>
          </label>
          <input
            {...register("performedBy", { required: "담당자를 입력해주세요" })}
            placeholder="담당자명"
            className={inputClass}
          />
          {errors.performedBy && (
            <p className="mt-1 text-xs text-[#F04452]">{errors.performedBy.message}</p>
          )}
        </div>

        {/* 비고 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            비고
          </label>
          <textarea
            {...register("notes")}
            placeholder="비고 사항 (선택)"
            rows={3}
            className={inputClass}
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            등록
          </Button>
        </div>
      </form>
    </Modal>
  );
}
