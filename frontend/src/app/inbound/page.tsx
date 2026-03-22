"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  MapPin,
  CheckCircle,
  Truck,
  Package,
  QrCode,
  Edit,
  Zap,
  FileText,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import {
  useInboundOrders,
  useInboundOrder,
  useConfirmInbound,
  useArriveInbound,
  useCreateInboundOrder,
} from "@/hooks/useApi";
import { usePermission } from "@/hooks/usePermission";
import { useToastStore } from "@/stores/toast.store";
import InboundFormModal from "@/components/inbound/InboundFormModal";
import type { InboundOrder, InboundOrderLine } from "@/types";

const inputBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-2.5 text-sm text-[#191F28] outline-none focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

// Status mapping for Korean labels in master grid
function getWorkStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "주문등록",
    CONFIRMED: "주문승인",
    ARRIVED: "입하완료",
    RECEIVING: "입고중",
    COMPLETED: "입고완료",
    CANCELLED: "취소",
  };
  return map[status] || status;
}

export default function InboundPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const perm = usePermission("inbound");
  const addToast = useToastStore((s) => s.addToast);

  // --- Search conditions ---
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [page, setPage] = useState(1);

  // --- UI states ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- Context menu ---
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    orderId: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // --- API ---
  const { data: response, isLoading, error } = useInboundOrders({
    page,
    limit: 30,
    ...(searchOrderNo ? { search: searchOrderNo } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const { data: selectedOrder } = useInboundOrder(selectedMasterId ?? undefined);

  const confirmInbound = useConfirmInbound();
  const arriveInbound = useArriveInbound();

  const orders: InboundOrder[] = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Detail items from selected order
  const detailItems: InboundOrderLine[] = useMemo(() => {
    if (!selectedOrder) return [];
    return selectedOrder.lines ?? [];
  }, [selectedOrder]);

  // --- Context menu close on outside click / Escape ---
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // --- Handlers ---
  const handleMasterRowClick = (orderId: string) => {
    setSelectedMasterId(orderId);
  };

  const handleContextMenu = (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, orderId });
  };

  const handleContextAction = async (action: string) => {
    if (!contextMenu) return;
    const orderId = contextMenu.orderId;
    setContextMenu(null);

    switch (action) {
      case "location":
        addToast({ type: "info", message: "준비중입니다." });
        break;
      case "confirm":
        try {
          await confirmInbound.mutateAsync(orderId);
          addToast({ type: "success", message: "주문승인 처리되었습니다." });
        } catch {
          addToast({ type: "error", message: "주문승인에 실패했습니다." });
        }
        break;
      case "dispatch":
        addToast({ type: "info", message: "준비중입니다." });
        break;
      case "arrive":
        try {
          await arriveInbound.mutateAsync(orderId);
          addToast({ type: "success", message: "입하 처리되었습니다." });
        } catch {
          addToast({ type: "error", message: "입하 처리에 실패했습니다." });
        }
        break;
      case "receive":
        router.push(`/inbound/${orderId}`);
        break;
      case "receiveConfirm":
        addToast({ type: "info", message: "준비중입니다." });
        break;
      case "barcode":
        addToast({ type: "info", message: "준비중입니다." });
        break;
      case "changeQty":
        router.push(`/inbound/${orderId}`);
        break;
      case "quickInbound":
        setShowCreateModal(true);
        break;
    }
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["inbound"] });
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    addToast({ type: "info", message: "준비중입니다." });
  };

  const handleSearch = () => {
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["inbound"] });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compute master grid summary totals per order
  const masterRows = useMemo(() => {
    return orders.map((order) => {
      const lines = order.lines ?? [];
      const totalExpectedQty = lines.reduce((s, l) => s + (l.expectedQty ?? 0), 0);
      const totalReceivedQty = lines.reduce((s, l) => s + (l.receivedQty ?? 0), 0);
      return {
        id: order.id,
        status: order.status,
        orderNumber: order.orderNumber,
        partnerName: order.partner?.name ?? "-",
        warehouseName: order.warehouse?.name ?? "-",
        expectedDate: formatDate(order.expectedDate),
        arrivedDate: formatDate(order.arrivedDate ?? ""),
        totalExpectedQty,
        totalReceivedQty,
        urgent: false, // placeholder - not in current type
        blNumber: ((order as unknown as Record<string, unknown>).blNumber as string) ?? "-",
      };
    });
  }, [orders]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">입고리스트</h1>
        <p className="text-sm text-[#8B95A1]">입고관리 &gt; 입고리스트</p>
      </div>

      {/* Search Filters */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          {/* 입고예정일 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              입고예정일
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={selectBase}
              />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={selectBase}
              />
            </div>
          </div>
          {/* 주문번호 */}
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              주문번호
            </label>
            <input
              type="text"
              placeholder="주문번호 검색"
              value={searchOrderNo}
              onChange={(e) => setSearchOrderNo(e.target.value)}
              className={inputBase + " w-full"}
            />
          </div>
          {/* 작업구분 */}
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              작업구분
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectBase + " w-full"}
            >
              <option value="">전체</option>
              <option value="DRAFT">주문등록</option>
              <option value="CONFIRMED">주문승인</option>
              <option value="ARRIVED">입하완료</option>
              <option value="RECEIVING">입고중</option>
              <option value="COMPLETED">입고완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          {/* 창고 */}
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              창고
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className={selectBase + " w-full"}
            >
              <option value="">전체</option>
            </select>
          </div>
          {/* 상품 */}
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              상품
            </label>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="상품 검색"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className={inputBase + " w-full"}
              />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* 검색 버튼 */}
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            검색
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          입고등록
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          삭제
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="!border-[#22C55E] !bg-[#22C55E] !text-white"
          onClick={() => downloadExcel("/export/inbound", "입고목록.xlsx")}
        >
          <Download className="mr-1 h-3.5 w-3.5" />
          엑셀
        </Button>
      </div>

      {/* Master-Detail Split */}
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Master Grid (60%) */}
        <div className="flex flex-[6] flex-col rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="rounded-t-2xl bg-[#4A5568] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">
              입고리스트 ({total}건)
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#D1D6DB]"
                      checked={
                        orders.length > 0 &&
                        selectedIds.size === orders.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                    작업상태
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                    주문번호
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                    거래처
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                    창고
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                    입고예정일
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                    입고일자
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">
                    주문량합계
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">
                    입고량합계
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-[#8B95A1]">
                    긴급여부
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                    BL번호
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#F2F4F6]">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-4 animate-pulse rounded bg-[#F2F4F6]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        데이터를 불러오는 중 오류가 발생했습니다.
                      </div>
                    </td>
                  </tr>
                ) : masterRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-16 text-center text-sm text-[#8B95A1]"
                    >
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  masterRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleMasterRowClick(row.id)}
                      onContextMenu={(e) => handleContextMenu(e, row.id)}
                      className={`cursor-pointer border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA] ${
                        selectedMasterId === row.id
                          ? "bg-[#EBF5FF]"
                          : ""
                      }`}
                    >
                      <td
                        className="px-3 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#D1D6DB]"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Badge status={row.status} />
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-[#191F28]">
                        {row.orderNumber}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">
                        {row.partnerName}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">
                        {row.warehouseName}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">
                        {row.expectedDate}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">
                        {row.arrivedDate}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">
                        {formatNumber(row.totalExpectedQty)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">
                        {formatNumber(row.totalReceivedQty)}
                      </td>
                      <td className="px-3 py-3 text-center text-sm">
                        {row.urgent ? (
                          <span className="inline-flex items-center rounded-full bg-[#FFEAED] px-2 py-0.5 text-xs font-semibold text-[#F04452]">
                            긴급
                          </span>
                        ) : (
                          <span className="text-[#B0B8C1]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">
                        {row.blNumber}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
            <p className="text-sm text-[#8B95A1]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-xs text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                이전
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-xs text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                다음
              </button>
            </div>
            <p className="text-sm text-[#8B95A1]">
              전체 {total}건
            </p>
          </div>
        </div>

        {/* Detail Grid (40%) */}
        <div className="flex flex-[4] flex-col rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="rounded-t-2xl bg-[#6B7684] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">
              상세품목{" "}
              {selectedMasterId && selectedOrder
                ? `- ${selectedOrder.orderNumber}`
                : ""}
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            {!selectedMasterId ? (
              <div className="flex h-full items-center justify-center text-sm text-[#8B95A1]">
                상단 목록에서 주문을 선택하세요.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                      상품코드
                    </th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                      상품명
                    </th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                      작업상태
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">
                      주문수량
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">
                      입고수량
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">
                      파손수량
                    </th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                      UOM
                    </th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                      LOT번호
                    </th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">
                      유효기간
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 text-center text-sm text-[#8B95A1]"
                      >
                        품목 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    detailItems.map((line) => (
                      <tr
                        key={line.id}
                        className="border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]"
                      >
                        <td className="px-3 py-3 font-mono text-sm text-[#4E5968]">
                          {line.item?.code ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#191F28]">
                          {line.item?.name ?? "-"}
                        </td>
                        <td className="px-3 py-3">
                          {selectedOrder ? (
                            <Badge status={selectedOrder.status} />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">
                          {formatNumber(line.expectedQty)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-[#3182F6]">
                          {formatNumber(line.receivedQty)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-[#F04452]">
                          {formatNumber(line.damagedQty)}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">
                          {line.item?.uom ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">
                          {line.lotNumber ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">
                          {formatDate(line.expiryDate ?? "")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {detailItems.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#D1D6DB] bg-[#F7F8FA] font-semibold">
                      <td
                        colSpan={3}
                        className="px-3 py-3 text-right text-sm text-[#191F28]"
                      >
                        합계
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-[#191F28]">
                        {formatNumber(
                          detailItems.reduce(
                            (s, l) => s + (l.expectedQty ?? 0),
                            0
                          )
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-[#3182F6]">
                        {formatNumber(
                          detailItems.reduce(
                            (s, l) => s + (l.receivedQty ?? 0),
                            0
                          )
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-[#F04452]">
                        {formatNumber(
                          detailItems.reduce(
                            (s, l) => s + (l.damagedQty ?? 0),
                            0
                          )
                        )}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[200px] rounded-xl bg-white py-2 shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-[#E5E8EB]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleContextAction("location")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <MapPin className="h-4 w-4 text-[#8B95A1]" />
            로케이션지정
          </button>
          <button
            onClick={() => handleContextAction("confirm")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <CheckCircle className="h-4 w-4 text-[#8B95A1]" />
            주문승인
          </button>
          <button
            onClick={() => handleContextAction("dispatch")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <Truck className="h-4 w-4 text-[#8B95A1]" />
            배차
          </button>
          <button
            onClick={() => handleContextAction("arrive")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <Package className="h-4 w-4 text-[#8B95A1]" />
            입하
          </button>
          <div className="my-1 border-t border-[#F2F4F6]" />
          <button
            onClick={() => handleContextAction("receive")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <FileText className="h-4 w-4 text-[#8B95A1]" />
            입고
          </button>
          <button
            onClick={() => handleContextAction("receiveConfirm")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <CheckCircle className="h-4 w-4 text-[#8B95A1]" />
            입고확정
          </button>
          <div className="my-1 border-t border-[#F2F4F6]" />
          <button
            onClick={() => handleContextAction("barcode")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <QrCode className="h-4 w-4 text-[#8B95A1]" />
            바코드발행
          </button>
          <button
            onClick={() => handleContextAction("changeQty")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <Edit className="h-4 w-4 text-[#8B95A1]" />
            입고수량변경
          </button>
          <button
            onClick={() => handleContextAction("quickInbound")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA]"
          >
            <Zap className="h-4 w-4 text-[#8B95A1]" />
            간편입고
          </button>
        </div>
      )}

      {/* Create Modal */}
      <InboundFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
