"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  UserCheck,
  Play,
  CheckCircle,
  Printer,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useWorkOrder,
  useAssignWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type { WorkOrderItem } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const typeLabels: Record<string, string> = {
  RECEIVING: "입고",
  PUTAWAY: "적치",
  PICKING: "피킹",
  PACKING: "패킹",
  LOADING: "상차",
  MOVEMENT: "이동",
  COUNT: "실사",
  INBOUND: "입고",
};

const statusSteps = [
  { value: "CREATED", label: "생성" },
  { value: "ASSIGNED", label: "배정" },
  { value: "IN_PROGRESS", label: "진행중" },
  { value: "COMPLETED", label: "완료" },
];

function getStepState(currentStatus: string, stepValue: string) {
  const order = statusSteps.map((s) => s.value);
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepValue);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: workOrder, isLoading, error } = useWorkOrder(id);
  const assignMutation = useAssignWorkOrder();
  const startMutation = useStartWorkOrder();
  const completeMutation = useCompleteWorkOrder();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const isMutating = assignMutation.isPending || startMutation.isPending || completeMutation.isPending;

  const handleAssign = async () => {
    if (!assignee.trim()) {
      addToast({ type: "warning", message: "담당자를 입력해주세요." });
      return;
    }
    try {
      await assignMutation.mutateAsync({ id, payload: { assignee } });
      addToast({ type: "success", message: "작업이 배정되었습니다." });
      setShowAssignModal(false);
      setAssignee("");
    } catch {
      addToast({ type: "error", message: "배정 중 오류가 발생했습니다." });
    }
  };

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(id);
      addToast({ type: "success", message: "작업이 시작되었습니다." });
    } catch {
      addToast({ type: "error", message: "시작 중 오류가 발생했습니다." });
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(id);
      addToast({ type: "success", message: "작업이 완료되었습니다." });
    } catch {
      addToast({ type: "error", message: "완료 처리 중 오류가 발생했습니다." });
    } finally {
      setShowCompleteConfirm(false);
    }
  };

  const handlePrint = () => {
    if (!workOrder) return;
    const esc = (s: unknown) =>
      String(s ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const title = typeLabels[workOrder.type] ? `${typeLabels[workOrder.type]} 작업지시서` : "작업지시서";
    const itemRows = (workOrder.items ?? [])
      .map(
        (item: WorkOrderItem, idx: number) => `
        <tr>
          <td style="border:1px solid #ddd;padding:8px;text-align:center">${idx + 1}</td>
          <td style="border:1px solid #ddd;padding:8px">${esc(item.item?.code ?? item.itemId)}</td>
          <td style="border:1px solid #ddd;padding:8px">${esc(item.item?.name)}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:right">${item.quantity}</td>
          <td style="border:1px solid #ddd;padding:8px">${item.locationCode ?? "-"}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:center">${item.completedQty ?? 0}</td>
        </tr>`
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${title}</title></head>
      <body style="font-family:sans-serif;padding:40px">
        <h1 style="text-align:center;margin-bottom:30px">${title}</h1>
        <table style="width:100%;margin-bottom:20px">
          <tr><td><strong>작업번호:</strong> ${esc(workOrder.orderNumber)}</td><td><strong>창고:</strong> ${esc(workOrder.warehouse?.name)}</td></tr>
          <tr><td><strong>담당자:</strong> ${esc(workOrder.assignee)}</td><td><strong>생성일:</strong> ${esc(formatDate(workOrder.createdAt))}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f5f5f5">
            <th style="border:1px solid #ddd;padding:8px">No</th>
            <th style="border:1px solid #ddd;padding:8px">품목코드</th>
            <th style="border:1px solid #ddd;padding:8px">품목명</th>
            <th style="border:1px solid #ddd;padding:8px">수량</th>
            <th style="border:1px solid #ddd;padding:8px">로케이션</th>
            <th style="border:1px solid #ddd;padding:8px">완료수량</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/work-orders")}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 작업지시서를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const items = workOrder.items ?? [];
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const completedQty = items.reduce((s, i) => s + (i.completedQty ?? 0), 0);
  const progressPct = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/work-orders")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">
                {workOrder.orderNumber}
              </h1>
              <Badge status={workOrder.type} />
              <Badge status={workOrder.status} />
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              {workOrder.warehouse?.name ?? "-"} |
              담당자: {workOrder.assignee || "미배정"} |
              생성일: {formatDateTime(workOrder.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-sm font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
          >
            <Printer className="h-4 w-4" />
            인쇄
          </button>
          {workOrder.status === "CREATED" && (
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              배정
            </button>
          )}
          {workOrder.status === "ASSIGNED" && (
            <button
              onClick={handleStart}
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl bg-[#FF8B00] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E67A00] disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              시작
            </button>
          )}
          {workOrder.status === "IN_PROGRESS" && (
            <button
              onClick={() => setShowCompleteConfirm(true)}
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl bg-[#1FC47D] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18A968] disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              완료
            </button>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => {
            const state = getStepState(workOrder.status, step.value);
            return (
              <div key={step.value} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      state === "done"
                        ? "bg-[#1FC47D] text-white"
                        : state === "current"
                          ? "bg-[#3182F6] text-white"
                          : "bg-[#F2F4F6] text-[#B0B8C1]"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold ${
                      state === "done"
                        ? "text-[#1FC47D]"
                        : state === "current"
                          ? "text-[#3182F6]"
                          : "text-[#B0B8C1]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`mx-3 h-[2px] w-12 lg:w-24 ${
                      state === "done" ? "bg-[#1FC47D]" : "bg-[#E5E8EB]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">작업유형</p>
          <p className="mt-1 text-xl font-bold text-[#191F28]">{typeLabels[workOrder.type] ?? workOrder.type}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">품목수</p>
          <p className="mt-1 text-xl font-bold text-[#191F28]">{items.length}건</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">진행률</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]">
              <div
                className="h-full rounded-full bg-[#1FC47D] transition-all"
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-[#1FC47D]">{progressPct}%</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">총 수량 / 완료</p>
          <p className="mt-1 text-xl font-bold text-[#191F28]">
            {formatNumber(completedQty)} / {formatNumber(totalQty)}
          </p>
        </div>
      </div>

      {/* Items table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">작업 품목</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F2F4F6]">
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">NO</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목코드</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목명</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">수량</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">로케이션</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">완료수량</th>
                <th className="pb-3 text-center text-xs font-semibold text-[#8B95A1]">상태</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-[#8B95A1]">
                    품목 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item: WorkOrderItem, idx: number) => {
                  const done = (item.completedQty ?? 0) >= item.quantity;
                  const inProgress = (item.completedQty ?? 0) > 0 && !done;
                  return (
                    <tr key={item.id ?? idx} className="border-b border-[#F7F8FA] last:border-0">
                      <td className="py-4 text-sm text-[#4E5968]">{idx + 1}</td>
                      <td className="py-4 text-sm font-medium text-[#4E5968]">{item.item?.code ?? item.itemId}</td>
                      <td className="py-4 text-sm text-[#191F28]">{item.item?.name ?? "-"}</td>
                      <td className="py-4 text-right text-sm font-semibold text-[#191F28]">{formatNumber(item.quantity)}</td>
                      <td className="py-4 text-sm text-[#4E5968]">{item.locationCode ?? "-"}</td>
                      <td className="py-4 text-right text-sm font-semibold text-[#3182F6]">{formatNumber(item.completedQty ?? 0)}</td>
                      <td className="py-4 text-center">
                        {done ? (
                          <span className="inline-flex rounded-full bg-[#E8F7EF] px-3 py-1 text-xs font-semibold text-[#1FC47D]">완료</span>
                        ) : inProgress ? (
                          <span className="inline-flex rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-semibold text-[#FF8B00]">진행중</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#F2F4F6] px-3 py-1 text-xs font-semibold text-[#8B95A1]">대기</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {workOrder.notes && (
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-3 text-lg font-bold text-[#191F28]">비고</h2>
          <p className="text-sm text-[#4E5968] whitespace-pre-wrap">{workOrder.notes}</p>
        </div>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
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
              onClick={() => setShowAssignModal(false)}
              className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
            >
              취소
            </button>
            <button
              onClick={handleAssign}
              disabled={!assignee.trim() || assignMutation.isPending}
              className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
            >
              {assignMutation.isPending ? "처리중..." : "배정"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Complete Confirm */}
      <ConfirmModal
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleComplete}
        title="작업 완료"
        message="이 작업을 완료 처리하시겠습니까?"
        confirmText="완료"
        cancelText="취소"
        variant="warning"
        isLoading={completeMutation.isPending}
      />
    </div>
  );
}
