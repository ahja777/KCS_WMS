"use client";

import { useState, useMemo } from "react";
import {
  ArrowRightLeft,
  Plus,
  X,
  Play,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatNumber, formatDateTime } from "@/lib/utils";
import {
  useWarehouses,
  useItems,
  useInventoryMovements,
  useCreateInventoryMovement,
  useStartInventoryMovement,
  useCompleteInventoryMovement,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Warehouse } from "@/types";

const inputClass =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

interface MovementItem {
  itemId: string;
  quantity: number;
  fromLocationCode: string;
  toLocationCode: string;
}

interface Movement {
  id: string;
  movementNumber?: string;
  fromWarehouseId: string;
  fromWarehouse?: Warehouse;
  toWarehouseId: string;
  toWarehouse?: Warehouse;
  status: string;
  items?: Array<{
    id: string;
    itemId: string;
    item?: { code: string; name: string };
    quantity: number;
    fromLocationCode: string;
    toLocationCode: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS = [
  { key: "", label: "전체" },
  { key: "DRAFT", label: "초안" },
  { key: "IN_PROGRESS", label: "진행중" },
  { key: "COMPLETED", label: "완료" },
  { key: "CANCELLED", label: "취소" },
];

export default function MovementsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [movementItems, setMovementItems] = useState<MovementItem[]>([
    { itemId: "", quantity: 1, fromLocationCode: "", toLocationCode: "" },
  ]);

  const addToast = useToastStore((s) => s.addToast);

  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const warehouses = (warehousesData?.data ?? []).filter(
    (w: Warehouse) => w.status === "ACTIVE"
  );

  const { data: itemsData } = useItems({ limit: 500 });
  const items = itemsData?.data ?? [];

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page, limit: 20 };
    if (statusFilter) p.status = statusFilter;
    if (warehouseFilter) p.warehouseId = warehouseFilter;
    return p;
  }, [page, statusFilter, warehouseFilter]);

  const { data: movementsResponse, isLoading, error } = useInventoryMovements(queryParams);

  // Handle both paginated and array responses
  const movementsRaw = movementsResponse as unknown;
  const movements: Movement[] = useMemo(() => {
    if (!movementsRaw) return [];
    if (Array.isArray(movementsRaw)) return movementsRaw;
    if (typeof movementsRaw === "object" && movementsRaw !== null) {
      const obj = movementsRaw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Movement[];
    }
    return [];
  }, [movementsRaw]);

  const totalFromResponse = useMemo(() => {
    if (!movementsRaw || typeof movementsRaw !== "object") return movements.length;
    const obj = movementsRaw as Record<string, unknown>;
    return (obj.total as number) ?? movements.length;
  }, [movementsRaw, movements.length]);

  const totalPagesFromResponse = useMemo(() => {
    if (!movementsRaw || typeof movementsRaw !== "object") return 1;
    const obj = movementsRaw as Record<string, unknown>;
    return (obj.totalPages as number) ?? 1;
  }, [movementsRaw]);

  const createMutation = useCreateInventoryMovement();
  const startMutation = useStartInventoryMovement();
  const completeMutation = useCompleteInventoryMovement();

  const warehouseMap: Record<string, string> = {};
  (warehousesData?.data ?? []).forEach((w) => {
    warehouseMap[w.id] = w.name;
  });

  const handleAddItem = () => {
    setMovementItems((prev) => [
      ...prev,
      { itemId: "", quantity: 1, fromLocationCode: "", toLocationCode: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setMovementItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof MovementItem,
    value: string | number
  ) => {
    setMovementItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleCreate = async () => {
    if (!fromWarehouseId || !toWarehouseId) {
      addToast({ type: "error", message: "출발창고와 도착창고를 선택해주세요." });
      return;
    }
    const validItems = movementItems.filter(
      (item) => item.itemId && item.quantity > 0 && item.fromLocationCode && item.toLocationCode
    );
    if (validItems.length === 0) {
      addToast({ type: "error", message: "품목 정보를 입력해주세요." });
      return;
    }
    try {
      await createMutation.mutateAsync({
        fromWarehouseId,
        toWarehouseId,
        items: validItems,
      });
      addToast({ type: "success", message: "재고이동이 등록되었습니다." });
      setShowCreateModal(false);
      resetForm();
    } catch {
      addToast({ type: "error", message: "재고이동 등록에 실패했습니다." });
    }
  };

  const resetForm = () => {
    setFromWarehouseId("");
    setToWarehouseId("");
    setMovementItems([{ itemId: "", quantity: 1, fromLocationCode: "", toLocationCode: "" }]);
  };

  const handleStart = async (id: string) => {
    try {
      await startMutation.mutateAsync(id);
      addToast({ type: "success", message: "이동이 시작되었습니다." });
    } catch {
      addToast({ type: "error", message: "이동 시작에 실패했습니다." });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
      addToast({ type: "success", message: "이동이 완료되었습니다." });
    } catch {
      addToast({ type: "error", message: "이동 완료 처리에 실패했습니다." });
    }
  };

  const columns: Column<Movement>[] = [
    {
      key: "expand",
      header: "",
      width: "w-10",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === row.id ? null : row.id);
          }}
          className="text-[#8B95A1] hover:text-[#4E5968]"
        >
          {expandedId === row.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      key: "movementNumber",
      header: "이동번호",
      render: (row) => (
        <span className="text-sm font-medium text-[#191F28]">
          {row.movementNumber ?? row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "fromWarehouse",
      header: "출발창고",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {row.fromWarehouse?.name ?? warehouseMap[row.fromWarehouseId] ?? row.fromWarehouseId?.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "toWarehouse",
      header: "도착창고",
      render: (row) => (
        <span className="text-sm text-[#4E5968]">
          {row.toWarehouse?.name ?? warehouseMap[row.toWarehouseId] ?? row.toWarehouseId?.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: "itemCount",
      header: "품목수",
      render: (row) => (
        <span className="text-sm font-semibold text-[#191F28]">
          {row.items?.length ?? 0}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "일시",
      render: (row) => (
        <span className="text-sm text-[#4E5968] whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "작업",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "DRAFT" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleStart(row.id);
              }}
              isLoading={startMutation.isPending}
            >
              <Play className="h-3 w-3" />
              시작
            </Button>
          )}
          {row.status === "IN_PROGRESS" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleComplete(row.id);
              }}
              isLoading={completeMutation.isPending}
            >
              <CheckCircle className="h-3 w-3" />
              완료
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">재고이동 상세관리</h1>
          <p className="mt-1 text-sm text-[#8B95A1]">WMSST040</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          이동 등록
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status pills */}
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatusFilter(f.key);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.key
                    ? "bg-[#3182F6] text-white"
                    : "bg-[#F2F4F6] text-[#8B95A1] hover:bg-[#E5E8EB]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Warehouse filter */}
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border-0 bg-[#F7F8FA] px-4 py-2 text-sm text-[#191F28] outline-none transition-all focus:ring-2 focus:ring-[#3182F6]/20"
          >
            <option value="">전체 창고</option>
            {warehouses.map((w: Warehouse) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-6 text-lg font-bold text-[#191F28]">이동 목록</h2>
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={movements}
              isLoading={isLoading}
              page={page}
              totalPages={totalPagesFromResponse}
              total={totalFromResponse}
              onPageChange={setPage}
              onRowClick={(row) =>
                setExpandedId(expandedId === row.id ? null : row.id)
              }
              emptyMessage="이동 내역이 없습니다."
            />

            {/* Expanded row detail */}
            {expandedId && (
              <div className="mt-4 rounded-xl border border-[#E5E8EB] bg-[#F7F8FA] p-5">
                <h3 className="mb-4 text-sm font-bold text-[#191F28]">이동 품목 상세</h3>
                {(() => {
                  const movement = movements.find((m) => m.id === expandedId);
                  const mvItems = movement?.items ?? [];
                  if (mvItems.length === 0) {
                    return (
                      <p className="text-sm text-[#8B95A1]">품목 정보가 없습니다.</p>
                    );
                  }
                  return (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-xs font-medium uppercase text-[#8B95A1]">
                            품목코드
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase text-[#8B95A1]">
                            품목명
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase text-[#8B95A1]">
                            FROM 로케이션
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase text-[#8B95A1]">
                            TO 로케이션
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase text-[#8B95A1]">
                            수량
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mvItems.map((mi, idx) => (
                          <tr
                            key={mi.id ?? idx}
                            className="border-b border-[#F2F4F6]"
                          >
                            <td className="px-4 py-3 font-medium text-[#191F28]">
                              {mi.item?.code ?? mi.itemId?.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3 text-[#4E5968]">
                              {mi.item?.name ?? "-"}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#4E5968]">
                              {mi.fromLocationCode}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#4E5968]">
                              {mi.toLocationCode}
                            </td>
                            <td className="px-4 py-3 font-bold text-[#191F28]">
                              {formatNumber(mi.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-7 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F2FF]">
                  <ArrowRightLeft className="h-5 w-5 text-[#3182F6]" />
                </div>
                <h2 className="text-lg font-bold text-[#191F28]">이동 등록</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-[#8B95A1] hover:text-[#4E5968]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                    출발창고 <span className="text-[#F04452]">*</span>
                  </label>
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">선택하세요</option>
                    {warehouses.map((w: Warehouse) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                    도착창고 <span className="text-[#F04452]">*</span>
                  </label>
                  <select
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">선택하세요</option>
                    {warehouses.map((w: Warehouse) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#4E5968]">이동 품목</label>
                  <Button size="sm" variant="outline" onClick={handleAddItem}>
                    <Plus className="h-3 w-3" />
                    품목 추가
                  </Button>
                </div>

                <div className="space-y-3">
                  {movementItems.map((mi, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#E5E8EB] bg-[#F7F8FA] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#8B95A1]">
                          품목 #{idx + 1}
                        </span>
                        {movementItems.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-[#F04452] hover:text-[#D02838]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <select
                            value={mi.itemId}
                            onChange={(e) =>
                              handleItemChange(idx, "itemId", e.target.value)
                            }
                            className={inputClass}
                          >
                            <option value="">품목 선택</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            value={mi.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, "quantity", Number(e.target.value))
                            }
                            placeholder="수량"
                            min={1}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <input
                            value={mi.fromLocationCode}
                            onChange={(e) =>
                              handleItemChange(idx, "fromLocationCode", e.target.value)
                            }
                            placeholder="FROM 로케이션"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <input
                            value={mi.toLocationCode}
                            onChange={(e) =>
                              handleItemChange(idx, "toLocationCode", e.target.value)
                            }
                            placeholder="TO 로케이션"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleCreate}
                  isLoading={createMutation.isPending}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  등록
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
