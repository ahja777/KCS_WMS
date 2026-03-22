"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToastStore } from "@/stores/toast.store";

interface MovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

/* ---------- mock data ---------- */
interface StockItem {
  id: string;
  status: string;
  workTime: string;
  locationFrom: string;
  locationTo: string;
  productGroup: string;
  productCode: string;
  productName: string;
  qty: number;
  uom: string;
}

const MOCK_STOCK_LIST: StockItem[] = [
  { id: "1", status: "완료", workTime: "09:30", locationFrom: "A-01-01", locationTo: "B-02-01", productGroup: "식품", productCode: "ITM-001", productName: "상품A", qty: 100, uom: "EA" },
  { id: "2", status: "완료", workTime: "10:15", locationFrom: "A-01-02", locationTo: "B-02-02", productGroup: "음료", productCode: "ITM-002", productName: "상품B", qty: 200, uom: "BOX" },
  { id: "3", status: "진행", workTime: "11:00", locationFrom: "A-02-01", locationTo: "C-01-01", productGroup: "식품", productCode: "ITM-003", productName: "상품C", qty: 50, uom: "EA" },
  { id: "4", status: "완료", workTime: "11:45", locationFrom: "A-02-02", locationTo: "C-01-02", productGroup: "전자", productCode: "ITM-004", productName: "상품D", qty: 80, uom: "PCS" },
  { id: "5", status: "완료", workTime: "13:00", locationFrom: "B-01-01", locationTo: "C-02-01", productGroup: "식품", productCode: "ITM-005", productName: "상품E", qty: 300, uom: "EA" },
  { id: "6", status: "진행", workTime: "13:30", locationFrom: "B-01-02", locationTo: "D-01-01", productGroup: "음료", productCode: "ITM-006", productName: "상품F", qty: 150, uom: "BOX" },
  { id: "7", status: "완료", workTime: "14:00", locationFrom: "B-02-01", locationTo: "D-01-02", productGroup: "전자", productCode: "ITM-007", productName: "상품G", qty: 60, uom: "PCS" },
  { id: "8", status: "완료", workTime: "14:30", locationFrom: "C-01-01", locationTo: "D-02-01", productGroup: "식품", productCode: "ITM-008", productName: "상품H", qty: 120, uom: "EA" },
];

const TOTAL_ITEMS = 160;

export default function MovementFormModal({ isOpen, onClose }: MovementFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const itemsPerPage = 40;
  const totalPages = Math.ceil(TOTAL_ITEMS / itemsPerPage);

  const handleReset = () => {
    setPage(1);
  };

  const handleSave = () => {
    addToast({ type: "success", message: "재고이동이 저장되었습니다." });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="재고이동등록" size="xl" className="!max-w-5xl">
      <div className="space-y-5">
        {/* Search area */}
        <div className="rounded-xl bg-[#F7F8FA] p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* 화주 */}
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
              <div className="flex gap-1">
                <input type="text" placeholder="코드" className={inputBase + " !bg-white max-w-[100px]"} />
                <button className="rounded-lg bg-white p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" placeholder="화주명" className={inputBase + " !bg-white max-w-[100px]"} />
              </div>
            </div>
            {/* 창고 */}
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
              <div className="flex gap-1">
                <input type="text" placeholder="코드" className={inputBase + " !bg-white max-w-[100px]"} />
                <button className="rounded-lg bg-white p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" placeholder="창고명" className={inputBase + " !bg-white max-w-[100px]"} />
              </div>
            </div>
            {/* 상품 */}
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상품</label>
              <div className="flex gap-1">
                <input type="text" placeholder="코드" className={inputBase + " !bg-white max-w-[100px]"} />
                <button className="rounded-lg bg-white p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-4 w-4" /></button>
                <input type="text" placeholder="상품명" className={inputBase + " !bg-white max-w-[100px]"} />
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
          <Button size="sm" onClick={handleSave}>저장</Button>
          <Button variant="secondary" size="sm" onClick={onClose}>닫기</Button>
        </div>

        {/* Grid: 재고목록 */}
        <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">재고목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상태</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업시간</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">로케이션 FROM</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-[#8B95A1]"></th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">TO</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품군</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품(코드)</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품명</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">수량</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_STOCK_LIST.length === 0 ? (
                  <tr><td colSpan={11} className="py-16 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
                ) : (
                  MOCK_STOCK_LIST.map((item) => (
                    <tr key={item.id} className="cursor-pointer border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                      <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></td>
                      <td className="px-3 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "완료" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{item.workTime}</td>
                      <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.locationFrom}</td>
                      <td className="px-3 py-3 text-center text-sm text-[#8B95A1]">→</td>
                      <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">
                        {item.locationTo}
                        <button className="ml-1 rounded bg-[#F2F4F6] p-0.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-3 w-3" /></button>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">
                        {item.productGroup}
                        <button className="ml-1 rounded bg-[#F2F4F6] p-0.5 text-[#4E5968] hover:bg-[#E5E8EB]"><Search className="h-3 w-3" /></button>
                      </td>
                      <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{item.productCode}</td>
                      <td className="px-3 py-3 text-sm text-[#191F28]">{item.productName}</td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">{item.qty.toLocaleString()}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{item.uom}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-xs text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-sm text-[#8B95A1]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-xs text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                다음
              </button>
            </div>
            <p className="text-sm text-[#8B95A1]">
              View {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, TOTAL_ITEMS)} of {TOTAL_ITEMS}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
