"use client";

import { useState } from "react";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import { Search, RotateCcw, Pencil } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToastStore } from "@/stores/toast.store";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import AssemblyFormModal from "@/components/inventory/AssemblyFormModal";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

/* ---------- mock data ---------- */
interface AssemblyItem {
  id: string;
  workType: string;
  workDate: string;
  workTime: string;
  productCode: string;
  productName: string;
  qty: number;
  uom: string;
  warehouseCode: string;
  warehouseName: string;
  location: string;
  ownerCode: string;
  ownerName: string;
}

interface AssemblyDetail {
  id: string;
  partCode: string;
  partName: string;
  qty: number;
  uom: string;
  location: string;
  warehouseCode: string;
  warehouseName: string;
}

const MOCK_ASSEMBLY_LIST: AssemblyItem[] = [
  {
    id: "1",
    workType: "조립",
    workDate: "2026-03-20",
    workTime: "09:30",
    productCode: "FP-001",
    productName: "세트상품A",
    qty: 100,
    uom: "EA",
    warehouseCode: "WH-01",
    warehouseName: "본사창고",
    location: "A-01-01",
    ownerCode: "OWN-01",
    ownerName: "(주)화주A",
  },
  {
    id: "2",
    workType: "분해",
    workDate: "2026-03-19",
    workTime: "14:00",
    productCode: "FP-002",
    productName: "세트상품B",
    qty: 50,
    uom: "EA",
    warehouseCode: "WH-02",
    warehouseName: "제2창고",
    location: "B-02-03",
    ownerCode: "OWN-02",
    ownerName: "(주)화주B",
  },
  {
    id: "3",
    workType: "조립",
    workDate: "2026-03-18",
    workTime: "11:15",
    productCode: "FP-003",
    productName: "세트상품C",
    qty: 200,
    uom: "BOX",
    warehouseCode: "WH-01",
    warehouseName: "본사창고",
    location: "C-01-02",
    ownerCode: "OWN-01",
    ownerName: "(주)화주A",
  },
];

const MOCK_DETAIL_MAP: Record<string, AssemblyDetail[]> = {
  "1": [
    { id: "d1", partCode: "PT-001", partName: "부분품A-1", qty: 100, uom: "EA", location: "A-01-01", warehouseCode: "WH-01", warehouseName: "본사창고" },
    { id: "d2", partCode: "PT-002", partName: "부분품A-2", qty: 200, uom: "EA", location: "A-01-02", warehouseCode: "WH-01", warehouseName: "본사창고" },
    { id: "d3", partCode: "PT-003", partName: "부분품A-3", qty: 300, uom: "EA", location: "A-02-01", warehouseCode: "WH-01", warehouseName: "본사창고" },
  ],
  "2": [
    { id: "d4", partCode: "PT-010", partName: "부분품B-1", qty: 50, uom: "EA", location: "B-02-03", warehouseCode: "WH-02", warehouseName: "제2창고" },
    { id: "d5", partCode: "PT-011", partName: "부분품B-2", qty: 100, uom: "EA", location: "B-02-04", warehouseCode: "WH-02", warehouseName: "제2창고" },
  ],
  "3": [
    { id: "d6", partCode: "PT-020", partName: "부분품C-1", qty: 200, uom: "BOX", location: "C-01-02", warehouseCode: "WH-01", warehouseName: "본사창고" },
    { id: "d7", partCode: "PT-021", partName: "부분품C-2", qty: 400, uom: "EA", location: "C-01-03", warehouseCode: "WH-01", warehouseName: "본사창고" },
  ],
};

export default function AssemblyPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [workType, setWorkType] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assemblyType, setAssemblyType] = useState("assembly");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AssemblyItem | null>(null);

  const handleEdit = (item: AssemblyItem) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const { sortedData: sortedAssemblyList, sortKey, sortDir, handleSort } = useTableSort(MOCK_ASSEMBLY_LIST);
  const detailItems = selectedId ? MOCK_DETAIL_MAP[selectedId] ?? [] : [];

  const handleReset = () => {
    setDateFrom("2026-01-01");
    setDateTo(new Date().toISOString().slice(0, 10));
    setWorkType("");
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">임가공</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#8B95A1]">재고관리 &gt; 임가공</p>
          <select
            value={assemblyType}
            onChange={(e) => {
              setAssemblyType(e.target.value);
              if (e.target.value === "assembly") setShowFormModal(true);
            }}
            className={selectBase + " min-w-[140px]"}
          >
            <option value="assembly">임가공조립</option>
            <option value="disassembly">임가공분해</option>
          </select>
        </div>
      </div>

      <InventoryTabNav />

      {/* Search area */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4 mb-4">
          {/* 작업일자 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업일자</label>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase} />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase} />
            </div>
          </div>
          {/* 화주 */}
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
            <div className="flex gap-1">
              <input type="text" placeholder="코드" className={inputBase + " max-w-[100px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" placeholder="화주명" className={inputBase + " max-w-[100px]"} />
            </div>
          </div>
          {/* 상품 */}
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
            <div className="flex gap-1">
              <input type="text" placeholder="코드" className={inputBase + " max-w-[100px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" placeholder="상품명" className={inputBase + " max-w-[100px]"} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {/* 작업구분 */}
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업구분</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={selectBase + " w-full"}>
              <option value="">선택</option>
              <option value="조립">조립</option>
              <option value="분해">분해</option>
            </select>
          </div>
          {/* 창고 */}
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
            <div className="flex gap-1">
              <input type="text" placeholder="코드" className={inputBase + " max-w-[100px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" placeholder="창고명" className={inputBase + " max-w-[100px]"} />
            </div>
          </div>
          {/* UOM */}
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">UOM</label>
            <div className="flex gap-1">
              <input type="text" placeholder="코드" className={inputBase + " max-w-[100px]"} />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              <input type="text" placeholder="UOM명" className={inputBase + " max-w-[100px]"} />
            </div>
          </div>
          {/* Reset / Search */}
          <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
            <Search className="h-4 w-4" /> 검색
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => { if (selectedId) { const item = MOCK_ASSEMBLY_LIST.find(i => i.id === selectedId); if (item) handleEdit(item); } }}
          disabled={!selectedId}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9500] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#E08200] focus:ring-2 focus:ring-[#FF9500]/30 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Pencil className="h-4 w-4" />
          수정
        </button>
        <Button size="sm" onClick={() => { setEditingItem(null); setShowFormModal(true); }}>신규</Button>
        <Button variant="outline" size="sm" className="!bg-[#22C55E] !text-white !border-[#22C55E]">엑셀</Button>
      </div>

      {/* Top grid: 임가공내역 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">임가공내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <SortableHeader field="workType" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>작업구분</SortableHeader>
                <SortableHeader field="workDate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>작업일자</SortableHeader>
                <SortableHeader field="workTime" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>작업시간</SortableHeader>
                <SortableHeader field="productCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>완성품</SortableHeader>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]"></th>
                <SortableHeader field="qty" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">수량</SortableHeader>
                <SortableHeader field="uom" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>UOM</SortableHeader>
                <SortableHeader field="warehouseCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>창고</SortableHeader>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]"></th>
                <SortableHeader field="location" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>로케이션</SortableHeader>
                <SortableHeader field="ownerCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>화주</SortableHeader>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]"></th>
              </tr>
              <tr className="border-b border-[#E5E8EB] bg-[#F7F8FA]">
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">상품명</th>
                <th></th>
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">창고명</th>
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">화주명</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ASSEMBLY_LIST.length === 0 ? (
                <tr><td colSpan={13} className="py-16 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
              ) : (
                sortedAssemblyList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer border-b border-[#F2F4F6] transition-colors ${selectedId === item.id ? "bg-[#FFFBEB]" : "hover:bg-[#F7F8FA]"}`}
                  >
                    <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{item.workType}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{item.workDate}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{item.workTime}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.productCode}</td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">{item.productName}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{item.qty.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{item.uom}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.warehouseCode}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{item.warehouseName}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.location}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.ownerCode}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{item.ownerName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {MOCK_ASSEMBLY_LIST.length} of {MOCK_ASSEMBLY_LIST.length}</p>
        </div>
      </div>

      {/* Bottom grid: 임가공상세내역 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">임가공상세내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <SortableHeader field="partCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>부분품</SortableHeader>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]"></th>
                <SortableHeader field="qty" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">수량</SortableHeader>
                <SortableHeader field="uom" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>UOM</SortableHeader>
                <SortableHeader field="location" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>로케이션</SortableHeader>
                <SortableHeader field="warehouseCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>창고</SortableHeader>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]"></th>
              </tr>
              <tr className="border-b border-[#E5E8EB] bg-[#F7F8FA]">
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">상품명</th>
                <th></th>
                <th></th>
                <th></th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                <th className="px-3 py-1 text-xs text-[#8B95A1]">창고명</th>
              </tr>
            </thead>
            <tbody>
              {!selectedId ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-[#8B95A1]">상위 목록에서 임가공 내역을 선택해주세요.</td></tr>
              ) : detailItems.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-[#8B95A1]">상세 부분품 정보가 없습니다.</td></tr>
              ) : (
                detailItems.map((d) => (
                  <tr key={d.id} className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                    <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{d.partCode}</td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">{d.partName}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{d.qty.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{d.uom}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{d.location}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{d.warehouseCode}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{d.warehouseName}</td>
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

      {/* Assembly Form Modal */}
      <AssemblyFormModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingItem(null); }}
        onSuccess={() => {
          setShowFormModal(false);
          setEditingItem(null);
          addToast({ type: "success", message: "저장이 완료되었습니다." });
        }}
        editData={editingItem}
      />
    </div>
  );
}
