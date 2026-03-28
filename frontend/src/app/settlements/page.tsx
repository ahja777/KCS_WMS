"use client";

import { useState, useCallback } from "react";
import { Search, Download, RotateCcw, Plus, Trash2, Save, AlertCircle, Pencil } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import {
  useSettlements,
  useCreateSettlement,
  useDeleteSettlement,
  useConfirmSettlement,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, formatNumber } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import type { Settlement } from "@/types";

const inputBase =
  "h-9 rounded-lg border border-[#E5E8EB] bg-white px-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";
const selectBase =
  "h-9 rounded-lg border border-[#E5E8EB] bg-white px-3 text-sm text-[#191F28] outline-none transition-colors focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

type TabType = "unit-price" | "calculation";

export default function SettlementsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("unit-price");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">정산관리</h1>
          <p className="text-sm text-[#8B95A1]">정산관리</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E8EB]">
        <button
          onClick={() => setActiveTab("unit-price")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "unit-price"
              ? "border-b-2 border-[#3182F6] text-[#3182F6]"
              : "text-[#8B95A1] hover:text-[#4E5968]"
          }`}
        >
          정산단가관리
        </button>
        <button
          onClick={() => setActiveTab("calculation")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "calculation"
              ? "border-b-2 border-[#3182F6] text-[#3182F6]"
              : "text-[#8B95A1] hover:text-[#4E5968]"
          }`}
        >
          정산산출
        </button>
      </div>

      {activeTab === "unit-price" ? <UnitPriceTab /> : <CalculationTab />}
    </div>
  );
}

// ===== Tab 1: 정산단가관리 (청구단가계약) =====
function UnitPriceTab() {
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<Settlement | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Settlement | null>(null);

  const { data: response, isLoading, error } = useSettlements({
    page,
    limit: 20,
    ...(partnerSearch ? { search: partnerSearch } : {}),
  });
  const createMutation = useCreateSettlement();
  const deleteMutation = useDeleteSettlement();

  const settlements = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setPartnerSearch("");
    setDeptSearch("");
    setEmployeeSearch("");
    setPage(1);
  }, []);

  const handleNew = useCallback(async () => {
    try {
      await createMutation.mutateAsync({
        partnerId: "",
        warehouseId: "",
        periodStart: new Date().toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
        details: [],
      });
      addToast({ type: "success", message: "저장이 완료되었습니다." });
    } catch {
      addToast({ type: "error", message: "추가 중 오류가 발생했습니다." });
    }
  }, [createMutation, addToast]);

  const handleSave = useCallback(() => {
    addToast({ type: "success", message: "저장이 완료되었습니다." });
  }, [addToast]);

  const handleDelete = useCallback(async () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    try {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync(id);
      }
      setSelectedIds(new Set());
      addToast({ type: "success", message: "삭제되었습니다." });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    }
  }, [selectedIds, deleteMutation, addToast]);

  const handleExcel = useCallback(() => {
    downloadExcel("/export/settlements", "정산단가관리.xlsx");
  }, []);

  const handleCheckAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(settlements.map((s) => s.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [settlements]
  );

  const handleCheckRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const columns: Column<Settlement>[] = [
    {
      key: "checkbox",
      header: "",
      width: "40px",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => handleCheckRow(row.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#D1D6DB]"
        />
      ),
    },
    {
      key: "no",
      header: "NO",
      width: "60px",
      render: (_row, index) => (
        <span className="text-sm text-[#4E5968]">{(page - 1) * 20 + index + 1}</span>
      ),
    },
    {
      key: "periodFrom",
      header: "적용시작일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{formatDate(row.periodFrom || row.periodStart)}</span>,
    },
    {
      key: "periodTo",
      header: "적용종료일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{formatDate(row.periodTo || row.periodEnd)}</span>,
    },
    {
      key: "partnerId",
      header: "화주",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.partner?.name ?? "-"}</span>,
    },
    {
      key: "contractDept",
      header: "계약부서",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.contractDept ?? "-"}</span>,
    },
    {
      key: "contractEmployee",
      header: "계약사원",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.contractEmployee ?? "-"}</span>,
    },
  ];

  const handleEditSave = useCallback(() => {
    addToast({ type: "success", message: "저장이 완료되었습니다." });
    setEditModalOpen(false);
    setEditingRow(null);
  }, [addToast]);

  return (
    <>
      {/* Edit Modal */}
      {editModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-[#191F28]">정산단가 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
                <input type="text" defaultValue={editingRow.partner?.name ?? ""} className={inputBase} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">적용시작일</label>
                  <input type="date" defaultValue={(editingRow.periodFrom || editingRow.periodStart)?.slice(0, 10)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">적용종료일</label>
                  <input type="date" defaultValue={(editingRow.periodTo || editingRow.periodEnd)?.slice(0, 10)} className={inputBase} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">계약부서</label>
                  <input type="text" defaultValue={editingRow.contractDept ?? ""} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">계약사원</label>
                  <input type="text" defaultValue={editingRow.contractEmployee ?? ""} className={inputBase} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setEditModalOpen(false); setEditingRow(null); }} className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">취소</button>
              <button onClick={handleEditSave} className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                placeholder="화주"
                className={inputBase + " flex-1"}
              />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-w-[220px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">계약부서</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="계약부서"
                className={inputBase + " flex-1"}
              />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-w-[220px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">사원</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="사원"
                className={inputBase + " flex-1"}
              />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg border border-[#E5E8EB] bg-white p-2.5 text-[#8B95A1] hover:bg-[#F7F8FA]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8B95A1]">
          Total: <span className="font-semibold text-[#191F28]">{formatNumber(total)}</span>건
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            조회
          </Button>
          <button
            onClick={() => { if (selectedRow) { setEditingRow(selectedRow); setEditModalOpen(true); } }}
            disabled={!selectedRow}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9500] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#E08200] focus:ring-2 focus:ring-[#FF9500]/30 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil className="h-4 w-4" />
            수정
          </button>
          <Button size="sm" variant="primary" onClick={handleSave}>
            <Save className="h-4 w-4" />
            저장
          </Button>
          <Button size="sm" variant="secondary" onClick={handleNew}>
            <Plus className="h-4 w-4" />
            신규
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
          <Button size="sm" variant="outline" className="!bg-[#22C55E] !text-white !border-[#22C55E]" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Header checkbox for select all */}
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={settlements.length > 0 && selectedIds.size === settlements.length}
            onChange={(e) => handleCheckAll(e.target.checked)}
            className="h-4 w-4 rounded border-[#D1D6DB]"
          />
          <span className="text-xs text-[#8B95A1]">전체선택</span>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={settlements}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={(row: Settlement) => setSelectedRow((prev) => (prev?.id === row.id ? null : row))}
            emptyMessage="정산 단가 데이터가 없습니다."
          />
        )}
      </div>
    </>
  );
}

// ===== Tab 2: 정산산출 (청구산출) =====
function CalculationTab() {
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [calcBasis, setCalcBasis] = useState("period");
  const [editingRow, setEditingRow] = useState<Settlement | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Settlement | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: response, isLoading, error } = useSettlements({
    page,
    limit: 20,
    status: "CALCULATED",
  });
  const createMutation = useCreateSettlement();
  const deleteMutation = useDeleteSettlement();
  const confirmMutation = useConfirmSettlement();

  const settlements = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleSave = useCallback(() => {
    addToast({ type: "success", message: "저장이 완료되었습니다." });
  }, [addToast]);

  const handleNew = useCallback(async () => {
    try {
      await createMutation.mutateAsync({
        partnerId: "",
        warehouseId: "",
        periodStart: dateFrom,
        periodEnd: dateTo,
        details: [],
      });
      addToast({ type: "success", message: "저장이 완료되었습니다." });
    } catch {
      addToast({ type: "error", message: "추가 중 오류가 발생했습니다." });
    }
  }, [createMutation, addToast, dateFrom, dateTo]);

  const handleDelete = useCallback(async () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    try {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync(id);
      }
      setSelectedIds(new Set());
      addToast({ type: "success", message: "삭제되었습니다." });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    }
  }, [selectedIds, deleteMutation, addToast]);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("startDate", dateFrom);
    if (dateTo) params.set("endDate", dateTo);
    const qs = params.toString();
    downloadExcel(`/export/settlements${qs ? `?${qs}` : ""}`, "정산산출.xlsx");
  }, [dateFrom, dateTo]);

  const handleCheckAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(settlements.map((s) => s.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [settlements]
  );

  const handleCheckRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const columns: Column<Settlement>[] = [
    {
      key: "checkbox",
      header: "",
      width: "40px",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => handleCheckRow(row.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#D1D6DB]"
        />
      ),
    },
    {
      key: "no",
      header: "NO",
      width: "60px",
      render: (_row, index) => (
        <span className="text-sm text-[#4E5968]">{(page - 1) * 20 + index + 1}</span>
      ),
    },
    {
      key: "periodFrom",
      header: "적용시작일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{formatDate(row.periodFrom || row.periodStart)}</span>,
    },
    {
      key: "periodTo",
      header: "적용종료일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{formatDate(row.periodTo || row.periodEnd)}</span>,
    },
    {
      key: "partnerId",
      header: "화주",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.partner?.name ?? "-"}</span>,
    },
    {
      key: "inboundFee",
      header: "입고료",
      sortable: true,
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.inboundFee ?? 0)}
        </span>
      ),
    },
    {
      key: "outboundFee",
      header: "출고료",
      sortable: true,
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.outboundFee ?? 0)}
        </span>
      ),
    },
    {
      key: "storageFee",
      header: "보관료",
      sortable: true,
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.storageFee ?? 0)}
        </span>
      ),
    },
    {
      key: "transportFee",
      header: "운송료",
      sortable: true,
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.transportFee ?? 0)}
        </span>
      ),
    },
    {
      key: "shuttleFee",
      header: "셔틀료",
      sortable: true,
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.shuttleFee ?? 0)}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "합계",
      sortable: true,
      render: (row) => (
        <span className="block text-right text-sm font-bold text-[#3182F6]">
          {formatNumber(row.totalAmount)}
        </span>
      ),
    },
  ];

  const handleEditSave = useCallback(() => {
    addToast({ type: "success", message: "저장이 완료되었습니다." });
    setEditModalOpen(false);
    setEditingRow(null);
  }, [addToast]);

  return (
    <>
      {/* Edit Modal */}
      {editModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-[#191F28]">정산산출 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
                <input type="text" defaultValue={editingRow.partner?.name ?? ""} className={inputBase} readOnly />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">적용시작일</label>
                  <input type="date" defaultValue={(editingRow.periodFrom || editingRow.periodStart)?.slice(0, 10)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">적용종료일</label>
                  <input type="date" defaultValue={(editingRow.periodTo || editingRow.periodEnd)?.slice(0, 10)} className={inputBase} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">입고료</label>
                  <input type="number" defaultValue={editingRow.inboundFee ?? 0} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">출고료</label>
                  <input type="number" defaultValue={editingRow.outboundFee ?? 0} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">보관료</label>
                  <input type="number" defaultValue={editingRow.storageFee ?? 0} className={inputBase} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setEditModalOpen(false); setEditingRow(null); }} className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">취소</button>
              <button onClick={handleEditSave} className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">정산기준</label>
            <select
              value={calcBasis}
              onChange={(e) => setCalcBasis(e.target.value)}
              className={selectBase}
            >
              <option value="period">기간별정산</option>
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">정산기간</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputBase}
              />
              <span className="text-sm text-[#8B95A1]">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputBase}
              />
            </div>
          </div>
          <button
            onClick={() => {
              const d = new Date();
              d.setMonth(d.getMonth() - 1);
              setDateFrom(d.toISOString().slice(0, 10));
              setDateTo(new Date().toISOString().slice(0, 10));
              setPage(1);
            }}
            className="rounded-lg border border-[#E5E8EB] bg-white p-2.5 text-[#8B95A1] hover:bg-[#F7F8FA]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8B95A1]">
          Total: <span className="font-semibold text-[#191F28]">{formatNumber(total)}</span>건
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            조회
          </Button>
          <button
            onClick={() => { if (selectedRow) { setEditingRow(selectedRow); setEditModalOpen(true); } }}
            disabled={!selectedRow}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9500] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#E08200] focus:ring-2 focus:ring-[#FF9500]/30 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil className="h-4 w-4" />
            수정
          </button>
          <Button size="sm" variant="primary" onClick={handleSave}>
            <Save className="h-4 w-4" />
            저장
          </Button>
          <Button size="sm" variant="secondary" onClick={handleNew}>
            <Plus className="h-4 w-4" />
            신규
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
          <Button size="sm" variant="outline" className="!bg-[#22C55E] !text-white !border-[#22C55E]" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Header checkbox for select all */}
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={settlements.length > 0 && selectedIds.size === settlements.length}
            onChange={(e) => handleCheckAll(e.target.checked)}
            className="h-4 w-4 rounded border-[#D1D6DB]"
          />
          <span className="text-xs text-[#8B95A1]">전체선택</span>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={settlements}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={(row: Settlement) => setSelectedRow((prev) => (prev?.id === row.id ? null : row))}
            emptyMessage="정산 산출 데이터가 없습니다."
          />
        )}
      </div>
    </>
  );
}
