"use client";

import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { useWarehouses, useStockAdjustments } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import AdjustmentFormModal from "@/components/inventory/AdjustmentFormModal";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { StockAdjustment } from "@/types";

const REASON_LABELS: Record<string, string> = {
  DAMAGE: "파손",
  LOSS: "분실",
  FOUND: "발견",
  CORRECTION: "보정",
  RETURN: "반품",
  EXPIRED: "유효기간 만료",
};

const REASON_COLORS: Record<string, string> = {
  DAMAGE: "bg-[#FFEAED] text-[#F04452]",
  LOSS: "bg-[#FFEAED] text-[#F04452]",
  FOUND: "bg-[#E8F7EF] text-[#1FC47D]",
  CORRECTION: "bg-[#E8F2FF] text-[#3182F6]",
  RETURN: "bg-[#FFF3E0] text-[#FF8B00]",
  EXPIRED: "bg-[#FFF3E0] text-[#FF8B00]",
};

export default function AdjustmentsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouseOptions = [
    { value: "", label: "전체 창고" },
    ...(warehouseResponse?.data ?? []).map((w) => ({
      value: w.id,
      label: w.name,
    })),
  ];

  const { data: response, isLoading, error } = useStockAdjustments(
    warehouseFilter || undefined,
    { page, limit: 20 }
  );

  const adjustments = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const columns: Column<StockAdjustment>[] = [
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
      header: "조정 수량",
      render: (row) => {
        const isPositive = row.quantity > 0;
        return (
          <span className={`text-sm font-bold ${isPositive ? "text-[#1FC47D]" : "text-[#F04452]"}`}>
            {isPositive ? "+" : ""}
            {formatNumber(row.quantity)}
          </span>
        );
      },
    },
    {
      key: "reason",
      header: "사유",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${REASON_COLORS[row.reason] || "bg-[#F2F4F6] text-[#8B95A1]"}`}
        >
          {REASON_LABELS[row.reason] || row.reason}
        </span>
      ),
    },
    {
      key: "beforeQty",
      header: "조정전 수량",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">{formatNumber(row.beforeQty)}</span>
      ),
    },
    {
      key: "afterQty",
      header: "조정후 수량",
      render: (row) => (
        <span className="text-sm font-semibold text-[#191F28]">{formatNumber(row.afterQty)}</span>
      ),
    },
    {
      key: "adjustedBy",
      header: "담당자",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">{row.adjustedBy ?? "-"}</span>
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
    {
      key: "createdAt",
      header: "일시",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#4E5968] whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">재고 조정</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          조정 등록
        </Button>
      </div>

      <InventoryTabNav />

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
          >
            {warehouseOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={adjustments}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            emptyMessage="재고 조정 내역이 없습니다."
          />
        )}
      </div>

      <AdjustmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          addToast({ type: "success", message: "재고 조정이 완료되었습니다." });
        }}
      />
    </div>
  );
}
