"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { cn, formatNumber } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/useApi";

const alertIcons = {
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const alertBorderColors = {
  warning: "border-l-amber-400",
  error: "border-l-red-400",
  info: "border-l-[#3182F6]",
};

const alertIconColors = {
  warning: "text-amber-400",
  error: "text-red-400",
  info: "text-[#3182F6]",
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { data: summary, isLoading, error } = useDashboardSummary();

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalInventory = summary?.inventory?.totalQuantity ?? 0;
  const todayInbound = summary?.inbound?.recentCount ?? 0;
  const todayOutbound = summary?.outbound?.recentCount ?? 0;
  const pendingTasks =
    (summary?.inbound?.pendingCount ?? 0) +
    (summary?.outbound?.pendingCount ?? 0);

  const summaryCards = [
    {
      label: "총 재고 수량",
      value: totalInventory,
      icon: Boxes,
      iconBg: "bg-[#E8F3FF]",
      iconColor: "text-[#3182F6]",
    },
    {
      label: "금일 입고",
      value: todayInbound,
      icon: ArrowDownToLine,
      iconBg: "bg-[#E8FAF0]",
      iconColor: "text-[#00C853]",
    },
    {
      label: "금일 출고",
      value: todayOutbound,
      icon: ArrowUpFromLine,
      iconBg: "bg-[#F3EEFF]",
      iconColor: "text-[#8B5CF6]",
    },
    {
      label: "처리 대기",
      value: pendingTasks,
      icon: ClipboardList,
      iconBg: "bg-[#FFF4E6]",
      iconColor: "text-[#FF9500]",
    },
  ];

  const inboundByStatus = summary?.inbound?.byStatus ?? {};
  const outboundByStatus = summary?.outbound?.byStatus ?? {};
  const allStatuses = new Set([
    ...Object.keys(inboundByStatus),
    ...Object.keys(outboundByStatus),
  ]);
  const chartData = Array.from(allStatuses).map((status) => ({
    status,
    inbound: (inboundByStatus as Record<string, number>)[status] ?? 0,
    outbound: (outboundByStatus as Record<string, number>)[status] ?? 0,
  }));

  const lowStockAlerts =
    summary?.alerts?.lowStockItems?.map((item) => ({
      id: item.id,
      type: "warning" as const,
      message: `재고 부족 경고: ${item.name} (현재 ${formatNumber(item.totalQty)} / 안전재고 ${formatNumber(item.minStock)})`,
    })) ?? [];

  // recentTransactions is a count (number), not an array
  const alerts = [
    ...lowStockAlerts,
    ...(summary?.alerts?.recentTransactions
      ? [
          {
            id: "recent-tx",
            type: "info" as const,
            message: `최근 24시간 재고 트랜잭션: ${summary.alerts.recentTransactions}건`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-[#191F28]">대시보드</h1>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          대시보드 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#8B95A1]">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-[#191F28]">
                    {isLoading ? (
                      <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                    ) : (
                      formatNumber(card.value)
                    )}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl",
                    card.iconBg
                  )}
                >
                  <Icon className={cn("h-7 w-7", card.iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-[#191F28]">
            입출고 상태별 현황
          </h2>
          <div className="h-[320px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-48 w-full animate-pulse rounded-2xl bg-[#F2F4F6]" />
              </div>
            ) : mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8}>
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 12, fill: "#8B95A1" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#8B95A1" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      padding: "12px 16px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "13px", color: "#8B95A1" }}
                  />
                  <Bar
                    dataKey="inbound"
                    name="입고"
                    fill="#3182F6"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="outbound"
                    name="출고"
                    fill="#8B5CF6"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#8B95A1]">
                데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#191F28]">알림</h2>
            {!isLoading && alerts.length > 0 && (
              <span className="rounded-full bg-[#FF3B30] px-2.5 py-0.5 text-xs font-semibold text-white">
                {alerts.length}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-[#F2F4F6]"
                />
              ))
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8B95A1]">
                알림이 없습니다.
              </div>
            ) : (
              alerts.map((alert) => {
                const Icon = alertIcons[alert.type];
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex gap-3 rounded-xl border-l-[3px] bg-[#F7F8FA] p-4 transition-colors hover:bg-[#F2F4F6]",
                      alertBorderColors[alert.type]
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        alertIconColors[alert.type]
                      )}
                    />
                    <p className="min-w-0 text-sm text-[#4E5968]">
                      {alert.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
