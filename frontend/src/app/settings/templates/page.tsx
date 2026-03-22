"use client";

import { useState, useMemo } from "react";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import { Search, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToastStore } from "@/stores/toast.store";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

interface TemplateRow {
  id: number;
  colOrder: number;
  templateId: string;
  seq: number;
  fieldName: string;
  fieldCode: string;
  required: string;
  defaultValue: string;
  size: number;
  isUsed: string;
  viewOrder: number;
  dataType: string;
  displayFormat: string;
}

const mockData: TemplateRow[] = [
  { id: 1, colOrder: 1, templateId: "INB001", seq: 1, fieldName: "원주문번호", fieldCode: "ORG_ORDER_NO", required: "Y", defaultValue: "", size: 20, isUsed: "Y", viewOrder: 1, dataType: "VARCHAR", displayFormat: "" },
  { id: 2, colOrder: 2, templateId: "INB001", seq: 2, fieldName: "순번", fieldCode: "SEQ_NO", required: "N", defaultValue: "1", size: 5, isUsed: "Y", viewOrder: 2, dataType: "NUMBER", displayFormat: "" },
  { id: 3, colOrder: 3, templateId: "INB001", seq: 3, fieldName: "의뢰일", fieldCode: "REQUEST_DATE", required: "Y", defaultValue: "", size: 10, isUsed: "Y", viewOrder: 3, dataType: "DATE", displayFormat: "YYYY-MM-DD" },
  { id: 4, colOrder: 4, templateId: "INB001", seq: 4, fieldName: "화주코드", fieldCode: "PARTNER_CD", required: "Y", defaultValue: "", size: 10, isUsed: "Y", viewOrder: 4, dataType: "VARCHAR", displayFormat: "" },
  { id: 5, colOrder: 5, templateId: "INB001", seq: 5, fieldName: "창고코드", fieldCode: "WH_CD", required: "N", defaultValue: "", size: 10, isUsed: "Y", viewOrder: 5, dataType: "VARCHAR", displayFormat: "" },
  { id: 6, colOrder: 6, templateId: "INB001", seq: 6, fieldName: "상품코드", fieldCode: "ITEM_CD", required: "Y", defaultValue: "", size: 20, isUsed: "Y", viewOrder: 6, dataType: "VARCHAR", displayFormat: "" },
  { id: 7, colOrder: 7, templateId: "INB001", seq: 7, fieldName: "수량", fieldCode: "QTY", required: "Y", defaultValue: "0", size: 10, isUsed: "Y", viewOrder: 7, dataType: "NUMBER", displayFormat: "#,###" },
  { id: 8, colOrder: 8, templateId: "INB001", seq: 8, fieldName: "UOM", fieldCode: "UOM", required: "N", defaultValue: "EA", size: 5, isUsed: "Y", viewOrder: 8, dataType: "VARCHAR", displayFormat: "" },
  { id: 9, colOrder: 9, templateId: "INB001", seq: 9, fieldName: "단가", fieldCode: "UNIT_PRICE", required: "N", defaultValue: "0", size: 12, isUsed: "N", viewOrder: 9, dataType: "NUMBER", displayFormat: "#,###.##" },
  { id: 10, colOrder: 10, templateId: "INB001", seq: 10, fieldName: "배송처코드", fieldCode: "DELIVERY_CD", required: "N", defaultValue: "", size: 10, isUsed: "Y", viewOrder: 10, dataType: "VARCHAR", displayFormat: "" },
  { id: 11, colOrder: 11, templateId: "INB001", seq: 11, fieldName: "배송처주소", fieldCode: "DELIVERY_ADDR", required: "N", defaultValue: "", size: 100, isUsed: "Y", viewOrder: 11, dataType: "VARCHAR", displayFormat: "" },
  { id: 12, colOrder: 12, templateId: "INB001", seq: 12, fieldName: "비고", fieldCode: "REMARK", required: "N", defaultValue: "", size: 200, isUsed: "N", viewOrder: 12, dataType: "VARCHAR", displayFormat: "" },
];

export default function TemplatesPage() {
  const addToast = useToastStore((s) => s.addToast);

  const [partnerCode, setPartnerCode] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [templateType, setTemplateType] = useState("입고");
  const [data, setData] = useState<TemplateRow[]>(mockData);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TemplateRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(data.length / perPage));
  const pagedData = data.slice((page - 1) * perPage, page * perPage);
  const { sortedData: sortedPagedData, sortKey, sortDir, handleSort } = useTableSort(pagedData);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    setData((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    addToast({ type: "success", message: `${selectedIds.size}건이 삭제되었습니다.` });
  };

  const handleReset = () => {
    setPartnerCode("");
    setPartnerName("");
    setTemplateType("입고");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">템플릿관리</h1>
        <p className="text-sm text-[#8B95A1]">시스템관리 &gt; 템플릿관리</p>
      </div>

      {/* Search area */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
            <div className="flex gap-1">
              <input type="text" value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} className={inputBase + " max-w-[120px]"} placeholder="코드" />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
              <input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className={inputBase + " max-w-[120px]"} placeholder="화주명" />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">타입</label>
            <select value={templateType} onChange={(e) => setTemplateType(e.target.value)} className={selectBase}>
              <option value="입고">입고</option>
              <option value="출고">출고</option>
            </select>
          </div>
          <button onClick={handleReset} className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]">
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
        <Button variant="danger" size="sm" onClick={() => addToast({ type: "info", message: "저장되었습니다." })}>저장</Button>
        <Button size="sm" onClick={() => { setEditingRow(null); setIsFormOpen(true); }}>신규</Button>
        <Button variant="secondary" size="sm" onClick={handleDelete}>삭제</Button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">템플릿목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" /></th>
                <SortableHeader field="colOrder" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>컬럼순서</SortableHeader>
                <SortableHeader field="templateId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>ID</SortableHeader>
                <SortableHeader field="seq" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>SEQ</SortableHeader>
                <SortableHeader field="fieldName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>항목명</SortableHeader>
                <SortableHeader field="fieldCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>항목코드</SortableHeader>
                <SortableHeader field="required" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>필수여부</SortableHeader>
                <SortableHeader field="defaultValue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>기본값</SortableHeader>
                <SortableHeader field="size" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>사이즈</SortableHeader>
                <SortableHeader field="isUsed" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>사용여부</SortableHeader>
                <SortableHeader field="viewOrder" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>보기순번</SortableHeader>
                <SortableHeader field="dataType" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>데이터타입</SortableHeader>
                <SortableHeader field="displayFormat" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>표시형식</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr><td colSpan={13} className="py-16 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
              ) : (
                sortedPagedData.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => { setEditingRow(row); setIsFormOpen(true); }}
                    className="cursor-pointer border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]"
                  >
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.colOrder}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{row.templateId}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.seq}</td>
                    <td className="px-3 py-3 text-sm font-medium text-[#191F28]">{row.fieldName}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{row.fieldCode}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${row.required === "Y" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
                        {row.required}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.defaultValue}</td>
                    <td className="px-3 py-3 text-sm text-right text-[#4E5968]">{row.size}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${row.isUsed === "Y" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"}`}>
                        {row.isUsed}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.viewOrder}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.dataType}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.displayFormat}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">Page {page} of {totalPages}</p>
          <p className="text-sm text-[#8B95A1]">View 1 - {pagedData.length} of {data.length}</p>
        </div>
      </div>

      {/* Form Modal */}
      <TemplateFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        row={editingRow}
        onSave={(row) => {
          if (editingRow) {
            setData((prev) => prev.map((r) => (r.id === row.id ? row : r)));
            addToast({ type: "success", message: "수정되었습니다." });
          } else {
            setData((prev) => [...prev, { ...row, id: Math.max(0, ...prev.map((r) => r.id)) + 1 }]);
            addToast({ type: "success", message: "등록되었습니다." });
          }
          setIsFormOpen(false);
        }}
      />
    </div>
  );
}

function TemplateFormModal({ isOpen, onClose, row, onSave }: { isOpen: boolean; onClose: () => void; row: TemplateRow | null; onSave: (row: TemplateRow) => void }) {
  const isEdit = !!row;
  const [form, setForm] = useState<TemplateRow>(row ?? {
    id: 0, colOrder: 0, templateId: "", seq: 0, fieldName: "", fieldCode: "",
    required: "N", defaultValue: "", size: 10, isUsed: "Y", viewOrder: 0, dataType: "VARCHAR", displayFormat: "",
  });

  useState(() => {
    if (row) setForm(row);
    else setForm({ id: 0, colOrder: 0, templateId: "", seq: 0, fieldName: "", fieldCode: "", required: "N", defaultValue: "", size: 10, isUsed: "Y", viewOrder: 0, dataType: "VARCHAR", displayFormat: "" });
  });

  const update = (key: keyof TemplateRow, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "템플릿 항목 수정" : "템플릿 항목 등록"} size="md">
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">항목명 <span className="text-red-500">*</span></label>
            <input value={form.fieldName} onChange={(e) => update("fieldName", e.target.value)} className={inputBase} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">항목코드 <span className="text-red-500">*</span></label>
            <input value={form.fieldCode} onChange={(e) => update("fieldCode", e.target.value)} className={inputBase} required />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">필수여부</label>
            <select value={form.required} onChange={(e) => update("required", e.target.value)} className={selectBase + " w-full"}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">사용여부</label>
            <select value={form.isUsed} onChange={(e) => update("isUsed", e.target.value)} className={selectBase + " w-full"}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">데이터타입</label>
            <select value={form.dataType} onChange={(e) => update("dataType", e.target.value)} className={selectBase + " w-full"}>
              <option value="VARCHAR">VARCHAR</option>
              <option value="NUMBER">NUMBER</option>
              <option value="DATE">DATE</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">사이즈</label>
            <input type="number" value={form.size} onChange={(e) => update("size", parseInt(e.target.value) || 0)} className={inputBase} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">기본값</label>
            <input value={form.defaultValue} onChange={(e) => update("defaultValue", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">표시형식</label>
            <input value={form.displayFormat} onChange={(e) => update("displayFormat", e.target.value)} className={inputBase} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">취소</button>
          <button type="submit" className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">{isEdit ? "수정" : "등록"}</button>
        </div>
      </form>
    </Modal>
  );
}
