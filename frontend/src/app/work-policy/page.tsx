"use client";

import { useState, useCallback } from "react";

// --- Types ---
type PolicyStatus = "mandatory" | "optional" | "excluded" | "offline";

interface FlowNode {
  id: string;
  label: string;
  subLabel?: string;
  status: PolicyStatus;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

type TabKey = "inbound" | "outbound" | "dispatch" | "inventory" | "settlement";

// --- Constants ---
const STATUS_CYCLE: PolicyStatus[] = ["mandatory", "optional", "excluded", "offline"];

const STATUS_STYLES: Record<PolicyStatus, { bg: string; border: string; text: string; label: string }> = {
  mandatory: { bg: "bg-[#E8F5E9]", border: "border-green-400", text: "text-green-800", label: "필수작업" },
  optional:  { bg: "bg-[#FFF8E1]", border: "border-yellow-400", text: "text-yellow-800", label: "선택항목" },
  excluded:  { bg: "bg-[#F5F5F5]", border: "border-gray-300", text: "text-gray-500", label: "제외항목" },
  offline:   { bg: "bg-[#FCE4EC]", border: "border-pink-300", text: "text-pink-700", label: "오프라인작업" },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "inbound", label: "입고" },
  { key: "outbound", label: "출고" },
  { key: "dispatch", label: "배차" },
  { key: "inventory", label: "재고" },
  { key: "settlement", label: "정산" },
];

// --- Initial Flow Data ---
function createInboundNodes(): FlowNode[] {
  return [
    // Main flow - Row 1
    { id: "req", label: "입고요청등록", subLabel: "일반/크로스도킹", status: "mandatory", x: 60, y: 30, width: 160, height: 56 },
    // Row 2
    { id: "lot-input", label: "생산자Lot번호 입력", status: "optional", x: 60, y: 120, width: 160, height: 48 },
    { id: "mfg-date", label: "제조일자입력", status: "optional", x: 280, y: 120, width: 140, height: 48 },
    // Row 3
    { id: "approve", label: "입하승인", status: "mandatory", x: 60, y: 200, width: 160, height: 48 },
    // Row 4
    { id: "dispatch", label: "배차", status: "mandatory", x: 60, y: 280, width: 120, height: 48 },
    { id: "vehicle-arrive", label: "차량도착/확인", status: "optional", x: 240, y: 280, width: 140, height: 48 },
    // Row 5
    { id: "entry-confirm", label: "입차확인", status: "mandatory", x: 60, y: 360, width: 120, height: 48 },
    // Row 6
    { id: "work-order", label: "작업지시서(입하)", subLabel: "일반/크로스도킹", status: "mandatory", x: 60, y: 440, width: 170, height: 56 },
    { id: "pda-confirm", label: "[PDA]입고수량확정", status: "optional", x: 280, y: 440, width: 170, height: 48 },
    { id: "inspect", label: "입하작업(검수)", status: "mandatory", x: 500, y: 440, width: 150, height: 48 },
    // Row 7
    { id: "qc-confirm", label: "QC등급 확정", status: "optional", x: 60, y: 530, width: 140, height: 48 },
    // Row 8
    { id: "inbound-confirm", label: "입하확정", status: "mandatory", x: 60, y: 610, width: 140, height: 48 },

    // Side flow (right column) - PLT/적치 flow
    { id: "plt-input", label: "PLT(Box)수량 입력", status: "optional", x: 500, y: 30, width: 170, height: 48 },
    { id: "lot-issue", label: "Lot번호 발행", status: "optional", x: 500, y: 110, width: 150, height: 48 },
    { id: "loc-assign", label: "입고 로케이션 지정", status: "mandatory", x: 500, y: 190, width: 170, height: 48 },
    { id: "work-issue", label: "작업지시서 발행", status: "mandatory", x: 500, y: 270, width: 160, height: 48 },
    { id: "putaway", label: "적치작업수행", status: "offline", x: 500, y: 350, width: 150, height: 48 },
    { id: "putaway-confirm", label: "적치작업확정", status: "mandatory", x: 500, y: 530, width: 150, height: 48 },
    { id: "inbound-done", label: "입고완료", status: "mandatory", x: 500, y: 610, width: 140, height: 48 },

    // Cross-docking branch
    { id: "cross-dock", label: "크로스도킹", status: "optional", x: 280, y: 530, width: 140, height: 48 },
    { id: "dock-stage", label: "도크에야적", status: "optional", x: 280, y: 610, width: 140, height: 48 },
  ];
}

function createInboundConnections(): FlowConnection[] {
  return [
    // Main vertical flow
    { from: "req", to: "lot-input" },
    { from: "lot-input", to: "mfg-date" },
    { from: "lot-input", to: "approve" },
    { from: "approve", to: "dispatch" },
    { from: "dispatch", to: "vehicle-arrive", dashed: true },
    { from: "dispatch", to: "entry-confirm" },
    { from: "entry-confirm", to: "work-order" },
    { from: "work-order", to: "pda-confirm" },
    { from: "pda-confirm", to: "inspect" },
    { from: "work-order", to: "qc-confirm" },
    { from: "qc-confirm", to: "inbound-confirm" },

    // Side flow
    { from: "plt-input", to: "lot-issue" },
    { from: "lot-issue", to: "loc-assign" },
    { from: "loc-assign", to: "work-issue" },
    { from: "work-issue", to: "putaway" },
    { from: "putaway", to: "putaway-confirm" },
    { from: "putaway-confirm", to: "inbound-done" },

    // Cross connections
    { from: "inbound-confirm", to: "plt-input", label: "입하→적치", dashed: true },
    { from: "qc-confirm", to: "cross-dock", dashed: true },
    { from: "cross-dock", to: "dock-stage" },
  ];
}

function createOutboundNodes(): FlowNode[] {
  return [
    { id: "out-order", label: "출고오더등록", status: "mandatory", x: 60, y: 30, width: 160, height: 48 },
    { id: "out-alloc", label: "재고할당", status: "mandatory", x: 60, y: 110, width: 140, height: 48 },
    { id: "out-wave", label: "Wave생성", status: "optional", x: 260, y: 110, width: 140, height: 48 },
    { id: "out-pick-order", label: "피킹지시서 발행", status: "mandatory", x: 60, y: 190, width: 170, height: 48 },
    { id: "out-pick", label: "피킹작업수행", status: "offline", x: 60, y: 270, width: 150, height: 48 },
    { id: "out-pick-confirm", label: "피킹작업확정", status: "mandatory", x: 60, y: 350, width: 160, height: 48 },
    { id: "out-inspect", label: "출고검수", status: "optional", x: 60, y: 430, width: 140, height: 48 },
    { id: "out-pack", label: "포장작업", status: "optional", x: 260, y: 430, width: 140, height: 48 },
    { id: "out-confirm", label: "출고확정", status: "mandatory", x: 60, y: 510, width: 140, height: 48 },
    { id: "out-done", label: "출고완료", status: "mandatory", x: 60, y: 590, width: 140, height: 48 },
  ];
}

function createOutboundConnections(): FlowConnection[] {
  return [
    { from: "out-order", to: "out-alloc" },
    { from: "out-alloc", to: "out-wave", dashed: true },
    { from: "out-alloc", to: "out-pick-order" },
    { from: "out-pick-order", to: "out-pick" },
    { from: "out-pick", to: "out-pick-confirm" },
    { from: "out-pick-confirm", to: "out-inspect" },
    { from: "out-inspect", to: "out-pack", dashed: true },
    { from: "out-inspect", to: "out-confirm" },
    { from: "out-confirm", to: "out-done" },
  ];
}

function createDispatchNodes(): FlowNode[] {
  return [
    { id: "dsp-plan", label: "배차계획 등록", status: "mandatory", x: 60, y: 30, width: 160, height: 48 },
    { id: "dsp-vehicle", label: "차량배정", status: "mandatory", x: 60, y: 110, width: 140, height: 48 },
    { id: "dsp-route", label: "배송경로 설정", status: "optional", x: 260, y: 110, width: 160, height: 48 },
    { id: "dsp-order", label: "배차지시", status: "mandatory", x: 60, y: 190, width: 140, height: 48 },
    { id: "dsp-load", label: "상차작업", status: "offline", x: 60, y: 270, width: 140, height: 48 },
    { id: "dsp-depart", label: "출차확인", status: "mandatory", x: 60, y: 350, width: 140, height: 48 },
    { id: "dsp-delivery", label: "배송완료확인", status: "mandatory", x: 60, y: 430, width: 160, height: 48 },
    { id: "dsp-pod", label: "인수증 확인", status: "optional", x: 260, y: 430, width: 150, height: 48 },
  ];
}

function createDispatchConnections(): FlowConnection[] {
  return [
    { from: "dsp-plan", to: "dsp-vehicle" },
    { from: "dsp-vehicle", to: "dsp-route", dashed: true },
    { from: "dsp-vehicle", to: "dsp-order" },
    { from: "dsp-order", to: "dsp-load" },
    { from: "dsp-load", to: "dsp-depart" },
    { from: "dsp-depart", to: "dsp-delivery" },
    { from: "dsp-delivery", to: "dsp-pod", dashed: true },
  ];
}

function createInventoryNodes(): FlowNode[] {
  return [
    { id: "inv-check", label: "재고조회", status: "mandatory", x: 60, y: 30, width: 140, height: 48 },
    { id: "inv-cycle", label: "순환재고조사", status: "optional", x: 260, y: 30, width: 160, height: 48 },
    { id: "inv-adjust", label: "재고조정", status: "mandatory", x: 60, y: 110, width: 140, height: 48 },
    { id: "inv-transfer", label: "재고이동", status: "optional", x: 260, y: 110, width: 140, height: 48 },
    { id: "inv-lot", label: "LOT관리", status: "optional", x: 60, y: 190, width: 140, height: 48 },
    { id: "inv-expiry", label: "유효기간관리", status: "optional", x: 260, y: 190, width: 160, height: 48 },
    { id: "inv-grade", label: "등급관리", status: "optional", x: 60, y: 270, width: 140, height: 48 },
    { id: "inv-assembly", label: "임가공(조립)", status: "optional", x: 260, y: 270, width: 160, height: 48 },
  ];
}

function createInventoryConnections(): FlowConnection[] {
  return [
    { from: "inv-check", to: "inv-adjust" },
    { from: "inv-cycle", to: "inv-adjust", dashed: true },
    { from: "inv-adjust", to: "inv-lot" },
    { from: "inv-transfer", to: "inv-lot", dashed: true },
    { from: "inv-lot", to: "inv-expiry", dashed: true },
    { from: "inv-lot", to: "inv-grade" },
    { from: "inv-grade", to: "inv-assembly", dashed: true },
  ];
}

function createSettlementNodes(): FlowNode[] {
  return [
    { id: "stl-close", label: "마감처리", status: "mandatory", x: 60, y: 30, width: 140, height: 48 },
    { id: "stl-calc", label: "정산금액 산출", status: "mandatory", x: 60, y: 110, width: 160, height: 48 },
    { id: "stl-review", label: "정산내역 검토", status: "mandatory", x: 60, y: 190, width: 160, height: 48 },
    { id: "stl-approve", label: "정산승인", status: "mandatory", x: 60, y: 270, width: 140, height: 48 },
    { id: "stl-invoice", label: "청구서 발행", status: "optional", x: 260, y: 270, width: 160, height: 48 },
    { id: "stl-complete", label: "정산완료", status: "mandatory", x: 60, y: 350, width: 140, height: 48 },
  ];
}

function createSettlementConnections(): FlowConnection[] {
  return [
    { from: "stl-close", to: "stl-calc" },
    { from: "stl-calc", to: "stl-review" },
    { from: "stl-review", to: "stl-approve" },
    { from: "stl-approve", to: "stl-invoice", dashed: true },
    { from: "stl-approve", to: "stl-complete" },
  ];
}

function getInitialData(tab: TabKey): { nodes: FlowNode[]; connections: FlowConnection[] } {
  switch (tab) {
    case "inbound": return { nodes: createInboundNodes(), connections: createInboundConnections() };
    case "outbound": return { nodes: createOutboundNodes(), connections: createOutboundConnections() };
    case "dispatch": return { nodes: createDispatchNodes(), connections: createDispatchConnections() };
    case "inventory": return { nodes: createInventoryNodes(), connections: createInventoryConnections() };
    case "settlement": return { nodes: createSettlementNodes(), connections: createSettlementConnections() };
  }
}

// --- Helpers ---
function getNodeCenter(node: FlowNode): { cx: number; cy: number } {
  const w = node.width ?? 140;
  const h = node.height ?? 48;
  return { cx: node.x + w / 2, cy: node.y + h / 2 };
}

function computeArrowPath(
  from: FlowNode,
  to: FlowNode
): { path: string; arrowX: number; arrowY: number; angle: number } {
  const fCenter = getNodeCenter(from);
  const tCenter = getNodeCenter(to);
  const fw = from.width ?? 140;
  const fh = from.height ?? 48;
  const tw = to.width ?? 140;
  const th = to.height ?? 48;

  const dx = tCenter.cx - fCenter.cx;
  const dy = tCenter.cy - fCenter.cy;

  let startX: number, startY: number, endX: number, endY: number;

  // Determine exit/entry sides based on relative positions
  if (Math.abs(dy) > Math.abs(dx) * 0.5) {
    // Primarily vertical
    if (dy > 0) {
      startX = fCenter.cx;
      startY = from.y + fh;
      endX = tCenter.cx;
      endY = to.y;
    } else {
      startX = fCenter.cx;
      startY = from.y;
      endX = tCenter.cx;
      endY = to.y + th;
    }
  } else {
    // Primarily horizontal
    if (dx > 0) {
      startX = from.x + fw;
      startY = fCenter.cy;
      endX = to.x;
      endY = tCenter.cy;
    } else {
      startX = from.x;
      startY = fCenter.cy;
      endX = to.x + tw;
      endY = tCenter.cy;
    }
  }

  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

  // Use a simple elbow path for orthogonal connections
  let path: string;
  if (Math.abs(startX - endX) < 5) {
    // Straight vertical
    path = `M ${startX} ${startY} L ${endX} ${endY}`;
  } else if (Math.abs(startY - endY) < 5) {
    // Straight horizontal
    path = `M ${startX} ${startY} L ${endX} ${endY}`;
  } else {
    // Elbow: go vertical first, then horizontal
    const midY = (startY + endY) / 2;
    path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
  }

  return { path, arrowX: endX, arrowY: endY, angle };
}

// --- Components ---
function FlowBox({
  node,
  onClick,
}: {
  node: FlowNode;
  onClick: (id: string) => void;
}) {
  const style = STATUS_STYLES[node.status];
  const w = node.width ?? 140;
  const h = node.height ?? 48;

  return (
    <g
      className="cursor-pointer"
      onClick={() => onClick(node.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(node.id); }}
    >
      <rect
        x={node.x}
        y={node.y}
        width={w}
        height={h}
        rx={8}
        ry={8}
        className={`${style.bg} ${style.border} stroke-current`}
        fill={
          node.status === "mandatory" ? "#E8F5E9" :
          node.status === "optional" ? "#FFF8E1" :
          node.status === "excluded" ? "#F5F5F5" : "#FCE4EC"
        }
        stroke={
          node.status === "mandatory" ? "#66BB6A" :
          node.status === "optional" ? "#FFCA28" :
          node.status === "excluded" ? "#BDBDBD" : "#F48FB1"
        }
        strokeWidth={2}
      />
      <text
        x={node.x + w / 2}
        y={node.subLabel ? node.y + h / 2 - 7 : node.y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="pointer-events-none select-none"
        fontSize={12}
        fontWeight={600}
        fill={
          node.status === "mandatory" ? "#2E7D32" :
          node.status === "optional" ? "#F57F17" :
          node.status === "excluded" ? "#757575" : "#C2185B"
        }
      >
        {node.label}
      </text>
      {node.subLabel && (
        <text
          x={node.x + w / 2}
          y={node.y + h / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none select-none"
          fontSize={10}
          fill="#9E9E9E"
        >
          {node.subLabel}
        </text>
      )}
    </g>
  );
}

function FlowArrow({
  from,
  to,
  dashed,
  label,
}: {
  from: FlowNode;
  to: FlowNode;
  dashed?: boolean;
  label?: string;
}) {
  const { path, arrowX, arrowY, angle } = computeArrowPath(from, to);
  const markerId = dashed ? "arrowhead-dashed" : "arrowhead";

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={dashed ? "#BDBDBD" : "#90A4AE"}
        strokeWidth={dashed ? 1.5 : 2}
        strokeDasharray={dashed ? "6 3" : undefined}
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text
          x={(getNodeCenter(from).cx + getNodeCenter(to).cx) / 2}
          y={(getNodeCenter(from).cy + getNodeCenter(to).cy) / 2 - 6}
          textAnchor="middle"
          fontSize={9}
          fill="#90A4AE"
          className="pointer-events-none select-none"
        >
          {label}
        </text>
      )}
    </g>
  );
}

// --- Main Page ---
export default function WorkPolicyPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("inbound");
  const [pltManagement, setPltManagement] = useState("Y");
  const [tabData, setTabData] = useState<Record<TabKey, FlowNode[]>>(() => {
    const result: Partial<Record<TabKey, FlowNode[]>> = {};
    for (const tab of TABS) {
      result[tab.key] = getInitialData(tab.key).nodes;
    }
    return result as Record<TabKey, FlowNode[]>;
  });

  const currentNodes = tabData[activeTab];
  const currentConnections = getInitialData(activeTab).connections;

  const toggleNodeStatus = useCallback((nodeId: string) => {
    setTabData((prev) => {
      const nodes = prev[activeTab].map((node) => {
        if (node.id !== nodeId) return node;
        const currentIdx = STATUS_CYCLE.indexOf(node.status);
        const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
        return { ...node, status: STATUS_CYCLE[nextIdx] };
      });
      return { ...prev, [activeTab]: nodes };
    });
  }, [activeTab]);

  const handleSave = () => {
    // Frontend-only: show a simple alert
    alert("작업정책이 저장되었습니다.");
  };

  // Compute SVG viewBox dimensions
  const maxX = Math.max(...currentNodes.map((n) => n.x + (n.width ?? 140))) + 40;
  const maxY = Math.max(...currentNodes.map((n) => n.y + (n.height ?? 48))) + 40;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">센터별작업정책</h1>
          <p className="mt-1 text-sm text-[#8B95A1]">
            기준관리 &gt; 센터별작업정책
          </p>
        </div>
      </div>

      {/* PLT Management + Save */}
      <div className="rounded-xl bg-white px-5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="shrink-0 text-sm font-medium text-[#4E5968]">
              PLT관리여부
            </label>
            <select
              value={pltManagement}
              onChange={(e) => setPltManagement(e.target.value)}
              className="w-24 rounded-lg border border-[#E5E8EB] bg-white px-3 py-2 text-sm text-[#191F28] outline-none transition-all focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20 appearance-none"
            >
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="rounded-lg bg-[#DC2626] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C]"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-[#F2F4F6] px-5">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "text-[#3182F6]"
                    : "text-[#8B95A1] hover:text-[#4E5968]"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#3182F6]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 border-b border-[#F2F4F6] px-5 py-2.5">
          <span className="text-xs font-semibold text-[#6B7684]">범례</span>
          {(Object.keys(STATUS_STYLES) as PolicyStatus[]).map((status) => {
            const s = STATUS_STYLES[status];
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-4 w-8 rounded border-2 ${s.border}`}
                  style={{
                    backgroundColor:
                      status === "mandatory" ? "#E8F5E9" :
                      status === "optional" ? "#FFF8E1" :
                      status === "excluded" ? "#F5F5F5" : "#FCE4EC",
                  }}
                />
                <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
              </div>
            );
          })}
          <span className="ml-auto text-[10px] text-[#B0B8C1]">
            박스를 클릭하면 상태가 변경됩니다
          </span>
        </div>

        {/* Flowchart Canvas */}
        <div className="overflow-auto p-5">
          <svg
            width={maxX}
            height={maxY}
            viewBox={`0 0 ${maxX} ${maxY}`}
            className="mx-auto"
          >
            {/* Arrow marker definitions */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#90A4AE" />
              </marker>
              <marker
                id="arrowhead-dashed"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#BDBDBD" />
              </marker>
            </defs>

            {/* Connections */}
            {currentConnections.map((conn, idx) => {
              const fromNode = currentNodes.find((n) => n.id === conn.from);
              const toNode = currentNodes.find((n) => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              return (
                <FlowArrow
                  key={`${conn.from}-${conn.to}-${idx}`}
                  from={fromNode}
                  to={toNode}
                  dashed={conn.dashed}
                  label={conn.label}
                />
              );
            })}

            {/* Nodes */}
            {currentNodes.map((node) => (
              <FlowBox key={node.id} node={node} onClick={toggleNodeStatus} />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
