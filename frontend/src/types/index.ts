// ===== Enums / Union Types =====

export type WarehouseStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type PartnerType = "SUPPLIER" | "CUSTOMER" | "CARRIER";

export type InboundStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "ARRIVED"
  | "RECEIVING"
  | "COMPLETED"
  | "CANCELLED";

export type OutboundStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PICKING"
  | "PACKING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type UserRole = "ADMIN" | "MANAGER" | "OPERATOR" | "VIEWER";

export type ItemCategory =
  | "GENERAL"
  | "ELECTRONICS"
  | "CLOTHING"
  | "FOOD"
  | "FRAGILE"
  | "HAZARDOUS"
  | "OVERSIZED";

export type UnitOfMeasure = "EA" | "BOX" | "PALLET" | "CASE" | "KG" | "LB";

export type TransactionType =
  | "INBOUND"
  | "OUTBOUND"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "TRANSFER"
  | "CYCLE_COUNT"
  | "RETURN";

export type AdjustmentReason =
  | "DAMAGE"
  | "LOSS"
  | "FOUND"
  | "CORRECTION"
  | "RETURN"
  | "EXPIRED";

export type CycleCountStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type ZoneType =
  | "RECEIVING"
  | "STORAGE"
  | "PICKING"
  | "PACKING"
  | "SHIPPING"
  | "STAGING"
  | "RETURNS";

export type LocationStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BLOCKED";

// ===== Models =====

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  address: string;
  zipCode?: string;
  timezone: string;
  status: WarehouseStatus;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  barcode: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  uom: UnitOfMeasure;
  isActive: boolean;
  minStock: number;
  maxStock: number | null;
  unitPrice?: number;
  storageType?: string;
  inboundZone?: string;
  lotControl?: boolean;
  expiryControl?: boolean;
  expiryDays?: number;
  itemGroupId?: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  type: PartnerType;
  country?: string;
  city?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  type: ZoneType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  zoneId: string;
  code: string;
  aisle: string;
  rack: string;
  level: string;
  bin: string;
  status: LocationStatus;
  maxWeight?: number;
  maxVolume?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InboundOrderLine {
  id: string;
  itemId: string;
  item?: Item;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  lotNumber?: string;
  expiryDate?: string;
}

export interface InboundOrder {
  id: string;
  orderNumber: string;
  warehouseId: string;
  warehouse?: Warehouse;
  partnerId: string;
  partner?: Partner;
  status: InboundStatus;
  expectedDate: string;
  arrivedDate?: string;
  completedDate?: string;
  lines: InboundOrderLine[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboundReceipt {
  id: string;
  inboundOrderId: string;
  inboundOrder?: InboundOrder;
  receiptNumber: string;
  receivedDate: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundOrderLine {
  id: string;
  itemId: string;
  item?: Item;
  orderedQty: number;
  pickedQty: number;
  packedQty: number;
  shippedQty: number;
  lotNumber?: string;
}

export interface OutboundOrder {
  id: string;
  orderNumber: string;
  warehouseId: string;
  warehouse?: Warehouse;
  partnerId: string;
  partner?: Partner;
  status: OutboundStatus;
  shipDate?: string;
  deliveryDate?: string;
  completedDate?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  lines: OutboundOrderLine[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundShipment {
  id: string;
  outboundOrderId: string;
  outboundOrder?: OutboundOrder;
  shipmentNumber: string;
  shippedDate: string;
  carrier?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  itemId: string;
  item?: Item;
  quantity: number;
  availableQty: number;
  reservedQty: number;
  locationCode: string;
  lotNumber?: string;
  expiryDate?: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  warehouseId: string;
  itemId: string;
  item?: Item;
  type: TransactionType;
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  warehouseId: string;
  itemId: string;
  item?: Item;
  reason: AdjustmentReason;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  notes?: string;
  adjustedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CycleCount {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  status: CycleCountStatus;
  plannedDate: string;
  completedDate?: string;
  countedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Work Order Types =====

export type WorkOrderType =
  | "INBOUND"
  | "PUTAWAY"
  | "PICKING"
  | "PACKING"
  | "LOADING"
  | "MOVE"
  | "CYCLE_COUNT";

export type WorkOrderStatus = "CREATED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";

export interface WorkOrder {
  id: string;
  orderNumber: string;
  type: WorkOrderType;
  warehouseId: string;
  warehouse?: Warehouse;
  assignee?: string;
  status: WorkOrderStatus;
  items?: WorkOrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderItem {
  id: string;
  itemId: string;
  item?: Item;
  quantity: number;
  completedQty?: number;
  locationCode?: string;
}

// ===== Vehicle =====

export interface Vehicle {
  id: string;
  plateNumber: string;
  tonnage: number;
  type: string;
  driverName: string;
  driverPhone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Dock =====

export interface Dock {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouse?: Warehouse;
  maxTonnage: number;
  vehiclePlateNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Item Group =====

export interface ItemGroup {
  id: string;
  code: string;
  name: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Common Code =====

export interface CommonCode {
  id: string;
  groupCode: string;
  groupName?: string;
  code: string;
  codeName: string;
  value?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Settlement =====

export type SettlementStatus = "DRAFT" | "CALCULATED" | "CONFIRMED" | "BILLED";

export interface SettlementDetail {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Settlement {
  id: string;
  settlementNumber: string;
  partnerId: string;
  partner?: Partner;
  warehouseId: string;
  warehouse?: Warehouse;
  periodFrom: string;
  periodTo: string;
  totalAmount: number;
  status: SettlementStatus;
  details: SettlementDetail[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Container =====

export interface Container {
  id: string;
  containerCode: string;
  containerName: string;
  containerGroupId?: string;
  containerGroup?: ContainerGroup;
  partnerId?: string;
  partner?: { id: string; code: string; name: string };
  inboundWarehouseCode?: string;
  inboundZone?: string;
  shelfLife?: number;
  shelfLifeDays?: number;
  weight?: number;
  size?: string;
  notes?: string;
  optimalStock?: number;
  stockUnit?: string;
  isActive: boolean;
  optimalStockDays?: number;
  expiryDays?: number;
  unitPrice?: number;
  assetType?: string;
  tagPrefix?: string;
  companyEpcCode?: string;
  barcode?: string;
  weightToleranceKg?: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Container Group =====

export interface ContainerGroup {
  id: string;
  groupCode: string;
  groupName: string;
  centerId?: string;
  zoneId?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Ownership Transfer =====

export interface OwnershipTransfer {
  id: string;
  transferNumber: string;
  warehouseId: string;
  warehouse?: Warehouse;
  itemId: string;
  item?: Item;
  fromPartnerId: string;
  fromPartner?: Partner;
  toPartnerId: string;
  toPartner?: Partner;
  quantity: number;
  lotNumber?: string;
  locationCode?: string;
  notes?: string;
  transferredBy?: string;
  transferDate: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Assembly =====

export interface AssemblyItem {
  id: string;
  assemblyId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  type: "INPUT" | "OUTPUT";
}

export interface Assembly {
  id: string;
  assemblyNumber: string;
  warehouseId: string;
  warehouse?: Warehouse;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  items: AssemblyItem[];
  notes?: string;
  assembledBy?: string;
  assemblyDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Stock Transfer =====

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouse?: Warehouse;
  toWarehouseId: string;
  toWarehouse?: Warehouse;
  itemId: string;
  item?: Item;
  quantity: number;
  status: "DRAFT" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  fromLocationCode?: string;
  toLocationCode?: string;
  lotNumber?: string;
  notes?: string;
  transferredBy?: string;
  transferDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Location Product =====

export interface LocationProduct {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  locationCode: string;
  itemId: string;
  item?: Item;
  priority?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Period Close =====

export interface PeriodClose {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  periodFrom: string;
  periodTo: string;
  status: "OPEN" | "CLOSED" | "LOCKED";
  closedBy?: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Container Inventory =====

export interface ContainerInventory {
  id: string;
  partnerId?: string;
  partnerCode?: string;
  partnerName?: string;
  containerCode: string;
  containerName?: string;
  containerGroup?: string;
  normalStock: number;
  stockUnit?: string;
  optimalStock?: number;
  locationCode?: string;
  warehouseId?: string;
  warehouseName?: string;
  workDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== API Types =====

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Backend auth service returns { user, accessToken } (camelCase).
// Backend does NOT return a refreshToken or have a refresh endpoint.
// The TransformInterceptor wraps this in { success, data, timestamp }.
export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface DashboardSummary {
  inventory: {
    totalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    inventoryRecords: number;
    uniqueItemsInStock: number;
  };
  inbound: {
    byStatus: Partial<Record<InboundStatus, number>>;
    recentCount: number;
    pendingCount: number;
  };
  outbound: {
    byStatus: Partial<Record<OutboundStatus, number>>;
    recentCount: number;
    pendingCount: number;
  };
  alerts: {
    lowStockItems: {
      id: string;
      code: string;
      name: string;
      minStock: number;
      totalQty: number;
    }[];
    recentTransactions: number;
  };
  warehouses: {
    activeCount: number;
  };
}

export interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  createdAt: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}
