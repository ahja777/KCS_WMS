"use client";

import { useState } from "react";
import { Search, RotateCcw, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import { useToastStore } from "@/stores/toast.store";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

// Mock data matching slide 37
const mockData = [
  {
    id: "1",
    workNumber: "18401",
    status: "완료",
    workDate: "2015-06-23",
    assignor: "ASP_신영물류",
    assignorProduct: "연필5",
    assignorQty: 1,
    assignorUOM: "EA",
    assignee: "ULN",
    assigneeProduct: "테스트",
    assigneeQty: 1,
    assigneeUOM: "팔레트",
  },
  {
    id: "2",
    workNumber: "18343",
    status: "미완료",
    workDate: "2015-06-22",
    assignor: "ULN",
    assignorProduct: "테스트",
    assignorQty: 3,
    assignorUOM: "팔레트",
    assignee: "ASP_신영물류",
    assigneeProduct: "TEST",
    assigneeQty: 3,
    assigneeUOM: "EA",
  },
  {
    id: "3",
    workNumber: "01363",
    status: "완료",
    workDate: "2010-07-21",
    assignor: "한텍",
    assignorProduct: "COMPUTER BRK'T",
    assignorQty: 4,
    assignorUOM: "EA",
    assignee: "한텍인터내셔날",
    assigneeProduct: "COMPUTER BRK'T P0",
    assigneeQty: 4,
    assigneeUOM: "EA",
  },
];

export default function OwnershipTransferPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [searchPartner, setSearchPartner] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">명의변경</h1>
        <p className="text-sm text-[#8B95A1]">재고관리 &gt; 명의변경</p>
      </div>

      <InventoryTabNav />

      {/* Search area */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[250px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={searchPartner}
                onChange={(e) => setSearchPartner(e.target.value)}
                className={inputBase + " max-w-[150px]"}
              />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
              <input type="text" className={inputBase + " max-w-[150px]"} />
            </div>
          </div>
          <button className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
            <Search className="h-4 w-4" />
            검색
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => addToast({ type: "info", message: "신규 등록 화면" })}>신규</Button>
        <Button size="sm" variant="secondary" onClick={() => addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." })}>삭제</Button>
        <Button size="sm" variant="outline" className="!bg-[#22C55E] !text-white !border-[#22C55E]">엑셀</Button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">명의변경내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                </th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업번호</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">완료</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업일</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">양도자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">수량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">양수자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">수량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">UOM</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((row, idx) => (
                <tr key={row.id} className="cursor-pointer border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]">
                  <td className="px-3 py-3 text-center">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-[#191F28]">{row.workNumber}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.status}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.workDate}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.assignor}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.assignorProduct}</td>
                  <td className="px-3 py-3 text-right text-sm text-[#4E5968]">{row.assignorQty}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.assignorUOM}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.assignee}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.assigneeProduct}</td>
                  <td className="px-3 py-3 text-right text-sm text-[#4E5968]">{row.assigneeQty}</td>
                  <td className="px-3 py-3 text-sm text-[#4E5968]">{row.assigneeUOM}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page 1 of 1</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {mockData.length} of {mockData.length}</p>
        </div>
      </div>
    </div>
  );
}
