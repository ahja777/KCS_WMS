"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { Inventory } from "@/types";

export default function LotStockReportPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    page,
    limit: 50,
    ...(warehouseId ? { warehouseId } : {}),
    ...(search ? { search } : {}),
  });

  const items = inventoryResponse?.data ?? [];
  const total = inventoryResponse?.total ?? 0;
  const totalPages = inventoryResponse?.totalPages ?? 1;

  const lotItems = useMemo(() => items.filter((i) => i.lotNumber), [items]);

  const summary = useMemo(() => ({
    totalLots: new Set(lotItems.map((i) => i.lotNumber)).size,
    totalQty: lotItems.reduce((s, i) => s + i.quantity, 0),
    totalItems: new Set(lotItems.map((i) => i.itemId)).size,
  }), [lotItems]);

  const columns: Column<Inventory>[] = [
    {
      key: "lotNo",
      header: "LOT번호",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-[#3182F6]" />
          <span className="rounded-lg bg-[#E8F3FF] px-2.5 py-1 text-xs font-semibold text-[#3182F6]">{row.lotNumber}</span>
        </div>
      ),
    },
    {
      key: "itemCode",
      header: "품목코드",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.item?.code ?? "-"}</span>,
    },
    {
      key: "itemName",
      header: "품목명",
      render: (row) => <span className="text-sm text-[#191F28]">{row.item?.name ?? "-"}</span>,
    },
    {
      key: "warehouse",
      header: "창고",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.warehouse?.name ?? "-"}</span>,
    },
    {
      key: "locationCode",
      header: "로케이션",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.locationCode ?? "-"}</span>,
    },
    {
      key: "quantity",
      header: "수량",
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.quantity)}</span>,
    },
    {
      key: "availableQty",
      header: "가용수량",
      render: (row) => <span className="text-sm font-semibold text-[#1FC47D]">{formatNumber(row.availableQty)}</span>,
    },
    {
      key: "reservedQty",
      header: "예약수량",
      render: (row) => (
        <span className={`text-sm font-semibold ${row.reservedQty > 0 ? "text-[#FF8B00]" : "text-[#B0B8C1]"}`}>
          {formatNumber(row.reservedQty)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4E5968] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#F2F4F6]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[#191F28]">LOT별 재고 현황</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadExcel(`/export/inventory${warehouseId ? `?warehouseId=${warehouseId}` : ""}`, "LOT별재고.xlsx")}>
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </Button>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">창고</label>
            <select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }} className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20">
              <option value="">전체 창고</option>
              {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name} ({w.code})</option>))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">검색</label>
            <input type="text" placeholder="품목코드, 품목명, LOT번호 검색..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none focus:ring-2 focus:ring-[#3182F6]/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">LOT 건수</p>
          <p className="mt-2 text-3xl font-bold text-[#3182F6]">{formatNumber(summary.totalLots)}</p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">품목 수</p>
          <p className="mt-2 text-3xl font-bold text-[#191F28]">{formatNumber(summary.totalItems)}</p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">총 수량</p>
          <p className="mt-2 text-3xl font-bold text-[#1FC47D]">{formatNumber(summary.totalQty)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table columns={columns} data={lotItems} isLoading={isLoading} page={page} totalPages={totalPages} total={total} onPageChange={setPage} emptyMessage="LOT 재고 데이터가 없습니다." />
        )}
      </div>
    </div>
  );
}
