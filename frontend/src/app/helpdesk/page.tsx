"use client";

import { useState, useEffect } from "react";
import { Plus, Search, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToastStore } from "@/stores/toast.store";
import { formatDate, cn } from "@/lib/utils";

interface HelpTicket {
  id: string;
  ticketNumber: string;
  screenName: string;
  type: string;
  status: "RECEIVED" | "PROCESSING" | "COMPLETED";
  description: string;
  requestDate: string;
  requester: string;
}

const STORAGE_KEY = "kcs_wms_helpdesk_tickets";

const screenOptions = [
  { value: "대시보드", label: "대시보드" },
  { value: "입고 관리", label: "입고 관리" },
  { value: "출고 관리", label: "출고 관리" },
  { value: "재고 현황", label: "재고 현황" },
  { value: "품목 관리", label: "품목 관리" },
  { value: "창고 관리", label: "창고 관리" },
  { value: "파트너 관리", label: "파트너 관리" },
  { value: "차량 관리", label: "차량 관리" },
  { value: "도크장 관리", label: "도크장 관리" },
  { value: "작업 지시서", label: "작업 지시서" },
  { value: "정산 관리", label: "정산 관리" },
  { value: "기타", label: "기타" },
];

const typeOptions = [
  { value: "오류", label: "오류" },
  { value: "개선", label: "개선" },
  { value: "문의", label: "문의" },
  { value: "기타", label: "기타" },
];

const statusFilters = [
  { value: "", label: "전체" },
  { value: "RECEIVED", label: "접수" },
  { value: "PROCESSING", label: "처리중" },
  { value: "COMPLETED", label: "완료" },
];

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

function loadTickets(): HelpTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: HelpTicket[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HelpTicket | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  // Load from localStorage on mount
  useEffect(() => {
    setTickets(loadTickets());
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      !search ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.screenName.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: {
    screenName: string;
    type: string;
    description: string;
    requester: string;
  }) => {
    const newTicket: HelpTicket = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      ticketNumber: `HD-${String(tickets.length + 1).padStart(4, "0")}`,
      screenName: data.screenName,
      type: data.type,
      status: "RECEIVED",
      description: data.description,
      requestDate: new Date().toISOString(),
      requester: data.requester,
    };
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveTickets(updated);
    addToast({ type: "success", message: "요청이 등록되었습니다." });
    setIsFormOpen(false);
  };

  const handleStatusChange = (ticket: HelpTicket, newStatus: "RECEIVED" | "PROCESSING" | "COMPLETED") => {
    const updated = tickets.map((t) =>
      t.id === ticket.id ? { ...t, status: newStatus } : t
    );
    setTickets(updated);
    saveTickets(updated);
    addToast({ type: "success", message: "상태가 변경되었습니다." });
    setSelectedTicket(undefined);
  };

  const columns: Column<HelpTicket>[] = [
    { key: "ticketNumber", header: "요청번호", sortable: true },
    { key: "screenName", header: "화면명", sortable: true },
    {
      key: "type",
      header: "유형",
      sortable: true,
      render: (row) => (
        <span className="inline-flex rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-xs font-medium text-[#4E5968]">
          {row.type}
        </span>
      ),
    },
    {
      key: "status",
      header: "진행상황",
      sortable: true,
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: "description",
      header: "요청사항",
      sortable: true,
      render: (row) => (
        <span className="block max-w-[200px] truncate text-[#6B7684]">
          {row.description}
        </span>
      ),
    },
    {
      key: "requestDate",
      header: "요청일",
      sortable: true,
      render: (row) => formatDate(row.requestDate),
    },
    { key: "requester", header: "요청자", sortable: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">HelpDesk</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          <Plus className="h-4 w-4" />
          요청 등록
        </button>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="요청번호, 화면명, 요청사항 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-[#3182F6] text-white"
                  : "bg-[#F2F4F6] text-[#6B7684] hover:bg-[#E5E8EB]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Table
          columns={columns}
          data={filteredTickets}
          isLoading={false}
          onRowClick={(ticket) => setSelectedTicket(ticket)}
          emptyMessage="등록된 요청이 없습니다."
        />
      </div>

      {/* Create Modal */}
      <HelpdeskFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(undefined)}
        title="요청 상세"
        size="md"
      >
        {selectedTicket && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#8B95A1]">요청번호</p>
                <p className="mt-1 text-sm font-semibold text-[#191F28]">
                  {selectedTicket.ticketNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">상태</p>
                <div className="mt-1">
                  <Badge status={selectedTicket.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">화면명</p>
                <p className="mt-1 text-sm text-[#4E5968]">{selectedTicket.screenName}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">유형</p>
                <p className="mt-1 text-sm text-[#4E5968]">{selectedTicket.type}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">요청자</p>
                <p className="mt-1 text-sm text-[#4E5968]">{selectedTicket.requester}</p>
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">요청일</p>
                <p className="mt-1 text-sm text-[#4E5968]">
                  {formatDate(selectedTicket.requestDate)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#8B95A1]">요청사항</p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-[#F7F8FA] p-4 text-sm text-[#4E5968]">
                {selectedTicket.description}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-[#8B95A1]">상태 변경</p>
              <div className="flex gap-2">
                {(["RECEIVED", "PROCESSING", "COMPLETED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selectedTicket, s)}
                    disabled={selectedTicket.status === s}
                    className={cn(
                      "rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-40",
                      selectedTicket.status === s
                        ? "bg-[#3182F6] text-white"
                        : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                    )}
                  >
                    {s === "RECEIVED" ? "접수" : s === "PROCESSING" ? "처리중" : "완료"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedTicket(undefined)}
                className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// --- Form Modal ---
function HelpdeskFormModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { screenName: string; type: string; description: string; requester: string }) => void;
}) {
  const [screenName, setScreenName] = useState("");
  const [type, setType] = useState("오류");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");

  useEffect(() => {
    if (isOpen) {
      setScreenName("");
      setType("오류");
      setDescription("");
      setRequester("");
    }
  }, [isOpen]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenName || !description || !requester) return;
    onSubmit({ screenName, type, description, requester });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="요청 등록" size="md">
      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              화면명 <span className="text-red-500">*</span>
            </label>
            <select
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              className={selectBase}
            >
              <option value="">선택해주세요</option>
              {screenOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">유형</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={selectBase}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            요청자 <span className="text-red-500">*</span>
          </label>
          <input
            value={requester}
            onChange={(e) => setRequester(e.target.value)}
            placeholder="요청자 이름"
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            요청내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="요청 내용을 상세히 입력해주세요"
            rows={5}
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">첨부파일</label>
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-[#E5E8EB] bg-[#F7F8FA] px-6 py-8">
            <p className="text-sm text-[#B0B8C1]">첨부파일 기능은 준비중입니다.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!screenName || !description || !requester}
            className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            등록
          </button>
        </div>
      </form>
    </Modal>
  );
}
