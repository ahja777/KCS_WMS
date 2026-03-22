"use client";

import { useState, useMemo } from "react";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import { Search, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToastStore } from "@/stores/toast.store";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

interface I18nRow {
  id: number;
  keyValue: string;
  korean: string;
  japanese: string;
  chinese: string;
  english: string;
}

const mockData: I18nRow[] = [
  { id: 1, keyValue: "AS재고", korean: "AS재고", japanese: "[일]AS재고", chinese: "[중]AS재고", english: "[영]AS재고" },
  { id: 2, keyValue: "B/L번호", korean: "B/L번호", japanese: "[일]B/L번호", chinese: "[중]B/L번호", english: "[영]B/L번호" },
  { id: 3, keyValue: "BL번호", korean: "BL번호", japanese: "[일]BL번호", chinese: "[중]BL번호", english: "[영]BL번호" },
  { id: 4, keyValue: "LOC구분", korean: "LOC구분", japanese: "[일]LOC구분", chinese: "[중]LOC구분", english: "[영]LOC구분" },
  { id: 5, keyValue: "LOC별입고상품등록", korean: "LOC별입고상품등록", japanese: "[일]LOC별입고상품등록", chinese: "[중]LOC별입고상품등록", english: "[영]LOC별입고상품등록" },
  { id: 6, keyValue: "LOC별입고상품목록", korean: "LOC별입고상품목록", japanese: "[일]LOC별입고상품목록", chinese: "[중]LOC별입고상품목록", english: "[영]LOC별입고상품목록" },
  { id: 7, keyValue: "LOC통제내역입력", korean: "LOC통제내역입력", japanese: "[일]LOC통제내역입력", chinese: "[중]LOC통제내역입력", english: "[영]LOC통제내역입력" },
  { id: 8, keyValue: "LOT번호", korean: "LOT번호", japanese: "[일]LOT번호", chinese: "[중]LOT번호", english: "[영]LOT번호" },
  { id: 9, keyValue: "LOT별재고목록", korean: "LOT별재고목록", japanese: "[일]LOT별재고목록", chinese: "[중]LOT별재고목록", english: "[영]LOT별재고목록" },
  { id: 10, keyValue: "LOT별재고현황", korean: "LOT별재고현황", japanese: "[일]LOT별재고현황", chinese: "[중]LOT별재고현황", english: "[영]LOT별재고현황" },
  { id: 11, keyValue: "Loc지시여부", korean: "Loc지시여부", japanese: "[일]Loc지시여부", chinese: "[중]Loc지시여부", english: "[영]Loc지시여부" },
  { id: 12, keyValue: "OP수량", korean: "OP수량", japanese: "[일]OP수량", chinese: "[중]OP수량", english: "[영]OP수량" },
  { id: 13, keyValue: "PDA작업상태", korean: "PDA작업상태", japanese: "[일]PDA작업상태", chinese: "[중]PDA작업상태", english: "[영]PDA작업상태" },
  { id: 14, keyValue: "SEQ", korean: "SEQ", japanese: "[일]SEQ", chinese: "[중]SEQ", english: "[영]SEQ" },
  { id: 15, keyValue: "UOM", korean: "UOM", japanese: "[일]UOM", chinese: "[중]UOM", english: "[영]UOM" },
  { id: 16, keyValue: "가용물류기기", korean: "가용물류기기", japanese: "[일]가용물류기기", chinese: "[중]가용물류기기", english: "[영]가용물류기기" },
  { id: 17, keyValue: "거래명세서발행", korean: "거래명세서발행", japanese: "[일]거래명세서발행", chinese: "[중]거래명세서발행", english: "[영]거래명세서발행" },
  { id: 18, keyValue: "거래처", korean: "거래처", japanese: "[일]거래처", chinese: "[중]거래처", english: "[영]거래처" },
  { id: 19, keyValue: "검색", korean: "검색", japanese: "[일]검색", chinese: "[중]검색", english: "[영]검색" },
  { id: 20, keyValue: "공지사항", korean: "공지사항", japanese: "[일]공지사항", chinese: "[중]공지사항", english: "[영]공지사항" },
  { id: 21, keyValue: "권한관리", korean: "권한관리", japanese: "[일]권한관리", chinese: "[중]권한관리", english: "[영]권한관리" },
  { id: 22, keyValue: "기준관리", korean: "기준관리", japanese: "[일]기준관리", chinese: "[중]기준관리", english: "[영]기준관리" },
  { id: 23, keyValue: "단가", korean: "단가", japanese: "[일]단가", chinese: "[중]단가", english: "[영]단가" },
  { id: 24, keyValue: "등록일", korean: "등록일", japanese: "[일]등록일", chinese: "[중]등록일", english: "[영]등록일" },
  { id: 25, keyValue: "로케이션", korean: "로케이션", japanese: "[일]로케이션", chinese: "[중]로케이션", english: "[영]로케이션" },
];

export default function MultilingualPage() {
  const addToast = useToastStore((s) => s.addToast);

  const [searchKey, setSearchKey] = useState("");
  const [searchWord, setSearchWord] = useState("");
  const [data, setData] = useState<I18nRow[]>(mockData);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<I18nRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const perPage = 20;

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchKey) result = result.filter((r) => r.keyValue.toLowerCase().includes(searchKey.toLowerCase()));
    if (searchWord) result = result.filter((r) =>
      r.korean.toLowerCase().includes(searchWord.toLowerCase()) ||
      r.japanese.toLowerCase().includes(searchWord.toLowerCase()) ||
      r.chinese.toLowerCase().includes(searchWord.toLowerCase()) ||
      r.english.toLowerCase().includes(searchWord.toLowerCase())
    );
    return result;
  }, [data, searchKey, searchWord]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const pagedData = filteredData.slice((page - 1) * perPage, page * perPage);
  const { sortedData: sortedPagedData, sortKey, sortDir, handleSort } = useTableSort(pagedData);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pagedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedData.map((r) => r.id)));
    }
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

  const handleRowClick = (row: I18nRow) => {
    setEditingRow(row);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingRow(null);
    setIsFormOpen(true);
  };

  const handleFormSave = (row: I18nRow) => {
    if (editingRow) {
      setData((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      addToast({ type: "success", message: "수정되었습니다." });
    } else {
      setData((prev) => [...prev, { ...row, id: Math.max(...prev.map((r) => r.id)) + 1 }]);
      addToast({ type: "success", message: "등록되었습니다." });
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">다국어관리</h1>
        <p className="text-sm text-[#8B95A1]">시스템관리 &gt; 다국어관리</p>
      </div>

      {/* Search area */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">키값</label>
            <input type="text" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} className={inputBase} placeholder="키값" />
          </div>
          <div className="min-w-[240px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">단어</label>
            <input type="text" value={searchWord} onChange={(e) => setSearchWord(e.target.value)} className={inputBase} placeholder="단어" />
          </div>
          <button onClick={() => setPage(1)} className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
            <Search className="h-4 w-4" />
            검색
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="danger" size="sm" onClick={() => addToast({ type: "info", message: "저장되었습니다." })}>저장</Button>
        <Button size="sm" onClick={handleCreate}>신규</Button>
        <Button variant="secondary" size="sm" onClick={handleDelete}>삭제</Button>
        <Button size="sm" variant="outline" className="!bg-[#22C55E] !text-white !border-[#22C55E]" onClick={() => addToast({ type: "info", message: "엑셀 다운로드" })}>엑셀</Button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">다국어 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" checked={selectedIds.size === pagedData.length && pagedData.length > 0} onChange={toggleAll} />
                </th>
                <SortableHeader field="keyValue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>*키값</SortableHeader>
                <SortableHeader field="korean" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>한국어</SortableHeader>
                <SortableHeader field="japanese" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>일본어</SortableHeader>
                <SortableHeader field="chinese" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>중국어</SortableHeader>
                <SortableHeader field="english" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>영어</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-[#8B95A1]">데이터가 없습니다.</td></tr>
              ) : (
                sortedPagedData.map((row) => (
                  <tr key={row.id} onClick={() => handleRowClick(row)} className="cursor-pointer border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]">
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-[#191F28]">{row.keyValue}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.korean}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.japanese}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.chinese}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{row.english}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(1)} disabled={page === 1} className="rounded px-2 py-1 text-xs text-[#8B95A1] hover:bg-[#F2F4F6] disabled:opacity-50">|&lt;</button>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded px-2 py-1 text-xs text-[#8B95A1] hover:bg-[#F2F4F6] disabled:opacity-50">&lt;&lt;</button>
            <span className="text-sm text-[#8B95A1]">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded px-2 py-1 text-xs text-[#8B95A1] hover:bg-[#F2F4F6] disabled:opacity-50">&gt;&gt;</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="rounded px-2 py-1 text-xs text-[#8B95A1] hover:bg-[#F2F4F6] disabled:opacity-50">&gt;|</button>
          </div>
          <div className="flex items-center gap-2">
            <select className="rounded border border-[#E5E8EB] px-2 py-1 text-xs text-[#8B95A1]" defaultValue="200">
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
            <span className="text-sm text-[#8B95A1]">View {(page - 1) * perPage + 1} - {Math.min(page * perPage, filteredData.length)} of {filteredData.length}</span>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <I18nFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} row={editingRow} onSave={handleFormSave} />
    </div>
  );
}

function I18nFormModal({ isOpen, onClose, row, onSave }: { isOpen: boolean; onClose: () => void; row: I18nRow | null; onSave: (row: I18nRow) => void }) {
  const isEdit = !!row;
  const [keyValue, setKeyValue] = useState("");
  const [korean, setKorean] = useState("");
  const [japanese, setJapanese] = useState("");
  const [chinese, setChinese] = useState("");
  const [english, setEnglish] = useState("");

  useState(() => {
    if (row) {
      setKeyValue(row.keyValue);
      setKorean(row.korean);
      setJapanese(row.japanese);
      setChinese(row.chinese);
      setEnglish(row.english);
    } else {
      setKeyValue("");
      setKorean("");
      setJapanese("");
      setChinese("");
      setEnglish("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: row?.id ?? 0, keyValue, korean, japanese, chinese, english });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "다국어 수정" : "다국어 등록"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">키값 <span className="text-red-500">*</span></label>
          <input value={keyValue} onChange={(e) => setKeyValue(e.target.value)} className={inputBase} required disabled={isEdit} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">한국어</label>
          <input value={korean} onChange={(e) => setKorean(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">일본어</label>
          <input value={japanese} onChange={(e) => setJapanese(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">중국어</label>
          <input value={chinese} onChange={(e) => setChinese(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">영어</label>
          <input value={english} onChange={(e) => setEnglish(e.target.value)} className={inputBase} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">취소</button>
          <button type="submit" className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">{isEdit ? "수정" : "등록"}</button>
        </div>
      </form>
    </Modal>
  );
}
