"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Search, RotateCcw, Plus, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cn, formatDate, formatNumber, getStatusLabel } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import {
  useOutboundOrders,
  useOutboundOrder,
  useConfirmOutbound,
  useDeliverOutbound,
  useWarehouses,
  useInventoryList,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import OutboundFormModal from "@/components/outbound/OutboundFormModal";
import type { OutboundOrder, OutboundOrderLine } from "@/types";

const selectBase =
  "h-9 rounded-lg border border-[#E5E8EB] bg-white px-3 text-sm text-[#191F28] outline-none transition-colors focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

const inputBase =
  "h-9 rounded-lg border border-[#E5E8EB] bg-white px-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

interface ContextMenuState {
  x: number;
  y: number;
  order: OutboundOrder;
}

export default function OutboundPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  // Search state
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [page, setPage] = useState(1);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<OutboundOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Fetch
  const { data: response, isLoading, error } = useOutboundOrders({
    page,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(searchOrderNo ? { search: searchOrderNo } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(warehouseId ? { warehouseId } : {}),
  });
  const { data: warehouseData } = useWarehouses({ limit: 100 });
  const warehouses = warehouseData?.data ?? [];

  const { data: inventoryResponse } = useInventoryList({ limit: 500 });
  const inventoryItems = inventoryResponse?.data ?? [];

  const confirmOutbound = useConfirmOutbound();
  const deliverOutbound = useDeliverOutbound();

  const orders = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Build stock map: itemId -> total quantity
  const stockMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const inv of inventoryItems) {
      m[inv.itemId] = (m[inv.itemId] ?? 0) + inv.quantity;
    }
    return m;
  }, [inventoryItems]);

  // Close context menu on click / escape
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleRowClick = useCallback((order: OutboundOrder) => {
    setSelectedRow((prev) => (prev?.id === order.id ? null : order));
  }, []);

  const handleContextMenu = (e: React.MouseEvent, order: OutboundOrder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, order });
  };

  const handleContextAction = async (action: string) => {
    if (!contextMenu) return;
    const order = contextMenu.order;
    setContextMenu(null);

    switch (action) {
      case "주문확정":
        try {
          await confirmOutbound.mutateAsync(order.id);
          addToast({ type: "success", message: "주문확정 처리되었습니다." });
        } catch {
          addToast({ type: "error", message: "주문확정 처리에 실패했습니다." });
        }
        break;
      case "피킹":
        router.push(`/outbound/${order.id}`);
        break;
      case "출하":
        router.push(`/outbound/${order.id}`);
        break;
      case "배송완료":
        try {
          await deliverOutbound.mutateAsync(order.id);
          addToast({ type: "success", message: "배송완료 처리되었습니다." });
        } catch {
          addToast({ type: "error", message: "배송완료 처리에 실패했습니다." });
        }
        break;
      default:
        addToast({ type: "info", message: `${action} 기능은 준비중입니다.` });
    }
  };

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
      if (prev.size === orders.length && orders.length > 0) {
        return new Set();
      }
      return new Set(orders.map((o) => o.id));
    });
  }, [orders]);

  const handleReset = () => {
    setSearchOrderNo("");
    setStatusFilter("");
    setWarehouseId("");
    setSearchItem("");
    setDateFrom(new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10));
    setDateTo(new Date().toISOString().slice(0, 10));
    setPage(1);
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["outbound"] });
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "삭제할 주문을 선택해주세요." });
      return;
    }
    addToast({ type: "info", message: "삭제 기능은 준비중입니다." });
  };

  // Compute master row summaries
  const masterRows = useMemo(() => {
    return orders.map((order) => {
      const lines = order.lines ?? [];
      const totalOrdered = lines.reduce((s, l) => s + (l.orderedQty ?? 0), 0);
      const totalShipped = lines.reduce((s, l) => s + (l.shippedQty ?? 0), 0);
      const currentStock = lines.reduce((s, l) => s + (stockMap[l.itemId] ?? 0), 0);
      return {
        order,
        totalOrdered,
        totalShipped,
        currentStock,
      };
    });
  }, [orders, stockMap]);

  // Detail lines for bottom grid
  const detailLines = useMemo(() => {
    if (!selectedRow) return [];
    return (selectedRow.lines ?? []).map((line, idx) => ({
      id: line.id ?? idx,
      itemCode: line.item?.code ?? "-",
      itemName: line.item?.name ?? "-",
      workStatus: getStatusLabel(selectedRow.status),
      orderedQty: line.orderedQty ?? 0,
      pickedQty: line.pickedQty ?? 0,
      packedQty: line.packedQty ?? 0,
      shippedQty: line.shippedQty ?? 0,
      uom: line.item?.uom ?? "EA",
    }));
  }, [selectedRow]);

  const contextMenuItems = [
    { label: "주문확정", action: "주문확정" },
    { label: "물량할당", action: "물량할당" },
    { label: "로케이션지정", action: "로케이션지정" },
    { label: "피킹", action: "피킹" },
    { label: "패킹", action: "패킹" },
    { label: "출하", action: "출하" },
    { label: "배송완료", action: "배송완료" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Search bar */}
      <div className="rounded-2xl bg-white p-5 shadow-sm mb-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* 출고예정일 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">출고예정일</label>
            <div className="flex items-center gap-1">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
            </div>
          </div>

          {/* 주문번호 */}
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문번호</label>
            <input
              type="text"
              value={searchOrderNo}
              onChange={(e) => setSearchOrderNo(e.target.value)}
              placeholder="주문번호"
              className={inputBase + " w-full"}
            />
          </div>

          {/* 작업구분 */}
          <div className="min-w-[130px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업구분</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectBase + " w-full"}>
              <option value="">전체</option>
              <option value="DRAFT">초안</option>
              <option value="CONFIRMED">확정</option>
              <option value="PICKING">피킹중</option>
              <option value="PACKING">패킹중</option>
              <option value="SHIPPED">출하완료</option>
              <option value="DELIVERED">배송완료</option>
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

          {/* 상품 */}
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                placeholder="상품 검색"
                className={inputBase + " w-full"}
              />
              <button className="flex h-9 items-center rounded-lg bg-[#3182F6] px-3 text-white hover:bg-[#1B64DA]">
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
            출고리스트
            <span className="ml-2 text-xs font-normal text-[#8B95A1]">{total}건</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex h-8 items-center gap-1 rounded-lg bg-[#3182F6] px-4 text-xs font-medium text-white hover:bg-[#1B64DA]"
            >
              <Plus className="h-3.5 w-3.5" />
              출고등록
            </button>
            <button
              onClick={handleDelete}
              className="flex h-8 items-center gap-1 rounded-lg border border-[#E5E8EB] bg-white px-4 text-xs font-medium text-[#4E5968] hover:bg-[#F7F8FA]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </button>
            <button
              onClick={() => downloadExcel("/export/outbound", "출고리스트.xlsx")}
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
                    checked={selectedIds.size === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#D1D6DB]"
                  />
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">작업상태</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">주문번호</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">거래처</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">배송처</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">출고예정일</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">출고일자</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">주문량합계</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">출고량합계</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#3182F6]">현재고</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">송장번호</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">배송방법</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-3 py-2.5">
                        <div className="h-4 animate-pulse rounded bg-[#F2F4F6]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-red-500">
                    오류가 발생했습니다.
                  </td>
                </tr>
              ) : masterRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-sm text-[#8B95A1]">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                masterRows.map(({ order, totalOrdered, totalShipped, currentStock }) => (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order)}
                    onContextMenu={(e) => handleContextMenu(e, order)}
                    className={cn(
                      "cursor-pointer border-b border-[#F2F4F6] transition-colors",
                      selectedRow?.id === order.id ? "bg-[#E8F2FF]" : "hover:bg-[#F7F8FA]"
                    )}
                  >
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="h-4 w-4 rounded border-[#D1D6DB]"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge status={order.status} />
                    </td>
                    <td className="px-3 py-2.5 text-sm font-medium text-[#3182F6]">{order.orderNumber}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{order.partner?.name ?? "-"}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{order.partner?.name ?? "-"}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{formatDate(order.shipDate ?? order.createdAt)}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{formatDate(order.deliveryDate ?? "")}</td>
                    <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(totalOrdered)}</td>
                    <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(totalShipped)}</td>
                    <td className="px-3 py-2.5 text-right text-sm font-semibold text-[#3182F6]">{formatNumber(currentStock)}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{order.trackingNumber ?? "-"}</td>
                    <td className="px-3 py-2.5 text-sm text-[#4E5968]">{order.shippingMethod ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-2">
          <p className="text-xs text-[#8B95A1]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 rounded border border-[#E5E8EB] px-2 text-xs text-[#4E5968] disabled:opacity-40 hover:bg-[#F7F8FA]"
            >
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-7 rounded border border-[#E5E8EB] px-2 text-xs text-[#4E5968] disabled:opacity-40 hover:bg-[#F7F8FA]"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {/* Detail grid */}
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
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">주문수량</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">피킹수량</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">패킹수량</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#8B95A1]">출하수량</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-[#8B95A1]">UOM</th>
                </tr>
              </thead>
              <tbody>
                {detailLines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-[#8B95A1]">
                      상세 품목 정보가 없습니다.
                    </td>
                  </tr>
                ) : (
                  detailLines.map((line) => (
                    <tr key={line.id} className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                      <td className="px-3 py-2.5 text-sm font-mono text-[#4E5968]">{line.itemCode}</td>
                      <td className="px-3 py-2.5 text-sm text-[#191F28]">{line.itemName}</td>
                      <td className="px-3 py-2.5 text-sm text-[#4E5968]">{line.workStatus}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.orderedQty)}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.pickedQty)}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.packedQty)}</td>
                      <td className="px-3 py-2.5 text-right text-sm font-medium text-[#191F28]">{formatNumber(line.shippedQty)}</td>
                      <td className="px-3 py-2.5 text-sm text-[#4E5968]">{line.uom}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-xl border border-[#E5E8EB] bg-white py-1.5 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuItems.map((item, idx) => (
            <button
              key={item.action}
              onClick={() => handleContextAction(item.action)}
              className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <OutboundFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
