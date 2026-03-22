"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3182F6] text-lg font-bold text-white shadow-[0_4px_12px_rgba(49,130,246,0.3)]">
            KCS
          </div>
          <h1 className="mt-4 text-xl font-bold text-[#191F28]">KCS WMS</h1>
        </div>

        {/* Login card */}
        <div className="rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-center text-lg font-bold text-[#191F28]">
            로그인
          </h2>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              id="email"
              type="email"
              label="이메일"
              placeholder="admin@kcs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="py-3.5"
            />
            <Input
              id="password"
              type="password"
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="py-3.5"
            />

            {error && (
              <div className="rounded-xl bg-[#FFF0F0] p-4 text-center text-sm text-[#FF3B30]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              className="w-full"
            >
              로그인
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[#8B95A1]">
          &copy; 2026 KCS Logistics. All rights reserved.
        </p>
      </div>
    </div>
  );
}
