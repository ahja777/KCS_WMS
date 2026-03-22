"use client";

import { Ruler } from "lucide-react";

const uomData = [
  { code: "EA", name: "개", description: "개별 단위", category: "수량" },
  { code: "BOX", name: "박스", description: "포장 박스 단위", category: "수량" },
  { code: "PALLET", name: "팔레트", description: "팔레트 단위", category: "수량" },
  { code: "CASE", name: "케이스", description: "케이스 단위", category: "수량" },
  { code: "KG", name: "킬로그램", description: "중량 단위 (kg)", category: "중량" },
  { code: "LB", name: "파운드", description: "중량 단위 (lb)", category: "중량" },
];

const categoryColors: Record<string, string> = {
  수량: "bg-[#E8F3FF] text-[#3182F6]",
  중량: "bg-[#FFF3E0] text-[#FF8B00]",
};

export default function UomPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3FF]">
          <Ruler className="h-6 w-6 text-[#3182F6]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#191F28]">UOM 정보관리</h1>
          <p className="mt-1 text-sm text-[#8B95A1]">시스템에서 사용하는 단위 정보 (Unit of Measure)</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 rounded-xl bg-[#F7F8FA] p-4">
          <p className="text-sm text-[#6B7684]">
            UOM은 시스템 Enum으로 관리됩니다. 변경이 필요한 경우 시스템 관리자에게 문의하세요.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">코드</th>
                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">단위명</th>
                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">설명</th>
                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">분류</th>
              </tr>
            </thead>
            <tbody>
              {uomData.map((uom) => (
                <tr key={uom.code} className="border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA]">
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-[#F2F4F6] px-3 py-1.5 font-mono text-sm font-bold text-[#191F28]">
                      {uom.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#191F28]">{uom.name}</td>
                  <td className="px-5 py-4 text-[#4E5968]">{uom.description}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[uom.category] ?? "bg-[#F2F4F6] text-[#4E5968]"}`}>
                      {uom.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
