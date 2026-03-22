"use client";

import { useState, useRef } from "react";
import { Search, Trash2, Download, Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToastStore } from "@/stores/toast.store";

interface TemplateRow {
  id: string;
  originalOrderNo: string;
  seqNo: string;
  requestDate: string;
  shipperCode: string;
  warehouseCode: string;
  itemCode: string;
  qty: number;
  uom: string;
  unitPrice: number;
  deliveryCode: string;
  deliveryAddress: string;
  deliveryName: string;
}

interface TemplateInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "inbound" | "outbound";
}

const emptyRow = (): TemplateRow => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2),
  originalOrderNo: "",
  seqNo: "",
  requestDate: "",
  shipperCode: "",
  warehouseCode: "",
  itemCode: "",
  qty: 0,
  uom: "",
  unitPrice: 0,
  deliveryCode: "",
  deliveryAddress: "",
  deliveryName: "",
});

export default function TemplateInputModal({
  isOpen,
  onClose,
  type,
}: TemplateInputModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shipperCode, setShipperCode] = useState("");
  const [shipperName, setShipperName] = useState("");
  const [dataStartRow, setDataStartRow] = useState("1");
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const title = "템플릿입력";

  const handleShipperSearch = () => {
    // TODO: Open shipper search popup
    addToast({ type: "info", message: "화주 검색 팝업은 추후 구현 예정입니다." });
  };

  const handleSave = () => {
    if (!shipperCode) {
      addToast({ type: "warning", message: "화주를 선택해주세요." });
      return;
    }
    if (rows.length === 0) {
      addToast({ type: "warning", message: "템플릿 데이터가 없습니다." });
      return;
    }
    addToast({ type: "success", message: "템플릿이 저장되었습니다." });
    handleClose();
  };

  const handleClose = () => {
    setShipperCode("");
    setShipperName("");
    setDataStartRow("1");
    setRows([]);
    setSelectedRows(new Set());
    setSelectedFile(null);
    onClose();
  };

  const handleDownloadTemplate = () => {
    // TODO: Download Excel template file
    addToast({ type: "info", message: "양식 다운로드 기능은 추후 구현 예정입니다." });
  };

  const handleDeleteRows = () => {
    if (selectedRows.size === 0) {
      addToast({ type: "warning", message: "삭제할 행을 선택해주세요." });
      return;
    }
    setRows((prev) => prev.filter((r) => !selectedRows.has(r.id)));
    setSelectedRows(new Set());
    addToast({ type: "success", message: `${selectedRows.size}개 행이 삭제되었습니다.` });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // TODO: Parse Excel file and populate rows
      addToast({ type: "info", message: `파일 "${file.name}"이 선택되었습니다.` });
    }
  };

  const handleTemplateInput = () => {
    if (!selectedFile) {
      addToast({ type: "warning", message: "파일을 먼저 선택해주세요." });
      return;
    }
    // TODO: Parse the selected file and load into grid
    // For now, add sample empty rows
    const newRows = Array.from({ length: 5 }, () => emptyRow());
    setRows((prev) => [...prev, ...newRows]);
    addToast({ type: "success", message: "템플릿 데이터가 입력되었습니다." });
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((r) => r.id)));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <div className="space-y-4">
        {/* Search area */}
        <div className="rounded-xl border border-[#E5E8EB] bg-[#F7F8FA] p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-[#4E5968]">
                화주 <span className="text-[#F04452]">*</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={shipperCode}
                  onChange={(e) => setShipperCode(e.target.value)}
                  placeholder="화주코드"
                  className="w-32 rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
                />
                <input
                  type="text"
                  value={shipperName}
                  readOnly
                  placeholder="화주명"
                  className="flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none ring-1 ring-[#E5E8EB]"
                />
                <button
                  type="button"
                  onClick={handleShipperSearch}
                  className="rounded-lg bg-white p-2 text-[#8B95A1] ring-1 ring-[#E5E8EB] transition-colors hover:bg-[#F2F4F6] hover:text-[#4E5968]"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="w-40">
              <label className="text-sm font-medium text-[#4E5968]">자료시작</label>
              <select
                value={dataStartRow}
                onChange={(e) => setDataStartRow(e.target.value)}
                className="mt-1 w-full appearance-none rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
              >
                <option value="1">1행</option>
                <option value="2">2행</option>
                <option value="3">3행</option>
                <option value="4">4행</option>
                <option value="5">5행</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleSave}>
                저장
              </Button>
              <Button type="button" variant="secondary" onClick={handleClose}>
                닫기
              </Button>
            </div>
          </div>
        </div>

        {/* Template grid */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#191F28]">템플릿목록</h3>
            <span className="text-xs text-[#8B95A1]">{rows.length}건</span>
          </div>

          <div className="max-h-80 overflow-auto rounded-xl border border-[#E5E8EB]">
            <table className="w-full min-w-[1200px]">
              <thead className="sticky top-0 bg-[#F7F8FA]">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selectedRows.size === rows.length}
                      onChange={toggleAllRows}
                      className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">원주문번호</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">순번</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">의뢰일</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">화주코드</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">창고코드</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">상품코드</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#8B95A1]">수량</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">UOM</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#8B95A1]">단가</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">배송처코드</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">배송처주소</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">배송처명</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-sm text-[#8B95A1]">
                      파일을 선택하여 템플릿 데이터를 입력해주세요.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-t border-[#F2F4F6] transition-colors ${
                        selectedRows.has(row.id) ? "bg-[#E8F3FF]/40" : "hover:bg-[#F7F8FA]"
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => toggleRowSelection(row.id)}
                          className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.originalOrderNo}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.seqNo}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.requestDate}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.shipperCode}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.warehouseCode}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.itemCode}</td>
                      <td className="px-3 py-2 text-right text-sm text-[#191F28]">{row.qty}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.uom}</td>
                      <td className="px-3 py-2 text-right text-sm text-[#191F28]">{row.unitPrice}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.deliveryCode}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.deliveryAddress}</td>
                      <td className="px-3 py-2 text-sm text-[#191F28]">{row.deliveryName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom action area */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E8EB] bg-[#F7F8FA] p-4">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-3.5 w-3.5" />
              양식다운로드
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDeleteRows}>
              <Trash2 className="h-3.5 w-3.5" />
              행삭제
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleFileSelect}>
              <Upload className="h-3.5 w-3.5" />
              파일선택
            </Button>
            <span className="text-xs text-[#8B95A1]">
              {selectedFile ? selectedFile.name : "선택된 파일 없음"}
            </span>
            <Button type="button" size="sm" onClick={handleTemplateInput}>
              템플릿입력
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
