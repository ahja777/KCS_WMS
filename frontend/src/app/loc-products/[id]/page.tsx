"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Package,
  Warehouse,
  AlertCircle,
  Save,
  Trash2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useLocationProduct,
  useUpdateLocationProduct,
  useDeleteLocationProduct,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDateTime } from "@/lib/utils";

export default function LocProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: locProduct, isLoading, error } = useLocationProduct(id);
  const updateMutation = useUpdateLocationProduct();
  const deleteMutation = useDeleteLocationProduct();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [priority, setPriority] = useState<number | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
      </div>
    );
  }

  if (error || !locProduct) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> LOC별입고상품 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const currentPriority = priority ?? locProduct.priority ?? 0;
  const currentNotes = notes ?? locProduct.notes ?? "";

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          priority: currentPriority,
          notes: currentNotes || undefined,
        },
      });
      addToast({ type: "success", message: "LOC별입고상품 정보가 저장되었습니다." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "LOC별입고상품이 삭제되었습니다." });
      router.push("/loc-products");
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
            onClick={() => router.push("/loc-products")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">
                LOC별입고상품 상세
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              기준관리 &gt; LOC별입고상품등록 &gt; 상세
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

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF]">
              <MapPin className="h-5 w-5 text-[#3182F6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">로케이션</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{locProduct.locationCode}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
              <Warehouse className="h-5 w-5 text-[#1FC47D]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">물류센터</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{locProduct.warehouse?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{locProduct.warehouse?.code ?? ""}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <Package className="h-5 w-5 text-[#FF8B00]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">상품</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{locProduct.item?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{locProduct.item?.code ?? ""}</p>
        </div>
      </div>

      {/* Item detail info */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">상품 상세정보</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-xs font-medium text-[#8B95A1]">상품코드</p>
            <p className="mt-1 text-sm font-semibold text-[#191F28]">{locProduct.item?.code ?? "-"}</p>
          </div>
          <div className="rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-xs font-medium text-[#8B95A1]">상품명</p>
            <p className="mt-1 text-sm font-semibold text-[#191F28]">{locProduct.item?.name ?? "-"}</p>
          </div>
          <div className="rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-xs font-medium text-[#8B95A1]">카테고리</p>
            <p className="mt-1 text-sm font-semibold text-[#191F28]">{locProduct.item?.category ?? "-"}</p>
          </div>
          <div className="rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-xs font-medium text-[#8B95A1]">바코드</p>
            <p className="mt-1 text-sm font-semibold text-[#191F28]">{locProduct.item?.barcode ?? "-"}</p>
          </div>
          <div className="rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-xs font-medium text-[#8B95A1]">UOM</p>
            <p className="mt-1 text-sm font-semibold text-[#191F28]">{locProduct.item?.uom ?? "-"}</p>
          </div>
          <div className="rounded-xl bg-[#F7F8FA] p-4">
            <p className="text-xs font-medium text-[#8B95A1]">보관타입</p>
            <p className="mt-1 text-sm font-semibold text-[#191F28]">{locProduct.item?.storageType ?? "-"}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">설정 정보</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">우선순위</label>
            <input
              type="number"
              min={0}
              value={currentPriority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">최종수정일</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {formatDateTime(locProduct.updatedAt)}
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
        title="입고상품 삭제"
        message="이 LOC별입고상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
