"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useCompleteCycleCount } from "@/hooks/useApi";
import type { CycleCount } from "@/types";

interface CompleteFormData {
  countedQty: number;
  countedBy: string;
  notes: string;
}

interface CycleCountCompleteModalProps {
  isOpen: boolean;
  cycleCount: CycleCount | null;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function CycleCountCompleteModal({
  isOpen,
  cycleCount,
  onClose,
  onSuccess,
}: CycleCountCompleteModalProps) {
  const completeMutation = useCompleteCycleCount();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompleteFormData>({
    defaultValues: {
      countedQty: 0,
      countedBy: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ countedQty: 0, countedBy: "", notes: "" });
    }
  }, [isOpen, reset]);

  const onSubmit = async (formData: CompleteFormData) => {
    if (!cycleCount) return;
    try {
      await completeMutation.mutateAsync({
        id: cycleCount.id,
        payload: {
          countedQty: Number(formData.countedQty),
          countedBy: formData.countedBy,
          notes: formData.notes || undefined,
        },
      });
      onSuccess();
    } catch {
      // error handled by react-query
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="실사 완료 처리" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 실사수량 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            실사수량 <span className="text-[#F04452]">*</span>
          </label>
          <input
            type="number"
            {...register("countedQty", {
              required: "실사수량을 입력해주세요",
              valueAsNumber: true,
              min: { value: 0, message: "0 이상의 값을 입력해주세요" },
            })}
            placeholder="실제 수량 입력"
            className={inputClass}
          />
          {errors.countedQty && (
            <p className="mt-1 text-xs text-[#F04452]">{errors.countedQty.message}</p>
          )}
        </div>

        {/* 담당자 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
            담당자 <span className="text-[#F04452]">*</span>
          </label>
          <input
            {...register("countedBy", { required: "담당자를 입력해주세요" })}
            placeholder="담당자명"
            className={inputClass}
          />
          {errors.countedBy && (
            <p className="mt-1 text-xs text-[#F04452]">{errors.countedBy.message}</p>
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
          <Button type="submit" isLoading={completeMutation.isPending}>
            완료 처리
          </Button>
        </div>
      </form>
    </Modal>
  );
}
