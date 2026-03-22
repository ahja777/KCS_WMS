"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Save,
  Trash2,
  CheckCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useSettlement,
  useUpdateSettlement,
  useDeleteSettlement,
  useConfirmSettlement,
  usePartners,
  useWarehouses,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type { Settlement, SettlementDetail } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";
const labelClass = "mb-2 block text-sm font-medium text-[#4E5968]";

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: settlement, isLoading, error } = useSettlement(id);
  const updateMutation = useUpdateSettlement();
  const deleteMutation = useDeleteSettlement();
  const confirmMutation = useConfirmSettlement();
  const { data: partnersRes } = usePartners({ limit: 100 });
  const { data: warehousesRes } = useWarehouses({ limit: 100 });

  const partners = partnersRes?.data ?? [];
  const warehouses = warehousesRes?.data ?? [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmSettlement, setShowConfirmSettlement] = useState(false);
  const [form, setForm] = useState({
    partnerId: "",
    warehouseId: "",
    periodFrom: "",
    periodTo: "",
    totalAmount: "",
    inboundFee: "",
    outboundFee: "",
    storageFee: "",
    handlingFee: "",
    transportFee: "",
    shuttleFee: "",
    contractDept: "",
    contractEmployee: "",
    notes: "",
  });

  useEffect(() => {
    if (settlement) {
      setForm({
        partnerId: settlement.partnerId ?? "",
        warehouseId: settlement.warehouseId ?? "",
        periodFrom: settlement.periodFrom ? settlement.periodFrom.slice(0, 10) : "",
        periodTo: settlement.periodTo ? settlement.periodTo.slice(0, 10) : "",
        totalAmount: String(settlement.totalAmount ?? ""),
        inboundFee: String(settlement.inboundFee ?? ""),
        outboundFee: String(settlement.outboundFee ?? ""),
        storageFee: String(settlement.storageFee ?? ""),
        handlingFee: String(settlement.handlingFee ?? ""),
        transportFee: String(settlement.transportFee ?? ""),
        shuttleFee: String(settlement.shuttleFee ?? ""),
        contractDept: settlement.contractDept ?? "",
        contractEmployee: settlement.contractEmployee ?? "",
        notes: settlement.notes ?? "",
      });
    }
  }, [settlement]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          partnerId: form.partnerId || undefined,
          warehouseId: form.warehouseId || undefined,
          periodFrom: form.periodFrom || undefined,
          periodTo: form.periodTo || undefined,
          totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
          inboundFee: form.inboundFee ? Number(form.inboundFee) : undefined,
          outboundFee: form.outboundFee ? Number(form.outboundFee) : undefined,
          storageFee: form.storageFee ? Number(form.storageFee) : undefined,
          handlingFee: form.handlingFee ? Number(form.handlingFee) : undefined,
          transportFee: form.transportFee ? Number(form.transportFee) : undefined,
          shuttleFee: form.shuttleFee ? Number(form.shuttleFee) : undefined,
          contractDept: form.contractDept || undefined,
          contractEmployee: form.contractEmployee || undefined,
          notes: form.notes || undefined,
        } as Partial<Settlement>,
      });
      addToast({ type: "success", message: "정산이 수정되었습니다." });
    } catch {
      addToast({ type: "error", message: "수정 중 오류가 발생했습니다." });
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(id);
      addToast({ type: "success", message: "정산이 확정되었습니다." });
    } catch {
      addToast({ type: "error", message: "확정 중 오류가 발생했습니다." });
    } finally {
      setShowConfirmSettlement(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "정산이 삭제되었습니다." });
      router.push("/settlements");
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/settlements")}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 정산을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const isEditable = settlement.status === "DRAFT" || settlement.status === "CALCULATED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/settlements")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">
                {settlement.settlementNumber || "정산 상세"}
              </h1>
              <Badge status={settlement.status} />
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              등록일: {formatDateTime(settlement.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditable && (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "저장중..." : "저장"}
            </button>
          )}
          {(settlement.status === "DRAFT" || settlement.status === "CALCULATED") && (
            <button
              onClick={() => setShowConfirmSettlement(true)}
              disabled={confirmMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-[#1FC47D] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18A968] disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              확정
            </button>
          )}
          {isEditable && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-xl bg-[#F04452] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#D63341]"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-[#8B95A1]">화주</p>
          <p className="mt-1 text-lg font-bold text-[#191F28]">{settlement.partner?.name ?? "-"}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-[#8B95A1]">창고</p>
          <p className="mt-1 text-lg font-bold text-[#191F28]">{settlement.warehouse?.name ?? "-"}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-[#8B95A1]">정산기간</p>
          <p className="mt-1 text-sm font-bold text-[#191F28]">
            {formatDate(settlement.periodFrom)} ~ {formatDate(settlement.periodTo)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-xs text-[#8B95A1]">합계금액</p>
          <p className="mt-1 text-xl font-bold text-[#3182F6]">{formatNumber(settlement.totalAmount)}원</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">정산 정보</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>화주</label>
            <select value={form.partnerId} onChange={(e) => updateField("partnerId", e.target.value)} className={selectBase} disabled={!isEditable}>
              <option value="">선택</option>
              {partners.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>창고</label>
            <select value={form.warehouseId} onChange={(e) => updateField("warehouseId", e.target.value)} className={selectBase} disabled={!isEditable}>
              <option value="">선택</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>계약부서</label>
            <input value={form.contractDept} onChange={(e) => updateField("contractDept", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>적용시작일</label>
            <input type="date" value={form.periodFrom} onChange={(e) => updateField("periodFrom", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>적용종료일</label>
            <input type="date" value={form.periodTo} onChange={(e) => updateField("periodTo", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>계약사원</label>
            <input value={form.contractEmployee} onChange={(e) => updateField("contractEmployee", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">요금 내역</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>입고료</label>
            <input type="number" value={form.inboundFee} onChange={(e) => updateField("inboundFee", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>출고료</label>
            <input type="number" value={form.outboundFee} onChange={(e) => updateField("outboundFee", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>보관료</label>
            <input type="number" value={form.storageFee} onChange={(e) => updateField("storageFee", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>하역료</label>
            <input type="number" value={form.handlingFee} onChange={(e) => updateField("handlingFee", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>운송료</label>
            <input type="number" value={form.transportFee} onChange={(e) => updateField("transportFee", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>셔틀료</label>
            <input type="number" value={form.shuttleFee} onChange={(e) => updateField("shuttleFee", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
          <div>
            <label className={labelClass}>합계금액</label>
            <input type="number" value={form.totalAmount} onChange={(e) => updateField("totalAmount", e.target.value)} className={inputBase} disabled={!isEditable} />
          </div>
        </div>
      </div>

      {/* Settlement detail lines */}
      {settlement.details && settlement.details.length > 0 && (
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-5 text-lg font-bold text-[#191F28]">정산 상세 항목</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F6]">
                  <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">NO</th>
                  <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">항목</th>
                  <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">수량</th>
                  <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">단가</th>
                  <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">금액</th>
                </tr>
              </thead>
              <tbody>
                {settlement.details.map((detail: SettlementDetail, idx: number) => (
                  <tr key={idx} className="border-b border-[#F7F8FA] last:border-0">
                    <td className="py-4 text-sm text-[#4E5968]">{idx + 1}</td>
                    <td className="py-4 text-sm text-[#191F28]">{detail.description}</td>
                    <td className="py-4 text-right text-sm text-[#4E5968]">{formatNumber(detail.quantity)}</td>
                    <td className="py-4 text-right text-sm text-[#4E5968]">{formatNumber(detail.unitPrice)}</td>
                    <td className="py-4 text-right text-sm font-semibold text-[#191F28]">{formatNumber(detail.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-4 text-lg font-bold text-[#191F28]">비고</h2>
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={4}
          disabled={!isEditable}
          className={`${inputBase} resize-none`}
          placeholder="비고 입력"
        />
      </div>

      <ConfirmModal
        isOpen={showConfirmSettlement}
        onClose={() => setShowConfirmSettlement(false)}
        onConfirm={handleConfirm}
        title="정산 확정"
        message="이 정산을 확정하시겠습니까? 확정 후에는 수정할 수 없습니다."
        confirmText="확정"
        cancelText="취소"
        variant="warning"
        isLoading={confirmMutation.isPending}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="정산 삭제"
        message="이 정산을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
