"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useWarehouses, useCreateCycleCount } from "@/hooks/useApi";
import type { Warehouse } from "@/types";

interface CycleCountFormData {
  warehouseId: string;
  locationCode: string;
  itemCode: string;
  systemQty: number;
}

interface CycleCountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function CycleCountFormModal({
  isOpen,
  onClose,
  onSuccess,
}: CycleCountFormModalProps) {
  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const warehouses = (warehousesData?.data ?? []).filter(
    (w: Warehouse) => w.status === "ACTIVE"
  );
  const createMutation = useCreateCycleCount();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CycleCountFormData>({
    defaultValues: {
      warehouseId: "",
      locationCode: "",
      itemCode: "",
      systemQty: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (formData: CycleCountFormData) => {
    try {
      await createMutation.mutateAsync({
        warehouseId: formData.warehouseId,
        locationCode: formData.locationCode || undefined,
        itemCode: formData.itemCode || undefined,
        systemQty: Number(formData.systemQty),
      });
      onSuccess();
    } catch {
      // error handled by react-query
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="실사 등록" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 창고 */}
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

        {/* 로케이션 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            로케이션
          </label>
          <input
            {...register("locationCode")}
            placeholder="로케이션코드 (선택)"
            className={inputClass}
          />
        </div>

        {/* 품목코드 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            품목코드
          </label>
          <input
            {...register("itemCode")}
            placeholder="품목코드 (선택)"
            className={inputClass}
          />
        </div>

        {/* 시스템수량 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            시스템수량 <span className="text-[#F04452]">*</span>
          </label>
          <input
            type="number"
            {...register("systemQty", {
              required: "시스템수량을 입력해주세요",
              valueAsNumber: true,
              min: { value: 0, message: "0 이상의 값을 입력해주세요" },
            })}
            placeholder="현재 시스템 수량"
            className={inputClass}
          />
          {errors.systemQty && (
            <p className="mt-1 text-xs text-[#F04452]">{errors.systemQty.message}</p>
          )}
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
