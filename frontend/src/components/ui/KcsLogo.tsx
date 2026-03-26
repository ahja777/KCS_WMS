"use client";

import Image from "next/image";

interface KcsLogoProps {
  height?: number;
  className?: string;
}

export default function KcsLogo({ height = 40, className }: KcsLogoProps) {
  const width = Math.round(height * 1.58);
  return (
    <Image
      src="/kcs-logo.jpg"
      alt="KCS"
      width={width}
      height={height}
      className={`rounded-md object-contain ${className ?? ""}`}
      priority
    />
  );
}
