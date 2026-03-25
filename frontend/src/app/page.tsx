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
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  UserCheck,
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
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null);
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

  // 배송 진행 데이터
  const dispatchData = summary?.dispatch;
  const statusCounts = dispatchData?.statusCounts ?? {};
  const todayDispatches = dispatchData?.todayDispatches ?? [];
  const dispatchTotal = dispatchData?.totalCount ?? 0;

  const trackingSteps = [
    { key: "PLANNED", label: "주문접수", icon: Package },
    { key: "ASSIGNED", label: "배차완료", icon: ClipboardList },
    { key: "IN_PROGRESS", label: "배송중", icon: Truck },
    { key: "COMPLETED", label: "배송완료", icon: UserCheck },
  ] as const;

  const statusOrder: Record<string, number> = {
    PLANNED: 0,
    ASSIGNED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: -1,
  };

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

      {/* 배송 진행상황 */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#191F28]">배송 진행상황</h2>
            {!isLoading && dispatchTotal > 0 && (
              <span className="rounded-full bg-[#E8F3FF] px-2.5 py-0.5 text-xs font-semibold text-[#3182F6]">
                총 {dispatchTotal}건
              </span>
            )}
          </div>
          {!isLoading && dispatchTotal > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#8B95A1] sm:gap-4">
              {(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((key) => {
                const dotColor: Record<string, string> = {
                  PLANNED: "bg-[#8B95A1]", IN_PROGRESS: "bg-[#FF9500]",
                  COMPLETED: "bg-[#00C853]", CANCELLED: "bg-[#FF3B30]",
                };
                const dotLabel: Record<string, string> = {
                  PLANNED: "대기", IN_PROGRESS: "배송중",
                  COMPLETED: "완료", CANCELLED: "취소",
                };
                return (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={cn("inline-block h-2 w-2 rounded-full", dotColor[key])} />
                    {dotLabel[key]} {statusCounts[key] ?? 0}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F2F4F6]" />
            ))}
          </div>
        ) : todayDispatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-[#8B95A1]">
            <Truck className="mb-3 h-10 w-10 text-[#D5DAE0]" />
            <p className="text-sm">최근 한 달간 배송 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* 좌측: 배송 목록 테이블 */}
            <div className="lg:col-span-3">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F2F4F6] text-xs text-[#8B95A1]">
                    <th className="pb-3 text-left font-medium">배송정보</th>
                    <th className="pb-3 text-left font-medium">차량 / 기사</th>
                    <th className="pb-3 text-center font-medium">품목</th>
                    <th className="pb-3 text-center font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {todayDispatches.map((d) => {
                    const isCancelled = d.status === "CANCELLED";
                    const isSelected = selectedDispatchId === d.id;
                    const statusBadge: Record<string, { label: string; cls: string }> = {
                      PLANNED: { label: "대기", cls: "bg-[#F2F4F6] text-[#6B7684]" },
                      ASSIGNED: { label: "배차", cls: "bg-[#E8F3FF] text-[#3182F6]" },
                      IN_PROGRESS: { label: "배송중", cls: "bg-[#FFF4E6] text-[#FF9500]" },
                      COMPLETED: { label: "완료", cls: "bg-[#E8FAF0] text-[#00C853]" },
                      CANCELLED: { label: "취소", cls: "bg-[#FFF0F0] text-[#FF3B30]" },
                    };
                    const badge = statusBadge[d.status] ?? statusBadge.PLANNED;
                    return (
                      <tr
                        key={d.id}
                        onClick={() => setSelectedDispatchId(isSelected ? null : d.id)}
                        className={cn(
                          "cursor-pointer border-b border-[#F7F8FA] transition-colors",
                          isSelected
                            ? "bg-[#F0F6FF]"
                            : "hover:bg-[#FAFBFC]"
                        )}
                      >
                        <td className="py-3.5">
                          <p className="text-sm font-medium text-[#191F28]">{d.notes || d.warehouse.name}</p>
                          <p className="mt-0.5 text-xs text-[#8B95A1]">{d.warehouse.name}</p>
                        </td>
                        <td className="py-3.5">
                          {d.vehicle ? (
                            <div>
                              <p className="text-sm text-[#333D4B]">{d.vehicle.plateNo}</p>
                              <p className="mt-0.5 text-xs text-[#8B95A1]">{d.vehicle.driverName}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-[#C4C9D0]">미배정</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center text-sm text-[#4E5968]">
                          {d.items.length}건
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-medium", badge.cls)}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 우측: 선택 건 배송 추적 상세 */}
            <div className="lg:col-span-2">
              {(() => {
                const selected = todayDispatches.find((d) => d.id === selectedDispatchId);
                if (!selected) {
                  return (
                    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E8EB] py-16 text-[#8B95A1]">
                      <Package className="mb-3 h-10 w-10 text-[#D5DAE0]" />
                      <p className="text-sm">배송 건을 선택하면</p>
                      <p className="text-sm">추적 정보가 표시됩니다.</p>
                    </div>
                  );
                }

                const currentStep = statusOrder[selected.status] ?? 0;
                const isCancelled = selected.status === "CANCELLED";
                const totalQty = selected.items.reduce((s, i) => s + i.orderedQty, 0);
                const doneQty = selected.items.reduce((s, i) => s + i.dispatchedQty, 0);
                const pct = totalQty > 0 ? Math.round((doneQty / totalQty) * 100) : 0;

                return (
                  <div className="rounded-xl border border-[#E5E8EB] bg-[#FAFBFC] p-5">
                    {/* 헤더 */}
                    <div className="mb-5 flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isCancelled ? "bg-[#FFF0F0]" : selected.status === "COMPLETED" ? "bg-[#E8FAF0]" : "bg-[#E8F3FF]"
                      )}>
                        <Truck className={cn(
                          "h-5 w-5",
                          isCancelled ? "text-[#FF3B30]" : selected.status === "COMPLETED" ? "text-[#00C853]" : "text-[#3182F6]"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#191F28]">{selected.notes || selected.warehouse.name}</p>
                        <p className="text-xs text-[#8B95A1]">
                          {selected.vehicle ? `${selected.vehicle.plateNo} · ${selected.vehicle.driverName}` : "차량 미배정"}
                        </p>
                      </div>
                    </div>

                    {/* 취소 건 */}
                    {isCancelled ? (
                      <div className="flex flex-col items-center rounded-xl bg-[#FFF0F0] py-8">
                        <XCircle className="mb-2 h-8 w-8 text-[#FF3B30]" />
                        <p className="text-sm font-medium text-[#FF3B30]">배송 취소됨</p>
                      </div>
                    ) : (
                      <>
                        {/* 수량 진행률 */}
                        <div className="mb-5">
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-[#8B95A1]">처리 수량</span>
                            <span className="font-semibold text-[#191F28]">{doneQty} / {totalQty} ({pct}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#F2F4F6]">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                pct === 100 ? "bg-[#00C853]" : "bg-[#3182F6]"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* 배송 추적 타임라인 (세로형) */}
                        <div className="space-y-0">
                          {trackingSteps.map((step, idx) => {
                            const isActive = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            const StepIcon = step.icon;
                            const isLast = idx === trackingSteps.length - 1;

                            return (
                              <div key={step.key} className="flex gap-3">
                                {/* 아이콘 + 연결선 */}
                                <div className="flex flex-col items-center">
                                  <div
                                    className={cn(
                                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                      isCurrent
                                        ? "border-[#3182F6] bg-[#3182F6] text-white shadow-[0_0_0_4px_rgba(49,130,246,0.12)]"
                                        : isActive
                                          ? "border-[#00C853] bg-[#00C853] text-white"
                                          : "border-[#E5E8EB] bg-white text-[#D5DAE0]"
                                    )}
                                  >
                                    <StepIcon className="h-3.5 w-3.5" />
                                  </div>
                                  {!isLast && (
                                    <div className={cn(
                                      "w-0.5 flex-1 min-h-[20px]",
                                      idx < currentStep ? "bg-[#00C853]" : "bg-[#E5E8EB]"
                                    )} />
                                  )}
                                </div>
                                {/* 텍스트 */}
                                <div className={cn("pb-4", isLast && "pb-0")}>
                                  <p className={cn(
                                    "text-sm font-medium",
                                    isCurrent ? "text-[#3182F6]" : isActive ? "text-[#191F28]" : "text-[#C4C9D0]"
                                  )}>
                                    {step.label}
                                  </p>
                                  {isActive && (
                                    <p className="mt-0.5 text-xs text-[#8B95A1]">
                                      {isCurrent && idx === 2 ? "현재 배송 진행중입니다" : ""}
                                      {isCurrent && idx === 0 ? "주문이 접수되었습니다" : ""}
                                      {isCurrent && idx === 1 ? "차량이 배정되었습니다" : ""}
                                      {isCurrent && idx === 3 ? "배송이 완료되었습니다" : ""}
                                      {!isCurrent && isActive ? "완료" : ""}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* 품목 목록 */}
                    {selected.items.length > 0 && (
                      <div className="mt-4 border-t border-[#F2F4F6] pt-4">
                        <p className="mb-2 text-xs font-medium text-[#8B95A1]">품목 내역</p>
                        <div className="space-y-1.5">
                          {selected.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-[#333D4B]">{item.itemName}</span>
                              <span className={cn(
                                "font-medium",
                                item.dispatchedQty >= item.orderedQty ? "text-[#00C853]" : "text-[#8B95A1]"
                              )}>
                                {item.dispatchedQty}/{item.orderedQty}
                                {item.dispatchedQty >= item.orderedQty && (
                                  <CheckCircle2 className="ml-1 inline h-3 w-3 text-[#00C853]" />
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
