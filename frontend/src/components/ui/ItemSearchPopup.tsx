"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Package } from "lucide-react";
import { useItems } from "@/hooks/useApi";
import type { Item } from "@/types";

interface ItemSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Item) => void;
  excludeIds?: string[];
}

export default function ItemSearchPopup({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: ItemSearchPopupProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: response, isLoading } = useItems({
    page,
    limit: 20,
    ...(search ? { search } : {}),
  });

  const items = (response?.data ?? []).filter(
    (i: Item) => i.isActive && !excludeIds.includes(i.id)
  );
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setPage(1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
          <h3 className="text-lg font-bold text-[#191F28]">품목 검색</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-[#F7F8FA] hover:text-[#4E5968]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-[#F2F4F6] px-6 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="품목코드, 품목명, 바코드로 검색..."
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#8B95A1]">
              <Package className="mb-2 h-8 w-8" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-[#F2F4F6]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">품목코드</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">품목명</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8B95A1]">바코드</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#8B95A1]">단위</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: Item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="cursor-pointer border-b border-[#F7F8FA] transition-colors hover:bg-[#E8F2FF]/50"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-[#3182F6]">{item.code}</td>
                    <td className="px-6 py-3 text-sm font-medium text-[#191F28]">{item.name}</td>
                    <td className="px-6 py-3">
                      <span className="rounded-lg bg-[#F2F4F6] px-2 py-1 text-xs font-medium text-[#4E5968]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-[#8B95A1]">{item.barcode || "-"}</td>
                    <td className="px-6 py-3 text-right text-sm text-[#4E5968]">{item.uom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#F2F4F6] px-6 py-3">
            <span className="text-xs text-[#8B95A1]">
              총 {total}건 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA] disabled:opacity-30"
              >
                이전
              </button>
              <span className="flex items-center px-2 text-xs font-semibold text-[#191F28]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA] disabled:opacity-30"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
