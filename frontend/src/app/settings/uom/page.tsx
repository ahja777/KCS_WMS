"use client";

import { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useUoms, useCreateUom, useUpdateUom, useDeleteUom } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadExcel } from "@/lib/export";

interface UomItem {
  id: string;
  code: string;
  name: string;
  isNew?: boolean;
  isEdited?: boolean;
  [key: string]: unknown;
}

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const cellInput =
  "w-full border-0 bg-transparent px-2 py-1 text-sm text-[#191F28] outline-none focus:bg-[#F7F8FA] focus:ring-1 focus:ring-[#3182F6]/30 rounded";

export default function UomPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editedRows, setEditedRows] = useState<Map<string, { code: string; name: string }>>(new Map());
  const [newRows, setNewRows] = useState<UomItem[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useUoms({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const createMutation = useCreateUom();
  const updateMutation = useUpdateUom();
  const deleteMutation = useDeleteUom();

  const uoms = (response?.data ?? []) as UomItem[];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Combine server data with new rows for display
  const displayDataRaw = [...newRows, ...uoms];
  const { sortedData: displayData, sortKey, sortDir, handleSort } = useTableSort(displayDataRaw);

  const handleNew = () => {
    const tempId = `new-${Date.now()}`;
    setNewRows((prev) => [
      ...prev,
      { id: tempId, code: "", name: "", isNew: true },
    ]);
  };

  const handleCellEdit = (id: string, field: "code" | "name", value: string) => {
    // Check if it's a new row
    const newRowIdx = newRows.findIndex((r) => r.id === id);
    if (newRowIdx >= 0) {
      setNewRows((prev) => {
        const next = [...prev];
        next[newRowIdx] = { ...next[newRowIdx], [field]: value };
        return next;
      });
      return;
    }

    // Existing row - track edits
    setEditedRows((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) ?? {
        code: uoms.find((u) => u.id === id)?.code ?? "",
        name: uoms.find((u) => u.id === id)?.name ?? "",
      };
      next.set(id, { ...existing, [field]: value });
      return next;
    });
  };

  const handleSave = async () => {
    let hasError = false;

    // Save new rows
    for (const row of newRows) {
      if (!row.code || !row.name) {
        addToast({ type: "error", message: "UOM코드와 UOM명을 모두 입력해주세요." });
        hasError = true;
        continue;
      }
      try {
        await createMutation.mutateAsync({ code: row.code, name: row.name });
      } catch {
        addToast({ type: "error", message: `"${row.code}" 등록 중 오류가 발생했습니다.` });
        hasError = true;
      }
    }

    // Save edited rows
    for (const [id, data] of editedRows) {
      try {
        await updateMutation.mutateAsync({ id, payload: data });
      } catch {
        addToast({ type: "error", message: `"${data.code}" 수정 중 오류가 발생했습니다.` });
        hasError = true;
      }
    }

    if (!hasError) {
      addToast({ type: "success", message: "저장되었습니다." });
    }
    setNewRows([]);
    setEditedRows(new Map());
  };

  const handleDeleteClick = () => {
    if (selectedRows.size === 0) {
      addToast({ type: "error", message: "삭제할 항목을 선택해주세요." });
      return;
    }

    // Filter out new rows that haven't been saved
    const newRowIds = newRows.map((r) => r.id);
    const serverIds = Array.from(selectedRows).filter((id) => !newRowIds.includes(id));

    // Remove new rows immediately
    const removedNewRows = Array.from(selectedRows).filter((id) => newRowIds.includes(id));
    if (removedNewRows.length > 0) {
      setNewRows((prev) => prev.filter((r) => !removedNewRows.includes(r.id)));
      setSelectedRows((prev) => {
        const next = new Set(prev);
        removedNewRows.forEach((id) => next.delete(id));
        return next;
      });
    }

    if (serverIds.length > 0) {
      setDeletingIds(serverIds);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      for (const id of deletingIds) {
        await deleteMutation.mutateAsync(id);
      }
      addToast({ type: "success", message: `${deletingIds.length}건이 삭제되었습니다.` });
      setSelectedRows(new Set());
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingIds([]);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === displayData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(displayData.map((r) => r.id)));
    }
  };

  const getRowValue = (row: UomItem, field: "code" | "name") => {
    if (row.isNew) return row[field] as string;
    const edited = editedRows.get(row.id);
    if (edited) return edited[field];
    return row[field] as string;
  };

  const columns: Column<UomItem>[] = [
    {
      key: "select",
      header: "",
      width: "w-[50px]",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={() => toggleRow(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
        />
      ),
    },
    {
      key: "code",
      header: "UOM코드",
      sortable: true,
      render: (row) => (
        <input
          type="text"
          value={getRowValue(row, "code")}
          onChange={(e) => handleCellEdit(row.id, "code", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          disabled={!row.isNew && !editedRows.has(row.id)}
          className={cellInput}
          placeholder="UOM코드"
        />
      ),
    },
    {
      key: "name",
      header: "UOM명",
      sortable: true,
      render: (row) => (
        <input
          type="text"
          value={getRowValue(row, "name")}
          onChange={(e) => handleCellEdit(row.id, "name", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={cellInput}
          placeholder="UOM명"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Title */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; UOM정보</p>
          <h1 className="text-2xl font-bold text-[#191F28]">UOM 정보관리</h1>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">UOM코드</label>
            <input
              type="text"
              placeholder="UOM코드 검색..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={inputBase}
            />
          </div>
          <button
            onClick={() => setPage(1)}
            className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleSave}
          className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E03340]"
        >
          저장
        </button>
        <button
          onClick={handleNew}
          className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          신규
        </button>
        <button
          onClick={handleDeleteClick}
          className="rounded-xl bg-[#8B95A1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B7684]"
        >
          삭제
        </button>
        <button
          onClick={() => downloadExcel("/export/uom", `UOM_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`)}
          className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#17A86B]"
        >
          엑셀
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between rounded-lg bg-[#4A5568] px-4 py-2">
          <h2 className="text-sm font-bold text-white">UOM목록</h2>
          <span className="text-xs text-gray-300">총 {total + newRows.length}건</span>
        </div>
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <>
            {/* Custom table for inline editing */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="w-[50px] px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">
                      <input
                        type="checkbox"
                        checked={displayData.length > 0 && selectedRows.size === displayData.length}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
                      />
                    </th>
                    <SortableHeader field="code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>UOM코드</SortableHeader>
                    <SortableHeader field="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>UOM명</SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#F2F4F6]">
                        <td className="px-5 py-4"><div className="h-4 w-4 animate-pulse rounded bg-[#F2F4F6]" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-full animate-pulse rounded-lg bg-[#F2F4F6]" /></td>
                        <td className="px-5 py-4"><div className="h-4 w-full animate-pulse rounded-lg bg-[#F2F4F6]" /></td>
                      </tr>
                    ))
                  ) : displayData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-16 text-center text-[#B0B8C1]">
                        UOM 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    displayData.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b border-[#F2F4F6] transition-colors duration-200 hover:bg-[#F7F8FA] ${
                          row.isNew ? "bg-[#FFFDE7]" : editedRows.has(row.id) ? "bg-[#FFF8E1]" : ""
                        }`}
                      >
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={getRowValue(row, "code")}
                            onChange={(e) => handleCellEdit(row.id, "code", e.target.value)}
                            disabled={!row.isNew}
                            className={`${cellInput} ${row.isNew ? "" : "text-[#191F28] font-medium"}`}
                            placeholder="UOM코드 입력"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={getRowValue(row, "name")}
                            onChange={(e) => handleCellEdit(row.id, "name", e.target.value)}
                            className={cellInput}
                            placeholder="UOM명 입력"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <p className="text-sm text-[#8B95A1]">
                  총 <span className="font-semibold text-[#191F28]">{total}</span>건
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    이전
                  </button>
                  <span className="rounded-xl bg-[#F7F8FA] px-4 py-1.5 text-sm font-medium text-[#4E5968]">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={deletingIds.length > 0}
        onClose={() => setDeletingIds([])}
        onConfirm={handleDeleteConfirm}
        title="UOM 삭제"
        message={`선택한 ${deletingIds.length}건의 UOM을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
