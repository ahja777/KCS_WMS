"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { Plus, Search, AlertCircle, Trash2, Eye, Download } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { downloadExcel } from "@/lib/export";
import { useWarehouses, useDeleteWarehouse } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Warehouse } from "@/types";
import WarehouseFormModal from "@/components/warehouse/WarehouseFormModal";

export default function WarehousePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | undefined>();
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useWarehouses({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const deleteMutation = useDeleteWarehouse();

  const warehouses = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingWarehouse(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, warehouse: Warehouse) => {
    e.stopPropagation();
    setDeletingWarehouse(warehouse);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWarehouse) return;
    try {
      await deleteMutation.mutateAsync(deletingWarehouse.id);
      addToast({ type: "success", message: `"${deletingWarehouse.name}" 창고가 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingWarehouse(undefined);
    }
  };

  const handleFormSuccess = () => {
    // queries are auto-invalidated by the mutation hooks
  };

  const columns: Column<Warehouse>[] = [
    { key: "code", header: "창고 코드", sortable: true },
    { key: "name", header: "창고명", sortable: true },
    { key: "country", header: "국가", sortable: true },
    { key: "city", header: "도시", sortable: true },
    { key: "timezone", header: "시간대", sortable: true },
    {
      key: "status",
      header: "상태",
      sortable: true,
      render: (row) => <Badge status={row.status} />,
    },
    { key: "contactName", header: "담당자", sortable: true },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/warehouse/${row.id}`);
            }}
            className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-[#E8F2FF] hover:text-[#3182F6]"
            title="상세보기"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleDeleteClick(e, row)}
            className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">창고 관리</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              downloadExcel('/export/warehouses', `warehouses_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`);
            }}
            className="flex items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
          >
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
          >
            <Plus className="h-4 w-4" />
            창고 등록
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="창고 코드, 이름, 국가 검색..."
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
            data={warehouses}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={(row) => router.push(`/warehouse/${row.id}`)}
          />
        )}
      </div>

      <WarehouseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        warehouse={editingWarehouse}
        onSuccess={handleFormSuccess}
      />

      <ConfirmModal
        isOpen={!!deletingWarehouse}
        onClose={() => setDeletingWarehouse(undefined)}
        onConfirm={handleDeleteConfirm}
        title="창고 삭제"
        message={`"${deletingWarehouse?.name}" 창고를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
