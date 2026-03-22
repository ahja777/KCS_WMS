import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#B0B8C1]">404</h1>
        <p className="mt-4 text-lg text-[#4E5968]">
          페이지를 찾을 수 없습니다
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#1B64DA]"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
