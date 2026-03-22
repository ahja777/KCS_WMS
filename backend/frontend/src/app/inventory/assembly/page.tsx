"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import PageActions from "@/components/ui/PageActions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { downloadExcel } from "@/lib/export";
import { useToastStore } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import { formatDate } from "@/lib/utils";

const API = "http://localhost:4100/api";

interface Assembly {
  id: string; workNumber: string; status: string; partnerId?: string;
  warehouseId?: string; workDate?: string; notes?: string;
  items?: Array<{ id: string; itemId: string; quantity: number; uom: string; type: string }>;
}

export default function AssemblyPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Assembly[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Assembly | null>(null);
  const [deleting, setDeleting] = useState<Assembly | null>(null);
  const addToast = useToastStore((s) => s.addToast);
  const perm = usePermission("assembly");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/assemblies?page=${page}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(json.data?.data || json.data || []);
      setTotal(json.data?.total || json.total || 0);
    } catch { /* */ }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/assemblies/${deleting.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      addToast({ type: "success", message: "삭제되었습니다." }); fetchData();
    } catch { addToast({ type: "error", message: "삭제 실패" }); }
    finally { setDeleting(null); }
  };

  const columns: Column<Assembly>[] = [
    { key: "workNumber", header: "작업번호", sortable: true },
    { key: "status", header: "상태", render: (r) => r.status === "COMPLETED" ? "완료" : r.status === "PENDING" ? "대기" : r.status },
    { key: "workDate" as any, header: "작업일", render: (r) => r.workDate ? formatDate(r.workDate) : "-" },
    { key: "notes" as any, header: "비고", render: (r) => r.notes || "-" },
    { key: "items" as any, header: "품목수", render: (r) => r.items?.length || 0 },
  ];

  const detailColumns: Column<any>[] = [
    { key: "type", header: "구분", render: (r: any) => r.type === "INPUT" ? "투입" : "산출" },
    { key: "itemId", header: "상품ID" },
    { key: "quantity", header: "수량" },
    { key: "uom", header: "UOM" },
    { key: "locationCode", header: "로케이션", render: (r: any) => r.locationCode || "-" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">임가공(조립)</h1>
        <span className="text-sm text-gray-500">재고관리 &gt; 임가공(조립)</span>
      </div>

      <PageActions onExcel={() => downloadExcel("assemblies", data)} perm={perm} />

      <Table columns={columns} data={data}
        onRowClick={(r) => setSelected(r)}
        page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} total={total}
      />

      {selected && selected.items && selected.items.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-bold mb-2 text-sm">임가공 품목 상세 - {selected.workNumber}</h3>
          <Table columns={detailColumns} data={selected.items} />
        </div>
      )}

      <ConfirmModal isOpen={!!deleting} title="삭제 확인" message={`"${deleting?.workNumber}" 작업을 삭제하시겠습니까?`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
