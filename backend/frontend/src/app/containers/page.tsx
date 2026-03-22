"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import PageActions from "@/components/ui/PageActions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { downloadExcel } from "@/lib/export";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";

const API = "http://localhost:4100/api";

interface Container {
  id: string;
  containerCode: string;
  containerName: string;
  containerGroupId?: string;
  containerGroup?: { groupCode: string; groupName: string };
  partner?: { code: string; name: string };
  inboundWarehouseCode?: string;
  shelfLife?: number;
  shelfLifeDays?: number;
  weight?: number;
  size?: string;
  optimalStock?: number;
  stockUnit?: string;
  isActive: boolean;
  unitPrice?: number;
  assetType?: string;
  tagPrefix?: string;
  companyEpcCode?: string;
  barcode?: string;
  weightToleranceKg?: number;
  inboundZone?: string;
  optimalStockDays?: number;
  expiryDays?: number;
  notes?: string;
}

export default function ContainersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Container[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Container | null>(null);
  const [deleting, setDeleting] = useState<Container | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("containers");

  const [form, setForm] = useState<Partial<Container>>({});

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/containers?page=${page}&limit=20&search=${debouncedSearch}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json.data?.data || json.data || []);
      setTotal(json.data?.total || json.total || 0);
    } catch { /* */ }
  };

  useState(() => { fetchData(); });

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const method = selected ? "PUT" : "POST";
      const url = selected ? `${API}/containers/${selected.id}` : `${API}/containers`;
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      addToast({ type: "success", message: selected ? "수정되었습니다." : "등록되었습니다." });
      fetchData();
      setIsEditing(false);
    } catch {
      addToast({ type: "error", message: "저장 중 오류가 발생했습니다." });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/containers/${deleting.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast({ type: "success", message: "삭제되었습니다." });
      fetchData();
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<Container>[] = [
    { key: "containerCode", header: "용기코드", sortable: true },
    { key: "containerName", header: "용기명", sortable: true },
    { key: "containerGroup" as any, header: "용기군", render: (r) => r.containerGroup?.groupName || "-" },
    { key: "inboundWarehouseCode" as any, header: "입고창고코드", render: (r) => r.inboundWarehouseCode || "-" },
    { key: "shelfLife" as any, header: "유통기간", render: (r) => r.shelfLife?.toString() || "-" },
    { key: "shelfLifeDays" as any, header: "유통기간일수", render: (r) => r.shelfLifeDays?.toString() || "-" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">물류용기관리</h1>
        <span className="text-sm text-gray-500">기준관리 &gt; 물류용기관리</span>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm mb-1 text-gray-600">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                placeholder="용기코드, 용기명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm">조회</button>
        </div>
      </div>

      <PageActions
        onCreate={() => { setSelected(null); setForm({}); setIsEditing(true); }}
        onExcel={() => downloadExcel("containers", data)}
        createLabel="신규"
        perm={perm}
      />

      <Table
        columns={columns}
        data={data}
        onRowClick={(row) => { setSelected(row); setForm(row); setIsEditing(true); }}
        page={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={setPage}
        total={total}
      />

      {isEditing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[700px] max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{selected ? "물류용기 수정" : "물류용기 등록"}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-gray-600 mb-1">용기코드 *</label>
                <input className="w-full border rounded px-3 py-2" value={form.containerCode || ""} onChange={(e) => setForm({ ...form, containerCode: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">용기명 *</label>
                <input className="w-full border rounded px-3 py-2" value={form.containerName || ""} onChange={(e) => setForm({ ...form, containerName: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">용기중량</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.weight || ""} onChange={(e) => setForm({ ...form, weight: +e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">용기크기</label>
                <input className="w-full border rounded px-3 py-2" value={form.size || ""} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">적정재고</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.optimalStock || ""} onChange={(e) => setForm({ ...form, optimalStock: +e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">재고단위</label>
                <input className="w-full border rounded px-3 py-2" value={form.stockUnit || ""} onChange={(e) => setForm({ ...form, stockUnit: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">유통기간</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.shelfLife || ""} onChange={(e) => setForm({ ...form, shelfLife: +e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">유효기간일수</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.expiryDays || ""} onChange={(e) => setForm({ ...form, expiryDays: +e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">입고창고코드</label>
                <input className="w-full border rounded px-3 py-2" value={form.inboundWarehouseCode || ""} onChange={(e) => setForm({ ...form, inboundWarehouseCode: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">입고존</label>
                <input className="w-full border rounded px-3 py-2" value={form.inboundZone || ""} onChange={(e) => setForm({ ...form, inboundZone: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">용기단가</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.unitPrice || ""} onChange={(e) => setForm({ ...form, unitPrice: +e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">자산TYPE</label>
                <input className="w-full border rounded px-3 py-2" value={form.assetType || ""} onChange={(e) => setForm({ ...form, assetType: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">TAG PREFIX</label>
                <input className="w-full border rounded px-3 py-2" value={form.tagPrefix || ""} onChange={(e) => setForm({ ...form, tagPrefix: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">회사EPC코드</label>
                <input className="w-full border rounded px-3 py-2" value={form.companyEpcCode || ""} onChange={(e) => setForm({ ...form, companyEpcCode: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">용기바코드</label>
                <input className="w-full border rounded px-3 py-2" value={form.barcode || ""} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
              <div><label className="block text-gray-600 mb-1">무게오차허용범위(Kg)</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.weightToleranceKg || ""} onChange={(e) => setForm({ ...form, weightToleranceKg: +e.target.value })} /></div>
              <div className="col-span-2"><label className="block text-gray-600 mb-1">비고</label>
                <textarea className="w-full border rounded px-3 py-2" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              {selected && <button onClick={() => setDeleting(selected)} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm">삭제</button>}
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-lg text-sm">취소</button>
              <button onClick={handleSave} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">저장</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleting}
        title="물류용기 삭제"
        message={`"${deleting?.containerName}" 용기를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
