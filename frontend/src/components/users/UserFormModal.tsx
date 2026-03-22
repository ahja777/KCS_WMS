"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import { useCreateUser, useUpdateUser } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { User } from "@/types";

const baseSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일 형식을 입력해주세요"),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR", "VIEWER"]),
  isActive: z.boolean(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

const editSchema = baseSchema.extend({
  password: z
    .string()
    .min(6, "비밀번호는 6자 이상이어야 합니다")
    .or(z.literal(""))
    .optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;
type UserFormData = CreateFormData | EditFormData;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}

const roleOptions = [
  { value: "ADMIN", label: "관리자" },
  { value: "MANAGER", label: "매니저" },
  { value: "OPERATOR", label: "운영자" },
  { value: "VIEWER", label: "뷰어" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function UserFormModal({
  isOpen,
  onClose,
  user,
}: UserFormModalProps) {
  const isEdit = !!user;
  const addToast = useToastStore((s) => s.addToast);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const submitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "OPERATOR",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          password: "",
          role: user.role,
          isActive: user.isActive,
        });
      } else {
        reset({
          name: "",
          email: "",
          password: "",
          role: "OPERATOR",
          isActive: true,
        });
      }
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEdit && user) {
        const payload: Record<string, unknown> = {
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
        };
        if (data.password) {
          payload.password = data.password;
        }
        await updateMutation.mutateAsync({ id: user.id, payload });
        addToast({ type: "success", message: "사용자가 수정되었습니다." });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password as string,
          role: data.role,
          isActive: data.isActive,
        });
        addToast({ type: "success", message: "사용자가 등록되었습니다." });
      }
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
      title={isEdit ? "사용자 수정" : "사용자 등록"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            placeholder="이름 입력"
            className={inputBase}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="이메일 입력"
            className={inputBase}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            비밀번호{" "}
            {!isEdit && <span className="text-red-500">*</span>}
            {isEdit && (
              <span className="text-[#8B95A1] font-normal">
                (변경 시에만 입력)
              </span>
            )}
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder={isEdit ? "변경할 비밀번호 입력" : "비밀번호 입력"}
            className={inputBase}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            역할 <span className="text-red-500">*</span>
          </label>
          <select {...register("role")} className={selectBase}>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
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
            disabled={submitting}
            className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            {submitting ? "처리중..." : isEdit ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
