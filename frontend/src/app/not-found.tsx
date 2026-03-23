import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
      <div className="text-center max-w-md">
        {/* 공사중 캐릭터 - CSS Art */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* 공사 바리케이드 */}
            <div className="flex justify-center gap-1 mb-4">
              <div className="h-8 w-8 rounded bg-[#FF9500] animate-pulse" />
              <div className="h-8 w-8 rounded bg-[#FFD60A]" />
              <div className="h-8 w-8 rounded bg-[#FF9500] animate-pulse" />
              <div className="h-8 w-8 rounded bg-[#FFD60A]" />
              <div className="h-8 w-8 rounded bg-[#FF9500] animate-pulse" />
            </div>
            {/* 삽과 곡괭이 */}
            <div className="text-7xl leading-none select-none">
              <span className="inline-block animate-bounce" style={{ animationDelay: "0s", animationDuration: "2s" }}>
                🏗️
              </span>
              <span className="inline-block animate-bounce" style={{ animationDelay: "0.3s", animationDuration: "2s" }}>
                👷
              </span>
              <span className="inline-block animate-bounce" style={{ animationDelay: "0.6s", animationDuration: "2s" }}>
                🚧
              </span>
            </div>
            {/* 공사중 테이프 */}
            <div className="mt-4 overflow-hidden rounded-lg">
              <div
                className="h-6 w-full"
                style={{
                  background: "repeating-linear-gradient(45deg, #FFD60A, #FFD60A 10px, #191F28 10px, #191F28 20px)",
                }}
              />
            </div>
          </div>
        </div>

        <h1 className="text-5xl font-black text-[#191F28] tracking-tight">
          공사중!
        </h1>
        <p className="mt-3 text-lg font-medium text-[#4E5968]">
          이 페이지는 아직 개발중입니다
        </p>
        <p className="mt-1 text-sm text-[#8B95A1]">
          열심히 만들고 있으니 조금만 기다려주세요!
        </p>

        {/* 진행률 바 (재미 요소) */}
        <div className="mt-6 mx-auto max-w-xs">
          <div className="flex items-center justify-between text-xs text-[#8B95A1] mb-1.5">
            <span>개발 진행률</span>
            <span className="font-semibold text-[#FF9500]">42%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#F2F4F6]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF9500] to-[#FFD60A]"
              style={{ width: "42%", animation: "pulse 2s ease-in-out infinite" }}
            />
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#3182F6] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#3182F6]/25 transition-all hover:bg-[#1B64DA] hover:shadow-xl hover:shadow-[#3182F6]/30 hover:-translate-y-0.5"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}
