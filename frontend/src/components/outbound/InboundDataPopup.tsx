"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useInboundOrders } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";
import type { InboundOrder, InboundOrderLine } from "@/types";

export interface SelectedInboundItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  partnerId: string;
  partnerName: string;
  warehouseId: string;
  warehouseName: string;
}

interface InboundDataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: SelectedInboundItem[]) => void;
}

interface FlatRow {
  orderId: string;
  orderNumber: string;
  partnerName: string;
  partnerId: string;
  warehouseName: string;
  warehouseId: string;
  completedDate: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  receivedQty: number;
  uom: string;
  rowKey: string;
}

export default function InboundDataPopup({
  isOpen,
  onClose,
  onSelect,
}: InboundDataPopupProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const { data: inboundData, isLoading } = useInboundOrders({
    status: "COMPLETED",
    limit: 50,
  });

  const orders: InboundOrder[] = inboundData?.data ?? [];

  // Flatten orders into one row per item line
  const flatRows: FlatRow[] = useMemo(() => {
    const rows: FlatRow[] = [];
    for (const order of orders) {
      const orderLines = order.items ?? order.lines ?? [];
      for (const line of orderLines) {
        rows.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          partnerName: order.partner?.name ?? "-",
          partnerId: order.partnerId,
          warehouseName: order.warehouse?.name ?? "-",
          warehouseId: order.warehouseId,
          completedDate: order.completedDate ?? order.arrivedDate ?? "",
          itemId: line.itemId,
          itemCode: line.item?.code ?? "-",
          itemName: line.item?.name ?? "-",
          receivedQty: line.receivedQty,
          uom: line.item?.uom ?? "EA",
          rowKey: `${order.id}_${line.id}`,
        });
      }
    }
    return rows;
  }, [orders]);

  // Filter by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return flatRows;
    const term = searchTerm.toLowerCase();
    return flatRows.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(term) ||
        r.partnerName.toLowerCase().includes(term) ||
        r.warehouseName.toLowerCase().includes(term) ||
        r.itemCode.toLowerCase().includes(term) ||
        r.itemName.toLowerCase().includes(term)
    );
  }, [flatRows, searchTerm]);

  const toggleRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedKeys.size === filteredRows.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredRows.map((r) => r.rowKey)));
    }
  };

  const handleSelect = () => {
    const selected: SelectedInboundItem[] = flatRows
      .filter((r) => selectedKeys.has(r.rowKey))
      .map((r) => ({
        itemId: r.itemId,
        itemCode: r.itemCode,
        itemName: r.itemName,
        quantity: r.receivedQty,
        uom: r.uom,
        partnerId: r.partnerId,
        partnerName: r.partnerName,
        warehouseId: r.warehouseId,
        warehouseName: r.warehouseName,
      }));
    onSelect(selected);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedKeys(new Set());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="입고내역 조회"
      size="xl"
      className="max-w-5xl"
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B8C1]" />
        <input
          type="text"
          placeholder="주문번호, 화주, 창고, 상품코드, 상품명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 pl-10 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20"
        />
      </div>

      {/* Table */}
      <div className="max-h-96 overflow-auto rounded-xl border border-[#E5E8EB]">
        <table className="w-full min-w-[800px]">
          <thead className="sticky top-0 bg-[#4A5568]">
            <tr>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-white whitespace-nowrap w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredRows.length > 0 &&
                    selectedKeys.size === filteredRows.length
                  }
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap">
                주문번호
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap">
                화주
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap">
                창고
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap">
                입고일자
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap">
                상품코드
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-white whitespace-nowrap">
                상품명
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-white whitespace-nowrap">
                입고수량
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-[#8B95A1]"
                >
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-[#8B95A1]"
                >
                  {searchTerm
                    ? "검색 결과가 없습니다"
                    : "완료된 입고내역이 없습니다"}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isSelected = selectedKeys.has(row.rowKey);
                return (
                  <tr
                    key={row.rowKey}
                    onClick={() => toggleRow(row.rowKey)}
                    className={`cursor-pointer border-b border-[#F2F4F6] transition-colors ${
                      isSelected
                        ? "bg-[#FFF8E1]"
                        : "hover:bg-[#F7F8FA]"
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(row.rowKey)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-[#3182F6]">
                      {row.orderNumber}
                    </td>
                    <td className="px-3 py-2 text-sm text-[#191F28]">
                      {row.partnerName}
                    </td>
                    <td className="px-3 py-2 text-sm text-[#191F28]">
                      {row.warehouseName}
                    </td>
                    <td className="px-3 py-2 text-sm text-[#4E5968]">
                      {formatDate(row.completedDate)}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-[#4E5968]">
                      {row.itemCode}
                    </td>
                    <td className="px-3 py-2 text-sm text-[#191F28]">
                      {row.itemName}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-[#191F28]">
                      {row.receivedQty.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-[#8B95A1]">
          {selectedKeys.size > 0
            ? `${selectedKeys.size}건 선택됨`
            : `총 ${filteredRows.length}건`}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSelect}
            disabled={selectedKeys.size === 0}
          >
            선택
          </Button>
        </div>
      </div>
    </Modal>
  );
}
