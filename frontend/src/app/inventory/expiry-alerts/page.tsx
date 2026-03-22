"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Clock, Package, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import { formatNumber } from "@/lib/utils";
import { useItems, useWarehouses, useInventoryList } from "@/hooks/useApi";
import type { Item } from "@/types";

export default function ExpiryAlertsPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [daysThreshold, setDaysThreshold] = useState(90);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: itemsResponse, isLoading } = useItems({ limit: 200, isActive: true });
  const allItems = itemsResponse?.data ?? [];

  // Items with minStock alerts (simulating expiry with low stock as proxy since no expiryDate in current schema)
  const { data: inventoryResponse } = useInventoryList({
    limit: 200,
    ...(warehouseId ? { warehouseId } : {}),
  });
  const inventoryItems = inventoryResponse?.data ?? [];

  // Build expiry alert list: items below minStock threshold
  const alertItems = useMemo(() => {
    const itemStockMap = new Map<string, { item: Item; totalQty: number; minStock: number; warehouses: string[] }>();

    for (const inv of inventoryItems) {
      if (!inv.item) continue;
      const key = inv.item.code;
      const existing = itemStockMap.get(key);
      const whName = inv.warehouse?.name ?? "";
      if (existing) {
        existing.totalQty += inv.quantity;
        if (whName && !existing.warehouses.includes(whName)) {
          existing.warehouses.push(whName);
        }
      } else {
        const fullItem = allItems.find((i) => i.id === inv.itemId);
        itemStockMap.set(key, {
          item: fullItem ?? inv.item as Item,
          totalQty: inv.quantity,
          minStock: fullItem?.minStock ?? 0,
          warehouses: whName ? [whName] : [],
        });
      }
    }

    return Array.from(itemStockMap.values())
      .filter((entry) => entry.minStock > 0 && entry.totalQty <= entry.minStock * (daysThreshold / 30))
      .sort((a, b) => (a.totalQty / (a.minStock || 1)) - (b.totalQty / (b.minStock || 1)));
  }, [inventoryItems, allItems, daysThreshold]);

  const columns: Column<typeof alertItems[number]>[] = [
    {
      key: "status",
      header: "",
      render: (row) => {
        const ratio = row.totalQty / (row.minStock || 1);
        return (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ratio < 0.5 ? "bg-[#FFEAED]" : "bg-[#FFF3E0]"}`}>
            <AlertTriangle className={`h-4 w-4 ${ratio < 0.5 ? "text-[#F04452]" : "text-[#FF8B00]"}`} />
          </div>
        );
      },
    },
    {
      key: "itemCode",
      header: "품목코드",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.item.code}</span>,
    },
    {
      key: "itemName",
      header: "품목명",
      render: (row) => <span className="text-sm font-medium text-[#191F28]">{row.item.name}</span>,
    },
    {
      key: "category",
      header: "카테고리",
      render: (row) => (
        <span className="rounded-lg bg-[#F2F4F6] px-2 py-1 text-xs font-medium text-[#4E5968]">{row.item.category}</span>
      ),
    },
    {
      key: "totalQty",
      header: "현재고",
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.totalQty)}</span>,
    },
    {
      key: "minStock",
      header: "안전재고",
      render: (row) => <span className="text-sm font-semibold text-[#FF8B00]">{formatNumber(row.minStock)}</span>,
    },
    {
      key: "ratio",
      header: "재고비율",
      render: (row) => {
        const pct = Math.round((row.totalQty / (row.minStock || 1)) * 100);
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-[#F2F4F6]">
              <div
                className={`h-full rounded-full ${pct < 50 ? "bg-[#F04452]" : pct < 100 ? "bg-[#FF8B00]" : "bg-[#1FC47D]"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${pct < 50 ? "text-[#F04452]" : pct < 100 ? "text-[#FF8B00]" : "text-[#1FC47D]"}`}>
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      key: "warehouses",
      header: "보관창고",
      render: (row) => <span className="text-xs text-[#8B95A1]">{row.warehouses.join(", ") || "-"}</span>,
    },
  ];

  const criticalCount = alertItems.filter((i) => (i.totalQty / (i.minStock || 1)) < 0.5).length;
  const warningCount = alertItems.filter((i) => {
    const r = i.totalQty / (i.minStock || 1);
    return r >= 0.5 && r < 1;
  }).length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#191F28]">유효기간 / 재고 경고 관리</h1>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">창고</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20">
              <option value="">전체 창고</option>
              {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name} ({w.code})</option>))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">경고 기준 (일)</label>
            <select value={daysThreshold} onChange={(e) => setDaysThreshold(Number(e.target.value))} className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20">
              <option value={30}>30일 이내</option>
              <option value={60}>60일 이내</option>
              <option value={90}>90일 이내</option>
              <option value={180}>180일 이내</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">위험 품목</p>
              <p className="mt-2 text-3xl font-bold text-[#F04452]">{criticalCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEAED]">
              <AlertTriangle className="h-6 w-6 text-[#F04452]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">주의 품목</p>
              <p className="mt-2 text-3xl font-bold text-[#FF8B00]">{warningCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4E6]">
              <Clock className="h-6 w-6 text-[#FF8B00]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">경고 대상 총</p>
              <p className="mt-2 text-3xl font-bold text-[#191F28]">{alertItems.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6]">
              <Package className="h-6 w-6 text-[#4E5968]" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <Table columns={columns} data={alertItems} isLoading={isLoading} emptyMessage="경고 대상 품목이 없습니다." />
      </div>
    </div>
  );
}
