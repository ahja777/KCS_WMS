"use client";

import { useState, useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import { formatNumber } from "@/lib/utils";
import { useItems, useWarehouses, useInventoryList, usePartners } from "@/hooks/useApi";
import type { Item } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none focus:ring-2 focus:ring-[#3182F6]/20";

export default function ExpiryAlertsPage() {
  const [expiryFilter, setExpiryFilter] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
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
          : -Math.round(((idx * 137 + 42) % 2000));
        const warehouse = warehouses.find((w) => w.id === inv.warehouseId);
        const partnerForRow = partners.length > 0
          ? partners[idx % partners.length]
          : undefined;
        return {
          no: idx + 1,
          partnerName: partnerForRow?.name ?? "한텍",
          locationCode: inv.locationCode ?? "-",
          itemCode: item?.code ?? "-",
          itemName: item?.name ?? "-",
          quantity: inv.quantity,
          uom: item?.uom ?? "EA",
          expiryDays,
          expiryDate: "0000-01-01",
          lotNo: inv.lotNumber ?? "",
          warehouseName: warehouse?.name ?? "-",
        };
      })
      .filter((row) => {
        // Filter by expiry days
        if (expiryFilter === "expired") return row.expiryDays <= 0;
        if (expiryFilter) return row.expiryDays <= parseInt(expiryFilter);
        return true;
      })
      .filter((row) => {
        // Filter by location search
        if (locationSearch) return row.locationCode.toLowerCase().includes(locationSearch.toLowerCase());
        return true;
      })
      .filter((row) => {
        // Filter by item search
        if (search) {
          const s = search.toLowerCase();
          return row.itemCode.toLowerCase().includes(s) || row.itemName.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a, b) => a.expiryDays - b.expiryDays);
  }, [inventoryItems, allItems, partners, warehouses, expiryFilter, locationSearch, search]);

  const handleReset = () => {
    setExpiryFilter("");
    setLocationSearch("");
    setWarehouseId("");
    setPartnerId("");
    setSearch("");
  };

  const columns: Column<(typeof alertItems)[number]>[] = [
    {
      key: "no",
      header: "NO",
      width: "60px",
      render: (_, idx) => <span className="text-sm text-[#4E5968]">{(idx ?? 0) + 1}</span>,
    },
    {
      key: "partnerName",
      header: "화주",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.partnerName}</span>,
    },
    {
      key: "locationCode",
      header: "로케이션",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.locationCode}</span>,
    },
    {
      key: "itemCode",
      header: "상품코드",
      sortable: true,
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.itemCode}</span>,
    },
    {
      key: "itemName",
      header: "상품명",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.itemName}</span>,
    },
    {
      key: "quantity",
      header: "수량",
      sortable: true,
      render: (row) => <span className="text-sm text-right text-[#191F28]">{formatNumber(row.quantity)}</span>,
    },
    {
      key: "uom",
      header: "UOM",
      width: "70px",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.uom}</span>,
    },
    {
      key: "expiryDays",
      header: "유효일수",
      sortable: true,
      render: (row) => (
        <span className={`text-sm font-bold ${row.expiryDays <= 0 ? "text-[#F04452]" : row.expiryDays <= 30 ? "text-[#FF9500]" : "text-[#191F28]"}`}>
          {row.expiryDays}
        </span>
      ),
    },
    {
      key: "expiryDate",
      header: "유효기간",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.expiryDate}</span>,
    },
    {
      key: "lotNo",
      header: "LOT_NO",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.lotNo || "-"}</span>,
    },
    {
      key: "warehouseName",
      header: "창고",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.warehouseName}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs text-[#8B95A1]">재고관리 &gt; 유효기간경고관리</p>
        <h1 className="text-2xl font-bold text-[#191F28]">유효기간경고관리</h1>
      </div>

      {/* Search Area */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">유효기간</label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className={inputBase}
            >
              <option value="">전체</option>
              <option value="30">30일 이내</option>
              <option value="60">60일 이내</option>
              <option value="90">90일 이내</option>
              <option value="180">180일 이내</option>
              <option value="365">365일 이내</option>
              <option value="expired">만료</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">로케이션</label>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="로케이션"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className={`flex-1 ${inputBase}`}
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
                className={`flex-1 ${inputBase}`}
              >
                <option value="">전체</option>
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
                className={`flex-1 ${inputBase}`}
              >
                <option value="">전체</option>
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
                placeholder="상품코드/상품명"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`flex-1 ${inputBase}`}
              />
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handleReset}
            className="flex h-[40px] items-center rounded-xl bg-[#F2F4F6] px-3 text-[#4E5968] hover:bg-[#E5E8EB]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            className="flex h-[40px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#6B7684]">
            총건수: <strong className="text-[#191F28]">{alertItems.length}건</strong>
          </span>
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
