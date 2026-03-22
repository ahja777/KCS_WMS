"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";

const GRADE_LABELS: Record<string, string> = {
  GENERAL: "일반",
  ELECTRONICS: "전자제품",
  CLOTHING: "의류",
  FOOD: "식품",
  FRAGILE: "파손주의",
  HAZARDOUS: "위험물",
  OVERSIZED: "대형화물",
};

interface GradeRow {
  id: string;
  grade: string;
  gradeLabel: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  warehouseName: string;
}

export default function GradeStockPage() {
  const [gradeFilter, setGradeFilter] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [page, setPage] = useState(1);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    limit: 500,
    ...(warehouseId ? { warehouseId } : {}),
  });

  const inventoryItems = inventoryResponse?.data ?? [];

  const allRows = useMemo(() => {
    const rows: GradeRow[] = [];
    inventoryItems.forEach((inv) => {
      const grade = inv.item?.category ?? "GENERAL";
      if (gradeFilter && grade !== gradeFilter) return;
      rows.push({
        id: inv.id,
        grade,
        gradeLabel: GRADE_LABELS[grade] ?? grade,
        itemCode: inv.item?.code ?? "-",
        itemName: inv.item?.name ?? "-",
        quantity: inv.quantity,
        uom: inv.item?.uom ?? "-",
        warehouseName: inv.warehouse?.name ?? "-",
      });
    });
    return rows;
  }, [inventoryItems, gradeFilter]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
  const pagedRows = allRows.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouseId", warehouseId);
    const qs = params.toString();
    downloadExcel(`/export/inventory${qs ? `?${qs}` : ""}`, "등급별재고현황.xlsx");
  }, [warehouseId]);

  // Unique grade list for filter
  const gradeOptions = useMemo(() => {
    const grades = new Set(inventoryItems.map((i) => i.item?.category ?? "GENERAL"));
    return Array.from(grades).map((g) => ({ value: g, label: GRADE_LABELS[g] ?? g }));
  }, [inventoryItems]);

  const columns: Column<GradeRow>[] = [
    {
      key: "gradeLabel",
      header: "등급",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#E8F3FF] px-3 py-1 text-xs font-semibold text-[#3182F6]">
          {row.gradeLabel}
        </span>
      ),
    },
    {
      key: "itemCode",
      header: "상품코드",
      sortable: true,
      render: (row) => <span className="text-sm font-mono font-medium text-[#191F28]">{row.itemCode}</span>,
    },
    {
      key: "itemName",
      header: "상품명",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.itemName}</span>,
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
          {row.uom}
        </span>
      ),
    },
    {
      key: "warehouseName",
      header: "창고",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.warehouseName}</span>,
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
            <h1 className="text-2xl font-bold text-[#191F28]">등급별재고현황조회</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; 등급별재고현황조회</p>
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
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">등급</label>
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            >
              <option value="">전체</option>
              {gradeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
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
            data={pagedRows}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={allRows.length}
            onPageChange={setPage}
            emptyMessage="재고 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
