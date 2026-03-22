"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import PageActions from "@/components/ui/PageActions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import { downloadExcel } from "@/lib/export";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import { formatDate } from "@/lib/utils";

const API = "http://localhost:4100/api";

interface OwnershipTransfer {
  id: string; workNumber: string; status: string; workDate: string;
  fromPartnerId: string; fromItemId: string; fromQuantity: number; fromUom: string;
  toPartnerId: string; toItemId: string; toQuantity: number; toUom: string;
}

export default function OwnershipTransferPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OwnershipTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<OwnershipTransfer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<OwnershipTransfer>>({});
  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("ownership-transfer");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/ownership-transfers?page=${page}&limit=20&search=${debouncedSearch}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(json.data?.data || json.data || []);
      setTotal(json.data?.total || json.total || 0);
    } catch { /* */ }
  };

  useEffect(() => { fetchData(); }, [page, debouncedSearch]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/ownership-transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      addToast({ type: "success", message: "등록되었습니다." });
      setFormOpen(false); fetchData();
    } catch { addToast({ type: "error", message: "저장 실패" }); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/ownership-transfers/${deleting.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      addToast({ type: "success", message: "삭제되었습니다." }); fetchData();
    } catch { addToast({ type: "error", message: "삭제 실패" }); }
    finally { setDeleting(null); }
  };

  const columns: Column<OwnershipTransfer>[] = [
    { key: "workNumber", header: "작업번호", sortable: true },
    { key: "status", header: "완료", render: (r) => r.status === "COMPLETED" ? "완료" : "미완료" },
    { key: "workDate", header: "작업일", render: (r) => formatDate(r.workDate) },
    { key: "fromPartnerId" as any, header: "양도자" },
    { key: "fromItemId" as any, header: "상품(양도)" },
    { key: "fromQuantity" as any, header: "수량", render: (r) => r.fromQuantity },
    { key: "fromUom" as any, header: "UOM", render: (r) => r.fromUom },
    { key: "toPartnerId" as any, header: "양수자" },
    { key: "toItemId" as any, header: "상품(양수)" },
    { key: "toQuantity" as any, header: "수량", render: (r) => r.toQuantity },
    { key: "toUom" as any, header: "UOM", render: (r) => r.toUom },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">명의변경</h1>
        <span className="text-sm text-gray-500">재고관리 &gt; 명의변경</span>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1"><label className="block text-sm mb-1 text-gray-600">화주</label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" placeholder="화주 검색" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm">조회</button>
        </div>
      </div>
      <PageActions onCreate={() => { setForm({}); setFormOpen(true); }} onExcel={() => downloadExcel("ownership-transfers", data)} createLabel="신규" perm={perm} />
      <Table columns={columns} data={data} onRowClick={(r) => setDeleting(r)} page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} total={total} />

      {formOpen && (
        <Modal title="명의변경 등록" onClose={() => setFormOpen(false)}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><label className="block text-gray-600 mb-1">작업번호 *</label><input className="w-full border rounded px-3 py-2" value={form.workNumber || ""} onChange={(e) => setForm({ ...form, workNumber: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">작업일 *</label><input type="date" className="w-full border rounded px-3 py-2" value={form.workDate || ""} onChange={(e) => setForm({ ...form, workDate: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양도자 ID *</label><input className="w-full border rounded px-3 py-2" value={form.fromPartnerId || ""} onChange={(e) => setForm({ ...form, fromPartnerId: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양수자 ID *</label><input className="w-full border rounded px-3 py-2" value={form.toPartnerId || ""} onChange={(e) => setForm({ ...form, toPartnerId: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양도 상품 ID *</label><input className="w-full border rounded px-3 py-2" value={form.fromItemId || ""} onChange={(e) => setForm({ ...form, fromItemId: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양수 상품 ID *</label><input className="w-full border rounded px-3 py-2" value={form.toItemId || ""} onChange={(e) => setForm({ ...form, toItemId: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양도 수량 *</label><input type="number" className="w-full border rounded px-3 py-2" value={form.fromQuantity || ""} onChange={(e) => setForm({ ...form, fromQuantity: +e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양수 수량 *</label><input type="number" className="w-full border rounded px-3 py-2" value={form.toQuantity || ""} onChange={(e) => setForm({ ...form, toQuantity: +e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양도 UOM *</label><input className="w-full border rounded px-3 py-2" value={form.fromUom || ""} onChange={(e) => setForm({ ...form, fromUom: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">양수 UOM *</label><input className="w-full border rounded px-3 py-2" value={form.toUom || ""} onChange={(e) => setForm({ ...form, toUom: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 border rounded-lg text-sm">취소</button>
            <button onClick={handleSave} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">저장</button>
          </div>
        </Modal>
      )}
      <ConfirmModal isOpen={!!deleting} title="삭제 확인" message={`"${deleting?.workNumber}" 작업을 삭제하시겠습니까?`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
