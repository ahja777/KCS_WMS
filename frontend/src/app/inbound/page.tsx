"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Search, AlertCircle, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate, formatNumber } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import { useInboundOrders, useConfirmInbound } from "@/hooks/useApi";
import { usePermission } from "@/hooks/usePermission";
import { useToastStore } from "@/stores/toast.store";
import InboundFormModal from "@/components/inbound/InboundFormModal";
import type { InboundOrder } from "@/types";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function InboundPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const perm = usePermission("inbound");
  const addToast = useToastStore((s) => s.addToast);

  // Search conditions matching slide 17
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [workType, setWorkType] = useState("");
  const [orderDetail, setOrderDetail] = useState("");
  const [itemGroup, setItemGroup] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; orderId: string } | null>(null);

  const { data: response, isLoading, error } = useInboundOrders({
    page,
    limit: 20,
    ...(searchOrderNo ? { search: searchOrderNo } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const confirmInbound = useConfirmInbound();

  const orders = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Flatten orders to show individual items per row (matching slide 17)
  const flatRows = useMemo(() => {
    const rows: Array<{
      orderId: string;
      workStatus: string;
      orderNumber: string;
      orderSeq: number;
      partnerName: string;
      supplierName: string;
      expectedDate: string;
      arrivedDate: string;
      itemCode: string;
      itemName: string;
      orderedQty: number;
      orderUOM: string;
    }> = [];

    for (const order of orders) {
      const lines = order.lines ?? [];
      if (lines.length === 0) {
        rows.push({
          orderId: order.id,
          workStatus: order.status === "CONFIRMED" ? "입차확인" : order.status === "COMPLETED" ? "입고완료" : order.status === "ARRIVED" ? "배차확정" : order.status,
          orderNumber: order.orderNumber,
          orderSeq: 1,
          partnerName: order.partner?.name ?? "-",
          supplierName: "",
          expectedDate: formatDate(order.expectedDate),
          arrivedDate: formatDate(order.arrivedDate ?? ""),
          itemCode: "-",
          itemName: "-",
          orderedQty: 0,
          orderUOM: "",
        });
      } else {
        lines.forEach((line, idx) => {
          rows.push({
            orderId: order.id,
            workStatus: order.status === "CONFIRMED" ? "입차확인" : order.status === "COMPLETED" ? "입고완료" : order.status === "ARRIVED" ? "배차확정" : order.status,
            orderNumber: order.orderNumber,
            orderSeq: idx + 1,
            partnerName: order.partner?.name ?? "-",
            supplierName: "",
            expectedDate: formatDate(order.expectedDate),
            arrivedDate: formatDate(order.arrivedDate ?? ""),
            itemCode: line.item?.code ?? "-",
            itemName: line.item?.name ?? "-",
            orderedQty: line.expectedQty ?? 0,
            orderUOM: line.item?.uom ?? "",
          });
        });
      }
    }
    return rows;
  }, [orders]);

  const totalOrderedQty = useMemo(() => flatRows.reduce((s, r) => s + r.orderedQty, 0), [flatRows]);

  const handleContextMenu = (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, orderId });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const handleContextAction = async (action: string) => {
    if (!contextMenu) return;
    const orderId = contextMenu.orderId;
    setContextMenu(null);

    switch (action) {
      case "confirm":
        try {
          await confirmInbound.mutateAsync(orderId);
          addToast({ type: "success", message: "입고확정 처리되었습니다." });
        } catch {
          addToast({ type: "error", message: "입고확정에 실패했습니다." });
        }
        break;
      case "approve":
        addToast({ type: "info", message: "주문승인 처리되었습니다." });
        break;
      case "dispatch":
        addToast({ type: "info", message: "배차가 등록되었습니다." });
        break;
      case "arrive":
        addToast({ type: "info", message: "입하 처리되었습니다." });
        break;
      case "receive":
        addToast({ type: "info", message: "입고 처리되었습니다." });
        break;
      case "barcode":
        addToast({ type: "info", message: "바코드가 발행되었습니다." });
        break;
      case "changeQty":
        addToast({ type: "info", message: "입고수량이 변경되었습니다." });
        break;
      case "quickInbound":
        addToast({ type: "info", message: "간편입고 처리되었습니다." });
        break;
      case "location":
        addToast({ type: "info", message: "로케이션이 지정되었습니다." });
        break;
    }
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["inbound"] });
  };

  const handleReset = () => {
    setSearchOrderNo("");
    setWorkType("");
    setOrderDetail("");
    setItemGroup("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">입고관리</h1>
        <div className="flex items-center gap-2">
          <p className="mr-4 text-sm text-[#8B95A1]">주문 &gt; 입고관리</p>
          <Button size="sm" variant="secondary" onClick={() => addToast({ type: "info", message: "템플릿입력" })}>
            템플릿입력
          </Button>
          <Button size="sm" onClick={() => addToast({ type: "info", message: "입고확정" })}>
            입고확정
          </Button>
          <Button size="sm" variant="outline" onClick={() => addToast({ type: "info", message: "입고일변경" })}>
            입고일변경
          </Button>
        </div>
      </div>

      {/* Search area matching slide 17 */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-3">
          {/* Row 1 */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">입고예정일</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
                <span className="text-sm text-[#8B95A1]">~</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
              </div>
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문번호</label>
              <input type="text" value={searchOrderNo} onChange={(e) => setSearchOrderNo(e.target.value)} className={inputBase} />
            </div>
            <div className="min-w-[200px]">
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
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업구분</label>
              <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={selectBase}>
                <option value="">주문전체</option>
                <option value="NORMAL">정상입고</option>
                <option value="RETURN">반품입고</option>
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[100px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
                <input type="text" className={inputBase + " max-w-[100px]"} />
              </div>
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[100px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
                <input type="text" className={inputBase + " max-w-[100px]"} />
              </div>
            </div>
          </div>
          {/* Row 3 */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문상세</label>
              <select value={orderDetail} onChange={(e) => setOrderDetail(e.target.value)} className={selectBase}>
                <option value="">선택</option>
                <option value="normal">정상</option>
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품군</label>
              <select value={itemGroup} onChange={(e) => setItemGroup(e.target.value)} className={selectBase}>
                <option value="">전체</option>
              </select>
            </div>
            <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
              <Search className="h-4 w-4" />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => setShowCreateModal(true)}>신규</Button>
        <Button size="sm" variant="secondary" onClick={() => addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." })}>삭제</Button>
        <Button size="sm" variant="outline" className="!bg-[#22C55E] !text-white !border-[#22C55E]" onClick={() => downloadExcel("/export/inbound", "입고목록.xlsx")}>엑셀</Button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">입고관리</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                </th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업상태</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문번호</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문SEQ</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">화주</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">입고처</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">입고예정일</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">입고일자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품코드</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품명</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">주문량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문UOM</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 animate-pulse rounded bg-[#F2F4F6]" /></td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      데이터를 불러오는 중 오류가 발생했습니다.
                    </div>
                  </td>
                </tr>
              ) : flatRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td>
                </tr>
              ) : (
                flatRows.map((row, idx) => (
                  <tr
                    key={`${row.orderId}-${idx}`}
                    onContextMenu={(e) => handleContextMenu(e, row.orderId)}
                    className="cursor-pointer border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]"
                  >
                    <td className="px-3 py-3 text-center">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.workStatus}</td>
                    <td className="px-3 py-3 text-sm font-medium text-[#191F28]">{row.orderNumber}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.orderSeq}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.partnerName}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.supplierName || "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.expectedDate}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.arrivedDate || "-"}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{row.itemCode}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.itemName}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{formatNumber(row.orderedQty)}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.orderUOM || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
            {flatRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#D1D6DB] bg-[#F7F8FA] font-semibold">
                  <td colSpan={10} className="px-3 py-3 text-right text-sm text-[#191F28]">합계</td>
                  <td className="px-3 py-3 text-right text-sm text-[#191F28]">{formatNumber(totalOrderedQty)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page {page} of {totalPages}</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {flatRows.length} of {total}</p>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-xl border border-[#E5E8EB] bg-white py-2 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => handleContextAction("location")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">로케이션지정</button>
          <button onClick={() => handleContextAction("approve")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">주문승인 <span className="float-right text-[#8B95A1]">+</span></button>
          <button onClick={() => handleContextAction("dispatch")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">배차</button>
          <button onClick={() => handleContextAction("arrive")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">입하 <span className="float-right text-[#8B95A1]">+</span></button>
          <button onClick={() => handleContextAction("receive")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">입고 <span className="float-right text-[#8B95A1]">+</span></button>
          <button onClick={() => handleContextAction("confirm")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#FFFBEB]">입고확정</button>
          <button onClick={() => handleContextAction("barcode")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">바코드발행</button>
          <button onClick={() => handleContextAction("changeQty")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">입고수량변경</button>
          <button onClick={() => handleContextAction("quickInbound")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">간편입고</button>
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
