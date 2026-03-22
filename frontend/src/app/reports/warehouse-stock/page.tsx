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
        <input
          readOnly
          value={value}
          placeholder={placeholder}
          onClick={onClick}
          className={inputBase}
        />
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

/* ── Warehouse Search Popup ──────────────────────────────────── */
function WarehouseSearchPopup({
  isOpen,
  onClose,
  onSelect,
  warehouses,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (w: { id: string; code: string; name: string }) => void;
  warehouses: { id: string; code: string; name: string }[];
}) {
  const [q, setQ] = useState("");
  if (!isOpen) return null;
  const filtered = warehouses.filter(
    (w) => w.code.toLowerCase().includes(q.toLowerCase()) || w.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
          <h3 className="text-lg font-bold text-[#191F28]">창고 검색</h3>
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
              placeholder="창고코드, 창고명 검색..."
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">창고코드</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">창고명</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr
                    key={w.id}
                    onClick={() => { onSelect(w); onClose(); }}
                    className="cursor-pointer border-b border-[#F7F8FA] transition-colors hover:bg-[#E8F2FF]/50"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-[#3182F6]">{w.code}</td>
                    <td className="px-6 py-3 text-sm text-[#191F28]">{w.name}</td>
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

/* ── Partner (화주) Search Popup ──────────────────────────────── */
function PartnerSearchPopup({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (p: { code: string; name: string }) => void;
}) {
  // placeholder – no partner data available in inventory, shows a simple popup
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
          <h3 className="text-lg font-bold text-[#191F28]">화주 검색</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#F7F8FA] hover:text-[#4E5968]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="py-10 text-center text-sm text-[#8B95A1]">화주 데이터가 없습니다</div>
      </div>
    </div>
  );
}

/* ================================================================
   Main Page – 창고별재고조회 (Slide 84) Master-Detail
   ================================================================ */
export default function WarehouseStockReportPage() {
  /* ── search state ── */
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseLabel, setWarehouseLabel] = useState("");
  const [partnerLabel, setPartnerLabel] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [page, setPage] = useState(1);

  /* ── popup toggles ── */
  const [showWarehousePopup, setShowWarehousePopup] = useState(false);
  const [showPartnerPopup, setShowPartnerPopup] = useState(false);
  const [showItemPopup, setShowItemPopup] = useState(false);

  /* ── master-detail state ── */
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  /* ── data ── */
  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const { data: inventoryResponse, isLoading, error } = useInventoryList({
    page,
    limit: 50,
    ...(warehouseId ? { warehouseId } : {}),
    ...(selectedItem ? { search: selectedItem.code } : {}),
  });

  const items = inventoryResponse?.data ?? [];
  const total = inventoryResponse?.total ?? 0;
  const totalPages = inventoryResponse?.totalPages ?? 1;

  /* ── detail rows: filter items by same warehouse+item of selected row ── */
  const selectedRow = useMemo(
    () => items.find((i) => i.id === selectedRowId) ?? null,
    [items, selectedRowId]
  );

  const detailRows = useMemo(() => {
    if (!selectedRow) return [];
    return items.filter(
      (i) =>
        i.warehouseId === selectedRow.warehouseId &&
        i.itemId === selectedRow.itemId
    );
  }, [items, selectedRow]);

  const handleSearch = useCallback(() => {
    setPage(1);
    setSelectedRowId(null);
  }, []);

  const handleExcel = useCallback(() => {
    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouseId", warehouseId);
    if (selectedItem) params.set("search", selectedItem.code);
    const qs = params.toString();
    downloadExcel(`/export/inventory${qs ? `?${qs}` : ""}`, "창고별재고조회.xlsx");
  }, [warehouseId, selectedItem]);

  /* ── TOP grid columns: 창고, 화주코드, 화주명, 상품코드, 상품명, 수량, UOM ── */
  const masterColumns: Column<Inventory>[] = [
    {
      key: "warehouseName",
      header: "창고",
      sortable: true,
      render: (row) => <span className="text-sm text-[#191F28]">{row.warehouse?.name ?? "-"}</span>,
    },
    {
      key: "partnerCode",
      header: "화주코드",
      render: () => <span className="text-sm font-mono text-[#4E5968]">-</span>,
    },
    {
      key: "partnerName",
      header: "화주명",
      render: () => <span className="text-sm text-[#191F28]">-</span>,
    },
    {
      key: "itemCode",
      header: "상품코드",
      sortable: true,
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.item?.code ?? "-"}</span>,
    },
    {
      key: "itemName",
      header: "상품명",
      render: (row) => <span className="text-sm text-[#191F28]">{row.item?.name ?? "-"}</span>,
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
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-medium text-[#4E5968]">
          {row.item?.uom ?? "-"}
        </span>
      ),
    },
  ];

  /* ── BOTTOM grid columns: 로케이션, 상품코드, 상품명, 재고수량, UOM ── */
  const detailColumns: Column<Inventory>[] = [
    {
      key: "locationCode",
      header: "로케이션",
      sortable: true,
      render: (row) => <span className="text-sm font-medium text-[#191F28]">{row.locationCode || "-"}</span>,
    },
    {
      key: "itemCode",
      header: "상품코드",
      render: (row) => <span className="text-sm font-mono text-[#4E5968]">{row.item?.code ?? "-"}</span>,
    },
    {
      key: "itemName",
      header: "상품명",
      render: (row) => <span className="text-sm text-[#191F28]">{row.item?.name ?? "-"}</span>,
    },
    {
      key: "quantity",
      header: "재고수량",
      sortable: true,
      render: (row) => <span className="text-sm font-bold text-[#191F28]">{formatNumber(row.quantity)}</span>,
    },
    {
      key: "uom",
      header: "UOM",
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
            <h1 className="text-2xl font-bold text-[#191F28]">창고별재고조회</h1>
            <p className="text-sm text-[#8B95A1]">리포트 &gt; 창고별재고조회</p>
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
          <PopupField
            label="창고"
            value={warehouseLabel}
            placeholder="창고 선택..."
            onClick={() => setShowWarehousePopup(true)}
            onClear={() => { setWarehouseId(""); setWarehouseLabel(""); }}
          />
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

      {/* TOP Grid – 창고목록 */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-4 text-sm font-semibold text-[#4E5968]">창고목록</h2>
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={masterColumns}
            data={items}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={(row) => setSelectedRowId(row.id)}
            activeRowId={selectedRowId ?? undefined}
            emptyMessage="재고 데이터가 없습니다."
          />
        )}
      </div>

      {/* BOTTOM Grid – 재고목록 (detail for selected row) */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-4 text-sm font-semibold text-[#4E5968]">
          재고목록
          {selectedRow && (
            <span className="ml-2 text-xs font-normal text-[#8B95A1]">
              ({selectedRow.warehouse?.name} / {selectedRow.item?.name})
            </span>
          )}
        </h2>
        {selectedRowId ? (
          <Table
            columns={detailColumns}
            data={detailRows}
            isLoading={false}
            emptyMessage="선택한 항목의 상세 재고가 없습니다."
          />
        ) : (
          <div className="py-12 text-center text-sm text-[#B0B8C1]">
            상단 창고목록에서 행을 선택하면 상세 재고가 표시됩니다.
          </div>
        )}
      </div>

      {/* Popups */}
      <WarehouseSearchPopup
        isOpen={showWarehousePopup}
        onClose={() => setShowWarehousePopup(false)}
        warehouses={warehouses}
        onSelect={(w) => { setWarehouseId(w.id); setWarehouseLabel(`${w.code} ${w.name}`); }}
      />
      <PartnerSearchPopup
        isOpen={showPartnerPopup}
        onClose={() => setShowPartnerPopup(false)}
        onSelect={(p) => setPartnerLabel(`${p.code} ${p.name}`)}
      />
      <ItemSearchPopup
        isOpen={showItemPopup}
        onClose={() => setShowItemPopup(false)}
        onSelect={(item) => setSelectedItem(item)}
      />
    </div>
  );
}
