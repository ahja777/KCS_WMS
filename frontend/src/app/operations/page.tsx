"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Download, RotateCcw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cn, formatDate, formatNumber, getStatusLabel } from "@/lib/utils";
import {
  useInboundOrders,
  useOutboundOrders,
  useConfirmInbound,
  useConfirmOutbound,
  useWarehouses,
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
interface UnifiedRow {
  type: "INBOUND" | "OUTBOUND";
  id: string;
  realId: string;
  orderNumber: string;
  orderType: string;
  workStatus: string;
  status: string;
  partnerName: string;
  requestDate: string;
  workDate: string;
  warehouseName: string;
  deliveryTo: string;
  isUrgent: boolean;
  blNumber: string;
  lines: (InboundOrderLine | OutboundOrderLine)[];
  raw: InboundOrder | OutboundOrder;
}

const selectBase =
  "h-9 rounded-lg border border-[#E5E8EB] bg-white px-3 text-sm text-[#191F28] outline-none transition-colors focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

const inputBase =
  "h-9 rounded-lg border border-[#E5E8EB] bg-white px-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

type IOFilter = "ALL" | "INBOUND" | "OUTBOUND";

export default function OperationsPage() {
  const addToast = useToastStore((s) => s.addToast);

  // Search state
  const [ioType, setIoType] = useState<IOFilter>("ALL");
  const [workType, setWorkType] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchOrderNo, setSearchOrderNo] = useState("");

  // Selection & detail
  const [selectedRow, setSelectedRow] = useState<UnifiedRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: inboundData, isLoading: inboundLoading } = useInboundOrders({
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(searchOrderNo ? { search: searchOrderNo } : {}),
    ...(warehouseId ? { warehouseId } : {}),
  });
  const { data: outboundData, isLoading: outboundLoading } = useOutboundOrders({
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(searchOrderNo ? { search: searchOrderNo } : {}),
    ...(warehouseId ? { warehouseId } : {}),
  });
  const { data: warehouseData } = useWarehouses({ limit: 100 });
  const warehouses = warehouseData?.data ?? [];

  const confirmInbound = useConfirmInbound();
  const confirmOutbound = useConfirmOutbound();

  const isLoading = inboundLoading || outboundLoading;

  // Unified rows
  const unifiedRows = useMemo<UnifiedRow[]>(() => {
    const rows: UnifiedRow[] = [];

    if (ioType !== "OUTBOUND" && inboundData?.data) {
      inboundData.data.forEach((order: InboundOrder) => {
        rows.push({
          type: "INBOUND",
          id: `in-${order.id}`,
          realId: order.id,
          status: order.status,
          orderNumber: order.orderNumber,
          orderType: "입고",
          workStatus: getStatusLabel(order.status),
          partnerName: order.partner?.name ?? "-",
          requestDate: formatDate(order.expectedDate),
          workDate: formatDate(order.completedDate ?? ""),
          warehouseName: order.warehouse?.name ?? "-",
          deliveryTo: "-",
          isUrgent: false,
          blNumber: "-",
          lines: order.lines ?? [],
          raw: order,
        });
      });
    }

    if (ioType !== "INBOUND" && outboundData?.data) {
      outboundData.data.forEach((order: OutboundOrder) => {
        rows.push({
          type: "OUTBOUND",
          id: `out-${order.id}`,
          realId: order.id,
          status: order.status,
          orderNumber: order.orderNumber,
          orderType: "출고",
          workStatus: getStatusLabel(order.status),
          partnerName: order.partner?.name ?? "-",
          requestDate: formatDate(order.shipDate ?? order.createdAt),
          workDate: formatDate(order.completedDate ?? ""),
          warehouseName: order.warehouse?.name ?? "-",
          deliveryTo: order.partner?.name ?? "-",
          isUrgent: false,
          blNumber: order.trackingNumber ?? "-",
          lines: order.lines ?? [],
          raw: order,
        });
      });
    }

    rows.sort((a, b) => (b.raw.createdAt > a.raw.createdAt ? 1 : -1));
    return rows;
  }, [ioType, inboundData, outboundData]);

  // Filter by workType and approvalStatus client-side
  const filteredRows = useMemo(() => {
    let rows = unifiedRows;
    if (workType) {
      rows = rows.filter((r) => r.status === workType);
    }
    if (approvalStatus === "approved") {
      rows = rows.filter((r) => r.status === "CONFIRMED" || r.status === "COMPLETED" || r.status === "SHIPPED" || r.status === "DELIVERED");
    } else if (approvalStatus === "pending") {
      rows = rows.filter((r) => r.status === "DRAFT");
    }
    return rows;
  }, [unifiedRows, workType, approvalStatus]);

  const handleRowClick = useCallback((row: UnifiedRow) => {
    setSelectedRow((prev) => (prev?.id === row.id ? null : row));
  }, []);

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
      if (prev.size === filteredRows.length && filteredRows.length > 0) {
        return new Set();
      }
      return new Set(filteredRows.map((r) => r.id));
    });
  }, [filteredRows]);

  const handleApprove = async () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "승인할 주문을 선택해주세요." });
      return;
    }
    let success = 0;
    for (const id of selectedIds) {
      const row = filteredRows.find((r) => r.id === id);
      if (!row) continue;
      try {
        if (row.type === "INBOUND") {
          await confirmInbound.mutateAsync(row.realId);
        } else {
          await confirmOutbound.mutateAsync(row.realId);
        }
        success++;
      } catch {
        /* skip */
      }
    }
    if (success > 0) addToast({ type: "success", message: `${success}건 승인 처리되었습니다.` });
    setSelectedIds(new Set());
  };

  const handleReject = () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "불가 처리할 주문을 선택해주세요." });
      return;
    }
    addToast({ type: "warning", message: `${selectedIds.size}건 승인불가 처리되었습니다.` });
    setSelectedIds(new Set());
  };

  const handleReset = () => {
    setIoType("ALL");
    setWorkType("");
    setApprovalStatus("");
    setWarehouseId("");
    setDateFrom(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
    setDateTo(new Date().toISOString().slice(0, 10));
    setSearchOrderNo("");
  };

  // Detail lines for bottom grid
  const detailLines = useMemo(() => {
    if (!selectedRow) return [];
    const isInbound = selectedRow.type === "INBOUND";
    return selectedRow.lines.map((line, idx) => {
      const itemCode = line.item?.code ?? "-";
      const itemName = line.item?.name ?? "-";
      let orderedQty: number, workedQty: number;
      if (isInbound) {
        const inLine = line as InboundOrderLine;
        orderedQty = inLine.expectedQty ?? 0;
        workedQty = inLine.receivedQty ?? 0;
      } else {
        const outLine = line as OutboundOrderLine;
        orderedQty = outLine.orderedQty ?? 0;
        workedQty = outLine.pickedQty ?? outLine.shippedQty ?? 0;
      }
      return {
        id: line.id ?? idx,
        itemCode,
        itemName,
        workStatus: selectedRow.workStatus,
        orderUOM: line.item?.uom ?? "EA",
        orderedQty,
        workedQty,
      };
    });
  }, [selectedRow]);

  const ioFilterOptions: { label: string; value: IOFilter }[] = [
    { label: "전체", value: "ALL" },
    { label: "입고", value: "INBOUND" },
    { label: "출고", value: "OUTBOUND" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Search bar */}
      <div className="rounded-2xl bg-white p-5 shadow-sm mb-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* 입출고구분 - pills */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">입출고구분</label>
            <div className="flex rounded-lg border border-[#E5E8EB] overflow-hidden">
              {ioFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIoType(opt.value)}
                  className={cn(
                    "px-4 h-9 text-sm font-medium transition-colors",
                    ioType === opt.value
                      ? "bg-[#3182F6] text-white"
                      : "bg-white text-[#4E5968] hover:bg-[#F7F8FA]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 작업구분 */}
          <div className="min-w-[130px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업구분</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={selectBase + " w-full"}>
              <option value="">전체</option>
              <option value="DRAFT">초안</option>
              <option value="CONFIRMED">확정</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>

          {/* 승인여부 */}
          <div className="min-w-[120px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">승인여부</label>
            <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} className={selectBase + " w-full"}>
              <option value="">전체</option>
              <option value="approved">승인</option>
              <option value="pending">미승인</option>
            </select>
          </div>

          {/* 창고 */}
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={selectBase + " w-full"}>
              <option value="">전체</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* 주문일자 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문일자</label>
            <div className="flex items-center gap-1">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
            </div>
          </div>

          {/* 주문번호 */}
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문번호</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={searchOrderNo}
                onChange={(e) => setSearchOrderNo(e.target.value)}
                placeholder="주문번호 검색"
                className={inputBase + " w-full"}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              />
              <button className="flex h-9 items-center gap-1 rounded-lg bg-[#3182F6] px-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Reset */}
          <button onClick={handleReset} className="h-9 rounded-lg border border-[#E5E8EB] bg-white px-2.5 text-[#8B95A1] hover:bg-[#F7F8FA]">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Master grid */}
      <div className={cn("rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col", selectedRow ? "flex-1 min-h-0" : "flex-1 min-h-0")}>
        <div className="px-5 py-3 border-b border-[#F2F4F6] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#191F28]">
            입출고현황
            <span className="ml-2 text-xs font-normal text-[#8B95A1]">{filteredRows.length}건</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              className="h-8 rounded-lg bg-[#3182F6] px-4 text-xs font-medium text-white hover:bg-[#1B64DA]"
            >
              승인처리
            </button>
            <button
              onClick={handleReject}
              className="h-8 rounded-lg border border-[#E5E8EB] bg-white px-4 text-xs font-medium text-[#4E5968] hover:bg-[#F7F8FA]"
            >
              불가처리
            </button>
            <button
              onClick={() => downloadExcel("/dashboard/export/excel", "입출고현황.xlsx")}
              className="h-8 rounded-lg bg-[#22C55E] px-4 text-xs font-medium text-white hover:bg-[#16A34A]"
            >
              엑셀
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#F7F8FA]">
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#D1D6DB]"
                  />
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">상태</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">주문번호</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">주문종류</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">작업상태</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">거래처</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">요청일자</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">작업일자</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">창고</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">배송처</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">긴급여부</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">BL번호</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-3 py-2.5">
                        <div className="h-4 animate-pulse rounded bg-[#F2F4F6]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-sm text-[#8B95A1]">
                    조회된 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className={cn(
                      "cursor-pointer border-b border-[#F2F4F6] transition-colors",
                      selectedRow?.id === row.id ? "bg-[#E8F2FF]" : "hover:bg-[#F7F8FA]"
                    )}
                  >
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="h-4 w-4 rounded border-[#D1D6DB]"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge status={row.status} />
                    </td>
                    <td className="px-3 py-2.5 text-sm font-medium text-[#3182F6]">{row.orderNumber}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">
                      <span className={cn(
                        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                        row.type === "INBOUND" ? "bg-[#E8F2FF] text-[#3182F6]" : "bg-[#FFF3E0] text-[#FF8B00]"
                      )}>
                        {row.orderType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.workStatus}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.partnerName}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.requestDate}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.workDate}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.warehouseName}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.deliveryTo}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.isUrgent ? "Y" : "N"}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.blNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail grid - appears when row selected */}
      {selectedRow && (
        <div className="mt-4 h-[35%] rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[#F2F4F6]">
            <h3 className="text-sm font-semibold text-[#191F28]">
              상세 - {selectedRow.orderNumber}
              <span className="ml-2 text-xs font-normal text-[#8B95A1]">{detailLines.length}건</span>
            </h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F7F8FA]">
                  <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">상품코드</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">상품명</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">작업상태</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">주문UOM</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">주문수량</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">작업수량</th>
                </tr>
              </thead>
              <tbody>
                {detailLines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-[#8B95A1]">
                      상세 품목 정보가 없습니다.
                    </td>
                  </tr>
                ) : (
                  detailLines.map((line) => (
                    <tr key={line.id} className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                      <td className="px-3 py-2.5 text-sm font-mono text-[#4E5968]">{line.itemCode}</td>
                      <td className="px-3 py-2.5 text-sm text-[#191F28]">{line.itemName}</td>
                      <td className="px-3 py-2.5 text-sm text-[#4E5968]">{line.workStatus}</td>
                      <td className="px-3 py-2.5 text-sm text-[#4E5968]">{line.orderUOM}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.orderedQty)}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.workedQty)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {detailLines.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-[#D1D6DB] bg-[#F7F8FA] font-semibold">
                    <td colSpan={4} className="px-3 py-2.5 text-right text-sm text-[#191F28]">합계</td>
                    <td className="px-3 py-2.5 text-right text-sm text-[#191F28]">
                      {formatNumber(detailLines.reduce((s, l) => s + l.orderedQty, 0))}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-[#191F28]">
                      {formatNumber(detailLines.reduce((s, l) => s + l.workedQty, 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
