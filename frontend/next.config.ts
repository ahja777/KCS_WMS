import type { NextConfig } from "next";

// ─── 포트 고정 (변경 금지) ───────────────────────────────
// Frontend: 3200 | Backend: 4100
// ──────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 개발 서버 포트를 환경변수에 관계없이 고정
  devIndicators: { appIsrStatus: false },
};

export default nextConfig;
