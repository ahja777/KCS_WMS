"use client";

import { useState, useCallback } from "react";
import {
  Globe,
  Wifi,
  WifiOff,
  ShoppingCart,
  Package,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import api from "@/lib/api";

type Platform = "dummyjson" | "fakestore" | "platzi";

interface PlatformInfo {
  id: Platform;
  name: string;
  baseUrl: string;
  features: string[];
  color: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: "dummyjson",
    name: "DummyJSON",
    baseUrl: "https://dummyjson.com",
    features: ["상품(194)", "주문(50)", "재고(stock)", "SKU", "인증(JWT)"],
    color: "#3182F6",
  },
  {
    id: "fakestore",
    name: "FakeStore",
    baseUrl: "https://fakestoreapi.com",
    features: ["상품(20)", "주문(7)", "카테고리(4)"],
    color: "#F97316",
  },
  {
    id: "platzi",
    name: "Platzi Store",
    baseUrl: "https://api.escuelajs.co/api/v1",
    features: ["상품(동적)", "실제CRUD", "카테고리(5)"],
    color: "#8B5CF6",
  },
];

// ─── 공통 스타일 ───
const card = "rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]";
const btnBase =
  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all";
const btnPrimary = `${btnBase} bg-[#3182F6] text-white hover:bg-[#1B6AE5] active:scale-[0.97]`;
const btnSecondary = `${btnBase} bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]`;
const badge =
  "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium";

export default function EcommerceTestPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>("dummyjson");
  const [pingResults, setPingResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [authResult, setAuthResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "connection" | "products" | "orders" | "sync" | "auth"
  >("connection");
  const [logs, setLogs] = useState<
    Array<{ time: string; type: string; message: string; status: "ok" | "error" | "info" }>
  >([]);

  const addLog = useCallback(
    (type: string, message: string, status: "ok" | "error" | "info" = "info") => {
      setLogs((prev) => [
        { time: new Date().toLocaleTimeString("ko-KR"), type, message, status },
        ...prev.slice(0, 99),
      ]);
    },
    [],
  );

  const setLoadingKey = (key: string, val: boolean) =>
    setLoading((p) => ({ ...p, [key]: val }));

  // ─── 연결 테스트 ───
  const testConnection = async (platform: Platform) => {
    setLoadingKey(`ping-${platform}`, true);
    try {
      const { data: w } = await api.get(`/ecommerce-test/ping/${platform}`);
      const result = w.data || w;
      setPingResults((p) => ({ ...p, [platform]: result }));
      addLog(
        "PING",
        `${platform} → ${result.success ? `OK (${result.latencyMs}ms)` : `FAIL: ${result.error}`}`,
        result.success ? "ok" : "error",
      );
    } catch (err: any) {
      setPingResults((p) => ({
        ...p,
        [platform]: { success: false, error: err.message },
      }));
      addLog("PING", `${platform} → FAIL: ${err.message}`, "error");
    }
    setLoadingKey(`ping-${platform}`, false);
  };

  const testAllConnections = async () => {
    for (const p of PLATFORMS) await testConnection(p.id);
  };

  // ─── 상품 조회 ───
  const fetchProducts = async () => {
    setLoadingKey("products", true);
    try {
      const search = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const { data: w } = await api.get(
        `/ecommerce-test/${activePlatform}/products?limit=20${search}`,
      );
      const result = w.data || w;
      setProducts(result.products || []);
      addLog("GET", `${activePlatform} 상품 ${(result.products || []).length}건 조회`, "ok");
    } catch (err: any) {
      addLog("GET", `상품 조회 실패: ${err.message}`, "error");
    }
    setLoadingKey("products", false);
  };

  // ─── 주문 조회 ───
  const fetchOrders = async () => {
    setLoadingKey("orders", true);
    try {
      const { data: w } = await api.get(
        `/ecommerce-test/${activePlatform}/orders?limit=20`,
      );
      const result = w.data || w;
      setOrders(result.orders || []);
      addLog("GET", `${activePlatform} 주문 ${(result.orders || []).length}건 조회`, "ok");
    } catch (err: any) {
      addLog("GET", `주문 조회 실패: ${err.message}`, "error");
    }
    setLoadingKey("orders", false);
  };

  // ─── 동기화 시뮬레이션 ───
  const pullProducts = async () => {
    setLoadingKey("sync", true);
    try {
      const { data: w } = await api.post(
        `/ecommerce-test/sync/pull-products/${activePlatform}?limit=10`,
      );
      const result = w.data || w;
      setSyncResult(result);
      addLog(
        "SYNC",
        `상품 Pull: ${result.pulledCount}건 (${activePlatform} → WMS)`,
        "ok",
      );
    } catch (err: any) {
      addLog("SYNC", `상품 Pull 실패: ${err.message}`, "error");
    }
    setLoadingKey("sync", false);
  };

  const pullOrders = async () => {
    setLoadingKey("sync", true);
    try {
      const { data: w } = await api.post(
        `/ecommerce-test/sync/pull-orders/${activePlatform}?limit=10`,
      );
      const result = w.data || w;
      setSyncResult(result);
      addLog(
        "SYNC",
        `주문 Pull: ${result.pulledCount}건 (${activePlatform} → WMS)`,
        "ok",
      );
    } catch (err: any) {
      addLog("SYNC", `주문 Pull 실패: ${err.message}`, "error");
    }
    setLoadingKey("sync", false);
  };

  const pushStock = async () => {
    setLoadingKey("sync", true);
    try {
      const { data: w } = await api.post(
        `/ecommerce-test/sync/push-stock/${activePlatform}`,
        {
          items: [
            { externalId: 1, stock: 150 },
            { externalId: 2, stock: 200 },
            { externalId: 3, stock: 75 },
          ],
        },
      );
      const result = w.data || w;
      setSyncResult(result);
      addLog(
        "SYNC",
        `재고 Push: ${result.pushedCount}건 성공 (WMS → ${activePlatform})`,
        "ok",
      );
    } catch (err: any) {
      addLog("SYNC", `재고 Push 실패: ${err.message}`, "error");
    }
    setLoadingKey("sync", false);
  };

  // ─── 인증 테스트 ───
  const testAuth = async () => {
    setLoadingKey("auth", true);
    try {
      const { data: w } = await api.post("/ecommerce-test/dummyjson/auth");
      const result = w.data || w;
      setAuthResult(result);
      addLog("AUTH", `DummyJSON 인증 성공: ${result.user?.username}`, "ok");
    } catch (err: any) {
      addLog("AUTH", `인증 실패: ${err.message}`, "error");
    }
    setLoadingKey("auth", false);
  };

  const tabs = [
    { key: "connection" as const, label: "연결 테스트", icon: Wifi },
    { key: "products" as const, label: "상품 조회", icon: Package },
    { key: "orders" as const, label: "주문 조회", icon: ShoppingCart },
    { key: "sync" as const, label: "동기화", icon: RefreshCw },
    { key: "auth" as const, label: "인증", icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-[#191F28]">
          외부 이커머스 API 테스트
        </h1>
        <p className="mt-1 text-sm text-[#8B95A1]">
          DummyJSON · FakeStore · Platzi 무료 API 연동 테스트
        </p>
      </div>

      {/* 플랫폼 선택 */}
      <div className="flex gap-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setActivePlatform(p.id);
              setProducts([]);
              setOrders([]);
              setSyncResult(null);
            }}
            className={`${card} flex-1 cursor-pointer border-2 transition-all ${
              activePlatform === p.id
                ? "border-[#3182F6] ring-2 ring-[#3182F6]/20"
                : "border-transparent hover:border-[#E5E8EB]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: p.color }}
              >
                {p.name.slice(0, 2)}
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#191F28]">{p.name}</div>
                <div className="text-xs text-[#8B95A1]">{p.baseUrl}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.features.map((f) => (
                <span
                  key={f}
                  className={`${badge} bg-[#F2F4F6] text-[#6B7684]`}
                >
                  {f}
                </span>
              ))}
            </div>
            {pingResults[p.id] && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {pingResults[p.id].success ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-green-600">
                      연결됨 ({pingResults[p.id].latencyMs}ms)
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-red-600">연결 실패</span>
                  </>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-white text-[#191F28] shadow-sm"
                : "text-[#8B95A1] hover:text-[#4E5968]"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 좌측: 메인 패널 (2/3) */}
        <div className="col-span-2 space-y-4">
          {/* 연결 테스트 */}
          {activeTab === "connection" && (
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#191F28]">
                  연결 테스트
                </h2>
                <button onClick={testAllConnections} className={btnPrimary}>
                  <Wifi className="h-4 w-4" /> 전체 테스트
                </button>
              </div>
              <div className="space-y-3">
                {PLATFORMS.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-[#F7F8FA] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: pingResults[p.id]?.success
                            ? "#22C55E"
                            : pingResults[p.id]
                              ? "#EF4444"
                              : "#D1D5DB",
                        }}
                      />
                      <div>
                        <span className="font-semibold text-[#191F28]">
                          {p.name}
                        </span>
                        <span className="ml-2 text-xs text-[#8B95A1]">
                          {p.baseUrl}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {pingResults[p.id] && (
                        <span className="text-xs text-[#6B7684]">
                          {pingResults[p.id].success
                            ? `${pingResults[p.id].latencyMs}ms`
                            : pingResults[p.id].error}
                        </span>
                      )}
                      <button
                        onClick={() => testConnection(p.id)}
                        disabled={loading[`ping-${p.id}`]}
                        className={btnSecondary}
                      >
                        {loading[`ping-${p.id}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wifi className="h-4 w-4" />
                        )}
                        테스트
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 상품 조회 */}
          {activeTab === "products" && (
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#191F28]">
                  상품 조회 ({activePlatform})
                </h2>
                <div className="flex items-center gap-2">
                  {activePlatform === "dummyjson" && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B8C1]" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                        placeholder="상품 검색..."
                        className="rounded-xl bg-[#F2F4F6] py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
                      />
                    </div>
                  )}
                  <button
                    onClick={fetchProducts}
                    disabled={loading.products}
                    className={btnPrimary}
                  >
                    {loading.products ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                    조회
                  </button>
                </div>
              </div>
              {products.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {products.map((p: any) => (
                    <div
                      key={p.id}
                      className="rounded-xl bg-[#F7F8FA] p-3 cursor-pointer hover:bg-[#F2F4F6] transition-all"
                      onClick={() =>
                        setExpandedProduct(expandedProduct === p.id ? null : p.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(p.thumbnail || p.image) && (
                            <img
                              src={p.thumbnail || p.image}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-sm text-[#191F28]">
                              {p.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#8B95A1]">
                              <span>{p.category}</span>
                              {p.sku && <span>SKU: {p.sku}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-bold text-[#3182F6]">
                            ${p.price}
                          </span>
                          {p.stock !== null && p.stock !== undefined && (
                            <span
                              className={`${badge} ${
                                p.stock > 50
                                  ? "bg-green-100 text-green-700"
                                  : p.stock > 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              재고: {p.stock}
                            </span>
                          )}
                          {expandedProduct === p.id ? (
                            <ChevronDown className="h-4 w-4 text-[#B0B8C1]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[#B0B8C1]" />
                          )}
                        </div>
                      </div>
                      {expandedProduct === p.id && (
                        <div className="mt-3 rounded-lg bg-white p-3 text-xs">
                          <pre className="whitespace-pre-wrap text-[#4E5968] max-h-40 overflow-y-auto">
                            {JSON.stringify(p, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[#B0B8C1]">
                  &ldquo;조회&rdquo; 버튼을 클릭하여 상품을 불러오세요
                </div>
              )}
            </div>
          )}

          {/* 주문 조회 */}
          {activeTab === "orders" && (
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#191F28]">
                  주문 조회 ({activePlatform})
                </h2>
                <button
                  onClick={fetchOrders}
                  disabled={loading.orders}
                  className={btnPrimary}
                >
                  {loading.orders ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  조회
                </button>
              </div>
              {orders.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {orders.map((o: any) => (
                    <div
                      key={o.id}
                      className="rounded-xl bg-[#F7F8FA] p-3 cursor-pointer hover:bg-[#F2F4F6] transition-all"
                      onClick={() =>
                        setExpandedOrder(expandedOrder === o.id ? null : o.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm text-[#191F28]">
                            주문 #{o.id}
                          </span>
                          <span className="ml-2 text-xs text-[#8B95A1]">
                            {o.customerName || `User #${o.userId}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {o.total && (
                            <span className="font-bold text-[#3182F6]">
                              ${o.total?.toFixed(2)}
                            </span>
                          )}
                          <span className={`${badge} bg-[#E8F3FF] text-[#3182F6]`}>
                            {o.totalProducts || o.products?.length || 0}개 상품
                          </span>
                        </div>
                      </div>
                      {expandedOrder === o.id && (
                        <div className="mt-3 rounded-lg bg-white p-3 text-xs">
                          <pre className="whitespace-pre-wrap text-[#4E5968] max-h-40 overflow-y-auto">
                            {JSON.stringify(o, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[#B0B8C1]">
                  &ldquo;조회&rdquo; 버튼을 클릭하여 주문을 불러오세요
                </div>
              )}
            </div>
          )}

          {/* 동기화 */}
          {activeTab === "sync" && (
            <div className={card}>
              <h2 className="text-lg font-bold text-[#191F28] mb-4">
                WMS 동기화 시뮬레이션 ({activePlatform})
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={pullProducts}
                  disabled={loading.sync}
                  className={`${card} cursor-pointer border border-[#E5E8EB] hover:border-[#3182F6] transition-all text-center`}
                >
                  <ArrowDownToLine className="mx-auto h-8 w-8 text-[#3182F6] mb-2" />
                  <div className="font-semibold text-sm text-[#191F28]">
                    상품 Pull
                  </div>
                  <div className="text-xs text-[#8B95A1] mt-1">
                    외부 → WMS
                  </div>
                </button>
                <button
                  onClick={pullOrders}
                  disabled={loading.sync}
                  className={`${card} cursor-pointer border border-[#E5E8EB] hover:border-[#3182F6] transition-all text-center`}
                >
                  <ArrowDownToLine className="mx-auto h-8 w-8 text-[#22C55E] mb-2" />
                  <div className="font-semibold text-sm text-[#191F28]">
                    주문 Pull
                  </div>
                  <div className="text-xs text-[#8B95A1] mt-1">
                    외부 → WMS
                  </div>
                </button>
                <button
                  onClick={pushStock}
                  disabled={loading.sync}
                  className={`${card} cursor-pointer border border-[#E5E8EB] hover:border-[#3182F6] transition-all text-center`}
                >
                  <ArrowUpFromLine className="mx-auto h-8 w-8 text-[#F97316] mb-2" />
                  <div className="font-semibold text-sm text-[#191F28]">
                    재고 Push
                  </div>
                  <div className="text-xs text-[#8B95A1] mt-1">
                    WMS → 외부
                  </div>
                </button>
              </div>
              {loading.sync && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3182F6]" />
                  <span className="ml-2 text-sm text-[#8B95A1]">
                    동기화 중...
                  </span>
                </div>
              )}
              {syncResult && !loading.sync && (
                <div className="rounded-xl bg-[#F7F8FA] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-sm text-[#191F28]">
                      동기화 완료
                    </span>
                    <span className="text-xs text-[#8B95A1]">
                      {syncResult.syncedAt}
                    </span>
                  </div>
                  <div className="text-xs max-h-[350px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-[#4E5968]">
                      {JSON.stringify(syncResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 인증 */}
          {activeTab === "auth" && (
            <div className={card}>
              <h2 className="text-lg font-bold text-[#191F28] mb-4">
                JWT 인증 테스트 (DummyJSON)
              </h2>
              <div className="rounded-xl bg-[#F7F8FA] p-4 mb-4">
                <div className="text-sm text-[#4E5968]">
                  <p className="font-medium mb-2">테스트 계정:</p>
                  <code className="rounded bg-[#E5E8EB] px-2 py-1 text-xs">
                    username: emilys / password: emilyspass
                  </code>
                </div>
              </div>
              <button
                onClick={testAuth}
                disabled={loading.auth}
                className={btnPrimary}
              >
                {loading.auth ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                인증 테스트
              </button>
              {authResult && (
                <div className="mt-4 rounded-xl bg-[#F7F8FA] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-sm">인증 성공</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#8B95A1]">사용자:</span>{" "}
                      <span className="font-medium">
                        {authResult.user?.firstName} {authResult.user?.lastName} (
                        {authResult.user?.email})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8B95A1]">Access Token:</span>
                      <code className="ml-1 block mt-1 rounded bg-[#E5E8EB] p-2 text-[10px] break-all">
                        {authResult.accessToken?.slice(0, 80)}...
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우측: 로그 패널 (1/3) */}
        <div className={`${card} col-span-1`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[#191F28]">API 로그</h3>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-[#8B95A1] hover:text-[#4E5968]"
            >
              초기화
            </button>
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#B0B8C1]">
                API 호출 로그가 여기에 표시됩니다
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-[#F7F8FA] px-3 py-2"
                >
                  {log.status === "ok" ? (
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  ) : log.status === "error" ? (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  ) : (
                    <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3182F6]" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`${badge} bg-[#E5E8EB] text-[#4E5968]`}>
                        {log.type}
                      </span>
                      <span className="text-[10px] text-[#B0B8C1]">
                        {log.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#4E5968] break-all">
                      {log.message}
                    </p>
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
