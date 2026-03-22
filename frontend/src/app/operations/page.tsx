"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { cn, formatDate, formatNumber, getStatusLabel } from "@/lib/utils";
import {
  useDashboardSummary,
  useInboundOrders,
  useOutboundOrders,
  useConfirmInbound,
  useConfirmOutbound,
} from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import { useToastStore } from "@/stores/toast.store";
import type {
  InboundOrder,
  OutboundOrder,
  InboundOrderLine,
  OutboundOrderLine,
} from "@/types";

// ===== Types =====
type OrderTypeFilter = "ALL" | "INBOUND" | "OUTBOUND";

interface UnifiedRow {
  type: "INBOUND" | "OUTBOUND";
  id: string;
  orderNumber: string;
  warehouseName: string;
  partnerName: string;
  status: string;
  expectedDate: string;
  createdAt: string;
  lines: (InboundOrderLine | OutboundOrderLine)[];
  raw: InboundOrder | OutboundOrder;
}

// ===== Skeleton loader for KPI cards =====
function KpiSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="h-4 w-16 animate-pulse rounded bg-[#F2F4F6]" />
      <div className="mt-3 h-9 w-20 animate-pulse rounded-xl bg-[#F2F4F6]" />
    </div>
  );
}

// ===== Table skeleton =====
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F2F4F6]" />
      ))}
    </div>
  );
}

// ===== Status options =====
const INBOUND_STATUSES = ["DRAFT", "CONFIRMED", "ARRIVED", "RECEIVING", "COMPLETED", "CANCELLED"];
const OUTBOUND_STATUSES = ["DRAFT", "CONFIRMED", "PICKING", "PACKING", "SHIPPED", "DELIVERED", "CANCELLED"];

function getStatusOptions(typeFilter: OrderTypeFilter): string[] {
  if (typeFilter === "INBOUND") return INBOUND_STATUSES;
  if (typeFilter === "OUTBOUND") return OUTBOUND_STATUSES;
  // ALL: merge both, deduplicate
  return [...new Set([...INBOUND_STATUSES, ...OUTBOUND_STATUSES])];
}

export default function OperationsPage() {
  const addToast = useToastStore((s) => s.addToast);

  // ===== Filter State =====
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  // ===== Detail / Selection State =====
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ===== Data Fetching =====
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary();

  const inboundParams = useMemo(() => ({
    limit: 100,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    ...(statusFilter && typeFilter !== "OUTBOUND" ? { status: statusFilter } : {}),
    ...(searchText ? { search: searchText } : {}),
  }), [statusFilter, searchText, typeFilter]);

  const outboundParams = useMemo(() => ({
    limit: 100,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    ...(statusFilter && typeFilter !== "INBOUND" ? { status: statusFilter } : {}),
    ...(searchText ? { search: searchText } : {}),
  }), [statusFilter, searchText, typeFilter]);

  const { data: inboundData, isLoading: inboundLoading } = useInboundOrders(
    typeFilter !== "OUTBOUND" ? inboundParams : { limit: 0 }
  );
  const { data: outboundData, isLoading: outboundLoading } = useOutboundOrders(
    typeFilter !== "INBOUND" ? outboundParams : { limit: 0 }
  );

  const confirmInbound = useConfirmInbound();
  const confirmOutbound = useConfirmOutbound();

  const isLoading = summaryLoading || inboundLoading || outboundLoading;

  // ===== KPI Cards =====
  const inboundByStatus = summary?.inbound?.byStatus ?? {};
  const outboundByStatus = summary?.outbound?.byStatus ?? {};

  const kpiCards = [
    {
      label: "입고 대기",
      value: inboundByStatus.CONFIRMED ?? 0,
      icon: Clock,
      iconBg: "bg-[#E8F2FF]",
      iconColor: "text-[#3182F6]",
      accent: "border-t-[#3182F6]",
    },
    {
      label: "입고 진행",
      value: (inboundByStatus.ARRIVED ?? 0) + (inboundByStatus.RECEIVING ?? 0),
      icon: Loader2,
      iconBg: "bg-[#FFF3E0]",
      iconColor: "text-[#FF8B00]",
      accent: "border-t-[#FF8B00]",
    },
    {
      label: "입고 완료",
      value: inboundByStatus.COMPLETED ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-[#E8F7EF]",
      iconColor: "text-[#1FC47D]",
      accent: "border-t-[#1FC47D]",
    },
    {
      label: "출고 대기",
      value: outboundByStatus.CONFIRMED ?? 0,
      icon: Clock,
      iconBg: "bg-[#F3EEFF]",
      iconColor: "text-[#8B5CF6]",
      accent: "border-t-[#8B5CF6]",
    },
    {
      label: "출고 진행",
      value: (outboundByStatus.PICKING ?? 0) + (outboundByStatus.PACKING ?? 0),
      icon: Loader2,
      iconBg: "bg-[#FFF3E0]",
      iconColor: "text-[#FF8B00]",
      accent: "border-t-[#FF8B00]",
    },
    {
      label: "출고 완료",
      value: (outboundByStatus.SHIPPED ?? 0) + (outboundByStatus.DELIVERED ?? 0),
      icon: CheckCircle2,
      iconBg: "bg-[#E8F7EF]",
      iconColor: "text-[#1FC47D]",
      accent: "border-t-[#1FC47D]",
    },
  ];

  // ===== Unified rows =====
  const unifiedRows = useMemo<UnifiedRow[]>(() => {
    const rows: UnifiedRow[] = [];

    if (typeFilter !== "OUTBOUND" && inboundData?.data) {
      inboundData.data.forEach((order: InboundOrder) => {
        rows.push({
          type: "INBOUND",
          id: `in-${order.id}`,
          orderNumber: order.orderNumber,
          warehouseName: order.warehouse?.name ?? "-",
          partnerName: order.partner?.name ?? "-",
          status: order.status,
          expectedDate: order.expectedDate,
          createdAt: order.createdAt,
          lines: order.lines ?? [],
          raw: order,
        });
      });
    }

    if (typeFilter !== "INBOUND" && outboundData?.data) {
      outboundData.data.forEach((order: OutboundOrder) => {
        rows.push({
          type: "OUTBOUND",
          id: `out-${order.id}`,
          orderNumber: order.orderNumber,
          warehouseName: order.warehouse?.name ?? "-",
          partnerName: order.partner?.name ?? "-",
          status: order.status,
          expectedDate: order.shipDate ?? order.deliveryDate ?? "",
          createdAt: order.createdAt,
          lines: order.lines ?? [],
          raw: order,
        });
      });
    }

    // Sort by createdAt descending
    rows.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    // Client-side date filter
    return rows.filter((row) => {
      if (dateFrom) {
        const created = row.createdAt?.slice(0, 10) ?? "";
        if (created < dateFrom) return false;
      }
      if (dateTo) {
        const created = row.createdAt?.slice(0, 10) ?? "";
        if (created > dateTo) return false;
      }
      return true;
    });
  }, [typeFilter, inboundData, outboundData, dateFrom, dateTo]);

  // ===== Handlers =====
  const handleRowClick = useCallback(
    (id: string) => {
      setExpandedRowId((prev) => (prev === id ? null : id));
    },
    []
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === unifiedRows.length) return new Set();
      return new Set(unifiedRows.map((r) => r.id));
    });
  }, [unifiedRows]);

  const handleBatchApprove = useCallback(async () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "승인할 주문을 선택해주세요." });
      return;
    }

    const draftRows = unifiedRows.filter(
      (r) => selectedIds.has(r.id) && r.status === "DRAFT"
    );

    if (draftRows.length === 0) {
      addToast({ type: "warning", message: "승인 가능한 주문(초안)이 없습니다." });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const row of draftRows) {
      try {
        const realId = row.id.replace(/^(in-|out-)/, "");
        if (row.type === "INBOUND") {
          await confirmInbound.mutateAsync(realId);
        } else {
          await confirmOutbound.mutateAsync(realId);
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      addToast({ type: "success", message: `${successCount}건 승인 처리되었습니다.` });
    }
    if (failCount > 0) {
      addToast({ type: "error", message: `${failCount}건 승인 실패했습니다.` });
    }
    setSelectedIds(new Set());
  }, [selectedIds, unifiedRows, confirmInbound, confirmOutbound, addToast]);

  const handleExcelDownload = useCallback(async () => {
    try {
      const endpoint =
        typeFilter === "INBOUND"
          ? "/inbound/export/excel"
          : typeFilter === "OUTBOUND"
          ? "/outbound/export/excel"
          : "/dashboard/export/excel";
      const filename =
        typeFilter === "INBOUND"
          ? "입고현황.xlsx"
          : typeFilter === "OUTBOUND"
          ? "출고현황.xlsx"
          : "입출고현황.xlsx";
      await downloadExcel(endpoint, filename);
      addToast({ type: "success", message: "엑셀 파일이 다운로드되었습니다." });
    } catch {
      addToast({ type: "error", message: "엑셀 다운로드에 실패했습니다." });
    }
  }, [typeFilter, addToast]);

  // ===== Render =====
  const typePills: { label: string; value: OrderTypeFilter }[] = [
    { label: "전체", value: "ALL" },
    { label: "입고", value: "INBOUND" },
    { label: "출고", value: "OUTBOUND" },
  ];

  const statusOptions = getStatusOptions(typeFilter);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">입출고 현황</h1>
          <p className="mt-1 text-sm text-[#8B95A1]">
            입고/출고 주문의 통합 현황을 조회하고 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchApprove}
            disabled={selectedIds.size === 0}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
              selectedIds.size > 0
                ? "bg-[#3182F6] text-white hover:bg-[#1B64DA]"
                : "cursor-not-allowed bg-[#F2F4F6] text-[#B0B8C1]"
            )}
          >
            <CheckSquare className="h-4 w-4" />
            승인처리
            {selectedIds.size > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                {selectedIds.size}
              </span>
            )}
          </button>
          <button
            onClick={handleExcelDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#4E5968] transition-all hover:bg-[#F7F8FA]"
          >
            <Download className="h-4 w-4" />
            엑셀
          </button>
        </div>
      </div>

      {summaryError && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* ===== KPI Cards ===== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {summaryLoading
          ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={cn(
                    "rounded-2xl border-t-[3px] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                    card.accent
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl",
                        card.iconBg
                      )}
                    >
                      <Icon className={cn("h-4 w-4", card.iconColor)} />
                    </div>
                    <p className="text-sm font-medium text-[#8B95A1]">{card.label}</p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-[#191F28]">
                    {formatNumber(card.value)}
                  </p>
                </div>
              );
            })}
      </div>

      {/* ===== Search / Filter Bar ===== */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center gap-4">
          {/* Type filter pills */}
          <div className="flex items-center gap-1 rounded-xl bg-[#F2F4F6] p-1">
            {typePills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => {
                  setTypeFilter(pill.value);
                  setStatusFilter("");
                  setSelectedIds(new Set());
                  setExpandedRowId(null);
                }}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                  typeFilter === pill.value
                    ? "bg-[#191F28] text-white shadow-sm"
                    : "text-[#4E5968] hover:bg-[#E5E8EB]"
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 pr-9 text-sm text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            >
              <option value="">작업구분 (전체)</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              placeholder="시작일"
            />
            <span className="text-sm text-[#8B95A1]">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
              placeholder="종료일"
            />
          </div>

          {/* Search by order number */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B8C1]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="주문번호 검색"
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-2.5 pl-10 pr-4 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>
      </div>

      {/* ===== Unified Table ===== */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Table header with count */}
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
          <p className="text-sm font-semibold text-[#191F28]">
            조회결과{" "}
            <span className="text-[#3182F6]">{formatNumber(unifiedRows.length)}</span>건
          </p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : unifiedRows.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#8B95A1]">
            조회된 주문이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F6] bg-[#FAFBFC]">
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        unifiedRows.length > 0 &&
                        selectedIds.size === unifiedRows.length
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]/20"
                    />
                  </th>
                  <th className="w-10 px-2 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">
                    구분
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">
                    주문번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">
                    창고
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">
                    거래처
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">
                    예정일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#8B95A1]">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody>
                {unifiedRows.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <OrderRow
                      key={row.id}
                      row={row}
                      isExpanded={isExpanded}
                      isSelected={isSelected}
                      onToggleExpand={() => handleRowClick(row.id)}
                      onToggleSelect={() => toggleSelect(row.id)}
                    />
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

// ===== Order Row with expandable detail =====
function OrderRow({
  row,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
}: {
  row: UnifiedRow;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
}) {
  const isInbound = row.type === "INBOUND";

  return (
    <>
      <tr
        onClick={onToggleExpand}
        className={cn(
          "cursor-pointer border-b border-[#F2F4F6] transition-colors",
          isExpanded ? "bg-[#F7F8FA]" : "hover:bg-[#FAFBFC]",
          isSelected && "bg-[#EBF4FF]"
        )}
      >
        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]/20"
          />
        </td>
        <td className="px-2 py-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[#8B95A1]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#8B95A1]" />
          )}
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
              isInbound
                ? "bg-[#E8F2FF] text-[#3182F6]"
                : "bg-[#F3EEFF] text-[#8B5CF6]"
            )}
          >
            {isInbound ? (
              <ArrowDownToLine className="h-3 w-3" />
            ) : (
              <ArrowUpFromLine className="h-3 w-3" />
            )}
            {isInbound ? "입고" : "출고"}
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-[#191F28]">
          {row.orderNumber}
        </td>
        <td className="px-4 py-3 text-sm text-[#4E5968]">{row.warehouseName}</td>
        <td className="px-4 py-3 text-sm text-[#4E5968]">{row.partnerName}</td>
        <td className="px-4 py-3">
          <Badge status={row.status} />
        </td>
        <td className="px-4 py-3 text-sm text-[#4E5968]">
          {formatDate(row.expectedDate)}
        </td>
        <td className="px-4 py-3 text-sm text-[#4E5968]">
          {formatDate(row.createdAt)}
        </td>
      </tr>

      {/* Expanded detail panel */}
      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-[#FAFBFC] px-0 py-0">
            <DetailPanel row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

// ===== Detail Panel (line items) =====
function DetailPanel({ row }: { row: UnifiedRow }) {
  const isInbound = row.type === "INBOUND";
  const lines = row.lines;

  if (!lines || lines.length === 0) {
    return (
      <div className="px-14 py-6 text-sm text-[#8B95A1]">
        상세 품목 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="px-14 py-4">
      <p className="mb-3 text-xs font-semibold text-[#8B95A1]">상세목록</p>
      <div className="overflow-hidden rounded-xl border border-[#F2F4F6]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F7F8FA]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#8B95A1]">
                상품코드
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#8B95A1]">
                상품명
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#8B95A1]">
                작업상태
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">
                주문수량
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">
                작업수량
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              const itemCode = line.item?.code ?? "-";
              const itemName = line.item?.name ?? "-";

              let orderedQty: number;
              let workedQty: number;

              if (isInbound) {
                const inLine = line as InboundOrderLine;
                orderedQty = inLine.expectedQty ?? 0;
                workedQty = inLine.receivedQty ?? 0;
              } else {
                const outLine = line as OutboundOrderLine;
                orderedQty = outLine.orderedQty ?? 0;
                workedQty = outLine.pickedQty ?? outLine.shippedQty ?? 0;
              }

              const qtyMatch = workedQty >= orderedQty && orderedQty > 0;

              return (
                <tr
                  key={line.id ?? idx}
                  className="border-t border-[#F2F4F6] last:border-b-0"
                >
                  <td className="px-4 py-2.5 text-sm font-mono text-[#4E5968]">
                    {itemCode}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[#191F28]">{itemName}</td>
                  <td className="px-4 py-2.5">
                    <Badge status={row.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-medium text-[#191F28]">
                    {formatNumber(orderedQty)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right text-sm font-medium",
                      qtyMatch ? "text-[#1FC47D]" : "text-[#FF8B00]"
                    )}
                  >
                    {formatNumber(workedQty)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
