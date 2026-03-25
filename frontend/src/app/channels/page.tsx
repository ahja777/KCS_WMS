"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Search,
  AlertCircle,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowUpDown,
  ShoppingCart,
  Package,
  Pencil,
} from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  useChannels,
  useDeleteChannel,
  useTestConnection,
  useSyncOrders,
  useSyncInventory,
  useToggleSync,
} from "@/hooks/useChannels";
import ChannelFormModal from "@/components/channels/ChannelFormModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToastStore } from "@/stores/toast.store";
import type { SalesChannel, ChannelPlatform } from "@/types/channel";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/types/channel";

const platformFilters = [
  { value: "", label: "전체" },
  { value: "COUPANG", label: "쿠팡" },
  { value: "NAVER", label: "네이버" },
  { value: "AMAZON", label: "아마존" },
  { value: "SHOPIFY", label: "Shopify" },
  { value: "EBAY", label: "eBay" },
];

const statusColors: Record<string, string> = {
  ACTIVE: "bg-[#E8FAF0] text-[#00C853]",
  INACTIVE: "bg-[#F2F4F6] text-[#8B95A1]",
  ERROR: "bg-red-50 text-red-500",
  PENDING: "bg-[#FFF4E6] text-[#FF9500]",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "연결됨",
  INACTIVE: "비활성",
  ERROR: "오류",
  PENDING: "대기중",
};

export default function ChannelsPage() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<SalesChannel | undefined>();
  const [deletingChannel, setDeletingChannel] = useState<SalesChannel | undefined>();
  const addToast = useToastStore((s) => s.addToast);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useChannels({
    page,
    limit: 20,
    ...(platformFilter ? { platform: platformFilter } : {}),
  });

  const deleteMutation = useDeleteChannel();
  const testMutation = useTestConnection();
  const syncOrdersMutation = useSyncOrders();
  const syncInventoryMutation = useSyncInventory();
  const toggleSyncMutation = useToggleSync();

  const channels = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingChannel(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (channel: SalesChannel) => {
    setEditingChannel(channel);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, ch: SalesChannel) => {
    e.stopPropagation();
    setDeletingChannel(ch);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingChannel) return;
    try {
      await deleteMutation.mutateAsync(deletingChannel.id);
      addToast({ type: "success", message: "채널이 삭제되었습니다." });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingChannel(undefined);
    }
  };

  const handleTest = async (e: React.MouseEvent, ch: SalesChannel) => {
    e.stopPropagation();
    try {
      const result = await testMutation.mutateAsync(ch.id);
      addToast({
        type: result.connected ? "success" : "error",
        message: result.connected
          ? `${PLATFORM_LABELS[ch.platform]} 연결 성공!`
          : `연결 실패. API 인증 정보를 확인해주세요.`,
      });
      refetch();
    } catch {
      addToast({ type: "error", message: "연결 테스트 중 오류가 발생했습니다." });
    }
  };

  const handleSyncOrders = async (e: React.MouseEvent, ch: SalesChannel) => {
    e.stopPropagation();
    try {
      const result = await syncOrdersMutation.mutateAsync({
        channelId: ch.id,
      });
      addToast({
        type: "success",
        message: `주문 동기화 완료: ${result.recordCount}건 동기화, ${result.errorCount}건 오류`,
      });
      refetch();
    } catch {
      addToast({ type: "error", message: "주문 동기화 중 오류가 발생했습니다." });
    }
  };

  const handleSyncInventory = async (e: React.MouseEvent, ch: SalesChannel) => {
    e.stopPropagation();
    try {
      const result = await syncInventoryMutation.mutateAsync(ch.id);
      addToast({
        type: "success",
        message: `재고 동기화 완료: ${result.success}건 성공, ${result.failed}건 실패`,
      });
    } catch {
      addToast({ type: "error", message: "재고 동기화 중 오류가 발생했습니다." });
    }
  };

  const columns: Column<SalesChannel>[] = [
    {
      key: "platform",
      header: "플랫폼",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: PLATFORM_COLORS[row.platform] }}
          />
          <span className="text-sm font-semibold">
            {PLATFORM_LABELS[row.platform]}
          </span>
        </div>
      ),
    },
    { key: "name", header: "채널명", sortable: true },
    {
      key: "warehouse",
      header: "연결 창고",
      sortable: true,
      render: (row) => row.warehouse?.name ?? "-",
    },
    {
      key: "status",
      header: "상태",
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[row.status] || ""}`}
        >
          {row.status === "ACTIVE" ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {statusLabels[row.status] || row.status}
        </span>
      ),
    },
    {
      key: "syncEnabled",
      header: "자동동기화",
      sortable: true,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSyncMutation.mutate({
              channelId: row.id,
              enabled: !row.syncEnabled,
            });
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            row.syncEnabled ? "bg-[#3182F6]" : "bg-[#D5D8DC]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              row.syncEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      ),
    },
    {
      key: "lastSyncAt",
      header: "최근 동기화",
      sortable: true,
      render: (row) =>
        row.lastSyncAt ? (
          <span className="text-sm text-[#4E5968]">
            {formatDate(row.lastSyncAt, "yyyy-MM-dd HH:mm")}
          </span>
        ) : (
          <span className="text-sm text-[#8B95A1]">-</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            title="수정"
            className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#E8F3FF] hover:text-[#3182F6]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleTest(e, row)}
            title="연결 테스트"
            className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#E8F3FF] hover:text-[#3182F6]"
          >
            <Wifi className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleSyncOrders(e, row)}
            title="주문 동기화"
            className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#E8F3FF] hover:text-[#3182F6]"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleSyncInventory(e, row)}
            title="재고 동기화"
            className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#E8F3FF] hover:text-[#3182F6]"
          >
            <Package className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleDeleteClick(e, row)}
            title="삭제"
            className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">
            판매채널 관리
          </h1>
          <p className="mt-1 text-sm text-[#8B95A1]">
            외부 이커머스 플랫폼 연동 관리
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          <Plus className="h-4 w-4" />
          채널 등록
        </button>
      </div>

      {/* 플랫폼 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["COUPANG", "NAVER", "AMAZON", "SHOPIFY"] as ChannelPlatform[]).map(
          (p) => {
            const count = channels.filter((c) => c.platform === p).length;
            const active = channels.filter(
              (c) => c.platform === p && c.status === "ACTIVE"
            ).length;
            return (
              <div
                key={p}
                className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: PLATFORM_COLORS[p] }}
                  />
                  <span className="text-sm font-semibold text-[#191F28]">
                    {PLATFORM_LABELS[p]}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[#191F28]">
                  {count}
                </p>
                <p className="text-xs text-[#8B95A1]">
                  {active}개 활성
                </p>
              </div>
            );
          }
        )}
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Search + Filter */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="채널명, 셀러ID 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
          <div className="flex gap-2">
            {platformFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setPlatformFilter(f.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  platformFilter === f.value
                    ? "bg-[#191F28] text-white"
                    : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={channels}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleEdit}
          />
        )}
      </div>

      <ChannelFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        channel={editingChannel}
        onSuccess={() => refetch()}
      />

      <ConfirmModal
        isOpen={!!deletingChannel}
        onClose={() => setDeletingChannel(undefined)}
        onConfirm={handleDeleteConfirm}
        title="채널 삭제"
        message={`"${deletingChannel?.name}" 채널을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
