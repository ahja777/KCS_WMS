"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  PaginatedResponse,
  QueryParams,
  DashboardSummary,
  User,
  Warehouse,
  Item,
  Partner,
  InboundOrder,
  OutboundOrder,
  Inventory,
  Zone,
  Location,
  StockAdjustment,
  CycleCount,
  InventoryTransaction,
  CommonCode,
  Vehicle,
  Dock,
  ItemGroup,
  WorkOrder,
  Settlement,
  Container,
  ContainerGroup,
  OwnershipTransfer,
  Assembly,
  StockTransfer,
  LocationProduct,
  PeriodClose,
  ContainerInventory,
} from "@/types";

// All backend responses are wrapped by TransformInterceptor:
// { success: boolean, data: T, timestamp: string }
// So axios response.data = { success, data, timestamp }, and the actual payload is response.data.data.

// ===== Dashboard =====

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/dashboard/statistics");
      return wrapped.data;
    },
  });
}

// ===== Generic CRUD hooks =====

function useList<T>(resource: string, params?: QueryParams) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [resource, params],
    queryFn: async () => {
      const { data: wrapped } = await api.get(`/${resource}`, { params });
      const inner = wrapped.data;
      // Backend returns { data: T[], meta: { total, page, limit, totalPages } }
      // Frontend expects { data: T[], total, page, limit, totalPages }
      if (inner.meta) {
        return { data: inner.data, ...inner.meta };
      }
      return inner;
    },
  });
}

function useDetail<T>(resource: string, id: string | undefined) {
  return useQuery<T>({
    queryKey: [resource, id],
    queryFn: async () => {
      const { data: wrapped } = await api.get(`/${resource}/${id}`);
      return wrapped.data;
    },
    enabled: !!id,
  });
}

function useCreate<T, P = Partial<T>>(resource: string) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, P>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post(`/${resource}`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

function useUpdate<T, P = Partial<T>>(resource: string) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, { id: string; payload: P }>({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.put(`/${resource}/${id}`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

function useDelete(resource: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/${resource}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

// ===== Users =====
// Auth endpoints live under /auth/* so we use custom hooks instead of the generic helpers.

export function useUsers(params?: QueryParams) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/auth/users", { params });
      const inner = wrapped.data;
      // Unwrap meta like useList does: { data, meta } -> { data, ...meta }
      if (inner.meta) {
        return { data: inner.data, ...inner.meta };
      }
      return inner;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, Partial<User & { password: string }>>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post("/auth/register", payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string; payload: Partial<User & { password?: string }> }>({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.put(`/auth/users/${id}`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/auth/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ===== Warehouses =====
export const useWarehouses = (params?: QueryParams) =>
  useList<Warehouse>("warehouses", params);
export const useWarehouse = (id?: string) =>
  useDetail<Warehouse>("warehouses", id);
export const useCreateWarehouse = () => useCreate<Warehouse>("warehouses");
export const useUpdateWarehouse = () => useUpdate<Warehouse>("warehouses");
export const useDeleteWarehouse = () => useDelete("warehouses");

// ===== Items =====
export const useItems = (params?: QueryParams) =>
  useList<Item>("items", params);
export const useItem = (id?: string) => useDetail<Item>("items", id);
export const useCreateItem = () => useCreate<Item>("items");
export const useUpdateItem = () => useUpdate<Item>("items");
export const useDeleteItem = () => useDelete("items");

// ===== Partners =====
export const usePartners = (params?: QueryParams) =>
  useList<Partner>("partners", params);
export const usePartner = (id?: string) => useDetail<Partner>("partners", id);
export const useCreatePartner = () => useCreate<Partner>("partners");
export const useUpdatePartner = () => useUpdate<Partner>("partners");
export const useDeletePartner = () => useDelete("partners");

// ===== Inbound Orders =====
// Backend controller: @Controller('inbound')
export const useInboundOrders = (params?: QueryParams) =>
  useList<InboundOrder>("inbound", params);
export const useInboundOrder = (id?: string) =>
  useDetail<InboundOrder>("inbound", id);
export const useCreateInboundOrder = () =>
  useCreate<InboundOrder>("inbound");
export const useUpdateInboundOrder = () =>
  useUpdate<InboundOrder>("inbound");

// Inbound status transitions
export function useConfirmInbound() {
  const queryClient = useQueryClient();
  return useMutation<InboundOrder, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/inbound/${id}/confirm`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound"] });
    },
  });
}

export function useArriveInbound() {
  const queryClient = useQueryClient();
  return useMutation<InboundOrder, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/inbound/${id}/arrive`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound"] });
    },
  });
}

export function useReceiveInbound() {
  const queryClient = useQueryClient();
  return useMutation<
    InboundOrder,
    Error,
    { id: string; payload: { receivedBy: string; items: Array<{ inboundOrderItemId: string; receivedQty: number; damagedQty?: number; lotNo?: string; locationCode?: string; notes?: string }> } }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.post(`/inbound/${id}/receive`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound"] });
    },
  });
}

// ===== Outbound Orders =====
// Backend controller: @Controller('outbound')
export const useOutboundOrders = (params?: QueryParams) =>
  useList<OutboundOrder>("outbound", params);
export const useOutboundOrder = (id?: string) =>
  useDetail<OutboundOrder>("outbound", id);
export const useCreateOutboundOrder = () =>
  useCreate<OutboundOrder>("outbound");
export const useUpdateOutboundOrder = () =>
  useUpdate<OutboundOrder>("outbound");

// Outbound status transitions
export function useConfirmOutbound() {
  const queryClient = useQueryClient();
  return useMutation<OutboundOrder, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/outbound/${id}/confirm`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound"] });
    },
  });
}

export function usePickOutbound() {
  const queryClient = useQueryClient();
  return useMutation<
    OutboundOrder,
    Error,
    { id: string; payload: { pickedBy: string; items: Array<{ outboundOrderItemId: string; pickedQty: number }> } }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.post(`/outbound/${id}/pick`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound"] });
    },
  });
}

export function useShipOutbound() {
  const queryClient = useQueryClient();
  return useMutation<
    OutboundOrder,
    Error,
    { id: string; payload: { shippedBy: string; carrier?: string; trackingNumber?: string; notes?: string } }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.post(`/outbound/${id}/ship`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound"] });
    },
  });
}

export function useDeliverOutbound() {
  const queryClient = useQueryClient();
  return useMutation<OutboundOrder, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/outbound/${id}/deliver`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound"] });
    },
  });
}

// ===== Inventory =====
// Backend route is GET /inventory/stock (not GET /inventory)
export const useInventoryList = (params?: QueryParams) =>
  useList<Inventory>("inventory/stock", params);

// ===== Zones (nested under warehouses) =====

export function useZones(warehouseId: string | undefined, params?: QueryParams) {
  return useQuery<PaginatedResponse<Zone>>({
    queryKey: ["zones", warehouseId, params],
    queryFn: async () => {
      const { data: wrapped } = await api.get(`/warehouses/${warehouseId}/zones`, { params });
      const inner = wrapped.data;
      // Backend returns a plain array (not paginated), wrap it for consistency
      if (Array.isArray(inner)) {
        return { data: inner, total: inner.length, page: 1, limit: inner.length, totalPages: 1 };
      }
      if (inner.meta) {
        return { data: inner.data, ...inner.meta };
      }
      return inner;
    },
    enabled: !!warehouseId,
  });
}

export function useCreateZone(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation<Zone, Error, Partial<Zone>>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post(`/warehouses/${warehouseId}/zones`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", warehouseId] });
    },
  });
}

export function useUpdateZone(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation<Zone, Error, { id: string; payload: Partial<Zone> }>({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.put(`/warehouses/${warehouseId}/zones/${id}`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", warehouseId] });
    },
  });
}

export function useDeleteZone(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/warehouses/${warehouseId}/zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", warehouseId] });
    },
  });
}

// ===== Locations (nested under zones) =====

export function useLocations(warehouseId: string | undefined, zoneId: string | undefined, params?: QueryParams) {
  return useQuery<PaginatedResponse<Location>>({
    queryKey: ["locations", warehouseId, zoneId, params],
    queryFn: async () => {
      const { data: wrapped } = await api.get(`/warehouses/${warehouseId}/zones/${zoneId}/locations`, { params });
      const inner = wrapped.data;
      // Backend returns a plain array (not paginated), wrap it for consistency
      if (Array.isArray(inner)) {
        return { data: inner, total: inner.length, page: 1, limit: inner.length, totalPages: 1 };
      }
      if (inner.meta) {
        return { data: inner.data, ...inner.meta };
      }
      return inner;
    },
    enabled: !!warehouseId && !!zoneId,
  });
}

export function useCreateLocation(warehouseId: string, zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation<Location, Error, Partial<Location>>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post(`/warehouses/${warehouseId}/zones/${zoneId}/locations`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", warehouseId, zoneId] });
    },
  });
}

export function useUpdateLocation(warehouseId: string, zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation<Location, Error, { id: string; payload: Partial<Location> }>({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.put(`/warehouses/${warehouseId}/zones/${zoneId}/locations/${id}`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", warehouseId, zoneId] });
    },
  });
}

export function useDeleteLocation(warehouseId: string, zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/warehouses/${warehouseId}/zones/${zoneId}/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", warehouseId, zoneId] });
    },
  });
}

// ===== Stock Adjustments =====
export function useStockAdjustments(warehouseId?: string, params?: QueryParams) {
  return useQuery<PaginatedResponse<StockAdjustment>>({
    queryKey: ["stock-adjustments", warehouseId, params],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/inventory/adjustments", {
        params: { ...params, ...(warehouseId ? { warehouseId } : {}) },
      });
      const inner = wrapped.data;
      // Backend returns a plain array (not paginated), wrap it for consistency
      if (Array.isArray(inner)) {
        return { data: inner, total: inner.length, page: 1, limit: inner.length, totalPages: 1 };
      }
      if (inner.meta) {
        return { data: inner.data, ...inner.meta };
      }
      return inner;
    },
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  return useMutation<StockAdjustment, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post("/inventory/adjustments", payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ===== Cycle Counts =====
export function useCycleCounts(warehouseId?: string, status?: string, params?: QueryParams) {
  return useQuery<PaginatedResponse<CycleCount>>({
    queryKey: ["cycle-counts", warehouseId, status, params],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/inventory/cycle-counts", {
        params: {
          ...params,
          ...(warehouseId ? { warehouseId } : {}),
          ...(status ? { status } : {}),
        },
      });
      const inner = wrapped.data;
      // Backend returns a plain array (not paginated), wrap it for consistency
      if (Array.isArray(inner)) {
        return { data: inner, total: inner.length, page: 1, limit: inner.length, totalPages: 1 };
      }
      if (inner.meta) {
        return { data: inner.data, ...inner.meta };
      }
      return inner;
    },
  });
}

export function useCreateCycleCount() {
  const queryClient = useQueryClient();
  return useMutation<CycleCount, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post("/inventory/cycle-counts", payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle-counts"] });
    },
  });
}

export function useCompleteCycleCount() {
  const queryClient = useQueryClient();
  return useMutation<
    CycleCount,
    Error,
    { id: string; payload: { countedQty: number; countedBy: string; notes?: string } }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.post(`/inventory/cycle-counts/${id}/complete`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle-counts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ===== Stock Transfer =====
export function useStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post("/inventory/transfer", payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
    },
  });
}

// ===== Inventory Transactions =====
export function useTransactions(params?: QueryParams) {
  return useQuery<PaginatedResponse<InventoryTransaction>>({
    queryKey: ["inventory-transactions", params],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/inventory/transactions", { params });
      const inner = wrapped.data;
      // Backend returns PaginatedResult { data, meta }, unwrap like useList
      if (inner.meta) {
        return { data: inner.data, ...inner.meta };
      }
      return inner;
    },
  });
}

// ===== Stock Summary =====
export function useStockSummary(warehouseId?: string) {
  return useQuery({
    queryKey: ["stock-summary", warehouseId],
    queryFn: async () => {
      const { data: wrapped } = await api.get(`/inventory/stock/summary/${warehouseId}`);
      return wrapped.data;
    },
    enabled: !!warehouseId,
  });
}

// ===== Inventory Movements =====
export function useInventoryMovements(params?: QueryParams) {
  return useQuery({
    queryKey: ["inventory-movements", params],
    queryFn: async () => {
      const { data: wrapped } = await api.get("/inventory/movements", { params });
      return wrapped.data;
    },
  });
}

export function useCreateInventoryMovement() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data: wrapped } = await api.post("/inventory/movements", payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useStartInventoryMovement() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/inventory/movements/${id}/start`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
  });
}

export function useCompleteInventoryMovement() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/inventory/movements/${id}/complete`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ===== Common Codes =====
export const useCommonCodes = (params?: QueryParams) =>
  useList<CommonCode>("common-codes", params);
export const useCreateCommonCode = () => useCreate<CommonCode>("common-codes");
export const useUpdateCommonCode = () => useUpdate<CommonCode>("common-codes");
export const useDeleteCommonCode = () => useDelete("common-codes");

// ===== Vehicles =====
export const useVehicles = (params?: QueryParams) =>
  useList<Vehicle>("vehicles", params);
export const useCreateVehicle = () => useCreate<Vehicle>("vehicles");
export const useUpdateVehicle = () => useUpdate<Vehicle>("vehicles");
export const useDeleteVehicle = () => useDelete("vehicles");

// ===== Docks =====
export const useDocks = (params?: QueryParams) =>
  useList<Dock>("docks", params);
export const useCreateDock = () => useCreate<Dock>("docks");
export const useUpdateDock = () => useUpdate<Dock>("docks");
export const useDeleteDock = () => useDelete("docks");

// ===== Item Groups =====
export const useItemGroups = (params?: QueryParams) =>
  useList<ItemGroup>("item-groups", params);
export const useCreateItemGroup = () => useCreate<ItemGroup>("item-groups");
export const useUpdateItemGroup = () => useUpdate<ItemGroup>("item-groups");
export const useDeleteItemGroup = () => useDelete("item-groups");

// ===== Work Orders =====
export const useWorkOrders = (params?: QueryParams) =>
  useList<WorkOrder>("work-orders", params);

export function useWorkOrder(id?: string) {
  return useQuery<WorkOrder>({
    queryKey: ["work-orders", id],
    queryFn: async () => {
      const { data: wrapped } = await api.get(`/work-orders/${id}`);
      return wrapped.data;
    },
    enabled: !!id,
  });
}

export function useAssignWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, { id: string; payload: { assignee: string } }>({
    mutationFn: async ({ id, payload }) => {
      const { data: wrapped } = await api.post(`/work-orders/${id}/assign`, payload);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useStartWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/work-orders/${id}/start`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/work-orders/${id}/complete`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

// ===== Settlements =====
export const useSettlements = (params?: QueryParams) =>
  useList<Settlement>("settlements", params);
export const useCreateSettlement = () => useCreate<Settlement>("settlements");
export const useUpdateSettlement = () => useUpdate<Settlement>("settlements");
export const useDeleteSettlement = () => useDelete("settlements");

// ===== Containers =====
export const useContainers = (params?: QueryParams) =>
  useList<Container>("containers", params);
export const useContainer = (id?: string) => useDetail<Container>("containers", id);
export const useCreateContainer = () => useCreate<Container>("containers");
export const useUpdateContainer = () => useUpdate<Container>("containers");
export const useDeleteContainer = () => useDelete("containers");

// ===== Container Groups =====
export const useContainerGroups = (params?: QueryParams) =>
  useList<ContainerGroup>("container-groups", params);
export const useCreateContainerGroup = () => useCreate<ContainerGroup>("container-groups");
export const useUpdateContainerGroup = () => useUpdate<ContainerGroup>("container-groups");
export const useDeleteContainerGroup = () => useDelete("container-groups");

// ===== Ownership Transfers =====
export const useOwnershipTransfers = (params?: QueryParams) =>
  useList<OwnershipTransfer>("ownership-transfers", params);
export const useCreateOwnershipTransfer = () => useCreate<OwnershipTransfer>("ownership-transfers");
export const useDeleteOwnershipTransfer = () => useDelete("ownership-transfers");

// ===== Assemblies =====
export const useAssemblies = (params?: QueryParams) =>
  useList<Assembly>("assemblies", params);
export const useCreateAssembly = () => useCreate<Assembly>("assemblies");
export const useDeleteAssembly = () => useDelete("assemblies");

// ===== Stock Transfers =====
export const useStockTransfers = (params?: QueryParams) =>
  useList<StockTransfer>("stock-transfers", params);
export const useCreateStockTransfer = () => useCreate<StockTransfer>("stock-transfers");
export const useUpdateStockTransfer = () => useUpdate<StockTransfer>("stock-transfers");
export const useDeleteStockTransfer = () => useDelete("stock-transfers");

// ===== Location Products =====
export const useLocationProducts = (params?: QueryParams) =>
  useList<LocationProduct>("loc-products", params);
export const useCreateLocationProduct = () => useCreate<LocationProduct>("loc-products");
export const useDeleteLocationProduct = () => useDelete("loc-products");

// ===== Container Inventories =====
export const useContainerInventories = (params?: QueryParams) =>
  useList<ContainerInventory>("container-inventories", params);

// ===== Period Closes =====
export const usePeriodCloses = (params?: QueryParams) =>
  useList<PeriodClose>("period-close", params);
export const useCreatePeriodClose = () => useCreate<PeriodClose>("period-close");

// ===== UOM =====
export function useUoms(params?: QueryParams) {
  return useList<{ id: string; code: string; name: string }>("uom", params);
}
export const useCreateUom = () => useCreate<{ id: string; code: string; name: string }>("uom");
export const useUpdateUom = () => useUpdate<{ id: string; code: string; name: string }>("uom");
export const useDeleteUom = () => useDelete("uom");

export function useConfirmSettlement() {
  const queryClient = useQueryClient();
  return useMutation<Settlement, Error, string>({
    mutationFn: async (id) => {
      const { data: wrapped } = await api.post(`/settlements/${id}/confirm`);
      return wrapped.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

// ===== Set Items =====
export const useSetItems = (params?: QueryParams) =>
  useList<any>("set-items", params);
export const useCreateSetItem = () => useCreate<any>("set-items");
export const useDeleteSetItem = () => useDelete("set-items");

// ===== Partner Products =====
export const usePartnerProducts = (params?: QueryParams) =>
  useList<any>("partner-products", params);
export const useCreatePartnerProduct = () => useCreate<any>("partner-products");
export const useDeletePartnerProduct = () => useDelete("partner-products");
