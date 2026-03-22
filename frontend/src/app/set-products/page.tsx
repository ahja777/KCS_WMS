"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Trash2, AlertCircle, Download } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useItems,
  usePartners,
  useSetItems,
  useCreateSetItem,
  useDeleteSetItem,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadExcel } from "@/lib/export";
import type { Item } from "@/types";

interface SetItem {
  id: string;
  parentItemId: string;
  childItemId: string;
  quantity: number;
  createdAt?: string;
}

interface SetItemRow extends SetItem {
  no: number;
  childCode: string;
  childName: string;
  uom: string;
}

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

export default function SetProductsPage() {
  const [partnerFilter, setPartnerFilter] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const debouncedSearch = useDebounce(searchProduct);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | undefined>();
  const [newChildItemId, setNewChildItemId] = useState("");
  const [newChildQty, setNewChildQty] = useState("1");

  const addToast = useToastStore((s) => s.addToast);

  const { data: partnerRes } = usePartners({ limit: 100 });
  const partners = partnerRes?.data ?? [];

  const { data: itemsRes, isLoading: itemsLoading } = useItems({ limit: 500 });
  const allItems = itemsRes?.data ?? [];

  const { data: setItemsRes, isLoading: setItemsLoading } = useSetItems({ limit: 500 });
  const allSetItems = setItemsRes?.data ?? [];

  const createMutation = useCreateSetItem();
  const deleteMutation = useDeleteSetItem();

  // Get unique parent item IDs from set items
  const parentItemIds = useMemo(() => {
    const ids = new Set<string>();
    allSetItems.forEach((si: SetItem) => ids.add(si.parentItemId));
    return ids;
  }, [allSetItems]);

  // Filter parent items (set products)
  const setProducts = useMemo(() => {
    const items = allItems.filter((item: Item) => parentItemIds.has(item.id));
    if (debouncedSearch) {
      return items.filter(
        (item: Item) =>
          item.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    return items;
  }, [allItems, parentItemIds, debouncedSearch]);

  // Get child items for selected parent
  const childSetItems = useMemo(() => {
    if (!selectedParentId) return [];
    return allSetItems
      .filter((si: SetItem) => si.parentItemId === selectedParentId)
      .map((si: SetItem, idx: number) => {
        const childItem = allItems.find((i: Item) => i.id === si.childItemId);
        return {
          ...si,
          no: idx + 1,
          childCode: childItem?.code ?? si.childItemId,
          childName: childItem?.name ?? "-",
          uom: childItem?.uom ?? "EA",
        };
      });
  }, [selectedParentId, allSetItems, allItems]);

  const handleAddChild = async () => {
    if (!selectedParentId || !newChildItemId) {
      addToast({ type: "error", message: "상품을 선택해주세요." });
      return;
    }
    try {
      await createMutation.mutateAsync({
        parentItemId: selectedParentId,
        childItemId: newChildItemId,
        quantity: parseInt(newChildQty) || 1,
      });
      addToast({ type: "success", message: "세트상품 구성이 추가되었습니다." });
      setNewChildItemId("");
      setNewChildQty("1");
    } catch {
      addToast({ type: "error", message: "추가 중 오류가 발생했습니다." });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      addToast({ type: "success", message: "삭제되었습니다." });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingId(undefined);
    }
  };

  const selectedParent = allItems.find((i: Item) => i.id === selectedParentId);

  // Set Product (parent) columns
  const parentColumns: Column<Item>[] = [
    {
      key: "partner",
      header: "화 주",
      render: (row) => {
        const p = partners.find((pp) => pp.id === (row as Item & { partnerId?: string }).partnerId);
        return <span className="text-sm">{p?.name ?? "-"}</span>;
      },
    },
    { key: "code", header: "상품코드" },
    { key: "name", header: "상품명" },
  ];

  // Child item columns
  const childColumns: Column<SetItemRow>[] = [
    { key: "no", header: "No" },
    { key: "childCode", header: "*상품코드" },
    { key: "childName", header: "*상품명" },
    { key: "quantity", header: "*수량" },
    { key: "uom", header: "*UOM" },
    {
      key: "createdAt",
      header: "생성일",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString("ko-KR") : "-",
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeletingId(row.id);
          }}
          className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; 세트상품구성정보</p>
          <h1 className="text-2xl font-bold text-[#191F28]">세트상품구성정보</h1>
        </div>
      </div>

      {/* Search Filters */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm font-medium text-[#4E5968]">화 주</label>
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className={`${selectBase} w-48`}
            >
              <option value="">전체</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm font-medium text-[#4E5968]">세트상품</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
              <input
                type="text"
                placeholder="상품코드/상품명..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className={`${inputBase} pl-10 w-64`}
              />
            </div>
          </div>
          <button
            onClick={() => downloadExcel("/export/set-items", "set_items.xlsx")}
            className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17A86B]"
          >
            엑셀
          </button>
        </div>
      </div>

      {/* Top: Set Products (Parents) */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between rounded-t-2xl bg-[#4A5568] px-4 py-2">
          <h2 className="text-sm font-bold text-white">세트상품</h2>
        </div>
        <div className="p-4">
          <Table
            columns={parentColumns}
            data={setProducts.length > 0 ? setProducts : allItems.slice(0, 10)}
            isLoading={itemsLoading}
            onRowClick={(item: Item) => setSelectedParentId(item.id)}
            emptyMessage="세트상품 데이터가 없습니다."
          />
        </div>
      </div>

      {/* Bottom: Set Product Composition (Children) */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between rounded-t-2xl bg-[#4A5568] px-4 py-2">
          <h2 className="text-sm font-bold text-white">
            세트상품구성
            {selectedParent && (
              <span className="ml-2 font-normal text-[#CBD5E0]">
                - {selectedParent.code} {selectedParent.name}
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleAddChild}
              disabled={!selectedParentId}
              className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1B64DA] disabled:opacity-50"
            >
              <Plus className="mr-1 inline h-3 w-3" />
              신규
            </button>
          </div>
        </div>

        {/* Add new child row */}
        {selectedParentId && (
          <div className="border-b border-[#F2F4F6] px-4 py-3">
            <div className="flex items-center gap-3">
              <select
                value={newChildItemId}
                onChange={(e) => setNewChildItemId(e.target.value)}
                className={`${selectBase} w-60`}
              >
                <option value="">상품 선택...</option>
                {allItems
                  .filter((i: Item) => i.id !== selectedParentId)
                  .map((item: Item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                value={newChildQty}
                onChange={(e) => setNewChildQty(e.target.value)}
                min="1"
                placeholder="수량"
                className={`${inputBase} w-24`}
              />
              <button
                onClick={handleAddChild}
                disabled={!newChildItemId || createMutation.isPending}
                className="rounded-xl bg-[#3182F6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA] disabled:opacity-50"
              >
                {createMutation.isPending ? "..." : "추가"}
              </button>
            </div>
          </div>
        )}

        <div className="p-4">
          {!selectedParentId ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#8B95A1]">
              위 목록에서 세트상품을 선택해주세요.
            </div>
          ) : (
            <Table
              columns={childColumns}
              data={childSetItems}
              isLoading={setItemsLoading}
              emptyMessage="구성 상품이 없습니다."
            />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(undefined)}
        onConfirm={handleDeleteConfirm}
        title="세트상품 구성 삭제"
        message="선택한 구성 상품을 삭제하시겠습니까?"
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
