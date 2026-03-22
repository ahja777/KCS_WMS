"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Plus, Search, AlertCircle, Trash2, Download } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { downloadExcel } from "@/lib/export";
import { usePartners, useDeletePartner } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Partner } from "@/types";
import PartnerFormModal from "@/components/partners/PartnerFormModal";

const typeFilters = [
  { value: "", label: "전체" },
  { value: "SUPPLIER", label: "공급처" },
  { value: "CUSTOMER", label: "고객사" },
  { value: "CARRIER", label: "운송사" },
];

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | undefined>();
  const [deletingPartner, setDeletingPartner] = useState<Partner | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = usePartners({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  });

  const deleteMutation = useDeletePartner();

  const partners = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingPartner(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, partner: Partner) => {
    e.stopPropagation();
    setDeletingPartner(partner);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPartner) return;
    try {
      await deleteMutation.mutateAsync(deletingPartner.id);
      addToast({ type: "success", message: `"${deletingPartner.name}" 파트너가 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingPartner(undefined);
    }
  };

  const handleFormSuccess = () => {
    // queries are auto-invalidated by the mutation hooks
  };

  const columns: Column<Partner>[] = [
    { key: "code", header: "파트너 코드", sortable: true },
    { key: "name", header: "파트너명", sortable: true },
    {
      key: "type",
      header: "유형",
      render: (row) => <Badge status={row.type} />,
    },
    { key: "country", header: "국가", sortable: true },
    { key: "contactName", header: "담당자" },
    { key: "contactPhone", header: "연락처" },
    { key: "contactEmail", header: "이메일" },
    {
      key: "isActive",
      header: "상태",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              row.isActive ? "bg-[#00C853]" : "bg-[#8B95A1]"
            }`}
          />
          <span className={`text-sm ${row.isActive ? "text-[#191F28]" : "text-[#8B95A1]"}`}>
            {row.isActive ? "활성" : "비활성"}
          </span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={(e) => handleDeleteClick(e, row)}
          className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">파트너 관리</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const params = typeFilter ? `?type=${typeFilter}` : '';
              downloadExcel(`/export/partners${params}`, `partners_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`);
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
            파트너 등록
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Search + Type pill filter */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="파트너 코드, 이름, 국가 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          {/* Pill tabs for type filter */}
          <div className="flex gap-2">
            {typeFilters.map((tf) => (
              <button
                key={tf.value}
                onClick={() => {
                  setTypeFilter(tf.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  typeFilter === tf.value
                    ? "bg-[#191F28] text-white"
                    : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                }`}
              >
                {tf.label}
              </button>
            ))}
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
            data={partners}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleEdit}
          />
        )}
      </div>

      <PartnerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        partner={editingPartner}
        onSuccess={handleFormSuccess}
      />

      <ConfirmModal
        isOpen={!!deletingPartner}
        onClose={() => setDeletingPartner(undefined)}
        onConfirm={handleDeleteConfirm}
        title="파트너 삭제"
        message={`"${deletingPartner?.name}" 파트너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
