"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/inventory", label: "재고 현황" },
  { href: "/inventory/adjustments", label: "재고 조정" },
  { href: "/inventory/cycle-counts", label: "순환재고조사" },
  { href: "/inventory/transactions", label: "입출고 내역" },
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
