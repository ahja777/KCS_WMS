"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import { useWarehouses, usePartners } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { downloadExcel } from "@/lib/export";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

interface LocationRow {
  id: string;
  code: string;
  row: number;
  col: number;
  level: number;
}

interface ShipmentControl {
  id: number;
  locationCode: string;
  startDate: string;
  endDate: string;
  reasonCode: string;
  remark: string;
}

const emptyForm = {
  warehouseCode: "",
  locationCode: "",
  capacityPlt: "",
  loadingType: "평치",
  partnerId: "",
  locationType: "보관",
  capacity: "",
  isRestricted: "N",
  useStatus: "사용",
  width: "",
  depth: "",
  height: "",
  itemGroup: "",
};

export default function LocationManagementPage() {
  const [searchLocation, setSearchLocation] = useState("");
  const [searchWarehouse, setSearchWarehouse] = useState("");

  // Left grid data (static demo)
  const [locations] = useState<LocationRow[]>([
    { id: "1", code: "LC01", row: 1, col: 1, level: 1 },
    { id: "2", code: "LC02", row: 1, col: 1, level: 2 },
    { id: "3", code: "LV004", row: 0, col: 0, level: 0 },
  ]);
  const [selectedLocation, setSelectedLocation] = useState<LocationRow | null>(null);

  // Right form
  const [form, setForm] = useState({ ...emptyForm });

  // Shipment control
  const [shipmentControl, setShipmentControl] = useState("Y");
  const [controlItems] = useState<ShipmentControl[]>([
    { id: 1, locationCode: "LC01", startDate: "20101022", endDate: "", reasonCode: "", remark: "대금미납-결제완료일까지 통제" },
    { id: 2, locationCode: "LC01", startDate: "20150305", endDate: "", reasonCode: "", remark: "" },
    { id: 3, locationCode: "LC01", startDate: "20150210", endDate: "", reasonCode: "", remark: "테스트" },
  ]);

  const addToast = useToastStore((s) => s.addToast);
  const { data: warehouseRes } = useWarehouses({ limit: 100 });
  const warehouses = warehouseRes?.data ?? [];
  const { data: partnerRes } = usePartners({ limit: 100 });
  const partners = partnerRes?.data ?? [];

  useEffect(() => {
    if (selectedLocation) {
      setForm((prev) => ({
        ...prev,
        locationCode: selectedLocation.code,
        warehouseCode: "WH0001",
        capacityPlt: "100",
      }));
    }
  }, [selectedLocation]);

  const handleSave = () => {
    if (!form.warehouseCode || !form.locationCode || !form.capacityPlt) {
      addToast({ type: "error", message: "필수항목을 입력해주세요." });
      return;
    }
    addToast({ type: "success", message: "로케이션정보가 저장되었습니다." });
  };

  const leftColumns: Column<LocationRow>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedLocation?.id === row.id}
          onChange={() => setSelectedLocation(row)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4"
        />
      ),
    },
    { key: "code", header: "로케이션" },
    { key: "row", header: "행", render: (row) => <span>{row.row || ""}</span> },
    { key: "col", header: "열", render: (row) => <span>{row.col || ""}</span> },
    { key: "level", header: "단", render: (row) => <span>{row.level || ""}</span> },
  ];

  const controlColumns: Column<ShipmentControl>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
      render: () => <input type="checkbox" className="h-4 w-4" />,
    },
    { key: "locationCode", header: "로케이션" },
    { key: "startDate", header: "적용시작일" },
    { key: "endDate", header: "적용종료일", render: (row) => <span>{row.endDate || ""}</span> },
    { key: "reasonCode", header: "사유코드", render: (row) => <span>{row.reasonCode || ""}</span> },
    { key: "remark", header: "비고" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <p className="text-xs text-[#8B95A1]">기준관리 &gt; 로케이션정보</p>
        <h1 className="text-2xl font-bold text-[#191F28]">로케이션정보관리</h1>
      </div>

      {/* Search bar */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">로케이션</label>
            <div className="flex gap-1">
              <input type="text" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className={`flex-1 ${inputBase}`} />
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">창고</label>
            <div className="flex gap-1">
              <select value={searchWarehouse} onChange={(e) => setSearchWarehouse(e.target.value)} className={`flex-1 ${inputBase}`}>
                <option value="">전체</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button className="flex h-[46px] items-center rounded-xl bg-[#F2F4F6] px-3 text-[#4E5968] hover:bg-[#E5E8EB]">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white hover:bg-[#1B64DA]">
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleSave} className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D63341]">저장</button>
        <button onClick={() => { setSelectedLocation(null); setForm({ ...emptyForm }); }} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">신규</button>
        <button className="rounded-xl bg-[#8B95A1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B7684]">삭제</button>
        <button onClick={() => downloadExcel("/export/locations", "locations.xlsx")} className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17A86B]">엑셀</button>
      </div>

      {/* Main: Left grid + Right form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Location List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#4A5568] px-4 py-2">
              <h2 className="text-sm font-bold text-white">로케이션정보</h2>
            </div>
            <div className="p-4">
              <Table
                columns={leftColumns}
                data={locations}
                isLoading={false}
                onRowClick={(row) => setSelectedLocation(row)}
                emptyMessage="로케이션 데이터가 없습니다."
              />
            </div>
          </div>
        </div>

        {/* Right: Form + Control */}
        <div className="space-y-6 lg:col-span-3">
          {/* Location Detail Form */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#4A5568] px-4 py-2">
              <h2 className="text-sm font-bold text-white">로케이션정보</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Row 1 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-red-500">* 창고코드</label>
                  <div className="flex gap-1">
                    <input value={form.warehouseCode} onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })} className={`flex-1 ${inputBase}`} placeholder="창고코드" />
                    <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-red-500">* 로케이션코드</label>
                  <input value={form.locationCode} onChange={(e) => setForm({ ...form, locationCode: e.target.value })} className={inputBase} placeholder="로케이션코드" />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-red-500">* 적재량(PLT)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={form.capacityPlt} onChange={(e) => setForm({ ...form, capacityPlt: e.target.value })} className={inputBase} placeholder="0" />
                    <span className="shrink-0 text-sm text-[#8B95A1]">PLT</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">적재구분</label>
                  <select value={form.loadingType} onChange={(e) => setForm({ ...form, loadingType: e.target.value })} className={selectBase}>
                    <option value="평치">평치</option>
                    <option value="랙">랙</option>
                  </select>
                </div>

                {/* Row 3 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">화주</label>
                  <div className="flex gap-1">
                    <select value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} className={`flex-1 ${selectBase}`}>
                      <option value="">선택</option>
                      {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[#4E5968] hover:bg-[#E5E8EB]">
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">LOC구분</label>
                  <select value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value })} className={selectBase}>
                    <option value="보관">보관</option>
                    <option value="입고">입고</option>
                    <option value="출고">출고</option>
                    <option value="반품">반품</option>
                    <option value="QC">QC</option>
                    <option value="크로스독">크로스독</option>
                  </select>
                </div>

                {/* Row 4 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">사용상태</label>
                  <select value={form.useStatus} onChange={(e) => setForm({ ...form, useStatus: e.target.value })} className={selectBase}>
                    <option value="사용">사용</option>
                    <option value="미사용">미사용</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">적재가능량</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inputBase} placeholder="0" />
                </div>

                {/* Row 5: Dimensions */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">가로 (cm)</label>
                  <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} className={inputBase} placeholder="0" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">세로 (cm)</label>
                  <input type="number" value={form.depth} onChange={(e) => setForm({ ...form, depth: e.target.value })} className={inputBase} placeholder="0" />
                </div>

                {/* Row 6 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">높이 (cm)</label>
                  <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={inputBase} placeholder="0" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">통제여부</label>
                  <select value={form.isRestricted} onChange={(e) => setForm({ ...form, isRestricted: e.target.value })} className={selectBase}>
                    <option value="N">N</option>
                    <option value="Y">Y</option>
                  </select>
                </div>

                {/* Row 7 */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#4E5968]">상품군</label>
                  <select value={form.itemGroup} onChange={(e) => setForm({ ...form, itemGroup: e.target.value })} className={selectBase}>
                    <option value="">선택</option>
                    <option value="일반">일반</option>
                    <option value="냉장">냉장</option>
                    <option value="냉동">냉동</option>
                    <option value="위험물">위험물</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Control */}
          <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="rounded-t-2xl bg-[#333D4B] px-4 py-2">
              <h2 className="text-sm font-bold text-white">출고통제정보</h2>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <label className="text-sm font-medium text-[#4E5968]">출고통제</label>
                <select value={shipmentControl} onChange={(e) => setShipmentControl(e.target.value)} className={`w-32 ${selectBase}`}>
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </select>
              </div>
              <Table
                columns={controlColumns}
                data={controlItems}
                isLoading={false}
                emptyMessage="출고통제 데이터가 없습니다."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
