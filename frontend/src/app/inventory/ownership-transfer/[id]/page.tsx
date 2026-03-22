"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  Package,
  Building2,
  AlertCircle,
  Save,
  Trash2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useOwnershipTransfer,
  useUpdateOwnershipTransfer,
  useDeleteOwnershipTransfer,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";

export default function OwnershipTransferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: transfer, isLoading, error } = useOwnershipTransfer(id);
  const updateMutation = useUpdateOwnershipTransfer();
  const deleteMutation = useDeleteOwnershipTransfer();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [quantity, setQuantity] = useState<number | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 명의변경 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const currentQty = quantity ?? transfer.quantity;
  const currentNotes = notes ?? transfer.notes ?? "";

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          quantity: currentQty,
          notes: currentNotes || undefined,
        },
      });
      addToast({ type: "success", message: "명의변경 정보가 저장되었습니다." });
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "명의변경이 삭제되었습니다." });
      router.push("/inventory/ownership-transfer");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const isMutating = updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/inventory/ownership-transfer")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#191F28]">
              {transfer.transferNumber}
            </h1>
            <p className="mt-1 text-sm text-[#8B95A1]">
              등록일: {formatDateTime(transfer.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isMutating}
            className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isMutating}
            className="flex items-center gap-2 rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#D63341] disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        </div>
      </div>

      {/* Transfer info */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF]">
              <ArrowRightLeft className="h-5 w-5 text-[#3182F6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">변경번호</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{transfer.transferNumber}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <Calendar className="h-5 w-5 text-[#FF8B00]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">변경일자</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{formatDate(transfer.transferDate)}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
              <Package className="h-5 w-5 text-[#1FC47D]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">수량</h3>
          </div>
          <input
            type="number"
            min={0}
            value={currentQty}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-lg font-bold text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
          />
        </div>
      </div>

      {/* From / To side by side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* From (양도자) */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFEAED]">
              <Building2 className="h-4 w-4 text-[#F04452]" />
            </div>
            <h2 className="text-lg font-bold text-[#191F28]">양도자 (From)</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium text-[#8B95A1]">화주</p>
              <p className="mt-1 text-sm font-semibold text-[#191F28]">
                {transfer.fromPartner?.name ?? "-"}
              </p>
              <p className="text-xs text-[#8B95A1]">{transfer.fromPartner?.code ?? ""}</p>
            </div>
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium text-[#8B95A1]">상품</p>
              <p className="mt-1 text-sm font-semibold text-[#191F28]">
                {transfer.item?.name ?? "-"}
              </p>
              <p className="text-xs text-[#8B95A1]">{transfer.item?.code ?? ""}</p>
            </div>
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium text-[#8B95A1]">수량</p>
              <p className="mt-1 text-sm font-semibold text-[#191F28]">
                {formatNumber(transfer.quantity)} {transfer.item?.uom ?? ""}
              </p>
            </div>
            {transfer.lotNumber && (
              <div className="rounded-xl bg-[#F7F8FA] p-4">
                <p className="text-xs font-medium text-[#8B95A1]">LOT번호</p>
                <p className="mt-1 text-sm font-semibold text-[#191F28]">{transfer.lotNumber}</p>
              </div>
            )}
            {transfer.locationCode && (
              <div className="rounded-xl bg-[#F7F8FA] p-4">
                <p className="text-xs font-medium text-[#8B95A1]">로케이션</p>
                <p className="mt-1 text-sm font-semibold text-[#191F28]">{transfer.locationCode}</p>
              </div>
            )}
          </div>
        </div>

        {/* To (양수자) */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F7EF]">
              <Building2 className="h-4 w-4 text-[#1FC47D]" />
            </div>
            <h2 className="text-lg font-bold text-[#191F28]">양수자 (To)</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium text-[#8B95A1]">화주</p>
              <p className="mt-1 text-sm font-semibold text-[#191F28]">
                {transfer.toPartner?.name ?? "-"}
              </p>
              <p className="text-xs text-[#8B95A1]">{transfer.toPartner?.code ?? ""}</p>
            </div>
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium text-[#8B95A1]">상품</p>
              <p className="mt-1 text-sm font-semibold text-[#191F28]">
                {transfer.item?.name ?? "-"}
              </p>
              <p className="text-xs text-[#8B95A1]">{transfer.item?.code ?? ""}</p>
            </div>
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium text-[#8B95A1]">수량</p>
              <p className="mt-1 text-sm font-semibold text-[#191F28]">
                {formatNumber(currentQty)} {transfer.item?.uom ?? ""}
              </p>
            </div>
            <div className="rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium text-[#8B95A1]">창고</p>
              <p className="mt-1 text-sm font-semibold text-[#191F28]">
                {transfer.warehouse?.name ?? "-"}
              </p>
              <p className="text-xs text-[#8B95A1]">{transfer.warehouse?.code ?? ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">추가 정보</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">처리자</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {transfer.transferredBy ?? "-"}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">최종수정일</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {formatDateTime(transfer.updatedAt)}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">비고</label>
            <textarea
              rows={3}
              value={currentNotes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="비고를 입력해주세요."
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="명의변경 삭제"
        message="이 명의변경 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
