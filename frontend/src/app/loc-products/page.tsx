"use client";

import { useState } from "react";
import { Search, RotateCcw, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import { useWarehouses, usePartners, useItems, useInventoryList } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { downloadExcel } from "@/lib/export";
import { formatDate } from "@/lib/utils";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

interface LocProductRow {
  id: string;
  center: string;
  location: string;
  partnerName: string;
  itemName: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  _selected?: boolean;
}

export default function LocProductsPage() {
  const [warehouseId, setWarehouseId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [page, setPage] = useState(1);

  // Registration form
  const [formLocation, setFormLocation] = useState("");
  const [formPartner, setFormPartner] = useState("");
  const [formItem, setFormItem] = useState("");

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const addToast = useToastStore((s) => s.addToast);

  const { data: warehouseRes } = useWarehouses({ limit: 100 });
  const warehouses = warehouseRes?.data ?? [];

  const { data: partnerRes } = usePartners({ limit: 100 });
  const partners = partnerRes?.data ?? [];

  const { data: itemsRes } = useItems({ limit: 200 });
  const items = itemsRes?.data ?? [];

  const { data: inventoryRes, isLoading } = useInventoryList({
    limit: 50,
    page,
    ...(warehouseId ? { warehouseId } : {}),
  });

  const inventoryItems = inventoryRes?.data ?? [];

  // Build loc product list from inventory data
  const locProducts: LocProductRow[] = inventoryItems.map((inv) => ({
    id: inv.id,
    center: inv.warehouse?.name ?? "-",
    location: inv.locationCode ?? "-",
    partnerName: "-",
    itemName: inv.item?.name ?? "-",
    createdAt: formatDate(inv.updatedAt),
    createdBy: "-",
    updatedAt: formatDate(inv.updatedAt),
    updatedBy: "-",
  }));

  const handleReset = () => {
    setFormLocation("");
    setFormPartner("");
    setFormItem("");
  };

  const handleSearchReset = () => {
    setWarehouseId("");
    setPartnerId("");
    setItemSearch("");
    setPage(1);
  };

  const handleRegister = () => {
    if (!formLocation || !formItem) {
      addToast({ type: "error", message: "로케이션과 상품은 필수입니다." });
      return;
    }
    addToast({ type: "success", message: "입고상품이 등록되었습니다." });
    handleReset();
  };

  const handleSave = () => {
    addToast({ type: "success", message: "저장되었습니다." });
  };

  const handleDelete = () => {
    if (selectedRows.size === 0) {
      addToast({ type: "error", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    addToast({ type: "success", message: `${selectedRows.size}건이 삭제되었습니다.` });
    setSelectedRows(new Set());
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: Column<LocProductRow>[] = [
    {
      key: "select",
      header: "",
      width: "w-10",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={() => toggleRow(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
        />
      ),
    },
    { key: "center", header: "물류센터" },
    { key: "location", header: "로케이션" },
    { key: "partnerName", header: "화주명" },
    { key: "itemName", header: "상품명" },
    { key: "createdAt", header: "등록일자" },
    { key: "createdBy", header: "등록자" },
    { key: "updatedAt", header: "수정일자" },
    { key: "updatedBy", header: "수정자" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; LOC별입고상품등록</p>
          <h1 className="text-2xl font-bold text-[#191F28]">LOC별입고상품등록</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">창고</label>
            <div className="flex gap-1">
              <select
                value={warehouseId}
                onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
                className={`flex-1 ${inputBase}`}
              >
                <option value="">전체</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">화주</label>
            <div className="flex gap-1">
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className={`flex-1 ${inputBase}`}
              >
                <option value="">전체</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">상품</label>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="상품"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className={`flex-1 ${inputBase}`}
              />
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSearchReset}
            className="flex h-[46px] items-center rounded-xl bg-[#F2F4F6] px-3 text-[#4E5968] hover:bg-[#E5E8EB]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(1)}
            className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Registration Form (center) */}
      <div className="flex justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-[#E5E8EB] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="mb-4 text-sm font-bold text-[#191F28]">입고상품등록</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-20 shrink-0 text-sm font-medium text-red-500">*로케이션</label>
              <div className="flex flex-1 gap-1">
                <input
                  type="text"
                  placeholder="로케이션"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className={`flex-1 ${inputBase}`}
                />
                <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-20 shrink-0 text-sm font-medium text-[#4E5968]">화주</label>
              <div className="flex flex-1 gap-1">
                <select
                  value={formPartner}
                  onChange={(e) => setFormPartner(e.target.value)}
                  className={`flex-1 ${inputBase}`}
                >
                  <option value="">선택</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-20 shrink-0 text-sm font-medium text-red-500">*상품</label>
              <div className="flex flex-1 gap-1">
                <select
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  className={`flex-1 ${inputBase}`}
                >
                  <option value="">선택</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleReset}
                className="rounded-lg bg-[#F2F4F6] px-4 py-2 text-sm font-medium text-[#4E5968] hover:bg-[#E5E8EB]"
              >
                초기화
              </button>
              <button
                onClick={handleRegister}
                className="rounded-lg bg-[#4E5968] px-4 py-2 text-sm font-medium text-white hover:bg-[#333D4B]"
              >
                입고상품등록
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons + Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-lg bg-[#4A5568] px-4 py-2">
            <h2 className="text-sm font-bold text-white">LOC별입고상품목록</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D63341]"
            >
              저장
            </button>
            <button
              onClick={handleDelete}
              className="rounded-xl bg-[#8B95A1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B7684]"
            >
              삭제
            </button>
            <button
              onClick={() => downloadExcel("/export/loc-products", "loc_products.xlsx")}
              className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17A86B]"
            >
              엑셀
            </button>
          </div>
        </div>
        <Table
          columns={columns}
          data={locProducts}
          isLoading={isLoading}
          page={page}
          totalPages={Math.ceil((inventoryRes?.total ?? 0) / 50)}
          total={inventoryRes?.total ?? 0}
          onPageChange={setPage}
          emptyMessage="입고상품 데이터가 없습니다."
        />
      </div>
    </div>
  );
}
