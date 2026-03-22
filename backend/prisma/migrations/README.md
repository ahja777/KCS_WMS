# KCS WMS Database Migration

## Overview

PostgreSQL → MariaDB 마이그레이션 (ERD 기반 스키마 보강 포함)

## Migration History

| Version | Description | Date |
|---------|-------------|------|
| 00001_init_mariadb | MariaDB 초기 스키마 생성 (16 테이블) | 2026-03-21 |
| 00002_verify_and_test | 검증 + 쿼리 최적화 테스트 SQL | 2026-03-21 |

## ERD 기반 변경사항

### Global WMS ERD → 반영

| ERD 테이블 | 반영 위치 | 추가 필드 |
|-----------|----------|----------|
| WMSOP010 (주문) | InboundOrder/OutboundOrder | `orderType` |
| WMSOP041 (입고상세) | InboundOrderItem | `lotNo`, `expiryDate` |
| WMSMS030 (상품) | Item | `temperatureType`, `lotControl`, `expiryControl`, `expiryDays`, `storageType` |
| WMSST010 (재고) | Inventory | `expiryDate`, `inboundDate` |
| WMSST050 (재고조정) | StockAdjustment | 기존 유지 |
| WMSST070 (재고실사) | CycleCount | 기존 유지 |

### HILO ERD → 반영

| ERD 테이블 | 반영 위치 | 추가 필드 |
|-----------|----------|----------|
| ILDEPOT | Warehouse | `temperatureType`, `isBonded`, `latitude`, `longitude` |
| ILITEM | Item | `temperatureType`, `lotControl`, `expiryControl` |
| ILCARRIER/ILOWNER | Partner | `businessNo`, `president` |
| ILORGTRANSORDER | InboundOrder/OutboundOrder | `orderType`, `createdBy` |

## Quick Start

```bash
# 1. MariaDB 설정 + 마이그레이션 + 테스트 (한 번에)
bash scripts/db-setup.sh

# 2. 또는 수동 실행
npx prisma generate          # Prisma 클라이언트 생성
npx prisma db push           # 스키마 동기화
npx ts-node prisma/seed.ts   # 테스트 데이터

# 3. E2E 테스트
npx jest test/db-migration.test.ts --runInBand
```

## Schema Changes (PostgreSQL → MariaDB)

### Provider 변경
```prisma
// Before
datasource db { provider = "postgresql" }

// After
datasource db { provider = "mysql" }
```

### 주요 차이점
- `@db.VarChar(N)` 명시 (MariaDB 최적화)
- `@db.Text` for notes/description (VARCHAR(65535) 대체)
- `DATETIME(3)` 밀리초 정밀도
- `ON UPDATE CURRENT_TIMESTAMP(3)` 자동 갱신
- `utf8mb4_unicode_ci` 문자셋/정렬

## Index Strategy

### 제거된 중복 인덱스 (7개)
- `Zone.[warehouseId]` → `@@unique([warehouseId, code])`가 커버
- `Location.[zoneId]` → `@@unique([zoneId, code])`가 커버
- `Inventory.[itemId]` → unique composite가 커버
- `Inventory.[itemId, warehouseId]` → `@@index([warehouseId, itemId])`로 통합
- `InboundOrder.[status]` → `@@index([status, warehouseId])`가 커버
- `OutboundOrder.[status]` → `@@index([status, warehouseId])`가 커버
- `CycleCount.[warehouseId]` → `@@index([warehouseId, status])`가 커버

### 추가된 인덱스 (1개)
- `Inventory.[warehouseId, itemId]` - 출고 확인 시 재고 조회 최적화

## Query Optimizations Applied

### 1. Dashboard N+1 제거 (Critical)
- **Before**: activeItems 수 × 개별 aggregate (최대 수백 쿼리)
- **After**: 2 쿼리 (items findMany + inventory groupBy)

### 2. Dashboard 병렬화 (High)
- **Before**: 10개 쿼리 순차 실행
- **After**: Promise.all() 병렬 실행

### 3. Outbound confirm() N+1 제거 (Medium)
- **Before**: 아이템 수 × 개별 aggregate
- **After**: 1 groupBy 쿼리

## Rollback

```bash
# MariaDB → PostgreSQL 롤백
# 1. .env 복원
DATABASE_URL=postgresql://clip_user:clip_dev_password_2024@localhost:5432/kcs_wms_db

# 2. schema.prisma provider 복원
datasource db { provider = "postgresql" }

# 3. Prisma 재생성
npx prisma generate
npx prisma db push
```
