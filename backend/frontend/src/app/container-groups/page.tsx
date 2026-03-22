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

interface ContainerGroup {
  id: string;
  groupCode: string;
  groupName: string;
  centerId?: string;
  zoneId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContainerGroupsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ContainerGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<ContainerGroup | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContainerGroup | null>(null);
  const [form, setForm] = useState({ groupCode: "", groupName: "", centerId: "", zoneId: "" });
  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("container-groups");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/container-groups?page=${page}&limit=20&search=${debouncedSearch}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json.data?.data || json.data || []);
      setTotal(json.data?.total || json.total || 0);
    } catch { /* */ }
  };

  useEffect(() => { fetchData(); }, [page, debouncedSearch]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/container-groups/${editing.id}` : `${API}/container-groups`;
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      addToast({ type: "success", message: editing ? "수정되었습니다." : "등록되었습니다." });
      setFormOpen(false);
      fetchData();
    } catch {
      addToast({ type: "error", message: "저장 실패" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/container-groups/${deleting.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      addToast({ type: "success", message: "삭제되었습니다." });
      fetchData();
    } catch { addToast({ type: "error", message: "삭제 실패" }); }
    finally { setDeleting(null); }
  };

  const columns: Column<ContainerGroup>[] = [
    { key: "groupCode", header: "용기군코드", sortable: true },
    { key: "groupName", header: "용기군명", sortable: true },
    { key: "centerId" as any, header: "물류센터ID", render: (r) => r.centerId || "-" },
    { key: "zoneId" as any, header: "존ID", render: (r) => r.zoneId || "-" },
    { key: "createdAt", header: "등록일자", render: (r) => formatDate(r.createdAt) },
    { key: "updatedAt", header: "수정일자", render: (r) => formatDate(r.updatedAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">물류용기군관리</h1>
        <span className="text-sm text-gray-500">기준관리 &gt; 물류용기군관리</span>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1 text-gray-600">물류용기군 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" placeholder="용기군코드, 용기군명" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-[#3182F6] text-white rounded-lg text-sm">조회</button>
        </div>
      </div>

      <PageActions
        onCreate={() => { setEditing(null); setForm({ groupCode: "", groupName: "", centerId: "", zoneId: "" }); setFormOpen(true); }}
        onExcel={() => downloadExcel("container-groups", data)}
        createLabel="신규"
        perm={perm}
      />

      <Table columns={columns} data={data}
        onRowClick={(row) => { setEditing(row); setForm({ groupCode: row.groupCode, groupName: row.groupName, centerId: row.centerId || "", zoneId: row.zoneId || "" }); setFormOpen(true); }}
        page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} total={total}
      />

      {formOpen && (
        <Modal title={editing ? "물류용기군 수정" : "물류용기군 등록"} onClose={() => setFormOpen(false)}>
          <div className="space-y-3">
            <div><label className="block text-sm text-gray-600 mb-1">용기군코드 *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={form.groupCode} onChange={(e) => setForm({ ...form, groupCode: e.target.value })} /></div>
            <div><label className="block text-sm text-gray-600 mb-1">용기군명 *</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} /></div>
            <div><label className="block text-sm text-gray-600 mb-1">물류센터ID</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={form.centerId} onChange={(e) => setForm({ ...form, centerId: e.target.value })} /></div>
            <div><label className="block text-sm text-gray-600 mb-1">존ID</label>
              <input className="w-full border rounded px-3 py-2 text-sm" value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {editing && <button onClick={() => { setDeleting(editing); setFormOpen(false); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm">삭제</button>}
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 border rounded-lg text-sm">취소</button>
            <button onClick={handleSave} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">저장</button>
          </div>
        </Modal>
      )}

      <ConfirmModal isOpen={!!deleting} title="삭제 확인" message={`"${deleting?.groupName}" 용기군을 삭제하시겠습니까?`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
