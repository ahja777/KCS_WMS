"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Truck,
  Search,
  RotateCcw,
  Plus,
  X,
  ChevronDown,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { useInboundOrders, useOutboundOrders } from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import Badge from "@/components/ui/Badge";
import type { InboundOrder, OutboundOrder } from "@/types";

// ===== Types =====

interface DispatchVehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  sequence: number;
  orders: DispatchOrderItem[];
  createdAt: string;
}

interface DispatchOrderItem {
  orderId: string;
  orderNumber: string;
  type: "INBOUND" | "OUTBOUND";
  partnerName: string;
  status: string;
  expectedDate: string;
  itemCount: number;
  totalQty: number;
}

// ===== Helper: convert order to dispatch item =====

function inboundToDispatchItem(order: InboundOrder): DispatchOrderItem {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "INBOUND",
    partnerName: order.partner?.name || "-",
    status: order.status,
    expectedDate: order.expectedDate,
    itemCount: order.lines?.length || 0,
    totalQty: order.lines?.reduce((sum, l) => sum + l.expectedQty, 0) || 0,
  };
}

function outboundToDispatchItem(order: OutboundOrder): DispatchOrderItem {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    type: "OUTBOUND",
    partnerName: order.partner?.name || "-",
    status: order.status,
    expectedDate: order.shipDate || order.createdAt,
    itemCount: order.lines?.length || 0,
    totalQty: order.lines?.reduce((sum, l) => sum + l.orderedQty, 0) || 0,
  };
}

// ===== Main Page =====

export default function DispatchPage() {
  const addToast = useToastStore((s) => s.addToast);

  // Search conditions
  const today = new Date().toISOString().slice(0, 10);
  const [orderDate, setOrderDate] = useState(today);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [sequenceFilter, setSequenceFilter] = useState("");

  // Fetch confirmed inbound/outbound orders
  const { data: inboundData, isLoading: inboundLoading } = useInboundOrders({
    status: "CONFIRMED",
    limit: 100,
  });
  const { data: outboundData, isLoading: outboundLoading } = useOutboundOrders({
    status: "CONFIRMED",
    limit: 100,
  });

  // Local dispatch state
  const [dispatches, setDispatches] = useState<DispatchVehicle[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // New dispatch form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");

  // Track which orders are already dispatched
  const dispatchedOrderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of dispatches) {
      for (const o of d.orders) {
        ids.add(o.orderId);
      }
    }
    return ids;
  }, [dispatches]);

  // Available (unassigned) orders
  const availableOrders = useMemo(() => {
    const inboundItems = (inboundData?.data || []).map(inboundToDispatchItem);
    const outboundItems = (outboundData?.data || []).map(outboundToDispatchItem);
    const all = [...inboundItems, ...outboundItems];
    return all.filter((o) => !dispatchedOrderIds.has(o.orderId));
  }, [inboundData, outboundData, dispatchedOrderIds]);

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    let result = dispatches;
    if (vehicleFilter.trim()) {
      result = result.filter((d) =>
        d.vehicleNumber.toLowerCase().includes(vehicleFilter.toLowerCase())
      );
    }
    if (sequenceFilter.trim()) {
      result = result.filter((d) => d.sequence === Number(sequenceFilter));
    }
    return result;
  }, [dispatches, vehicleFilter, sequenceFilter]);

  // Toggle order selection
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  // Select all available orders
  const toggleSelectAll = useCallback(() => {
    if (selectedOrders.size === availableOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(availableOrders.map((o) => o.orderId)));
    }
  }, [selectedOrders.size, availableOrders]);

  // Register dispatch
  const handleRegisterDispatch = useCallback(() => {
    if (!newVehicleNumber.trim()) {
      addToast({ type: "error", message: "차량번호를 입력해주세요." });
      return;
    }
    if (!newDriverName.trim()) {
      addToast({ type: "error", message: "기사명을 입력해주세요." });
      return;
    }
    if (selectedOrders.size === 0) {
      addToast({ type: "error", message: "배차할 주문을 선택해주세요." });
      return;
    }

    const ordersToAssign = availableOrders.filter((o) =>
      selectedOrders.has(o.orderId)
    );

    const nextSequence =
      dispatches.length > 0
        ? Math.max(...dispatches.map((d) => d.sequence)) + 1
        : 1;

    const newDispatch: DispatchVehicle = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      vehicleNumber: newVehicleNumber.trim(),
      driverName: newDriverName.trim(),
      driverPhone: newDriverPhone.trim(),
      sequence: nextSequence,
      orders: ordersToAssign,
      createdAt: new Date().toISOString(),
    };

    setDispatches((prev) => [...prev, newDispatch]);
    setSelectedOrders(new Set());
    setNewVehicleNumber("");
    setNewDriverName("");
    setNewDriverPhone("");
    setShowNewForm(false);
    addToast({
      type: "success",
      message: `${ordersToAssign.length}건의 주문이 ${newVehicleNumber}에 배차되었습니다.`,
    });
  }, [
    newVehicleNumber,
    newDriverName,
    newDriverPhone,
    selectedOrders,
    availableOrders,
    dispatches,
    addToast,
  ]);

  // Remove dispatch
  const handleRemoveDispatch = useCallback(
    (dispatchId: string) => {
      setDispatches((prev) => prev.filter((d) => d.id !== dispatchId));
      addToast({ type: "info", message: "배차가 취소되었습니다." });
    },
    [addToast]
  );

  // Remove single order from dispatch
  const handleRemoveOrderFromDispatch = useCallback(
    (dispatchId: string, orderId: string) => {
      setDispatches((prev) =>
        prev
          .map((d) => {
            if (d.id !== dispatchId) return d;
            return {
              ...d,
              orders: d.orders.filter((o) => o.orderId !== orderId),
            };
          })
          .filter((d) => d.orders.length > 0)
      );
    },
    []
  );

  // Reset search
  const handleReset = useCallback(() => {
    setOrderDate(today);
    setVehicleFilter("");
    setSequenceFilter("");
  }, [today]);

  const isLoading = inboundLoading || outboundLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">배차 작업</h1>
          <p className="mt-1 text-sm text-[#8B95A1]">
            입고/출고 주문에 차량을 배정합니다 (WMSOP000Q1)
          </p>
        </div>
      </div>

      {/* Search Conditions */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          {/* 주문일자 */}
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              주문일자
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* 차량 */}
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              차량
            </label>
            <input
              type="text"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              placeholder="차량번호 검색"
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* 작업차수 */}
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-[#6B7684]">
              작업차수
            </label>
            <input
              type="number"
              value={sequenceFilter}
              onChange={(e) => setSequenceFilter(e.target.value)}
              placeholder="차수"
              min={1}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-sm font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
            >
              <RotateCcw className="h-4 w-4" />
              초기화
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1B64DA]">
              <Search className="h-4 w-4" />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left Panel: 입고/출고 주문 목록 */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#3182F6]" />
              <h2 className="text-lg font-bold text-[#191F28]">
                입고/출고 주문 목록
              </h2>
              <span className="rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#6B7684]">
                {availableOrders.length}건
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-xs font-medium text-[#3182F6] hover:text-[#1B64DA]"
              >
                {selectedOrders.size === availableOrders.length && availableOrders.length > 0
                  ? "전체 해제"
                  : "전체 선택"}
              </button>
              {selectedOrders.size > 0 && (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex items-center gap-1 rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1B64DA]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  배차 등록 ({selectedOrders.size})
                </button>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-hidden rounded-xl border border-[#F2F4F6]">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedOrders.size === availableOrders.length &&
                          availableOrders.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-[#B0B8C1] text-[#3182F6] focus:ring-[#3182F6]/20"
                      />
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-[#6B7684]">
                      구분
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-[#6B7684]">
                      주문번호
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-[#6B7684]">
                      파트너
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-[#6B7684]">
                      상태
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-[#6B7684]">
                      품목수
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-[#6B7684]">
                      수량
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-[#6B7684]">
                      예정일
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F4F6]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm text-[#8B95A1]">
                        주문 목록을 불러오는 중...
                      </td>
                    </tr>
                  ) : availableOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm text-[#8B95A1]">
                        배차 가능한 주문이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    availableOrders.map((order) => {
                      const isSelected = selectedOrders.has(order.orderId);
                      return (
                        <tr
                          key={order.orderId}
                          onClick={() => toggleOrderSelection(order.orderId)}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isSelected
                              ? "bg-[#E8F2FF]/50"
                              : "hover:bg-[#F7F8FA]"
                          )}
                        >
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleOrderSelection(order.orderId)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-[#B0B8C1] text-[#3182F6] focus:ring-[#3182F6]/20"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                order.type === "INBOUND"
                                  ? "bg-[#E8F7EF] text-[#1FC47D]"
                                  : "bg-[#FFEAED] text-[#F04452]"
                              )}
                            >
                              {order.type === "INBOUND" ? (
                                <ArrowDownToLine className="h-3 w-3" />
                              ) : (
                                <ArrowUpFromLine className="h-3 w-3" />
                              )}
                              {order.type === "INBOUND" ? "입고" : "출고"}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-medium text-[#191F28]">
                            {order.orderNumber}
                          </td>
                          <td className="px-3 py-3 text-[#4E5968]">
                            {order.partnerName}
                          </td>
                          <td className="px-3 py-3">
                            <Badge status={order.status} />
                          </td>
                          <td className="px-3 py-3 text-right text-[#4E5968]">
                            {formatNumber(order.itemCount)}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-[#191F28]">
                            {formatNumber(order.totalQty)}
                          </td>
                          <td className="px-3 py-3 text-[#8B95A1]">
                            {formatDate(order.expectedDate)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel: 배차 내역 */}
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#3182F6]" />
              <h2 className="text-lg font-bold text-[#191F28]">배차 내역</h2>
              <span className="rounded-full bg-[#F2F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#6B7684]">
                {filteredDispatches.length}건
              </span>
            </div>
          </div>

          {/* New Dispatch Form (inline modal) */}
          {showNewForm && (
            <div className="mb-5 rounded-xl border border-[#3182F6]/30 bg-[#E8F2FF]/30 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#191F28]">
                  배차 등록
                </h3>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="rounded-lg p-1 text-[#8B95A1] transition-colors hover:bg-[#F2F4F6] hover:text-[#4E5968]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B7684]">
                    차량번호 <span className="text-[#F04452]">*</span>
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B8C1]" />
                    <input
                      type="text"
                      value={newVehicleNumber}
                      onChange={(e) => setNewVehicleNumber(e.target.value)}
                      placeholder="예: 12가3456"
                      className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-10 pr-4 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B7684]">
                    기사명 <span className="text-[#F04452]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B8C1]" />
                    <input
                      type="text"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      placeholder="기사명"
                      className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-10 pr-4 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B7684]">
                    연락처
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B8C1]" />
                    <input
                      type="tel"
                      value={newDriverPhone}
                      onChange={(e) => setNewDriverPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-10 pr-4 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-[#8B95A1]">
                  선택된 주문: <span className="font-semibold text-[#3182F6]">{selectedOrders.size}건</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewForm(false)}
                    className="rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-sm font-medium text-[#4E5968] transition-colors hover:bg-[#F7F8FA]"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleRegisterDispatch}
                    className="flex items-center gap-1.5 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1B64DA]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    배차 등록
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dispatch List */}
          <div className="max-h-[540px] space-y-4 overflow-y-auto">
            {filteredDispatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#8B95A1]">
                <Truck className="mb-3 h-12 w-12 text-[#E5E8EB]" />
                <p className="text-sm">배차 내역이 없습니다.</p>
                <p className="mt-1 text-xs text-[#B0B8C1]">
                  좌측 주문을 선택하여 배차를 등록하세요.
                </p>
              </div>
            ) : (
              filteredDispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className="rounded-xl border border-[#F2F4F6] p-4 transition-shadow hover:shadow-md"
                >
                  {/* Dispatch Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF]">
                        <Truck className="h-5 w-5 text-[#3182F6]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#191F28]">
                            {dispatch.vehicleNumber}
                          </span>
                          <span className="rounded-full bg-[#3182F6] px-2 py-0.5 text-[10px] font-bold text-white">
                            {dispatch.sequence}차
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-[#8B95A1]">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {dispatch.driverName}
                          </span>
                          {dispatch.driverPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {dispatch.driverPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDispatch(dispatch.id)}
                      className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-[#FFEAED] hover:text-[#F04452]"
                      title="배차 취소"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Assigned Orders */}
                  <div className="space-y-2">
                    {dispatch.orders.map((order) => (
                      <div
                        key={order.orderId}
                        className="flex items-center justify-between rounded-lg bg-[#F7F8FA] px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold",
                              order.type === "INBOUND"
                                ? "bg-[#E8F7EF] text-[#1FC47D]"
                                : "bg-[#FFEAED] text-[#F04452]"
                            )}
                          >
                            {order.type === "INBOUND" ? (
                              <ArrowDownToLine className="h-2.5 w-2.5" />
                            ) : (
                              <ArrowUpFromLine className="h-2.5 w-2.5" />
                            )}
                            {order.type === "INBOUND" ? "입고" : "출고"}
                          </span>
                          <span className="text-sm font-medium text-[#191F28]">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-[#8B95A1]">
                            {order.partnerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B7684]">
                            {formatNumber(order.totalQty)}개
                          </span>
                          <button
                            onClick={() =>
                              handleRemoveOrderFromDispatch(
                                dispatch.id,
                                order.orderId
                              )
                            }
                            className="rounded p-0.5 text-[#B0B8C1] transition-colors hover:text-[#F04452]"
                            title="주문 제거"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-3 flex items-center justify-between border-t border-[#F2F4F6] pt-3">
                    <span className="text-xs text-[#8B95A1]">
                      {formatDate(dispatch.createdAt, "yyyy-MM-dd HH:mm")} 등록
                    </span>
                    <span className="text-xs font-semibold text-[#4E5968]">
                      총 {dispatch.orders.length}건 /{" "}
                      {formatNumber(
                        dispatch.orders.reduce((s, o) => s + o.totalQty, 0)
                      )}
                      개
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
