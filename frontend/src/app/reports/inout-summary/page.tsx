"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
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
import { formatNumber, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse, InventoryTransaction } from "@/types";

const PIE_COLORS = ["#3182F6", "#1FC47D", "#FF8B00", "#F04452", "#7B61FF", "#E5A100"];

const TX_LABELS: Record<string, string> = {
  INBOUND: "입고",
  OUTBOUND: "출고",
  ADJUSTMENT_IN: "조정(입)",
  ADJUSTMENT_OUT: "조정(출)",
  TRANSFER: "이동",
  CYCLE_COUNT: "실사",
  RETURN: "반품",
};

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function InOutSummaryPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page, limit };
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    return p;
  }, [page, limit, startDate, endDate]);

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
  const netChange = inboundTotal - outboundTotal;

  // Pie chart: transaction type breakdown
  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      const type = t.type;
      map.set(type, (map.get(type) ?? 0) + Math.abs(t.quantity));
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: TX_LABELS[name] ?? name,
      value,
    }));
  }, [transactions]);

  const columns: Column<InventoryTransaction>[] = [
    {
      key: "createdAt",
      header: "날짜",
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
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-3 py-1 text-xs font-semibold text-[#4E5968]">
          {TX_LABELS[row.type] ?? row.type}
        </span>
      ),
    },
    {
      key: "itemName",
      header: "품목",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {row.item?.name ?? row.item?.code ?? "-"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "수량",
      sortable: true,
      render: (row) => {
        const isPositive = row.quantity > 0;
        return (
          <span className={`text-sm font-bold ${isPositive ? "text-[#1FC47D]" : "text-[#F04452]"}`}>
            {isPositive ? "+" : ""}
            {formatNumber(row.quantity)}
          </span>
        );
      },
    },
    {
      key: "referenceId",
      header: "참조번호",
      render: (row) => (
        <span className="text-sm font-mono text-[#8B95A1]">
          {row.referenceId ? row.referenceId.slice(0, 8) : "-"}
        </span>
      ),
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
        <h1 className="text-2xl font-bold text-[#191F28]">입출고 현황</h1>
      </div>

      {/* Date range selector */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <button
            onClick={() => {
              const d = getDefaultDates();
              setStartDate(d.startDate);
              setEndDate(d.endDate);
              setPage(1);
            }}
            className="rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-sm font-medium text-[#8B95A1] transition-colors hover:bg-[#F7F8FA] hover:text-[#4E5968]"
          >
            최근 30일
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">총 입고</p>
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
              <p className="text-sm text-[#8B95A1]">총 출고</p>
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
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">순증감</p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  netChange >= 0 ? "text-[#3182F6]" : "text-[#F04452]"
                }`}
              >
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  `${netChange >= 0 ? "+" : ""}${formatNumber(netChange)}`
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2FF]">
              <TrendingUp className="h-6 w-6 text-[#3182F6]" />
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-6 text-lg font-bold text-[#191F28]">유형별 수량 분포</h2>
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

      {/* Table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">입출고 내역</h2>
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
