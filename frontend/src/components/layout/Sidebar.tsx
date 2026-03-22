"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Warehouse,
  Package,
  Users,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  Boxes,
  UserCog,
  Settings,
  ClipboardCheck,
  ScanLine,
  Database,
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart3,
  MapPin,
  Tag,
  Building2,
  AlertTriangle,
  Ruler,
  Container,
  Tags,
  Code2,
  Headphones,
  ClipboardList,
  Calculator,
  Languages,
  FileSpreadsheet,
  Cog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/types";

// --- Menu Types ---
interface MenuChild {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

interface MenuGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  children: MenuChild[];
  roles?: UserRole[];
}

interface MenuDirect {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

type MenuItem = MenuDirect | MenuGroup;

function isGroup(item: MenuItem): item is MenuGroup {
  return "children" in item && Array.isArray(item.children);
}

// --- Menu Definition ---
// roles가 없으면 모든 역할에 표시
const menuItems: MenuItem[] = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  {
    key: "operations",
    label: "입출고 관리",
    icon: ArrowLeftRight,
    children: [
      { href: "/operations", label: "입출고 현황", icon: FileText },
      { href: "/inbound", label: "입고 관리", icon: ArrowDownToLine },
      { href: "/outbound", label: "출고 관리", icon: ArrowUpFromLine },
      { href: "/dispatch", label: "배차 작업", icon: Truck },
      { href: "/work-orders", label: "작업 지시서", icon: ClipboardList },
    ],
  },
  {
    key: "master",
    label: "기준 관리",
    icon: Database,
    roles: ["ADMIN", "MANAGER"],
    children: [
      { href: "/warehouse", label: "창고 관리", icon: Warehouse },
      { href: "/warehouse/locations", label: "로케이션 관리", icon: MapPin },
      { href: "/items", label: "품목 관리", icon: Package },
      { href: "/partners", label: "파트너 관리", icon: Users },
      { href: "/vehicles", label: "차량 관리", icon: Truck },
      { href: "/docks", label: "도크장 관리", icon: Container },
      { href: "/item-groups", label: "상품군 관리", icon: Tags },
      { href: "/containers", label: "물류용기 관리", icon: Container },
      { href: "/container-groups", label: "물류용기군", icon: Tags },
      { href: "/partner-products", label: "화주별거래처상품", icon: Package },
      { href: "/set-products", label: "세트상품구성", icon: Boxes },
      { href: "/loc-products", label: "LOC별입고상품", icon: MapPin },
      { href: "/period-close", label: "마감관리", icon: Calculator },
      { href: "/work-policy", label: "센터별작업정책", icon: ClipboardList },
    ],
  },
  { href: "/channels", label: "판매채널", icon: Store, roles: ["ADMIN", "MANAGER"] },
  {
    key: "inventory",
    label: "재고 관리",
    icon: Boxes,
    roles: ["ADMIN", "MANAGER", "OPERATOR"],
    children: [
      { href: "/inventory", label: "재고 현황", icon: Boxes },
      { href: "/inventory/transfer", label: "재고 이동", icon: ArrowLeftRight, roles: ["ADMIN", "MANAGER", "OPERATOR"] },
      { href: "/inventory/movements", label: "재고이동현황", icon: ArrowLeftRight, roles: ["ADMIN", "MANAGER", "OPERATOR"] },
      { href: "/inventory/adjustments", label: "재고 조정", icon: ClipboardCheck, roles: ["ADMIN", "MANAGER"] },
      { href: "/inventory/cycle-counts", label: "순환재고조사", icon: ScanLine, roles: ["ADMIN", "MANAGER", "OPERATOR"] },
      { href: "/inventory/expiry-alerts", label: "유효기간 경고", icon: AlertTriangle, roles: ["ADMIN", "MANAGER"] },
      { href: "/inventory/ownership-transfer", label: "명의변경", icon: FileText, roles: ["ADMIN", "MANAGER"] },
      { href: "/inventory/assembly", label: "임가공(조립)", icon: Boxes, roles: ["ADMIN", "MANAGER", "OPERATOR"] },
      { href: "/inventory/container-stock", label: "용기재고 조회", icon: Container, roles: ["ADMIN", "MANAGER", "OPERATOR"] },
      { href: "/inventory/transactions", label: "입출고 내역", icon: ArrowLeftRight },
    ],
  },
  {
    key: "reports",
    label: "통계 관리",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
    children: [
      { href: "/reports", label: "통계 홈", icon: BarChart3 },
      { href: "/reports/warehouse-stock", label: "창고별 재고", icon: Warehouse },
      { href: "/reports/location-stock", label: "로케이션별 재고", icon: MapPin },
      { href: "/reports/lot-stock", label: "LOT별 재고", icon: Tag },
      { href: "/reports/partner-outbound", label: "거래처별 출고", icon: Building2 },
      { href: "/reports/inout-summary", label: "입출고 통계", icon: BarChart3 },
      { href: "/reports/low-stock", label: "적정재고 미달", icon: AlertTriangle },
      { href: "/reports/category-stock", label: "제품군별 현황", icon: Tags },
      { href: "/reports/grade-stock", label: "등급별 재고", icon: Tag },
    ],
  },
  {
    key: "system",
    label: "시스템 관리",
    icon: Settings,
    roles: ["ADMIN", "MANAGER"],
    children: [
      { href: "/users", label: "사용자 관리", icon: UserCog, roles: ["ADMIN", "MANAGER"] },
      { href: "/settings/uom", label: "UOM 관리", icon: Ruler, roles: ["ADMIN", "MANAGER"] },
      { href: "/settings/common-codes", label: "공통코드", icon: Code2, roles: ["ADMIN", "MANAGER"] },
      { href: "/settings/roles", label: "권한관리", icon: UserCog, roles: ["ADMIN"] },
      { href: "/settings/programs", label: "프로그램관리", icon: Cog, roles: ["ADMIN"] },
      { href: "/settings/multilingual", label: "다국어관리", icon: Languages, roles: ["ADMIN", "MANAGER"] },
      { href: "/settings/templates", label: "템플릿관리", icon: FileSpreadsheet, roles: ["ADMIN", "MANAGER"] },
      { href: "/helpdesk", label: "HelpDesk", icon: Headphones },
      { href: "/settings", label: "설정", icon: Settings, roles: ["ADMIN"] },
    ],
  },
  {
    key: "settlement",
    label: "정산 관리",
    icon: Calculator,
    roles: ["ADMIN", "MANAGER"],
    children: [
      { href: "/settlements", label: "정산 관리", icon: Calculator },
    ],
  },
];

function filterMenuByRole(items: MenuItem[], role: UserRole | undefined): MenuItem[] {
  if (!role) return items;
  return items
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
      if (isGroup(item)) {
        const filtered = item.children.filter(
          (child) => !child.roles || child.roles.includes(role)
        );
        if (filtered.length === 0) return null;
        return { ...item, children: filtered };
      }
      return item;
    })
    .filter(Boolean) as MenuItem[];
}

// --- Helper: check if a path is active for a given href ---
function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// --- Helper: find which group keys should be expanded based on current path ---
function getActiveGroupKeys(pathname: string): string[] {
  const keys: string[] = [];
  for (const item of menuItems) {
    if (isGroup(item)) {
      const hasActive = item.children.some((child) =>
        isPathActive(pathname, child.href)
      );
      if (hasActive) keys.push(item.key);
    }
  }
  return keys;
}

// --- Flyout for collapsed sidebar ---
function CollapsedFlyout({
  group,
  pathname,
  anchorRect,
}: {
  group: MenuGroup;
  pathname: string;
  anchorRect: DOMRect | null;
}) {
  if (!anchorRect) return null;

  return (
    <div
      className="fixed z-50 ml-1 min-w-[180px] rounded-xl border border-[#F2F4F6] bg-white py-2 shadow-lg"
      style={{ top: anchorRect.top, left: anchorRect.right }}
    >
      <div className="px-4 py-1.5 text-xs font-medium tracking-wider text-[#8B95A1]">
        {group.label}
      </div>
      {group.children.map((child) => {
        const active = isPathActive(pathname, child.href);
        const Icon = child.icon;
        return (
          <Link
            key={child.href}
            href={child.href}
            className={cn(
              "mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-[#E8F2FF] text-[#3182F6]"
                : "text-[#4E5968] hover:bg-[#F7F8FA]"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-[#3182F6]" : "text-[#8B95A1]"
              )}
            />
            <span>{child.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

// --- Main Sidebar ---
export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const userRole = useAuthStore((s) => s.user?.role) as UserRole | undefined;
  const visibleMenuItems = filterMenuByRole(menuItems, userRole);

  // Expanded groups tracking
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(getActiveGroupKeys(pathname))
  );

  // Auto-expand parent group when navigating to a child route
  useEffect(() => {
    const activeKeys = getActiveGroupKeys(pathname);
    if (activeKeys.length > 0) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        for (const k of activeKeys) next.add(k);
        return next;
      });
    }
  }, [pathname]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Collapsed flyout state
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [flyoutRect, setFlyoutRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGroupMouseEnter = (key: string, el: HTMLElement) => {
    if (!sidebarCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredGroup(key);
    setFlyoutRect(el.getBoundingClientRect());
  };

  const handleGroupMouseLeave = () => {
    if (!sidebarCollapsed) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredGroup(null);
      setFlyoutRect(null);
    }, 150);
  };

  // Clear flyout when sidebar expands
  useEffect(() => {
    if (!sidebarCollapsed) {
      setHoveredGroup(null);
      setFlyoutRect(null);
    }
  }, [sidebarCollapsed]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-white border-r border-[#F2F4F6] transition-all duration-300",
        sidebarCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3182F6] font-bold text-white text-sm">
              K
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#191F28]">
                KCS WMS
              </h1>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#3182F6] font-bold text-white text-sm">
            K
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {visibleMenuItems.map((item) => {
            // --- Direct link item (no children) ---
            if (!isGroup(item)) {
              const active = isPathActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-[#E8F2FF] text-[#3182F6]"
                        : "text-[#4E5968] hover:bg-[#F7F8FA]",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active ? "text-[#3182F6]" : "text-[#8B95A1]"
                      )}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            }

            // --- Group item with children ---
            const group = item;
            const Icon = group.icon;
            const isExpanded = expandedGroups.has(group.key);
            const hasActiveChild = group.children.some((child) =>
              isPathActive(pathname, child.href)
            );

            return (
              <li
                key={group.key}
                className="relative"
                onMouseEnter={(e) =>
                  handleGroupMouseEnter(group.key, e.currentTarget)
                }
                onMouseLeave={handleGroupMouseLeave}
              >
                {/* Group header */}
                <button
                  onClick={() => {
                    if (!sidebarCollapsed) toggleGroup(group.key);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    hasActiveChild
                      ? "text-[#3182F6]"
                      : "text-[#4E5968] hover:bg-[#F7F8FA]",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  title={sidebarCollapsed ? group.label : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      hasActiveChild ? "text-[#3182F6]" : "text-[#8B95A1]"
                    )}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-[#B0B8C1] transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Sub-items (expanded state, only when sidebar is open) */}
                {!sidebarCollapsed && (
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200 ease-in-out",
                      isExpanded
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0"
                    )}
                  >
                    <ul className="flex flex-col gap-0.5 pb-1 pt-0.5">
                      {group.children.map((child) => {
                        const active = isPathActive(pathname, child.href);
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2.5 rounded-xl py-2 pl-10 pr-3 text-sm font-medium transition-all duration-200",
                                active
                                  ? "bg-[#E8F2FF] text-[#3182F6]"
                                  : "text-[#6B7684] hover:bg-[#F7F8FA] hover:text-[#4E5968]"
                              )}
                            >
                              <ChildIcon
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  active ? "text-[#3182F6]" : "text-[#B0B8C1]"
                                )}
                              />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Flyout for collapsed sidebar */}
                {sidebarCollapsed && hoveredGroup === group.key && (
                  <CollapsedFlyout
                    group={group}
                    pathname={pathname}
                    anchorRect={flyoutRect}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[#F2F4F6] p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-xl py-2 text-[#B0B8C1] transition-all duration-200 hover:bg-[#F7F8FA] hover:text-[#4E5968]"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
