"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  SalesChannel,
  ChannelOrder,
  ChannelSyncLog,
  ChannelProduct,
} from "@/types/channel";
import type { PaginatedResponse, QueryParams } from "@/types";

// ===== 채널 CRUD =====

export function useChannels(params?: QueryParams) {
  return useQuery<PaginatedResponse<SalesChannel>>({
    queryKey: ["channels", params],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/channels", { params });
      return wrapped.data;
    },
  });
}

export function useChannel(id?: string) {
  return useQuery<SalesChannel>({
    queryKey: ["channels", id],
    queryFn: async () => {
      const { data: wrapped } = await api.get(`/channels/${id}`);
      return wrapped.data;
    },
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data: wrapped } = await api.post("/channels", payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data: wrapped } = await api.put(`/channels/${id}`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

// ===== 연결 테스트 =====

export function useTestConnection() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: wrapped } = await api.post(`/channels/${id}/test`);
      return wrapped.data as { connected: boolean; platform: string };
    },
  });
}

// ===== 주문 동기화 =====

export function useSyncOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      channelId,
      fromDate,
      toDate,
    }: {
      channelId: string;
      fromDate?: string;
      toDate?: string;
    }) => {
      const { data: wrapped } = await api.post(
        `/channels/${channelId}/sync/orders`,
        { fromDate, toDate }
      );
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-orders"] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

// ===== 채널 주문 조회 =====

export function useChannelOrders(params?: QueryParams) {
  return useQuery<PaginatedResponse<ChannelOrder>>({
    queryKey: ["channel-orders", params],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/channels/orders/all", {
        params,
      });
      return wrapped.data;
    },
  });
}

export function useChannelOrdersByChannel(
  channelId: string,
  params?: QueryParams
) {
  return useQuery<PaginatedResponse<ChannelOrder>>({
    queryKey: ["channel-orders", channelId, params],
    queryFn: async () => {
      const { data: wrapped } = await api.get(
        `/channels/${channelId}/orders`,
        { params }
      );
      return wrapped.data;
    },
    enabled: !!channelId,
  });
}

// ===== 배송 확인 =====

export function useConfirmChannelShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      channelOrderId: string;
      carrier: string;
      trackingNumber: string;
    }) => {
      const { data: wrapped } = await api.post("/channels/orders/ship", payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-orders"] });
    },
  });
}

// ===== 재고 동기화 =====

export function useSyncInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: string) => {
      const { data: wrapped } = await api.post(
        `/channels/${channelId}/sync/inventory`
      );
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

// ===== 상품 매핑 =====

export function useChannelProducts(channelId?: string) {
  return useQuery<ChannelProduct[]>({
    queryKey: ["channel-products", channelId],
    queryFn: async () => {
      const { data: wrapped } = await api.get(
        `/channels/${channelId}/products`
      );
      return wrapped.data;
    },
    enabled: !!channelId,
  });
}

export function useLinkProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      channelId,
      ...payload
    }: {
      channelId: string;
      itemId: string;
      platformProductId?: string;
      platformSku?: string;
    }) => {
      const { data: wrapped } = await api.post(
        `/channels/${channelId}/products/link`,
        payload
      );
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-products"] });
    },
  });
}

// ===== 동기화 로그 =====

export function useSyncLogs(channelId?: string) {
  return useQuery<ChannelSyncLog[]>({
    queryKey: ["sync-logs", channelId],
    queryFn: async () => {
      const { data: wrapped } = await api.get(
        `/channels/${channelId}/sync/logs`
      );
      return wrapped.data;
    },
    enabled: !!channelId,
  });
}

// ===== 자동 동기화 토글 =====

export function useToggleSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      channelId,
      enabled,
    }: {
      channelId: string;
      enabled: boolean;
    }) => {
      const { data: wrapped } = await api.post(
        `/channels/${channelId}/sync/toggle`,
        { enabled }
      );
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}
