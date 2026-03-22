"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export function useTableSort<T>(data: T[], initialKey = "", initialDir: "asc" | "desc" = "asc") {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialDir);

  const handleSort = useCallback((key: string) => {
    setSortDir((d) => (sortKey === key ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
  }, [sortKey]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv), "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return { sortedData, sortKey, sortDir, handleSort };
}

export default function SortableHeader({
  field,
  sortKey,
  sortDir,
  onSort,
  children,
  className,
}: {
  field: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-3 text-xs font-medium text-[#8B95A1] cursor-pointer select-none hover:text-[#4E5968] transition-colors whitespace-nowrap ${className ?? ""}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey === field ? (
          sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}
