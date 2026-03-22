"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/useApi";

export default function LowStockReportPage() {
  const { data: dashboard, isLoading, error } = useDashboardSummary();

  const lowStockItems = dashboard?.alerts.lowStockItems ?? [];

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
        <h1 className="text-2xl font-bold text-[#191F28]">부족 재고 알림</h1>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B95A1]">부족 품목 수</p>
              <p className="mt-2 text-3xl font-bold text-[#F04452]">
                {isLoading ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-xl bg-[#F2F4F6]" />
                ) : (
                  formatNumber(lowStockItems.length)
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEAED]">
              <AlertTriangle className="h-6 w-6 text-[#F04452]" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">최소 재고 미달 품목</h2>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F2F4F6]" />
            ))}
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#8B95A1]">
            <AlertTriangle className="mb-3 h-10 w-10 text-[#B0B8C1]" />
            <p className="text-sm">부족 재고 품목이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F6]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8B95A1]">
                    품목코드
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8B95A1]">
                    품목명
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#8B95A1]">
                    최소재고
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#8B95A1]">
                    현재재고
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#8B95A1]">
                    부족수량
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#8B95A1]">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F6]">
                {lowStockItems.map((item) => {
                  const shortage = item.minStock - item.totalQty;
                  const isCritical = item.totalQty === 0;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-[#F7F8FA] ${
                        isCritical ? "bg-[#FFF5F5]" : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-sm font-medium text-[#191F28]">
                        {item.code}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#4E5968]">{item.name}</td>
                      <td className="px-4 py-4 text-right text-sm text-[#4E5968]">
                        {formatNumber(item.minStock)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`text-sm font-bold ${
                            item.totalQty < item.minStock ? "text-[#F04452]" : "text-[#191F28]"
                          }`}
                        >
                          {formatNumber(item.totalQty)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-bold text-[#F04452]">
                          {shortage > 0 ? `-${formatNumber(shortage)}` : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center rounded-full bg-[#FFEAED] px-3 py-1 text-xs font-semibold text-[#F04452]">
                            재고없음
                          </span>
                        ) : shortage > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-semibold text-[#FF8B00]">
                            부족
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#E8F7EF] px-3 py-1 text-xs font-semibold text-[#1FC47D]">
                            정상
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
