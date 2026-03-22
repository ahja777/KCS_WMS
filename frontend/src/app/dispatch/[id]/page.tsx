"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Save,
  Trash2,
  Truck,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useDispatch,
  useUpdateDispatch,
  useDeleteDispatch,
  useVehicles,
  useWarehouses,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type { Vehicle } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";
const labelClass = "mb-2 block text-sm font-medium text-[#4E5968]";

export default function DispatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const addToast = useToastStore((s) => s.addToast);

  const { data: dispatch, isLoading, error } = useDispatch(id);
  const updateMutation = useUpdateDispatch();
  const deleteMutation = useDeleteDispatch();
  const { data: vehiclesRes } = useVehicles({ limit: 100 });
  const { data: warehousesRes } = useWarehouses({ limit: 100 });

  const vehicles = vehiclesRes?.data ?? [];
  const warehouses = warehousesRes?.data ?? [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "",
    warehouseId: "",
    dispatchDate: "",
    dispatchSeq: "1",
    notes: "",
  });

  useEffect(() => {
    if (dispatch) {
      setForm({
        vehicleId: dispatch.vehicleId ?? "",
        warehouseId: dispatch.warehouseId ?? "",
        dispatchDate: dispatch.dispatchDate ? String(dispatch.dispatchDate).slice(0, 10) : "",
        dispatchSeq: String(dispatch.dispatchSeq ?? "1"),
        notes: dispatch.notes ?? "",
      });
    }
  }, [dispatch]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          vehicleId: form.vehicleId || undefined,
          warehouseId: form.warehouseId || undefined,
          dispatchDate: form.dispatchDate || undefined,
          dispatchSeq: form.dispatchSeq ? Number(form.dispatchSeq) : undefined,
          notes: form.notes || undefined,
        },
      });
      addToast({ type: "success", message: "배차가 수정되었습니다." });
    } catch {
      addToast({ type: "error", message: "수정 중 오류가 발생했습니다." });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: "success", message: "배차가 삭제되었습니다." });
      router.push("/dispatch");
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

  if (error || !dispatch) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/dispatch")}
          className="flex items-center gap-2 text-sm text-[#6B7684] hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" /> 배차를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const items = dispatch.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dispatch")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7684] shadow-sm transition-colors hover:bg-[#F7F8FA]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#191F28]">
                배차 상세
              </h1>
              <Badge status={dispatch.status} />
            </div>
            <p className="mt-1 text-sm text-[#8B95A1]">
              {dispatch.vehicle?.plateNumber ?? "차량미지정"} |
              배차일: {formatDate(dispatch.dispatchDate)} |
              등록일: {formatDateTime(dispatch.createdAt)}
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

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF]">
              <Truck className="h-5 w-5 text-[#3182F6]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">차량 정보</h3>
          </div>
          <p className="text-lg font-bold text-[#191F28]">
            {dispatch.vehicle?.plateNumber ?? "-"}
          </p>
          <p className="mt-1 text-sm text-[#8B95A1]">
            {dispatch.vehicle?.driverName ?? "-"} | {dispatch.vehicle?.tonnage ?? 0}T
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
              <Truck className="h-5 w-5 text-[#FF8B00]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">배차 정보</h3>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">배차일자</span>
              <span className="text-sm font-semibold text-[#191F28]">{formatDate(dispatch.dispatchDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#8B95A1]">배차차수</span>
              <span className="text-sm font-semibold text-[#191F28]">{dispatch.dispatchSeq ?? "-"}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
              <Truck className="h-5 w-5 text-[#1FC47D]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B95A1]">품목 요약</h3>
          </div>
          <p className="text-2xl font-bold text-[#191F28]">{items.length}건</p>
          <p className="mt-1 text-sm text-[#8B95A1]">
            총 배차수량: {formatNumber(items.reduce((s: number, i: any) => s + (i.dispatchedQty || 0), 0))}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">배차 수정</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>차량 <span className="text-red-500">*</span></label>
            <select value={form.vehicleId} onChange={(e) => updateField("vehicleId", e.target.value)} className={selectBase}>
              <option value="">차량 선택</option>
              {vehicles.map((v: Vehicle) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.driverName || "기사미지정"}) - {v.tonnage}T
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>창고 <span className="text-red-500">*</span></label>
            <select value={form.warehouseId} onChange={(e) => updateField("warehouseId", e.target.value)} className={selectBase}>
              <option value="">창고 선택</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>배차일자</label>
            <input type="date" value={form.dispatchDate} onChange={(e) => updateField("dispatchDate", e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelClass}>배차차수</label>
            <input type="number" min={1} value={form.dispatchSeq} onChange={(e) => updateField("dispatchSeq", e.target.value)} className={inputBase} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>비고</label>
            <input value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className={inputBase} placeholder="비고 입력" />
          </div>
        </div>
      </div>

      {/* Dispatch items table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">배차 품목</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F2F4F6]">
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">NO</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목코드</th>
                <th className="pb-3 text-left text-xs font-semibold text-[#8B95A1]">품목명</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">주문수량</th>
                <th className="pb-3 text-right text-xs font-semibold text-[#8B95A1]">배차수량</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-[#8B95A1]">
                    배차 품목이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item: any, idx: number) => (
                  <tr key={item.id ?? idx} className="border-b border-[#F7F8FA] last:border-0">
                    <td className="py-4 text-sm text-[#4E5968]">{idx + 1}</td>
                    <td className="py-4 text-sm font-medium text-[#4E5968]">{item.itemCode ?? "-"}</td>
                    <td className="py-4 text-sm text-[#191F28]">{item.itemName ?? "-"}</td>
                    <td className="py-4 text-right text-sm font-semibold text-[#191F28]">
                      {formatNumber(item.orderedQty ?? 0)}
                    </td>
                    <td className="py-4 text-right text-sm font-semibold text-[#3182F6]">
                      {formatNumber(item.dispatchedQty ?? 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="배차 삭제"
        message="이 배차를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
