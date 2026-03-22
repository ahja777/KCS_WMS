"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Warehouse,
  Calendar,
  AlertCircle,
  Save,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useAssembly,
  useUpdateAssembly,
  useDeleteAssembly,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";

export default function AssemblyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: assembly, isLoading, error } = useAssembly(id);
  const updateMutation = useUpdateAssembly();
  const deleteMutation = useDeleteAssembly();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
      </div>
    );
  }

  if (error || !assembly) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 임가공 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const currentNotes = notes ?? assembly.notes ?? "";
  const inputItems = assembly.items?.filter((i) => i.type === "INPUT") ?? [];
  const outputItems = assembly.items?.filter((i) => i.type === "OUTPUT") ?? [];

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          notes: currentNotes || undefined,
        },
      });
      addToast({ type: "success", message: "임가공 정보가 저장되었습니다." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "임가공이 삭제되었습니다." });
      router.push("/inventory/assembly");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const isMutating = updateMutation.isPending || deleteMutation.isPending;

  const statusColor: Record<string, string> = {
    DRAFT: "bg-[#F2F4F6] text-[#4E5968]",
    IN_PROGRESS: "bg-[#E8F2FF] text-[#3182F6]",
    COMPLETED: "bg-[#E8F7EF] text-[#1FC47D]",
    CANCELLED: "bg-[#FFEAED] text-[#F04452]",
  };

  const statusLabel: Record<string, string> = {
    DRAFT: "초안",
    IN_PROGRESS: "진행중",
    COMPLETED: "완료",
    CANCELLED: "취소",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/inventory/assembly")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">
                {assembly.assemblyNumber}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor[assembly.status] ?? "bg-[#F2F4F6] text-[#4E5968]"}`}
              >
                {statusLabel[assembly.status] ?? assembly.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              등록일: {formatDateTime(assembly.createdAt)}
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
              <Boxes className="h-5 w-5 text-[#3182F6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">작업번호</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{assembly.assemblyNumber}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
              <Warehouse className="h-5 w-5 text-[#1FC47D]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">창고</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{assembly.warehouse?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{assembly.warehouse?.code ?? ""}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <Calendar className="h-5 w-5 text-[#FF8B00]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">작업일자</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{formatDate(assembly.assemblyDate)}</p>
          <p className="mt-2 text-sm text-[#8B95A1]">
            담당자: {assembly.assembledBy ?? "-"}
          </p>
        </div>
      </div>

      {/* Input / Output materials side by side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Input materials */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFEAED]">
              <ArrowDownToLine className="h-4 w-4 text-[#F04452]" />
            </div>
            <h2 className="text-lg font-bold text-[#191F28]">투입 자재 (INPUT)</h2>
            <span className="ml-auto rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#4E5968]">
              {inputItems.length}건
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F6]">
                  <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목코드</th>
                  <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목명</th>
                  <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">수량</th>
                </tr>
              </thead>
              <tbody>
                {inputItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#F7F8FA] last:border-0">
                    <td className="py-3 text-sm font-medium text-[#4E5968]">{item.item?.code ?? "-"}</td>
                    <td className="py-3 text-sm text-[#191F28]">{item.item?.name ?? "-"}</td>
                    <td className="py-3 text-right text-sm font-semibold text-[#F04452]">
                      {formatNumber(item.quantity)}
                    </td>
                  </tr>
                ))}
                {inputItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-[#8B95A1]">
                      투입 자재가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Output materials */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F7EF]">
              <ArrowUpFromLine className="h-4 w-4 text-[#1FC47D]" />
            </div>
            <h2 className="text-lg font-bold text-[#191F28]">완성품 (OUTPUT)</h2>
            <span className="ml-auto rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#4E5968]">
              {outputItems.length}건
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F2F4F6]">
                  <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목코드</th>
                  <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목명</th>
                  <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">수량</th>
                </tr>
              </thead>
              <tbody>
                {outputItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#F7F8FA] last:border-0">
                    <td className="py-3 text-sm font-medium text-[#4E5968]">{item.item?.code ?? "-"}</td>
                    <td className="py-3 text-sm text-[#191F28]">{item.item?.name ?? "-"}</td>
                    <td className="py-3 text-right text-sm font-semibold text-[#1FC47D]">
                      {formatNumber(item.quantity)}
                    </td>
                  </tr>
                ))}
                {outputItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-[#8B95A1]">
                      완성품이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-4 text-lg font-bold text-[#191F28]">비고</h2>
        <textarea
          rows={4}
          value={currentNotes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="비고를 입력해주세요."
          className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
        />
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="임가공 삭제"
        message="이 임가공 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
