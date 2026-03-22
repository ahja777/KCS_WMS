"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import { useCreateZone, useUpdateZone } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Zone, ZoneType } from "@/types";

const zoneSchema = z.object({
  code: z
    .string()
    .min(1, "구역 코드를 입력해주세요")
    .regex(/^[A-Za-z0-9-]+$/, "영문, 숫자, 하이픈만 입력 가능합니다"),
  name: z.string().min(1, "구역명을 입력해주세요"),
  type: z.string().min(1, "구역 유형을 선택해주세요"),
  description: z.string().optional(),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

interface ZoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone?: Zone;
  warehouseId: string;
  onSuccess: () => void;
}

const zoneTypeOptions = [
  { value: "RECEIVING", label: "입고" },
  { value: "STORAGE", label: "보관" },
  { value: "PICKING", label: "피킹" },
  { value: "PACKING", label: "패킹" },
  { value: "SHIPPING", label: "출하" },
  { value: "QUARANTINE", label: "격리" },
  { value: "RETURN", label: "반품" },
] as const;

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function ZoneFormModal({
  isOpen,
  onClose,
  zone,
  warehouseId,
  onSuccess,
}: ZoneFormModalProps) {
  const isEdit = !!zone;

  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateZone(warehouseId);
  const updateMutation = useUpdateZone(warehouseId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "STORAGE",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (zone) {
        reset({
          code: zone.code,
          name: zone.name,
          type: zone.type,
          description: zone.description ?? "",
        });
      } else {
        reset({
          code: "",
          name: "",
          type: "STORAGE",
          description: "",
        });
      }
    }
  }, [isOpen, zone, reset]);

  const onSubmit = async (data: ZoneFormData) => {
    try {
      const payload = { ...data, type: data.type as ZoneType };
      if (isEdit && zone) {
        await updateMutation.mutateAsync({
          id: zone.id,
          payload,
        });
        addToast({ type: "success", message: "구역이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(payload);
        addToast({ type: "success", message: "구역이 등록되었습니다." });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "오류가 발생했습니다";
      addToast({ type: "error", message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "구역 수정" : "구역 등록"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Code & Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              구역 코드 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("code")}
              placeholder="예: ZONE-A1"
              className={inputBase}
              disabled={isEdit}
            />
            {errors.code && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.code.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              구역명 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="구역명 입력"
              className={inputBase}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            구역 유형 <span className="text-red-500">*</span>
          </label>
          <select {...register("type")} className={selectBase}>
            {zoneTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            설명
          </label>
          <textarea
            {...register("description")}
            placeholder="구역 설명 입력"
            rows={3}
            className={`${inputBase} resize-none`}
          />
        </div>

        {/* Buttons */}
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
