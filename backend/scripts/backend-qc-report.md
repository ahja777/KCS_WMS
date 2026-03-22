# KCS WMS Backend - QC Code Review Report

**검토일시:** 2026-03-22
**검토범위:** `/src` 전체 (44+ 파일, 16개 모듈)
**검토항목:** 코드 품질, NestJS 패턴, Prisma 최적화, 에러 핸들링, CRUD 완전성, DTO 검증, 보안

---

## 요약

| 심각도 | 발견 | 수정 완료 | 잔여 |
|--------|------|----------|------|
| CRITICAL | 13 | 9 | 4 |
| HIGH | 29 | 8 | 21 |
| MEDIUM | 43 | 0 | 43 |
| LOW | 35 | 0 | 35 |
| **합계** | **120** | **17** | **103** |

---

## CRITICAL 이슈 (13건)

### 수정 완료 (9건)

| # | 모듈 | 이슈 | 수정 내용 |
|---|------|------|----------|
| 1 | inbound | `generateOrderNumber` race condition | 재시도 루프 + 중복확인 방식으로 변경 |
| 2 | outbound | `generateOrderNumber` race condition | 동일 |
| 3 | inbound | `receive()`에서 주문아이템 소속 미검증 | `findFirst`로 `inboundOrderId: id` 조건 추가 |
| 4 | outbound | `pick()`에서 주문아이템 소속 미검증 | `findFirst`로 `outboundOrderId: id` 조건 추가 |
| 5 | auth | 회원가입 엔드포인트 인증 없음 | `@UseGuards(JwtAuthGuard)` 추가 |
| 6 | auth | 비밀번호 초기화 시 고정 임시비밀번호 | 12자리 랜덤 비밀번호 생성으로 변경 |
| 7 | external | 전체 외부채널 API 인증 없음 | `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` 추가 |
| 8 | warehouse | `deleteZone()` 참조 무결성 미검사 | 재고 존재 여부 확인 후 삭제 |
| 9 | warehouse | `deleteLocation()` 참조 무결성 미검사 | 재고 존재 여부 확인 후 삭제 |

### 미수정 (4건, 대규모 리팩토링 필요)

| # | 모듈 | 이슈 | 비고 |
|---|------|------|------|
| 10 | inventory-movement | `complete()`가 실제 재고를 이동하지 않음 | 전체 로직 구현 필요 |
| 11 | inventory-movement | `create()` 검증 로직 없음 | 창고/품목/재고 존재확인 필요 |
| 12 | inventory | `createAdjustment()`에서 locationCode 무시 | 위치별 재고 조회 로직 수정 필요 |
| 13 | auth | CORS origin localhost 하드코딩 | 환경변수 기반 설정으로 변경 필요 |

---

## HIGH 이슈 (29건)

### 수정 완료 (8건)

| # | 모듈 | 이슈 | 수정 내용 |
|---|------|------|----------|
| 1 | 전체 컨트롤러 (19개) | `@Param('id')` UUID 검증 누락 | 전체 `ParseUUIDPipe` 적용 |
| 2 | inbound DTO | items 배열 빈 배열 허용 | `@ArrayMinSize(1)` 추가 |
| 3 | outbound DTO | items 배열 빈 배열 허용 | `@ArrayMinSize(1)` 추가 |
| 4 | outbound DTO | `weight` 타입 검증 누락 | `@IsNumber()` + `@Min(0)` 추가 |
| 5 | settlement | update 시 deleteMany+create 비트랜잭션 | `$transaction()` 래핑 |
| 6 | dispatch | update 시 deleteMany+create 비트랜잭션 | `$transaction()` 래핑 |
| 7 | inventory-ext | `completeStockTransfer` 상태 미검증 | 상태 검사 + NotFoundException 추가 |
| 8 | inventory-ext | `deleteStockTransfer` 상태 미검증 | 완료된 이동 삭제 방지 |

### 미수정 (21건)

| # | 모듈 | 이슈 |
|---|------|------|
| 1 | auth | `LoginDto` 미사용 (Passport LocalStrategy 직접 처리) |
| 2 | auth | 로그인/등록 rate limiting 없음 |
| 3 | auth | JWT 7일 만료, refresh token/revocation 없음 |
| 4 | auth | `req: any` 타입 - `@CurrentUser()` 데코레이터 필요 |
| 5 | auth | HttpExceptionFilter 내부 에러 메시지 노출 |
| 6 | auth | `forbidNonWhitelisted: false` 보안 약화 |
| 7 | inbound | `delete()` 자식 레코드 cascade 미확인 |
| 8 | inbound | `findById()` 중복 호출 (매 mutation마다 2회 DB 접근) |
| 9 | outbound | `ship()` 재고 차감 시 예약분 소속 미검증 |
| 10 | outbound | `cancel()` 예약 해제 계산 불일치 가능 |
| 11 | outbound | Logger 미선언 |
| 12 | inventory | `completeCycleCount()` 음수 재고 무시 |
| 13 | inventory | `completeCycleCount()` availableQty 불일치 가능 |
| 14 | inventory-movement DTO | `warehouseId` @IsUUID 누락 (@IsString 사용) |
| 15 | item | `update()` code/barcode 중복 검사 누락 |
| 16 | warehouse DTO | `maxWeight/maxVolume` @IsNumber 누락 |
| 17 | inventory-ext | `createStockTransfer()` 출발지 재고 검증 누락 |
| 18 | external | route conflict: `GET orders/all` vs `GET :id` |
| 19 | external | `UpdateChannelDto` name 빈문자열 허용 |
| 20 | external-sync | `resolveItemMappings()` N+1 쿼리 |
| 21 | inventory | `getStockSummary()` 비원자적 이중 쿼리 |

---

## MEDIUM 이슈 주요 항목 (43건)

### 보안
- 전체 컨트롤러 역할 기반 권한제어(`@Roles`) 미적용
- `receivedBy`, `pickedBy`, `shippedBy` JWT에서 추출하지 않고 클라이언트 전송값 사용
- Export 엔드포인트 역할 제한 없음 (전체 데이터 노출 가능)
- Prisma 개발 로그에 비밀번호 해시 포함 쿼리 출력

### DTO 검증
- `status` 쿼리파라미터 enum 검증 없음 (입고/출고)
- `performedBy` optional (감사 추적 불완전)
- `TransferDto.quantity` @Min(1) 누락
- `StockAdjustmentDto.adjustQty` 0 허용
- inventory-ext `quantity` 음수/소수점 허용

### Prisma
- `where: any` 타입 사용 (auth, inventory, warehouse, export 등 다수)
- `Object.assign(query, ...)` DTO 직접 변조
- `getAdjustments/getCycleCounts` 페이지네이션 미지원 (hardcoded take:100)

### CRUD 누락
- Inventory: DELETE endpoint 없음
- Inventory: 조정/순환재고 상세조회 없음
- Inventory-movement: DELETE/UPDATE endpoint 없음
- Work-order: UPDATE/DELETE endpoint 없음
- UOM conversion: DELETE endpoint 없음
- OwnershipTransfer: 상세조회 endpoint 없음

### 비즈니스 로직
- 입출고 items 배열 중복 itemId 검증 없음
- Container 삭제 시 ContainerInventory 참조 미검사
- Dock 삭제 시 Dispatch 참조 미검사
- UOM conversion 중복 생성 가능
- Settlement totalAmount 클라이언트 값 그대로 저장 (서버 재계산 안함)
- 날짜 비교 시 timezone UTC/local 불일치

---

## 파일별 수정 이력

| 파일 | 수정 내용 |
|------|----------|
| `src/inbound/inbound.service.ts` | 주문번호 생성 race condition 수정, receive() 아이템 소속 검증 |
| `src/inbound/inbound.controller.ts` | ParseUUIDPipe 적용 |
| `src/inbound/dto/inbound.dto.ts` | @ArrayMinSize(1) 추가 |
| `src/outbound/outbound.service.ts` | 주문번호 생성 수정, pick() 아이템 소속 검증 |
| `src/outbound/outbound.controller.ts` | ParseUUIDPipe 적용 |
| `src/outbound/dto/outbound.dto.ts` | @ArrayMinSize(1), @IsNumber/@Min weight 추가 |
| `src/auth/auth.controller.ts` | register에 JwtAuthGuard 추가 |
| `src/auth/auth.service.ts` | 임시비밀번호 랜덤생성 |
| `src/external/external.controller.ts` | JwtAuthGuard + ApiBearerAuth 추가 |
| `src/warehouse/warehouse.service.ts` | zone/location 삭제 시 재고 참조 검사 |
| `src/settlement/settlement.service.ts` | update 트랜잭션 래핑 |
| `src/dispatch/dispatch.service.ts` | update 트랜잭션 래핑 |
| `src/inventory-ext/inventory-ext.service.ts` | 상태검증, NotFoundException 추가 |
| `src/*/controller.ts` (19개) | ParseUUIDPipe 일괄 적용 |

---

## 빌드 검증

```
$ npx nest build
✓ 에러 0건 - 빌드 성공
```

---

## 권장 후속 작업 (우선순위순)

1. **inventory-movement `complete()` 재고 이동 로직 구현** - 현재 상태만 변경하고 실제 재고를 이동하지 않음
2. **JWT refresh token + logout 구현** - 현재 7일간 취소 불가능한 토큰
3. **역할 기반 권한제어 (`@Roles`) 전체 적용** - 현재 인증만 있고 인가 없음
4. **rate limiting 추가** - 로그인 brute-force 방지
5. **`where: any` → Prisma typed 쿼리** - 타입 안전성 확보
6. **누락 CRUD 엔드포인트 추가** - inventory DELETE, work-order UPDATE/DELETE 등
