"use client";

import { cn, getStatusColor, getStatusLabel } from "@/lib/utils";

interface BadgeProps {
  status: string;
  className?: string;
  showLabel?: boolean;
}

export default function Badge({
  status,
  className,
  showLabel = true,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        getStatusColor(status),
        className
      )}
    >
      {showLabel ? getStatusLabel(status) : status}
    </span>
  );
}
