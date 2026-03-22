"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Package, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { Inventory } from "@/types";

export default function LocationStockReportPage() {
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

  const summary = useMemo(() => ({
    totalLocations: new Set(items.map((i) => i.locationCode).filter(Boolean)).size,
    totalQty: items.reduce((s, i) => s + i.quantity, 0),
    totalItems: new Set(items.map((i) => i.itemId)).size,
  }), [items]);

  const columns: Column<Inventory>[] = [
    {
      key: "locationCode",
      header: "로케이션",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#8B95A1]" />
          <span className="text-sm font-medium text-[#191F28]">{row.locationCode || "-"}</span>
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
      key: "lotNo",
      header: "LOT번호",
      render: (row) =>
        row.lotNumber ? (
          <span className="rounded-lg bg-[#F2F4F6] px-2 py-1 text-xs font-medium text-[#4E5968]">{row.lotNumber}</span>
        ) : (
          <span className="text-sm text-[#B0B8C1]">-</span>
        ),
    },
    {
      key: "quantity",
      header: "총수량",
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
          <Link
            href="/reports"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4E5968] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#F2F4F6]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[#191F28]">로케이션별 재고 현황</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadExcel(`/export/inventory${warehouseId ? `?warehouseId=${warehouseId}` : ""}`, "로케이션별재고.xlsx")}
        >
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">창고</label>
            <select
              value={warehouseId}
              onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            >
              <option value="">전체 창고</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">검색</label>
            <input
              type="text"
              placeholder="품목코드, 품목명 검색..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">로케이션 수</p>
          <p className="mt-2 text-3xl font-bold text-[#3182F6]">{formatNumber(summary.totalLocations)}</p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">품목 수</p>
          <p className="mt-2 text-3xl font-bold text-[#191F28]">{formatNumber(summary.totalItems)}</p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">총 재고 수량</p>
          <p className="mt-2 text-3xl font-bold text-[#1FC47D]">{formatNumber(summary.totalQty)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table columns={columns} data={items} isLoading={isLoading} page={page} totalPages={totalPages} total={total} onPageChange={setPage} emptyMessage="재고 데이터가 없습니다." />
        )}
      </div>
    </div>
  );
}
