"use client";

import { useState } from "react";
import { Info, Monitor, Database, Check } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api";

export default function SettingsPage() {
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#191F28]">설정</h1>
        <p className="mt-2 text-sm text-[#8B95A1]">
          시스템 정보 및 사용자 설정을 관리합니다.
        </p>
      </div>

      {/* 시스템 정보 */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF]">
            <Info className="h-5 w-5 text-[#3182F6]" />
          </div>
          <h2 className="text-lg font-bold text-[#191F28]">시스템 정보</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <span className="text-sm font-medium text-[#6B7684]">버전</span>
            <span className="text-sm font-semibold text-[#191F28]">1.0.0</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <span className="text-sm font-medium text-[#6B7684]">빌드</span>
            <span className="text-sm font-semibold text-[#191F28]">2026.03.21</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <span className="text-sm font-medium text-[#6B7684]">서버 URL</span>
            <span className="text-sm font-mono font-semibold text-[#191F28]">{API_URL}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <span className="text-sm font-medium text-[#6B7684]">프레임워크</span>
            <span className="text-sm font-semibold text-[#191F28]">Next.js 15 / React 19</span>
          </div>
        </div>
      </div>

      {/* 사용자 설정 */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3E0]">
            <Monitor className="h-5 w-5 text-[#FF8B00]" />
          </div>
          <h2 className="text-lg font-bold text-[#191F28]">사용자 설정</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <div>
              <span className="text-sm font-medium text-[#6B7684]">테마</span>
              <p className="mt-0.5 text-xs text-[#B0B8C1]">라이트/다크 모드 전환 (준비 중)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#E8F2FF] px-3 py-1 text-xs font-semibold text-[#3182F6]">
                라이트
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <div>
              <span className="text-sm font-medium text-[#6B7684]">언어</span>
              <p className="mt-0.5 text-xs text-[#B0B8C1]">시스템 표시 언어</p>
            </div>
            <span className="rounded-full bg-[#F2F4F6] px-3 py-1 text-xs font-semibold text-[#4E5968]">
              한국어
            </span>
          </div>
        </div>
      </div>

      {/* 데이터 관리 */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7EF]">
            <Database className="h-5 w-5 text-[#1FC47D]" />
          </div>
          <h2 className="text-lg font-bold text-[#191F28]">데이터 관리</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <div>
              <span className="text-sm font-medium text-[#6B7684]">데이터 내보내기</span>
              <p className="mt-0.5 text-xs text-[#B0B8C1]">
                재고 데이터를 엑셀 파일로 다운로드합니다
              </p>
            </div>
            <a
              href="/inventory"
              className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
            >
              재고 페이지로 이동
            </a>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-5 py-4">
            <div>
              <span className="text-sm font-medium text-[#6B7684]">캐시 초기화</span>
              <p className="mt-0.5 text-xs text-[#B0B8C1]">
                로컬 캐시 데이터를 초기화합니다
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={cacheCleared}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                cacheCleared
                  ? "bg-[#E8F7EF] text-[#1FC47D]"
                  : "bg-[#FFEAED] text-[#F04452] hover:bg-[#FFD5D9]"
              }`}
            >
              {cacheCleared ? (
                <>
                  <Check className="h-4 w-4" />
                  초기화 완료
                </>
              ) : (
                "캐시 초기화"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
