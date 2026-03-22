"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Download, AlertCircle, X } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import ItemSearchPopup from "@/components/ui/ItemSearchPopup";
import { formatNumber } from "@/lib/utils";
import { useWarehouses, useInventoryList } from "@/hooks/useApi";
import { downloadExcel } from "@/lib/export";
import type { Inventory, Item } from "@/types";

/* ── helper: popup trigger input ───────────────────────────── */
const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none cursor-pointer focus:ring-2 focus:ring-[#3182F6]/20";

interface PopupFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
  onClear: () => void;
}
function PopupField({ label, value, placeholder, onClick, onClear }: PopupFieldProps) {
  return (
    <div className="min-w-[180px] flex-1">
      <label className="mb-2 block text-sm font-medium text-[#4E5968]">{label}</label>
      <div className="relative">
        <input readOnly value={value} placeholder={placeholder} onClick={onClick} className={inputBase} />
        {value && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#B0B8C1] hover:text-[#4E5968]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Simple generic search popup ─────────────────────────────── */
function SimpleSearchPopup({
  isOpen,
  onClose,
  title,
  data,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: { id: string; code: string; name: string }[];
  onSelect: (row: { id: string; code: string; name: string }) => void;
}) {
  const [q, setQ] = useState("");
  if (!isOpen) return null;
  const filtered = data.filter(
    (r) => r.code.toLowerCase().includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
          <h3 className="text-lg font-bold text-[#191F28]">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#F7F8FA] hover:text-[#4E5968]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b border-[#F2F4F6] px-6 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="코드, 이름 검색..."
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#8B95A1]">검색 결과가 없습니다</div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-[#F2F4F6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">코드</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">이름</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => { onSelect(r); onClose(); }}
                    className="cursor-pointer border-b border-[#F7F8FA] transition-colors hover:bg-[#E8F2FF]/50"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-[#3182F6]">{r.code}</td>
                    <td className="px-6 py-3 text-sm text-[#191F28]">{r.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Location text popup ───────────────────────────────────── */
function LocationInputPopup({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
}) {
  const [q, setQ] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
          <h3 className="text-lg font-bold text-[#191F28]">로케이션 검색</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#F7F8FA] hover:text-[#4E5968]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim()) { onSelect(q.trim()); onClose(); }
              }}
              placeholder="로케이션코드 입력 후 Enter..."
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => { if (q.trim()) { onSelect(q.trim()); onClose(); } }}>
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Main Page – LOT별재고현황 (Slide 88)
   Grid: LOT_NO, 화주, 창고, 로케이션, 상품, 수량, UOM
   ================================================================ */
export default function LotStockReportPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseLabel, setWarehouseLabel] = useState("");
  const [partnerLabel, setPartnerLabel] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [locationCode, setLocationCode] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showWarehousePopup, setShowWarehousePopup] = useState(false);
  const [showPartnerPopup, setShowPartnerPopup] = useState(false);
  const [showItemPopup, setShowItemPopup] = useState(false);

  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    page,
    limit: 50,
    ...(warehouseId ? { warehouseId } : {}),
    ...(search ? { search } : {}),
  });

  const allItems = inventoryResponse?.data ?? [];
  const total = inventoryResponse?.total ?? 0;
  const totalPages = inventoryResponse?.totalPages ?? 1;

  // Only show items with LOT numbers
  const lotItems = useMemo(() => allItems.filter((i) => i.lotNumber), [allItems]);

  const handleSearch = useCallback(() => {
    const parts: string[] = [];
    if (locationCode) parts.push(locationCode);
    if (selectedItem) parts.push(selectedItem.code);
    setSearch(parts.join(" "));
    setPage(1);
  }, [locationCode, selectedItem]);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouseId", warehouseId);
    if (search) params.set("search", search);
    const qs = params.toString();
    downloadExcel(`/export/inventory${qs ? `?${qs}` : ""}`, "LOT별재고현황.xlsx");
  }, [warehouseId, search]);

  const columns: Column<Inventory>[] = [
    {
      key: "lotNumber",
      header: "LOT_NO",
      sortable: true,
      render: (row) => (
        <span className="rounded-lg bg-[#E8F3FF] px-2.5 py-1 text-xs font-semibold text-[#3182F6]">
          {row.lotNumber}
        </span>
      ),
    },
    {
      key: "partner",
      header: "화주",
      sortable: true,
      render: () => <span className="text-sm text-[#4E5968]">-</span>,
    },
    {
      key: "warehouse",
      header: "창고",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.warehouse?.name ?? "-"}</span>,
    },
    {
      key: "locationCode",
      header: "로케이션",
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-[#191F28]">{row.locationCode || "-"}</span>,
    },
    {
      key: "itemName",
      header: "상품",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#191F28]">
          {row.item ? `${row.item.code} ${row.item.name}` : "-"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "수량",
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.quantity)}</span>,
    },
    {
      key: "uom",
      header: "UOM",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-medium text-[#4E5968]">
          {row.item?.uom ?? "-"}
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
            <h1 className="text-2xl font-bold text-[#191F28]">LOT별재고현황</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; LOT별재고현황</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExcel}>
            <Download className="h-4 w-4" />
            엑셀
          </Button>
        </div>
      </div>

      {/* Search Filters – 2 rows */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <PopupField
            label="로케이션"
            value={locationCode}
            placeholder="로케이션 선택..."
            onClick={() => setShowLocationPopup(true)}
            onClear={() => setLocationCode("")}
          />
          <PopupField
            label="창고"
            value={warehouseLabel}
            placeholder="창고 선택..."
            onClick={() => setShowWarehousePopup(true)}
            onClear={() => { setWarehouseId(""); setWarehouseLabel(""); }}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <PopupField
            label="화주"
            value={partnerLabel}
            placeholder="화주 선택..."
            onClick={() => setShowPartnerPopup(true)}
            onClear={() => setPartnerLabel("")}
          />
          <PopupField
            label="상품"
            value={selectedItem ? `${selectedItem.code} ${selectedItem.name}` : ""}
            placeholder="상품 선택..."
            onClick={() => setShowItemPopup(true)}
            onClear={() => setSelectedItem(null)}
          />
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
            data={lotItems}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            emptyMessage="LOT 재고 데이터가 없습니다."
          />
        )}
      </div>

      {/* Popups */}
      <LocationInputPopup
        isOpen={showLocationPopup}
        onClose={() => setShowLocationPopup(false)}
        onSelect={(code) => setLocationCode(code)}
      />
      <SimpleSearchPopup
        isOpen={showWarehousePopup}
        onClose={() => setShowWarehousePopup(false)}
        title="창고 검색"
        data={warehouses}
        onSelect={(w) => { setWarehouseId(w.id); setWarehouseLabel(`${w.code} ${w.name}`); }}
      />
      <SimpleSearchPopup
        isOpen={showPartnerPopup}
        onClose={() => setShowPartnerPopup(false)}
        title="화주 검색"
        data={[]}
        onSelect={() => {}}
      />
      <ItemSearchPopup
        isOpen={showItemPopup}
        onClose={() => setShowItemPopup(false)}
        onSelect={(item) => setSelectedItem(item)}
      />
    </div>
  );
}
