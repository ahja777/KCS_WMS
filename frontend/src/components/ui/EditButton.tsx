"use client";

import { Pencil } from "lucide-react";

interface EditButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export default function EditButton({ onClick }: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-[#3182F6] px-2.5 py-1 text-xs font-medium text-[#3182F6] transition-colors hover:bg-[#3182F6] hover:text-white"
      title="수정"
    >
      <Pencil className="h-3 w-3" />
      수정
    </button>
  );
}
