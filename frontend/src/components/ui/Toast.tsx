"use client";

import { useToastStore } from "@/stores/toast.store";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styleMap = {
  success: "bg-white border-[#1FC47D] text-[#191F28]",
  error: "bg-white border-[#F04452] text-[#191F28]",
  info: "bg-white border-[#3182F6] text-[#191F28]",
  warning: "bg-white border-[#FF8B00] text-[#191F28]",
};

const iconColorMap = {
  success: "text-[#1FC47D]",
  error: "text-[#F04452]",
  info: "text-[#3182F6]",
  warning: "text-[#FF8B00]",
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border-l-4 px-5 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)] animate-toast-in ${styleMap[toast.type]}`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${iconColorMap[toast.type]}`} />
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded-lg p-1 text-[#B0B8C1] transition-colors hover:text-[#4E5968]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
