"use client";

import { useState } from "react";
import { Plus, CheckCircle, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { useWarehouses, useCycleCounts } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import CycleCountFormModal from "@/components/inventory/CycleCountFormModal";
import CycleCountCompleteModal from "@/components/inventory/CycleCountCompleteModal";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { CycleCount, CycleCountStatus } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "전체 상태" },
  { value: "PLANNED", label: "계획" },
  { value: "IN_PROGRESS", label: "진행중" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소" },
];

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-[#E8F2FF] text-[#3182F6]",
  IN_PROGRESS: "bg-[#FFF3E0] text-[#FF8B00]",
  COMPLETED: "bg-[#E8F7EF] text-[#1FC47D]",
  CANCELLED: "bg-[#FFEAED] text-[#F04452]",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "계획",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

export default function CycleCountsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<CycleCount | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouseOptions = [
    { value: "", label: "전체 창고" },
    ...(warehouseResponse?.data ?? []).map((w) => ({
      value: w.id,
      label: w.name,
    })),
  ];

  const warehouseMap: Record<string, string> = {};
  (warehouseResponse?.data ?? []).forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  const { data: response, isLoading, error } = useCycleCounts(
    warehouseFilter || undefined,
    (statusFilter as CycleCountStatus) || undefined,
    { page, limit: 20 }
  );

  const cycleCounts = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const columns: Column<CycleCount>[] = [
    {
      key: "warehouse",
      header: "창고",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {row.warehouse?.name ?? warehouseMap[row.warehouseId] ?? "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[row.status] || "bg-[#F2F4F6] text-[#8B95A1]"}`}
        >
          {STATUS_LABELS[row.status] || row.status}
        </span>
      ),
    },
    {
      key: "plannedDate",
      header: "계획일",
      render: (row) => (
        <span className="text-sm text-[#4E5968] whitespace-nowrap">
          {formatDateTime(row.plannedDate)}
        </span>
      ),
    },
    {
      key: "countedBy",
      header: "담당자",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">{row.countedBy ?? "-"}</span>
      ),
    },
    {
      key: "completedDate",
      header: "완료일",
      render: (row) => (
        <span className="text-sm text-[#4E5968] whitespace-nowrap">
          {row.completedDate ? formatDateTime(row.completedDate) : "-"}
        </span>
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
      header: "등록일시",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#4E5968] whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "PLANNED" || row.status === "IN_PROGRESS" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setCompleteTarget(row);
            }}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            완료
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">순환재고조사</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          실사 등록
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

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
          >
            {STATUS_OPTIONS.map((opt) => (
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
            data={cycleCounts}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            emptyMessage="재고 실사 내역이 없습니다."
          />
        )}
      </div>

      <CycleCountFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          addToast({ type: "success", message: "실사가 등록되었습니다." });
        }}
      />

      <CycleCountCompleteModal
        isOpen={!!completeTarget}
        cycleCount={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onSuccess={() => {
          setCompleteTarget(null);
          addToast({ type: "success", message: "실사가 완료 처리되었습니다." });
        }}
      />
    </div>
  );
}
