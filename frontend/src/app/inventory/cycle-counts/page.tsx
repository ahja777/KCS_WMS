"use client";

import { useState, useCallback } from "react";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import { Search, AlertCircle, RotateCcw, Check, X, Pencil } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function CycleCountsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);

  // Use inventory items as base for cycle count view
  const { data: response, isLoading } = useInventoryList({ page, limit: 20 });
  const inventoryItems = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const { sortedData: sortedItems, sortKey, sortDir, handleSort } = useTableSort(inventoryItems);

  const [selectedRow, setSelectedRow] = useState<any>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCountQty, setEditCountQty] = useState<number>(0);

  const handleEdit = useCallback((item: any) => {
    setEditingId(item.id);
    setEditCountQty(item.quantity ?? 0);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditCountQty(0);
  }, []);

  const handleEditSave = useCallback((item: any) => {
    addToast({ type: "success", message: "저장이 완료되었습니다." });
    setEditingId(null);
  }, [addToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">재고실사</h1>
        <p className="text-sm text-[#8B95A1]">재고관리 &gt; 재고실사</p>
      </div>

      <InventoryTabNav />

      {/* Search area matching slide 36 */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[250px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
            <div className="flex gap-1">
              <input type="text" className={inputBase + " max-w-[120px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" className={inputBase + " max-w-[120px]"} />
            </div>
          </div>
          <div className="min-w-[250px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
            <div className="flex gap-1">
              <input type="text" className={inputBase + " max-w-[120px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" className={inputBase + " max-w-[120px]"} />
            </div>
          </div>
          <div className="min-w-[250px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
            <div className="flex gap-1">
              <input type="text" className={inputBase + " max-w-[120px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" className={inputBase + " max-w-[120px]"} />
            </div>
          </div>
          <button className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]"><RotateCcw className="h-4 w-4" /></button>
          <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]"><Search className="h-4 w-4" /> 검색</button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => { if (selectedRow) handleEdit(selectedRow); }}
          disabled={!selectedRow}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9500] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#E08200] focus:ring-2 focus:ring-[#FF9500]/30 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Pencil className="h-4 w-4" />
          수정
        </button>
        <Button variant="danger" size="sm" onClick={() => addToast({ type: "success", message: "저장이 완료되었습니다." })}>저장</Button>
        <Button variant="outline" size="sm" className="!bg-[#22C55E] !text-white !border-[#22C55E]">엑셀</Button>
      </div>

      {/* Grid matching slide 36 (재고실사내역) */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">재고실사내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <SortableHeader field="locationCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>로케이션</SortableHeader>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]"></th>
                <SortableHeader field="item.code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>상품</SortableHeader>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]"></th>
                <SortableHeader field="quantity" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">재고수량</SortableHeader>
                <SortableHeader field="countQty" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">실사수량</SortableHeader>
                <SortableHeader field="lotNumber" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>UOM</SortableHeader>
              </tr>
              <tr className="border-b border-[#E5E8EB] bg-[#F7F8FA]">
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">상품명</th>
                <th colSpan={3}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 animate-pulse rounded bg-[#F2F4F6]" /></td>
                    ))}
                  </tr>
                ))
              ) : inventoryItems.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-sm text-[#8B95A1]">재고 실사 내역이 없습니다.</td></tr>
              ) : (
                sortedItems.map((item, idx) => (
                  <tr key={item.id ?? idx} onClick={() => setSelectedRow((prev: any) => (prev?.id === item.id ? null : item))} className={`cursor-pointer border-b border-[#F2F4F6] transition-colors ${selectedRow?.id === item.id ? "bg-[#E8F2FF]" : "hover:bg-[#F7F8FA]"}`}>
                    <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.locationCode ?? "GRN_LOC"}</td>
                    <td className="px-3 py-3">
                      <button className="rounded bg-[#F2F4F6] p-0.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-3 w-3" /></button>
                    </td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.item?.code ?? "-"}</td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">
                      <button className="mr-1 rounded bg-[#F2F4F6] p-0.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-3 w-3" /></button>
                      {item.item?.name ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">{formatNumber(item.quantity)}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editCountQty}
                          onChange={(e) => setEditCountQty(Number(e.target.value))}
                          className="w-20 rounded-lg border border-[#3182F6] bg-white px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
                          autoFocus
                        />
                      ) : (
                        formatNumber(item.quantity)
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{item.lotNumber ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page {page} of {totalPages}</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {inventoryItems.length} of {total}</p>
        </div>
      </div>
    </div>
  );
}
