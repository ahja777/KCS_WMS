"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";

interface LowStockRow {
  id: string;
  code: string;
  name: string;
  totalQty: number;
  minStock: number;
  shortage: number;
  uom: string;
  warehouse: string;
}

export default function LowStockReportPage() {
  const { data: dashboard, isLoading, error } = useDashboardSummary();
  const [page, setPage] = useState(1);

  const lowStockItems = dashboard?.alerts.lowStockItems ?? [];

  const rows: LowStockRow[] = useMemo(() => {
    return lowStockItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      totalQty: item.totalQty,
      minStock: item.minStock,
      shortage: Math.max(0, item.minStock - item.totalQty),
      uom: "-",
      warehouse: "-",
    }));
  }, [lowStockItems]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const handleExcel = () => {
    downloadExcel("/export/inventory?lowStock=true", "적정재고미달.xlsx");
  };

  const columns: Column<LowStockRow>[] = [
    {
      key: "code",
      header: "상품코드",
      sortable: true,
      render: (row) => <span className="text-sm font-mono font-medium text-[#191F28]">{row.code}</span>,
    },
    {
      key: "name",
      header: "상품명",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.name}</span>,
    },
    {
      key: "totalQty",
      header: "현재고",
      sortable: true,
      render: (row) => (
        <span className={`text-sm font-bold ${row.totalQty < row.minStock ? "text-[#F04452]" : "text-[#191F28]"}`}>
          {formatNumber(row.totalQty)}
        </span>
      ),
    },
    {
      key: "minStock",
      header: "적정재고",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{formatNumber(row.minStock)}</span>,
    },
    {
      key: "shortage",
      header: "부족수량",
      sortable: true,
      render: (row) =>
        row.shortage > 0 ? (
          <span className="text-sm font-bold text-[#F04452]">-{formatNumber(row.shortage)}</span>
        ) : (
          <span className="text-sm text-[#B0B8C1]">-</span>
        ),
    },
    {
      key: "uom",
      header: "UOM",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-medium text-[#4E5968]">
          {row.uom}
        </span>
      ),
    },
    {
      key: "warehouse",
      header: "창고",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.warehouse}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4E5968] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#F2F4F6]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#191F28]">적정재고미달</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; 적정재고미달</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
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
            data={pagedRows}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={rows.length}
            onPageChange={setPage}
            emptyMessage="적정재고 미달 품목이 없습니다."
          />
        )}
      </div>
    </div>
  );
}
