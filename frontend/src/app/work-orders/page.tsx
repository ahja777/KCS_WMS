"use client";

import { useState, useRef } from "react";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import { Plus, UserCheck, Play, CheckCircle, Printer, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  useWorkOrders,
  useWorkOrder,
  useAssignWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useWarehouses,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import type { WorkOrder, WorkOrderItem } from "@/types";

const typeFilters = [
  { value: "", label: "전체" },
  { value: "RECEIVING", label: "입고" },
  { value: "PUTAWAY", label: "적치" },
  { value: "PICKING", label: "피킹" },
  { value: "PACKING", label: "패킹" },
  { value: "LOADING", label: "상차" },
  { value: "MOVEMENT", label: "이동" },
  { value: "COUNT", label: "실사" },
];

const statusFilters = [
  { value: "", label: "전체" },
  { value: "CREATED", label: "생성" },
  { value: "ASSIGNED", label: "배정" },
  { value: "IN_PROGRESS", label: "진행중" },
  { value: "COMPLETED", label: "완료" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

function getPrintTitle(type: string): string {
  switch (type) {
    case "RECEIVING":
    case "INBOUND":
      return "입고작업지시서";
    case "PICKING":
      return "피킹리스트";
    case "LOADING":
      return "상차리스트";
    default:
      return "작업지시서";
  }
}

export default function WorkOrdersPage() {
  const addToast = useToastStore((s) => s.addToast);
  const today = new Date().toISOString().slice(0, 10);
  const printRef = useRef<HTMLDivElement>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Selection
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetId, setAssignTargetId] = useState("");
  const [assignee, setAssignee] = useState("");

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // API
  const { data: response, isLoading, error } = useWorkOrders({
    page,
    limit: 20,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  });

  const { data: detail } = useWorkOrder(selectedId);
  const { data: warehousesRes } = useWarehouses({ limit: 100 });

  const assignMutation = useAssignWorkOrder();
  const startMutation = useStartWorkOrder();
  const completeMutation = useCompleteWorkOrder();

  const orders = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;
  const warehouses = warehousesRes?.data ?? [];

  const { sortedData: sortedOrders, sortKey, sortDir, handleSort } = useTableSort(orders);

  const handleRowClick = (order: WorkOrder) => {
    setSelectedId((prev) => (prev === order.id ? undefined : order.id));
  };

  const handleAssignOpen = () => {
    if (!selectedId) {
      addToast({ type: "warning", message: "배정할 작업을 선택해주세요." });
      return;
    }
    const selected = orders.find((o: WorkOrder) => o.id === selectedId);
    if (selected?.status !== "CREATED") {
      addToast({ type: "warning", message: "생성 상태의 작업만 배정 가능합니다." });
      return;
    }
    setAssignTargetId(selectedId);
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

  const handleStart = async () => {
    if (!selectedId) {
      addToast({ type: "warning", message: "시작할 작업을 선택해주세요." });
      return;
    }
    const selected = orders.find((o: WorkOrder) => o.id === selectedId);
    if (selected?.status !== "ASSIGNED") {
      addToast({ type: "warning", message: "배정 상태의 작업만 시작 가능합니다." });
      return;
    }
    try {
      await startMutation.mutateAsync(selectedId);
      addToast({ type: "success", message: "작업이 시작되었습니다." });
    } catch {
      addToast({ type: "error", message: "시작 중 오류가 발생했습니다." });
    }
  };

  const handleComplete = async () => {
    if (!selectedId) {
      addToast({ type: "warning", message: "완료할 작업을 선택해주세요." });
      return;
    }
    const selected = orders.find((o: WorkOrder) => o.id === selectedId);
    if (selected?.status !== "IN_PROGRESS") {
      addToast({ type: "warning", message: "진행중 상태의 작업만 완료 가능합니다." });
      return;
    }
    try {
      await completeMutation.mutateAsync(selectedId);
      addToast({ type: "success", message: "작업이 완료되었습니다." });
    } catch {
      addToast({ type: "error", message: "완료 처리 중 오류가 발생했습니다." });
    }
  };

  const esc = (s: unknown) => String(s ?? "-").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const handlePrint = () => {
    if (!selectedId || !detail) {
      addToast({ type: "warning", message: "인쇄할 작업을 선택해주세요." });
      return;
    }
    const title = getPrintTitle(detail.type);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemRows = (detail.items ?? [])
      .map(
        (item: WorkOrderItem, idx: number) => `
        <tr>
          <td style="border:1px solid #ddd;padding:8px;text-align:center">${idx + 1}</td>
          <td style="border:1px solid #ddd;padding:8px">${esc(item.item?.code ?? item.itemId)}</td>
          <td style="border:1px solid #ddd;padding:8px">${esc(item.item?.name)}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:right">${item.quantity}</td>
          <td style="border:1px solid #ddd;padding:8px">${item.locationCode ?? "-"}</td>
          <td style="border:1px solid #ddd;padding:8px">-</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:center">${item.completedQty ?? 0}</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head><title>${title}</title></head>
        <body style="font-family:sans-serif;padding:40px">
          <h1 style="text-align:center;margin-bottom:30px">${title}</h1>
          <table style="width:100%;margin-bottom:20px">
            <tr><td><strong>작업번호:</strong> ${esc(detail.orderNumber)}</td><td><strong>창고:</strong> ${esc(detail.warehouse?.name)}</td></tr>
            <tr><td><strong>담당자:</strong> ${esc(detail.assignee)}</td><td><strong>생성일:</strong> ${esc(formatDate(detail.createdAt))}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="border:1px solid #ddd;padding:8px">No</th>
                <th style="border:1px solid #ddd;padding:8px">품목코드</th>
                <th style="border:1px solid #ddd;padding:8px">품목명</th>
                <th style="border:1px solid #ddd;padding:8px">수량</th>
                <th style="border:1px solid #ddd;padding:8px">FROM 로케이션</th>
                <th style="border:1px solid #ddd;padding:8px">TO 로케이션</th>
                <th style="border:1px solid #ddd;padding:8px">완료수량</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">작업지시서</h1>
      </div>

      {/* Search filters */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        {/* Type filter pills */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">작업유형</label>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setTypeFilter(f.value); setPage(1); }}
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
        </div>

        {/* Status filter pills */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">상태</label>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
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
        </div>

        {/* Warehouse + Date range */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
            <select
              value={warehouseFilter}
              onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
              className={selectBase + " w-full"}
            >
              <option value="">전체</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">날짜범위</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={selectBase}
              />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={selectBase}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => {
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B64DA]"
        >
          <Plus className="h-3.5 w-3.5" /> 작업생성
        </button>
        <button
          onClick={handleAssignOpen}
          className="flex items-center gap-1.5 rounded-xl bg-[#E8F2FF] px-4 py-2 text-xs font-semibold text-[#3182F6] hover:bg-[#D0E4FF]"
        >
          <UserCheck className="h-3.5 w-3.5" /> 배정
        </button>
        <button
          onClick={handleStart}
          className="flex items-center gap-1.5 rounded-xl bg-[#FFF3E0] px-4 py-2 text-xs font-semibold text-[#FF8B00] hover:bg-[#FFE5C0]"
        >
          <Play className="h-3.5 w-3.5" /> 시작
        </button>
        <button
          onClick={handleComplete}
          className="flex items-center gap-1.5 rounded-xl bg-[#E8F7EF] px-4 py-2 text-xs font-semibold text-[#1FC47D] hover:bg-[#D0F0DE]"
        >
          <CheckCircle className="h-3.5 w-3.5" /> 완료
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2 text-xs font-semibold text-[#4E5968] hover:bg-[#F7F8FA]"
        >
          <Printer className="h-3.5 w-3.5" /> 인쇄
        </button>
      </div>

      {/* Master grid */}
      <div
        className="rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col"
        style={{ height: selectedId ? "45%" : "100%" }}
      >
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="flex items-center gap-3 p-5 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              데이터를 불러오는 중 오류가 발생했습니다.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#F7F8FA]">
                <tr>
                  <SortableHeader field="orderNumber" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>작업번호</SortableHeader>
                  <SortableHeader field="type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-center">유형</SortableHeader>
                  <SortableHeader field="warehouse.name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>창고</SortableHeader>
                  <SortableHeader field="assignee" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>담당자</SortableHeader>
                  <SortableHeader field="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-center">상태</SortableHeader>
                  <SortableHeader field="items.length" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">품목수</SortableHeader>
                  <SortableHeader field="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>생성일</SortableHeader>
                  <SortableHeader field="updatedAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>완료일</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-[#8B95A1]">
                      작업 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order: WorkOrder) => (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order)}
                      className={cn(
                        "cursor-pointer border-b border-[#F2F4F6] transition-colors",
                        selectedId === order.id
                          ? "bg-[#E8F2FF]"
                          : "hover:bg-[#F7F8FA]"
                      )}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[#191F28]">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={order.type} />
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4E5968]">
                        {order.warehouse?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4E5968]">
                        {order.assignee || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#4E5968]">
                        {order.items?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4E5968]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4E5968]">
                        {order.status === "COMPLETED" ? formatDate(order.updatedAt) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">
            총 {total}건 (Page {page} / {totalPages})
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-[#E5E8EB] px-3 py-1 text-xs text-[#4E5968] disabled:opacity-40"
            >
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-[#E5E8EB] px-3 py-1 text-xs text-[#4E5968] disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {/* Detail grid */}
      {selectedId && (
        <div
          className="mt-4 rounded-2xl bg-white shadow-sm overflow-auto"
          style={{ height: "35%" }}
        >
          <div className="rounded-t-2xl bg-[#4A5568] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">
              작업 품목 상세
              {detail && (
                <span className="ml-2 text-xs font-normal text-gray-300">
                  ({detail.orderNumber})
                </span>
              )}
            </h2>
          </div>
          {detail ? (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#F7F8FA]">
                <tr>
                  <SortableHeader field="item.code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>품목코드</SortableHeader>
                  <SortableHeader field="item.name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>품목명</SortableHeader>
                  <SortableHeader field="quantity" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">수량</SortableHeader>
                  <SortableHeader field="locationCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>로케이션(FROM)</SortableHeader>
                  <SortableHeader field="toLocationCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>로케이션(TO)</SortableHeader>
                  <SortableHeader field="completedQty" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-center">상태</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {(detail.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-[#8B95A1]">
                      품목 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  (detail.items ?? []).map((item: WorkOrderItem, idx: number) => (
                    <tr key={item.id ?? idx} className="border-b border-[#F2F4F6]">
                      <td className="px-4 py-3 text-sm text-[#191F28]">
                        {item.item?.code ?? item.itemId}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4E5968]">
                        {item.item?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#4E5968]">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4E5968]">
                        {item.locationCode ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4E5968]">-</td>
                      <td className="px-4 py-3 text-center">
                        {(item.completedQty ?? 0) >= item.quantity ? (
                          <span className="inline-flex items-center rounded-full bg-[#E8F7EF] px-3 py-1 text-xs font-semibold text-[#1FC47D]">완료</span>
                        ) : (item.completedQty ?? 0) > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-semibold text-[#FF8B00]">진행중</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-3 py-1 text-xs font-semibold text-[#8B95A1]">대기</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
            </div>
          )}
        </div>
      )}

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

      {/* Create Work Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="작업 생성"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8B95A1]">
            작업지시서 생성은 입고/출고 프로세스에서 자동으로 생성됩니다.
            수동 생성이 필요한 경우 관리자에게 문의해주세요.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
            >
              닫기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
