"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryClient } from "@tanstack/react-query";
import { Search, AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import PageActions from "@/components/ui/PageActions";
import { formatDate } from "@/lib/utils";
import { downloadExcel, printPDF } from "@/lib/export";
import { useInboundOrders } from "@/hooks/useApi";
import { usePermission } from "@/hooks/usePermission";
import InboundFormModal from "@/components/inbound/InboundFormModal";
import type { InboundOrder } from "@/types";

const statusSteps = [
  { value: "DRAFT", label: "초안" },
  { value: "CONFIRMED", label: "확정" },
  { value: "ARRIVED", label: "도착" },
  { value: "RECEIVING", label: "입고중" },
  { value: "COMPLETED", label: "완료" },
];

const statusOptions = [
  { value: "", label: "전체 상태" },
  ...statusSteps,
  { value: "CANCELLED", label: "취소" },
];

const columns: Column<InboundOrder>[] = [
  { key: "orderNumber", header: "주문번호", sortable: true },
  {
    key: "warehouse",
    header: "입고 창고",
    render: (row) => row.warehouse?.name ?? "-",
  },
  {
    key: "partner",
    header: "공급처",
    render: (row) => row.partner?.name ?? "-",
  },
  {
    key: "status",
    header: "상태",
    render: (row) => <Badge status={row.status} />,
  },
  {
    key: "itemCount" as any,
    header: "품목수",
    render: (row) => {
      const items = (row as any).items ?? row.lines;
      return items?.length ?? 0;
    },
  },
  {
    key: "expectedQtySum" as any,
    header: "예상수량",
    render: (row) => {
      const items = (row as any).items ?? row.lines;
      return items?.reduce((sum: number, i: any) => sum + (i.expectedQty || 0), 0) ?? 0;
    },
  },
  {
    key: "receivedQtySum" as any,
    header: "입고수량",
    render: (row) => {
      const items = (row as any).items ?? row.lines;
      return items?.reduce((sum: number, i: any) => sum + (i.receivedQty || 0), 0) ?? 0;
    },
  },
  {
    key: "expectedDate",
    header: "입고 예정일",
    sortable: true,
    render: (row) => formatDate(row.expectedDate),
  },
  {
    key: "arrivedDate",
    header: "도착일",
    render: (row) => formatDate(row.arrivedDate),
  },
  {
    key: "completedDate",
    header: "완료일",
    render: (row) => formatDate(row.completedDate),
  },
  {
    key: "notes" as any,
    header: "비고",
    render: (row) => {
      const notes = row.notes;
      if (!notes) return <span className="text-[#8B95A1]">-</span>;
      return (
        <span title={notes}>
          {notes.length > 20 ? `${notes.slice(0, 20)}...` : notes}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    header: "등록일",
    render: (row) => formatDate(row.createdAt),
  },
];

export default function InboundPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const perm = usePermission("inbound");

  const { data: response, isLoading, error } = useInboundOrders({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const orders = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleRowClick = (row: InboundOrder) => {
    router.push(`/inbound/${row.id}`);
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["inbound"] });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">입고 관리</h1>
        <PageActions
          canCreate={perm.canCreate}
          canExport={perm.canExport}
          onCreateClick={() => setShowCreateModal(true)}
          onExcelDownload={() => {
            const params = statusFilter ? `?status=${statusFilter}` : "";
            downloadExcel(`/export/inbound${params}`, `입고목록_${new Date().toISOString().slice(0, 10)}.xlsx`);
          }}
          onPdfPrint={() => printPDF("입고 관리")}
          createLabel="입고 등록"
        />
      </div>

      {/* Status workflow visualization */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => (
            <div key={step.value} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    statusFilter === step.value
                      ? "bg-[#3182F6] text-white"
                      : "bg-[#F2F4F6] text-[#8B95A1]"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    statusFilter === step.value
                      ? "text-[#3182F6]"
                      : "text-[#8B95A1]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < statusSteps.length - 1 && (
                <div className="mx-3 h-[2px] w-12 bg-[#E5E8EB] lg:w-20" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Search + Status filter pills */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="주문번호, 창고, 공급처 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-[#191F28] text-white"
                    : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                }`}
              >
                {opt.label}
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
            data={orders}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* Create Modal */}
      <InboundFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
