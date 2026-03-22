"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, AlertCircle, Download } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useContainers,
  useCreateContainer,
  useUpdateContainer,
  useDeleteContainer,
  useContainerGroups,
  usePartners,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadExcel } from "@/lib/export";
import type { Container } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function ContainersPage() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [deletingContainer, setDeletingContainer] = useState<Container | undefined>();
  const [isNew, setIsNew] = useState(false);

  // Form state
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

  const addToast = useToastStore((s) => s.addToast);

  const { data: groupRes } = useContainerGroups({ limit: 100 });
  const containerGroups = groupRes?.data ?? [];

  const { data: partnerRes } = usePartners({ limit: 100 });

  const { data: response, isLoading, error } = useContainers({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(groupFilter ? { groupCode: groupFilter } : {}),
  });

  const createMutation = useCreateContainer();
  const updateMutation = useUpdateContainer();
  const deleteMutation = useDeleteContainer();

  const containers = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  useEffect(() => {
    if (selectedContainer && !isNew) {
      setForm({
        containerCode: selectedContainer.containerCode ?? "",
        containerName: selectedContainer.containerName ?? "",
        containerGroupId: selectedContainer.containerGroupId ?? "",
        weight: String(selectedContainer.weight ?? ""),
        partnerName: selectedContainer.partner?.name ?? "",
        size: selectedContainer.size ?? "",
        notes: selectedContainer.notes ?? "",
        optimalStock: String(selectedContainer.optimalStock ?? ""),
        stockUnit: selectedContainer.stockUnit ?? "",
        isActive: selectedContainer.isActive ?? true,
        shelfLife: String(selectedContainer.shelfLife ?? ""),
        optimalStockDays: String(selectedContainer.optimalStockDays ?? ""),
        expiryDays: String(selectedContainer.expiryDays ?? ""),
        inboundWarehouseCode: selectedContainer.inboundWarehouseCode ?? "",
        inboundZone: selectedContainer.inboundZone ?? "",
        unitPrice: String(selectedContainer.unitPrice ?? ""),
        assetType: selectedContainer.assetType ?? "",
        tagPrefix: selectedContainer.tagPrefix ?? "",
        companyEpcCode: selectedContainer.companyEpcCode ?? "",
        barcode: selectedContainer.barcode ?? "",
        weightToleranceKg: String(selectedContainer.weightToleranceKg ?? ""),
      });
    }
  }, [selectedContainer, isNew]);

  const handleNew = () => {
    setIsNew(true);
    setSelectedContainer(null);
    setForm({
      containerCode: "", containerName: "", containerGroupId: "", weight: "",
      partnerName: "", size: "", notes: "", optimalStock: "", stockUnit: "",
      isActive: true, shelfLife: "", optimalStockDays: "", expiryDays: "",
      inboundWarehouseCode: "", inboundZone: "", unitPrice: "", assetType: "",
      tagPrefix: "", companyEpcCode: "", barcode: "", weightToleranceKg: "",
    });
  };

  const handleSave = async () => {
    const payload: Record<string, unknown> = {
      containerCode: form.containerCode,
      containerName: form.containerName,
      containerGroupId: form.containerGroupId || null,
      weight: form.weight ? Number(form.weight) : null,
      size: form.size || null,
      notes: form.notes || null,
      optimalStock: form.optimalStock ? Number(form.optimalStock) : null,
      stockUnit: form.stockUnit || null,
      isActive: form.isActive,
      shelfLife: form.shelfLife ? Number(form.shelfLife) : null,
      optimalStockDays: form.optimalStockDays ? Number(form.optimalStockDays) : null,
      expiryDays: form.expiryDays ? Number(form.expiryDays) : null,
      inboundWarehouseCode: form.inboundWarehouseCode || null,
      inboundZone: form.inboundZone || null,
      unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
      assetType: form.assetType || null,
      tagPrefix: form.tagPrefix || null,
      companyEpcCode: form.companyEpcCode || null,
      barcode: form.barcode || null,
      weightToleranceKg: form.weightToleranceKg ? Number(form.weightToleranceKg) : null,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(payload as any);
        addToast({ type: "success", message: "물류용기가 등록되었습니다." });
      } else if (selectedContainer) {
        await updateMutation.mutateAsync({ id: selectedContainer.id, payload: payload as any });
        addToast({ type: "success", message: "물류용기가 수정되었습니다." });
      }
      setIsNew(false);
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContainer) return;
    try {
      await deleteMutation.mutateAsync(deletingContainer.id);
      addToast({ type: "success", message: "물류용기가 삭제되었습니다." });
      if (selectedContainer?.id === deletingContainer.id) {
        setSelectedContainer(null);
      }
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingContainer(undefined);
    }
  };

  const columns: Column<Container>[] = [
    { key: "containerCode", header: "용기코드", sortable: true },
    { key: "containerName", header: "용기명", sortable: true },
    {
      key: "containerGroupId",
      header: "용기군",
      render: (row) => row.containerGroup?.groupName ?? "-",
    },
    {
      key: "inboundWarehouseCode",
      header: "입고창고코드",
      render: (row) => row.inboundWarehouseCode ?? "-",
    },
    {
      key: "shelfLife",
      header: "유통기간",
      render: (row) => row.shelfLife ?? "-",
    },
    {
      key: "shelfLifeDays",
      header: "유통기간일수",
      render: (row) => row.shelfLifeDays ?? "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; 물류용기관리</p>
          <h1 className="text-2xl font-bold text-[#191F28]">물류용기관리</h1>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">화주</label>
            <input type="text" placeholder="화주" className={inputBase} />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기군</label>
            <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }} className={selectBase}>
              <option value="">전체</option>
              {containerGroups.map((g: any) => (
                <option key={g.id} value={g.groupCode}>{g.groupName}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기코드</label>
            <input type="text" placeholder="용기코드" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={inputBase} />
          </div>
          <button onClick={() => setPage(1)} className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]">
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleNew} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">신규</button>
        <button onClick={handleSave} className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D63341]">저장</button>
        <button onClick={() => downloadExcel("/export/containers", "containers.xlsx")} className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17A86B]">엑셀</button>
        <button onClick={() => selectedContainer && setDeletingContainer(selectedContainer)} className="rounded-xl bg-[#8B95A1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B7684]">삭제</button>
      </div>

      {/* Top Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={containers}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={(row) => { setSelectedContainer(row); setIsNew(false); }}
            emptyMessage="물류용기 데이터가 없습니다."
          />
        )}
      </div>

      {/* Detail Form */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-4 text-lg font-bold text-[#191F28]">상세정보</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기코드 <span className="text-red-500">*</span></label>
            <input value={form.containerCode} onChange={(e) => setForm({ ...form, containerCode: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기군</label>
            <select value={form.containerGroupId} onChange={(e) => setForm({ ...form, containerGroupId: e.target.value })} className={selectBase}>
              <option value="">선택</option>
              {containerGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.groupName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기중량</label>
            <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기명 <span className="text-red-500">*</span></label>
            <input value={form.containerName} onChange={(e) => setForm({ ...form, containerName: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">화주명</label>
            <input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기크기</label>
            <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={selectBase}>
              <option value="">선택</option>
              <option value="S">소형</option>
              <option value="M">중형</option>
              <option value="L">대형</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">비고</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">적정재고</label>
            <input type="number" value={form.optimalStock} onChange={(e) => setForm({ ...form, optimalStock: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">재고단위</label>
            <select value={form.stockUnit} onChange={(e) => setForm({ ...form, stockUnit: e.target.value })} className={selectBase}>
              <option value="">선택</option>
              <option value="EA">EA</option>
              <option value="BOX">BOX</option>
              <option value="PLT">PLT</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">사용유무</label>
            <select value={form.isActive ? "Y" : "N"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "Y" })} className={selectBase}>
              <option value="Y">사용</option>
              <option value="N">미사용</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">유통기간</label>
            <input value={form.shelfLife} onChange={(e) => setForm({ ...form, shelfLife: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">적정재고일수</label>
            <input type="number" value={form.optimalStockDays} onChange={(e) => setForm({ ...form, optimalStockDays: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">유효기간일수</label>
            <input type="number" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">입고창고코드</label>
            <input value={form.inboundWarehouseCode} onChange={(e) => setForm({ ...form, inboundWarehouseCode: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">입고존</label>
            <input value={form.inboundZone} onChange={(e) => setForm({ ...form, inboundZone: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기단가</label>
            <input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">자산TYPE</label>
            <select value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value })} className={selectBase}>
              <option value="">선택</option>
              <option value="OWN">자사</option>
              <option value="RENTAL">임대</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">TAG PREFIX</label>
            <input value={form.tagPrefix} onChange={(e) => setForm({ ...form, tagPrefix: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">회사EPC코드</label>
            <input value={form.companyEpcCode} onChange={(e) => setForm({ ...form, companyEpcCode: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">용기바코드</label>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={inputBase} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">무게오차허용범위(Kg)</label>
            <input type="number" step="0.1" value={form.weightToleranceKg} onChange={(e) => setForm({ ...form, weightToleranceKg: e.target.value })} className={inputBase} />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingContainer}
        onClose={() => setDeletingContainer(undefined)}
        onConfirm={handleDeleteConfirm}
        title="물류용기 삭제"
        message={`"${deletingContainer?.containerName}" 용기를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
