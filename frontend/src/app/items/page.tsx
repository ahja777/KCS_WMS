"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, AlertCircle, Trash2 } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageActions from "@/components/ui/PageActions";
import ExcelUpload from "@/components/ui/ExcelUpload";
import { downloadExcel, uploadExcel, printPDF } from "@/lib/export";
import { useItems, useDeleteItem } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import type { Item } from "@/types";
import ItemFormModal from "@/components/items/ItemFormModal";

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>();
  const [deletingItem, setDeletingItem] = useState<Item | undefined>();

  const [showUpload, setShowUpload] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("items");

  const { data: response, isLoading, error } = useItems({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const deleteMutation = useDeleteItem();

  const items = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    setDeletingItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync(deletingItem.id);
      addToast({ type: "success", message: `"${deletingItem.name}" 품목이 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingItem(undefined);
    }
  };

  const handleFormSuccess = () => {
    // queries are auto-invalidated by the mutation hooks
  };

  const columns: Column<Item>[] = [
    { key: "code", header: "품목코드", sortable: true },
    { key: "name", header: "품목명", sortable: true },
    {
      key: "category",
      header: "카테고리",
      sortable: true,
      render: (row) => (
        <span className="inline-flex rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-xs font-medium text-[#4E5968]">
          {row.category}
        </span>
      ),
    },
    { key: "barcode", header: "바코드" },
    {
      key: "weight",
      header: "무게(kg)",
      render: (row) => `${row.weight}`,
    },
    { key: "uom", header: "단위" },
    {
      key: "isActive",
      header: "상태",
      render: (row) => <Badge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    ...(perm.canDelete
      ? [{
          key: "actions",
          header: "",
          render: (row: Item) => (
            <button
              onClick={(e: React.MouseEvent) => handleDeleteClick(e, row)}
              className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">품목 관리</h1>
        <PageActions
          canCreate={perm.canCreate}
          canImport={perm.canImport}
          canExport={perm.canExport}
          onCreateClick={handleCreate}
          onExcelDownload={() => downloadExcel("/export/items", `품목목록_${new Date().toISOString().slice(0, 10)}.xlsx`)}
          onExcelUpload={() => setShowUpload(true)}
          onPdfPrint={() => printPDF("품목 관리")}
          createLabel="품목 등록"
        />
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="품목코드, 품목명 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={items}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={perm.canEdit ? handleEdit : undefined}
          />
        )}
      </div>

      <ItemFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      <ConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(undefined)}
        onConfirm={handleDeleteConfirm}
        title="품목 삭제"
        message={`"${deletingItem?.name}" 품목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />

      <ExcelUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={(file) => uploadExcel("/import/items", file)}
        title="품목 엑셀 업로드"
        templateColumns={["품목코드", "품목명", "카테고리", "바코드", "단위", "무게"]}
      />
    </div>
  );
}
