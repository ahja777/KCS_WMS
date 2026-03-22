"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import { useCreateLocation, useUpdateLocation } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Location } from "@/types";

const locationSchema = z.object({
  code: z
    .string()
    .min(1, "로케이션 코드를 입력해주세요")
    .regex(/^[A-Za-z0-9-]+$/, "영문, 숫자, 하이픈만 입력 가능합니다"),
  aisle: z.string().min(1, "통로를 입력해주세요"),
  rack: z.string().min(1, "랙을 입력해주세요"),
  level: z.string().min(1, "레벨을 입력해주세요"),
  bin: z.string().min(1, "빈을 입력해주세요"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "BLOCKED"]),
  maxWeight: z.coerce.number().min(0, "0 이상이어야 합니다").optional().or(z.literal("")),
  maxVolume: z.coerce.number().min(0, "0 이상이어야 합니다").optional().or(z.literal("")),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location;
  warehouseId: string;
  zoneId: string;
  onSuccess: () => void;
}

const statusOptions = [
  { value: "AVAILABLE", label: "사용가능" },
  { value: "OCCUPIED", label: "사용중" },
  { value: "RESERVED", label: "예약" },
  { value: "BLOCKED", label: "차단" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function LocationFormModal({
  isOpen,
  onClose,
  location,
  warehouseId,
  zoneId,
  onSuccess,
}: LocationFormModalProps) {
  const isEdit = !!location;

  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateLocation(warehouseId, zoneId);
  const updateMutation = useUpdateLocation(warehouseId, zoneId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      code: "",
      aisle: "",
      rack: "",
      level: "",
      bin: "",
      status: "AVAILABLE",
      maxWeight: "",
      maxVolume: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (location) {
        reset({
          code: location.code,
          aisle: location.aisle,
          rack: location.rack,
          level: location.level,
          bin: location.bin,
          status: location.status,
          maxWeight: location.maxWeight ?? "",
          maxVolume: location.maxVolume ?? "",
        });
      } else {
        reset({
          code: "",
          aisle: "",
          rack: "",
          level: "",
          bin: "",
          status: "AVAILABLE",
          maxWeight: "",
          maxVolume: "",
        });
      }
    }
  }, [isOpen, location, reset]);

  const onSubmit = async (data: LocationFormData) => {
    try {
      const payload = {
        ...data,
        maxWeight: data.maxWeight === "" ? undefined : Number(data.maxWeight),
        maxVolume: data.maxVolume === "" ? undefined : Number(data.maxVolume),
      };

      if (isEdit && location) {
        await updateMutation.mutateAsync({
          id: location.id,
          payload,
        });
        addToast({ type: "success", message: "로케이션이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(payload);
        addToast({ type: "success", message: "로케이션이 등록되었습니다." });
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
      title={isEdit ? "로케이션 수정" : "로케이션 등록"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Code & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              로케이션 코드 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("code")}
              placeholder="예: A-01-01-01"
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
              상태
            </label>
            <select {...register("status")} className={selectBase}>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aisle, Rack, Level, Bin */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              통로 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("aisle")}
              placeholder="예: A"
              className={inputBase}
            />
            {errors.aisle && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.aisle.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              랙 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("rack")}
              placeholder="예: 01"
              className={inputBase}
            />
            {errors.rack && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.rack.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              레벨 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("level")}
              placeholder="예: 01"
              className={inputBase}
            />
            {errors.level && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.level.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              빈 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("bin")}
              placeholder="예: 01"
              className={inputBase}
            />
            {errors.bin && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.bin.message}
              </p>
            )}
          </div>
        </div>

        {/* Max Weight & Volume */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              최대 중량 (kg)
            </label>
            <input
              {...register("maxWeight")}
              type="number"
              step="0.01"
              placeholder="최대 중량"
              className={inputBase}
            />
            {errors.maxWeight && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.maxWeight.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              최대 부피 (m3)
            </label>
            <input
              {...register("maxVolume")}
              type="number"
              step="0.01"
              placeholder="최대 부피"
              className={inputBase}
            />
            {errors.maxVolume && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.maxVolume.message}
              </p>
            )}
          </div>
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
