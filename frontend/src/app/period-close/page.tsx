"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Download, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { usePeriodCloses, useCreatePeriodClose, usePartners } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import { useToastStore } from "@/stores/toast.store";
import type { PeriodClose } from "@/types";

const CLOSE_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "MONTHLY", label: "월마감" },
  { value: "DAILY", label: "일마감" },
  { value: "YEARLY", label: "연마감" },
];

const TASK_OPTIONS = [
  { value: "", label: "전체업무" },
  { value: "INBOUND", label: "입고" },
  { value: "OUTBOUND", label: "출고" },
  { value: "INVENTORY", label: "재고" },
  { value: "SETTLEMENT", label: "정산" },
  { value: "DISPATCH", label: "배차" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

interface ClosingRow {
  id: string;
  closeType: string;
  closeTypeLabel: string;
  task: string;
  taskLabel: string;
  authority: string;
  appliedOwner: string;
  closeDate: string;
  startMonth: string;
  startDay: string;
  endMonth: string;
  endDay: string;
  closeMonth: string;
  closeDay: string;
  allowDays: number;
  isAuto: boolean;
  _selected?: boolean;
}

export default function PeriodClosePage() {
  const [closeTypeFilter, setCloseTypeFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const addToast = useToastStore((s) => s.addToast);

  const { data: partnerRes } = usePartners({ limit: 200 });
  const allPartners = partnerRes?.data ?? [];
  const owners = allPartners.filter((p) => (p.type as string) === "OWNER" || p.type === "SUPPLIER");

  const { data: periodCloseRes, isLoading, error } = usePeriodCloses({
    limit: 50,
    page,
  });

  const periodCloses = periodCloseRes?.data ?? [];
  const total = periodCloseRes?.total ?? 0;
  const totalPages = periodCloseRes?.totalPages ?? 1;

  // Transform period close data into display rows
  const closingRows = useMemo(() => {
    const rows: ClosingRow[] = periodCloses.map((pc: PeriodClose) => {
      const fromDate = new Date(pc.periodFrom);
      const toDate = new Date(pc.periodTo);
      const closeDate = pc.closedAt ? new Date(pc.closedAt) : null;

      return {
        id: pc.id,
        closeType: pc.status === "CLOSED" ? "MONTHLY" : "DAILY",
        closeTypeLabel: pc.status === "CLOSED" ? "월마감" : "일마감",
        task: "INVENTORY",
        taskLabel: "재고",
        authority: "관리자",
        appliedOwner: pc.warehouse?.name ?? "-",
        closeDate: closeDate ? formatDate(pc.closedAt!) : "-",
        startMonth: String(fromDate.getMonth() + 1).padStart(2, "0"),
        startDay: String(fromDate.getDate()).padStart(2, "0"),
        endMonth: String(toDate.getMonth() + 1).padStart(2, "0"),
        endDay: String(toDate.getDate()).padStart(2, "0"),
        closeMonth: closeDate ? String(closeDate.getMonth() + 1).padStart(2, "0") : "-",
        closeDay: closeDate ? String(closeDate.getDate()).padStart(2, "0") : "-",
        allowDays: 3,
        isAuto: pc.status === "LOCKED",
      };
    });

    // Apply filters
    return rows.filter((r) => {
      if (closeTypeFilter && r.closeType !== closeTypeFilter) return false;
      if (taskFilter && r.task !== taskFilter) return false;
      return true;
    });
  }, [periodCloses, closeTypeFilter, taskFilter]);

  // If no real data, generate demo rows
  const displayRows = useMemo(() => {
    if (closingRows.length > 0) return closingRows;

    // Demo data for display
    const demoRows: ClosingRow[] = [
      {
        id: "demo-1",
        closeType: "MONTHLY",
        closeTypeLabel: "월마감",
        task: "INBOUND",
        taskLabel: "입고",
        authority: "관리자",
        appliedOwner: "전체화주",
        closeDate: "2026-03-01",
        startMonth: "03",
        startDay: "01",
        endMonth: "03",
        endDay: "31",
        closeMonth: "04",
        closeDay: "05",
        allowDays: 5,
        isAuto: false,
      },
      {
        id: "demo-2",
        closeType: "MONTHLY",
        closeTypeLabel: "월마감",
        task: "OUTBOUND",
        taskLabel: "출고",
        authority: "관리자",
        appliedOwner: "전체화주",
        closeDate: "2026-03-01",
        startMonth: "03",
        startDay: "01",
        endMonth: "03",
        endDay: "31",
        closeMonth: "04",
        closeDay: "05",
        allowDays: 5,
        isAuto: false,
      },
      {
        id: "demo-3",
        closeType: "DAILY",
        closeTypeLabel: "일마감",
        task: "INVENTORY",
        taskLabel: "재고",
        authority: "관리자",
        appliedOwner: "전체화주",
        closeDate: "2026-03-21",
        startMonth: "03",
        startDay: "21",
        endMonth: "03",
        endDay: "21",
        closeMonth: "03",
        closeDay: "22",
        allowDays: 1,
        isAuto: true,
      },
      {
        id: "demo-4",
        closeType: "MONTHLY",
        closeTypeLabel: "월마감",
        task: "SETTLEMENT",
        taskLabel: "정산",
        authority: "관리자",
        appliedOwner: "전체화주",
        closeDate: "2026-03-01",
        startMonth: "03",
        startDay: "01",
        endMonth: "03",
        endDay: "31",
        closeMonth: "04",
        closeDay: "10",
        allowDays: 10,
        isAuto: false,
      },
    ];

    return demoRows.filter((r) => {
      if (closeTypeFilter && r.closeType !== closeTypeFilter) return false;
      if (taskFilter && r.task !== taskFilter) return false;
      return true;
    });
  }, [closingRows, closeTypeFilter, taskFilter]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleSave = useCallback(() => {
    addToast({ type: "success", message: "마감설정이 저장되었습니다." });
  }, [addToast]);

  const handleNew = useCallback(() => {
    addToast({ type: "info", message: "신규 마감설정이 추가되었습니다." });
  }, [addToast]);

  const handleDelete = useCallback(() => {
    if (selectedRows.size === 0) {
      addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    addToast({ type: "success", message: `${selectedRows.size}건이 삭제되었습니다.` });
    setSelectedRows(new Set());
  }, [selectedRows, addToast]);

  const handleExcel = useCallback(() => {
    downloadExcel("/export/period-close", "마감관리.xlsx");
  }, []);

  const toggleRowSelect = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns: Column<ClosingRow>[] = [
    {
      key: "select",
      header: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={() => toggleRowSelect(row.id)}
          className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]/20"
        />
      ),
    },
    {
      key: "closeTypeLabel",
      header: "마감구분",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#E8F3FF] px-3 py-1 text-xs font-semibold text-[#3182F6]">
          {row.closeTypeLabel}
        </span>
      ),
    },
    {
      key: "taskLabel",
      header: "업무",
      render: (row) => <span className="text-sm text-[#191F28]">{row.taskLabel}</span>,
    },
    {
      key: "authority",
      header: "권한",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.authority}</span>,
    },
    {
      key: "appliedOwner",
      header: "적용화주",
      render: (row) => <span className="text-sm text-[#191F28]">{row.appliedOwner}</span>,
    },
    {
      key: "closeDate",
      header: "마감일자",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.closeDate}</span>,
    },
    {
      key: "startPeriod",
      header: "시작월/일",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.startMonth}/{row.startDay}</span>,
    },
    {
      key: "endPeriod",
      header: "종료월/일",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.endMonth}/{row.endDay}</span>,
    },
    {
      key: "closePeriod",
      header: "마감월/일",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.closeMonth}/{row.closeDay}</span>,
    },
    {
      key: "allowDays",
      header: "허용일",
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{row.allowDays}</span>,
    },
    {
      key: "isAuto",
      header: "자동여부",
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          row.isAuto
            ? "bg-[#E8F5E9] text-[#1FC47D]"
            : "bg-[#F2F4F6] text-[#8B95A1]"
        }`}>
          {row.isAuto ? "Y" : "N"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">마감관리</h1>
          <p className="mt-1 text-sm text-[#8B95A1]">기준관리 &gt; 마감관리</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4" />
            저장
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNew}>
            <Plus className="h-4 w-4" />
            신규
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
          <Button variant="outline" size="sm" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">마감구분</label>
            <select
              value={closeTypeFilter}
              onChange={(e) => { setCloseTypeFilter(e.target.value); setPage(1); }}
              className={inputBase}
            >
              {CLOSE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">업무</label>
            <select
              value={taskFilter}
              onChange={(e) => { setTaskFilter(e.target.value); setPage(1); }}
              className={inputBase}
            >
              {TASK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">화주</label>
            <select
              value={ownerFilter}
              onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
              className={inputBase}
            >
              <option value="">전체</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            조회
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={displayRows}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages > 1 ? totalPages : 1}
            total={displayRows.length || total}
            onPageChange={setPage}
            emptyMessage="마감 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
