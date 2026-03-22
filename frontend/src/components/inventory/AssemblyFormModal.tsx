"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToastStore } from "@/stores/toast.store";

interface AssemblyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

/* ---------- mock data ---------- */
interface FinishedProduct {
  id: string;
  locationAssign: string;
  setProductCode: string;
  setProductName: string;
  qty: number;
  uom: string;
  warehouseCode: string;
  warehouseName: string;
  workDate: string;
  workTime: string;
}

interface PartItem {
  id: string;
  locationAssign: string;
  partCode: string;
  partName: string;
  qty: number;
  uom: string;
  ownerCode: string;
  ownerName: string;
  warehouseCode: string;
  warehouseName: string;
}

const MOCK_FINISHED: FinishedProduct[] = [
  { id: "f1", locationAssign: "A-01-01", setProductCode: "FP-001", setProductName: "세트상품A", qty: 100, uom: "EA", warehouseCode: "WH-01", warehouseName: "본사창고", workDate: "2026-03-20", workTime: "09:30" },
  { id: "f2", locationAssign: "A-02-01", setProductCode: "FP-002", setProductName: "세트상품B", qty: 50, uom: "EA", warehouseCode: "WH-01", warehouseName: "본사창고", workDate: "2026-03-20", workTime: "10:00" },
];

const MOCK_PARTS: PartItem[] = [
  { id: "p1", locationAssign: "A-01-01", partCode: "PT-001", partName: "부분품A-1", qty: 100, uom: "EA", ownerCode: "OWN-01", ownerName: "(주)화주A", warehouseCode: "WH-01", warehouseName: "본사창고" },
  { id: "p2", locationAssign: "A-01-02", partCode: "PT-002", partName: "부분품A-2", qty: 200, uom: "EA", ownerCode: "OWN-01", ownerName: "(주)화주A", warehouseCode: "WH-01", warehouseName: "본사창고" },
  { id: "p3", locationAssign: "A-02-01", partCode: "PT-003", partName: "부분품A-3", qty: 300, uom: "EA", ownerCode: "OWN-01", ownerName: "(주)화주A", warehouseCode: "WH-01", warehouseName: "본사창고" },
];

export default function AssemblyFormModal({ isOpen, onClose }: AssemblyFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [finishedWarehouse, setFinishedWarehouse] = useState("");
  const [partsWarehouse, setPartsWarehouse] = useState("");

  const handleReset = () => {
    setDateFrom("2026-01-01");
    setDateTo(new Date().toISOString().slice(0, 10));
    setFinishedWarehouse("");
    setPartsWarehouse("");
  };

  const handleSave = () => {
    addToast({ type: "success", message: "임가공조립이 저장되었습니다." });
  };

  const handleDelete = () => {
    addToast({ type: "info", message: "선택된 항목이 삭제되었습니다." });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="임가공조립" size="xl" className="!max-w-6xl">
      <div className="space-y-5">
        {/* Search area */}
        <div className="rounded-xl bg-[#F7F8FA] p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* 작업일자 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업일자</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectBase + " !bg-white"} />
                <span className="text-sm text-[#8B95A1]">~</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectBase + " !bg-white"} />
              </div>
            </div>
            {/* 화주 */}
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
              <div className="flex gap-1">
                <input type="text" placeholder="코드" className={inputBase + " !bg-white max-w-[80px]"} />
                <button className="rounded-lg bg-white p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" placeholder="화주명" className={inputBase + " !bg-white max-w-[80px]"} />
              </div>
            </div>
            {/* 상품 */}
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
              <div className="flex gap-1">
                <input type="text" placeholder="코드" className={inputBase + " !bg-white max-w-[80px]"} />
                <button className="rounded-lg bg-white p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" placeholder="상품명" className={inputBase + " !bg-white max-w-[80px]"} />
              </div>
            </div>
            {/* 창고 */}
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
              <div className="flex gap-1">
                <input type="text" placeholder="코드" className={inputBase + " !bg-white max-w-[80px]"} />
                <button className="rounded-lg bg-white p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" placeholder="창고명" className={inputBase + " !bg-white max-w-[80px]"} />
              </div>
            </div>
            {/* UOM */}
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">UOM</label>
              <div className="flex gap-1">
                <input type="text" placeholder="코드" className={inputBase + " !bg-white max-w-[80px]"} />
                <button className="rounded-lg bg-white p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" placeholder="UOM명" className={inputBase + " !bg-white max-w-[80px]"} />
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

        {/* 완성품입고창고 section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-[#191F28]">완성품입고창고</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={finishedWarehouse}
                  onChange={(e) => setFinishedWarehouse(e.target.value)}
                  placeholder="창고 검색"
                  className={inputBase + " max-w-[200px]"}
                />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>저장</Button>
              <Button size="sm" onClick={() => addToast({ type: "info", message: "신규 등록" })}>신규</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>삭제</Button>
              <Button variant="outline" size="sm" className="!bg-[#22C55E] !text-white !border-[#22C55E]">엑셀</Button>
              <Button variant="secondary" size="sm" onClick={onClose}>닫기</Button>
            </div>
          </div>

          {/* 완성품내역 grid */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
              <h2 className="text-sm font-semibold text-white">완성품내역</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">로케이션 지정</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>세트상품</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">수량</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>창고</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업일자</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업시간</th>
                  </tr>
                  <tr className="border-b border-[#E5E8EB] bg-[#F7F8FA]">
                    <th></th>
                    <th></th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">상품명</th>
                    <th></th>
                    <th></th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">창고명</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_FINISHED.length === 0 ? (
                    <tr><td colSpan={10} className="py-10 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
                  ) : (
                    MOCK_FINISHED.map((item) => (
                      <tr key={item.id} className="cursor-pointer border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                        <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.locationAssign}</td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.setProductCode}</td>
                        <td className="px-3 py-3 text-sm text-[#191F28]">{item.setProductName}</td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{item.qty.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{item.uom}</td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.warehouseCode}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{item.warehouseName}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{item.workDate}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{item.workTime}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 부분품출고창고 section */}
        <div>
          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm font-semibold text-[#191F28]">부분품출고창고</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={partsWarehouse}
                onChange={(e) => setPartsWarehouse(e.target.value)}
                placeholder="창고 검색"
                className={inputBase + " max-w-[200px]"}
              />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
            </div>
          </div>

          {/* 부분품내역 grid */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
              <h2 className="text-sm font-semibold text-white">부분품내역</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">로케이션 지정</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>부분품</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">수량</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>화주</th>
                    <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]" colSpan={2}>창고</th>
                  </tr>
                  <tr className="border-b border-[#E5E8EB] bg-[#F7F8FA]">
                    <th></th>
                    <th></th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">상품명</th>
                    <th></th>
                    <th></th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">화주명</th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">코드</th>
                    <th className="px-3 py-1 text-xs text-[#8B95A1]">창고명</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PARTS.length === 0 ? (
                    <tr><td colSpan={10} className="py-10 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
                  ) : (
                    MOCK_PARTS.map((item) => (
                      <tr key={item.id} className="cursor-pointer border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                        <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.locationAssign}</td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.partCode}</td>
                        <td className="px-3 py-3 text-sm text-[#191F28]">{item.partName}</td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{item.qty.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{item.uom}</td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.ownerCode}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{item.ownerName}</td>
                        <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.warehouseCode}</td>
                        <td className="px-3 py-3 text-sm text-[#4E5968]">{item.warehouseName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
