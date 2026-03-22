"use client";

import { useState, useCallback } from "react";
import { Search, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useItemGroups,
  useCreateItemGroup,
  useUpdateItemGroup,
  useDeleteItemGroup,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadExcel } from "@/lib/export";
import type { ItemGroup } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const cellInput =
  "w-full border-0 bg-transparent px-2 py-1 text-sm text-[#191F28] outline-none focus:bg-[#F7F8FA] focus:ring-1 focus:ring-[#3182F6]/30 rounded";

const cellSelect =
  "w-full border-0 bg-transparent px-1 py-1 text-sm text-[#191F28] outline-none focus:bg-[#F7F8FA] focus:ring-1 focus:ring-[#3182F6]/30 rounded cursor-pointer";

const TYPE_OPTIONS = [
  { value: "상품", label: "상품" },
  { value: "물류기기", label: "물류기기" },
];

const ZONE_OPTIONS = [
  { value: "Z01", label: "Z01" },
  { value: "Z02", label: "Z02" },
  { value: "Z03", label: "Z03" },
  { value: "Z04", label: "Z04" },
  { value: "Z05", label: "Z05" },
];

interface EditableRow {
  id: string;
  type: string;
  code: string;
  name: string;
  inboundZone: string;
  isNew?: boolean;
  isDirty?: boolean;
}

export default function ItemGroupsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editableRows, setEditableRows] = useState<EditableRow[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useItemGroups({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const createMutation = useCreateItemGroup();
  const updateMutation = useUpdateItemGroup();
  const deleteMutation = useDeleteItemGroup();

  const groups = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  // Merge server data with local edits
  const displayRows: EditableRow[] = hasLocalChanges
    ? editableRows
    : groups.map((g) => ({
        id: g.id,
        type: g.type || "상품",
        code: g.code,
        name: g.name,
        inboundZone: ((g as unknown as Record<string, unknown>).inboundZone as string) || "",
      }));

  // Initialize editable rows from server data when not yet editing
  const ensureEditable = useCallback(() => {
    if (!hasLocalChanges) {
      setEditableRows(
        groups.map((g) => ({
          id: g.id,
          type: g.type || "상품",
          code: g.code,
          name: g.name,
          inboundZone: ((g as unknown as Record<string, unknown>).inboundZone as string) || "",
        }))
      );
      setHasLocalChanges(true);
    }
  }, [groups, hasLocalChanges]);

  const handleCellChange = (id: string, field: keyof EditableRow, value: string) => {
    ensureEditable();
    setEditableRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value, isDirty: true } : row
      )
    );
    setHasLocalChanges(true);
  };

  const handleAddNew = () => {
    ensureEditable();
    const newRow: EditableRow = {
      id: `new-${Date.now()}`,
      type: "상품",
      code: "",
      name: "",
      inboundZone: "",
      isNew: true,
      isDirty: true,
    };
    setEditableRows((prev) => [newRow, ...prev]);
    setHasLocalChanges(true);
  };

  const handleSave = async () => {
    const dirtyRows = editableRows.filter((r) => r.isDirty);
    if (dirtyRows.length === 0) {
      addToast({ type: "info", message: "변경된 내용이 없습니다." });
      return;
    }

    // Validate
    for (const row of dirtyRows) {
      if (!row.code.trim()) {
        addToast({ type: "error", message: "상품군코드를 입력해주세요." });
        return;
      }
      if (!row.name.trim()) {
        addToast({ type: "error", message: "상품군명을 입력해주세요." });
        return;
      }
    }

    try {
      for (const row of dirtyRows) {
        const payload = {
          code: row.code,
          name: row.name,
          type: row.type,
          description: "",
        };
        if (row.isNew) {
          await createMutation.mutateAsync(payload);
        } else {
          await updateMutation.mutateAsync({ id: row.id, payload });
        }
      }
      addToast({ type: "success", message: `${dirtyRows.length}건이 저장되었습니다.` });
      setHasLocalChanges(false);
      setEditableRows([]);
    } catch {
      addToast({ type: "error", message: "저장 중 오류가 발생했습니다." });
    }
  };

  const handleDeleteClick = () => {
    if (selectedRows.size === 0) {
      addToast({ type: "error", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    setDeletingIds(Array.from(selectedRows));
  };

  const handleDeleteConfirm = async () => {
    try {
      // Remove new (unsaved) rows locally
      const newRowIds = deletingIds.filter((id) => id.startsWith("new-"));
      const existingIds = deletingIds.filter((id) => !id.startsWith("new-"));

      if (newRowIds.length > 0 && hasLocalChanges) {
        setEditableRows((prev) => prev.filter((r) => !newRowIds.includes(r.id)));
      }

      for (const id of existingIds) {
        await deleteMutation.mutateAsync(id);
      }

      addToast({ type: "success", message: `${deletingIds.length}건이 삭제되었습니다.` });
      setSelectedRows(new Set());

      if (existingIds.length > 0) {
        setHasLocalChanges(false);
        setEditableRows([]);
      }
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

  const columns: Column<EditableRow>[] = [
    {
      key: "select",
      header: "",
      width: "w-10",
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
      key: "type",
      header: "상품군타입",
      render: (row) => (
        <select
          value={row.type}
          onChange={(e) => handleCellChange(row.id, "type", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={cellSelect}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "code",
      header: "상품군코드",
      render: (row) => (
        <input
          type="text"
          value={row.code}
          onChange={(e) => handleCellChange(row.id, "code", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="코드 입력"
          className={cellInput}
          disabled={!row.isNew}
        />
      ),
    },
    {
      key: "name",
      header: "상품군명",
      render: (row) => (
        <input
          type="text"
          value={row.name}
          onChange={(e) => handleCellChange(row.id, "name", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="상품군명 입력"
          className={cellInput}
        />
      ),
    },
    {
      key: "inboundZone",
      header: "입고존",
      render: (row) => (
        <select
          value={row.inboundZone}
          onChange={(e) => handleCellChange(row.id, "inboundZone", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={cellSelect}
        >
          <option value="">선택</option>
          {ZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Title */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; 상품군관리</p>
          <h1 className="text-2xl font-bold text-[#191F28]">상품군관리</h1>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-md">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">상품군명</label>
            <input
              type="text"
              placeholder="상품군명 검색..."
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleSave}
          className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E03340]"
        >
          저장
        </button>
        <button
          onClick={handleAddNew}
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
          onClick={() => downloadExcel("/export/item-groups", `item_groups_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`)}
          className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#17A86B]"
        >
          엑셀
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 rounded-lg bg-[#4A5568] px-4 py-2">
          <h2 className="text-sm font-bold text-white">상품군목록</h2>
        </div>
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={displayRows}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            emptyMessage="상품군 데이터가 없습니다."
          />
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deletingIds.length > 0}
        onClose={() => setDeletingIds([])}
        onConfirm={handleDeleteConfirm}
        title="상품군 삭제"
        message={`선택된 ${deletingIds.length}건을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
