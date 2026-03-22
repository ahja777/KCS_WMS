"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, AlertCircle, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import { useInventoryList, useWarehouses } from "@/hooks/useApi";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { Inventory } from "@/types";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [itemGroup, setItemGroup] = useState("");
  const [showZeroStock, setShowZeroStock] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<Inventory | null>(null);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });

  const { data: response, isLoading, error } = useInventoryList({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
  });

  const inventoryItems = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Summary totals
  const summaryTotals = useMemo(() => {
    return inventoryItems.reduce(
      (acc, item) => ({
        previousStock: acc.previousStock,
        inbound: acc.inbound,
        outbound: acc.outbound,
        eventOutbound: acc.eventOutbound,
        currentStock: acc.currentStock + item.quantity,
      }),
      { previousStock: 0, inbound: 0, outbound: 0, eventOutbound: 0, currentStock: 0 }
    );
  }, [inventoryItems]);

  const handleReset = () => {
    setSearch("");
    setWarehouseFilter("");
    setItemGroup("");
    setShowZeroStock(false);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">현재고 조회</h1>
        <p className="text-sm text-[#8B95A1]">재고관리 &gt; 현재고 조회</p>
      </div>

      <InventoryTabNav />

      {/* Search area matching slide 31 */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[120px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" className={inputBase + " max-w-[120px]"} />
              </div>
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
              <div className="flex gap-1">
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={inputBase + " max-w-[120px]"} placeholder="" />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" className={inputBase + " max-w-[120px]"} />
              </div>
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품군</label>
              <select value={itemGroup} onChange={(e) => setItemGroup(e.target.value)} className={selectBase}>
                <option value="">전체</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[120px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" className={inputBase + " max-w-[120px]"} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <span className="text-sm text-[#6B7684]">옵션</span>
              <label className="flex items-center gap-1.5 text-sm text-[#4E5968]">
                <input type="checkbox" checked={showZeroStock} onChange={(e) => setShowZeroStock(e.target.checked)} className="h-4 w-4 rounded border-[#D1D6DB]" />
                미재고 표시
              </label>
            </div>
            <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]"><RotateCcw className="h-4 w-4" /></button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]"><Search className="h-4 w-4" /> 검색</button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="danger" size="sm">저장</Button>
        <Button variant="outline" size="sm" className="!bg-[#22C55E] !text-white !border-[#22C55E]" onClick={() => downloadExcel("/export/inventory", "현재고.xlsx")}>엑셀</Button>
      </div>

      {/* Top grid: 현재고 리스트 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">현재고 리스트</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>화주</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품군</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>상품</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">전일재고</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">입고</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">일반출고</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">이벤트출고</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">정상재고</th>
              </tr>
              <tr className="border-b border-[#E5E8EB] bg-[#F7F8FA]">
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">화주명</th>
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">상품명</th>
                <th colSpan={5}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 animate-pulse rounded bg-[#F2F4F6]" /></td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={11} className="py-10 text-center text-sm text-red-500">오류가 발생했습니다.</td></tr>
              ) : inventoryItems.length === 0 ? (
                <tr><td colSpan={11} className="py-16 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
              ) : (
                inventoryItems.map((item, idx) => (
                  <tr
                    key={item.id ?? idx}
                    onClick={() => setSelectedRow(item)}
                    className={`cursor-pointer border-b border-[#F2F4F6] transition-colors ${selectedRow?.id === item.id ? "bg-[#E8F2FF]" : "hover:bg-[#F7F8FA]"}`}
                  >
                    <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">-</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">-</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">-</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.item?.code ?? "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">{item.item?.name ?? "-"}</td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">0</td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">0</td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">0</td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">0</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{formatNumber(item.quantity)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {inventoryItems.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#D1D6DB] bg-[#F7F8FA] font-semibold">
                  <td colSpan={6} className="px-3 py-3 text-right text-sm">합계</td>
                  <td className="px-3 py-3 text-right text-sm">0</td>
                  <td className="px-3 py-3 text-right text-sm">0</td>
                  <td className="px-3 py-3 text-right text-sm">0</td>
                  <td className="px-3 py-3 text-right text-sm">0</td>
                  <td className="px-3 py-3 text-right text-sm">{formatNumber(summaryTotals.currentStock)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page {page} of {totalPages}</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {inventoryItems.length} of {total}</p>
        </div>
      </div>

      {/* Bottom grid: 상세 로케이션 정보 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">상세 로케이션 정보</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업일자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">로케이션</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>상품</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">재고수량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">PLT수량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">B/L번호</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">창고</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">LOT번호</th>
              </tr>
            </thead>
            <tbody>
              {!selectedRow ? (
                <tr><td colSpan={11} className="py-10 text-center text-sm text-[#8B95A1]">상위 목록에서 항목을 선택해주세요.</td></tr>
              ) : (
                <tr className="border-b border-[#F2F4F6]">
                  <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{formatDate(selectedRow.updatedAt)}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{selectedRow.locationCode}</td>
                  <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{selectedRow.item?.code ?? "-"}</td>
                  <td className="px-3 py-3 text-sm text-[#191F28]">{selectedRow.item?.name ?? "-"}</td>
                  <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{formatNumber(selectedRow.quantity)}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{selectedRow.item?.uom ?? "EA"}</td>
                  <td className="px-3 py-3 text-right text-sm text-[#4E5968]">0</td>
                  <td className="px-3 py-3 text-sm text-[#8B95A1]">-</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{selectedRow.warehouse?.name ?? "-"}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{selectedRow.lotNumber ?? "N/A"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
