"use client";

import { useState, useMemo } from "react";
import { Search, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToastStore } from "@/stores/toast.store";

interface ProductRow {
  id: string;
  productGroup: string;
  itemCode: string;
  itemName: string;
  currentStock: number;
  expiryDate: string;
  orderQty: number;
  defectQty: number;
  uom: string;
  unitPrice: number;
  warehouse: string;
}

const ITEMS_PER_PAGE = 10;

export default function SimpleOutboundTab() {
  const addToast = useToastStore((s) => s.addToast);

  // Search fields
  const [shipperCode, setShipperCode] = useState("");
  const [shipperName, setShipperName] = useState("");
  const [requestDate, setRequestDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderType, setOrderType] = useState("normal");
  const [productGroup, setProductGroup] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [warehouseName, setWarehouseName] = useState("");

  // Grid data
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return products.slice(start, start + ITEMS_PER_PAGE);
  }, [products, currentPage]);

  const handleShipperSearch = () => {
    addToast({ type: "info", message: "화주 검색 팝업은 추후 구현 예정입니다." });
  };

  const handleWarehouseSearch = () => {
    addToast({ type: "info", message: "창고 검색 팝업은 추후 구현 예정입니다." });
  };

  const handleReset = () => {
    setShipperCode("");
    setShipperName("");
    setRequestDate(new Date().toISOString().split("T")[0]);
    setPaymentStatus("");
    setOrderType("normal");
    setProductGroup("");
    setWarehouseCode("");
    setWarehouseName("");
    setProducts([]);
    setCurrentPage(1);
  };

  const handleSave = () => {
    if (!shipperCode) {
      addToast({ type: "warning", message: "화주를 선택해주세요." });
      return;
    }

    const orderedItems = products.filter((p) => p.orderQty > 0);
    if (orderedItems.length === 0) {
      addToast({ type: "warning", message: "주문수량이 입력된 상품이 없습니다." });
      return;
    }

    addToast({ type: "success", message: "간편출고주문이 저장되었습니다." });
  };

  const handleQtyChange = (id: string, value: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, orderQty: value } : p))
    );
  };

  const handleDefectQtyChange = (id: string, value: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, defectQty: value } : p))
    );
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Search area */}
      <div className="rounded-xl border border-[#E5E8EB] bg-[#F7F8FA] p-4">
        {/* Row 1 */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <label className="text-sm font-medium text-[#4E5968]">
              화주 <span className="text-[#F04452]">*</span>
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={shipperCode}
                onChange={(e) => setShipperCode(e.target.value)}
                placeholder="화주코드"
                className="w-28 rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
              />
              <input
                type="text"
                value={shipperName}
                readOnly
                placeholder="화주명"
                className="flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none ring-1 ring-[#E5E8EB]"
              />
              <button
                type="button"
                onClick={handleShipperSearch}
                className="rounded-lg bg-white p-2 text-[#8B95A1] ring-1 ring-[#E5E8EB] transition-colors hover:bg-[#F2F4F6] hover:text-[#4E5968]"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="w-44">
            <label className="text-sm font-medium text-[#4E5968]">출고요청일</label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="mt-1 w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
            />
          </div>

          <div className="w-40">
            <label className="text-sm font-medium text-[#4E5968]">대금결제여부</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="mt-1 w-full appearance-none rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
            >
              <option value="">전체</option>
              <option value="paid">결제완료</option>
              <option value="unpaid">미결제</option>
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="w-40">
            <label className="text-sm font-medium text-[#4E5968]">주문구분</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="mt-1 w-full appearance-none rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
            >
              <option value="normal">정상출고</option>
              <option value="return">반품출고</option>
              <option value="transfer">이관출고</option>
            </select>
          </div>

          <div className="w-40">
            <label className="text-sm font-medium text-[#4E5968]">상품군</label>
            <select
              value={productGroup}
              onChange={(e) => setProductGroup(e.target.value)}
              className="mt-1 w-full appearance-none rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
            >
              <option value="">전체</option>
              <option value="general">일반</option>
              <option value="food">식품</option>
              <option value="electronics">전자</option>
            </select>
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="text-sm font-medium text-[#4E5968]">창고</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={warehouseCode}
                onChange={(e) => setWarehouseCode(e.target.value)}
                placeholder="창고코드"
                className="w-28 rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
              />
              <input
                type="text"
                value={warehouseName}
                readOnly
                placeholder="창고명"
                className="flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none ring-1 ring-[#E5E8EB]"
              />
              <button
                type="button"
                onClick={handleWarehouseSearch}
                className="rounded-lg bg-white p-2 text-[#8B95A1] ring-1 ring-[#E5E8EB] transition-colors hover:bg-[#F2F4F6] hover:text-[#4E5968]"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={handleSave}>
              저장
            </Button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg p-2 text-[#8B95A1] transition-colors hover:bg-[#E5E8EB] hover:text-[#4E5968]"
              title="초기화"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#191F28]">상품목록</h3>
          <span className="text-xs text-[#8B95A1]">
            총 {products.length}건
          </span>
        </div>

        <div className="overflow-auto rounded-xl border border-[#E5E8EB]">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">상품군</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">상품코드</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">상품명</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-[#8B95A1]">현재고</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">유통기한</th>
                <th className="w-28 px-3 py-3 text-center text-xs font-semibold text-[#8B95A1]">주문수량</th>
                <th className="w-24 px-3 py-3 text-center text-xs font-semibold text-[#8B95A1]">불량품</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">UOM</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-[#8B95A1]">단가</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#8B95A1]">창고</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-[#8B95A1]">
                    화주를 선택하면 상품목록이 표시됩니다.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-t border-[#F2F4F6] transition-colors ${
                      product.orderQty > 0 ? "bg-[#E8F3FF]/40" : "hover:bg-[#F7F8FA]"
                    }`}
                  >
                    <td className="px-3 py-2 text-sm text-[#4E5968]">{product.productGroup}</td>
                    <td className="px-3 py-2 text-sm font-medium text-[#191F28]">{product.itemCode}</td>
                    <td className="px-3 py-2 text-sm text-[#191F28]">{product.itemName}</td>
                    <td className="px-3 py-2 text-right text-sm text-[#191F28]">
                      {product.currentStock.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-sm text-[#8B95A1]">{product.expiryDate}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={product.orderQty || ""}
                        placeholder="0"
                        onChange={(e) =>
                          handleQtyChange(
                            product.id,
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border-0 bg-white px-2 py-1.5 text-center text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={product.defectQty || ""}
                        placeholder="0"
                        onChange={(e) =>
                          handleDefectQtyChange(
                            product.id,
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border-0 bg-white px-2 py-1.5 text-center text-sm text-[#191F28] outline-none ring-1 ring-[#E5E8EB] focus:ring-2 focus:ring-[#3182F6]"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-[#8B95A1]">{product.uom}</td>
                    <td className="px-3 py-2 text-right text-sm text-[#191F28]">
                      {product.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-sm text-[#4E5968]">{product.warehouse}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {products.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8B95A1] transition-colors hover:bg-[#F2F4F6] disabled:opacity-30"
            >
              &laquo;
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8B95A1] transition-colors hover:bg-[#F2F4F6] disabled:opacity-30"
            >
              &lsaquo;
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  currentPage === page
                    ? "bg-[#3182F6] text-white"
                    : "text-[#8B95A1] hover:bg-[#F2F4F6]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8B95A1] transition-colors hover:bg-[#F2F4F6] disabled:opacity-30"
            >
              &rsaquo;
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8B95A1] transition-colors hover:bg-[#F2F4F6] disabled:opacity-30"
            >
              &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
