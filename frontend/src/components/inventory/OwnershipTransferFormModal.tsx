"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToastStore } from "@/stores/toast.store";

interface OwnershipTransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface InventoryRow {
  id: number;
  locationCode: string;
  itemCode: string;
  itemName: string;
  originalQty: number;
  workQty: number;
  uom: string;
  subLot: string;
  stockId: string;
}

const inputClass =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectClass =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const mockInventoryData: InventoryRow[] = [
  {
    id: 1,
    locationCode: "A-01-01",
    itemCode: "ITEM-001",
    itemName: "전자부품 A",
    originalQty: 500,
    workQty: 100,
    uom: "EA",
    subLot: "SL-001",
    stockId: "STK-20260301-001",
  },
  {
    id: 2,
    locationCode: "A-01-02",
    itemCode: "ITEM-002",
    itemName: "전자부품 B",
    originalQty: 300,
    workQty: 50,
    uom: "EA",
    subLot: "SL-002",
    stockId: "STK-20260301-002",
  },
  {
    id: 3,
    locationCode: "B-02-01",
    itemCode: "ITEM-003",
    itemName: "포장재 C",
    originalQty: 1000,
    workQty: 200,
    uom: "BOX",
    subLot: "SL-003",
    stockId: "STK-20260302-001",
  },
  {
    id: 4,
    locationCode: "B-02-03",
    itemCode: "ITEM-004",
    itemName: "원자재 D",
    originalQty: 150,
    workQty: 30,
    uom: "KG",
    subLot: "SL-004",
    stockId: "STK-20260302-002",
  },
  {
    id: 5,
    locationCode: "C-03-01",
    itemCode: "ITEM-005",
    itemName: "부자재 E",
    originalQty: 800,
    workQty: 150,
    uom: "EA",
    subLot: "SL-005",
    stockId: "STK-20260303-001",
  },
];

export default function OwnershipTransferFormModal({
  isOpen,
  onClose,
  onSuccess,
}: OwnershipTransferFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);

  const [workDate, setWorkDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [workStatus, setWorkStatus] = useState("미완료");
  const [transferCondition] = useState("양도조건");
  const [transferOwner, setTransferOwner] = useState("");
  const [receivingOwner, setReceivingOwner] = useState("");
  const [storageFee, setStorageFee] = useState("버림");
  const [transferItem, setTransferItem] = useState("");
  const [receivingItem, setReceivingItem] = useState("");
  const [inboundFee, setInboundFee] = useState("버림");
  const [transferQty, setTransferQty] = useState("");
  const [receivingQty, setReceivingQty] = useState("");
  const [outboundFee, setOutboundFee] = useState("버림");
  const [transferUom, setTransferUom] = useState("");
  const [receivingUom, setReceivingUom] = useState("");

  const [currentPage] = useState(0);
  const [totalPages] = useState(0);
  const [pageSize] = useState(40);

  const handleSave = () => {
    if (!transferOwner || !receivingOwner) {
      addToast({ type: "warning", message: "양도화주와 양수화주를 입력해주세요." });
      return;
    }
    addToast({ type: "success", message: "명의변경이 저장되었습니다." });
    onSuccess?.();
  };

  const handleNew = () => {
    setWorkDate(new Date().toISOString().slice(0, 10));
    setWorkStatus("미완료");
    setTransferOwner("");
    setReceivingOwner("");
    setStorageFee("버림");
    setTransferItem("");
    setReceivingItem("");
    setInboundFee("버림");
    setTransferQty("");
    setReceivingQty("");
    setOutboundFee("버림");
    setTransferUom("");
    setReceivingUom("");
    addToast({ type: "info", message: "신규 입력 모드입니다." });
  };

  const handleDelete = () => {
    addToast({ type: "success", message: "삭제되었습니다." });
  };

  const SearchButton = () => (
    <button
      type="button"
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-[#F2F4F6] hover:text-[#4E5968]"
    >
      <Search className="h-4 w-4" />
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="max-w-6xl">
      {/* Custom Header */}
      <div className="flex items-center justify-between px-7 pt-5 -mt-7 -mx-7 mb-4">
        <h2 className="text-xl font-bold text-[#191F28]">명의변경등록</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-[#3182F6] hover:text-[#1B64DA] transition-colors"
        >
          명의변경 &gt;
        </button>
      </div>

      {/* Form Section */}
      <div className="space-y-3">
        {/* Row 1: 작업일, 작업상태, 양도조건 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              작업일
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              작업상태
            </label>
            <select
              value={workStatus}
              onChange={(e) => setWorkStatus(e.target.value)}
              className={`w-full ${selectClass}`}
            >
              <option value="미완료">미완료</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              양도조건
            </label>
            <button
              type="button"
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-left text-sm text-[#3182F6] font-medium outline-none transition-all hover:bg-[#F2F4F6]"
            >
              {transferCondition}
            </button>
          </div>
        </div>

        {/* Row 2: 양도화주, 양수화주, 보관료 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              양도화주
            </label>
            <div className="relative">
              <input
                value={transferOwner}
                onChange={(e) => setTransferOwner(e.target.value)}
                placeholder="양도화주 검색"
                className={inputClass}
              />
              <SearchButton />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              양수화주
            </label>
            <div className="relative">
              <input
                value={receivingOwner}
                onChange={(e) => setReceivingOwner(e.target.value)}
                placeholder="양수화주 검색"
                className={inputClass}
              />
              <SearchButton />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              보관료
            </label>
            <select
              value={storageFee}
              onChange={(e) => setStorageFee(e.target.value)}
              className={`w-full ${selectClass}`}
            >
              <option value="버림">버림</option>
              <option value="양도">양도</option>
              <option value="양수">양수</option>
            </select>
          </div>
        </div>

        {/* Row 3: 양도상품, 양수상품, 입고료 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              양도상품
            </label>
            <div className="relative">
              <input
                value={transferItem}
                onChange={(e) => setTransferItem(e.target.value)}
                placeholder="양도상품 검색"
                className={inputClass}
              />
              <SearchButton />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              양수상품
            </label>
            <div className="relative">
              <input
                value={receivingItem}
                onChange={(e) => setReceivingItem(e.target.value)}
                placeholder="양수상품 검색"
                className={inputClass}
              />
              <SearchButton />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              입고료
            </label>
            <select
              value={inboundFee}
              onChange={(e) => setInboundFee(e.target.value)}
              className={`w-full ${selectClass}`}
            >
              <option value="버림">버림</option>
              <option value="양도">양도</option>
              <option value="양수">양수</option>
            </select>
          </div>
        </div>

        {/* Row 4: 양도수량, 양수수량, 출고료 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              양도수량
            </label>
            <input
              type="number"
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              placeholder="양도수량 입력"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              양수수량
            </label>
            <input
              type="number"
              value={receivingQty}
              onChange={(e) => setReceivingQty(e.target.value)}
              placeholder="양수수량 입력"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              출고료
            </label>
            <select
              value={outboundFee}
              onChange={(e) => setOutboundFee(e.target.value)}
              className={`w-full ${selectClass}`}
            >
              <option value="버림">버림</option>
              <option value="양도">양도</option>
              <option value="양수">양수</option>
            </select>
          </div>
        </div>

        {/* Row 5: UOM, UOM */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              UOM
            </label>
            <div className="relative">
              <input
                value={transferUom}
                onChange={(e) => setTransferUom(e.target.value)}
                placeholder="UOM 검색"
                className={inputClass}
              />
              <SearchButton />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              UOM
            </label>
            <div className="relative">
              <input
                value={receivingUom}
                onChange={(e) => setReceivingUom(e.target.value)}
                placeholder="UOM 검색"
                className={inputClass}
              />
              <SearchButton />
            </div>
          </div>
          <div />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="danger" onClick={handleSave}>
          저장
        </Button>
        <Button variant="secondary" onClick={handleNew}>
          <RotateCcw className="h-4 w-4" />
          신규
        </Button>
        <Button variant="outline" onClick={handleDelete}>
          삭제
        </Button>
        <Button variant="ghost" onClick={onClose}>
          닫기
        </Button>
      </div>

      {/* Bottom Grid - 재고목록 */}
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-bold text-[#191F28]">재고목록</h3>
        <div className="overflow-x-auto rounded-xl border border-[#E5E8EB]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#4A5568] text-white">
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                  로케이션(코드)
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                  상품(코드)
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                  상품명
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                  원재고
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                  작업수량
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                  UOM
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                  SUB_LOT
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                  STOCK_ID
                </th>
              </tr>
            </thead>
            <tbody>
              {mockInventoryData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-sm text-[#B0B8C1]"
                  >
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                mockInventoryData.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-t border-[#E5E8EB] transition-colors hover:bg-[#F7F8FA] ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"
                    }`}
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#333D4B]">
                      {row.locationCode}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#333D4B]">
                      {row.itemCode}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#333D4B]">
                      {row.itemName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[#333D4B]">
                      {row.originalQty.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[#333D4B]">
                      {row.workQty.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#333D4B]">
                      {row.uom}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#333D4B]">
                      {row.subLot}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#333D4B]">
                      {row.stockId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-2 flex items-center justify-between text-xs text-[#8B95A1]">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <span>| {pageSize}</span>
        </div>
      </div>
    </Modal>
  );
}
