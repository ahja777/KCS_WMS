"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import { useCreatePartner, useUpdatePartner } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Partner } from "@/types";

const partnerSchema = z.object({
  code: z.string().min(1, "파트너 코드를 입력해주세요"),
  name: z.string().min(1, "파트너명을 입력해주세요"),
  type: z.enum(["SUPPLIER", "CUSTOMER", "CARRIER"]),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("올바른 이메일 형식을 입력해주세요")
    .or(z.literal(""))
    .optional(),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: Partner;
  onSuccess: () => void;
}

const typeOptions = [
  { value: "SUPPLIER", label: "공급처" },
  { value: "CUSTOMER", label: "고객사" },
  { value: "CARRIER", label: "운송사" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function PartnerFormModal({
  isOpen,
  onClose,
  partner,
  onSuccess,
}: PartnerFormModalProps) {
  const isEdit = !!partner;

  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "SUPPLIER",
      country: "",
      city: "",
      address: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      isActive: true,
      notes: "",
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (isOpen) {
      if (partner) {
        reset({
          code: partner.code,
          name: partner.name,
          type: partner.type,
          country: partner.country ?? "",
          city: partner.city ?? "",
          address: partner.address ?? "",
          contactName: partner.contactName ?? "",
          contactPhone: partner.contactPhone ?? "",
          contactEmail: partner.contactEmail ?? "",
          isActive: partner.isActive,
          notes: partner.notes ?? "",
        });
      } else {
        reset({
          code: "",
          name: "",
          type: "SUPPLIER",
          country: "",
          city: "",
          address: "",
          contactName: "",
          contactPhone: "",
          contactEmail: "",
          isActive: true,
          notes: "",
        });
      }
    }
  }, [isOpen, partner, reset]);

  const onSubmit = async (data: PartnerFormData) => {
    try {
      if (isEdit && partner) {
        await updateMutation.mutateAsync({
          id: partner.id,
          payload: data,
        });
        addToast({ type: "success", message: "파트너가 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "파트너가 등록되었습니다." });
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
      title={isEdit ? "파트너 수정" : "파트너 등록"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Code & Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              파트너 코드 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("code")}
              placeholder="코드 입력"
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
              파트너명 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="파트너명 입력"
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
            유형 <span className="text-red-500">*</span>
          </label>
          <select {...register("type")} className={selectBase}>
            {typeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Country, City, Address */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              국가
            </label>
            <input
              {...register("country")}
              placeholder="국가"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              도시
            </label>
            <input
              {...register("city")}
              placeholder="도시"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              주소
            </label>
            <input
              {...register("address")}
              placeholder="주소"
              className={inputBase}
            />
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

        {/* isActive Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setValue("isActive", !isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
              isActive ? "bg-[#3182F6]" : "bg-[#D1D6DB]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isActive ? "translate-x-[22px]" : "translate-x-0.5"
              } mt-0.5`}
            />
          </button>
          <span className="text-sm font-medium text-[#4E5968]">
            {isActive ? "활성" : "비활성"}
          </span>
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
