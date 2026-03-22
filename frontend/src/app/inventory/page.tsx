"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, Download, AlertCircle, Package, CheckCircle, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table, { type Column } from "@/components/ui/Table";
import Select from "@/components/ui/Select";
import { formatNumber, formatDate } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import { useInventoryList, useWarehouses, useDashboardSummary } from "@/hooks/useApi";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { Inventory } from "@/types";

const columns: Column<Inventory>[] = [
  {
    key: "warehouse",
    header: "창고",
    sortable: true,
    render: (row) => row.warehouse?.name ?? "-",
  },
  {
    key: "item",
    header: "품목코드",
    sortable: true,
    render: (row) => row.item?.code ?? "-",
  },
  {
    key: "itemName",
    header: "품목명",
    render: (row) => row.item?.name ?? "-",
  },
  { key: "locationCode", header: "로케이션" },
  {
    key: "quantity",
    header: "총 수량",
    sortable: true,
    render: (row) => (
      <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.quantity)}</span>
    ),
  },
  {
    key: "availableQty",
    header: "가용 수량",
    render: (row) => (
      <span className="text-sm font-semibold text-[#00C853]">{formatNumber(row.availableQty)}</span>
    ),
  },
  {
    key: "reservedQty",
    header: "예약 수량",
    render: (row) =>
      row.reservedQty > 0 ? (
        <span className="text-sm font-semibold text-[#FF9500]">{formatNumber(row.reservedQty)}</span>
      ) : (
        <span className="text-sm text-[#8B95A1]">0</span>
      ),
  },
  { key: "lotNumber", header: "LOT 번호" },
  {
    key: "updatedAt",
    header: "최종 업데이트",
    render: (row) => formatDate(row.updatedAt, "yyyy-MM-dd HH:mm"),
  },
];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouseOptions = [
    { value: "", label: "전체 창고" },
    ...(warehouseResponse?.data ?? []).map((w) => ({
      value: w.id,
      label: w.name,
    })),
  ];

  const { data: response, isLoading, error } = useInventoryList({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
  });

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();

  const inventoryItems = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const totalQty = summary?.inventory?.totalQuantity ?? 0;
  const totalAvailable = summary?.inventory?.availableQuantity ?? 0;
  const totalReserved = summary?.inventory?.reservedQuantity ?? 0;
  const kpiLoading = isLoading || isSummaryLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">재고 현황</h1>
        <button
          onClick={() => {
            const params = warehouseFilter ? `?warehouseId=${warehouseFilter}` : '';
            downloadExcel(`/export/inventory${params}`, `inventory_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`);
          }}
          className="flex items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
        >
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </button>
      </div>

      <InventoryTabNav />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">총 재고 수량</p>
              <p className="mt-2 text-3xl font-bold text-[#191F28]">
                {kpiLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(totalQty)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3FF]">
              <Package className="h-6 w-6 text-[#3182F6]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">가용 수량</p>
              <p className="mt-2 text-3xl font-bold text-[#00C853]">
                {kpiLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(totalAvailable)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8FAF0]">
              <CheckCircle className="h-6 w-6 text-[#00C853]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">예약 수량</p>
              <p className="mt-2 text-3xl font-bold text-[#FF9500]">
                {kpiLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(totalReserved)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4E6]">
              <Clock className="h-6 w-6 text-[#FF9500]" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Search + Warehouse filter */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="품목코드, 품목명, 로케이션 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
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
            data={inventoryItems}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
