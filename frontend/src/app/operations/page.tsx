"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  AlertCircle,
  Download,
  RotateCcw,
  ChevronDown,
  CheckSquare,
  XCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn, formatDate, formatNumber, getStatusLabel } from "@/lib/utils";
import {
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
interface UnifiedRow {
  type: "INBOUND" | "OUTBOUND";
  id: string;
  orderNumber: string;
  orderType: string;
  workStatus: string;
  orderDetail: string;
  partnerName: string;
  requestDate: string;
  workDate: string;
  warehouseName: string;
  deliveryTo: string;
  isUrgent: string;
  status: string;
  lines: (InboundOrderLine | OutboundOrderLine)[];
  raw: InboundOrder | OutboundOrder;
}

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function OperationsPage() {
  const addToast = useToastStore((s) => s.addToast);

  // Search state matching slide 16
  const [ioType, setIoType] = useState("INBOUND"); // 입출고구분
  const [workType, setWorkType] = useState(""); // 작업구분
  const [approvalStatus, setApprovalStatus] = useState(""); // 승인여부
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
  });
  const { data: outboundData, isLoading: outboundLoading } = useOutboundOrders({
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(searchOrderNo ? { search: searchOrderNo } : {}),
  });

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
          status: order.status === "CONFIRMED" ? "승인" : order.status === "COMPLETED" ? "완료" : order.status,
          orderNumber: order.orderNumber,
          orderType: "입고",
          workStatus: getStatusLabel(order.status),
          orderDetail: "정상입고",
          partnerName: order.partner?.name ?? "-",
          requestDate: formatDate(order.expectedDate),
          workDate: formatDate(order.completedDate ?? ""),
          warehouseName: order.warehouse?.name ?? "-",
          deliveryTo: "",
          isUrgent: "N",
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
          status: order.status === "CONFIRMED" ? "승인" : order.status === "DELIVERED" ? "완료" : order.status,
          orderNumber: order.orderNumber,
          orderType: "출고",
          workStatus: getStatusLabel(order.status),
          orderDetail: "정상출고",
          partnerName: order.partner?.name ?? "-",
          requestDate: formatDate(order.shipDate ?? order.createdAt),
          workDate: formatDate(order.completedDate ?? ""),
          warehouseName: order.warehouse?.name ?? "-",
          deliveryTo: order.partner?.name ?? "",
          isUrgent: "N",
          lines: order.lines ?? [],
          raw: order,
        });
      });
    }

    rows.sort((a, b) => (b.raw.createdAt > a.raw.createdAt ? 1 : -1));
    return rows;
  }, [ioType, inboundData, outboundData]);

  const handleRowClick = (row: UnifiedRow) => {
    setSelectedRow(row);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "승인할 주문을 선택해주세요." });
      return;
    }
    let success = 0;
    for (const id of selectedIds) {
      const row = unifiedRows.find((r) => r.id === id);
      if (!row) continue;
      const realId = row.id.replace(/^(in-|out-)/, "");
      try {
        if (row.type === "INBOUND") {
          await confirmInbound.mutateAsync(realId);
        } else {
          await confirmOutbound.mutateAsync(realId);
        }
        success++;
      } catch { /* skip */ }
    }
    if (success > 0) addToast({ type: "success", message: `${success}건 승인 처리되었습니다.` });
    setSelectedIds(new Set());
  };

  const handleReset = () => {
    setIoType("INBOUND");
    setWorkType("");
    setApprovalStatus("");
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
      return { id: line.id ?? idx, itemCode, itemName, workStatus: selectedRow.workStatus, orderUOM: "", orderedQty, workedQty, lotNo: "", pdaStatus: "", pdaCode: "", locAssign: "", workAssign: "" };
    });
  }, [selectedRow]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">입출고현황</h1>
        <p className="text-sm text-[#8B95A1]">주문 &gt; 입출고현황</p>
      </div>

      {/* Search filters - matching slide 16 layout */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-3">
          {/* Row 1 */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[140px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">입출고구분</label>
              <select value={ioType} onChange={(e) => setIoType(e.target.value)} className={selectBase}>
                <option value="INBOUND">입고</option>
                <option value="OUTBOUND">출고</option>
                <option value="">전체</option>
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업구분</label>
              <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={selectBase}>
                <option value="">주문전체</option>
                <option value="NORMAL">정상</option>
                <option value="RETURN">반품</option>
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[100px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
                <input type="text" className={inputBase + " max-w-[100px]"} />
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">승인여부</label>
              <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} className={selectBase}>
                <option value="">선택</option>
                <option value="approved">승인</option>
                <option value="pending">미승인</option>
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[100px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
                <input type="text" className={inputBase + " max-w-[100px]"} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문일자</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
                <span className="text-sm text-[#8B95A1]">~</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
              </div>
            </div>
            <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
              <Search className="h-4 w-4" />
              검색
            </button>
          </div>
          {/* Row 3 */}
          <div className="flex items-end gap-4">
            <div className="min-w-[300px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문번호</label>
              <input
                type="text"
                value={searchOrderNo}
                onChange={(e) => setSearchOrderNo(e.target.value)}
                className={inputBase}
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadExcel("/dashboard/export/excel", "입출고현황.xlsx")}
          className="!bg-[#22C55E] !text-white !border-[#22C55E]"
        >
          엑셀
        </Button>
        <Button size="sm" onClick={handleApprove}>
          승인
        </Button>
        <Button variant="secondary" size="sm" onClick={() => addToast({ type: "warning", message: "승인불가 처리되었습니다." })}>
          불가
        </Button>
      </div>

      {/* Top grid: 입출고현황 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">입출고현황</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                </th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상태</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문번호</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문종류</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업상태</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문상세</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">화주</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">요청일자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업일자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">창고</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">배송처</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">긴급여부</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 animate-pulse rounded bg-[#F2F4F6]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : unifiedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-sm text-[#8B95A1]">
                    조회된 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                unifiedRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className={cn(
                      "cursor-pointer border-b border-[#F2F4F6] transition-colors",
                      selectedRow?.id === row.id ? "bg-[#E8F2FF]" : "hover:bg-[#F7F8FA]"
                    )}
                  >
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="h-4 w-4 rounded border-[#D1D6DB]"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.status}</td>
                    <td className="px-3 py-3 text-sm font-medium text-[#191F28]">{row.orderNumber}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.orderType}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.workStatus}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.orderDetail}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.partnerName}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.requestDate}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.workDate}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.warehouseName}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.deliveryTo || "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.isUrgent}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {unifiedRows.length} of {unifiedRows.length}</p>
        </div>
      </div>

      {/* Bottom grid: 상세목록 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">상세목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품코드</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품명</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업상태</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문UOM</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">주문수량</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">작업수량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">고객사Lot번호</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">PDA작업상태</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업PDA코드</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">Loc지시여부</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업지시여부</th>
              </tr>
            </thead>
            <tbody>
              {!selectedRow ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-[#8B95A1]">
                    상위 목록에서 주문을 선택해주세요.
                  </td>
                </tr>
              ) : detailLines.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-[#8B95A1]">
                    상세 품목 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                detailLines.map((line) => (
                  <tr key={line.id} className="border-b border-[#F2F4F6]">
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{line.itemCode}</td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">{line.itemName}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{line.workStatus}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{line.orderUOM || "-"}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.orderedQty)}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.workedQty)}</td>
                    <td className="px-3 py-3 text-sm text-[#8B95A1]">{line.lotNo || "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#8B95A1]">{line.pdaStatus || "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#8B95A1]">{line.pdaCode || "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#8B95A1]">{line.locAssign || "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#8B95A1]">{line.workAssign || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Footer totals */}
            {detailLines.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#D1D6DB] bg-[#F7F8FA] font-semibold">
                  <td colSpan={4} className="px-3 py-3 text-right text-sm text-[#191F28]">합계</td>
                  <td className="px-3 py-3 text-right text-sm text-[#191F28]">
                    {formatNumber(detailLines.reduce((s, l) => s + l.orderedQty, 0))}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-[#191F28]">
                    {formatNumber(detailLines.reduce((s, l) => s + l.workedQty, 0))}
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {detailLines.length} of {detailLines.length}</p>
        </div>
      </div>
    </div>
  );
}
