"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "일반",
  ELECTRONICS: "전자제품",
  CLOTHING: "의류",
  FOOD: "식품",
  FRAGILE: "파손주의",
  HAZARDOUS: "위험물",
  OVERSIZED: "대형화물",
};

interface CategoryRow {
  id: string;
  category: string;
  categoryLabel: string;
  warehouseName: string;
  usageArea: number;
  usageRate: number;
  stockQty: number;
}

export default function CategoryStockPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    limit: 500,
    ...(warehouseId ? { warehouseId } : {}),
  });

  const inventoryItems = inventoryResponse?.data ?? [];

  // Group by category + warehouse
  const categoryData = useMemo(() => {
    const map = new Map<
      string,
      { category: string; warehouseName: string; items: Set<string>; totalQty: number }
    >();

    inventoryItems.forEach((inv) => {
      const cat = inv.item?.category ?? "GENERAL";
      const whName = inv.warehouse?.name ?? "-";
      const key = `${cat}_${whName}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.add(inv.itemId);
        existing.totalQty += inv.quantity;
      } else {
        map.set(key, {
          category: cat,
          warehouseName: whName,
          items: new Set([inv.itemId]),
          totalQty: inv.quantity,
        });
      }
    });

    const totalQtyAll = inventoryItems.reduce((s, i) => s + i.quantity, 0);

    const rows: CategoryRow[] = [];
    map.forEach((val, key) => {
      if (categoryFilter && val.category !== categoryFilter) return;
      rows.push({
        id: key,
        category: val.category,
        categoryLabel: CATEGORY_LABELS[val.category] ?? val.category,
        warehouseName: val.warehouseName,
        usageArea: val.items.size * 10, // estimated area per item type
        usageRate: totalQtyAll > 0 ? Math.round((val.totalQty / totalQtyAll) * 100) : 0,
        stockQty: val.totalQty,
      });
    });

    return rows.sort((a, b) => b.stockQty - a.stockQty);
  }, [inventoryItems, categoryFilter]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(categoryData.length / pageSize));
  const pagedRows = categoryData.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouseId", warehouseId);
    const qs = params.toString();
    downloadExcel(`/export/inventory${qs ? `?${qs}` : ""}`, "제품군별창고사용현황.xlsx");
  }, [warehouseId]);

  const columns: Column<CategoryRow>[] = [
    {
      key: "categoryLabel",
      header: "제품군",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#E8F3FF] px-3 py-1 text-xs font-semibold text-[#3182F6]">
          {row.categoryLabel}
        </span>
      ),
    },
    {
      key: "warehouseName",
      header: "창고",
      render: (row) => <span className="text-sm text-[#191F28]">{row.warehouseName}</span>,
    },
    {
      key: "usageArea",
      header: "사용면적",
      render: (row) => <span className="text-sm text-[#4E5968]">{formatNumber(row.usageArea)} m2</span>,
    },
    {
      key: "usageRate",
      header: "사용률",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-[#F2F4F6]">
            <div
              className="h-full rounded-full bg-[#3182F6]"
              style={{ width: `${Math.min(row.usageRate, 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-[#191F28]">{row.usageRate}%</span>
        </div>
      ),
    },
    {
      key: "stockQty",
      header: "재고수량",
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.stockQty)}</span>,
    },
  ];

  // Unique category list for filter
  const categoryOptions = useMemo(() => {
    const cats = new Set(inventoryItems.map((i) => i.item?.category ?? "GENERAL"));
    return Array.from(cats).map((c) => ({ value: c, label: CATEGORY_LABELS[c] ?? c }));
  }, [inventoryItems]);

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
            <h1 className="text-2xl font-bold text-[#191F28]">제품군별창고사용현황</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; 제품군별창고사용현황</p>
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
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">제품군</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            >
              <option value="">전체</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
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
            total={categoryData.length}
            onPageChange={setPage}
            emptyMessage="재고 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
