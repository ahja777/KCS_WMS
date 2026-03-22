"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Warehouse,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  Truck,
  ClipboardCheck,
  AlertCircle,
  Printer,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useInboundOrder,
  useConfirmInbound,
  useArriveInbound,
  useReceiveInbound,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type { InboundOrderLine } from "@/types";

// ─── Status workflow ────────────────────────────────────────
const statusSteps = [
  { value: "DRAFT", label: "초안", icon: FileText },
  { value: "CONFIRMED", label: "확정", icon: CheckCircle },
  { value: "ARRIVED", label: "도착", icon: Truck },
  { value: "RECEIVING", label: "입고중", icon: ClipboardCheck },
  { value: "COMPLETED", label: "완료", icon: Package },
];

const statusOrder = statusSteps.map((s) => s.value);

function getStepState(currentStatus: string, stepValue: string) {
  const currentIdx = statusOrder.indexOf(currentStatus);
  const stepIdx = statusOrder.indexOf(stepValue);
  if (currentStatus === "CANCELLED") return "cancelled";
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

function getNextAction(status: string) {
  switch (status) {
    case "DRAFT":
      return { label: "주문 확정", action: "confirm" as const, color: "bg-[#3182F6] hover:bg-[#1B64DA]" };
    case "CONFIRMED":
      return { label: "도착 처리", action: "arrive" as const, color: "bg-[#FF8B00] hover:bg-[#E67A00]" };
    case "ARRIVED":
      return { label: "입고 처리", action: "receive" as const, color: "bg-[#1FC47D] hover:bg-[#18A968]" };
    default:
      return null;
  }
}

// ─── Receive modal ──────────────────────────────────────────
function ReceiveModal({
  isOpen,
  onClose,
  lines,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  lines: InboundOrderLine[];
  onSubmit: (items: Array<{ inboundOrderItemId: string; receivedQty: number; damagedQty: number }>) => void;
  isLoading: boolean;
}) {
  const [receiveData, setReceiveData] = useState<Record<string, { receivedQty: number; damagedQty: number }>>({});

  const getLineData = (lineId: string, line: InboundOrderLine) =>
    receiveData[lineId] ?? { receivedQty: line.expectedQty, damagedQty: 0 };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-modal-in">
        <div className="flex items-center justify-between px-7 pt-7 pb-2">
          <h2 className="text-xl font-bold text-[#191F28]">입고 검수</h2>
        </div>
        <div className="p-7">
          <div className="mb-4 rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-sm text-[#6B7684]">
              각 품목별 실제 입고 수량과 파손 수량을 입력해주세요.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-[#8B95A1] px-1">
              <div className="col-span-4">품목</div>
              <div className="col-span-2 text-right">예정 수량</div>
              <div className="col-span-3 text-center">입고 수량</div>
              <div className="col-span-3 text-center">파손 수량</div>
            </div>
            {lines.map((line) => {
              const data = getLineData(line.id, line);
              return (
                <div key={line.id} className="grid grid-cols-12 items-center gap-3 rounded-xl bg-[#F7F8FA] p-3">
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-[#191F28]">{line.item?.name ?? "품목"}</p>
                    <p className="text-xs text-[#8B95A1]">{line.item?.code ?? "-"}</p>
                  </div>
                  <div className="col-span-2 text-right text-sm font-semibold text-[#4E5968]">
                    {formatNumber(line.expectedQty)}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      value={data.receivedQty}
                      onChange={(e) =>
                        setReceiveData((prev) => ({
                          ...prev,
                          [line.id]: { ...data, receivedQty: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border-0 bg-white px-3 py-2 text-center text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      value={data.damagedQty}
                      onChange={(e) =>
                        setReceiveData((prev) => ({
                          ...prev,
                          [line.id]: { ...data, damagedQty: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-lg border-0 bg-white px-3 py-2 text-center text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#F04452]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB] disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                const items = lines.map((line) => {
                  const d = getLineData(line.id, line);
                  return {
                    inboundOrderItemId: line.id,
                    receivedQty: d.receivedQty,
                    damagedQty: d.damagedQty,
                  };
                });
                onSubmit(items);
              }}
              className="rounded-xl bg-[#1FC47D] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18A968] disabled:opacity-50"
            >
              {isLoading ? "처리중..." : "입고 확인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function InboundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);

  const { data: order, isLoading, error } = useInboundOrder(id);

  const confirmMutation = useConfirmInbound();
  const arriveMutation = useArriveInbound();
  const receiveMutation = useReceiveInbound();

  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]">
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 주문을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const nextAction = getNextAction(order.status);
  const isMutating = confirmMutation.isPending || arriveMutation.isPending || receiveMutation.isPending;

  const handleStatusAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction === "confirm") {
        await confirmMutation.mutateAsync(id);
        addToast({ type: "success", message: "주문이 확정되었습니다." });
      } else if (confirmAction === "arrive") {
        await arriveMutation.mutateAsync(id);
        addToast({ type: "success", message: "도착 처리되었습니다." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    } finally {
      setConfirmAction(null);
    }
  };

  const handleReceive = async (items: Array<{ inboundOrderItemId: string; receivedQty: number; damagedQty: number }>) => {
    try {
      await receiveMutation.mutateAsync({
        id,
        payload: { receivedBy: user?.name || user?.email || "unknown", items },
      });
      addToast({ type: "success", message: "입고 처리가 완료되었습니다." });
      setShowReceiveModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "입고 처리 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const totalExpected = order.lines?.reduce((s, l) => s + l.expectedQty, 0) ?? 0;
  const totalReceived = order.lines?.reduce((s, l) => s + l.receivedQty, 0) ?? 0;
  const totalDamaged = order.lines?.reduce((s, l) => s + l.damagedQty, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/inbound")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">{order.orderNumber}</h1>
              <Badge status={order.status} />
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              등록일: {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {["CONFIRMED", "ARRIVED", "RECEIVING", "COMPLETED"].includes(order.status) && (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2 text-sm font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
            >
              <Printer className="h-4 w-4" />
              입고작업지시서
            </button>
          )}

          {nextAction && (
            <button
              onClick={() => {
                if (nextAction.action === "receive") {
                  setShowReceiveModal(true);
                } else {
                  setConfirmAction(nextAction.action);
                }
              }}
              disabled={isMutating}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${nextAction.color}`}
            >
              {nextAction.label}
            </button>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => {
            const state = getStepState(order.status, step.value);
            const Icon = step.icon;
            return (
              <div key={step.value} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                      state === "done"
                        ? "bg-[#1FC47D] text-white"
                        : state === "current"
                          ? "bg-[#3182F6] text-white"
                          : state === "cancelled"
                            ? "bg-[#F04452] text-white"
                            : "bg-[#F2F4F6] text-[#B0B8C1]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
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
                    className={`mx-3 h-[2px] w-12 lg:w-20 ${
                      state === "done" ? "bg-[#1FC47D]" : "bg-[#E5E8EB]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF]">
              <Warehouse className="h-5 w-5 text-[#3182F6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">입고 창고</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{order.warehouse?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{order.warehouse?.code ?? ""}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
              <Building2 className="h-5 w-5 text-[#1FC47D]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">공급처</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{order.partner?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{order.partner?.code ?? ""}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <Calendar className="h-5 w-5 text-[#FF8B00]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">일정</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">입고 예정일</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(order.expectedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">도착일</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(order.arrivedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">완료일</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(order.completedDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">예정 수량</p>
          <p className="mt-1 text-2xl font-bold text-[#191F28]">{formatNumber(totalExpected)}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">입고 수량</p>
          <p className="mt-1 text-2xl font-bold text-[#1FC47D]">{formatNumber(totalReceived)}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">파손 수량</p>
          <p className="mt-1 text-2xl font-bold text-[#F04452]">{formatNumber(totalDamaged)}</p>
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">품목 목록</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F2F4F6]">
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목코드</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목명</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">예정 수량</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">입고 수량</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">파손 수량</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">진행률</th>
              </tr>
            </thead>
            <tbody>
              {order.lines?.map((line) => {
                const pct = line.expectedQty > 0 ? Math.round((line.receivedQty / line.expectedQty) * 100) : 0;
                return (
                  <tr key={line.id} className="border-b border-[#F7F8FA] last:border-0">
                    <td className="py-4 text-sm font-medium text-[#4E5968]">{line.item?.code ?? "-"}</td>
                    <td className="py-4 text-sm text-[#191F28]">{line.item?.name ?? "-"}</td>
                    <td className="py-4 text-right text-sm font-semibold text-[#191F28]">
                      {formatNumber(line.expectedQty)}
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-[#1FC47D]">
                      {formatNumber(line.receivedQty)}
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-[#F04452]">
                      {formatNumber(line.damagedQty)}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-[#F2F4F6]">
                          <div
                            className="h-full rounded-full bg-[#1FC47D] transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#8B95A1]">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!order.lines || order.lines.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#8B95A1]">
                    등록된 품목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-3 text-lg font-bold text-[#191F28]">비고</h2>
          <p className="text-sm text-[#4E5968] whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Confirm status change modal */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleStatusAction}
        title="상태 변경"
        message={
          confirmAction === "confirm"
            ? "이 입고 주문을 확정하시겠습니까?"
            : "도착 처리를 진행하시겠습니까?"
        }
        confirmText={confirmAction === "confirm" ? "확정" : "도착 처리"}
        cancelText="취소"
        variant="warning"
        isLoading={isMutating}
      />

      {/* Receive modal */}
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        lines={order.lines ?? []}
        onSubmit={handleReceive}
        isLoading={receiveMutation.isPending}
      />
    </div>
  );
}
