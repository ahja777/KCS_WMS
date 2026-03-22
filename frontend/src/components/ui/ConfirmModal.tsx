"use client";

import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "확인",
  message,
  confirmText = "삭제",
  cancelText = "취소",
  isLoading = false,
  variant = "danger",
}: ConfirmModalProps) {
  const confirmColor =
    variant === "danger"
      ? "bg-[#F04452] hover:bg-[#D63341]"
      : "bg-[#FF8B00] hover:bg-[#E67A00]";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            variant === "danger" ? "bg-[#FFEAED]" : "bg-[#FFF3E0]"
          }`}
        >
          <AlertTriangle
            className={`h-6 w-6 ${
              variant === "danger" ? "text-[#F04452]" : "text-[#FF8B00]"
            }`}
          />
        </div>
        <h3 className="mb-2 text-lg font-bold text-[#191F28]">{title}</h3>
        <p className="mb-6 text-sm text-[#6B7684]">{message}</p>
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-[#F2F4F6] px-5 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${confirmColor}`}
          >
            {isLoading ? "처리중..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
