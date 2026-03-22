"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Search, AlertCircle, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate, formatNumber } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import { useOutboundOrders, useConfirmOutbound } from "@/hooks/useApi";
import { usePermission } from "@/hooks/usePermission";
import { useToastStore } from "@/stores/toast.store";
import OutboundFormModal from "@/components/outbound/OutboundFormModal";
import type { OutboundOrder } from "@/types";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function OutboundPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const perm = usePermission("outbound");
  const addToast = useToastStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<"order" | "quick">("order");

  // Search state
  const [outType, setOutType] = useState("출고예");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [workType, setWorkType] = useState("");
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [itemGroup, setItemGroup] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; orderId: string } | null>(null);

  const { data: response, isLoading, error } = useOutboundOrders({
    page,
    limit: 20,
    ...(searchOrderNo ? { search: searchOrderNo } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const confirmOutbound = useConfirmOutbound();

  const orders = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Flatten orders
  const flatRows = useMemo(() => {
    const rows: Array<{
      orderId: string;
      workStatus: string;
      orderNumber: string;
      orderSeq: number;
      partnerName: string;
      deliveryTo: string;
      expectedDate: string;
      shipDate: string;
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
          workStatus: order.status === "CONFIRMED" ? "출고확정" : order.status === "SHIPPED" ? "출하완료" : order.status,
          orderNumber: order.orderNumber,
          orderSeq: 1,
          partnerName: order.partner?.name ?? "-",
          deliveryTo: order.partner?.name ?? "",
          expectedDate: formatDate(order.shipDate ?? order.createdAt),
          shipDate: formatDate(order.deliveryDate ?? ""),
          itemCode: "-",
          itemName: "-",
          orderedQty: 0,
          orderUOM: "",
        });
      } else {
        lines.forEach((line, idx) => {
          rows.push({
            orderId: order.id,
            workStatus: order.status === "CONFIRMED" ? "출고확정" : order.status === "SHIPPED" ? "출하완료" : order.status,
            orderNumber: order.orderNumber,
            orderSeq: idx + 1,
            partnerName: order.partner?.name ?? "-",
            deliveryTo: order.partner?.name ?? "",
            expectedDate: formatDate(order.shipDate ?? order.createdAt),
            shipDate: formatDate(order.deliveryDate ?? ""),
            itemCode: line.item?.code ?? "-",
            itemName: line.item?.name ?? "-",
            orderedQty: line.orderedQty ?? 0,
            orderUOM: line.item?.uom ?? "EA",
          });
        });
      }
    }
    return rows;
  }, [orders]);

  const totalOrderedQty = useMemo(() => flatRows.reduce((s, r) => s + r.orderedQty, 0), [flatRows]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, orderId });
  };

  const handleContextAction = (action: string) => {
    setContextMenu(null);
    addToast({ type: "info", message: `${action} 처리되었습니다.` });
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["outbound"] });
  };

  const handleReset = () => {
    setSearchOrderNo("");
    setWorkType("");
    setItemGroup("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Tabs: 출고주문 | 간편출고주문 */}
      <div className="flex items-center gap-0 border-b border-[#E5E8EB]">
        <button
          onClick={() => setActiveTab("order")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "order" ? "border-b-2 border-[#3182F6] text-[#3182F6]" : "text-[#8B95A1] hover:text-[#4E5968]"
          }`}
        >
          출고주문
        </button>
        <button
          onClick={() => setActiveTab("quick")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "quick" ? "border-b-2 border-[#3182F6] text-[#3182F6]" : "text-[#8B95A1] hover:text-[#4E5968]"
          }`}
        >
          간편출고주문
        </button>
        <div className="ml-auto text-sm text-[#8B95A1]">주문 &gt; 출고관리</div>
      </div>

      {activeTab === "order" ? (
        <>
          {/* Top buttons */}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => addToast({ type: "info", message: "템플릿입력" })}>템플릿입력</Button>
            <Button size="sm" variant="outline" onClick={() => addToast({ type: "info", message: "출고일변경" })}>출고일변경</Button>
          </div>

          {/* Search area */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">출고예</label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
                    <span className="text-sm text-[#8B95A1]">~</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
                  </div>
                </div>
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
                  <div className="flex gap-1">
                    <input type="text" className={inputBase + " max-w-[100px]"} />
                    <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                    <input type="text" className={inputBase + " max-w-[100px]"} />
                  </div>
                </div>
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
                  <div className="flex gap-1">
                    <input type="text" className={inputBase + " max-w-[100px]"} />
                    <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                    <input type="text" className={inputBase + " max-w-[100px]"} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업구분</label>
                  <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={selectBase}>
                    <option value="">주문전체</option>
                    <option value="NORMAL">정상출고</option>
                  </select>
                </div>
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문번호</label>
                  <input type="text" value={searchOrderNo} onChange={(e) => setSearchOrderNo(e.target.value)} className={inputBase} />
                </div>
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품군</label>
                  <select value={itemGroup} onChange={(e) => setItemGroup(e.target.value)} className={selectBase}>
                    <option value="">전체</option>
                  </select>
                </div>
                <div className="min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
                  <div className="flex gap-1">
                    <input type="text" className={inputBase + " max-w-[100px]"} />
                    <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                    <input type="text" className={inputBase + " max-w-[100px]"} />
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
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setShowCreateModal(true)}>신규</Button>
            <Button size="sm" variant="secondary">삭제</Button>
            <Button size="sm" variant="outline" className="!bg-[#22C55E] !text-white !border-[#22C55E]" onClick={() => downloadExcel("/export/outbound", "출고목록.xlsx")}>엑셀</Button>
          </div>

          {/* Grid */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
              <h2 className="text-sm font-semibold text-white">출고관리</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업상태</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문번호</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문SEQ</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">화주</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">배송처</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">출고예정일</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">출고일자</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품코드</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품명</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">주문량</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
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
                    <tr><td colSpan={12} className="py-10 text-center text-sm text-red-500">오류가 발생했습니다.</td></tr>
                  ) : flatRows.length === 0 ? (
                    <tr><td colSpan={12} className="py-16 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
                  ) : (
                    flatRows.map((row, idx) => (
                      <tr key={`${row.orderId}-${idx}`} onContextMenu={(e) => handleContextMenu(e, row.orderId)} className="cursor-pointer border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                        <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.workStatus}</td>
                        <td className="px-3 py-3 text-sm font-medium text-[#191F28]">{row.orderNumber}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.orderSeq}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.partnerName}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.deliveryTo || "-"}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.expectedDate}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.shipDate || "-"}</td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{row.itemCode}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.itemName}</td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{formatNumber(row.orderedQty)}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{row.orderUOM}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {flatRows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#D1D6DB] bg-[#F7F8FA] font-semibold">
                      <td colSpan={10} className="px-3 py-3 text-right text-sm">합계</td>
                      <td className="px-3 py-3 text-right text-sm">{formatNumber(totalOrderedQty)}</td>
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
            <div className="fixed z-50 min-w-[180px] rounded-xl border border-[#E5E8EB] bg-white py-2 shadow-lg" style={{ left: contextMenu.x, top: contextMenu.y }}>
              <button onClick={() => handleContextAction("주문승인")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">주문승인 <span className="float-right text-[#8B95A1]">+</span></button>
              <button onClick={() => handleContextAction("거래명세서발행")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">거래명세서발행</button>
              <button onClick={() => handleContextAction("물량할당")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">물량할당 <span className="float-right text-[#8B95A1]">+</span></button>
              <button onClick={() => handleContextAction("팩보충")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">팩보충</button>
              <button onClick={() => handleContextAction("로케이션지정")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">로케이션지정</button>
              <button onClick={() => handleContextAction("배차")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">배차</button>
              <button onClick={() => handleContextAction("피킹")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">피킹 <span className="float-right text-[#8B95A1]">+</span></button>
              <button onClick={() => handleContextAction("상차")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">상차 <span className="float-right text-[#8B95A1]">+</span></button>
              <button onClick={() => handleContextAction("출고확정")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#FFFBEB]">출고확정</button>
              <button onClick={() => handleContextAction("번들보충")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">번들보충</button>
              <button onClick={() => handleContextAction("간편출고")} className="w-full px-4 py-2 text-left text-sm text-[#4E5968] hover:bg-[#F7F8FA]">간편출고</button>
            </div>
          )}
        </>
      ) : (
        /* 간편출고주문 tab - matching slide 24 */
        <>
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
                    <span className="text-red-500">*</span>화주
                  </label>
                  <div className="flex gap-1">
                    <input type="text" className={inputBase + " max-w-[120px]"} />
                    <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                    <input type="text" className={inputBase + " max-w-[120px]"} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">출고요청일</label>
                  <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={selectBase} />
                </div>
                <div className="min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">대금결제여부</label>
                  <select className={selectBase}><option value="">선택</option></select>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문구분</label>
                  <select className={selectBase}><option value="">정상입고</option></select>
                </div>
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품군</label>
                  <select className={selectBase}><option value="">전체</option></select>
                </div>
                <div className="min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
                  <div className="flex gap-1">
                    <input type="text" className={inputBase + " max-w-[100px]"} />
                    <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                    <input type="text" className={inputBase + " max-w-[100px]"} />
                  </div>
                </div>
                <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]"><RotateCcw className="h-4 w-4" /></button>
                <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]"><Search className="h-4 w-4" /> 검색</button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="danger" size="sm">저장</Button>
          </div>

          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
              <h2 className="text-sm font-semibold text-white">상품목록</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="w-10 px-3 py-3"></th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품군</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품코드</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품명</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">현재고</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">유통기한</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">주문수량</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">불량품</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">단가</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">창고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-sm text-[#8B95A1]">
                      화주를 선택하고 검색하세요.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
              <p className="text-sm text-[#8B95A1]">Page 0 of</p>
            </div>
          </div>
        </>
      )}

      <OutboundFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
