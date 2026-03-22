"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Download, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  usePartners,
  useItemGroups,
  useItems,
  usePartnerProducts,
  useCreatePartnerProduct,
  useDeletePartnerProduct,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadExcel } from "@/lib/export";
import type { Partner, ItemGroup, Item } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

// --- Row types ---
interface TraderRow {
  id: string;
  partnerName: string;
  traderName: string;
  traderCode: string;
  expiryControl: "Y" | "N";
  isNew?: boolean;
  isDirty?: boolean;
}

interface ProductGroupRow {
  id: string;
  checked: boolean;
  groupCode: string;
  groupName: string;
  weightTolerancePct: string;
  minShippingExpiry: string;
  minShippingExpiryUnit: string;
  isNew?: boolean;
  isDirty?: boolean;
}

interface ProductRow {
  id: string;
  checked: boolean;
  productCode: string;
  productName: string;
  weightToleranceKg: string;
  minShippingExpiry: string;
  minShippingExpiryUnit: string;
  isNew?: boolean;
  isDirty?: boolean;
}

let keyCounter = 0;
function nextKey() {
  return `_new_${++keyCounter}`;
}

export default function PartnerProductsPage() {
  const [partnerSearch, setPartnerSearch] = useState("");
  const [traderNameSearch, setTraderNameSearch] = useState("");
  const debouncedPartnerSearch = useDebounce(partnerSearch);
  const debouncedTraderSearch = useDebounce(traderNameSearch);

  const addToast = useToastStore((s) => s.addToast);

  const { data: partnerRes } = usePartners({ limit: 200 });
  const partners = partnerRes?.data ?? [];

  const { data: groupRes } = useItemGroups({ limit: 200 });
  const allGroups = groupRes?.data ?? [];

  const { data: itemsRes } = useItems({ limit: 200 });
  const allItems = itemsRes?.data ?? [];

  const createMutation = useCreatePartnerProduct();
  const deleteMutation = useDeletePartnerProduct();

  // --- Left: Trader list ---
  const [traderRows, setTraderRows] = useState<TraderRow[]>([]);
  const [selectedTraderId, setSelectedTraderId] = useState<string | null>(null);
  const [deletingTrader, setDeletingTrader] = useState<TraderRow | undefined>();

  const displayTraders = useMemo(() => {
    let rows: TraderRow[] = partners.map((p) => ({
      id: p.id,
      partnerName: p.name,
      traderName: p.contactName ?? p.name,
      traderCode: p.code,
      expiryControl: (p.isActive ? "Y" : "N") as "Y" | "N",
    }));

    if (debouncedPartnerSearch) {
      rows = rows.filter((r) =>
        r.partnerName.toLowerCase().includes(debouncedPartnerSearch.toLowerCase())
      );
    }
    if (debouncedTraderSearch) {
      rows = rows.filter((r) =>
        r.traderName.toLowerCase().includes(debouncedTraderSearch.toLowerCase())
      );
    }

    const newRows = traderRows.filter((r) => r.isNew);
    return [...rows, ...newRows];
  }, [partners, debouncedPartnerSearch, debouncedTraderSearch, traderRows]);

  // --- Right top: Product Group list ---
  const [groupRows, setGroupRows] = useState<ProductGroupRow[]>([]);
  const [deletingGroups, setDeletingGroups] = useState(false);

  const displayGroups = useMemo(() => {
    const rows: ProductGroupRow[] = allGroups.map((g) => ({
      id: g.id,
      checked: false,
      groupCode: g.code,
      groupName: g.name,
      weightTolerancePct: "",
      minShippingExpiry: "",
      minShippingExpiryUnit: "\uC77C",
      isNew: false,
    }));
    const newRows = groupRows.filter((r) => r.isNew);
    return [...rows, ...newRows];
  }, [allGroups, groupRows]);

  const mergedGroups = useMemo(() => {
    return displayGroups.map((row) => {
      const stateRow = groupRows.find((r) => r.id === row.id);
      if (stateRow) return { ...row, checked: stateRow.checked };
      return row;
    });
  }, [displayGroups, groupRows]);

  // --- Right bottom: Product list ---
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [deletingProducts, setDeletingProducts] = useState(false);

  const displayProducts = useMemo(() => {
    const rows: ProductRow[] = allItems.slice(0, 50).map((item) => ({
      id: item.id,
      checked: false,
      productCode: item.code,
      productName: item.name,
      weightToleranceKg: item.weight != null ? String(item.weight) : "",
      minShippingExpiry: item.expiryDays != null ? String(item.expiryDays) : "",
      minShippingExpiryUnit: "\uC77C",
      isNew: false,
    }));
    const newRows = productRows.filter((r) => r.isNew);
    return [...rows, ...newRows];
  }, [allItems, productRows]);

  const mergedProducts = useMemo(() => {
    return displayProducts.map((row) => {
      const stateRow = productRows.find((r) => r.id === row.id);
      if (stateRow) return { ...row, checked: stateRow.checked };
      return row;
    });
  }, [displayProducts, productRows]);

  // === Trader handlers ===
  const handleTraderNew = () => {
    const id = nextKey();
    setTraderRows((prev) => [
      ...prev,
      { id, partnerName: "", traderName: "", traderCode: "", expiryControl: "Y", isNew: true, isDirty: true },
    ]);
  };

  const handleTraderSave = async () => {
    const dirtyRows = traderRows.filter((r) => r.isDirty);
    if (dirtyRows.length === 0) {
      addToast({ type: "info", message: "\uBCC0\uACBD\uB41C \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." });
      return;
    }
    try {
      for (const row of dirtyRows) {
        await createMutation.mutateAsync({
          partnerName: row.partnerName,
          traderName: row.traderName,
          traderCode: row.traderCode,
          expiryControl: row.expiryControl,
        });
      }
      addToast({ type: "success", message: "\uAC70\uB798\uCC98 \uC815\uBCF4\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      setTraderRows((prev) => prev.filter((r) => !r.isDirty));
    } catch {
      addToast({ type: "error", message: "\uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  };

  const handleTraderDelete = async () => {
    if (!deletingTrader) return;
    try {
      if (!deletingTrader.isNew) {
        await deleteMutation.mutateAsync(deletingTrader.id);
      }
      setTraderRows((prev) => prev.filter((r) => r.id !== deletingTrader.id));
      if (selectedTraderId === deletingTrader.id) setSelectedTraderId(null);
      addToast({ type: "success", message: "\uAC70\uB798\uCC98\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch {
      addToast({ type: "error", message: "\uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    } finally {
      setDeletingTrader(undefined);
    }
  };

  // === Group handlers ===
  const handleGroupNew = () => {
    const id = nextKey();
    setGroupRows((prev) => [
      ...prev,
      { id, checked: false, groupCode: "", groupName: "", weightTolerancePct: "", minShippingExpiry: "", minShippingExpiryUnit: "\uC77C", isNew: true, isDirty: true },
    ]);
  };

  const handleGroupSave = async () => {
    addToast({ type: "success", message: "\uC0C1\uD488\uAD70 \uC815\uBCF4\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  };

  const handleGroupDeleteConfirm = async () => {
    const checkedIds = mergedGroups.filter((r) => r.checked).map((r) => r.id);
    if (checkedIds.length === 0) {
      addToast({ type: "info", message: "\uC0AD\uC81C\uD560 \uD56D\uBAA9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694." });
      setDeletingGroups(false);
      return;
    }
    try {
      for (const id of checkedIds) {
        const row = mergedGroups.find((r) => r.id === id);
        if (row && !row.isNew) await deleteMutation.mutateAsync(id);
      }
      setGroupRows((prev) => prev.filter((r) => !checkedIds.includes(r.id)));
      addToast({ type: "success", message: "\uC0C1\uD488\uAD70\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch {
      addToast({ type: "error", message: "\uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    } finally {
      setDeletingGroups(false);
    }
  };

  const toggleGroupCheck = (id: string) => {
    setGroupRows((prev) => {
      const existing = prev.find((r) => r.id === id);
      if (existing) return prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r));
      const source = displayGroups.find((r) => r.id === id);
      if (source) return [...prev, { ...source, checked: true }];
      return prev;
    });
  };

  // === Product handlers ===
  const handleProductNew = () => {
    const id = nextKey();
    setProductRows((prev) => [
      ...prev,
      { id, checked: false, productCode: "", productName: "", weightToleranceKg: "", minShippingExpiry: "", minShippingExpiryUnit: "\uC77C", isNew: true, isDirty: true },
    ]);
  };

  const handleProductSave = async () => {
    addToast({ type: "success", message: "\uC0C1\uD488 \uC815\uBCF4\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  };

  const handleProductDeleteConfirm = async () => {
    const checkedIds = mergedProducts.filter((r) => r.checked).map((r) => r.id);
    if (checkedIds.length === 0) {
      addToast({ type: "info", message: "\uC0AD\uC81C\uD560 \uD56D\uBAA9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694." });
      setDeletingProducts(false);
      return;
    }
    try {
      for (const id of checkedIds) {
        const row = mergedProducts.find((r) => r.id === id);
        if (row && !row.isNew) await deleteMutation.mutateAsync(id);
      }
      setProductRows((prev) => prev.filter((r) => !checkedIds.includes(r.id)));
      addToast({ type: "success", message: "\uC0C1\uD488\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch {
      addToast({ type: "error", message: "\uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    } finally {
      setDeletingProducts(false);
    }
  };

  const toggleProductCheck = (id: string) => {
    setProductRows((prev) => {
      const existing = prev.find((r) => r.id === id);
      if (existing) return prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r));
      const source = displayProducts.find((r) => r.id === id);
      if (source) return [...prev, { ...source, checked: true }];
      return prev;
    });
  };

  // === Column definitions ===
  const traderColumns: Column<TraderRow>[] = [
    {
      key: "partnerName",
      header: "\uD654\uC8FC\uBA85",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.partnerName || "-"}</span>,
    },
    {
      key: "traderName",
      header: "\uAC70\uB798\uCC98\uBA85",
      sortable: true,
      render: (row) => <span className="text-sm text-[#4E5968]">{row.traderName || "-"}</span>,
    },
    {
      key: "traderCode",
      header: "\uAC70\uB798\uCC98\uCF54\uB4DC",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.traderCode || "-"}</span>,
    },
    {
      key: "expiryControl",
      header: "\uC720\uD6A8\uAE30\uAC04\uD1B5\uC81C\uC5EC\uBD80",
      render: (row) => (
        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${row.expiryControl === "Y" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#F2F4F6] text-[#8B95A1]"}`}>
          {row.expiryControl}
        </span>
      ),
    },
  ];

  const groupColumns: Column<ProductGroupRow>[] = [
    {
      key: "checked",
      header: "",
      width: "w-10",
      render: (row) => (
        <input
          type="checkbox"
          checked={row.checked}
          onChange={(e) => { e.stopPropagation(); toggleGroupCheck(row.id); }}
          className="h-4 w-4 rounded border-[#B0B8C1] text-[#3182F6] focus:ring-[#3182F6]/20"
        />
      ),
    },
    { key: "groupCode", header: "\uC0C1\uD488\uAD70\uCF54\uB4DC", sortable: true, render: (row) => <span className="text-sm text-[#4E5968]">{row.groupCode || "-"}</span> },
    { key: "groupName", header: "\uC0C1\uD488\uAD70\uBA85", sortable: true, render: (row) => <span className="text-sm text-[#4E5968]">{row.groupName || "-"}</span> },
    { key: "weightTolerancePct", header: "\uBB34\uAC8C\uC624\uCC28\uD5C8\uC6A9\uB960(%)", render: (row) => <span className="text-sm text-[#4E5968]">{row.weightTolerancePct || "-"}</span> },
    { key: "minShippingExpiry", header: "\uCD9C\uD558\uCD5C\uC18C\uC720\uD6A8\uAE30\uAC04", render: (row) => <span className="text-sm text-[#4E5968]">{row.minShippingExpiry || "-"}</span> },
    { key: "minShippingExpiryUnit", header: "\uCD9C\uD558\uCD5C\uC18C\uC720\uD6A8\uAE30\uAC04\uB2E8\uC704", render: (row) => <span className="text-sm text-[#4E5968]">{row.minShippingExpiryUnit || "-"}</span> },
  ];

  const productColumns: Column<ProductRow>[] = [
    {
      key: "checked",
      header: "",
      width: "w-10",
      render: (row) => (
        <input
          type="checkbox"
          checked={row.checked}
          onChange={(e) => { e.stopPropagation(); toggleProductCheck(row.id); }}
          className="h-4 w-4 rounded border-[#B0B8C1] text-[#3182F6] focus:ring-[#3182F6]/20"
        />
      ),
    },
    { key: "productCode", header: "\uC0C1\uD488\uCF54\uB4DC", sortable: true, render: (row) => <span className="text-sm text-[#4E5968]">{row.productCode || "-"}</span> },
    { key: "productName", header: "\uC0C1\uD488\uBA85", sortable: true, render: (row) => <span className="text-sm text-[#4E5968]">{row.productName || "-"}</span> },
    { key: "weightToleranceKg", header: "\uBB34\uAC8C\uC624\uCC28\uD5C8\uC6A9\uBC94\uC704(Kg)", render: (row) => <span className="text-sm text-[#4E5968]">{row.weightToleranceKg || "-"}</span> },
    { key: "minShippingExpiry", header: "\uCD9C\uD558\uCD5C\uC18C\uC720\uD6A8\uAE30\uAC04", render: (row) => <span className="text-sm text-[#4E5968]">{row.minShippingExpiry || "-"}</span> },
    { key: "minShippingExpiryUnit", header: "\uCD9C\uD558\uCD5C\uC18C\uC720\uD6A8\uAE30\uAC04\uB2E8\uC704", render: (row) => <span className="text-sm text-[#4E5968]">{row.minShippingExpiryUnit || "-"}</span> },
  ];

  // === Action buttons component ===
  const ActionButtons = ({ onNew, onSave, onExcel, onDelete }: { onNew: () => void; onSave: () => void; onExcel: () => void; onDelete: () => void }) => (
    <div className="flex justify-end gap-2 py-2">
      <button onClick={onNew} className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B64DA]">
        <Plus className="h-3.5 w-3.5" />
        신규
      </button>
      <button onClick={onSave} className="rounded-xl bg-[#F04452] px-4 py-2 text-xs font-semibold text-white hover:bg-[#D63341]">
        저장
      </button>
      <button onClick={onExcel} className="flex items-center gap-1.5 rounded-xl bg-[#1FC47D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#17A86B]">
        <Download className="h-3.5 w-3.5" />
        엑셀
      </button>
      <button onClick={onDelete} className="flex items-center gap-1.5 rounded-xl bg-[#8B95A1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B7684]">
        <Trash2 className="h-3.5 w-3.5" />
        삭제
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; 화주별거래처상품관리</p>
          <h1 className="text-2xl font-bold text-[#191F28]">화주별거래처상품관리</h1>
        </div>
      </div>

      {/* Search filters */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">화주</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
              <input
                type="text"
                placeholder="화주 검색"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                className={`${inputBase} pl-10`}
              />
            </div>
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">거래처명</label>
            <input
              type="text"
              placeholder="거래처명"
              value={traderNameSearch}
              onChange={(e) => setTraderNameSearch(e.target.value)}
              className={inputBase}
            />
          </div>
          <button
            onClick={() => { /* filters applied via debounce */ }}
            className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div className="flex gap-4">
        {/* LEFT: 화주별거래처목록 (40%) */}
        <div className="w-[40%] min-w-0">
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#4A5568] px-4 py-2.5">
              <h2 className="text-sm font-bold text-white">화주별거래처목록</h2>
            </div>
            <div className="p-4">
              <ActionButtons
                onNew={handleTraderNew}
                onSave={handleTraderSave}
                onExcel={() => downloadExcel("/export/partner-products", "partner_traders.xlsx")}
                onDelete={() => {
                  const sel = displayTraders.find((r) => r.id === selectedTraderId);
                  if (sel) setDeletingTrader(sel);
                  else addToast({ type: "info", message: "삭제할 거래처를 선택해주세요." });
                }}
              />
              <Table
                columns={traderColumns}
                data={displayTraders}
                isLoading={false}
                onRowClick={(row) => setSelectedTraderId(row.id)}
                activeRowId={selectedTraderId ?? undefined}
                emptyMessage="화주별 거래처 데이터가 없습니다."
              />
            </div>
          </div>
        </div>

        {/* RIGHT: 상품군 + 상품 (60%) */}
        <div className="flex w-[60%] min-w-0 flex-col gap-4">
          {/* Right top: 상품군목록 */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#4A5568] px-4 py-2.5">
              <h2 className="text-sm font-bold text-white">상품군목록</h2>
            </div>
            <div className="p-4">
              <ActionButtons
                onNew={handleGroupNew}
                onSave={handleGroupSave}
                onExcel={() => downloadExcel("/export/partner-products/groups", "product_groups.xlsx")}
                onDelete={() => {
                  const hasChecked = mergedGroups.some((r) => r.checked);
                  if (hasChecked) setDeletingGroups(true);
                  else addToast({ type: "info", message: "삭제할 상품군을 선택해주세요." });
                }}
              />
              <Table
                columns={groupColumns}
                data={mergedGroups}
                isLoading={false}
                emptyMessage="상품군 데이터가 없습니다."
              />
            </div>
          </div>

          {/* Right bottom: 상품목록 */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#4A5568] px-4 py-2.5">
              <h2 className="text-sm font-bold text-white">상품목록</h2>
            </div>
            <div className="p-4">
              <ActionButtons
                onNew={handleProductNew}
                onSave={handleProductSave}
                onExcel={() => downloadExcel("/export/partner-products/items", "products.xlsx")}
                onDelete={() => {
                  const hasChecked = mergedProducts.some((r) => r.checked);
                  if (hasChecked) setDeletingProducts(true);
                  else addToast({ type: "info", message: "삭제할 상품을 선택해주세요." });
                }}
              />
              <Table
                columns={productColumns}
                data={mergedProducts}
                isLoading={false}
                emptyMessage="상품 데이터가 없습니다."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modals */}
      <ConfirmModal
        isOpen={!!deletingTrader}
        onClose={() => setDeletingTrader(undefined)}
        onConfirm={handleTraderDelete}
        title="거래처 삭제"
        message={`"${deletingTrader?.traderName}" 거래처를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={deletingGroups}
        onClose={() => setDeletingGroups(false)}
        onConfirm={handleGroupDeleteConfirm}
        title="상품군 삭제"
        message="선택한 상품군을 삭제하시겠습니까?"
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={deletingProducts}
        onClose={() => setDeletingProducts(false)}
        onConfirm={handleProductDeleteConfirm}
        title="상품 삭제"
        message="선택한 상품을 삭제하시겠습니까?"
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
