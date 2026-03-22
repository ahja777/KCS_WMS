"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { Inventory } from "@/types";

export default function LotStockReportPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
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

  // Only show items with LOT numbers
  const lotItems = useMemo(() => items.filter((i) => i.lotNumber), [items]);

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouseId", warehouseId);
    if (search) params.set("search", search);
    const qs = params.toString();
    downloadExcel(`/export/inventory${qs ? `?${qs}` : ""}`, "LOT별재고조회.xlsx");
  }, [warehouseId, search]);

  const columns: Column<Inventory>[] = [
    {
      key: "lotNumber",
      header: "LOT번호",
      sortable: true,
      render: (row) => (
        <span className="rounded-lg bg-[#E8F3FF] px-2.5 py-1 text-xs font-semibold text-[#3182F6]">
          {row.lotNumber}
        </span>
      ),
    },
    {
      key: "itemCode",
      header: "상품코드",
      sortable: true,
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.item?.code ?? "-"}</span>,
    },
    {
      key: "itemName",
      header: "상품명",
      render: (row) => <span className="text-sm text-[#191F28]">{row.item?.name ?? "-"}</span>,
    },
    {
      key: "quantity",
      header: "수량",
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.quantity)}</span>,
    },
    {
      key: "uom",
      header: "UOM",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-medium text-[#4E5968]">
          {row.item?.uom ?? "-"}
        </span>
      ),
    },
    {
      key: "expiryDate",
      header: "유효기간",
      sortable: true,
      render: (row) =>
        row.expiryDate ? (
          <span className="text-sm text-[#4E5968]">{formatDate(row.expiryDate)}</span>
        ) : (
          <span className="text-sm text-[#B0B8C1]">-</span>
        ),
    },
    {
      key: "warehouse",
      header: "창고",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.warehouse?.name ?? "-"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4E5968] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#F2F4F6]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#191F28]">LOT별재고조회</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; LOT별재고조회</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">LOT번호</label>
            <input
              type="text"
              placeholder="LOT번호 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">화주</label>
            <select
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              defaultValue=""
            >
              <option value="">전체</option>
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">상품</label>
            <select
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              defaultValue=""
            >
              <option value="">전체</option>
            </select>
          </div>
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            조회
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={lotItems}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            emptyMessage="LOT 재고 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
