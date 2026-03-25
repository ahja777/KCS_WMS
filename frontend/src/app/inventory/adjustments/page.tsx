"use client";

import { useState } from "react";
import { Plus, AlertCircle, Pencil } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { useWarehouses, useStockAdjustments, useCreateAdjustment } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useAuthStore } from "@/stores/auth.store";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { StockAdjustment } from "@/types";

const REASON_LABELS: Record<string, string> = {
  DAMAGE: "파손", LOSS: "분실", FOUND: "발견", CORRECTION: "보정", RETURN: "반품", EXPIRED: "유효기간 만료",
};

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

export default function AdjustmentsPage() {
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<StockAdjustment | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouseOptions = [
    { value: "", label: "전체 창고" },
    ...(warehouseResponse?.data ?? []).map((w) => ({ value: w.id, label: w.name })),
  ];

  const { data: response, isLoading, error } = useStockAdjustments(
    warehouseFilter || undefined,
    { page, limit: 20 }
  );

  const adjustments = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Columns matching slide 34 grid: No, 작업일, 작업시간, 작업구분, 작업수량, 기존재고, 작업자
  const columns: Column<StockAdjustment>[] = [
    {
      key: "createdAt",
      header: "작업일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.createdAt?.slice(0, 10) ?? "-"}</span>,
    },
    {
      key: "time",
      header: "작업시간",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.createdAt?.slice(11, 19) ?? "-"}</span>,
    },
    {
      key: "item",
      header: "상품",
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-sm font-medium text-[#191F28]">{row.item?.code ?? "-"}</span>
          <span className="ml-2 text-sm text-[#8B95A1]">{row.item?.name ?? ""}</span>
        </div>
      ),
    },
    {
      key: "reason",
      header: "작업구분",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{REASON_LABELS[row.reason] || row.reason}</span>,
    },
    {
      key: "quantity",
      header: "작업수량",
      sortable: true,
      render: (row) => {
        const isPositive = row.quantity > 0;
        return (
          <span className={`text-sm font-bold ${isPositive ? "text-[#1FC47D]" : "text-[#F04452]"}`}>
            {isPositive ? "+" : ""}{formatNumber(row.quantity)}
          </span>
        );
      },
    },
    {
      key: "beforeQty",
      header: "기존재고",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{formatNumber(row.beforeQty)}</span>,
    },
    {
      key: "adjustedBy",
      header: "작업자",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.adjustedBy ?? "-"}</span>,
    },
    {
      key: "actions" as keyof StockAdjustment,
      header: "",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
          className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6] hover:text-[#3182F6]"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const handleEdit = (row: StockAdjustment) => {
    setEditingRow(row);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">재고 조정</h1>
        <Button onClick={() => { setEditingRow(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          조정 등록
        </Button>
      </div>

      <InventoryTabNav />

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <select
            value={warehouseFilter}
            onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
            className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
          >
            {warehouseOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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

      {/* Adjustment form modal matching slide 34 popup */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRow(null); }}
        title={editingRow ? "재고 조정 수정" : "재고 조정"}
        size="md"
      >
        <AdjustmentForm
          editData={editingRow}
          onClose={() => { setIsModalOpen(false); setEditingRow(null); }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingRow(null);
            addToast({ type: "success", message: "저장이 완료되었습니다." });
          }}
        />
      </Modal>
    </div>
  );
}

function AdjustmentForm({ editData, onClose, onSuccess }: { editData?: StockAdjustment | null; onClose: () => void; onSuccess: () => void }) {
  const [warehouse, setWarehouse] = useState(editData?.warehouseId ?? "");
  const [location, setLocation] = useState("");
  const [product, setProduct] = useState(editData?.item?.code ?? "");
  const [uom, setUom] = useState("EA");
  const [currentStock, setCurrentStock] = useState(editData?.beforeQty ?? 0);
  const [adjustType, setAdjustType] = useState<"+" | "-">(editData && editData.quantity < 0 ? "-" : "+");
  const [adjustQty, setAdjustQty] = useState(editData ? Math.abs(editData.quantity) : 0);
  const [reason, setReason] = useState(editData?.reason ?? "");

  const user = useAuthStore((s) => s.user);
  const createMutation = useCreateAdjustment();
  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const handleSubmit = async () => {
    if (!warehouse) return;
    try {
      const qty = adjustType === "+" ? adjustQty : -adjustQty;
      await createMutation.mutateAsync({
        warehouseId: warehouse,
        itemCode: product,
        quantity: qty,
        reason: reason || "CORRECTION",
        adjustedBy: user?.name ?? user?.email ?? "admin",
        notes: reason,
      });
      onSuccess();
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-5">
      {/* Form fields matching slide 34 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">창고</label>
          <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={selectBase}>
            <option value="">선택</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">로케이션</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputBase} placeholder="로케이션 코드" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">상품</label>
          <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} className={inputBase} placeholder="상품 코드" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">UOM</label>
          <select value={uom} onChange={(e) => setUom(e.target.value)} className={selectBase}>
            <option value="EA">EA</option>
            <option value="BOX">BOX</option>
            <option value="PALLET">PALLET</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">재고수량</label>
          <input type="number" value={currentStock} onChange={(e) => setCurrentStock(Number(e.target.value))} className={inputBase} readOnly />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">증가/감소</label>
          <div className="flex gap-2">
            <button
              onClick={() => setAdjustType("+")}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${adjustType === "+" ? "bg-[#1FC47D] text-white" : "bg-[#F2F4F6] text-[#4E5968]"}`}
            >
              + 증가
            </button>
            <button
              onClick={() => setAdjustType("-")}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${adjustType === "-" ? "bg-[#F04452] text-white" : "bg-[#F2F4F6] text-[#4E5968]"}`}
            >
              - 감소
            </button>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">조정수량</label>
          <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} className={inputBase} min={0} />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#4E5968]">사유</label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className={inputBase} placeholder="조정 사유를 입력하세요" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">
          닫기
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA] disabled:opacity-50"
        >
          {createMutation.isPending ? "처리중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
