"use client";

import { useState, useMemo } from "react";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";
import { useRouter } from "next/navigation";
import {
  Monitor,
  Search,
  ExternalLink,
} from "lucide-react";

interface ProgramEntry {
  id: string;
  category: string;
  screenId: string;
  screenName: string;
  url: string;
  description: string;
}

const PROGRAMS: ProgramEntry[] = [
  // 운영관리
  { id: "1", category: "운영관리", screenId: "WMSOP010", screenName: "대시보드", url: "/", description: "재고/입출고 통합 현황" },
  { id: "2", category: "운영관리", screenId: "WMSOP020", screenName: "입고관리", url: "/inbound", description: "입고 주문 등록 및 처리" },
  { id: "3", category: "운영관리", screenId: "WMSOP030", screenName: "출고관리", url: "/outbound", description: "출고 주문 등록 및 처리" },
  { id: "4", category: "운영관리", screenId: "WMSOP040", screenName: "출하관리", url: "/dispatch", description: "출하 처리 및 배송 관리" },
  { id: "5", category: "운영관리", screenId: "WMSOP050", screenName: "채널관리", url: "/channels", description: "판매 채널 관리" },
  { id: "6", category: "운영관리", screenId: "WMSOP060", screenName: "운영현황", url: "/operations", description: "운영 현황 모니터링" },

  // 기준관리
  { id: "10", category: "기준관리", screenId: "WMSMS010", screenName: "창고관리", url: "/warehouse", description: "창고/존/로케이션 관리" },
  { id: "11", category: "기준관리", screenId: "WMSMS020", screenName: "품목관리", url: "/items", description: "품목 마스터 관리" },
  { id: "12", category: "기준관리", screenId: "WMSMS030", screenName: "거래처관리", url: "/partners", description: "공급처/고객사/운송사 관리" },
  { id: "13", category: "기준관리", screenId: "WMSMS040", screenName: "사용자관리", url: "/users", description: "사용자 계정 관리" },

  // 재고관리
  { id: "20", category: "재고관리", screenId: "WMSST010", screenName: "재고현황", url: "/inventory", description: "전체 재고 현황 조회" },
  { id: "21", category: "재고관리", screenId: "WMSST020", screenName: "재고이동", url: "/inventory/transfer", description: "재고 이동 처리" },
  { id: "22", category: "재고관리", screenId: "WMSST030", screenName: "재고조정", url: "/inventory/adjustments", description: "재고 수량 조정" },
  { id: "23", category: "재고관리", screenId: "WMSST040", screenName: "재고이동 상세관리", url: "/inventory/movements", description: "이동 주문 등록 및 상태 관리" },
  { id: "24", category: "재고관리", screenId: "WMSST050", screenName: "실사관리", url: "/inventory/cycle-counts", description: "순환실사 등록 및 처리" },
  { id: "25", category: "재고관리", screenId: "WMSST060", screenName: "재고트랜잭션", url: "/inventory/transactions", description: "재고 이력 조회" },
  { id: "26", category: "재고관리", screenId: "WMSST070", screenName: "유통기한 알림", url: "/inventory/expiry-alerts", description: "유통기한 임박 품목 관리" },

  // 통계
  { id: "30", category: "통계", screenId: "WMSTG010", screenName: "통계 메뉴", url: "/reports", description: "통계/보고서 메인 페이지" },
  { id: "31", category: "통계", screenId: "WMSTG020", screenName: "창고별 재고현황", url: "/reports/warehouse-stock", description: "창고 단위 재고 분석" },
  { id: "32", category: "통계", screenId: "WMSTG030", screenName: "부족재고 현황", url: "/reports/low-stock", description: "안전재고 미달 품목 조회" },
  { id: "33", category: "통계", screenId: "WMSTG040", screenName: "입출고 현황", url: "/reports/inout-summary", description: "기간별 입출고 분석" },
  { id: "34", category: "통계", screenId: "WMSTG050", screenName: "로케이션별 재고", url: "/reports/location-stock", description: "로케이션 단위 재고 조회" },
  { id: "35", category: "통계", screenId: "WMSTG060", screenName: "제품군별 창고사용현황", url: "/reports/category-stock", description: "카테고리별 재고 분석" },
  { id: "36", category: "통계", screenId: "WMSTG070", screenName: "LOT별 재고현황", url: "/reports/lot-stock", description: "LOT 단위 재고 조회" },
  { id: "37", category: "통계", screenId: "WMSTG080", screenName: "거래처별 출고현황", url: "/reports/partner-outbound", description: "거래처별 출고 분석" },
  { id: "38", category: "통계", screenId: "WMSTG100", screenName: "등급별 재고현황", url: "/reports/grade-stock", description: "품목 등급별 재고 조회" },

  // 시스템
  { id: "40", category: "시스템", screenId: "TMSYS010", screenName: "설정", url: "/settings", description: "시스템 설정 및 정보" },
  { id: "41", category: "시스템", screenId: "TMSYS020", screenName: "권한관리", url: "/settings/roles", description: "사용자 역할/권한 관리" },
  { id: "42", category: "시스템", screenId: "TMSYS030", screenName: "단위관리", url: "/settings/uom", description: "단위(UoM) 관리" },
  { id: "43", category: "시스템", screenId: "TMSYS040", screenName: "프로그램관리", url: "/settings/programs", description: "등록 화면 목록 관리" },
];

const CATEGORIES = ["전체", "운영관리", "기준관리", "재고관리", "통계", "시스템"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "운영관리": { bg: "#E8F2FF", text: "#3182F6" },
  "기준관리": { bg: "#E8FAF0", text: "#1FC47D" },
  "재고관리": { bg: "#FFF3E0", text: "#FF8B00" },
  "통계": { bg: "#F3E8FF", text: "#7B61FF" },
  "시스템": { bg: "#F2F4F6", text: "#8B95A1" },
};

export default function ProgramsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");

  const filteredProgramsBase = useMemo(() => {
    return PROGRAMS.filter((p) => {
      const matchCategory = categoryFilter === "전체" || p.category === categoryFilter;
      const matchSearch =
        !search ||
        p.screenId.toLowerCase().includes(search.toLowerCase()) ||
        p.screenName.toLowerCase().includes(search.toLowerCase()) ||
        p.url.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, categoryFilter]);

  const { sortedData: filteredPrograms, sortKey, sortDir, handleSort } = useTableSort(filteredProgramsBase);

  // Group for display
  const groupedPrograms = useMemo(() => {
    const map = new Map<string, ProgramEntry[]>();
    filteredPrograms.forEach((p) => {
      const existing = map.get(p.category);
      if (existing) {
        existing.push(p);
      } else {
        map.set(p.category, [p]);
      }
    });
    return map;
  }, [filteredPrograms]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#191F28]">프로그램관리</h1>
        <p className="mt-1 text-sm text-[#8B95A1]">
          TMSYS040 - 시스템에 등록된 전체 화면 목록을 조회합니다.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B8C1]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="화면ID, 화면명, URL로 검색..."
              className="w-full rounded-xl border-0 bg-[#F7F8FA] pl-10 pr-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? "bg-[#3182F6] text-white"
                    : "bg-[#F2F4F6] text-[#8B95A1] hover:bg-[#E5E8EB]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-xs text-[#8B95A1]">
          총 {filteredPrograms.length}개 화면
        </div>
      </div>

      {/* Programs Table grouped by category */}
      {Array.from(groupedPrograms.entries()).map(([category, programs]) => {
        const catColor = CATEGORY_COLORS[category] ?? { bg: "#F2F4F6", text: "#8B95A1" };
        return (
          <div
            key={category}
            className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: catColor.bg }}
              >
                <Monitor className="h-4 w-4" style={{ color: catColor.text }} />
              </div>
              <h2 className="text-lg font-bold text-[#191F28]">
                {category}
                <span className="ml-2 text-sm font-normal text-[#8B95A1]">
                  ({programs.length})
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <SortableHeader field="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>화면구분</SortableHeader>
                    <SortableHeader field="screenId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>화면ID</SortableHeader>
                    <SortableHeader field="screenName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>화면명</SortableHeader>
                    <SortableHeader field="url" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>URL</SortableHeader>
                    <SortableHeader field="description" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>비고</SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((prog) => (
                    <tr
                      key={prog.id}
                      className="cursor-pointer border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]"
                      onClick={() => router.push(prog.url)}
                    >
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: catColor.bg, color: catColor.text }}
                        >
                          {prog.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono font-medium text-[#191F28]">
                          {prog.screenId}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-[#191F28]">
                          {prog.screenName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono text-[#3182F6]">{prog.url}</span>
                          <ExternalLink className="h-3 w-3 text-[#B0B8C1]" />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-[#8B95A1]">{prog.description}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {filteredPrograms.length === 0 && (
        <div className="rounded-2xl bg-white p-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#B0B8C1]">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
