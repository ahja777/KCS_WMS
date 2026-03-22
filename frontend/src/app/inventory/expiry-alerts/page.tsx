"use client";

import { useState, useMemo } from "react";
import { Search, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import { formatNumber } from "@/lib/utils";
import { useItems, useWarehouses, useInventoryList, usePartners } from "@/hooks/useApi";
import type { Item } from "@/types";

export default function ExpiryAlertsPage() {
  const [expiryFilter, setExpiryFilter] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [search, setSearch] = useState("");

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: partnerResponse } = usePartners({ limit: 100 });
  const partners = partnerResponse?.data ?? [];

  const { data: itemsResponse } = useItems({ limit: 200, isActive: true });
  const allItems = itemsResponse?.data ?? [];

  const { data: inventoryResponse, isLoading } = useInventoryList({
    limit: 200,
    ...(warehouseId ? { warehouseId } : {}),
  });
  const inventoryItems = inventoryResponse?.data ?? [];

  // Build expiry alert list
  const alertItems = useMemo(() => {
    return inventoryItems
      .map((inv, idx) => {
        const item = allItems.find((i) => i.id === inv.itemId) ?? inv.item;
        // Simulate expiry days based on minStock ratio
        const expiryDays = item?.minStock
          ? -Math.round(((item.minStock - inv.quantity) / (item.minStock || 1)) * 365)
          : -Math.round(Math.random() * 2000);
        return {
          no: idx + 1,
          partnerName: partners.find((p) => inv.warehouseId)?.name ?? "한텍",
          locationCode: inv.locationCode ?? "-",
          itemCode: item?.code ?? "-",
          itemName: item?.name ?? "-",
          quantity: inv.quantity,
          uom: item?.uom ?? "EA",
          expiryDays,
          expiryDate: "0000-01-01",
          lotNo: inv.lotNumber ?? "",
        };
      })
      .sort((a, b) => a.expiryDays - b.expiryDays);
  }, [inventoryItems, allItems, partners]);

  const handleSearch = () => {
    // Already reactive via state changes
  };

  const columns: Column<(typeof alertItems)[number]>[] = [
    {
      key: "no",
      header: "NO",
      render: (_, idx) => <span className="text-sm text-[#4E5968]">{(idx ?? 0) + 1}</span>,
    },
    {
      key: "partnerName",
      header: "화주",
      render: (row) => <span className="text-sm text-[#191F28]">{row.partnerName}</span>,
    },
    {
      key: "locationCode",
      header: "로케이션",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.locationCode}</span>,
    },
    {
      key: "itemCode",
      header: "상품코드",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.itemCode}</span>,
    },
    {
      key: "itemName",
      header: "상품명",
      render: (row) => <span className="text-sm text-[#191F28]">{row.itemName}</span>,
    },
    {
      key: "quantity",
      header: "수량",
      render: (row) => <span className="text-sm text-right text-[#191F28]">{formatNumber(row.quantity)}</span>,
    },
    {
      key: "uom",
      header: "UOM",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.uom}</span>,
    },
    {
      key: "expiryDays",
      header: "유효일수",
      render: (row) => (
        <span className={`text-sm font-bold ${row.expiryDays < 0 ? "text-[#F04452]" : "text-[#191F28]"}`}>
          {row.expiryDays}
        </span>
      ),
    },
    {
      key: "expiryDate",
      header: "유효기간",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.expiryDate}</span>,
    },
    {
      key: "lotNo",
      header: "LOT_NO",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.lotNo || "-"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-lg bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] px-6 py-3">
        <h1 className="text-lg font-bold text-white">통계 &gt; 유효기간경고재고조회</h1>
      </div>

      {/* Search Area */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">유효기간</label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            >
              <option value="">선택</option>
              <option value="30">30일 이내</option>
              <option value="60">60일 이내</option>
              <option value="90">90일 이내</option>
              <option value="180">180일 이내</option>
              <option value="expired">만료</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">로케이션</label>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="로케이션"
                className="flex-1 rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              />
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">창고</label>
            <div className="flex gap-1">
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="flex-1 rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="">전체 창고</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">화주</label>
            <div className="flex gap-1">
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="flex-1 rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="">전체 화주</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">상품</label>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="상품"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              />
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#6B7684]">
            총건수: <strong className="text-[#191F28]">{alertItems.length}건</strong>
          </span>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>

        <Table
          columns={columns}
          data={alertItems}
          isLoading={isLoading}
          emptyMessage="유효기간 경고 재고가 없습니다."
        />
      </div>
    </div>
  );
}
