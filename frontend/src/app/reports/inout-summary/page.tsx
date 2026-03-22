"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/utils";
import { useWarehouses } from "@/hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { downloadExcel } from "@/lib/export";
import type { PaginatedResponse, InventoryTransaction } from "@/types";

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

interface DailySummaryRow {
  id: string;
  date: string;
  inboundCount: number;
  inboundQty: number;
  outboundCount: number;
  outboundQty: number;
  stockQty: number;
}

export default function InOutSummaryPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [warehouseId, setWarehouseId] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page, limit };
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    if (warehouseId) p.warehouseId = warehouseId;
    return p;
  }, [page, limit, startDate, endDate, warehouseId]);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<PaginatedResponse<InventoryTransaction>>({
    queryKey: ["inout-summary-transactions", queryParams],
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

  // Aggregate transactions into daily summary rows
  const dailySummary = useMemo(() => {
    const map = new Map<string, { inCount: number; inQty: number; outCount: number; outQty: number; net: number }>();
    transactions.forEach((t) => {
      const dateStr = formatDate(t.createdAt) || t.createdAt.slice(0, 10);
      const existing = map.get(dateStr) ?? { inCount: 0, inQty: 0, outCount: 0, outQty: 0, net: 0 };
      if (t.quantity > 0) {
        existing.inCount += 1;
        existing.inQty += t.quantity;
      } else {
        existing.outCount += 1;
        existing.outQty += Math.abs(t.quantity);
      }
      existing.net += t.quantity;
      map.set(dateStr, existing);
    });

    const rows: DailySummaryRow[] = [];
    let runningStock = 0;
    const sortedEntries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    sortedEntries.forEach(([date, val]) => {
      runningStock += val.net;
      rows.push({
        id: date,
        date,
        inboundCount: val.inCount,
        inboundQty: val.inQty,
        outboundCount: val.outCount,
        outboundQty: val.outQty,
        stockQty: runningStock,
      });
    });
    return rows;
  }, [transactions]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (warehouseId) params.set("warehouseId", warehouseId);
    const qs = params.toString();
    downloadExcel(`/export/inventory/transactions${qs ? `?${qs}` : ""}`, "입출고통계.xlsx");
  }, [startDate, endDate, warehouseId]);

  const columns: Column<DailySummaryRow>[] = [
    {
      key: "date",
      header: "일자",
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-[#191F28]">{row.date}</span>,
    },
    {
      key: "inboundCount",
      header: "입고건수",
      render: (row) => <span className="text-sm text-[#1FC47D] font-semibold">{formatNumber(row.inboundCount)}</span>,
    },
    {
      key: "inboundQty",
      header: "입고수량",
      render: (row) => <span className="text-sm font-bold text-[#1FC47D]">{formatNumber(row.inboundQty)}</span>,
    },
    {
      key: "outboundCount",
      header: "출고건수",
      render: (row) => <span className="text-sm text-[#F04452] font-semibold">{formatNumber(row.outboundCount)}</span>,
    },
    {
      key: "outboundQty",
      header: "출고수량",
      render: (row) => <span className="text-sm font-bold text-[#F04452]">{formatNumber(row.outboundQty)}</span>,
    },
    {
      key: "stockQty",
      header: "재고량",
      render: (row) => (
        <span className={`text-sm font-bold ${row.stockQty >= 0 ? "text-[#3182F6]" : "text-[#F04452]"}`}>
          {formatNumber(row.stockQty)}
        </span>
      ),
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
            <h1 className="text-2xl font-bold text-[#191F28]">입출고통계</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; 입출고통계</p>
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
          <div className="min-w-[150px]">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">기간(From)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">기간(To)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
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
            data={dailySummary}
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
