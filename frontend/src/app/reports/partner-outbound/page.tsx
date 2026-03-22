"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import ItemSearchPopup from "@/components/ui/ItemSearchPopup";
import { formatNumber, formatDate } from "@/lib/utils";
import { useOutboundOrders, usePartners } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { OutboundOrder, Item } from "@/types";

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

export default function PartnerOutboundReportPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [carrierId, setCarrierId] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [page, setPage] = useState(1);

  // Popup states
  const [itemPopupOpen, setItemPopupOpen] = useState(false);

  const { data: partnerResponse } = usePartners({ limit: 200 });
  const allPartners = partnerResponse?.data ?? [];
  const carriers = allPartners.filter((p) => p.type === "CARRIER" || p.type === "SUPPLIER");
  const customers = allPartners.filter((p) => p.type === "CUSTOMER");
  const owners = allPartners.filter((p) => (p.type as string) === "OWNER" || p.type === "SUPPLIER");

  const { data: outboundResponse, isLoading, error } = useOutboundOrders({
    page,
    limit: 50,
    ...(carrierId ? { carrierId } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });

  const orders = outboundResponse?.data ?? [];
  const total = outboundResponse?.total ?? 0;
  const totalPages = outboundResponse?.totalPages ?? 1;

  // Calculate totals for footer
  const totals = useMemo(() => {
    let totalQty = 0;
    orders.forEach((o) => {
      totalQty += o.lines?.reduce((s, l) => s + l.orderedQty, 0) ?? 0;
    });
    return { totalQty };
  }, [orders]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (carrierId) params.set("carrierId", carrierId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    downloadExcel(`/export/outbound${qs ? `?${qs}` : ""}`, "거래처별출고내역.xlsx");
  }, [carrierId, startDate, endDate]);

  const columns: Column<OutboundOrder>[] = [
    {
      key: "carrier",
      header: "운송사",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.partner?.name ?? "-"}</span>,
    },
    {
      key: "orderDate",
      header: "주문요청일",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "destination",
      header: "상차지/배송처",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#191F28]">
          {row.partner?.name || "-"}
        </span>
      ),
    },
    {
      key: "owner",
      header: "화주",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.partner?.name ?? "-"}</span>,
    },
    {
      key: "itemName",
      header: "상품",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#191F28]">
          {row.lines?.[0]?.item?.name ?? "-"}
          {(row.lines?.length ?? 0) > 1 && ` 외 ${(row.lines?.length ?? 1) - 1}건`}
        </span>
      ),
    },
    {
      key: "inboundDispatch",
      header: "입고배차",
      sortable: true,
      render: () => <span className="text-sm text-[#4E5968]">-</span>,
    },
    {
      key: "outboundDispatch",
      header: "출고배차",
      sortable: true,
      render: () => <span className="text-sm text-[#4E5968]">-</span>,
    },
    {
      key: "uom",
      header: "UOM",
      sortable: true,
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

      {/* Search Filters - 2 rows */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Row 1 */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[150px]">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">주문일자(From)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className={inputBase}
            />
          </div>
          <div className="min-w-[150px]">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">주문일자(To)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className={inputBase}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">운송사</label>
            <select
              value={carrierId}
              onChange={(e) => { setCarrierId(e.target.value); setPage(1); }}
              className={inputBase}
            >
              <option value="">ALL</option>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">상품</label>
            <div
              onClick={() => setItemPopupOpen(true)}
              className={`${inputBase} cursor-pointer truncate`}
            >
              {selectedItem ? `${selectedItem.name} (${selectedItem.code})` : "상품 검색..."}
            </div>
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
          <div className="min-w-[180px] flex-1">
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">거래처</label>
            <select
              value={partnerFilter}
              onChange={(e) => { setPartnerFilter(e.target.value); setPage(1); }}
              className={inputBase}
            >
              <option value="">전체</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
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
          <>
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
            {/* Footer totals */}
            {orders.length > 0 && (
              <div className="mt-3 flex items-center justify-end gap-6 border-t border-[#F2F4F6] pt-3">
                <span className="text-sm font-semibold text-[#4E5968]">
                  합계: <span className="text-[#191F28]">{formatNumber(totals.totalQty)}</span>
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Search Popup */}
      <ItemSearchPopup
        isOpen={itemPopupOpen}
        onClose={() => setItemPopupOpen(false)}
        onSelect={(item) => setSelectedItem(item)}
      />
    </div>
  );
}
