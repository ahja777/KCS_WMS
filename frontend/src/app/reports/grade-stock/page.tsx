"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import { useInventoryList } from "@/hooks/useApi";

const PIE_COLORS = ["#1FC47D", "#F04452"];

const CATEGORY_LABELS: Record<string, string> = {
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
  status: string;
  statusLabel: string;
  itemCode: string;
  itemName: string;
  category: string;
  categoryLabel: string;
  quantity: number;
  availableQty: number;
}

export default function GradeStockPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    limit: 500,
  });

  const inventoryItems = inventoryResponse?.data ?? [];

  // Build rows grouped by item active status
  const allRows = useMemo(() => {
    const rows: GradeRow[] = [];
    inventoryItems.forEach((inv) => {
      const isActive = inv.item?.isActive !== false;
      rows.push({
        id: inv.id,
        status: isActive ? "ACTIVE" : "INACTIVE",
        statusLabel: isActive ? "활성" : "비활성",
        itemCode: inv.item?.code ?? "-",
        itemName: inv.item?.name ?? "-",
        category: inv.item?.category ?? "GENERAL",
        categoryLabel: CATEGORY_LABELS[inv.item?.category ?? "GENERAL"] ?? inv.item?.category ?? "-",
        quantity: inv.quantity,
        availableQty: inv.availableQty,
      });
    });
    return rows;
  }, [inventoryItems]);

  // Summary
  const activeItems = useMemo(
    () => new Set(allRows.filter((r) => r.status === "ACTIVE").map((r) => r.itemCode)).size,
    [allRows]
  );
  const inactiveItems = useMemo(
    () => new Set(allRows.filter((r) => r.status === "INACTIVE").map((r) => r.itemCode)).size,
    [allRows]
  );
  const totalStock = useMemo(
    () => allRows.reduce((s, r) => s + r.quantity, 0),
    [allRows]
  );

  // Pie data
  const pieData = useMemo(() => {
    const activeQty = allRows
      .filter((r) => r.status === "ACTIVE")
      .reduce((s, r) => s + r.quantity, 0);
    const inactiveQty = allRows
      .filter((r) => r.status === "INACTIVE")
      .reduce((s, r) => s + r.quantity, 0);
    return [
      { name: "활성", value: activeQty },
      { name: "비활성", value: inactiveQty },
    ].filter((d) => d.value > 0);
  }, [allRows]);

  // Filter
  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return allRows;
    return allRows.filter((r) => r.status === statusFilter);
  }, [allRows, statusFilter]);

  // Pagination
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<GradeRow>[] = [
    {
      key: "status",
      header: "상태",
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: "itemCode",
      header: "품목코드",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-medium text-[#191F28]">{row.itemCode}</span>
      ),
    },
    {
      key: "itemName",
      header: "품목명",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.itemName}</span>,
    },
    {
      key: "category",
      header: "카테고리",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-3 py-1 text-xs font-semibold text-[#4E5968]">
          {row.categoryLabel}
        </span>
      ),
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
  ];

  const statusFilters = [
    { key: "ALL", label: "전체" },
    { key: "ACTIVE", label: "활성" },
    { key: "INACTIVE", label: "비활성" },
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
        <h1 className="text-2xl font-bold text-[#191F28]">등급별 재고현황조회</h1>
        <span className="rounded-full bg-[#F2F4F6] px-3 py-1 text-xs font-medium text-[#8B95A1]">
          WMSTG100
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">활성 품목수</p>
              <p className="mt-2 text-3xl font-bold text-[#1FC47D]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(activeItems)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8FAF0]">
              <CheckCircle className="h-6 w-6 text-[#1FC47D]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">비활성 품목수</p>
              <p className="mt-2 text-3xl font-bold text-[#F04452]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(inactiveItems)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEAED]">
              <XCircle className="h-6 w-6 text-[#F04452]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">총 재고</p>
              <p className="mt-2 text-3xl font-bold text-[#191F28]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(totalStock)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3FF]">
              <Package className="h-6 w-6 text-[#3182F6]" />
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-6 text-lg font-bold text-[#191F28]">활성/비활성 분포</h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [formatNumber(value), "수량"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Status filter + Table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#191F28]">재고 상세</h2>
          <div className="flex items-center gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatusFilter(f.key);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.key
                    ? "bg-[#3182F6] text-white"
                    : "bg-[#F2F4F6] text-[#8B95A1] hover:bg-[#E5E8EB]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
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
            total={filteredRows.length}
            onPageChange={setPage}
            emptyMessage="재고 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
