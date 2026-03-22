"use client";

import { useState, useEffect } from "react";
import { Search, AlertCircle, RotateCcw } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { downloadExcel } from "@/lib/export";
import { usePartners, useCreatePartner, useUpdatePartner, useDeletePartner } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import type { Partner, PartnerType } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

const initialForm = {
  code: "",
  name: "",
  type: "CUSTOMER" as string,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  country: "",
  city: "",
  address: "",
  notes: "",
  isActive: true,
  businessNo: "",
  president: "",
  faxNumber: "",
  website: "",
  businessType: "",
  businessKind: "",
  creditRating: "",
  shipControl: false,
  zipCode: "",
};

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | undefined>();
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [form, setForm] = useState({ ...initialForm });

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = usePartners({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();
  const deleteMutation = useDeletePartner();

  const partners = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  useEffect(() => {
    if (selectedPartner && !isNew) {
      setForm({
        code: selectedPartner.code,
        name: selectedPartner.name,
        type: selectedPartner.type,
        contactName: selectedPartner.contactName ?? "",
        contactPhone: selectedPartner.contactPhone ?? "",
        contactEmail: selectedPartner.contactEmail ?? "",
        country: selectedPartner.country ?? "",
        city: selectedPartner.city ?? "",
        address: selectedPartner.address ?? "",
        notes: selectedPartner.notes ?? "",
        isActive: selectedPartner.isActive,
        businessNo: selectedPartner.businessNo ?? "",
        president: selectedPartner.president ?? "",
        faxNumber: selectedPartner.faxNumber ?? "",
        website: selectedPartner.website ?? "",
        businessType: selectedPartner.businessType ?? "",
        businessKind: selectedPartner.businessKind ?? "",
        creditRating: selectedPartner.creditRating ?? "",
        shipControl: selectedPartner.shipControl ?? false,
        zipCode: selectedPartner.zipCode ?? "",
      });
    }
  }, [selectedPartner, isNew]);

  const handleNew = () => {
    setIsNew(true);
    setSelectedPartner(null);
    setForm({ ...initialForm });
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      addToast({ type: "error", message: "화주코드와 화주명은 필수입니다." });
      return;
    }
    try {
      const payload = { ...form, type: form.type as PartnerType };
      if (isNew) {
        await createMutation.mutateAsync(payload);
        addToast({ type: "success", message: "화주가 등록되었습니다." });
      } else if (selectedPartner) {
        await updateMutation.mutateAsync({ id: selectedPartner.id, payload });
        addToast({ type: "success", message: "화주가 수정되었습니다." });
      }
      setIsNew(false);
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPartner) return;
    try {
      await deleteMutation.mutateAsync(deletingPartner.id);
      addToast({ type: "success", message: `"${deletingPartner.name}" 화주가 삭제되었습니다.` });
      if (selectedPartner?.id === deletingPartner.id) setSelectedPartner(null);
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingPartner(undefined);
    }
  };

  const handleReset = () => {
    setSearch("");
    setPage(1);
  };

  const leftColumns: Column<Partner>[] = [
    { key: "code", header: "코드", sortable: true },
    { key: "name", header: "화주명", sortable: true },
    {
      key: "createdAt",
      header: "생성일",
      render: (row) => <span className="text-xs text-[#8B95A1]">{formatDate(row.createdAt, "yyyy-MM-dd")}</span>,
    },
    {
      key: "createdBy",
      header: "생성자",
      render: () => <span className="text-xs text-[#8B95A1]">-</span>,
    },
  ];

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">화주</label>
            <div className="flex gap-1">
              <input type="text" placeholder="화주 검색" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={`flex-1 ${inputBase}`} />
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button onClick={handleReset} className="flex h-[46px] items-center rounded-xl bg-[#F2F4F6] px-3 text-[#4E5968] hover:bg-[#E5E8EB]">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={() => setPage(1)} className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white hover:bg-[#1B64DA]">
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleSave} className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D63341]">저장</button>
        <button onClick={handleNew} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">신규</button>
        <button onClick={() => selectedPartner && setDeletingPartner(selectedPartner)} className="rounded-xl bg-[#8B95A1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B7684]">삭제</button>
        <button onClick={() => downloadExcel("/export/partners", "partners.xlsx")} className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17A86B]">엑셀</button>
      </div>

      {/* Main content: left grid + right form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Partner List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#4A5568] px-4 py-2">
              <h2 className="text-sm font-bold text-white">화주목록</h2>
            </div>
            <div className="p-4">
              {error ? (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  데이터를 불러오는 중 오류가 발생했습니다.
                </div>
              ) : (
                <Table
                  columns={leftColumns}
                  data={partners}
                  isLoading={isLoading}
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                  onRowClick={(row) => { setSelectedPartner(row); setIsNew(false); }}
                  emptyMessage="화주 데이터가 없습니다."
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Detail Form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#4A5568] px-4 py-2">
              <h2 className="text-sm font-bold text-white">화주정보</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-red-500">* 화주코드</label>
                  <input value={form.code} onChange={(e) => updateField("code", e.target.value)} className={inputBase} disabled={!isNew && !!selectedPartner} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-red-500">* 화주명</label>
                  <input value={form.name} onChange={(e) => updateField("name", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">상호</label>
                  <input value={form.city} onChange={(e) => updateField("city", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">대표자명</label>
                  <input value={form.president} onChange={(e) => updateField("president", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">사업자등록번호</label>
                  <input value={form.businessNo} onChange={(e) => updateField("businessNo", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">사업장전화</label>
                  <input value={form.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">팩스번호</label>
                  <input value={form.faxNumber} onChange={(e) => updateField("faxNumber", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">우편번호</label>
                  <input value={form.zipCode} onChange={(e) => updateField("zipCode", e.target.value)} className={inputBase} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">사업장주소</label>
                  <input value={form.address} onChange={(e) => updateField("address", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">업태</label>
                  <select value={form.businessType} onChange={(e) => updateField("businessType", e.target.value)} className={selectBase}>
                    <option value="">선택</option>
                    <option value="제조업">제조업</option>
                    <option value="도매업">도매업</option>
                    <option value="소매업">소매업</option>
                    <option value="서비스업">서비스업</option>
                    <option value="운수업">운수업</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">업종</label>
                  <select value={form.businessKind} onChange={(e) => updateField("businessKind", e.target.value)} className={selectBase}>
                    <option value="">선택</option>
                    <option value="물류">물류</option>
                    <option value="유통">유통</option>
                    <option value="전자">전자</option>
                    <option value="식품">식품</option>
                    <option value="의류">의류</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">홈페이지주소</label>
                  <input value={form.website} onChange={(e) => updateField("website", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">출고통제</label>
                  <select value={form.shipControl ? "Y" : "N"} onChange={(e) => updateField("shipControl", e.target.value === "Y")} className={selectBase}>
                    <option value="N">N</option>
                    <option value="Y">Y</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">담당자이메일</label>
                  <input value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">신용등급</label>
                  <select value={form.creditRating} onChange={(e) => updateField("creditRating", e.target.value)} className={selectBase}>
                    <option value="">선택</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">거래처유형</label>
                  <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className={selectBase}>
                    <option value="SUPPLIER">공급처</option>
                    <option value="CUSTOMER">고객사</option>
                    <option value="CARRIER">운송사</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">활성여부</label>
                  <select value={form.isActive ? "Y" : "N"} onChange={(e) => updateField("isActive", e.target.value === "Y")} className={selectBase}>
                    <option value="Y">활성</option>
                    <option value="N">비활성</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">비고</label>
                  <input value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className={inputBase} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingPartner}
        onClose={() => setDeletingPartner(undefined)}
        onConfirm={handleDeleteConfirm}
        title="화주 삭제"
        message={`"${deletingPartner?.name}" 화주를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
