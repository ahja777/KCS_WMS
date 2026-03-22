"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Warehouse,
  Clock,
  AlertCircle,
  Save,
  Trash2,
  Lock,
  Play,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  usePeriodClose,
  useUpdatePeriodClose,
  useDeletePeriodClose,
  useExecutePeriodClose,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function PeriodCloseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: periodClose, isLoading, error } = usePeriodClose(id);
  const updateMutation = useUpdatePeriodClose();
  const deleteMutation = useDeletePeriodClose();
  const executeMutation = useExecutePeriodClose();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
      </div>
    );
  }

  if (error || !periodClose) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 마감관리 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const currentNotes = notes ?? periodClose.notes ?? "";

  const statusColor: Record<string, string> = {
    OPEN: "bg-[#E8F2FF] text-[#3182F6]",
    CLOSED: "bg-[#E8F7EF] text-[#1FC47D]",
    LOCKED: "bg-[#FFEAED] text-[#F04452]",
  };

  const statusLabel: Record<string, string> = {
    OPEN: "진행중",
    CLOSED: "마감완료",
    LOCKED: "잠김",
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          notes: currentNotes || undefined,
        },
      });
      addToast({ type: "success", message: "마감관리 정보가 저장되었습니다." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const handleExecute = async () => {
    try {
      await executeMutation.mutateAsync(id);
      addToast({ type: "success", message: "마감이 실행되었습니다." });
      setShowExecuteModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "마감실행 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "마감이 삭제되었습니다." });
      router.push("/period-close");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.";
      addToast({ type: "error", message: msg });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const isMutating = updateMutation.isPending || deleteMutation.isPending || executeMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/period-close")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">마감관리 상세</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor[periodClose.status] ?? "bg-[#F2F4F6] text-[#4E5968]"}`}
              >
                {periodClose.status === "LOCKED" && <Lock className="mr-1 h-3 w-3" />}
                {statusLabel[periodClose.status] ?? periodClose.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              기준관리 &gt; 마감관리 &gt; 상세
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isMutating || periodClose.status === "LOCKED"}
            className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
          {periodClose.status === "OPEN" && (
            <button
              onClick={() => setShowExecuteModal(true)}
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18A968] disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              마감실행
            </button>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isMutating || periodClose.status === "LOCKED"}
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
              <CalendarCheck className="h-5 w-5 text-[#3182F6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">마감기간</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">시작일</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(periodClose.periodFrom)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">종료일</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(periodClose.periodTo)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
              <Warehouse className="h-5 w-5 text-[#1FC47D]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">창고</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">{periodClose.warehouse?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-[#8B95A1]">{periodClose.warehouse?.code ?? ""}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <Clock className="h-5 w-5 text-[#FF8B00]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">마감 처리</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">처리자</span>
              <span className="text-sm font-semibold text-[#191F28]">{periodClose.closedBy ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">처리일시</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDateTime(periodClose.closedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail form */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">상세 정보</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">상태</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor[periodClose.status] ?? "bg-[#F2F4F6] text-[#4E5968]"}`}
              >
                {statusLabel[periodClose.status] ?? periodClose.status}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">등록일시</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {formatDateTime(periodClose.createdAt)}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">마감시작일</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {formatDate(periodClose.periodFrom)}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">마감종료일</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {formatDate(periodClose.periodTo)}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">마감처리자</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {periodClose.closedBy ?? "-"}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">마감처리일시</label>
            <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28]">
              {formatDateTime(periodClose.closedAt)}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">비고</label>
            <textarea
              rows={4}
              value={currentNotes}
              disabled={periodClose.status === "LOCKED"}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="비고를 입력해주세요."
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Execute confirm modal */}
      <ConfirmModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onConfirm={handleExecute}
        title="마감 실행"
        message="마감을 실행하시겠습니까? 마감 실행 후에는 해당 기간의 데이터를 수정할 수 없습니다."
        confirmText="마감실행"
        cancelText="취소"
        variant="warning"
        isLoading={executeMutation.isPending}
      />

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="마감 삭제"
        message="이 마감 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
