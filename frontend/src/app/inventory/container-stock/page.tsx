"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/utils";
import { downloadExcel } from "@/lib/export";
import { useContainerInventories } from "@/hooks/useApi";
import InventoryTabNav from "@/components/inventory/InventoryTabNav";
import type { ContainerInventory } from "@/types";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

// Mock data for when backend is unavailable
const MOCK_MASTER: ContainerInventory[] = [
  {
    id: "1", partnerId: "P001", partnerCode: "SH001", partnerName: "삼성전자",
    containerCode: "CT001", containerName: "파렛트A", containerGroup: "파렛트",
    normalStock: 150, stockUnit: "EA", optimalStock: 200,
    locationCode: "A-01-01", warehouseId: "W001", warehouseName: "서울물류센터",
    workDate: "2026-03-20", notes: "", createdAt: "2026-03-01", updatedAt: "2026-03-20",
  },
  {
    id: "2", partnerId: "P001", partnerCode: "SH001", partnerName: "삼성전자",
    containerCode: "CT002", containerName: "박스B", containerGroup: "박스",
    normalStock: 320, stockUnit: "EA", optimalStock: 300,
    locationCode: "A-02-01", warehouseId: "W001", warehouseName: "서울물류센터",
    workDate: "2026-03-20", notes: "정상", createdAt: "2026-03-01", updatedAt: "2026-03-20",
  },
  {
    id: "3", partnerId: "P002", partnerCode: "SH002", partnerName: "LG전자",
    containerCode: "CT003", containerName: "컨테이너C", containerGroup: "컨테이너",
    normalStock: 50, stockUnit: "EA", optimalStock: 100,
    locationCode: "B-01-01", warehouseId: "W002", warehouseName: "부산물류센터",
    workDate: "2026-03-19", notes: "재고 부족", createdAt: "2026-03-01", updatedAt: "2026-03-19",
  },
  {
    id: "4", partnerId: "P002", partnerCode: "SH002", partnerName: "LG전자",
    containerCode: "CT004", containerName: "파렛트D", containerGroup: "파렛트",
    normalStock: 80, stockUnit: "EA", optimalStock: 100,
    locationCode: "B-02-03", warehouseId: "W002", warehouseName: "부산물류센터",
    workDate: "2026-03-18", notes: "", createdAt: "2026-03-01", updatedAt: "2026-03-18",
  },
];

const MOCK_LOCATIONS = [
  { id: "L1", workDate: "2026-03-20", locationCode: "A-01-01", containerCode: "CT001", containerName: "파렛트A", stockQty: 100, warehouseName: "서울물류센터" },
  { id: "L2", workDate: "2026-03-19", locationCode: "A-01-02", containerCode: "CT001", containerName: "파렛트A", stockQty: 50, warehouseName: "서울물류센터" },
];

function getLocationsByMaster(masterId: string) {
  const locationMap: Record<string, typeof MOCK_LOCATIONS> = {
    "1": [
      { id: "L1", workDate: "2026-03-20", locationCode: "A-01-01", containerCode: "CT001", containerName: "파렛트A", stockQty: 100, warehouseName: "서울물류센터" },
      { id: "L2", workDate: "2026-03-19", locationCode: "A-01-02", containerCode: "CT001", containerName: "파렛트A", stockQty: 50, warehouseName: "서울물류센터" },
    ],
    "2": [
      { id: "L3", workDate: "2026-03-20", locationCode: "A-02-01", containerCode: "CT002", containerName: "박스B", stockQty: 320, warehouseName: "서울물류센터" },
    ],
    "3": [
      { id: "L4", workDate: "2026-03-19", locationCode: "B-01-01", containerCode: "CT003", containerName: "컨테이너C", stockQty: 30, warehouseName: "부산물류센터" },
      { id: "L5", workDate: "2026-03-18", locationCode: "B-01-02", containerCode: "CT003", containerName: "컨테이너C", stockQty: 20, warehouseName: "부산물류센터" },
    ],
    "4": [
      { id: "L6", workDate: "2026-03-18", locationCode: "B-02-03", containerCode: "CT004", containerName: "파렛트D", stockQty: 80, warehouseName: "부산물류센터" },
    ],
  };
  return locationMap[masterId] ?? [];
}

export default function ContainerStockPage() {
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [containerGroupFilter, setContainerGroupFilter] = useState("");
  const [containerCode, setContainerCode] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<ContainerInventory | null>(null);

  const debouncedSearch = useDebounce(containerCode);

  const { data: response, isLoading, error } = useContainerInventories({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  // Use API data if available, otherwise fall back to mock
  const masterItems = useMemo(() => {
    const apiData = response?.data ?? [];
    if (apiData.length > 0) return apiData;
    // Filter mock data
    let filtered = MOCK_MASTER;
    if (partnerCode) filtered = filtered.filter((r) => r.partnerCode?.includes(partnerCode));
    if (containerGroupFilter) filtered = filtered.filter((r) => r.containerGroup === containerGroupFilter);
    if (containerCode) filtered = filtered.filter((r) => r.containerCode.includes(containerCode));
    if (warehouseCode) filtered = filtered.filter((r) => r.warehouseName?.includes(warehouseCode));
    return filtered;
  }, [response, partnerCode, containerGroupFilter, containerCode, warehouseCode]);

  const total = response?.total ?? masterItems.length;
  const totalPages = response?.totalPages ?? 1;

  const locationItems = useMemo(() => {
    if (!selectedRow) return [];
    return getLocationsByMaster(selectedRow.id);
  }, [selectedRow]);

  const handleReset = () => {
    setPartnerCode("");
    setPartnerName("");
    setContainerGroupFilter("");
    setContainerCode("");
    setWarehouseCode("");
    setPage(1);
    setSelectedRow(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">물류용기재고목록</h1>
        <p className="text-sm text-[#8B95A1]">재고관리 &gt; 용기재고 조회</p>
      </div>

      <InventoryTabNav />

      {/* Search area */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">화주</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  className={inputBase + " max-w-[120px]"}
                  placeholder="코드"
                />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className={inputBase + " max-w-[120px]"}
                  placeholder="화주명"
                />
              </div>
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">물류용기군</label>
              <select
                value={containerGroupFilter}
                onChange={(e) => setContainerGroupFilter(e.target.value)}
                className={selectBase}
              >
                <option value="">전체</option>
                <option value="파렛트">파렛트</option>
                <option value="박스">박스</option>
                <option value="컨테이너">컨테이너</option>
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">물류용기</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={containerCode}
                  onChange={(e) => { setContainerCode(e.target.value); setPage(1); }}
                  className={inputBase + " max-w-[120px]"}
                  placeholder="코드"
                />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">창고</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={warehouseCode}
                  onChange={(e) => setWarehouseCode(e.target.value)}
                  className={inputBase + " max-w-[120px]"}
                  placeholder="코드"
                />
                <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]">
              <Search className="h-4 w-4" /> 검색
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="danger" size="sm">저장</Button>
        <Button
          variant="outline"
          size="sm"
          className="!bg-[#22C55E] !text-white !border-[#22C55E]"
          onClick={() => downloadExcel("/export/container-inventories", "물류용기재고.xlsx")}
        >
          엑셀
        </Button>
      </div>

      {/* Top grid: 물류용기재고목록 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">물류용기재고목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                </th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">화주코드</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">화주명</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">물류용기군</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">물류용기코드</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">물류용기명</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">정상재고</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">재고단위</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">적정재고</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">비고</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F2F4F6]">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 animate-pulse rounded bg-[#F2F4F6]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error && masterItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-red-500">
                    오류가 발생했습니다.
                  </td>
                </tr>
              ) : masterItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm text-[#8B95A1]">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                masterItems.map((item, idx) => (
                  <tr
                    key={item.id ?? idx}
                    onClick={() => setSelectedRow(item)}
                    className={`cursor-pointer border-b border-[#F2F4F6] transition-colors ${
                      selectedRow?.id === item.id ? "bg-[#E8F2FF]" : "hover:bg-[#F7F8FA]"
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                    </td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">
                      {item.partnerCode ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">
                      {item.partnerName ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">
                      {item.containerGroup ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">
                      {item.containerCode}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">
                      {item.containerName ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">
                      {formatNumber(item.normalStock)}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">
                      {item.stockUnit ?? "EA"}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-[#4E5968]">
                      {item.optimalStock != null ? formatNumber(item.optimalStock) : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#8B95A1]">
                      {item.notes ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#F2F4F6] px-5 py-3">
          <p className="text-sm text-[#8B95A1]">
            Page {page} of {totalPages}
          </p>
          <p className="text-sm text-[#8B95A1]">
            View 1 - {masterItems.length} of {total}
          </p>
        </div>
      </div>

      {/* Bottom grid: 로케이션정보 */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="rounded-t-xl bg-[#4A5568] px-5 py-2.5">
          <h2 className="text-sm font-semibold text-white">로케이션정보</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                </th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">작업일자</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">로케이션</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">용기코드</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">물류용기명</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">재고수량</th>
                <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">창고</th>
              </tr>
            </thead>
            <tbody>
              {!selectedRow ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[#8B95A1]">
                    상위 목록에서 항목을 선택해주세요.
                  </td>
                </tr>
              ) : locationItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[#8B95A1]">
                    로케이션 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                locationItems.map((loc) => (
                  <tr key={loc.id} className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]">
                    <td className="px-3 py-3 text-center">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#D1D6DB]" />
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{loc.workDate}</td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{loc.locationCode}</td>
                    <td className="px-3 py-3 text-sm font-mono text-[#4E5968]">{loc.containerCode}</td>
                    <td className="px-3 py-3 text-sm text-[#191F28]">{loc.containerName}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-[#191F28]">
                      {formatNumber(loc.stockQty)}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#4E5968]">{loc.warehouseName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
