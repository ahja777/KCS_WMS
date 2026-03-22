"use client";

import { useState } from "react";
import { AlertCircle, ChevronLeft } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  useWorkOrders,
  useWorkOrder,
  useAssignWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, getStatusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { WorkOrder } from "@/types";

const typeFilters = [
  { value: "", label: "전체" },
  { value: "INBOUND", label: "입고" },
  { value: "PUTAWAY", label: "적치" },
  { value: "PICKING", label: "피킹" },
  { value: "PACKING", label: "패킹" },
  { value: "LOADING", label: "상차" },
  { value: "MOVE", label: "이동" },
  { value: "CYCLE_COUNT", label: "실사" },
];

const statusFilters = [
  { value: "", label: "전체" },
  { value: "CREATED", label: "생성" },
  { value: "ASSIGNED", label: "배정" },
  { value: "IN_PROGRESS", label: "진행중" },
  { value: "COMPLETED", label: "완료" },
];

export default function WorkOrdersPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetId, setAssignTargetId] = useState<string>("");
  const [assignee, setAssignee] = useState("");

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useWorkOrders({
    page,
    limit: 20,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const { data: detail } = useWorkOrder(selectedId);

  const assignMutation = useAssignWorkOrder();
  const startMutation = useStartWorkOrder();
  const completeMutation = useCompleteWorkOrder();

  const orders = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleRowClick = (order: WorkOrder) => {
    setSelectedId(order.id);
  };

  const handleAssign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAssignTargetId(id);
    setAssignee("");
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!assignee.trim()) return;
    try {
      await assignMutation.mutateAsync({ id: assignTargetId, payload: { assignee } });
      addToast({ type: "success", message: "작업이 배정되었습니다." });
      setAssignModalOpen(false);
    } catch {
      addToast({ type: "error", message: "배정 중 오류가 발생했습니다." });
    }
  };

  const handleStart = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await startMutation.mutateAsync(id);
      addToast({ type: "success", message: "작업이 시작되었습니다." });
    } catch {
      addToast({ type: "error", message: "시작 중 오류가 발생했습니다." });
    }
  };

  const handleComplete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await completeMutation.mutateAsync(id);
      addToast({ type: "success", message: "작업이 완료되었습니다." });
    } catch {
      addToast({ type: "error", message: "완료 처리 중 오류가 발생했습니다." });
    }
  };

  const inputBase =
    "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

  const columns: Column<WorkOrder>[] = [
    { key: "orderNumber", header: "작업번호", sortable: true },
    {
      key: "type",
      header: "유형",
      render: (row) => <Badge status={row.type} />,
    },
    {
      key: "warehouseId",
      header: "창고",
      render: (row) => row.warehouse?.name ?? "-",
    },
    {
      key: "assignee",
      header: "담당자",
      render: (row) => row.assignee || "-",
    },
    {
      key: "status",
      header: "상태",
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "생성일",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-2">
          {row.status === "CREATED" && (
            <button
              onClick={(e) => handleAssign(e, row.id)}
              className="rounded-lg bg-[#E8F2FF] px-3 py-1 text-xs font-semibold text-[#3182F6] transition-colors hover:bg-[#D0E4FF]"
            >
              배정
            </button>
          )}
          {row.status === "ASSIGNED" && (
            <button
              onClick={(e) => handleStart(e, row.id)}
              className="rounded-lg bg-[#FFF3E0] px-3 py-1 text-xs font-semibold text-[#FF8B00] transition-colors hover:bg-[#FFE5C0]"
            >
              시작
            </button>
          )}
          {row.status === "IN_PROGRESS" && (
            <button
              onClick={(e) => handleComplete(e, row.id)}
              className="rounded-lg bg-[#E8F7EF] px-3 py-1 text-xs font-semibold text-[#1FC47D] transition-colors hover:bg-[#D0F0DE]"
            >
              완료
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">작업 지시서</h1>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Type filter pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setTypeFilter(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                typeFilter === f.value
                  ? "bg-[#3182F6] text-white"
                  : "bg-[#F2F4F6] text-[#6B7684] hover:bg-[#E5E8EB]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                statusFilter === f.value
                  ? "border-[#3182F6] bg-[#E8F2FF] text-[#3182F6]"
                  : "border-[#E5E8EB] bg-white text-[#6B7684] hover:bg-[#F7F8FA]"
              )}
            >
              {f.label}
            </button>
          ))}
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(undefined)}
        title="작업 지시서 상세"
        size="lg"
      >
        {detail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#8B95A1]">작업번호</p>
                <p className="mt-1 text-sm font-semibold text-[#191F28]">{detail.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">유형</p>
                <div className="mt-1">
                  <Badge status={detail.type} />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">상태</p>
                <div className="mt-1">
                  <Badge status={detail.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">창고</p>
                <p className="mt-1 text-sm text-[#4E5968]">{detail.warehouse?.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">담당자</p>
                <p className="mt-1 text-sm text-[#4E5968]">{detail.assignee || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">생성일</p>
                <p className="mt-1 text-sm text-[#4E5968]">{formatDate(detail.createdAt)}</p>
              </div>
            </div>

            {detail.items && detail.items.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#191F28]">작업 품목</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F7F8FA]">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium text-[#8B95A1]">품목</th>
                        <th className="px-4 py-3 text-xs font-medium text-[#8B95A1]">수량</th>
                        <th className="px-4 py-3 text-xs font-medium text-[#8B95A1]">완료수량</th>
                        <th className="px-4 py-3 text-xs font-medium text-[#8B95A1]">로케이션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#F2F4F6]">
                          <td className="px-4 py-3 text-[#4E5968]">
                            {item.item?.name ?? item.itemId}
                          </td>
                          <td className="px-4 py-3 text-[#4E5968]">{item.quantity}</td>
                          <td className="px-4 py-3 text-[#4E5968]">{item.completedQty ?? 0}</td>
                          <td className="px-4 py-3 text-[#4E5968]">{item.locationCode ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedId(undefined)}
                className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3182F6] border-t-transparent" />
          </div>
        )}
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="작업 배정"
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              담당자 <span className="text-red-500">*</span>
            </label>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="담당자 이름"
              className={inputBase}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
            >
              취소
            </button>
            <button
              onClick={handleAssignConfirm}
              disabled={!assignee.trim() || assignMutation.isPending}
              className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
            >
              {assignMutation.isPending ? "처리중..." : "배정"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
