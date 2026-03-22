"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCreateChannel, useUpdateChannel } from "@/hooks/useChannels";
import { useWarehouses } from "@/hooks/useApi";
import type { SalesChannel, ChannelPlatform } from "@/types/channel";
import {
  PLATFORM_LABELS,
  CREDENTIAL_FIELDS,
} from "@/types/channel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  channel?: SalesChannel;
  onSuccess?: () => void;
}

const SUPPORTED_PLATFORMS: ChannelPlatform[] = [
  "COUPANG",
  "NAVER",
  "AMAZON",
  "SHOPIFY",
  "EBAY",
  "RAKUTEN",
  "LAZADA",
  "SHOPEE",
  "ELEVENTH_ST",
];

export default function ChannelFormModal({
  isOpen,
  onClose,
  channel,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<ChannelPlatform>("COUPANG");
  const [sellerId, setSellerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [syncInterval, setSyncInterval] = useState(10);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const createMutation = useCreateChannel();
  const updateMutation = useUpdateChannel();
  const { data: warehouseResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehouseResponse?.data ?? [];

  const isEdit = !!channel;

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setPlatform(channel.platform);
      setSellerId(channel.sellerId || "");
      setWarehouseId(channel.warehouseId);
      setSyncInterval(channel.syncInterval);
      setCredentials(channel.credentials || {});
      setNotes(channel.notes || "");
    } else {
      setName("");
      setPlatform("COUPANG");
      setSellerId("");
      setWarehouseId("");
      setSyncInterval(10);
      setCredentials({});
      setNotes("");
    }
  }, [channel, isOpen]);

  const credFields = CREDENTIAL_FIELDS[platform] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      platform,
      sellerId: sellerId || undefined,
      warehouseId,
      syncInterval,
      credentials,
      notes: notes || undefined,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: channel!.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess?.();
      onClose();
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#191F28]">
            {isEdit ? "채널 수정" : "채널 등록"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#B0B8C1] hover:bg-[#F7F8FA]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 채널명 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              채널명
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 쿠팡 메인스토어"
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              required
            />
          </div>

          {/* 플랫폼 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              플랫폼
            </label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as ChannelPlatform);
                setCredentials({});
              }}
              disabled={isEdit}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20 disabled:opacity-50"
            >
              {SUPPORTED_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {/* Seller ID */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              셀러 ID (선택)
            </label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* 연결 창고 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              연결 창고
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              required
            >
              <option value="">창고 선택</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* 동기화 주기 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              동기화 주기 (분)
            </label>
            <input
              type="number"
              value={syncInterval}
              onChange={(e) => setSyncInterval(Number(e.target.value))}
              min={1}
              max={1440}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* API 인증정보 */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-[#191F28]">
              API 인증 정보
            </label>
            <div className="space-y-3 rounded-xl bg-[#F7F8FA] p-4">
              {credFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs font-medium text-[#8B95A1]">
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={credentials[field.key] || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.label}
                    className="w-full rounded-lg border border-[#E5E8EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#3182F6]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 비고 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4E5968]">
              비고
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E5E8EB] px-5 py-2.5 text-sm font-semibold text-[#4E5968] hover:bg-[#F7F8FA]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA] disabled:opacity-50"
            >
              {isEdit ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
