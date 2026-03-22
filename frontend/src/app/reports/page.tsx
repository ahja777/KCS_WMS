"use client";

import Link from "next/link";
import {
  Warehouse,
  Package,
  ArrowLeftRight,
  AlertTriangle,
} from "lucide-react";

const reportCards = [
  {
    href: "/reports/warehouse-stock",
    icon: Warehouse,
    title: "창고별 재고 현황",
    description: "창고를 선택하여 품목별 재고 수량과 가용 수량을 확인합니다.",
    iconBg: "bg-[#E8F2FF]",
    iconColor: "text-[#3182F6]",
  },
  {
    href: "/reports/low-stock",
    icon: AlertTriangle,
    title: "부족 재고 알림",
    description: "최소 재고 기준 미달 품목을 확인하고 보충 계획을 수립합니다.",
    iconBg: "bg-[#FFEAED]",
    iconColor: "text-[#F04452]",
  },
  {
    href: "/reports/inout-summary",
    icon: ArrowLeftRight,
    title: "입출고 현황",
    description: "기간별 입고/출고 내역을 분석하고 트렌드를 파악합니다.",
    iconBg: "bg-[#E8F7EF]",
    iconColor: "text-[#1FC47D]",
  },
  {
    href: "/inventory",
    icon: Package,
    title: "품목별 재고 현황",
    description: "전체 품목의 재고 수량, 예약 수량, 가용 수량을 조회합니다.",
    iconBg: "bg-[#FFF3E0]",
    iconColor: "text-[#FF8B00]",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#191F28]">보고서 / 통계</h1>
        <p className="mt-2 text-sm text-[#8B95A1]">
          재고 현황, 입출고 분석, 부족 재고 알림 등 다양한 보고서를 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group">
              <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] group-hover:-translate-y-0.5">
                <div className="flex items-start gap-5">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}
                  >
                    <Icon className={`h-7 w-7 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#191F28] group-hover:text-[#3182F6] transition-colors">
                      {card.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#8B95A1]">
                      {card.description}
                    </p>
                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#3182F6] opacity-0 transition-opacity group-hover:opacity-100">
                      보기 &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
