# KCS WMS API 연동 QC 리포트

**작성일:** 2026-03-22
**대상:** Frontend ↔ Backend API 연동 전체 검증

---

## 1. API Base URL 확인

| 항목 | 값 | 상태 |
|------|-----|------|
| Frontend API Base | `http://localhost:4100/api` | **OK** (하드코딩) |
| 파일 위치 | `frontend/src/lib/api.ts:4` | |
| Backend Port | `4100` (`backend/src/main.ts`) | **OK** |
| Frontend Port | `3200` (`frontend/package.json`) | **OK** |

---

## 2. URL 불일치 수정 내역

| Frontend Hook | Frontend URL (Before) | Backend URL | 수정 후 | 상태 |
|---------------|----------------------|-------------|---------|------|
| `useLocationProducts` | `/loc-products` | `/location-products` | `/location-products` | **FIXED** |
| `useCreateLocationProduct` | `/loc-products` | `/location-products` | `/location-products` | **FIXED** |
| `useDeleteLocationProduct` | `/loc-products` | `/location-products` | `/location-products` | **FIXED** |
| `usePeriodCloses` | `/period-close` | `/period-closes` | `/period-closes` | **FIXED** |
| `useCreatePeriodClose` | `/period-close` | `/period-closes` | `/period-closes` | **FIXED** |

---

## 3. Frontend ↔ Backend 엔드포인트 매칭 현황

### 3.1 완전 매칭 (OK)

| 영역 | Frontend Hooks | Backend Controller | 매칭 상태 |
|------|---------------|-------------------|-----------|
| Auth/Users | 4 hooks | `AuthController` (8 routes) | **OK** |
| Warehouses | 5 hooks | `WarehouseController` (5 routes) | **OK** |
| Zones | 4 hooks | `WarehouseController` (4 routes) | **OK** |
| Locations | 4 hooks | `WarehouseController` (4 routes) | **OK** |
| Items | 5 hooks | `ItemController` (6 routes) | **OK** |
| Partners | 5 hooks | `PartnerController` (5 routes) | **OK** |
| Inbound | 7 hooks | `InboundController` (9 routes) | **OK** |
| Outbound | 8 hooks | `OutboundController` (10 routes) | **OK** |
| Inventory | 4 hooks | `InventoryController` (10 routes) | **OK** |
| Inventory Movements | 4 hooks | `InventoryMovementController` (5 routes) | **OK** |
| Stock Adjustments | 2 hooks | `InventoryController` (2 routes) | **OK** |
| Cycle Counts | 3 hooks | `InventoryController` (3 routes) | **OK** |
| Common Codes | 4 hooks | `CommonCodeController` (5 routes) | **OK** |
| Vehicles | 4 hooks | `VehicleController` (5 routes) | **OK** |
| Docks | 4 hooks | `DockController` (5 routes) | **OK** |
| Item Groups | 4 hooks | `ItemGroupController` (5 routes) | **OK** |
| UOM | 4 hooks | `UomController` (7 routes) | **OK** |
| Containers | 5 hooks | `ContainerController` (5 routes) | **OK** |
| Container Groups | 4 hooks | `ContainerGroupController` (5 routes) | **OK** |
| Container Inventories | 1 hook | `InventoryExtController` (1 route) | **OK** |
| Ownership Transfers | 3 hooks | `InventoryExtController` (4 routes) | **OK** |
| Assemblies | 3 hooks | `InventoryExtController` (5 routes) | **OK** |
| Stock Transfers | 4 hooks | `InventoryExtController` (5 routes) | **OK** |
| Location Products | 3 hooks | `InventoryExtController` (3 routes) | **OK** |
| Period Closes | 2 hooks | `InventoryExtController` (4 routes) | **OK** |
| Set Items | 3 hooks | `InventoryExtController` (3 routes) | **OK** |
| Partner Products | 3 hooks | `InventoryExtController` (3 routes) | **OK** |
| Work Orders | 5 hooks | `WorkOrderController` (6 routes) | **OK** |
| Settlements | 5 hooks | `SettlementController` (6 routes) | **OK** |
| Dispatches | 3 hooks | `DispatchController` (7 routes) | **OK** |
| Dashboard | 1 hook | `DashboardController` (1 route) | **OK** |

### 3.2 신규 추가 (이번 QC에서 구현)

| 영역 | Frontend Hooks | Backend Controller | 화면설계서 ID |
|------|---------------|-------------------|--------------|
| **Roles** | 5 hooks (CRUD) | `RoleController` (5 routes) | TMSYS050 |
| **Programs** | 5 hooks (CRUD) | `ProgramController` (5 routes) | TMSYS040 |
| **RolePrograms** | 4 hooks (CRUD) | `RoleProgramController` (4 routes) | TMSYS060-080 |
| **Multilingual** | 4 hooks (CRUD) | `MultilingualController` (4 routes) | WMSYS020 |
| **Templates** | 5 hooks (CRUD) | `TemplateController` (5 routes) | WMSTP010 |
| **WorkPolicy** | 4 hooks (CRUD) | `WorkPolicyController` (4 routes) | WMSMS020 |
| **Helpdesk** | 5 hooks (CRUD) | `HelpdeskController` (5 routes) | TMSYS130 |
| **SettlementRate** | 4 hooks (CRUD) | `SettlementRateController` (4 routes) | WMSAC010 |

---

## 4. Frontend Types ↔ Prisma Schema 검증

### 4.1 수정된 타입

| Type | 추가된 필드 | Prisma Model 매칭 |
|------|-----------|------------------|
| `User` | `company?, duty?, phone?, mobile?` | **OK** |
| `OutboundOrder` | `orderSeq?, deliveryTo?, blNo?, isUrgent?` | **OK** |
| `OutboundOrderLine` | `defectiveQty` | **OK** |

### 4.2 신규 추가된 타입

| Frontend Type | Prisma Model | 필드 매칭 |
|---------------|-------------|-----------|
| `Role` | `Role` | **OK** (7 fields) |
| `Program` | `Program` | **OK** (10 fields) |
| `RoleProgram` | `RoleProgram` | **OK** (8 fields) |
| `Multilingual` | `Multilingual` | **OK** (6 fields) |
| `Template` | `Template` | **OK** (9 fields + columns) |
| `TemplateColumn` | `TemplateColumn` | **OK** (14 fields) |
| `WorkPolicy` | `WorkPolicy` | **OK** (15 fields) |
| `Helpdesk` | `Helpdesk` | **OK** (12 fields) |
| `SettlementRate` | `SettlementRate` | **OK** (11 fields) |

### 4.3 기존 타입-스키마 매칭 상태

| Frontend Type | Prisma Model | 상태 |
|---------------|-------------|------|
| Warehouse | Warehouse | **OK** |
| Zone | Zone | **OK** |
| Location | Location | **OK** |
| Item | Item | **OK** |
| Partner | Partner | **OK** |
| InboundOrder | InboundOrder | **OK** |
| InboundOrderLine | InboundOrderItem | **OK** |
| OutboundOrder | OutboundOrder | **OK** |
| OutboundOrderLine | OutboundOrderItem | **OK** |
| Inventory | Inventory | **OK** |
| InventoryTransaction | InventoryTransaction | **OK** |
| StockAdjustment | StockAdjustment | **OK** |
| CycleCount | CycleCount | **OK** |
| CommonCode | CommonCode | **OK** |
| Vehicle | Vehicle | **OK** |
| Dock | Dock | **OK** |
| ItemGroup | ItemGroup | **OK** |
| Settlement | Settlement | **OK** |
| WorkOrder | WorkOrder | **OK** |
| Container | Container | **OK** |
| ContainerGroup | ContainerGroup | **OK** |
| ContainerInventory | ContainerInventory | **OK** |
| OwnershipTransfer | OwnershipTransfer | **OK** |
| Assembly | Assembly | **OK** |
| StockTransfer | StockTransfer | **OK** |
| LocationProduct | LocationProduct | **OK** |
| PeriodClose | PeriodClose | **OK** |

---

## 5. 화면설계서 화면 ↔ API 매핑

| Slide | 화면명 | 화면ID | API 엔드포인트 | 상태 |
|-------|-------|--------|---------------|------|
| 7 | 기준관리 | TMSYS010 | GET /common-codes | **OK** |
| 8 | 권한관리 | TMSYS020 | GET /roles, /role-programs | **NEW** |
| 13 | 사용자관리 | TMSYS030 | GET /auth/users | **OK** |
| 16 | 입출고현황 | WMSOP010 | GET /inbound, /outbound | **OK** |
| 17 | 입고리스트 | WMSOP020 | GET /inbound | **OK** |
| 18 | 입고등록 | WMSOP999 | POST /inbound | **OK** |
| 19 | 입고확정 | WMSOP020 | POST /inbound/:id/confirm | **OK** |
| 20 | 템플릿입력(입고) | WMSTP010 | GET /templates | **NEW** |
| 21 | 출고리스트 | WMSOP030 | GET /outbound | **OK** |
| 22 | 출고등록 | WMSOP999 | POST /outbound | **OK** |
| 23 | 출고확정 | WMSOP030 | POST /outbound/:id/confirm | **OK** |
| 25 | 템플릿입력(출고) | WMSTP010 | GET /templates | **NEW** |
| 27 | 배차작업 | WMSOP050 | GET /dispatches | **OK** |
| 28 | 입고작업지시서 | TMSYS999 | GET /work-orders | **OK** |
| 29 | 피킹리스트 | TMSYS999 | GET /work-orders?type=PICKING | **OK** |
| 30 | 상차리스트 | TMSYS999 | GET /work-orders?type=LOADING | **OK** |
| 31 | 현재고조회 | WMSST010 | GET /inventory/stock | **OK** |
| 32 | 용기재고조회 | WMSST011 | GET /container-inventories | **OK** |
| 33 | 재고입출고내역 | WMSST020 | GET /inventory/transactions | **OK** |
| 34 | 재고이동현황 | WMSST040 | GET /inventory/movements | **OK** |
| 36 | 재고실사 | WMSST060 | GET /inventory/cycle-counts | **OK** |
| 37 | 명의변경 | WMSST100 | GET /ownership-transfers | **OK** |
| 39 | 임가공 | WMSST070 | GET /assemblies | **OK** |
| 41 | 재고조정 | WMSST050 | GET /inventory/adjustments | **OK** |
| 44 | 유효기간경고 | WMSTG050 | GET /inventory/stock (expiryDate filter) | **OK** |
| 46 | 물류센터정보 | WMSMS030 | GET /warehouses | **OK** |
| 48 | 로케이션정보 | WMSMS080 | GET /warehouses/:id/zones/:id/locations | **OK** |
| 49 | 화주정보 | WMSMS010 | GET /partners | **OK** |
| 50 | 매출거래처정보 | WMSMS011 | GET /partners?type=CUSTOMER | **OK** |
| 51 | 상품정보 | WMSMS090 | GET /items | **OK** |
| 53 | UOM정보 | WMSMS100 | GET /uom | **OK** |
| 54 | 도크장정보 | WMSMS120 | GET /docks | **OK** |
| 55 | 차량관리 | WMSMS050 | GET /vehicles | **OK** |
| 59 | 상품군관리 | WMSMS094 | GET /item-groups | **OK** |
| 60 | 물류용기관리 | WMSPL010 | GET /containers | **OK** |
| 61 | 물류용기군관리 | WMSPL020 | GET /container-groups | **OK** |
| 62 | 화주별거래처상품 | WMSMS095 | GET /partner-products | **OK** |
| - | 센터별작업정책 | WMSMS020 | GET /work-policies | **NEW** |
| - | 프로그램관리 | TMSYS040 | GET /programs | **NEW** |
| - | 다국어관리 | WMSYS020 | GET /multilinguals | **NEW** |
| - | HelpDesk | TMSYS130 | GET /helpdesks | **NEW** |
| - | 정산단가관리 | WMSAC010 | GET /settlement-rates | **NEW** |
| - | 정산산출 | WMSAC020 | GET /settlements | **OK** |
| - | 마감관리 | WMSMS130 | GET /period-closes | **OK** |

---

## 6. 총 API 통계

| 항목 | 수량 |
|------|------|
| Backend Controllers | **30개** (기존 22 + 신규 8) |
| Backend API Routes | **200+** |
| Frontend API Hooks | **180+** (기존 144 + 신규 36) |
| Frontend Types | **38개** (기존 29 + 신규 9) |
| URL 불일치 수정 | **5건** |
| 신규 구현 (BE+FE) | **8개 엔드포인트 그룹** |
| 화면설계서 매칭율 | **100%** (전체 화면 커버) |

---

## 7. 결론

### PASS 항목
- [x] API BaseURL `http://localhost:4100/api` 하드코딩 확인
- [x] 모든 기존 Frontend Hook ↔ Backend Endpoint 매칭 확인
- [x] Frontend Types ↔ Prisma Schema 모델 일치 확인
- [x] 화면설계서 전체 화면에 대한 API 구현 확인

### 수정 완료
- [x] URL 불일치 5건 수정 (loc-products → location-products, period-close → period-closes)
- [x] 신규 8개 테이블 백엔드 컨트롤러 구현
- [x] 신규 8개 테이블 프론트엔드 API 훅 추가
- [x] 신규 9개 타입 정의 추가
- [x] User, OutboundOrder, OutboundOrderLine, ItemGroup, PartnerProduct 타입 확장
