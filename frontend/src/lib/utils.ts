import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  dateString: string | undefined | null,
  pattern: string = "yyyy-MM-dd"
): string {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), pattern, { locale: ko });
  } catch {
    return "-";
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  return formatDate(dateString, "yyyy-MM-dd HH:mm");
}

export function formatNumber(num: number | undefined | null): string {
  if (num == null) return "0";
  return new Intl.NumberFormat("ko-KR").format(num);
}

export function formatCurrency(
  num: number | undefined | null,
  currency: string = "USD"
): string {
  if (num == null) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(num);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-[#E8F7EF] text-[#1FC47D]",
    INACTIVE: "bg-[#FFEAED] text-[#F04452]",
    MAINTENANCE: "bg-[#FFEAED] text-[#F04452]",
    DISCONTINUED: "bg-[#FFEAED] text-[#F04452]",
    DRAFT: "bg-[#F2F4F6] text-[#8B95A1]",
    CONFIRMED: "bg-[#E8F2FF] text-[#3182F6]",
    ARRIVED: "bg-[#FFF3E0] text-[#FF8B00]",
    RECEIVING: "bg-[#FFF3E0] text-[#FF8B00]",
    COMPLETED: "bg-[#E8F7EF] text-[#1FC47D]",
    CANCELLED: "bg-[#FFEAED] text-[#F04452]",
    PICKING: "bg-[#FFF3E0] text-[#FF8B00]",
    PACKING: "bg-[#FFF3E0] text-[#FF8B00]",
    SHIPPED: "bg-[#E8F2FF] text-[#3182F6]",
    DELIVERED: "bg-[#E8F7EF] text-[#1FC47D]",
    SUPPLIER: "bg-[#E8F2FF] text-[#3182F6]",
    CUSTOMER: "bg-[#E8F7EF] text-[#1FC47D]",
    CARRIER: "bg-[#FFF3E0] text-[#FF8B00]",
    // Transaction types
    INBOUND: "bg-[#E8F7EF] text-[#1FC47D]",
    OUTBOUND: "bg-[#FFEAED] text-[#F04452]",
    ADJUSTMENT_IN: "bg-[#E8F2FF] text-[#3182F6]",
    ADJUSTMENT_OUT: "bg-[#FFF3E0] text-[#FF8B00]",
    CYCLE_COUNT: "bg-[#F2F4F6] text-[#8B95A1]",
    // Zone types
    STORAGE: "bg-[#E8F2FF] text-[#3182F6]",
    SHIPPING: "bg-[#FFF3E0] text-[#FF8B00]",
    STAGING: "bg-[#F2F4F6] text-[#8B95A1]",
    RETURNS: "bg-[#FFEAED] text-[#F04452]",
    QUARANTINE: "bg-[#FFEAED] text-[#F04452]",
    // Location statuses
    AVAILABLE: "bg-[#E8F7EF] text-[#1FC47D]",
    OCCUPIED: "bg-[#E8F2FF] text-[#3182F6]",
    RESERVED: "bg-[#FFF3E0] text-[#FF8B00]",
    BLOCKED: "bg-[#FFEAED] text-[#F04452]",
    // Work order statuses
    CREATED: "bg-[#F2F4F6] text-[#8B95A1]",
    ASSIGNED: "bg-[#E8F2FF] text-[#3182F6]",
    IN_PROGRESS: "bg-[#FFF3E0] text-[#FF8B00]",
    // Work order types
    PUTAWAY: "bg-[#E8F2FF] text-[#3182F6]",
    LOADING: "bg-[#FFF3E0] text-[#FF8B00]",
    MOVE: "bg-[#F2F4F6] text-[#8B95A1]",
    // Settlement statuses
    CALCULATED: "bg-[#E8F2FF] text-[#3182F6]",
    BILLED: "bg-[#E8F7EF] text-[#1FC47D]",
    // Helpdesk
    RECEIVED: "bg-[#E8F2FF] text-[#3182F6]",
    PROCESSING: "bg-[#FFF3E0] text-[#FF8B00]",
  };
  return colors[status] || "bg-[#F2F4F6] text-[#8B95A1]";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "활성",
    INACTIVE: "비활성",
    MAINTENANCE: "점검중",
    DISCONTINUED: "단종",
    DRAFT: "초안",
    CONFIRMED: "확정",
    ARRIVED: "도착",
    RECEIVING: "입고중",
    COMPLETED: "완료",
    CANCELLED: "취소",
    PICKING: "피킹중",
    PACKING: "패킹중",
    SHIPPED: "출하완료",
    DELIVERED: "배송완료",
    SUPPLIER: "공급처",
    CUSTOMER: "고객사",
    CARRIER: "운송사",
    ADMIN: "관리자",
    MANAGER: "매니저",
    OPERATOR: "운영자",
    VIEWER: "뷰어",
    // Transaction types
    INBOUND: "입고",
    OUTBOUND: "출고",
    ADJUSTMENT_IN: "조정(입)",
    ADJUSTMENT_OUT: "조정(출)",
    CYCLE_COUNT: "실사",
    // Zone types
    STORAGE: "보관",
    SHIPPING: "출하",
    STAGING: "스테이징",
    RETURNS: "반품",
    QUARANTINE: "격리",
    // Location statuses
    AVAILABLE: "사용가능",
    OCCUPIED: "사용중",
    RESERVED: "예약",
    BLOCKED: "차단",
    // Work order statuses
    CREATED: "생성",
    ASSIGNED: "배정",
    IN_PROGRESS: "진행중",
    // Work order types
    PUTAWAY: "적치",
    LOADING: "상차",
    MOVE: "이동",
    // Settlement statuses
    CALCULATED: "산출",
    BILLED: "청구",
    // Helpdesk
    RECEIVED: "접수",
    PROCESSING: "처리중",
  };
  return labels[status] || status;
}
