"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { useInboundOrders, useOutboundOrders } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

// Mock vehicle data matching slide 26
const mockVehicles = [
  { id: "1", vehicleNumber: "7738", tonnage: 100 },
  { id: "2", vehicleNumber: "3218", tonnage: 8 },
  { id: "3", vehicleNumber: "9874", tonnage: 100 },
  { id: "4", vehicleNumber: "9998", tonnage: 250 },
];

interface DispatchItem {
  vehicleNumber: string;
  orderNumber: string;
  seq: number;
  workStatus: string;
  product: string;
  orderedQty: number;
  dispatchQty: number;
}

export default function DispatchPage() {
  const addToast = useToastStore((s) => s.addToast);
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState("2005-06-02");
  const [dateTo, setDateTo] = useState(today);
  const [sequenceFilter, setSequenceFilter] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<typeof mockVehicles[0] | null>(null);
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);

  const handleReset = () => {
    setDateFrom("2005-06-02");
    setDateTo(today);
    setSequenceFilter("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">출고관리 &gt; 배차작업</h1>
      </div>

      {/* Search area matching slide 26 */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">주문일자</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
                <span className="text-sm text-[#8B95A1]">~</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
              </div>
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">차량</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[120px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" className={inputBase + " max-w-[120px]"} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[300px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업차수</label>
              <input type="text" value={sequenceFilter} onChange={(e) => setSequenceFilter(e.target.value)} className={inputBase} />
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
              <div className="flex gap-1">
                <input type="text" className={inputBase + " max-w-[120px]"} />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" className={inputBase + " max-w-[120px]"} />
              </div>
            </div>
            <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]"><RotateCcw className="h-4 w-4" /></button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]"><Search className="h-4 w-4" /> 검색</button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => addToast({ type: "info", message: "미배차내역 조회" })}>미배차내역조회</Button>
        <Button variant="danger" size="sm">저장</Button>
        <Button size="sm" variant="secondary">삭제</Button>
        <Button variant="outline" size="sm" className="!bg-[#22C55E] !text-white !border-[#22C55E]">엑셀</Button>
        <Button variant="secondary" size="sm">닫기</Button>
      </div>

      {/* Two-panel grid matching slide 26 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left: 차량목록 */}
        <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">차량목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="w-10 px-3 py-3 text-center"></th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">차량번호</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">Ton수</th>
                </tr>
              </thead>
              <tbody>
                {mockVehicles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={cn(
                      "cursor-pointer border-b border-[#F2F4F6] transition-colors",
                      selectedVehicle?.id === v.id ? "bg-[#E8F2FF]" : "hover:bg-[#F7F8FA]"
                    )}
                  >
                    <td className="px-3 py-3 text-center">{v.id}</td>
                    <td className="px-3 py-3 text-sm text-center text-[#191F28]">{v.vehicleNumber}</td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">{v.tonnage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
            <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
            <p className="text-sm text-[#8B95A1]">View 1 - {mockVehicles.length} of {mockVehicles.length}</p>
          </div>
        </div>

        {/* Right: 배차내역 */}
        <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">배차내역</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="w-10 px-3 py-3 text-center"></th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">차량번호</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문번호</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">순번</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업상태</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">주문수량</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">배차수량</th>
                </tr>
              </thead>
              <tbody>
                {dispatchItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-[#8B95A1]">
                      {selectedVehicle ? "배차 내역이 없습니다." : "좌측에서 차량을 선택해주세요."}
                    </td>
                  </tr>
                ) : (
                  dispatchItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#F2F4F6]">
                      <td className="px-3 py-3 text-center">{idx + 1}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{item.vehicleNumber}</td>
                      <td className="px-3 py-3 text-sm text-[#191F28]">{item.orderNumber}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{item.seq}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{item.workStatus}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{item.product}</td>
                      <td className="px-3 py-3 text-right text-sm text-[#4E5968]">{formatNumber(item.orderedQty)}</td>
                      <td className="px-3 py-3 text-right text-sm text-[#4E5968]">{formatNumber(item.dispatchQty)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
            <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
            <p className="text-sm text-[#8B95A1]">No records to view</p>
          </div>
        </div>
      </div>
    </div>
  );
}
