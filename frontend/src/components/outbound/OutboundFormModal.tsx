"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, AlertCircle, Search, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ItemSearchPopup from "@/components/ui/ItemSearchPopup";
import InboundDataPopup from "@/components/outbound/InboundDataPopup";
import type { SelectedInboundItem } from "@/components/outbound/InboundDataPopup";
import {
  usePartners,
  useWarehouses,
  useItems,
  useCreateOutboundOrder,
  useUpdateOutboundOrder,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Partner, Warehouse, Item } from "@/types";

/* ── Shared style tokens ── */
const inputBase =
  "w-full rounded-xl border border-[#E5E8EB] bg-[#F7F8FA] px-3 py-2 text-sm text-[#191F28] placeholder:text-[#B0B8C1] outline-none transition-all focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const labelBase = "mb-1 block text-xs font-medium text-[#4E5968]";
const thBase =
  "px-3 py-2 text-left text-xs font-semibold text-[#8B95A1] whitespace-nowrap";
const tdBase = "px-3 py-1.5 text-sm text-[#191F28]";
const cellInput =
  "w-full rounded-lg border border-[#E5E8EB] bg-white px-2 py-1.5 text-sm text-[#191F28] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

/* ── Form types ── */
interface OutboundLineForm {
  itemId: string;
  lotNumber: string;
  orderedQty: number;
  orderWeight: number;
  uom: string;
  unitPrice: number;
  boxQty: number;
  pltQty: number;
  manufactureDate: string;
}

interface OutboundFormData {
  orderNumber: string;
  partnerId: string;
  shipDate: string;
  blNumber: string;
  deliveryPartnerId: string;
  orderType: string;
  paymentConfirmed: string;
  partnerOrderNumber: string;
  isUrgent: string;
  warehouseId: string;
  notes: string;
  items: OutboundLineForm[];
}

interface LocationRow {
  locationName: string;
  qty: number;
  uom: string;
  workId: string;
  workSeq: string;
  subSeq: string;
}

interface OutboundFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

const defaultLine: OutboundLineForm = {
  itemId: "",
  lotNumber: "",
  orderedQty: 0,
  orderWeight: 0,
  uom: "",
  unitPrice: 0,
  boxQty: 0,
  pltQty: 0,
  manufactureDate: "",
};

export default function OutboundFormModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: OutboundFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState<"standard" | "quick">("standard");
  const [activeItemDropdown, setActiveItemDropdown] = useState<number | null>(
    null
  );
  const [showInboundPopup, setShowInboundPopup] = useState(false);

  // Quick tab state
  const [quickWarehouseId, setQuickWarehouseId] = useState("");
  const [quickPartnerId, setQuickPartnerId] = useState("");
  const [quickShipDate, setQuickShipDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickNotes, setQuickNotes] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [quickQty, setQuickQty] = useState<Record<string, number>>({});
  const [quickError, setQuickError] = useState("");

  // Location section (display-only for now)
  const [locationRows] = useState<LocationRow[]>([]);

  const { data: partnersData } = usePartners({ limit: 100 });
  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const { data: itemsData } = useItems({ limit: 200 });
  const createMutation = useCreateOutboundOrder();
  const updateMutation = useUpdateOutboundOrder();

  const partners = (partnersData?.data ?? []).filter(
    (p: Partner) => p.isActive
  );
  const warehouses = (warehousesData?.data ?? []).filter(
    (w: Warehouse) => w.status === "ACTIVE"
  );
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
      shipDate: new Date().toISOString().split('T')[0],
      blNumber: "",
      deliveryPartnerId: "",
      orderType: "NORMAL",
      paymentConfirmed: "",
      partnerOrderNumber: "",
      isUrgent: "N",
      warehouseId: "",
      notes: "",
      items: [{ ...defaultLine }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const getItemById = (id: string) => allItems.find((i: Item) => i.id === id);

  const quickFilteredItems = useMemo(
    () =>
      allItems.filter(
        (item: Item) =>
          item.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
          item.code.toLowerCase().includes(quickSearch.toLowerCase())
      ),
    [allItems, quickSearch]
  );

  /* ── Submit handlers ── */
  const onSubmit = async (data: OutboundFormData) => {
    try {
      const payload: any = {
        ...(data.orderNumber ? { orderNumber: data.orderNumber } : {}),
        partnerId: data.partnerId,
        warehouseId: data.warehouseId,
        shipDate: data.shipDate
          ? new Date(data.shipDate).toISOString()
          : undefined,
        shippingMethod: data.orderType || undefined,
        notes: data.notes || undefined,
        items: data.items
          .filter((item) => item.itemId)
          .map((item) => ({
            itemId: item.itemId,
            orderedQty: Number(item.orderedQty) || 1,
            lotNumber: item.lotNumber || undefined,
          })),
      };

      if (editData?.id) {
        await updateMutation.mutateAsync({
          id: editData.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      addToast({ type: "success", message: "저장되었습니다." });
      handleReset();
      onSuccess();
      onClose();
    } catch {
      addToast({ type: "error", message: "저장 중 오류가 발생했습니다." });
    }
  };

  const handleQuickSubmit = async () => {
    setQuickError("");
    if (!quickPartnerId) {
      setQuickError("화주를 선택해주세요.");
      return;
    }
    if (!quickWarehouseId) {
      setQuickError("창고를 선택해주세요.");
      return;
    }

    const itemsWithQty = Object.entries(quickQty)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, orderedQty: qty }));

    if (itemsWithQty.length === 0) {
      setQuickError("수량이 입력된 품목이 없습니다.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        partnerId: quickPartnerId,
        warehouseId: quickWarehouseId,
        shipDate: quickShipDate
          ? new Date(quickShipDate).toISOString()
          : undefined,
        notes: quickNotes || undefined,
        items: itemsWithQty,
      } as any);
      addToast({ type: "success", message: "저장되었습니다." });
      resetQuick();
      onSuccess();
      onClose();
    } catch {
      addToast({ type: "error", message: "저장 중 오류가 발생했습니다." });
    }
  };

  const handleReset = () => {
    reset();
  };

  const resetQuick = () => {
    setQuickWarehouseId("");
    setQuickPartnerId("");
    setQuickShipDate(new Date().toISOString().split('T')[0]);
    setQuickNotes("");
    setQuickSearch("");
    setQuickQty({});
    setQuickError("");
  };

  const handleClose = () => {
    reset();
    setActiveItemDropdown(null);
    resetQuick();
    setActiveTab("standard");
    onClose();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="출고등록"
      size="xl"
      className="max-w-6xl"
    >
      {/* ── Tab bar ── */}
      <div className="mb-4 flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("standard")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            activeTab === "standard"
              ? "bg-white text-[#191F28] shadow-sm"
              : "text-[#8B95A1]"
          }`}
        >
          출고주문
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("quick")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            activeTab === "quick"
              ? "bg-white text-[#191F28] shadow-sm"
              : "text-[#8B95A1]"
          }`}
        >
          간편출고주문
        </button>
      </div>

      {activeTab === "standard" ? (
        /* ══════════════ Tab 1: 출고주문 ══════════════ */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {mutationError && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFEAED]/50 p-3 text-sm text-[#F04452]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {(mutationError as any)?.response?.data?.message ??
                "등록 중 오류가 발생했습니다."}
            </div>
          )}

          {/* ── Header fields (3-col grid, 3 rows) ── */}
          <div className="rounded-xl border border-[#E5E8EB] bg-white p-4">
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelBase}>
                  화주 <span className="text-[#F04452]">*</span>
                </label>
                <select
                  {...register("partnerId", {
                    required: "화주를 선택해주세요",
                  })}
                  className={inputBase}
                >
                  <option value="">화주 선택</option>
                  {partners.map((p: Partner) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                {errors.partnerId && (
                  <p className="mt-0.5 text-xs text-[#F04452]">
                    {errors.partnerId.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelBase}>출고요청일</label>
                <input
                  type="date"
                  {...register("shipDate")}
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>BL번호</label>
                <input
                  {...register("blNumber")}
                  placeholder="BL번호 입력"
                  className={inputBase}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <label className={labelBase}>배송처</label>
                <select
                  {...register("deliveryPartnerId")}
                  className={inputBase}
                >
                  <option value="">배송처 선택</option>
                  {partners.map((p: Partner) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelBase}>
                  주문구분 <span className="text-[#F04452]">*</span>
                </label>
                <select {...register("orderType")} className={inputBase}>
                  <option value="NORMAL">정상출고</option>
                  <option value="RETURN">반품출고</option>
                  <option value="SAMPLE">샘플출고</option>
                  <option value="TRANSFER">이관출고</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>대금결제여부</label>
                <select
                  {...register("paymentConfirmed")}
                  className={inputBase}
                >
                  <option value="">선택</option>
                  <option value="Y">결제완료</option>
                  <option value="N">미결제</option>
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <label className={labelBase}>화주주문번호</label>
                <input
                  {...register("partnerOrderNumber")}
                  placeholder="화주주문번호 입력"
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>긴급출고여부</label>
                <select {...register("isUrgent")} className={inputBase}>
                  <option value="N">N</option>
                  <option value="Y">Y</option>
                </select>
              </div>
              <div>
                <label className={labelBase}>
                  출고창고 <span className="text-[#F04452]">*</span>
                </label>
                <select
                  {...register("warehouseId", {
                    required: "출고창고를 선택해주세요",
                  })}
                  className={inputBase}
                >
                  <option value="">출고창고 선택</option>
                  {warehouses.map((w: Warehouse) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                {errors.warehouseId && (
                  <p className="mt-0.5 text-xs text-[#F04452]">
                    {errors.warehouseId.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Action buttons row ── */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                /* TODO: 신규배송처 */
              }}
            >
              신규배송처
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInboundPopup(true)}
            >
              입고내역
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              초기화
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isSaving}
            >
              저장
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                reset();
                // Clear for new entry
              }}
            >
              신규
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                /* TODO: delete */
              }}
              className="text-[#8B95A1]"
            >
              삭제
            </Button>
          </div>

          {/* ── 출고상품목록 (editable table) ── */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#191F28]">출고상품목록</h3>
              <button
                type="button"
                onClick={() => append({ ...defaultLine })}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#3182F6] transition-colors hover:bg-[#E8F3FF]"
              >
                <Plus className="h-3.5 w-3.5" />
                행 추가
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E5E8EB]">
              <table className="w-full min-w-[900px]">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className={`${thBase} w-10 text-center`}>
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className={`${thBase} w-10 text-center`}></th>
                    <th className={thBase}>LOT번호</th>
                    <th className={thBase}>상품코드</th>
                    <th className={thBase}>상품명</th>
                    <th className={`${thBase} text-right`}>수량</th>
                    <th className={`${thBase} text-right`}>주문중량</th>
                    <th className={thBase}>UOM</th>
                    <th className={`${thBase} text-right`}>단가</th>
                    <th className={`${thBase} text-right`}>BOX수량</th>
                    <th className={`${thBase} text-right`}>PLT수량</th>
                    <th className={thBase}>제조일자</th>
                    <th className={`${thBase} w-10`}></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-4 py-8 text-center text-sm text-[#8B95A1]"
                      >
                        출고 상품을 추가해주세요
                      </td>
                    </tr>
                  ) : (
                    fields.map((field, index) => {
                      const selectedItem = getItemById(
                        watchItems?.[index]?.itemId
                      );
                      return (
                        <tr
                          key={field.id}
                          className="border-t border-[#F2F4F6] hover:bg-[#FAFBFC]"
                        >
                          {/* checkbox */}
                          <td className={`${tdBase} text-center`}>
                            <input type="checkbox" className="rounded" />
                          </td>
                          {/* + button */}
                          <td className={`${tdBase} text-center`}>
                            <button
                              type="button"
                              onClick={() =>
                                append({ ...defaultLine })
                              }
                              className="rounded p-0.5 text-[#3182F6] hover:bg-[#E8F3FF]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </td>
                          {/* LOT번호 */}
                          <td className={tdBase}>
                            <input
                              {...register(`items.${index}.lotNumber`)}
                              placeholder="LOT"
                              className={cellInput}
                            />
                          </td>
                          {/* 상품코드 (with search) */}
                          <td className={tdBase}>
                            {selectedItem ? (
                              <button
                                type="button"
                                onClick={() => setActiveItemDropdown(index)}
                                className="flex w-full items-center gap-1 rounded-lg border border-[#E5E8EB] bg-white px-2 py-1.5 text-left text-sm text-[#191F28] hover:bg-[#F7F8FA]"
                              >
                                <Search className="h-3 w-3 shrink-0 text-[#8B95A1]" />
                                {selectedItem.code}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveItemDropdown(index)}
                                className="flex w-full items-center gap-1 rounded-lg border border-[#E5E8EB] bg-white px-2 py-1.5 text-left text-sm text-[#B0B8C1] hover:bg-[#F7F8FA]"
                              >
                                <Search className="h-3 w-3 shrink-0" />
                                검색
                              </button>
                            )}
                            <input
                              type="hidden"
                              {...register(`items.${index}.itemId`, {
                                required: "품목 선택 필요",
                              })}
                            />
                          </td>
                          {/* 상품명 */}
                          <td className={`${tdBase} text-[#4E5968]`}>
                            {selectedItem?.name ?? "-"}
                          </td>
                          {/* 수량 */}
                          <td className={tdBase}>
                            <input
                              type="number"
                              min={0}
                              {...register(`items.${index}.orderedQty`, {
                                valueAsNumber: true,
                              })}
                              className={`${cellInput} text-right`}
                            />
                          </td>
                          {/* 주문중량 */}
                          <td className={tdBase}>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              {...register(`items.${index}.orderWeight`, {
                                valueAsNumber: true,
                              })}
                              className={`${cellInput} text-right`}
                            />
                          </td>
                          {/* UOM */}
                          <td className={tdBase}>
                            <select
                              {...register(`items.${index}.uom`)}
                              className={cellInput}
                            >
                              <option value="">선택</option>
                              <option value="EA">EA</option>
                              <option value="BOX">BOX</option>
                              <option value="PALLET">PALLET</option>
                              <option value="CASE">CASE</option>
                              <option value="KG">KG</option>
                              <option value="LB">LB</option>
                            </select>
                          </td>
                          {/* 단가 */}
                          <td className={tdBase}>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              {...register(`items.${index}.unitPrice`, {
                                valueAsNumber: true,
                              })}
                              className={`${cellInput} text-right`}
                            />
                          </td>
                          {/* BOX수량 */}
                          <td className={tdBase}>
                            <input
                              type="number"
                              min={0}
                              {...register(`items.${index}.boxQty`, {
                                valueAsNumber: true,
                              })}
                              className={`${cellInput} text-right`}
                            />
                          </td>
                          {/* PLT수량 */}
                          <td className={tdBase}>
                            <input
                              type="number"
                              min={0}
                              {...register(`items.${index}.pltQty`, {
                                valueAsNumber: true,
                              })}
                              className={`${cellInput} text-right`}
                            />
                          </td>
                          {/* 제조일자 */}
                          <td className={tdBase}>
                            <input
                              type="date"
                              {...register(`items.${index}.manufactureDate`)}
                              className={cellInput}
                            />
                          </td>
                          {/* 삭제 */}
                          <td className={`${tdBase} text-center`}>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="rounded p-1 text-[#B0B8C1] transition-colors hover:bg-[#FFEAED] hover:text-[#F04452]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* pagination placeholder */}
            <div className="mt-2 flex items-center justify-between text-xs text-[#8B95A1]">
              <span>
                {fields.length}건
              </span>
            </div>
          </div>

          {/* ── 출고로케이션 section ── */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#191F28]">
              출고로케이션
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#E5E8EB]">
              <table className="w-full">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className={thBase}>로케이션명</th>
                    <th className={`${thBase} text-right`}>수량</th>
                    <th className={thBase}>UOM</th>
                    <th className={thBase}>WORK_ID</th>
                    <th className={thBase}>WORK_SEQ</th>
                    <th className={thBase}>SUBSEQ</th>
                  </tr>
                </thead>
                <tbody>
                  {locationRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-[#8B95A1]"
                      >
                        로케이션 정보가 없습니다
                      </td>
                    </tr>
                  ) : (
                    locationRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-[#F2F4F6] hover:bg-[#FAFBFC]"
                      >
                        <td className={tdBase}>{row.locationName}</td>
                        <td className={`${tdBase} text-right`}>{row.qty}</td>
                        <td className={tdBase}>{row.uom}</td>
                        <td className={tdBase}>{row.workId}</td>
                        <td className={tdBase}>{row.workSeq}</td>
                        <td className={tdBase}>{row.subSeq}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Item Search Popup */}
          <ItemSearchPopup
            isOpen={activeItemDropdown !== null}
            onClose={() => setActiveItemDropdown(null)}
            onSelect={(item: Item) => {
              if (activeItemDropdown !== null) {
                setValue(`items.${activeItemDropdown}.itemId`, item.id);
                if (item.uom) {
                  setValue(`items.${activeItemDropdown}.uom`, item.uom);
                }
                if (item.unitPrice) {
                  setValue(
                    `items.${activeItemDropdown}.unitPrice`,
                    item.unitPrice
                  );
                }
                setActiveItemDropdown(null);
              }
            }}
            excludeIds={watchItems?.map((i) => i.itemId).filter(Boolean) ?? []}
          />

          {/* Inbound Data Popup */}
          <InboundDataPopup
            isOpen={showInboundPopup}
            onClose={() => setShowInboundPopup(false)}
            onSelect={(items: SelectedInboundItem[]) => {
              if (items.length === 0) return;
              // Set partner and warehouse from the first selected item
              setValue("partnerId", items[0].partnerId);
              setValue("warehouseId", items[0].warehouseId);
              // Clear existing items and add new lines from inbound data
              const newLines: OutboundLineForm[] = items.map((item) => ({
                ...defaultLine,
                itemId: item.itemId,
                orderedQty: item.quantity,
                uom: item.uom,
              }));
              setValue("items", newLines);
            }}
          />
        </form>
      ) : (
        /* ══════════════ Tab 2: 간편출고주문 ══════════════ */
        <div className="space-y-5">
          {(createMutation.error || quickError) && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFEAED]/50 p-3 text-sm text-[#F04452]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {quickError ||
                ((createMutation.error as any)?.response?.data?.message ??
                  "등록 중 오류가 발생했습니다.")}
            </div>
          )}

          {/* Header fields */}
          <div className="rounded-xl border border-[#E5E8EB] bg-white p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelBase}>
                  화주 <span className="text-[#F04452]">*</span>
                </label>
                <select
                  value={quickPartnerId}
                  onChange={(e) => setQuickPartnerId(e.target.value)}
                  className={inputBase}
                >
                  <option value="">화주 선택</option>
                  {partners.map((p: Partner) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelBase}>
                  출고창고 <span className="text-[#F04452]">*</span>
                </label>
                <select
                  value={quickWarehouseId}
                  onChange={(e) => setQuickWarehouseId(e.target.value)}
                  className={inputBase}
                >
                  <option value="">출고창고 선택</option>
                  {warehouses.map((w: Warehouse) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelBase}>출고요청일</label>
                <input
                  type="date"
                  value={quickShipDate}
                  onChange={(e) => setQuickShipDate(e.target.value)}
                  className={inputBase}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelBase}>비고</label>
              <input
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                placeholder="비고 사항 입력"
                className={inputBase}
              />
            </div>
          </div>

          {/* Searchable item table */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#191F28]">품목 목록</h3>
              <span className="text-xs text-[#8B95A1]">
                수량 입력된 품목:{" "}
                {Object.values(quickQty).filter((q) => q > 0).length}건
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
              <input
                type="text"
                placeholder="품목코드 또는 품목명 검색..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full rounded-xl border border-[#E5E8EB] bg-[#F7F8FA] py-2 pl-10 pr-4 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-[#E5E8EB]">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#F7F8FA]">
                  <tr>
                    <th className={thBase}>품목코드</th>
                    <th className={thBase}>품목명</th>
                    <th className={`${thBase} text-right`}>현재고</th>
                    <th className={`${thBase} w-32 text-center`}>주문수량</th>
                  </tr>
                </thead>
                <tbody>
                  {quickFilteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm text-[#8B95A1]"
                      >
                        검색 결과 없음
                      </td>
                    </tr>
                  ) : (
                    quickFilteredItems.map((item: Item) => (
                      <tr
                        key={item.id}
                        className={`border-t border-[#F2F4F6] transition-colors ${
                          (quickQty[item.id] ?? 0) > 0
                            ? "bg-[#E8F3FF]/40"
                            : "hover:bg-[#F7F8FA]"
                        }`}
                      >
                        <td className="px-3 py-2 text-sm font-medium text-[#4E5968]">
                          {item.code}
                        </td>
                        <td className="px-3 py-2 text-sm text-[#191F28]">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-[#8B95A1]">
                          -
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            min={0}
                            value={quickQty[item.id] ?? ""}
                            placeholder="0"
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value);
                              setQuickQty((prev) => ({
                                ...prev,
                                [item.id]: val,
                              }));
                            }}
                            className="w-full rounded-lg border border-[#E5E8EB] bg-white px-2 py-1.5 text-center text-sm text-[#191F28] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
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
          <div className="flex justify-end gap-2 border-t border-[#F2F4F6] pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={createMutation.isPending}
              onClick={handleQuickSubmit}
            >
              저장
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
