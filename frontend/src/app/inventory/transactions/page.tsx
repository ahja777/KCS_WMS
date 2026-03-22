"use client";

import { useState, useMemo } from "react";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import { Search, AlertCircle, RotateCcw } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/utils";
import { useWarehouses } from "@/hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToastStore } from "@/stores/toast.store";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { PaginatedResponse, InventoryTransaction } from "@/types";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

function getTxTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INBOUND: "입고", OUTBOUND: "출고", ADJUSTMENT_IN: "조정(입)", ADJUSTMENT_OUT: "조정(출)",
    TRANSFER: "이동", CYCLE_COUNT: "실사", RETURN: "반품",
  };
  return labels[type] || type;
}

export default function InventoryTransactionsPage() {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("2010-01-01");
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });

  const warehouseMap = useMemo(() => {
    const map: Record<string, string> = {};
    (warehouseResponse?.data ?? []).forEach((w) => { map[w.id] = w.name; });
    return map;
  }, [warehouseResponse]);

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page, limit };
    if (warehouseFilter) p.warehouseId = warehouseFilter;
    if (txTypeFilter) p.txType = txTypeFilter;
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    if (search) p.search = search;
    return p;
  }, [page, limit, warehouseFilter, txTypeFilter, startDate, endDate, search]);

  const { data: response, isLoading, error } = useQuery<PaginatedResponse<InventoryTransaction>>({
    queryKey: ["inventory-transactions", queryParams],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/inventory/transactions", { params: queryParams });
      return wrapped.data;
    },
  });

  const transactions = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const totalQty = useMemo(() => transactions.reduce((s, t) => s + t.quantity, 0), [transactions]);

  const { sortedData: sortedTransactions, sortKey, sortDir, handleSort } = useTableSort(transactions);

  const handleReset = () => {
    setSearch("");
    setWarehouseFilter("");
    setTxTypeFilter("");
    setStartDate("2010-01-01");
    setEndDate(new Date().toISOString().slice(0, 10));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">재고입출고내역</h1>
        <p className="text-sm text-[#8B95A1]">재고관리 &gt; 재고입출고내역</p>
      </div>

      <InventoryTabNav />

      {/* Search - matching slide 33 */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업일자</label>
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className={selectBase} />
                <span className="text-sm text-[#8B95A1]">~</span>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className={selectBase} />
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
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">조회조건</label>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={inputBase}
                placeholder="품목코드/품목명 검색..."
              />
            </div>
            <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
              <Search className="h-4 w-4" /> 검색
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="danger" size="sm" onClick={() => useToastStore.getState().addToast({ type: "success", message: "저장되었습니다." })}>저장</Button>
        <Button variant="outline" size="sm" className="!bg-[#22C55E] !text-white !border-[#22C55E]">엑셀</Button>
      </div>

      {/* Grid - matching slide 33 columns */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">재고입출고내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <SortableHeader field="type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>종류</SortableHeader>
                <SortableHeader field="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>개업일자</SortableHeader>
                <SortableHeader field="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>작업시간</SortableHeader>
                <SortableHeader field="quantity" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>입/출고</SortableHeader>
                <SortableHeader field="item.code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>상품코드</SortableHeader>
                <SortableHeader field="item.name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>상품명</SortableHeader>
                <SortableHeader field="quantity" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">수량</SortableHeader>
                <SortableHeader field="uom" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>UOM</SortableHeader>
                <SortableHeader field="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>입실일</SortableHeader>
                <SortableHeader field="warehouseId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>창고</SortableHeader>
                <SortableHeader field="createdBy" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>담당자</SortableHeader>
                <SortableHeader field="referenceId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>원주문ID</SortableHeader>
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
                <tr><td colSpan={12} className="py-10 text-center text-sm text-red-500">
                  <AlertCircle className="mr-1 inline h-4 w-4" />오류가 발생했습니다.
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={12} className="py-16 text-center text-sm text-[#8B95A1]">입출고 내역이 없습니다.</td></tr>
              ) : (
                sortedTransactions.map((tx, idx) => {
                  const dateStr = tx.createdAt?.slice(0, 10) ?? "-";
                  const timeStr = tx.createdAt?.slice(11, 19) ?? "-";
                  const isInbound = tx.quantity > 0;
                  return (
                    <tr key={tx.id ?? idx} className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{getTxTypeLabel(tx.type)}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{dateStr}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{timeStr}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{isInbound ? "입고실적" : "출고실적"}</td>
                      <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{tx.item?.code ?? "-"}</td>
                      <td className="px-3 py-3 text-sm text-[#191F28]">{tx.item?.name ?? "-"}</td>
                      <td className={`px-3 py-3 text-right text-sm font-medium ${isInbound ? "text-[#1FC47D]" : "text-[#F04452]"}`}>
                        {isInbound ? "+" : ""}{formatNumber(tx.quantity)}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">EA</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{dateStr}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{warehouseMap[tx.warehouseId] || "-"}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{tx.createdBy ?? "-"}</td>
                      <td className="px-3 py-3 text-sm font-mono text-[#8B95A1]">{tx.referenceId ? tx.referenceId.slice(0, 10) : "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#D1D6DB] bg-[#F7F8FA] font-semibold">
                  <td colSpan={6} className="px-3 py-3 text-right text-sm">합계</td>
                  <td className="px-3 py-3 text-right text-sm">{formatNumber(totalQty)}</td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page {page} of {totalPages}</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {transactions.length} of {total}</p>
        </div>
      </div>
    </div>
  );
}
