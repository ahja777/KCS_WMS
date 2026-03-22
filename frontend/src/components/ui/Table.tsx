"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import Button from "./Button";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, order: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  activeRowId?: string;
  clientSort?: boolean;
}

export default function Table<T extends object>({
  columns,
  data,
  isLoading = false,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  onSort,
  onRowClick,
  emptyMessage = "데이터가 없습니다.",
  activeRowId,
  clientSort = true,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortOrder(newOrder);
    onSort?.(key, newOrder);
  };

  // Client-side sorting when no onSort callback and clientSort enabled
  const sortedData = useMemo(() => {
    if (!sortKey || !clientSort || onSort) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const aStr = String(aVal);
      const bStr = String(bVal);
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      let cmp: number;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        cmp = aNum - bNum;
      } else {
        cmp = aStr.localeCompare(bStr, "ko");
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortOrder, clientSort, onSort]);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F8FA]">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false && col.key !== "actions" && col.key !== "checked";
                const isActive = sortKey === col.key;
                return (
                <th
                  key={col.key}
                  className={cn(
                    "px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]",
                    isSortable && "cursor-pointer select-none hover:text-[#4E5968]",
                    isActive && "text-[#3182F6]",
                    col.width
                  )}
                  onClick={() => isSortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {isSortable && (
                      isActive ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5 text-[#3182F6]" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-[#3182F6]" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 text-[#B0B8C1]" />
                      )
                    )}
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F2F4F6]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded-lg bg-[#F2F4F6]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-16 text-center text-[#B0B8C1]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => {
                const rowId = (row as Record<string, unknown>).id as string;
                const isActive = activeRowId != null && rowId === activeRowId;
                return (
                <tr
                  key={rowId ?? idx}
                  className={cn(
                    "border-b border-[#F2F4F6] transition-colors duration-200 hover:bg-[#F7F8FA]",
                    onRowClick && "cursor-pointer",
                    isActive && "bg-[#EBF5FF] hover:bg-[#EBF5FF]"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-5 py-4 text-[#4E5968]"
                    >
                      {col.render
                        ? col.render(row, idx)
                        : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? "-"}
                    </td>
                  ))}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[#8B95A1]">
            총 <span className="font-semibold text-[#191F28]">{total}</span>건
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="rounded-xl bg-[#F7F8FA] px-4 py-1.5 text-sm font-medium text-[#4E5968]">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
