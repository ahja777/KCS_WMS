"use client";

import { useState, useMemo } from "react";
import { Search, RotateCcw, Plus, Trash2, FileSpreadsheet } from "lucide-react";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  useVehicles,
  useDispatches,
  useCreateDispatch,
  useDeleteDispatch,
  useWarehouses,
  useOutboundOrders,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { Vehicle } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20";

export default function DispatchPage() {
  const addToast = useToastStore((s) => s.addToast);
  const today = new Date().toISOString().slice(0, 10);

  // Search filters
  const [orderDate, setOrderDate] = useState(today);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [dispatchSeq, setDispatchSeq] = useState("");

  // Selection
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDispatchIds, setSelectedDispatchIds] = useState<string[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVehicleId, setModalVehicleId] = useState("");
  const [modalWarehouseId, setModalWarehouseId] = useState("");
  const [modalDate, setModalDate] = useState(today);
  const [modalSeq, setModalSeq] = useState("1");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // API
  const { data: vehiclesRes, isLoading: vehiclesLoading } = useVehicles({ limit: 100 });
  const { data: dispatchesRes, isLoading: dispatchesLoading } = useDispatches({
    date: orderDate,
    ...(selectedVehicle ? { vehicleId: selectedVehicle.id } : {}),
    ...(dispatchSeq ? { dispatchSeq } : {}),
    limit: 100,
  });
  const { data: warehousesRes } = useWarehouses({ limit: 100 });
  const { data: ordersRes } = useOutboundOrders({ status: "CONFIRMED", limit: 100 });

  const createDispatch = useCreateDispatch();
  const deleteDispatch = useDeleteDispatch();

  const vehicles = useMemo(() => {
    const list = vehiclesRes?.data ?? [];
    if (!vehicleSearch.trim()) return list;
    return list.filter(
      (v: Vehicle) =>
        v.plateNumber?.includes(vehicleSearch) ||
        v.driverName?.includes(vehicleSearch)
    );
  }, [vehiclesRes, vehicleSearch]);

  const dispatches = dispatchesRes?.data ?? [];
  const warehouses = warehousesRes?.data ?? [];
  const orders = ordersRes?.data ?? [];

  const handleSearch = () => {
    addToast({ type: "info", message: "검색되었습니다." });
  };

  const handleReset = () => {
    setOrderDate(today);
    setVehicleSearch("");
    setDispatchSeq("");
    setSelectedVehicle(null);
  };

  const handleDelete = async () => {
    if (selectedDispatchIds.length === 0) {
      addToast({ type: "warning", message: "삭제할 배차를 선택해주세요." });
      return;
    }
    try {
      for (const id of selectedDispatchIds) {
        await deleteDispatch.mutateAsync(id);
      }
      addToast({ type: "success", message: `${selectedDispatchIds.length}건이 삭제되었습니다.` });
      setSelectedDispatchIds([]);
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    }
  };

  const handleExcel = () => {
    addToast({ type: "info", message: "엑셀 다운로드 기능 준비 중입니다." });
  };

  const handleCreateDispatch = async () => {
    if (!modalVehicleId || !modalWarehouseId) {
      addToast({ type: "warning", message: "차량과 창고를 선택해주세요." });
      return;
    }
    try {
      await createDispatch.mutateAsync({
        vehicleId: modalVehicleId,
        warehouseId: modalWarehouseId,
        dispatchDate: modalDate,
        dispatchSeq: Number(modalSeq) || 1,
        items: selectedOrderIds.map((orderId) => {
          const order = orders.find((o: any) => o.id === orderId);
          return {
            itemCode: order?.orderNumber ?? orderId,
            itemName: order?.partner?.name ?? "-",
            orderedQty: order?.lines?.reduce((sum: number, l: any) => sum + (l.orderedQty || 0), 0) ?? 0,
            dispatchedQty: 0,
          };
        }),
      });
      addToast({ type: "success", message: "배차가 생성되었습니다." });
      setModalOpen(false);
      setSelectedOrderIds([]);
      setModalVehicleId("");
      setModalWarehouseId("");
    } catch {
      addToast({ type: "error", message: "배차 생성 중 오류가 발생했습니다." });
    }
  };

  const toggleDispatchSelect = (id: string) => {
    setSelectedDispatchIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleOrderSelect = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">
          출고관리 &gt; 배차작업
        </h1>
      </div>

      {/* Search filters */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              주문일자
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className={selectBase}
            />
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              차량
            </label>
            <div className="flex gap-1">
              <input
                type="text"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="차량번호/기사명"
                className={inputBase}
              />
              <button className="rounded-lg bg-[#F2F4F6] p-2.5 text-[#4E5968] hover:bg-[#E5E8EB]">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-w-[120px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              작업차수
            </label>
            <input
              type="text"
              value={dispatchSeq}
              onChange={(e) => setDispatchSeq(e.target.value)}
              placeholder="차수"
              className={inputBase}
            />
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg border border-[#E5E8EB] bg-white p-3 text-[#8B95A1] hover:bg-[#F7F8FA]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" /> 검색
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B64DA]"
        >
          <Plus className="h-3.5 w-3.5" /> 신규배차
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded-xl bg-[#F04452] px-4 py-2 text-xs font-semibold text-white hover:bg-[#E03340]"
        >
          <Trash2 className="h-3.5 w-3.5" /> 삭제
        </button>
        <button
          onClick={handleExcel}
          className="flex items-center gap-1.5 rounded-xl bg-[#1FC47D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#18A869]"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> 엑셀
        </button>
      </div>

      {/* Two-panel grid: Left=Vehicles, Right=Dispatches */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-2">
        {/* Left: 차량목록 */}
        <div className="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="rounded-t-2xl bg-[#4A5568] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">차량목록</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#F7F8FA]">
                <tr>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">차량번호</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">TON수</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">기사명</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">연락처</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-[#8B95A1]">상태</th>
                </tr>
              </thead>
              <tbody>
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm text-[#8B95A1]">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm text-[#8B95A1]">
                      차량 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v: Vehicle) => (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className={cn(
                        "cursor-pointer border-b border-[#F2F4F6] transition-colors",
                        selectedVehicle?.id === v.id
                          ? "bg-[#E8F2FF]"
                          : "hover:bg-[#F7F8FA]"
                      )}
                    >
                      <td className="px-3 py-3 text-sm text-[#191F28]">{v.plateNumber}</td>
                      <td className="px-3 py-3 text-right text-sm text-[#4E5968]">
                        {formatNumber(v.tonnage)}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{v.driverName || "-"}</td>
                      <td className="px-3 py-3 text-sm text-[#4E5968]">{v.driverPhone || "-"}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge status={v.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#F2F4F6] px-5 py-3">
            <p className="text-sm text-[#8B95A1]">
              총 {vehicles.length}건
            </p>
          </div>
        </div>

        {/* Right: 배차내역 */}
        <div className="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="rounded-t-2xl bg-[#4A5568] px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white">
              배차내역
              {selectedVehicle && (
                <span className="ml-2 text-xs font-normal text-gray-300">
                  ({selectedVehicle.plateNumber} - {selectedVehicle.driverName || "미지정"})
                </span>
              )}
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#F7F8FA]">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={
                        dispatches.length > 0 &&
                        selectedDispatchIds.length === dispatches.length
                      }
                      onChange={() => {
                        if (selectedDispatchIds.length === dispatches.length) {
                          setSelectedDispatchIds([]);
                        } else {
                          setSelectedDispatchIds(dispatches.map((d: any) => d.id));
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">차량번호</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">주문번호</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-[#8B95A1]">순번</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-[#8B95A1]">작업상태</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#8B95A1]">상품</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">주문수량</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-[#8B95A1]">배차수량</th>
                </tr>
              </thead>
              <tbody>
                {dispatchesLoading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-[#8B95A1]">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#3182F6] border-t-transparent" />
                    </td>
                  </tr>
                ) : dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-[#8B95A1]">
                      {selectedVehicle
                        ? "배차 내역이 없습니다."
                        : "좌측에서 차량을 선택해주세요."}
                    </td>
                  </tr>
                ) : (
                  dispatches.map((d: any) => {
                    const items = d.items ?? [];
                    if (items.length === 0) {
                      return (
                        <tr
                          key={d.id}
                          className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]"
                        >
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedDispatchIds.includes(d.id)}
                              onChange={() => toggleDispatchSelect(d.id)}
                            />
                          </td>
                          <td className="px-3 py-3 text-sm text-[#191F28]">
                            {d.vehicle?.plateNumber ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-sm text-[#4E5968]">
                            {d.inboundOrder?.orderNumber ?? d.outboundOrderId ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-center text-sm text-[#4E5968]">
                            {d.dispatchSeq}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge status={d.status} />
                          </td>
                          <td className="px-3 py-3 text-sm text-[#4E5968]">-</td>
                          <td className="px-3 py-3 text-right text-sm text-[#4E5968]">0</td>
                          <td className="px-3 py-3 text-right text-sm text-[#4E5968]">0</td>
                        </tr>
                      );
                    }
                    return items.map((item: any, idx: number) => (
                      <tr
                        key={`${d.id}-${idx}`}
                        className="border-b border-[#F2F4F6] hover:bg-[#F7F8FA]"
                      >
                        {idx === 0 && (
                          <td className="px-3 py-3 text-center" rowSpan={items.length}>
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedDispatchIds.includes(d.id)}
                              onChange={() => toggleDispatchSelect(d.id)}
                            />
                          </td>
                        )}
                        {idx === 0 && (
                          <td className="px-3 py-3 text-sm text-[#191F28]" rowSpan={items.length}>
                            {d.vehicle?.plateNumber ?? "-"}
                          </td>
                        )}
                        {idx === 0 && (
                          <td className="px-3 py-3 text-sm text-[#4E5968]" rowSpan={items.length}>
                            {d.inboundOrder?.orderNumber ?? d.outboundOrderId ?? "-"}
                          </td>
                        )}
                        {idx === 0 && (
                          <td className="px-3 py-3 text-center text-sm text-[#4E5968]" rowSpan={items.length}>
                            {d.dispatchSeq}
                          </td>
                        )}
                        {idx === 0 && (
                          <td className="px-3 py-3 text-center" rowSpan={items.length}>
                            <Badge status={d.status} />
                          </td>
                        )}
                        <td className="px-3 py-3 text-sm text-[#4E5968]">
                          {item.itemName ?? item.itemCode ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-[#4E5968]">
                          {formatNumber(item.orderedQty)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-[#4E5968]">
                          {formatNumber(item.dispatchedQty)}
                        </td>
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#F2F4F6] px-5 py-3">
            <p className="text-sm text-[#8B95A1]">총 {dispatches.length}건</p>
          </div>
        </div>
      </div>

      {/* 신규배차 모달 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="신규 배차"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                차량선택 <span className="text-red-500">*</span>
              </label>
              <select
                value={modalVehicleId}
                onChange={(e) => setModalVehicleId(e.target.value)}
                className={selectBase + " w-full"}
              >
                <option value="">차량을 선택하세요</option>
                {(vehiclesRes?.data ?? []).map((v: Vehicle) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} ({v.driverName || "기사미지정"}) - {v.tonnage}T
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                창고선택 <span className="text-red-500">*</span>
              </label>
              <select
                value={modalWarehouseId}
                onChange={(e) => setModalWarehouseId(e.target.value)}
                className={selectBase + " w-full"}
              >
                <option value="">창고를 선택하세요</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                배차일자
              </label>
              <input
                type="date"
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                className={selectBase + " w-full"}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
                배차차수
              </label>
              <input
                type="number"
                value={modalSeq}
                onChange={(e) => setModalSeq(e.target.value)}
                min={1}
                className={inputBase}
              />
            </div>
          </div>

          {/* 주문목록 */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#191F28]">
              주문목록 (확정된 출고주문)
            </h3>
            <div className="max-h-[240px] overflow-auto rounded-xl border border-[#E5E8EB]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#F7F8FA]">
                  <tr>
                    <th className="w-10 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                        onChange={() => {
                          if (selectedOrderIds.length === orders.length) {
                            setSelectedOrderIds([]);
                          } else {
                            setSelectedOrderIds(orders.map((o: any) => o.id));
                          }
                        }}
                      />
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-[#8B95A1]">주문번호</th>
                    <th className="px-3 py-2 text-xs font-medium text-[#8B95A1]">거래처</th>
                    <th className="px-3 py-2 text-xs font-medium text-[#8B95A1]">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-[#8B95A1]">
                        확정된 출고주문이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o: any) => (
                      <tr
                        key={o.id}
                        className={cn(
                          "cursor-pointer border-b border-[#F2F4F6]",
                          selectedOrderIds.includes(o.id)
                            ? "bg-[#E8F2FF]"
                            : "hover:bg-[#F7F8FA]"
                        )}
                        onClick={() => toggleOrderSelect(o.id)}
                      >
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedOrderIds.includes(o.id)}
                            onChange={() => toggleOrderSelect(o.id)}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-[#191F28]">
                          {o.orderNumber}
                        </td>
                        <td className="px-3 py-2 text-sm text-[#4E5968]">
                          {o.partner?.name ?? "-"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge status={o.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
            >
              취소
            </button>
            <button
              onClick={handleCreateDispatch}
              disabled={createDispatch.isPending}
              className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
            >
              {createDispatch.isPending ? "처리중..." : "배차생성"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
