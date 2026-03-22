"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { downloadExcel } from "@/lib/export";
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useItemGroups,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import type { Item } from "@/types";

const itemSchema = z.object({
  code: z.string().min(1, "상품코드를 입력해주세요"),
  name: z.string().min(1, "상품명을 입력해주세요"),
  category: z.enum([
    "GENERAL",
    "ELECTRONICS",
    "CLOTHING",
    "FOOD",
    "FRAGILE",
    "HAZARDOUS",
    "OVERSIZED",
  ]),
  barcode: z.string().optional(),
  uom: z.enum(["EA", "BOX", "PALLET", "CASE", "KG", "LB"]),
  weight: z.coerce.number().min(0).optional(),
  length: z.coerce.number().min(0).optional(),
  width: z.coerce.number().min(0).optional(),
  height: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0),
  maxStock: z.coerce.number().min(0).nullable().optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  storageType: z.string().optional(),
  inboundZone: z.string().optional(),
  lotControl: z.boolean().optional(),
  expiryControl: z.boolean().optional(),
  expiryDays: z.coerce.number().min(0).optional(),
  isActive: z.boolean(),
  itemGroupId: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

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

const storageTypeOptions = [
  { value: "", label: "선택" },
  { value: "AMBIENT", label: "상온" },
  { value: "COLD", label: "냉장" },
  { value: "FROZEN", label: "냉동" },
  { value: "HAZARDOUS", label: "위험물" },
];

const defaultFormValues: ItemFormData = {
  code: "",
  name: "",
  category: "GENERAL",
  barcode: "",
  uom: "EA",
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  minStock: 0,
  maxStock: 0,
  unitPrice: 0,
  storageType: "",
  inboundZone: "",
  lotControl: false,
  expiryControl: false,
  expiryDays: 0,
  isActive: true,
  itemGroupId: "",
};

const inputBase =
  "w-full rounded-lg border border-[#E5E8EB] bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-lg border border-[#E5E8EB] bg-white px-3 py-2 text-sm text-[#191F28] outline-none transition-all focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20 appearance-none";

const labelClass = "mb-1 block text-xs font-medium text-[#6B7684]";

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | undefined>();

  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("items");

  const { data: response, isLoading, error } = useItems({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const { data: itemGroupsResponse } = useItemGroups({ limit: 100 });
  const itemGroups = itemGroupsResponse?.data ?? [];

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const items = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const isEdit = !!selectedItem && !isNewMode;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultFormValues,
  });

  const isActive = watch("isActive");
  const lotControl = watch("lotControl");
  const expiryControl = watch("expiryControl");

  // Populate form when selecting an item
  useEffect(() => {
    if (selectedItem && !isNewMode) {
      reset({
        code: selectedItem.code,
        name: selectedItem.name,
        category: selectedItem.category,
        barcode: selectedItem.barcode ?? "",
        uom: selectedItem.uom,
        weight: selectedItem.weight ?? 0,
        length: selectedItem.length ?? 0,
        width: selectedItem.width ?? 0,
        height: selectedItem.height ?? 0,
        minStock: selectedItem.minStock ?? 0,
        maxStock: selectedItem.maxStock ?? 0,
        unitPrice: selectedItem.unitPrice ?? 0,
        storageType: selectedItem.storageType ?? "",
        inboundZone: selectedItem.inboundZone ?? "",
        lotControl: selectedItem.lotControl ?? false,
        expiryControl: selectedItem.expiryControl ?? false,
        expiryDays: selectedItem.expiryDays ?? 0,
        isActive: selectedItem.isActive,
        itemGroupId: selectedItem.itemGroupId ?? "",
      });
    }
  }, [selectedItem, isNewMode, reset]);

  const handleRowClick = (item: Item) => {
    setSelectedItem(item);
    setIsNewMode(false);
  };

  const handleNew = () => {
    setSelectedItem(null);
    setIsNewMode(true);
    reset(defaultFormValues);
  };

  const handleDeleteClick = () => {
    if (selectedItem) {
      setDeletingItem(selectedItem);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync(deletingItem.id);
      addToast({
        type: "success",
        message: `"${deletingItem.name}" 상품이 삭제되었습니다.`,
      });
      setSelectedItem(null);
      setIsNewMode(false);
      reset(defaultFormValues);
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingItem(undefined);
    }
  };

  const onSubmit = async (data: ItemFormData) => {
    try {
      if (isEdit && selectedItem) {
        await updateMutation.mutateAsync({
          id: selectedItem.id,
          payload: data,
        });
        addToast({ type: "success", message: "상품이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "상품이 등록되었습니다." });
        setIsNewMode(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "오류가 발생했습니다";
      addToast({ type: "error", message });
    }
  };

  const columns: Column<Item>[] = [
    { key: "code", header: "상품코드", sortable: true },
    { key: "name", header: "상품명", sortable: true },
    {
      key: "category",
      header: "상품군",
      sortable: true,
      render: (row) => {
        const cat = categoryOptions.find((c) => c.value === row.category);
        return cat?.label ?? row.category;
      },
    },
    {
      key: "unitPrice",
      header: "단가",
      render: (row) =>
        row.unitPrice != null
          ? row.unitPrice.toLocaleString()
          : "-",
    },
    {
      key: "inboundZone",
      header: "입고존",
      render: (row) => row.inboundZone || "-",
    },
    { key: "uom", header: "UOM" },
    {
      key: "barcode",
      header: "바코드",
      render: (row) => row.barcode || "-",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">상품정보관리</h1>
          <p className="mt-1 text-sm text-[#8B95A1]">
            기준관리 &gt; 상품정보관리
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="rounded-xl bg-white px-5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <label className="shrink-0 text-sm font-medium text-[#4E5968]">
            검색
          </label>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="상품코드, 상품명 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-[#E5E8EB] bg-[#F7F8FA] py-2 pl-10 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none focus:border-[#3182F6] focus:bg-white focus:ring-1 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Grid (상품목록) */}
        <div className="col-span-7 rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#F2F4F6] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#191F28]">상품목록</h2>
          </div>
          <div className="p-4">
            {error ? (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                데이터를 불러오는 중 오류가 발생했습니다.
              </div>
            ) : (
              <Table
                columns={columns}
                data={items}
                isLoading={isLoading}
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                onRowClick={handleRowClick}
                activeRowId={selectedItem?.id}
              />
            )}
          </div>
        </div>

        {/* Right: Detail Form (상품정보) */}
        <div className="col-span-5 rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#F2F4F6] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#191F28]">상품정보</h2>
          </div>
          <div className="p-5">
            {!selectedItem && !isNewMode ? (
              <div className="flex h-64 items-center justify-center text-sm text-[#8B95A1]">
                좌측 목록에서 상품을 선택하거나, 신규 버튼을 클릭하세요.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {/* Row 1: 상품코드, 상품명 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>상품코드</label>
                    <input
                      {...register("code")}
                      placeholder="상품코드"
                      className={inputBase}
                      disabled={isEdit}
                    />
                    {errors.code && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.code.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>상품명</label>
                    <input
                      {...register("name")}
                      placeholder="상품명"
                      className={inputBase}
                    />
                    {errors.name && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: 상품군, 카테고리 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>상품군</label>
                    <select {...register("itemGroupId")} className={selectBase}>
                      <option value="">선택</option>
                      {itemGroups.map((g: any) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>카테고리</label>
                    <select {...register("category")} className={selectBase}>
                      {categoryOptions.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: 바코드, 단위 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>바코드</label>
                    <input
                      {...register("barcode")}
                      placeholder="바코드"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>단위 (UOM)</label>
                    <select {...register("uom")} className={selectBase}>
                      {uomOptions.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 4: 무게, 길이, 폭, 높이 */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>무게(kg)</label>
                    <input
                      {...register("weight")}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>길이(cm)</label>
                    <input
                      {...register("length")}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>폭(cm)</label>
                    <input
                      {...register("width")}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>높이(cm)</label>
                    <input
                      {...register("height")}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className={inputBase}
                    />
                  </div>
                </div>

                {/* Row 5: 최소재고, 최대재고, 단가 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>최소재고</label>
                    <input
                      {...register("minStock")}
                      type="number"
                      placeholder="0"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>최대재고</label>
                    <input
                      {...register("maxStock")}
                      type="number"
                      placeholder="0"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>단가</label>
                    <input
                      {...register("unitPrice")}
                      type="number"
                      placeholder="0"
                      className={inputBase}
                    />
                  </div>
                </div>

                {/* Row 6: 보관유형, 입고존 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>보관유형</label>
                    <select {...register("storageType")} className={selectBase}>
                      {storageTypeOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>입고존</label>
                    <input
                      {...register("inboundZone")}
                      placeholder="입고존"
                      className={inputBase}
                    />
                  </div>
                </div>

                {/* Row 7: LOT관리, 유효기간관리, 유효기간일수 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      checked={lotControl ?? false}
                      onChange={(e) => setValue("lotControl", e.target.checked)}
                      className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]/20"
                    />
                    <label className="text-xs font-medium text-[#6B7684]">
                      LOT관리
                    </label>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      checked={expiryControl ?? false}
                      onChange={(e) =>
                        setValue("expiryControl", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]/20"
                    />
                    <label className="text-xs font-medium text-[#6B7684]">
                      유효기간관리
                    </label>
                  </div>
                  <div>
                    <label className={labelClass}>유효기간일수</label>
                    <input
                      {...register("expiryDays")}
                      type="number"
                      placeholder="0"
                      className={inputBase}
                      disabled={!expiryControl}
                    />
                  </div>
                </div>

                {/* Row 8: 상태 */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-medium text-[#6B7684]">
                    상태
                  </label>
                  <button
                    type="button"
                    onClick={() => setValue("isActive", !isActive)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                      isActive ? "bg-[#3182F6]" : "bg-[#D1D6DB]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        isActive ? "translate-x-[22px]" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                  <span className="text-xs text-[#4E5968]">
                    {isActive ? "활성" : "비활성"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 border-t border-[#F2F4F6] pt-4">
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="rounded-lg bg-[#DC2626] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C] disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "처리중..."
                      : "저장"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNew}
                    className="rounded-lg bg-[#3182F6] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
                  >
                    신규
                  </button>
                  {isEdit && perm.canDelete && (
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="rounded-lg bg-[#6B7684] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4E5968]"
                    >
                      삭제
                    </button>
                  )}
                  {perm.canExport && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadExcel(
                          "/export/items",
                          `상품목록_${new Date().toISOString().slice(0, 10)}.xlsx`
                        )
                      }
                      className="rounded-lg bg-[#22C55E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#16A34A]"
                    >
                      엑셀
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(undefined)}
        onConfirm={handleDeleteConfirm}
        title="상품 삭제"
        message={`"${deletingItem?.name}" 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
