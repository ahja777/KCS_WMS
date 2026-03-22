"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Box, Save, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useContainer,
  useUpdateContainer,
  useDeleteContainer,
  useContainerGroups,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDateTime } from "@/lib/utils";
import type { Container, ContainerGroup } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";
const labelClass = "mb-2 block text-sm font-medium text-[#4E5968]";
const sectionTitle =
  "col-span-full text-base font-bold text-[#191F28] border-b border-[#E5E8EB] pb-2 pt-4";

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: container, isLoading, error } = useContainer(id);
  const updateMutation = useUpdateContainer();
  const deleteMutation = useDeleteContainer();
  const { data: groupRes } = useContainerGroups({ limit: 100 });
  const containerGroups = groupRes?.data ?? [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    containerCode: "",
    containerName: "",
    containerGroupId: "",
    weight: "",
    partnerName: "",
    size: "",
    notes: "",
    optimalStock: "",
    stockUnit: "",
    isActive: true,
    shelfLife: "",
    optimalStockDays: "",
    expiryDays: "",
    inboundWarehouseCode: "",
    inboundZone: "",
    unitPrice: "",
    assetType: "",
    tagPrefix: "",
    companyEpcCode: "",
    barcode: "",
    weightToleranceKg: "",
  });

  useEffect(() => {
    if (container) {
      setForm({
        containerCode: container.containerCode ?? "",
        containerName: container.containerName ?? "",
        containerGroupId: container.containerGroupId ?? "",
        weight: String(container.weight ?? ""),
        partnerName: container.partner?.name ?? "",
        size: container.size ?? "",
        notes: container.notes ?? "",
        optimalStock: String(container.optimalStock ?? ""),
        stockUnit: container.stockUnit ?? "",
        isActive: container.isActive ?? true,
        shelfLife: String(container.shelfLife ?? ""),
        optimalStockDays: String(container.optimalStockDays ?? ""),
        expiryDays: String(container.expiryDays ?? ""),
        inboundWarehouseCode: container.inboundWarehouseCode ?? "",
        inboundZone: container.inboundZone ?? "",
        unitPrice: String(container.unitPrice ?? ""),
        assetType: container.assetType ?? "",
        tagPrefix: container.tagPrefix ?? "",
        companyEpcCode: container.companyEpcCode ?? "",
        barcode: container.barcode ?? "",
        weightToleranceKg: String(container.weightToleranceKg ?? ""),
      });
    }
  }, [container]);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const payload: Partial<Container> = {
      containerCode: form.containerCode,
      containerName: form.containerName,
      containerGroupId: form.containerGroupId || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      size: form.size || undefined,
      notes: form.notes || undefined,
      optimalStock: form.optimalStock ? Number(form.optimalStock) : undefined,
      stockUnit: form.stockUnit || undefined,
      isActive: form.isActive,
      shelfLife: form.shelfLife ? Number(form.shelfLife) : undefined,
      optimalStockDays: form.optimalStockDays ? Number(form.optimalStockDays) : undefined,
      expiryDays: form.expiryDays ? Number(form.expiryDays) : undefined,
      inboundWarehouseCode: form.inboundWarehouseCode || undefined,
      inboundZone: form.inboundZone || undefined,
      unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
      assetType: form.assetType || undefined,
      tagPrefix: form.tagPrefix || undefined,
      companyEpcCode: form.companyEpcCode || undefined,
      barcode: form.barcode || undefined,
      weightToleranceKg: form.weightToleranceKg ? Number(form.weightToleranceKg) : undefined,
    };
    try {
      await updateMutation.mutateAsync({ id, payload });
      addToast({ type: "success", message: "물류용기가 수정되었습니다." });
    } catch {
      addToast({ type: "error", message: "수정 중 오류가 발생했습니다." });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "물류용기가 삭제되었습니다." });
      router.push("/containers");
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

  if (error || !container) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/containers")}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 물류용기를 찾을 수 없습니다.
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
            onClick={() => router.push("/containers")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">
                {container.containerName}
              </h1>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  container.isActive
                    ? "bg-[#E8F7EF] text-[#1FC47D]"
                    : "bg-[#F2F4F6] text-[#8B95A1]"
                }`}
              >
                {container.isActive ? "사용" : "미사용"}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              {container.containerCode} | 등록일: {formatDateTime(container.createdAt)}
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
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 기본 */}
          <div className={sectionTitle}>기본 정보</div>
          <div>
            <label className={labelClass}>용기코드 <span className="text-red-500">*</span></label>
            <input value={form.containerCode} onChange={(e) => updateField("containerCode", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>용기명 <span className="text-red-500">*</span></label>
            <input value={form.containerName} onChange={(e) => updateField("containerName", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>용기군</label>
            <select value={form.containerGroupId} onChange={(e) => updateField("containerGroupId", e.target.value)} className={selectBase}>
              <option value="">선택</option>
              {containerGroups.map((g: ContainerGroup) => (
                <option key={g.id} value={g.id}>{g.groupName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>화주명</label>
            <input value={form.partnerName} onChange={(e) => updateField("partnerName", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>사용유무</label>
            <select value={form.isActive ? "Y" : "N"} onChange={(e) => updateField("isActive", e.target.value === "Y")} className={selectBase}>
              <option value="Y">사용</option>
              <option value="N">미사용</option>
            </select>
          </div>

          {/* 규격 */}
          <div className={sectionTitle}>규격</div>
          <div>
            <label className={labelClass}>용기중량 (kg)</label>
            <input type="number" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>용기크기</label>
            <select value={form.size} onChange={(e) => updateField("size", e.target.value)} className={selectBase}>
              <option value="">선택</option>
              <option value="S">소형</option>
              <option value="M">중형</option>
              <option value="L">대형</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>용기단가</label>
            <input type="number" value={form.unitPrice} onChange={(e) => updateField("unitPrice", e.target.value)} className={inputBase} />
          </div>

          {/* 관리 */}
          <div className={sectionTitle}>재고 관리</div>
          <div>
            <label className={labelClass}>적정재고</label>
            <input type="number" value={form.optimalStock} onChange={(e) => updateField("optimalStock", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>재고단위</label>
            <select value={form.stockUnit} onChange={(e) => updateField("stockUnit", e.target.value)} className={selectBase}>
              <option value="">선택</option>
              <option value="EA">EA</option>
              <option value="BOX">BOX</option>
              <option value="PLT">PLT</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>적정재고일수</label>
            <input type="number" value={form.optimalStockDays} onChange={(e) => updateField("optimalStockDays", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>유통기간</label>
            <input value={form.shelfLife} onChange={(e) => updateField("shelfLife", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>유효기간일수</label>
            <input type="number" value={form.expiryDays} onChange={(e) => updateField("expiryDays", e.target.value)} className={inputBase} />
          </div>

          {/* 입고 */}
          <div className={sectionTitle}>입고 정보</div>
          <div>
            <label className={labelClass}>입고창고코드</label>
            <input value={form.inboundWarehouseCode} onChange={(e) => updateField("inboundWarehouseCode", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>입고존</label>
            <input value={form.inboundZone} onChange={(e) => updateField("inboundZone", e.target.value)} className={inputBase} />
          </div>

          {/* 기타 */}
          <div className={sectionTitle}>기타 정보</div>
          <div>
            <label className={labelClass}>자산TYPE</label>
            <select value={form.assetType} onChange={(e) => updateField("assetType", e.target.value)} className={selectBase}>
              <option value="">선택</option>
              <option value="OWN">자사</option>
              <option value="RENTAL">임대</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>TAG PREFIX</label>
            <input value={form.tagPrefix} onChange={(e) => updateField("tagPrefix", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>회사EPC코드</label>
            <input value={form.companyEpcCode} onChange={(e) => updateField("companyEpcCode", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>용기바코드</label>
            <input value={form.barcode} onChange={(e) => updateField("barcode", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>무게오차허용범위 (kg)</label>
            <input type="number" step="0.1" value={form.weightToleranceKg} onChange={(e) => updateField("weightToleranceKg", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>비고</label>
            <input value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className={inputBase} />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="물류용기 삭제"
        message={`"${container.containerName}" 용기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
