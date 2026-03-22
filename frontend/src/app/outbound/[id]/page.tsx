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
  ClipboardList,
  PackageCheck,
  Truck,
  AlertCircle,
  Printer,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useOutboundOrder,
  useConfirmOutbound,
  usePickOutbound,
  useShipOutbound,
  useDeliverOutbound,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type { OutboundOrderLine } from "@/types";

// ─── Status workflow ────────────────────────────────────────
const statusSteps = [
  { value: "DRAFT", label: "초안", icon: FileText },
  { value: "CONFIRMED", label: "확정", icon: CheckCircle },
  { value: "PICKING", label: "피킹", icon: ClipboardList },
  { value: "PACKING", label: "패킹", icon: PackageCheck },
  { value: "SHIPPED", label: "출하", icon: Truck },
  { value: "DELIVERED", label: "배송완료", icon: Package },
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
      return { label: "피킹 처리", action: "pick" as const, color: "bg-[#FF8B00] hover:bg-[#E67A00]" };
    case "PICKING":
      return { label: "출하 처리", action: "ship" as const, color: "bg-[#3182F6] hover:bg-[#1B64DA]" };
    case "SHIPPED":
      return { label: "배송 완료", action: "deliver" as const, color: "bg-[#1FC47D] hover:bg-[#18A968]" };
    default:
      return null;
  }
}

// ─── Pick modal ─────────────────────────────────────────────
function PickModal({
  isOpen,
  onClose,
  lines,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  lines: OutboundOrderLine[];
  onSubmit: (items: Array<{ outboundOrderItemId: string; pickedQty: number }>) => void;
  isLoading: boolean;
}) {
  const [pickData, setPickData] = useState<Record<string, number>>({});

  const getPickedQty = (lineId: string, line: OutboundOrderLine) =>
    pickData[lineId] ?? line.orderedQty;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-modal-in">
        <div className="flex items-center justify-between px-7 pt-7 pb-2">
          <h2 className="text-xl font-bold text-[#191F28]">피킹 처리</h2>
        </div>
        <div className="p-7">
          <div className="mb-4 rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-sm text-[#6B7684]">각 품목별 실제 피킹 수량을 입력해주세요.</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-[#8B95A1] px-1">
              <div className="col-span-5">품목</div>
              <div className="col-span-3 text-right">주문 수량</div>
              <div className="col-span-4 text-center">피킹 수량</div>
            </div>
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-12 items-center gap-3 rounded-xl bg-[#F7F8FA] p-3">
                <div className="col-span-5">
                  <p className="text-sm font-medium text-[#191F28]">{line.item?.name ?? "품목"}</p>
                  <p className="text-xs text-[#8B95A1]">{line.item?.code ?? "-"}</p>
                </div>
                <div className="col-span-3 text-right text-sm font-semibold text-[#4E5968]">
                  {formatNumber(line.orderedQty)}
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    min={0}
                    value={getPickedQty(line.id, line)}
                    onChange={(e) =>
                      setPickData((prev) => ({ ...prev, [line.id]: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border-0 bg-white px-3 py-2 text-center text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
                  />
                </div>
              </div>
            ))}
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
                const items = lines.map((line) => ({
                  outboundOrderItemId: line.id,
                  pickedQty: getPickedQty(line.id, line),
                }));
                onSubmit(items);
              }}
              className="rounded-xl bg-[#FF8B00] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E67A00] disabled:opacity-50"
            >
              {isLoading ? "처리중..." : "피킹 확인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ship modal ─────────────────────────────────────────────
function ShipModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { carrier: string; trackingNumber: string; notes: string }) => void;
  isLoading: boolean;
}) {
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const inputBase =
    "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-modal-in">
        <div className="flex items-center justify-between px-7 pt-7 pb-2">
          <h2 className="text-xl font-bold text-[#191F28]">출하 처리</h2>
        </div>
        <div className="p-7 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">운송사</label>
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="운송사 입력"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">운송장번호</label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="운송장번호 입력"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">비고</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="비고 입력"
              rows={3}
              className={`${inputBase} resize-none`}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
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
              onClick={() => onSubmit({ carrier, trackingNumber, notes })}
              className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
            >
              {isLoading ? "처리중..." : "출하 확인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function OutboundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);

  const { data: order, isLoading, error } = useOutboundOrder(id);

  const confirmMutation = useConfirmOutbound();
  const pickMutation = usePickOutbound();
  const shipMutation = useShipOutbound();
  const deliverMutation = useDeliverOutbound();

  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [showPickModal, setShowPickModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);

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
  const isMutating = confirmMutation.isPending || pickMutation.isPending || shipMutation.isPending || deliverMutation.isPending;

  const handleStatusAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction === "confirm") {
        await confirmMutation.mutateAsync(id);
        addToast({ type: "success", message: "주문이 확정되었습니다." });
      } else if (confirmAction === "deliver") {
        await deliverMutation.mutateAsync(id);
        addToast({ type: "success", message: "배송 완료 처리되었습니다." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    } finally {
      setConfirmAction(null);
    }
  };

  const handlePick = async (items: Array<{ outboundOrderItemId: string; pickedQty: number }>) => {
    try {
      await pickMutation.mutateAsync({
        id,
        payload: { pickedBy: user?.name || user?.email || "unknown", items },
      });
      addToast({ type: "success", message: "피킹 처리가 완료되었습니다." });
      setShowPickModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "피킹 처리 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const handleShip = async (data: { carrier: string; trackingNumber: string; notes: string }) => {
    try {
      await shipMutation.mutateAsync({
        id,
        payload: { shippedBy: user?.name || user?.email || "unknown", ...data },
      });
      addToast({ type: "success", message: "출하 처리가 완료되었습니다." });
      setShowShipModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "출하 처리 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const totalOrdered = order.lines?.reduce((s, l) => s + l.orderedQty, 0) ?? 0;
  const totalPicked = order.lines?.reduce((s, l) => s + l.pickedQty, 0) ?? 0;
  const totalShipped = order.lines?.reduce((s, l) => s + l.shippedQty, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/outbound")}
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
          {["PICKING", "PACKING", "SHIPPED", "DELIVERED"].includes(order.status) && (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2 text-sm font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
            >
              <Printer className="h-4 w-4" />
              피킹리스트
            </button>
          )}

          {["SHIPPED", "DELIVERED"].includes(order.status) && (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2 text-sm font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
            >
              <Printer className="h-4 w-4" />
              상차리스트
            </button>
          )}

          {nextAction && (
            <button
              onClick={() => {
                if (nextAction.action === "pick") setShowPickModal(true);
                else if (nextAction.action === "ship") setShowShipModal(true);
                else setConfirmAction(nextAction.action);
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
                    className={`mx-2 h-[2px] w-8 lg:w-16 ${
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
            <h3 className="text-sm font-semibold text-[#8B95A1]">출고 창고</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{order.warehouse?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{order.warehouse?.code ?? ""}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
              <Building2 className="h-5 w-5 text-[#1FC47D]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">고객사</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{order.partner?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{order.partner?.code ?? ""}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <Calendar className="h-5 w-5 text-[#FF8B00]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">일정 / 배송</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">출고일</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(order.shipDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">배송일</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(order.deliveryDate)}</span>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-[#8B95A1]">운송장</span>
                <span className="inline-flex rounded-lg bg-[#E8F3FF] px-2.5 py-1 text-xs font-semibold text-[#3182F6]">
                  {order.trackingNumber}
                </span>
              </div>
            )}
            {order.shippingMethod && (
              <div className="flex justify-between">
                <span className="text-sm text-[#8B95A1]">배송방법</span>
                <span className="text-sm font-semibold text-[#191F28]">{order.shippingMethod}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">주문 수량</p>
          <p className="mt-1 text-2xl font-bold text-[#191F28]">{formatNumber(totalOrdered)}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">피킹 수량</p>
          <p className="mt-1 text-2xl font-bold text-[#FF8B00]">{formatNumber(totalPicked)}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">출하 수량</p>
          <p className="mt-1 text-2xl font-bold text-[#1FC47D]">{formatNumber(totalShipped)}</p>
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
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">주문 수량</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">피킹 수량</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">패킹 수량</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">출하 수량</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">진행률</th>
              </tr>
            </thead>
            <tbody>
              {order.lines?.map((line) => {
                const pct = line.orderedQty > 0 ? Math.round((line.shippedQty / line.orderedQty) * 100) : 0;
                return (
                  <tr key={line.id} className="border-b border-[#F7F8FA] last:border-0">
                    <td className="py-4 text-sm font-medium text-[#4E5968]">{line.item?.code ?? "-"}</td>
                    <td className="py-4 text-sm text-[#191F28]">{line.item?.name ?? "-"}</td>
                    <td className="py-4 text-right text-sm font-semibold text-[#191F28]">
                      {formatNumber(line.orderedQty)}
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-[#FF8B00]">
                      {formatNumber(line.pickedQty)}
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-[#3182F6]">
                      {formatNumber(line.packedQty)}
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-[#1FC47D]">
                      {formatNumber(line.shippedQty)}
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
                  <td colSpan={7} className="py-8 text-center text-sm text-[#8B95A1]">
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
            ? "이 출고 주문을 확정하시겠습니까? 재고가 예약됩니다."
            : "배송 완료 처리를 하시겠습니까?"
        }
        confirmText={confirmAction === "confirm" ? "확정" : "배송 완료"}
        cancelText="취소"
        variant="warning"
        isLoading={isMutating}
      />

      {/* Pick modal */}
      <PickModal
        isOpen={showPickModal}
        onClose={() => setShowPickModal(false)}
        lines={order.lines ?? []}
        onSubmit={handlePick}
        isLoading={pickMutation.isPending}
      />

      {/* Ship modal */}
      <ShipModal
        isOpen={showShipModal}
        onClose={() => setShowShipModal(false)}
        onSubmit={handleShip}
        isLoading={shipMutation.isPending}
      />
    </div>
  );
}
