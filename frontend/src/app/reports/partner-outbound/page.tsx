"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/utils";
import { useOutboundOrders, usePartners } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { OutboundOrder } from "@/types";

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function PartnerOutboundReportPage() {
  const defaults = getDefaultDates();
  const [partnerId, setPartnerId] = useState("");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [page, setPage] = useState(1);

  const { data: partnerResponse } = usePartners({ limit: 100, type: "CUSTOMER" });
  const partners = partnerResponse?.data ?? [];

  const { data: outboundResponse, isLoading, error } = useOutboundOrders({
    page,
    limit: 50,
    ...(partnerId ? { partnerId } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });

  const orders = outboundResponse?.data ?? [];
  const total = outboundResponse?.total ?? 0;
  const totalPages = outboundResponse?.totalPages ?? 1;

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (partnerId) params.set("partnerId", partnerId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    downloadExcel(`/export/outbound${qs ? `?${qs}` : ""}`, "거래처별출고내역.xlsx");
  }, [partnerId, startDate, endDate]);

  const columns: Column<OutboundOrder>[] = [
    {
      key: "partnerCode",
      header: "거래처코드",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.partner?.code ?? "-"}</span>,
    },
    {
      key: "partnerName",
      header: "거래처명",
      render: (row) => <span className="text-sm text-[#191F28]">{row.partner?.name ?? "-"}</span>,
    },
    {
      key: "orderNumber",
      header: "주문번호",
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-[#3182F6]">{row.orderNumber}</span>,
    },
    {
      key: "shipDate",
      header: "출고일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{formatDate(row.shipDate)}</span>,
    },
    {
      key: "itemCode",
      header: "상품코드",
      render: (row) => (
        <span className="text-sm font-mono text-[#4E5968]">
          {row.lines?.[0]?.item?.code ?? "-"}
          {(row.lines?.length ?? 0) > 1 && ` 외 ${(row.lines?.length ?? 1) - 1}건`}
        </span>
      ),
    },
    {
      key: "itemName",
      header: "상품명",
      render: (row) => (
        <span className="text-sm text-[#191F28]">
          {row.lines?.[0]?.item?.name ?? "-"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "수량",
      render: (row) => (
        <span className="text-sm font-bold text-[#191F28]">
          {formatNumber(row.lines?.reduce((s, l) => s + l.orderedQty, 0) ?? 0)}
        </span>
      ),
    },
    {
      key: "uom",
      header: "UOM",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-medium text-[#4E5968]">
          {row.lines?.[0]?.item?.uom ?? "-"}
        </span>
      ),
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
            <h1 className="text-2xl font-bold text-[#191F28]">거래처별출고내역조회</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; 거래처별출고내역조회</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[150px]">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">기간(From)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">기간(To)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">거래처</label>
            <select
              value={partnerId}
              onChange={(e) => { setPartnerId(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            >
              <option value="">전체 거래처</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">화주</label>
            <select
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              defaultValue=""
            >
              <option value="">전체</option>
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
            data={orders}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            emptyMessage="출고 데이터가 없습니다."
          />
        )}
      </div>
    </div>
  );
}
