"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { formatNumber, formatDate } from "@/lib/utils";
import { useWarehouses } from "@/hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { PaginatedResponse, InventoryTransaction } from "@/types";

const TX_TYPE_FILTERS = [
  { value: "", label: "전체" },
  { value: "INBOUND", label: "INBOUND" },
  { value: "OUTBOUND", label: "OUTBOUND" },
  { value: "ADJUSTMENT_IN", label: "ADJUSTMENT_IN" },
  { value: "ADJUSTMENT_OUT", label: "ADJUSTMENT_OUT" },
  { value: "TRANSFER", label: "TRANSFER" },
  { value: "CYCLE_COUNT", label: "CYCLE_COUNT" },
  { value: "RETURN", label: "RETURN" },
] as const;

const TX_TYPE_COLORS: Record<string, string> = {
  INBOUND: "bg-[#E8F7EF] text-[#1FC47D]",
  OUTBOUND: "bg-[#FFEAED] text-[#F04452]",
  ADJUSTMENT_IN: "bg-[#E8F2FF] text-[#3182F6]",
  ADJUSTMENT_OUT: "bg-[#FFF3E0] text-[#FF8B00]",
  TRANSFER: "bg-[#F3EEFF] text-[#7B61FF]",
  CYCLE_COUNT: "bg-[#F2F4F6] text-[#8B95A1]",
  RETURN: "bg-[#FFF8E1] text-[#E5A100]",
};

function getTxTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INBOUND: "입고",
    OUTBOUND: "출고",
    ADJUSTMENT_IN: "조정(입)",
    ADJUSTMENT_OUT: "조정(출)",
    TRANSFER: "이동",
    CYCLE_COUNT: "실사",
    RETURN: "반품",
  };
  return labels[type] || type;
}

function TxBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TX_TYPE_COLORS[type] || "bg-[#F2F4F6] text-[#8B95A1]"}`}
    >
      {getTxTypeLabel(type)}
    </span>
  );
}

export default function InventoryTransactionsPage() {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Warehouses for filter dropdown
  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouseOptions = [
    { value: "", label: "전체 창고" },
    ...(warehouseResponse?.data ?? []).map((w) => ({
      value: w.id,
      label: w.name,
    })),
  ];

  // Build warehouse lookup for display
  const warehouseMap = useMemo(() => {
    const map: Record<string, string> = {};
    (warehouseResponse?.data ?? []).forEach((w) => {
      map[w.id] = w.name;
    });
    return map;
  }, [warehouseResponse]);

  // Fetch transactions
  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page, limit };
    if (warehouseFilter) p.warehouseId = warehouseFilter;
    if (txTypeFilter) p.txType = txTypeFilter;
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    if (search) p.search = search;
    return p;
  }, [page, limit, warehouseFilter, txTypeFilter, startDate, endDate, search]);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<PaginatedResponse<InventoryTransaction>>({
    queryKey: ["inventory-transactions", queryParams],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/inventory/transactions", {
        params: queryParams,
      });
      return wrapped.data;
    },
  });

  const transactions = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Summary calculations
  const inboundTotal = useMemo(
    () =>
      transactions
        .filter((t) => t.quantity > 0)
        .reduce((sum, t) => sum + t.quantity, 0),
    [transactions]
  );
  const outboundTotal = useMemo(
    () =>
      transactions
        .filter((t) => t.quantity < 0)
        .reduce((sum, t) => sum + Math.abs(t.quantity), 0),
    [transactions]
  );

  const columns: Column<InventoryTransaction>[] = [
    {
      key: "createdAt",
      header: "일시",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#4E5968] whitespace-nowrap">
          {formatDate(row.createdAt, "yyyy-MM-dd HH:mm")}
        </span>
      ),
    },
    {
      key: "type",
      header: "유형",
      render: (row) => <TxBadge type={row.type} />,
    },
    {
      key: "warehouseId",
      header: "창고",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {warehouseMap[row.warehouseId] || row.warehouseId}
        </span>
      ),
    },
    {
      key: "itemCode",
      header: "품목코드",
      render: (row) => (
        <span className="text-sm font-medium text-[#191F28]">
          {row.item?.code ?? "-"}
        </span>
      ),
    },
    {
      key: "itemName",
      header: "품목명",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {row.item?.name ?? "-"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "수량(+/-)",
      sortable: true,
      render: (row) => {
        const isPositive = row.quantity > 0;
        return (
          <span
            className={`text-sm font-bold ${isPositive ? "text-[#1FC47D]" : "text-[#F04452]"}`}
          >
            {isPositive ? "+" : ""}
            {formatNumber(row.quantity)}
          </span>
        );
      },
    },
    {
      key: "locationCode",
      header: "위치",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {(row as unknown as Record<string, string>).locationCode ?? "-"}
        </span>
      ),
    },
    {
      key: "lotNumber",
      header: "LOT번호",
      render: (row) => (
        <span className="text-sm text-[#8B95A1]">
          {(row as unknown as Record<string, string>).lotNumber ?? "-"}
        </span>
      ),
    },
    {
      key: "referenceType",
      header: "참조유형",
      render: (row) => (
        <span className="text-sm text-[#8B95A1]">
          {row.referenceType ?? "-"}
        </span>
      ),
    },
    {
      key: "referenceId",
      header: "참조ID",
      render: (row) => (
        <span className="text-sm text-[#8B95A1] font-mono">
          {row.referenceId ? row.referenceId.slice(0, 8) : "-"}
        </span>
      ),
    },
    {
      key: "createdBy",
      header: "처리자",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {row.createdBy ?? "-"}
        </span>
      ),
    },
    {
      key: "notes",
      header: "비고",
      render: (row) => (
        <span className="text-sm text-[#8B95A1] max-w-[160px] truncate block">
          {row.notes ?? "-"}
        </span>
      ),
    },
  ];

  const resetFilters = () => {
    setSearch("");
    setWarehouseFilter("");
    setTxTypeFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">
          입출고 내역
        </h1>
      </div>

      <InventoryTabNav />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">조회 결과</p>
              <p className="mt-2 text-3xl font-bold text-[#191F28]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(total)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2FF]">
              <BarChart3 className="h-6 w-6 text-[#3182F6]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">입고 합계 (현재 페이지)</p>
              <p className="mt-2 text-3xl font-bold text-[#1FC47D]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  `+${formatNumber(inboundTotal)}`
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F7EF]">
              <ArrowDownCircle className="h-6 w-6 text-[#1FC47D]" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">출고 합계 (현재 페이지)</p>
              <p className="mt-2 text-3xl font-bold text-[#F04452]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  `-${formatNumber(outboundTotal)}`
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEAED]">
              <ArrowUpCircle className="h-6 w-6 text-[#F04452]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-5">
          {/* Row 1: Warehouse + Search */}
          <div className="flex flex-wrap items-center gap-4">
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

            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
              <input
                type="text"
                placeholder="품목코드/품목명 검색..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
              />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
              />
            </div>

            <button
              onClick={resetFilters}
              className="rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-sm font-medium text-[#8B95A1] transition-colors hover:bg-[#F7F8FA] hover:text-[#4E5968]"
            >
              초기화
            </button>
          </div>

          {/* Row 2: Transaction type pills */}
          <div className="flex flex-wrap gap-2">
            {TX_TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setTxTypeFilter(f.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  txTypeFilter === f.value
                    ? "bg-[#191F28] text-white shadow-sm"
                    : "bg-[#F7F8FA] text-[#4E5968] hover:bg-[#F2F4F6]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={transactions}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            emptyMessage="입출고 내역이 없습니다."
          />
        )}
      </div>
    </div>
  );
}
