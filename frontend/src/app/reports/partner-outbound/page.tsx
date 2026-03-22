"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/utils";
import { useOutboundOrders, usePartners } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { OutboundOrder } from "@/types";

export default function PartnerOutboundReportPage() {
  const [partnerId, setPartnerId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data: partnerResponse } = usePartners({ limit: 100, type: "CUSTOMER" });
  const partners = partnerResponse?.data ?? [];

  const { data: outboundResponse, isLoading, error } = useOutboundOrders({
    page,
    limit: 50,
    ...(partnerId ? { partnerId } : {}),
    ...(status ? { status } : {}),
  });

  const orders = outboundResponse?.data ?? [];
  const total = outboundResponse?.total ?? 0;
  const totalPages = outboundResponse?.totalPages ?? 1;

  const summary = useMemo(() => {
    const totalQty = orders.reduce(
      (s, o) => s + (o.lines?.reduce((ss, l) => ss + l.orderedQty, 0) ?? 0),
      0
    );
    const shippedQty = orders.reduce(
      (s, o) => s + (o.lines?.reduce((ss, l) => ss + l.shippedQty, 0) ?? 0),
      0
    );
    return {
      orderCount: total,
      totalQty,
      shippedQty,
    };
  }, [orders, total]);

  const statusOptions = [
    { value: "", label: "전체 상태" },
    { value: "DRAFT", label: "초안" },
    { value: "CONFIRMED", label: "확정" },
    { value: "PICKING", label: "피킹중" },
    { value: "PACKING", label: "패킹중" },
    { value: "SHIPPED", label: "출하완료" },
    { value: "DELIVERED", label: "배송완료" },
    { value: "CANCELLED", label: "취소" },
  ];

  const columns: Column<OutboundOrder>[] = [
    { key: "orderNumber", header: "주문번호", sortable: true },
    {
      key: "partner",
      header: "거래처",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#8B95A1]" />
          <span className="text-sm text-[#191F28]">{row.partner?.name ?? "-"}</span>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "출고창고",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.warehouse?.name ?? "-"}</span>,
    },
    {
      key: "status",
      header: "상태",
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: "itemCount",
      header: "품목수",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.lines?.length ?? 0}건</span>,
    },
    {
      key: "totalQty",
      header: "주문수량",
      render: (row) => (
        <span className="text-sm font-bold text-[#191F28]">
          {formatNumber(row.lines?.reduce((s, l) => s + l.orderedQty, 0) ?? 0)}
        </span>
      ),
    },
    {
      key: "shippedQty",
      header: "출하수량",
      render: (row) => (
        <span className="text-sm font-semibold text-[#1FC47D]">
          {formatNumber(row.lines?.reduce((s, l) => s + l.shippedQty, 0) ?? 0)}
        </span>
      ),
    },
    {
      key: "shipDate",
      header: "출고일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{formatDate(row.shipDate)}</span>,
    },
    {
      key: "trackingNumber",
      header: "운송장",
      render: (row) =>
        row.trackingNumber ? (
          <span className="rounded-lg bg-[#E8F3FF] px-2 py-1 text-xs font-semibold text-[#3182F6]">{row.trackingNumber}</span>
        ) : (
          <span className="text-[#B0B8C1]">-</span>
        ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4E5968] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#F2F4F6]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-[#191F28]">거래처별 출고 내역</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadExcel(`/export/outbound${status ? `?status=${status}` : ""}`, "거래처별출고내역.xlsx")}>
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </Button>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">거래처</label>
            <select value={partnerId} onChange={(e) => { setPartnerId(e.target.value); setPage(1); }} className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20">
              <option value="">전체 거래처</option>
              {partners.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.code})</option>))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">상태</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none focus:ring-2 focus:ring-[#3182F6]/20">
              {statusOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">주문 건수</p>
          <p className="mt-2 text-3xl font-bold text-[#3182F6]">{formatNumber(summary.orderCount)}</p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">총 주문수량</p>
          <p className="mt-2 text-3xl font-bold text-[#191F28]">{formatNumber(summary.totalQty)}</p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">출하수량</p>
          <p className="mt-2 text-3xl font-bold text-[#1FC47D]">{formatNumber(summary.shippedQty)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table columns={columns} data={orders} isLoading={isLoading} page={page} totalPages={totalPages} total={total} onPageChange={setPage} emptyMessage="출고 데이터가 없습니다." />
        )}
      </div>
    </div>
  );
}
