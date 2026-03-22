"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Save, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useContainerGroup,
  useUpdateContainerGroup,
  useDeleteContainerGroup,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDateTime } from "@/lib/utils";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const labelClass = "mb-2 block text-sm font-medium text-[#4E5968]";

export default function ContainerGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: group, isLoading, error } = useContainerGroup(id);
  const updateMutation = useUpdateContainerGroup();
  const deleteMutation = useDeleteContainerGroup();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    groupCode: "",
    groupName: "",
    centerId: "",
    zoneId: "",
  });

  useEffect(() => {
    if (group) {
      setForm({
        groupCode: group.groupCode ?? "",
        groupName: group.groupName ?? "",
        centerId: group.centerId ?? "",
        zoneId: group.zoneId ?? "",
      });
    }
  }, [group]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.groupCode || !form.groupName) {
      addToast({ type: "error", message: "용기군코드와 용기군명은 필수입니다." });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          groupCode: form.groupCode,
          groupName: form.groupName,
          centerId: form.centerId || undefined,
          zoneId: form.zoneId || undefined,
        },
      });
      addToast({ type: "success", message: "용기군이 수정되었습니다." });
    } catch {
      addToast({ type: "error", message: "수정 중 오류가 발생했습니다." });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "용기군이 삭제되었습니다." });
      router.push("/container-groups");
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

  if (error || !group) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/container-groups")}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 용기군을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/container-groups")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#191F28]">
              {group.groupName}
            </h1>
            <p className="mt-1 text-sm text-[#8B95A1]">
              {group.groupCode} | 등록일: {formatDateTime(group.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "저장중..." : "저장"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-xl bg-[#F04452] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#D63341]"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">기본 정보</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              용기군코드 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.groupCode}
              onChange={(e) => updateField("groupCode", e.target.value)}
              className={inputBase}
              placeholder="GRP-001"
            />
          </div>
          <div>
            <label className={labelClass}>
              용기군명 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.groupName}
              onChange={(e) => updateField("groupName", e.target.value)}
              className={inputBase}
              placeholder="용기군명"
            />
          </div>
          <div>
            <label className={labelClass}>물류센터ID</label>
            <input
              value={form.centerId}
              onChange={(e) => updateField("centerId", e.target.value)}
              className={inputBase}
              placeholder="물류센터ID"
            />
          </div>
          <div>
            <label className={labelClass}>존ID</label>
            <input
              value={form.zoneId}
              onChange={(e) => updateField("zoneId", e.target.value)}
              className={inputBase}
              placeholder="존ID"
            />
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-4 text-lg font-bold text-[#191F28]">변경 이력</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex justify-between rounded-xl bg-[#F7F8FA] p-4">
            <span className="text-sm text-[#8B95A1]">등록일시</span>
            <span className="text-sm font-semibold text-[#191F28]">{formatDateTime(group.createdAt)}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-[#F7F8FA] p-4">
            <span className="text-sm text-[#8B95A1]">수정일시</span>
            <span className="text-sm font-semibold text-[#191F28]">{formatDateTime(group.updatedAt)}</span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="용기군 삭제"
        message={`"${group.groupName}" 용기군을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
