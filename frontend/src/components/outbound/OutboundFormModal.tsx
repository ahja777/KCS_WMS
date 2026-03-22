"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, AlertCircle, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ItemSearchPopup from "@/components/ui/ItemSearchPopup";
import { usePartners, useWarehouses, useItems, useCreateOutboundOrder } from "@/hooks/useApi";
import type { Partner, Warehouse, Item } from "@/types";

interface OutboundLineForm {
  itemId: string;
  orderedQty: number;
  notes?: string;
}

interface OutboundFormData {
  orderNumber: string;
  partnerId: string;
  warehouseId: string;
  shipDate: string;
  shippingMethod: string;
  notes: string;
  items: OutboundLineForm[];
}

interface OutboundFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OutboundFormModal({
  isOpen,
  onClose,
  onSuccess,
}: OutboundFormModalProps) {
  const [activeTab, setActiveTab] = useState<"standard" | "quick">("standard");
  const [itemSearch, setItemSearch] = useState("");
  const [activeItemDropdown, setActiveItemDropdown] = useState<number | null>(null);

  // Quick tab state
  const [quickWarehouseId, setQuickWarehouseId] = useState("");
  const [quickPartnerId, setQuickPartnerId] = useState("");
  const [quickShipDate, setQuickShipDate] = useState("");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [quickQty, setQuickQty] = useState<Record<string, number>>({});
  const [quickError, setQuickError] = useState("");

  const { data: partnersData } = usePartners({ limit: 100 });
  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const { data: itemsData } = useItems({ limit: 200 });
  const createMutation = useCreateOutboundOrder();

  const partners = (partnersData?.data ?? []).filter((p: Partner) => p.isActive);
  const warehouses = (warehousesData?.data ?? []).filter((w: Warehouse) => w.status === "ACTIVE");
  const allItems = (itemsData?.data ?? []).filter((i: Item) => i.isActive);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<OutboundFormData>({
    defaultValues: {
      orderNumber: "",
      partnerId: "",
      warehouseId: "",
      shipDate: "",
      shippingMethod: "",
      notes: "",
      items: [{ itemId: "", orderedQty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");


  const filteredItems = allItems.filter(
    (item: Item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.code.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const quickFilteredItems = useMemo(
    () =>
      allItems.filter(
        (item: Item) =>
          item.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
          item.code.toLowerCase().includes(quickSearch.toLowerCase())
      ),
    [allItems, quickSearch]
  );

  const getItemById = (id: string) => allItems.find((i: Item) => i.id === id);

  const onSubmit = async (data: OutboundFormData) => {
    try {
      await createMutation.mutateAsync({
        orderNumber: data.orderNumber,
        partnerId: data.partnerId,
        warehouseId: data.warehouseId,
        shipDate: data.shipDate ? new Date(data.shipDate).toISOString() : undefined,
        shippingMethod: data.shippingMethod || undefined,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          itemId: item.itemId,
          orderedQty: Number(item.orderedQty),
        })),
      } as any);
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      // error handled by mutation
    }
  };

  const handleQuickSubmit = async () => {
    setQuickError("");
    if (!quickWarehouseId) {
      setQuickError("창고를 선택해주세요.");
      return;
    }
    if (!quickPartnerId) {
      setQuickError("고객사를 선택해주세요.");
      return;
    }

    const itemsWithQty = Object.entries(quickQty)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, orderedQty: qty }));

    if (itemsWithQty.length === 0) {
      setQuickError("수량이 입력된 품목이 없습니다.");
      return;
    }

    const now = new Date();
    const orderNumber = `OB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

    try {
      await createMutation.mutateAsync({
        orderNumber,
        partnerId: quickPartnerId,
        warehouseId: quickWarehouseId,
        shipDate: quickShipDate ? new Date(quickShipDate).toISOString() : undefined,
        notes: quickNotes || undefined,
        items: itemsWithQty,
      } as any);
      resetQuick();
      onSuccess();
      onClose();
    } catch (err: any) {
      // error handled by mutation
    }
  };

  const resetQuick = () => {
    setQuickWarehouseId("");
    setQuickPartnerId("");
    setQuickShipDate("");
    setQuickNotes("");
    setQuickSearch("");
    setQuickQty({});
    setQuickError("");
  };

  const handleClose = () => {
    reset();
    setItemSearch("");
    setActiveItemDropdown(null);
    resetQuick();
    setActiveTab("standard");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="출고 등록" size="xl">
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("standard")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${activeTab === "standard" ? "bg-white text-[#191F28] shadow-sm" : "text-[#8B95A1]"}`}
        >
          출고주문
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("quick")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${activeTab === "quick" ? "bg-white text-[#191F28] shadow-sm" : "text-[#8B95A1]"}`}
        >
          간편출고
        </button>
      </div>

      {activeTab === "standard" ? (
        /* ── Tab 1: Standard form (existing) ── */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {createMutation.error && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFEAED]/50 p-4 text-sm text-[#F04452]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {(createMutation.error as any)?.response?.data?.message ??
                "등록 중 오류가 발생했습니다."}
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#4E5968]">
                주문번호 <span className="text-[#F04452]">*</span>
              </label>
              <input
                {...register("orderNumber", { required: "주문번호를 입력해주세요" })}
                placeholder="예: OB-20260321-0001"
                className="mt-2 w-full rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder:text-[#B0B8C1] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              />
              {errors.orderNumber && (
                <p className="mt-1 text-xs text-[#F04452]">{errors.orderNumber.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-[#4E5968]">출고일</label>
              <input
                type="date"
                {...register("shipDate")}
                className="mt-2 w-full rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#4E5968]">
                고객사 <span className="text-[#F04452]">*</span>
              </label>
              <select
                {...register("partnerId", { required: "고객사를 선택해주세요" })}
                className="mt-2 w-full rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="">고객사 선택</option>
                {partners.map((p: Partner) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
              {errors.partnerId && (
                <p className="mt-1 text-xs text-[#F04452]">{errors.partnerId.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-[#4E5968]">
                출고 창고 <span className="text-[#F04452]">*</span>
              </label>
              <select
                {...register("warehouseId", { required: "창고를 선택해주세요" })}
                className="mt-2 w-full rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="">창고 선택</option>
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#4E5968]">배송방법</label>
              <input
                {...register("shippingMethod")}
                placeholder="예: 택배, 화물, 직접배송"
                className="mt-2 w-full rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder:text-[#B0B8C1] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#4E5968]">비고</label>
              <input
                {...register("notes")}
                placeholder="비고 사항 입력"
                className="mt-2 w-full rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder:text-[#B0B8C1] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-[#191F28]">
                출고 품목 <span className="text-[#F04452]">*</span>
              </label>
              <button
                type="button"
                onClick={() => append({ itemId: "", orderedQty: 1 })}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#3182F6] transition-colors hover:bg-[#E8F3FF]"
              >
                <Plus className="h-3.5 w-3.5" />
                품목 추가
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const selectedItem = getItemById(watchItems?.[index]?.itemId);
                return (
                  <div
                    key={field.id}
                    className="flex items-start gap-3 rounded-xl bg-[#F7F8FA] p-4"
                  >
                    <div className="flex-1">
                      <label className="text-xs text-[#8B95A1]">품목</label>
                      {selectedItem ? (
                        <div className="mt-1 flex items-center justify-between rounded-lg bg-white px-3 py-2.5">
                          <div>
                            <span className="text-sm font-medium text-[#191F28]">
                              {selectedItem.name}
                            </span>
                            <span className="ml-2 text-xs text-[#8B95A1]">
                              {selectedItem.code}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setValue(`items.${index}.itemId`, "");
                              setActiveItemDropdown(index);
                            }}
                            className="text-xs text-[#3182F6] hover:underline"
                          >
                            변경
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveItemDropdown(index)}
                          className="mt-1 flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm text-[#8B95A1] transition-colors hover:bg-[#F2F4F6]"
                        >
                          <Search className="h-3.5 w-3.5" />
                          품목 검색...
                        </button>
                      )}
                      <input
                        type="hidden"
                        {...register(`items.${index}.itemId`, {
                          required: "품목을 선택해주세요",
                        })}
                      />
                      {errors.items?.[index]?.itemId && (
                        <p className="mt-1 text-xs text-[#F04452]">
                          {errors.items[index]?.itemId?.message}
                        </p>
                      )}
                    </div>

                    <div className="w-32">
                      <label className="text-xs text-[#8B95A1]">수량</label>
                      <input
                        type="number"
                        min={1}
                        {...register(`items.${index}.orderedQty`, {
                          required: "수량 입력",
                          min: { value: 1, message: "1 이상" },
                          valueAsNumber: true,
                        })}
                        className="mt-1 w-full rounded-lg bg-white px-3 py-2.5 text-center text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
                      />
                      {errors.items?.[index]?.orderedQty && (
                        <p className="mt-1 text-xs text-[#F04452]">
                          {errors.items[index]?.orderedQty?.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fields.length > 1 && remove(index)}
                      disabled={fields.length <= 1}
                      className="mt-6 rounded-lg p-2 text-[#B0B8C1] transition-colors hover:bg-[#FFEAED] hover:text-[#F04452] disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-[#F2F4F6] pt-5">
            <Button type="button" variant="secondary" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              출고 등록
            </Button>
          </div>

          {/* Item Search Popup */}
          <ItemSearchPopup
            isOpen={activeItemDropdown !== null}
            onClose={() => setActiveItemDropdown(null)}
            onSelect={(item: Item) => {
              if (activeItemDropdown !== null) {
                setValue(`items.${activeItemDropdown}.itemId`, item.id);
                setActiveItemDropdown(null);
              }
            }}
            excludeIds={watchItems?.map((i) => i.itemId).filter(Boolean) ?? []}
          />
        </form>
      ) : (
        /* ── Tab 2: Quick entry form ── */
        <div className="space-y-6">
          {(createMutation.error || quickError) && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFEAED]/50 p-4 text-sm text-[#F04452]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {quickError ||
                ((createMutation.error as any)?.response?.data?.message ??
                  "등록 중 오류가 발생했습니다.")}
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-[#4E5968]">
                출고 창고 <span className="text-[#F04452]">*</span>
              </label>
              <select
                value={quickWarehouseId}
                onChange={(e) => setQuickWarehouseId(e.target.value)}
                className="mt-2 w-full appearance-none rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="">창고 선택</option>
                {warehouses.map((w: Warehouse) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#4E5968]">
                고객사 <span className="text-[#F04452]">*</span>
              </label>
              <select
                value={quickPartnerId}
                onChange={(e) => setQuickPartnerId(e.target.value)}
                className="mt-2 w-full appearance-none rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="">고객사 선택</option>
                {partners.map((p: Partner) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#4E5968]">출고일</label>
              <input
                type="date"
                value={quickShipDate}
                onChange={(e) => setQuickShipDate(e.target.value)}
                className="mt-2 w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#4E5968]">비고</label>
            <input
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              placeholder="비고 사항 입력"
              className="mt-2 w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* Searchable item table */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-[#191F28]">
                품목 목록
              </label>
              <span className="text-xs text-[#8B95A1]">
                수량 입력된 품목: {Object.values(quickQty).filter((q) => q > 0).length}개
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
              <input
                type="text"
                placeholder="품목코드 또는 품목명 검색..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-[#E5E8EB]">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#F7F8FA]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">품목코드</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">품목명</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#8B95A1]">현재고</th>
                    <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-[#8B95A1]">주문수량</th>
                  </tr>
                </thead>
                <tbody>
                  {quickFilteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#8B95A1]">
                        검색 결과 없음
                      </td>
                    </tr>
                  ) : (
                    quickFilteredItems.map((item: Item) => (
                      <tr
                        key={item.id}
                        className={`border-t border-[#F2F4F6] transition-colors ${(quickQty[item.id] ?? 0) > 0 ? "bg-[#E8F3FF]/40" : "hover:bg-[#F7F8FA]"}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-[#4E5968]">{item.code}</td>
                        <td className="px-4 py-3 text-sm text-[#191F28]">{item.name}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#8B95A1]">-</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            value={quickQty[item.id] ?? ""}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setQuickQty((prev) => ({ ...prev, [item.id]: val }));
                            }}
                            className="w-full rounded-lg border-0 bg-white px-3 py-2 text-center text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-[#F2F4F6] pt-5">
            <Button type="button" variant="secondary" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="button"
              isLoading={createMutation.isPending}
              onClick={handleQuickSubmit}
            >
              간편 출고 등록
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
