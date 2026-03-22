"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Send, AlertCircle, ArrowRightLeft } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { useWarehouses, useStockTransfer, useTransactions } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Warehouse, InventoryTransaction } from "@/types";

interface TransferFormData {
  warehouseId: string;
  itemCode: string;
  fromLocationCode: string;
  toLocationCode: string;
  quantity: number;
  lotNo: string;
  performedBy: string;
  notes: string;
}

const inputClass =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function TransferPage() {
  const [page, setPage] = useState(1);
  const addToast = useToastStore((s) => s.addToast);

  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const warehouses = (warehousesData?.data ?? []).filter(
    (w: Warehouse) => w.status === "ACTIVE"
  );

  const transferMutation = useStockTransfer();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TransferFormData>({
    defaultValues: {
      warehouseId: "",
      itemCode: "",
      fromLocationCode: "",
      toLocationCode: "",
      quantity: 1,
      lotNo: "",
      performedBy: "",
      notes: "",
    },
  });

  const selectedWarehouse = watch("warehouseId");

  // Fetch recent transfer transactions
  const txParams = useMemo(() => {
    const p: Record<string, string | number> = {
      page,
      limit: 10,
      txType: "TRANSFER",
    };
    if (selectedWarehouse) p.warehouseId = selectedWarehouse;
    return p;
  }, [page, selectedWarehouse]);

  const { data: txResponse, isLoading: txLoading, error: txError } = useTransactions(txParams);
  const transactions = txResponse?.data ?? [];
  const txTotal = txResponse?.total ?? 0;
  const txTotalPages = txResponse?.totalPages ?? 1;

  const warehouseMap: Record<string, string> = {};
  (warehousesData?.data ?? []).forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  const onSubmit = async (formData: TransferFormData) => {
    try {
      await transferMutation.mutateAsync({
        warehouseId: formData.warehouseId,
        itemCode: formData.itemCode,
        fromLocationCode: formData.fromLocationCode,
        toLocationCode: formData.toLocationCode,
        quantity: Number(formData.quantity),
        lotNo: formData.lotNo || undefined,
        performedBy: formData.performedBy,
        notes: formData.notes || undefined,
      });
      addToast({ type: "success", message: "재고 이동이 완료되었습니다." });
      reset();
    } catch {
      addToast({ type: "error", message: "재고 이동에 실패했습니다." });
    }
  };

  const txColumns: Column<InventoryTransaction>[] = [
    {
      key: "createdAt",
      header: "일시",
      render: (row) => (
        <span className="text-sm text-[#4E5968] whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "warehouseId",
      header: "창고",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {warehouseMap[row.warehouseId] || row.warehouseId}
        </span>
      ),
    },
    {
      key: "item",
      header: "품목",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-[#191F28]">{row.item?.code ?? "-"}</p>
          <p className="text-xs text-[#8B95A1]">{row.item?.name ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "수량",
      render: (row) => (
        <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.quantity)}</span>
      ),
    },
    {
      key: "createdBy",
      header: "담당자",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">{row.createdBy ?? "-"}</span>
      ),
    },
    {
      key: "notes",
      header: "비고",
      render: (row) => (
        <span className="text-sm text-[#8B95A1] max-w-[160px] truncate block">
          {row.notes ?? "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">재고 이동</h1>
      </div>

      {/* Transfer Form */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F2FF]">
            <ArrowRightLeft className="h-5 w-5 text-[#3182F6]" />
          </div>
          <h2 className="text-lg font-bold text-[#191F28]">이동 등록</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* 창고 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                창고 <span className="text-[#F04452]">*</span>
              </label>
              <select
                {...register("warehouseId", { required: "창고를 선택해주세요" })}
                className={inputClass}
              >
                <option value="">선택하세요</option>
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

            {/* 품목코드 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                품목코드 <span className="text-[#F04452]">*</span>
              </label>
              <input
                {...register("itemCode", { required: "품목코드를 입력해주세요" })}
                placeholder="품목코드 입력"
                className={inputClass}
              />
              {errors.itemCode && (
                <p className="mt-1 text-xs text-[#F04452]">{errors.itemCode.message}</p>
              )}
            </div>

            {/* FROM 로케이션 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                FROM 로케이션 <span className="text-[#F04452]">*</span>
              </label>
              <input
                {...register("fromLocationCode", { required: "출발 로케이션을 입력해주세요" })}
                placeholder="출발 로케이션코드"
                className={inputClass}
              />
              {errors.fromLocationCode && (
                <p className="mt-1 text-xs text-[#F04452]">{errors.fromLocationCode.message}</p>
              )}
            </div>

            {/* TO 로케이션 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                TO 로케이션 <span className="text-[#F04452]">*</span>
              </label>
              <input
                {...register("toLocationCode", { required: "도착 로케이션을 입력해주세요" })}
                placeholder="도착 로케이션코드"
                className={inputClass}
              />
              {errors.toLocationCode && (
                <p className="mt-1 text-xs text-[#F04452]">{errors.toLocationCode.message}</p>
              )}
            </div>

            {/* 수량 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                수량 <span className="text-[#F04452]">*</span>
              </label>
              <input
                type="number"
                {...register("quantity", {
                  required: "수량을 입력해주세요",
                  valueAsNumber: true,
                  min: { value: 1, message: "1 이상의 값을 입력해주세요" },
                })}
                placeholder="이동 수량"
                className={inputClass}
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-[#F04452]">{errors.quantity.message}</p>
              )}
            </div>

            {/* LOT번호 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                LOT번호
              </label>
              <input
                {...register("lotNo")}
                placeholder="LOT번호 (선택)"
                className={inputClass}
              />
            </div>

            {/* 담당자 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                담당자 <span className="text-[#F04452]">*</span>
              </label>
              <input
                {...register("performedBy", { required: "담당자를 입력해주세요" })}
                placeholder="담당자명"
                className={inputClass}
              />
              {errors.performedBy && (
                <p className="mt-1 text-xs text-[#F04452]">{errors.performedBy.message}</p>
              )}
            </div>

            {/* 비고 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                비고
              </label>
              <input
                {...register("notes")}
                placeholder="비고 사항 (선택)"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={transferMutation.isPending}>
              <Send className="h-4 w-4" />
              이동 실행
            </Button>
          </div>
        </form>
      </div>

      {/* Recent Transfer Transactions */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">최근 이동 내역</h2>

        {txError ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={txColumns}
            data={transactions}
            isLoading={txLoading}
            page={page}
            totalPages={txTotalPages}
            total={txTotal}
            onPageChange={setPage}
            emptyMessage="이동 내역이 없습니다."
          />
        )}
      </div>
    </div>
  );
}
