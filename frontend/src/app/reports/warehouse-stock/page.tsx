"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Package, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Table, { type Column } from "@/components/ui/Table";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import type { Inventory } from "@/types";

const CHART_COLORS = {
  quantity: "#3182F6",
  availableQty: "#1FC47D",
  reservedQty: "#FF8B00",
};

export default function WarehouseStockReportPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [page, setPage] = useState(1);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    page,
    limit: 50,
    ...(warehouseId ? { warehouseId } : {}),
  });

  const inventoryItems = inventoryResponse?.data ?? [];
  const total = inventoryResponse?.total ?? 0;
  const totalPages = inventoryResponse?.totalPages ?? 1;

  // Summary
  const summary = useMemo(() => {
    return {
      totalQty: inventoryItems.reduce((s, i) => s + i.quantity, 0),
      reservedQty: inventoryItems.reduce((s, i) => s + i.reservedQty, 0),
      availableQty: inventoryItems.reduce((s, i) => s + i.availableQty, 0),
    };
  }, [inventoryItems]);

  // Chart data: aggregate by item
  const chartData = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; availableQty: number; reservedQty: number }>();
    inventoryItems.forEach((inv) => {
      const key = inv.item?.code ?? inv.itemId;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += inv.quantity;
        existing.availableQty += inv.availableQty;
        existing.reservedQty += inv.reservedQty;
      } else {
        map.set(key, {
          name: inv.item?.name ?? key,
          quantity: inv.quantity,
          availableQty: inv.availableQty,
          reservedQty: inv.reservedQty,
        });
      }
    });
    return Array.from(map.values()).slice(0, 15);
  }, [inventoryItems]);

  const columns: Column<Inventory>[] = [
    {
      key: "item",
      header: "품목코드",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-medium text-[#191F28]">{row.item?.code ?? "-"}</span>
      ),
    },
    {
      key: "itemName",
      header: "품목명",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.item?.name ?? "-"}</span>,
    },
    {
      key: "quantity",
      header: "수량",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.quantity)}</span>
      ),
    },
    {
      key: "availableQty",
      header: "가용수량",
      render: (row) => (
        <span className="text-sm font-semibold text-[#1FC47D]">{formatNumber(row.availableQty)}</span>
      ),
    },
    {
      key: "reservedQty",
      header: "예약수량",
      render: (row) =>
        row.reservedQty > 0 ? (
          <span className="text-sm font-semibold text-[#FF8B00]">{formatNumber(row.reservedQty)}</span>
        ) : (
          <span className="text-sm text-[#8B95A1]">0</span>
        ),
    },
    {
      key: "locationCode",
      header: "로케이션",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.locationCode ?? "-"}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/reports"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4E5968] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#F2F4F6]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[#191F28]">창고별 재고 현황</h1>
      </div>

      {/* Warehouse selector */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <label className="mb-2 block text-sm font-medium text-[#4E5968]">창고 선택</label>
        <select
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-sm rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
        >
          <option value="">전체 창고</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.code})
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">총 재고</p>
              <p className="mt-2 text-3xl font-bold text-[#191F28]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(summary.totalQty)
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
              <p className="text-sm text-[#8B95A1]">예약 수량</p>
              <p className="mt-2 text-3xl font-bold text-[#FF8B00]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(summary.reservedQty)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4E6]">
              <Clock className="h-6 w-6 text-[#FF8B00]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">가용 수량</p>
              <p className="mt-2 text-3xl font-bold text-[#1FC47D]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(summary.availableQty)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8FAF0]">
              <CheckCircle className="h-6 w-6 text-[#1FC47D]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-6 text-lg font-bold text-[#191F28]">품목별 재고 현황</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6B7684" }}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12, fill: "#6B7684" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      quantity: "총 수량",
                      availableQty: "가용 수량",
                      reservedQty: "예약 수량",
                    };
                    return [formatNumber(value), labels[name] ?? name];
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    const labels: Record<string, string> = {
                      quantity: "총 수량",
                      availableQty: "가용 수량",
                      reservedQty: "예약 수량",
                    };
                    return labels[value] ?? value;
                  }}
                />
                <Bar dataKey="quantity" fill={CHART_COLORS.quantity} radius={[4, 4, 0, 0]} />
                <Bar dataKey="availableQty" fill={CHART_COLORS.availableQty} radius={[4, 4, 0, 0]} />
                <Bar dataKey="reservedQty" fill={CHART_COLORS.reservedQty} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">재고 상세</h2>
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
            emptyMessage="재고 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
