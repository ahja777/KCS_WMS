"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import ItemSearchPopup from "@/components/ui/ItemSearchPopup";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList, usePartners, useItems } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { Item } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "일반",
  ELECTRONICS: "전자제품",
  CLOTHING: "의류",
  FOOD: "식품",
  FRAGILE: "파손주의",
  HAZARDOUS: "위험물",
  OVERSIZED: "대형화물",
};

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

interface CategoryRow {
  id: string;
  category: string;
  categoryLabel: string;
  warehouseName: string;
  ownerName: string;
  location: string;
  itemName: string;
  stockQty: number;
  uom: string;
  isDeleted: boolean;
}

export default function CategoryStockPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [page, setPage] = useState(1);

  // Popup states
  const [itemPopupOpen, setItemPopupOpen] = useState(false);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: partnerRes } = usePartners({ limit: 200 });
  const allPartners = partnerRes?.data ?? [];
  const owners = allPartners.filter((p) => (p.type as string) === "OWNER" || p.type === "SUPPLIER");

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    limit: 500,
    ...(warehouseId ? { warehouseId } : {}),
  });

  const inventoryItems = inventoryResponse?.data ?? [];

  // Build category stock rows
  const categoryData = useMemo(() => {
    const rows: CategoryRow[] = [];

    inventoryItems.forEach((inv) => {
      const cat = inv.item?.category ?? "GENERAL";
      if (categoryFilter && cat !== categoryFilter) return;
      if (selectedItem && inv.itemId !== selectedItem.id) return;

      rows.push({
        id: inv.id,
        category: cat,
        categoryLabel: CATEGORY_LABELS[cat] ?? cat,
        warehouseName: inv.warehouse?.name ?? "-",
        ownerName: "-",
        location: inv.locationCode ?? "-",
        itemName: inv.item?.name ?? "-",
        stockQty: inv.quantity,
        uom: inv.item?.uom ?? "-",
        isDeleted: !inv.item?.isActive,
      });
    });

    return rows.sort((a, b) => b.stockQty - a.stockQty);
  }, [inventoryItems, categoryFilter, selectedItem]);

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
    downloadExcel(`/export/inventory${qs ? `?${qs}` : ""}`, "제품군별재고현황.xlsx");
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
      key: "ownerName",
      header: "화주",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.ownerName}</span>,
    },
    {
      key: "location",
      header: "로케이션",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.location}</span>,
    },
    {
      key: "itemName",
      header: "상품",
      render: (row) => <span className="text-sm text-[#191F28]">{row.itemName}</span>,
    },
    {
      key: "stockQty",
      header: "수량",
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.stockQty)}</span>,
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
      key: "isDeleted",
      header: "삭제여부",
      render: (row) => (
        <span className={`text-sm font-medium ${row.isDeleted ? "text-[#F04452]" : "text-[#4E5968]"}`}>
          {row.isDeleted ? "Y" : "N"}
        </span>
      ),
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
            <h1 className="text-2xl font-bold text-[#191F28]">제품군별재고현황</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; 제품군별재고현황</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
          </Button>
        </div>
      </div>

      {/* Search Filters - 2 rows */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Row 1 */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">상품군</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className={inputBase}
            >
              <option value="">전체</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">로케이션</label>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
              placeholder="로케이션 검색..."
              className={inputBase}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">창고</label>
            <select
              value={warehouseId}
              onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
              className={inputBase}
            >
              <option value="">전체 창고</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">화주</label>
            <select
              value={ownerFilter}
              onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
              className={inputBase}
            >
              <option value="">전체</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">상품</label>
            <div
              onClick={() => setItemPopupOpen(true)}
              className={`${inputBase} cursor-pointer truncate`}
            >
              {selectedItem ? `${selectedItem.name} (${selectedItem.code})` : "상품 검색..."}
            </div>
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

      {/* Item Search Popup */}
      <ItemSearchPopup
        isOpen={itemPopupOpen}
        onClose={() => setItemPopupOpen(false)}
        onSelect={(item) => setSelectedItem(item)}
      />
    </div>
  );
}
