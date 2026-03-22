"use client";

import { useState, useEffect } from "react";
import { Search, AlertCircle } from "lucide-react";
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
import type { Container, ContainerGroup } from "@/types";

const inputBase =
  "w-full rounded border-0 bg-[#F7F8FA] px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-1 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded border-0 bg-[#F7F8FA] px-3 py-2 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-1 focus:ring-[#3182F6]/20 appearance-none";
const labelClass = "mb-1 block text-xs font-medium text-[#4E5968]";
const sectionTitle = "col-span-full text-sm font-bold text-[#191F28] border-b border-[#E5E8EB] pb-1 pt-2";

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
      if (isNew) {
        await createMutation.mutateAsync(payload);
        addToast({ type: "success", message: "물류용기가 등록되었습니다." });
      } else if (selectedContainer) {
        await updateMutation.mutateAsync({ id: selectedContainer.id, payload });
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
      sortable: true,
      render: (row) => row.containerGroup?.groupName ?? "-",
    },
    {
      key: "inboundWarehouseCode",
      header: "입고창고코드",
      sortable: true,
      render: (row) => row.inboundWarehouseCode ?? "-",
    },
    {
      key: "shelfLife",
      header: "유통기간",
      sortable: true,
      render: (row) => row.shelfLife ?? "-",
    },
    {
      key: "shelfLifeDays",
      header: "유통기간일수",
      sortable: true,
      render: (row) => row.shelfLifeDays ?? "-",
    },
  ];

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; 물류용기관리</p>
          <h1 className="text-2xl font-bold text-[#191F28]">물류용기관리</h1>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[140px]">
            <label className={labelClass}>화주</label>
            <input type="text" placeholder="화주" className={inputBase} />
          </div>
          <div className="min-w-[140px]">
            <label className={labelClass}>용기군</label>
            <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }} className={selectBase}>
              <option value="">전체</option>
              {containerGroups.map((g: ContainerGroup) => (
                <option key={g.id} value={g.groupCode}>{g.groupName}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className={labelClass}>용기코드</label>
            <input type="text" placeholder="용기코드" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={inputBase} />
          </div>
          <button onClick={() => setPage(1)} className="flex h-[38px] items-center gap-2 rounded-lg bg-[#3182F6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]">
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleNew} className="rounded-lg bg-[#3182F6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B64DA]">신규</button>
        <button onClick={handleSave} className="rounded-lg bg-[#F04452] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D63341]">저장</button>
        <button onClick={() => downloadExcel("/export/containers", "containers.xlsx")} className="rounded-lg bg-[#1FC47D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17A86B]">엑셀</button>
        <button onClick={() => selectedContainer && setDeletingContainer(selectedContainer)} className="rounded-lg bg-[#8B95A1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6B7684]">삭제</button>
      </div>

      {/* Master Grid + Detail Form side by side */}
      <div className="flex gap-4">
        {/* LEFT: Grid */}
        <div className="w-1/2 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-3 rounded-lg bg-[#4A5568] px-4 py-2">
            <h2 className="text-sm font-bold text-white">용기목록</h2>
          </div>
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
              activeRowId={selectedContainer?.id}
              emptyMessage="물류용기 데이터가 없습니다."
            />
          )}
        </div>

        {/* RIGHT: Detail Form */}
        <div className="w-1/2 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-3 rounded-lg bg-[#4A5568] px-4 py-2">
            <h2 className="text-sm font-bold text-white">
              상세정보 {isNew ? "(신규)" : selectedContainer ? `(${selectedContainer.containerCode})` : ""}
            </h2>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-1">
              {/* === 기본 === */}
              <div className={sectionTitle}>기본</div>
              <div>
                <label className={labelClass}>용기ID</label>
                <input value={selectedContainer?.id ?? ""} disabled className={`${inputBase} bg-[#EBEDF0] text-[#8B95A1]`} />
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
                <label className={labelClass}>용기코드 <span className="text-red-500">*</span></label>
                <input value={form.containerCode} onChange={(e) => updateField("containerCode", e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelClass}>용기명 <span className="text-red-500">*</span></label>
                <input value={form.containerName} onChange={(e) => updateField("containerName", e.target.value)} className={inputBase} />
              </div>

              {/* === 규격 === */}
              <div className={sectionTitle}>규격</div>
              <div>
                <label className={labelClass}>용기중량</label>
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
              <div />

              {/* === 관리 === */}
              <div className={sectionTitle}>관리</div>
              <div>
                <label className={labelClass}>화주명</label>
                <input value={form.partnerName} onChange={(e) => updateField("partnerName", e.target.value)} className={inputBase} />
              </div>
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
                <label className={labelClass}>사용유무</label>
                <select value={form.isActive ? "Y" : "N"} onChange={(e) => updateField("isActive", e.target.value === "Y")} className={selectBase}>
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>유통기간</label>
                <input value={form.shelfLife} onChange={(e) => updateField("shelfLife", e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelClass}>적정재고일수</label>
                <input type="number" value={form.optimalStockDays} onChange={(e) => updateField("optimalStockDays", e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelClass}>유효기간일수</label>
                <input type="number" value={form.expiryDays} onChange={(e) => updateField("expiryDays", e.target.value)} className={inputBase} />
              </div>
              <div />

              {/* === 입고 === */}
              <div className={sectionTitle}>입고</div>
              <div>
                <label className={labelClass}>입고창고코드</label>
                <input value={form.inboundWarehouseCode} onChange={(e) => updateField("inboundWarehouseCode", e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelClass}>입고존</label>
                <input value={form.inboundZone} onChange={(e) => updateField("inboundZone", e.target.value)} className={inputBase} />
              </div>

              {/* === 기타 === */}
              <div className={sectionTitle}>기타</div>
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
                <label className={labelClass}>무게오차허용범위(Kg)</label>
                <input type="number" step="0.1" value={form.weightToleranceKg} onChange={(e) => updateField("weightToleranceKg", e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className={labelClass}>비고</label>
                <input value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className={inputBase} />
              </div>
            </div>
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
