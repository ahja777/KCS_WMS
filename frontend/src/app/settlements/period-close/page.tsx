"use client";

import { useState, useCallback } from "react";
import { Search, Download, RotateCcw, Lock, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  useSettlements,
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

export default function PeriodClosePage() {
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [closeBasis, setCloseBasis] = useState("monthly");
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: response, isLoading, error } = useSettlements({
    page,
    limit: 20,
  });
  const confirmMutation = useConfirmSettlement();

  const settlements = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setPartnerSearch("");
    const d = new Date();
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setPage(1);
  }, []);

  const handleClose = useCallback(async () => {
    if (selectedIds.size === 0) {
      addToast({ type: "warning", message: "마감할 항목을 선택해주세요." });
      return;
    }
    try {
      for (const id of selectedIds) {
        await confirmMutation.mutateAsync(id);
      }
      setSelectedIds(new Set());
      addToast({ type: "success", message: "기간마감이 완료되었습니다." });
    } catch {
      addToast({ type: "error", message: "마감 처리 중 오류가 발생했습니다." });
    }
  }, [selectedIds, confirmMutation, addToast]);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (yearMonth) params.set("yearMonth", yearMonth);
    const qs = params.toString();
    downloadExcel(`/export/settlements/period-close${qs ? `?${qs}` : ""}`, "기간마감.xlsx");
  }, [yearMonth]);

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
      header: "마감기간(시작)",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{formatDate(row.periodFrom)}</span>,
    },
    {
      key: "periodTo",
      header: "마감기간(종료)",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{formatDate(row.periodTo)}</span>,
    },
    {
      key: "partnerId",
      header: "화주",
      render: (row) => <span className="text-sm text-[#191F28]">{row.partner?.name ?? "-"}</span>,
    },
    {
      key: "inboundFee",
      header: "입고료",
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.inboundFee ?? 0)}
        </span>
      ),
    },
    {
      key: "outboundFee",
      header: "출고료",
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.outboundFee ?? 0)}
        </span>
      ),
    },
    {
      key: "storageFee",
      header: "보관료",
      render: (row) => (
        <span className="block text-right text-sm text-[#191F28]">
          {formatNumber(row.storageFee ?? 0)}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "합계",
      render: (row) => (
        <span className="block text-right text-sm font-bold text-[#3182F6]">
          {formatNumber(row.totalAmount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "마감상태",
      render: (row) => (
        <Badge
          status={row.status}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">기간마감</h1>
          <p className="text-sm text-[#8B95A1]">정산관리 &gt; 기간마감</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">마감기준</label>
            <select
              value={closeBasis}
              onChange={(e) => setCloseBasis(e.target.value)}
              className={selectBase}
            >
              <option value="monthly">월별마감</option>
              <option value="quarterly">분기별마감</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">마감년월</label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className={inputBase}
            />
          </div>
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
          <Button size="sm" variant="primary" onClick={handleClose}>
            <Lock className="h-4 w-4" />
            마감확정
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
            emptyMessage="기간마감 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
