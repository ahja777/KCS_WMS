"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import { useCreateWarehouse, useUpdateWarehouse, useWarehouses } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Warehouse } from "@/types";

const warehouseSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "창고명을 입력해주세요"),
  country: z.string().min(1, "국가를 입력해주세요"),
  city: z.string().min(1, "도시를 입력해주세요"),
  address: z.string().min(1, "주소를 입력해주세요"),
  zipCode: z.string().optional(),
  timezone: z.string().min(1, "시간대를 선택해주세요"),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("올바른 이메일 형식을 입력해주세요")
    .or(z.literal(""))
    .optional(),
  notes: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse?: Warehouse;
  onSuccess: () => void;
}

const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Asia/Seoul", label: "Asia/Seoul" },
];

const statusOptions = [
  { value: "ACTIVE", label: "활성" },
  { value: "INACTIVE", label: "비활성" },
  { value: "MAINTENANCE", label: "점검중" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function WarehouseFormModal({
  isOpen,
  onClose,
  warehouse,
  onSuccess,
}: WarehouseFormModalProps) {
  const isEdit = !!warehouse;

  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();

  const { data: warehouseListRes } = useWarehouses({ limit: 100 });
  const existingWarehouses = warehouseListRes?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      code: "",
      name: "",
      country: "",
      city: "",
      address: "",
      zipCode: "",
      timezone: "UTC",
      status: "ACTIVE",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
    },
  });

  const watchedCode = watch("code");
  const isDuplicateCode = !isEdit && !!watchedCode && existingWarehouses.some(w => w.code === watchedCode);

  useEffect(() => {
    if (isOpen) {
      if (warehouse) {
        reset({
          code: warehouse.code,
          name: warehouse.name,
          country: warehouse.country,
          city: warehouse.city,
          address: warehouse.address,
          zipCode: warehouse.zipCode ?? "",
          timezone: warehouse.timezone,
          status: warehouse.status,
          contactName: warehouse.contactName ?? "",
          contactPhone: warehouse.contactPhone ?? "",
          contactEmail: warehouse.contactEmail ?? "",
          notes: warehouse.notes ?? "",
        });
      } else {
        reset({
          code: "",
          name: "",
          country: "",
          city: "",
          address: "",
          zipCode: "",
          timezone: "UTC",
          status: "ACTIVE",
          contactName: "",
          contactPhone: "",
          contactEmail: "",
          notes: "",
        });
      }
    }
  }, [isOpen, warehouse, reset]);

  const onSubmit = async (data: WarehouseFormData) => {
    if (isDuplicateCode) {
      addToast({ type: "error", message: "이미 사용중인 코드입니다." });
      return;
    }
    try {
      if (isEdit && warehouse) {
        await updateMutation.mutateAsync({
          id: warehouse.id,
          payload: data,
        });
        addToast({ type: "success", message: "저장이 완료되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "저장이 완료되었습니다." });
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
      title={isEdit ? "창고 수정" : "창고 등록"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Code & Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              창고 코드 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("code")}
              placeholder={isEdit ? "창고코드" : "미입력시 자동생성"}
              className={inputBase}
              disabled={isEdit}
            />
            {errors.code && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.code.message}
              </p>
            )}
            {isDuplicateCode && (
              <p className="mt-1.5 text-xs text-red-500">이미 사용중인 코드입니다</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              창고명 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="창고명 입력"
              className={inputBase}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>
        </div>

        {/* Country & City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              국가 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("country")}
              placeholder="국가 입력"
              className={inputBase}
            />
            {errors.country && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.country.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              도시 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("city")}
              placeholder="도시 입력"
              className={inputBase}
            />
            {errors.city && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.city.message}
              </p>
            )}
          </div>
        </div>

        {/* Address & Zip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              주소 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("address")}
              placeholder="주소 입력"
              className={inputBase}
            />
            {errors.address && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.address.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              우편번호
            </label>
            <input
              {...register("zipCode")}
              placeholder="우편번호"
              className={inputBase}
            />
          </div>
        </div>

        {/* Timezone & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              시간대 <span className="text-red-500">*</span>
            </label>
            <select {...register("timezone")} className={selectBase}>
              {timezoneOptions.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.timezone.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              상태
            </label>
            <select {...register("status")} className={selectBase}>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              담당자명
            </label>
            <input
              {...register("contactName")}
              placeholder="담당자명"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              연락처
            </label>
            <input
              {...register("contactPhone")}
              placeholder="연락처"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              이메일
            </label>
            <input
              {...register("contactEmail")}
              placeholder="이메일"
              className={inputBase}
            />
            {errors.contactEmail && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            비고
          </label>
          <textarea
            {...register("notes")}
            placeholder="비고 입력"
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
