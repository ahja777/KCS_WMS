"use client";

import { useState, useMemo } from "react";
import { Search, AlertCircle, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatNumber, formatDateTime } from "@/lib/utils";
import {
  useWarehouses,
  useInventoryMovements,
  useCreateInventoryMovement,
  useStartInventoryMovement,
  useCompleteInventoryMovement,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { Warehouse } from "@/types";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

interface Movement {
  id: string;
  movementNumber?: string;
  fromWarehouseId: string;
  fromWarehouse?: Warehouse;
  toWarehouseId: string;
  toWarehouse?: Warehouse;
  status: string;
  items?: Array<{
    id: string;
    itemId: string;
    item?: { code: string; name: string };
    quantity: number;
    fromLocationCode: string;
    toLocationCode: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function MovementsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [dateFrom, setDateFrom] = useState("2010-10-01");
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  const { data: warehousesData } = useWarehouses({ limit: 100 });

  const queryParams = useMemo(() => ({ page, limit: 20 }), [page]);
  const { data: movementsResponse, isLoading, error } = useInventoryMovements(queryParams);

  const movementsRaw = movementsResponse as unknown;
  const movements: Movement[] = useMemo(() => {
    if (!movementsRaw) return [];
    if (Array.isArray(movementsRaw)) return movementsRaw;
    if (typeof movementsRaw === "object" && movementsRaw !== null) {
      const obj = movementsRaw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Movement[];
    }
    return [];
  }, [movementsRaw]);

  const warehouseMap: Record<string, string> = {};
  (warehousesData?.data ?? []).forEach((w) => { warehouseMap[w.id] = w.name; });

  const handleReset = () => {
    setDateFrom("2010-10-01");
    setDateTo(new Date().toISOString().slice(0, 10));
    setPage(1);
  };

  // Detail items for selected movement
  const detailItems = selectedMovement?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">재고이동</h1>
        <p className="text-sm text-[#8B95A1]">재고관리 &gt; 재고이동</p>
      </div>

      <InventoryTabNav />

      {/* Search area matching slide 34 */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업일자</label>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
            </div>
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
            <div className="flex gap-1">
              <input type="text" className={inputBase + " max-w-[120px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" className={inputBase + " max-w-[120px]"} />
            </div>
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

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => addToast({ type: "info", message: "신규 등록" })}>신규</Button>
        <Button variant="outline" size="sm" className="!bg-[#22C55E] !text-white !border-[#22C55E]">엑셀</Button>
      </div>

      {/* Top grid: 재고이동내역 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">재고이동내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상태</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업번호</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">화주</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업일자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">출고창고</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">입고창고</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 animate-pulse rounded bg-[#F2F4F6]" /></td>
                    ))}
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-[#8B95A1]">이동 내역이 없습니다.</td></tr>
              ) : (
                movements.map((mv) => {
                  const statusLabel = mv.status === "COMPLETED" ? "완료" : mv.status === "DRAFT" ? "선택" : mv.status;
                  return (
                    <tr
                      key={mv.id}
                      onClick={() => setSelectedMovement(mv)}
                      className={`cursor-pointer border-b border-[#F2F4F6] transition-colors ${selectedMovement?.id === mv.id ? "bg-[#FFFBEB]" : "hover:bg-[#F7F8FA]"}`}
                    >
                      <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{statusLabel}</td>
                      <td className="px-3 py-3 text-sm font-medium text-[#191F28]">{mv.movementNumber ?? mv.id.slice(0, 10)}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">-</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{mv.createdAt?.slice(0, 10) ?? "-"}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{mv.fromWarehouse?.name ?? warehouseMap[mv.fromWarehouseId] ?? "-"}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{mv.toWarehouse?.name ?? warehouseMap[mv.toWarehouseId] ?? "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {movements.length} of {movements.length}</p>
        </div>
      </div>

      {/* Bottom grid: 재고이동상세내역 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">재고이동상세내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상태</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업시간</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>로케이션</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">제품명</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">화주</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">LOT번호</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">재고수량</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">이동수량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
              </tr>
              <tr className="border-b border-[#E5E8EB] bg-[#F7F8FA]">
                <th></th><th></th><th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">FROM</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">TO</th>
                <th colSpan={6}></th>
              </tr>
            </thead>
            <tbody>
              {!selectedMovement ? (
                <tr><td colSpan={11} className="py-10 text-center text-sm text-[#8B95A1]">상위 목록에서 이동 내역을 선택해주세요.</td></tr>
              ) : detailItems.length === 0 ? (
                <tr><td colSpan={11} className="py-10 text-center text-sm text-[#8B95A1]">상세 품목 정보가 없습니다.</td></tr>
              ) : (
                detailItems.map((item, idx) => (
                  <tr key={item.id ?? idx} className="border-b border-[#F2F4F6]">
                    <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{selectedMovement.status === "COMPLETED" ? "완료" : "진행"}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{selectedMovement.createdAt?.slice(11, 19) ?? "-"}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.fromLocationCode}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.toLocationCode}</td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">{item.item?.name ?? "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">-</td>
                    <td className="px-3 py-3 text-sm text-[#8B95A1]">-</td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">-</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{formatNumber(item.quantity)}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">-</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {detailItems.length} of {detailItems.length}</p>
        </div>
      </div>
    </div>
  );
}
