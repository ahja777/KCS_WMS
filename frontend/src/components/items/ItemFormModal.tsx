"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/components/ui/Modal";
import { useCreateItem, useUpdateItem } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Item } from "@/types";

const itemSchema = z.object({
  code: z.string().min(1, "품목코드를 입력해주세요"),
  name: z.string().min(1, "품목명을 입력해주세요"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  category: z.enum([
    "GENERAL",
    "ELECTRONICS",
    "CLOTHING",
    "FOOD",
    "FRAGILE",
    "HAZARDOUS",
    "OVERSIZED",
  ]),
  uom: z.enum(["EA", "BOX", "PALLET", "CASE", "KG", "LB"]),
  weight: z.coerce.number().min(0, "0 이상 입력해주세요").optional(),
  length: z.coerce.number().min(0, "0 이상 입력해주세요").optional(),
  width: z.coerce.number().min(0, "0 이상 입력해주세요").optional(),
  height: z.coerce.number().min(0, "0 이상 입력해주세요").optional(),
  minStock: z.coerce.number().min(0, "0 이상 입력해주세요"),
  maxStock: z.coerce.number().min(0, "0 이상 입력해주세요").nullable().optional(),
  isActive: z.boolean(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Item;
  onSuccess: () => void;
}

const categoryOptions = [
  { value: "GENERAL", label: "일반" },
  { value: "ELECTRONICS", label: "전자제품" },
  { value: "CLOTHING", label: "의류" },
  { value: "FOOD", label: "식품" },
  { value: "FRAGILE", label: "파손주의" },
  { value: "HAZARDOUS", label: "위험물" },
  { value: "OVERSIZED", label: "대형" },
];

const uomOptions = [
  { value: "EA", label: "EA (개)" },
  { value: "BOX", label: "BOX (박스)" },
  { value: "PALLET", label: "PALLET (팔레트)" },
  { value: "CASE", label: "CASE (케이스)" },
  { value: "KG", label: "KG (킬로그램)" },
  { value: "LB", label: "LB (파운드)" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function ItemFormModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: ItemFormModalProps) {
  const isEdit = !!item;

  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      barcode: "",
      category: "GENERAL",
      uom: "EA",
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      minStock: 0,
      maxStock: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (isOpen) {
      if (item) {
        reset({
          code: item.code,
          name: item.name,
          description: item.description ?? "",
          barcode: item.barcode ?? "",
          category: item.category,
          uom: item.uom,
          weight: item.weight ?? 0,
          length: item.length ?? 0,
          width: item.width ?? 0,
          height: item.height ?? 0,
          minStock: item.minStock ?? 0,
          maxStock: item.maxStock ?? 0,
          isActive: item.isActive,
        });
      } else {
        reset({
          code: "",
          name: "",
          description: "",
          barcode: "",
          category: "GENERAL",
          uom: "EA",
          weight: 0,
          length: 0,
          width: 0,
          height: 0,
          minStock: 0,
          maxStock: 0,
          isActive: true,
        });
      }
    }
  }, [isOpen, item, reset]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({
          id: item.id,
          payload: data,
        });
        addToast({ type: "success", message: "품목이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "품목이 등록되었습니다." });
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
      title={isEdit ? "품목 수정" : "품목 등록"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Code & Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              품목코드 (SKU) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("code")}
              placeholder="SKU 코드 입력"
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
              품목명 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="품목명 입력"
              className={inputBase}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            설명
          </label>
          <input
            {...register("description")}
            placeholder="품목 설명"
            className={inputBase}
          />
        </div>

        {/* Barcode, Category, UOM */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              바코드
            </label>
            <input
              {...register("barcode")}
              placeholder="바코드"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              카테고리
            </label>
            <select {...register("category")} className={selectBase}>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              단위
            </label>
            <select {...register("uom")} className={selectBase}>
              {uomOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              무게 (kg)
            </label>
            <input
              {...register("weight")}
              type="number"
              step="0.01"
              placeholder="0"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              길이 (cm)
            </label>
            <input
              {...register("length")}
              type="number"
              step="0.01"
              placeholder="0"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              너비 (cm)
            </label>
            <input
              {...register("width")}
              type="number"
              step="0.01"
              placeholder="0"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              높이 (cm)
            </label>
            <input
              {...register("height")}
              type="number"
              step="0.01"
              placeholder="0"
              className={inputBase}
            />
          </div>
        </div>

        {/* Stock Levels */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              최소 재고
            </label>
            <input
              {...register("minStock")}
              type="number"
              placeholder="0"
              className={inputBase}
            />
            {errors.minStock && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.minStock.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              최대 재고
            </label>
            <input
              {...register("maxStock")}
              type="number"
              placeholder="0"
              className={inputBase}
            />
            {errors.maxStock && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.maxStock.message}
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
