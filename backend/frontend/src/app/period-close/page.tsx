"use client";

import { useState, useEffect } from "react";
import Table, { type Column } from "@/components/ui/Table";
import PageActions from "@/components/ui/PageActions";
import Modal from "@/components/ui/Modal";
import { downloadExcel } from "@/lib/export";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import { formatDate } from "@/lib/utils";

const API = "http://localhost:4100/api";

interface PeriodClose {
  id: string; periodType: string; periodDate: string; warehouseId?: string;
  partnerId?: string; status: string; closedBy?: string; closedAt?: string;
  notes?: string; createdAt: string;
}

export default function PeriodClosePage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PeriodClose[]>([]);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ periodType: "MONTHLY", periodDate: "", notes: "" });
  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("period-close");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/period-closes?page=${page}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(json.data?.data || json.data || []);
      setTotal(json.data?.total || json.total || 0);
    } catch { /* */ }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/period-closes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      addToast({ type: "success", message: "마감이 생성되었습니다." });
      setFormOpen(false); fetchData();
    } catch { addToast({ type: "error", message: "생성 실패" }); }
  };

  const handleClose = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/period-closes/${id}/close`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      addToast({ type: "success", message: "마감이 실행되었습니다." }); fetchData();
    } catch { addToast({ type: "error", message: "마감 실패" }); }
  };

  const columns: Column<PeriodClose>[] = [
    { key: "periodType", header: "마감유형", render: (r) => r.periodType === "DAILY" ? "일마감" : r.periodType === "MONTHLY" ? "월마감" : "연마감" },
    { key: "periodDate", header: "마감일자", render: (r) => formatDate(r.periodDate) },
    { key: "status", header: "상태", render: (r) => r.status === "CLOSED" ? "마감완료" : "진행중" },
    { key: "closedAt" as any, header: "마감실행일시", render: (r) => r.closedAt ? formatDate(r.closedAt) : "-" },
    { key: "notes" as any, header: "비고", render: (r) => r.notes || "-" },
    { key: "action" as any, header: "실행",
      render: (r) => r.status !== "CLOSED" ? (
        <button onClick={(e) => { e.stopPropagation(); handleClose(r.id); }} className="px-3 py-1 bg-red-500 text-white rounded text-xs">마감실행</button>
      ) : <span className="text-green-600 text-xs font-medium">완료</span>
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">마감관리</h1>
        <span className="text-sm text-gray-500">기준관리 &gt; 마감관리</span>
      </div>

      <PageActions onCreate={() => setFormOpen(true)} onExcel={() => downloadExcel("period-closes", data)} createLabel="신규" perm={perm} />

      <Table columns={columns} data={data} page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} total={total} />

      {formOpen && (
        <Modal title="마감 생성" onClose={() => setFormOpen(false)}>
          <div className="space-y-3 text-sm">
            <div><label className="block text-gray-600 mb-1">마감유형</label>
              <select className="w-full border rounded px-3 py-2" value={form.periodType} onChange={(e) => setForm({ ...form, periodType: e.target.value })}>
                <option value="DAILY">일마감</option><option value="MONTHLY">월마감</option><option value="YEARLY">연마감</option>
              </select></div>
            <div><label className="block text-gray-600 mb-1">마감일자 *</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.periodDate} onChange={(e) => setForm({ ...form, periodDate: e.target.value })} /></div>
            <div><label className="block text-gray-600 mb-1">비고</label>
              <textarea className="w-full border rounded px-3 py-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 border rounded-lg text-sm">취소</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">저장</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
