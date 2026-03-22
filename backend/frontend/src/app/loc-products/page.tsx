"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { downloadExcel } from "@/lib/export";
import { useToastStore } from "@/stores/toast.store";
import { formatDate } from "@/lib/utils";

const API = "http://localhost:4100/api";

interface LocationProduct {
  id: string; locationCode: string; partnerId?: string; itemId: string;
  centerId?: string; createdBy?: string; updatedBy?: string;
  createdAt: string; updatedAt: string;
}

export default function LocProductsPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LocationProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<LocationProduct | null>(null);
  const [form, setForm] = useState({ locationCode: "", itemId: "", partnerId: "" });
  const addToast = useToastStore((s) => s.addToast);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/location-products?page=${page}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(json.data?.data || json.data || []);
      setTotal(json.data?.total || json.total || 0);
    } catch { /* */ }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleRegister = async () => {
    if (!form.locationCode || !form.itemId) { addToast({ type: "error", message: "로케이션과 상품은 필수입니다." }); return; }
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/location-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      addToast({ type: "success", message: "입고상품이 등록되었습니다." });
      setForm({ locationCode: "", itemId: "", partnerId: "" });
      fetchData();
    } catch { addToast({ type: "error", message: "등록 실패" }); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/location-products/${deleting.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      addToast({ type: "success", message: "삭제되었습니다." }); fetchData();
    } catch { addToast({ type: "error", message: "삭제 실패" }); }
    finally { setDeleting(null); }
  };

  const columns: Column<LocationProduct>[] = [
    { key: "locationCode", header: "로케이션", sortable: true },
    { key: "partnerId" as any, header: "화주명", render: (r) => r.partnerId || "-" },
    { key: "itemId", header: "상품명" },
    { key: "createdAt", header: "등록일자", render: (r) => formatDate(r.createdAt) },
    { key: "createdBy" as any, header: "등록자", render: (r) => r.createdBy || "-" },
    { key: "updatedAt", header: "수정일자", render: (r) => formatDate(r.updatedAt) },
    { key: "updatedBy" as any, header: "수정자", render: (r) => r.updatedBy || "-" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">LOC별입고상품등록</h1>
        <span className="text-sm text-gray-500">기준관리 &gt; LOC별입고상품등록</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-lg border p-4">
          <div className="flex gap-2 mb-4">
            <button onClick={() => downloadExcel("loc-products", data)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">엑셀</button>
            <button onClick={fetchData} className="px-3 py-1.5 bg-[#3182F6] text-white rounded text-sm">조회</button>
          </div>
          <Table columns={columns} data={data} onRowClick={(r) => setDeleting(r)}
            page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} total={total} />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-bold text-sm mb-4">입고상품 등록</h3>
          <div className="space-y-3 text-sm">
            <div><label className="block text-gray-600 mb-1 text-red-500">* 로케이션</label>
              <input className="w-full border rounded px-3 py-2" value={form.locationCode} onChange={(e) => setForm({ ...form, locationCode: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">화주</label>
              <input className="w-full border rounded px-3 py-2" value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1 text-red-500">* 상품</label>
              <input className="w-full border rounded px-3 py-2" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} /></div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setForm({ locationCode: "", itemId: "", partnerId: "" })} className="flex-1 px-3 py-2 border rounded text-sm">초기화</button>
              <button onClick={handleRegister} className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm">입고상품등록</button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={!!deleting} title="삭제 확인" message="해당 입고상품을 삭제하시겠습니까?" onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
