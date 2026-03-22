"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/inventory", label: "현재고 조회" },
  { href: "/inventory/transactions", label: "재고입출고내역" },
  { href: "/inventory/adjustments", label: "재고 조정" },
  { href: "/inventory/transfer", label: "재고이동등록" },
  { href: "/inventory/movements", label: "재고이동현황" },
  { href: "/inventory/ownership-transfer", label: "명의변경" },
  { href: "/inventory/cycle-counts", label: "재고실사" },
  { href: "/inventory/container-stock", label: "용기재고" },
  { href: "/inventory/assembly", label: "임가공" },
] as const;

export default function InventoryTabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200",
              isActive
                ? "bg-[#191F28] text-white shadow-sm"
                : "bg-[#F7F8FA] text-[#4E5968] hover:bg-[#F2F4F6]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
