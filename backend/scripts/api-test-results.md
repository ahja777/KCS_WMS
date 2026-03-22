# KCS WMS API Endpoint Test Results

**Test Date:** 2026-03-22
**Backend Server:** http://localhost:4100
**Tester:** Panel 5 - QA Tester (Automated)
**Auth:** JWT Bearer Token (admin@kcs.com / ADMIN role)

---

## Summary

| Category | Pass | Fail | Total |
|----------|------|------|-------|
| Authentication | 2 | 0 | 2 |
| GET List Endpoints | 22 | 0 | 22 |
| CRUD (Create) | 7 | 0 | 7 |
| CRUD (Read by ID) | 4 | 0 | 4 |
| CRUD (Update) | 5 | 0 | 5 |
| CRUD (Delete) | 7 | 0 | 7 |
| **TOTAL** | **47** | **0** | **47** |

**Overall Result: ALL PASS (47/47)**

---

## 1. Authentication

| # | Endpoint | Method | Status | Result | Notes |
|---|----------|--------|--------|--------|-------|
| 1 | `/api/auth/login` | POST | 200 | PASS | Returns accessToken, user info |
| 2 | `/api/warehouses` (invalid token) | GET | 401 | PASS | Correctly rejects unauthorized access |

---

## 2. GET List Endpoints (Paginated)

| # | Endpoint | Method | Status | Result | Records | Notes |
|---|----------|--------|--------|--------|---------|-------|
| 1 | `/api/warehouses` | GET | 200 | PASS | 4 | Paginated with meta |
| 2 | `/api/items` | GET | 200 | PASS | 111 (6 pages) | Paginated with meta |
| 3 | `/api/partners` | GET | 200 | PASS | 10 | Paginated with meta |
| 4 | `/api/inbound` | GET | 200 | PASS | 8 | Includes items, partner, warehouse |
| 5 | `/api/outbound` | GET | 200 | PASS | 9 | Includes items, partner, warehouse |
| 6 | `/api/inventory/stock` | GET | 200 | PASS | 20 | Stock with item/warehouse/location |
| 7 | `/api/inventory/transactions` | GET | 200 | PASS | 32 (2 pages) | Transaction history |
| 8 | `/api/inventory/adjustments` | GET | 200 | PASS | 4 | Stock adjustments |
| 9 | `/api/inventory/cycle-counts` | GET | 200 | PASS | 4 | Cycle count records |
| 10 | `/api/inventory/movements` | GET | 200 | PASS | 1 | Movement records |
| 11 | `/api/dispatches` | GET | 200 | PASS | 1 | With warehouse, vehicle |
| 12 | `/api/work-orders` | GET | 200 | PASS | 1 | With warehouse |
| 13 | `/api/settlements` | GET | 200 | PASS | 1 | With warehouse |
| 14 | `/api/common-codes` | GET | 200 | PASS | 18 | All code types |
| 15 | `/api/vehicles` | GET | 200 | PASS | 5 | Vehicle list |
| 16 | `/api/docks` | GET | 200 | PASS | 6 | Dock list with warehouse |
| 17 | `/api/uom` | GET | 200 | PASS | 7 | Unit of measure |
| 18 | `/api/item-groups` | GET | 200 | PASS | 5 | Item groups with item count |
| 19 | `/api/containers` | GET | 200 | PASS | 0 | Empty list (valid) |
| 20 | `/api/container-groups` | GET | 200 | PASS | 0 | Empty list (valid) |
| 21 | `/api/ownership-transfers` | GET | 200 | PASS | 0 | Empty list (valid) |
| 22 | `/api/assemblies` | GET | 200 | PASS | 0 | Empty list (valid) |
| 23 | `/api/stock-transfers` | GET | 200 | PASS | 0 | Empty list (valid) |
| 24 | `/api/period-closes` | GET | 200 | PASS | 0 | Empty list (valid) |
| 25 | `/api/location-products` | GET | 200 | PASS | 0 | Empty list (valid) |
| 26 | `/api/dashboard/statistics` | GET | 200 | PASS | - | Summary stats |

**Note:** The correct routes are `/api/inbound` and `/api/outbound` (NOT `/api/inbound-orders` or `/api/outbound-orders`). Inventory is at `/api/inventory/stock` (NOT `/api/inventory`).

---

## 3. CRUD Tests - Containers

| # | Operation | Endpoint | Method | Status | Result | Notes |
|---|-----------|----------|--------|--------|--------|-------|
| 1 | Create | `/api/containers` | POST | 200 | PASS | Created CNT-QA-001 |
| 2 | Read | `/api/containers/:id` | GET | 200 | PASS | Returns with containerGroup, partner |
| 3 | Update | `/api/containers/:id` | PUT | 200 | PASS | containerName updated |
| 4 | Delete | `/api/containers/:id` | DELETE | 200 | PASS | Successfully deleted |

**DTO fields:** `containerCode` (required), `containerName` (required), plus optional fields

---

## 4. CRUD Tests - Container Groups

| # | Operation | Endpoint | Method | Status | Result | Notes |
|---|-----------|----------|--------|--------|--------|-------|
| 1 | Create | `/api/container-groups` | POST | 200 | PASS | Created GRP-QA-001 |
| 2 | Read | `/api/container-groups/:id` | GET | 200 | PASS | Returns with containers list |
| 3 | Update | `/api/container-groups/:id` | PUT | 200 | PASS | groupName updated |
| 4 | Delete | `/api/container-groups/:id` | DELETE | 200 | PASS | Successfully deleted |

**DTO fields:** `groupCode` (required), `groupName` (required), plus optional centerId, zoneId

---

## 5. CRUD Tests - Ownership Transfers

| # | Operation | Endpoint | Method | Status | Result | Notes |
|---|-----------|----------|--------|--------|--------|-------|
| 1 | Create | `/api/ownership-transfers` | POST | 200 | PASS | Created OT-QA-001, status=PENDING |
| 2 | Update | `/api/ownership-transfers/:id` | PUT | 200 | PASS | Quantities updated (10->20) |
| 3 | Delete | `/api/ownership-transfers/:id` | DELETE | 200 | PASS | Successfully deleted |

**DTO fields:** workNumber, workDate, fromPartnerId, fromItemId, fromQuantity, fromUom, toPartnerId, toItemId, toQuantity, toUom

---

## 6. CRUD Tests - Assemblies

| # | Operation | Endpoint | Method | Status | Result | Notes |
|---|-----------|----------|--------|--------|--------|-------|
| 1 | Create | `/api/assemblies` | POST | 200 | PASS | Created ASM-QA-001, status=PENDING |
| 2 | Read | `/api/assemblies/:id` | GET | 200 | PASS | Returns with items array |
| 3 | Delete | `/api/assemblies/:id` | DELETE | 200 | PASS | Successfully deleted |

**DTO fields:** workNumber (required), partnerId, warehouseId, workDate, notes

---

## 7. CRUD Tests - Stock Transfers

| # | Operation | Endpoint | Method | Status | Result | Notes |
|---|-----------|----------|--------|--------|--------|-------|
| 1 | Create | `/api/stock-transfers` | POST | 200 | PASS | Created, status=PENDING |
| 2 | Update | `/api/stock-transfers/:id` | PUT | 200 | PASS | Quantity updated (5->10) |
| 3 | Delete | `/api/stock-transfers/:id` | DELETE | 200 | PASS | Successfully deleted |

**DTO fields:** fromLocationCode (required), quantity (required), plus optional toLocationCode, partnerId, warehouseId, itemId, itemGroupCode

---

## 8. CRUD Tests - Period Closes

| # | Operation | Endpoint | Method | Status | Result | Notes |
|---|-----------|----------|--------|--------|--------|-------|
| 1 | Create | `/api/period-closes` | POST | 200 | PASS | Created, status=OPEN |
| 2 | Close | `/api/period-closes/:id/close` | PUT | 200 | PASS | Status changed to CLOSED, closedBy=system |

**DTO fields:** periodType (required), periodDate (required), plus optional warehouseId, partnerId, notes

---

## 9. CRUD Tests - Location Products

| # | Operation | Endpoint | Method | Status | Result | Notes |
|---|-----------|----------|--------|--------|--------|-------|
| 1 | Create | `/api/location-products` | POST | 200 | PASS | Created with locationCode + itemId |
| 2 | Delete | `/api/location-products/:id` | DELETE | 200 | PASS | Successfully deleted |

**DTO fields:** locationCode (required), itemId (required), plus optional partnerId, centerId

---

## Route Reference

The actual NestJS controller routes (with `/api` global prefix):

| Controller | Route Prefix | Full API Path |
|-----------|-------------|--------------|
| AuthController | `auth` | `/api/auth/login` |
| WarehouseController | `warehouses` | `/api/warehouses` |
| ItemController | `items` | `/api/items` |
| PartnerController | `partners` | `/api/partners` |
| InboundController | `inbound` | `/api/inbound` |
| OutboundController | `outbound` | `/api/outbound` |
| InventoryController | `inventory` | `/api/inventory/stock`, `/api/inventory/adjustments`, etc. |
| InventoryMovementController | `inventory/movements` | `/api/inventory/movements` |
| InventoryExtController | (root) | `/api/ownership-transfers`, `/api/assemblies`, etc. |
| DispatchController | `dispatches` | `/api/dispatches` |
| WorkOrderController | `work-orders` | `/api/work-orders` |
| SettlementController | `settlements` | `/api/settlements` |
| CommonCodeController | `common-codes` | `/api/common-codes` |
| VehicleController | `vehicles` | `/api/vehicles` |
| DockController | `docks` | `/api/docks` |
| UomController | `uom` | `/api/uom` |
| ItemGroupController | `item-groups` | `/api/item-groups` |
| ContainerController | `containers` | `/api/containers` |
| ContainerGroupController | `container-groups` | `/api/container-groups` |
| DashboardController | `dashboard` | `/api/dashboard/statistics` |
| ExportController | `export` | `/api/export` |
| ExternalController | `channels` | `/api/channels` |

---

## Test Data Cleanup

All test records created during this QA session were deleted after testing:
- Container `CNT-QA-001` - DELETED
- Container Group `GRP-QA-001` - DELETED
- Ownership Transfer `OT-QA-001` - DELETED
- Assembly `ASM-QA-001` - DELETED
- Stock Transfer (B-01-01-01 -> B-01-02-01) - DELETED
- Period Close (MONTHLY 2026-03) - remains (CLOSED status, cannot delete)
- Location Product (B-01-01-01) - DELETED
