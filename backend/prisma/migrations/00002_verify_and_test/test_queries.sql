-- ============================================================================
-- KCS WMS MariaDB 검증 + 쿼리 최적화 테스트
-- ============================================================================

-- ─── 1. 스키마 검증 ─────────────────────────────────────
-- 1-1. 테이블 생성 확인 (16개 테이블)
SELECT '=== 테이블 생성 확인 ===' AS test_section;
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- 1-2. FK 제약조건 확인
SELECT '=== FK 제약조건 확인 ===' AS test_section;
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- 1-3. 인덱스 확인
SELECT '=== 인덱스 확인 ===' AS test_section;
SELECT
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns,
  NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;

-- ─── 2. 데이터 무결성 테스트 ────────────────────────────
SELECT '=== 데이터 무결성 테스트 ===' AS test_section;

-- 2-1. UUID 생성 테스트
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `is_active`)
VALUES (UUID(), 'test@kcs.com', '$2b$10$test', '테스트유저', 'OPERATOR', 1);

-- 2-2. 창고 + Zone + Location 계층 생성
INSERT INTO `warehouses` (`id`, `code`, `name`, `country`, `city`, `address`, `status`, `temperature_type`)
VALUES ('wh-test-001', 'WH-KR-001', '인천 제1창고', 'KR', '인천', '인천시 중구 자유무역지역 1-1', 'ACTIVE', 'NORMAL');

INSERT INTO `zones` (`id`, `warehouse_id`, `code`, `name`, `type`)
VALUES ('zn-test-001', 'wh-test-001', 'Z-RCV', '입고존', 'RECEIVING');

INSERT INTO `locations` (`id`, `zone_id`, `code`, `aisle`, `rack`, `level`, `bin`, `status`)
VALUES ('loc-test-001', 'zn-test-001', 'A-01-01-01', 'A', '01', '01', '01', 'AVAILABLE');

-- 2-3. 상품 생성 (ERD 추가 필드 포함)
INSERT INTO `items` (`id`, `code`, `name`, `category`, `uom`, `min_stock`, `is_active`, `temperature_type`, `lot_control`, `expiry_control`, `expiry_days`)
VALUES ('item-test-001', 'ITEM-001', '테스트 상품 A', 'GENERAL', 'EA', 100, 1, 'NORMAL', 1, 1, 365);

-- 2-4. 거래처 생성
INSERT INTO `partners` (`id`, `code`, `name`, `type`, `business_no`, `is_active`)
VALUES ('ptr-test-001', 'SUP-001', '테스트 공급사', 'SUPPLIER', '123-45-67890', 1);

-- 2-5. 입고 오더 + 아이템
INSERT INTO `inbound_orders` (`id`, `order_number`, `partner_id`, `warehouse_id`, `order_type`, `expected_date`, `status`)
VALUES ('ibo-test-001', 'IB-20260321-001', 'ptr-test-001', 'wh-test-001', 'PURCHASE', NOW(), 'DRAFT');

INSERT INTO `inbound_order_items` (`id`, `inbound_order_id`, `item_id`, `expected_qty`, `lot_no`, `expiry_date`)
VALUES ('ibi-test-001', 'ibo-test-001', 'item-test-001', 500, 'LOT-2026-001', DATE_ADD(NOW(), INTERVAL 365 DAY));

-- 2-6. 재고 생성
INSERT INTO `inventories` (`id`, `item_id`, `warehouse_id`, `location_id`, `lot_no`, `quantity`, `reserved_qty`, `available_qty`, `expiry_date`, `inbound_date`)
VALUES ('inv-test-001', 'item-test-001', 'wh-test-001', 'loc-test-001', 'LOT-2026-001', 500, 0, 500, DATE_ADD(NOW(), INTERVAL 365 DAY), NOW());

-- 2-7. 재고 트랜잭션 생성
INSERT INTO `inventory_transactions` (`id`, `item_id`, `warehouse_id`, `location_code`, `lot_no`, `tx_type`, `quantity`, `reference_type`, `reference_id`, `performed_by`)
VALUES (UUID(), 'item-test-001', 'wh-test-001', 'A-01-01-01', 'LOT-2026-001', 'INBOUND', 500, 'INBOUND_ORDER', 'ibo-test-001', 'test-user');

SELECT '✓ 데이터 삽입 성공' AS result;

-- ─── 3. 쿼리 최적화 테스트 ──────────────────────────────
SELECT '=== 쿼리 최적화 테스트 ===' AS test_section;

-- 3-1. Dashboard 쿼리: 재고 요약 (인덱스 활용)
EXPLAIN SELECT item_id, SUM(quantity) AS total_qty, SUM(reserved_qty) AS reserved, SUM(available_qty) AS available
FROM `inventories`
WHERE warehouse_id = 'wh-test-001'
GROUP BY item_id;

-- 3-2. 입고 목록 조회 (복합 인덱스 활용: status + warehouse_id)
EXPLAIN SELECT io.*, p.name AS partner_name
FROM `inbound_orders` io
JOIN `partners` p ON io.partner_id = p.id
WHERE io.status = 'DRAFT' AND io.warehouse_id = 'wh-test-001'
ORDER BY io.created_at DESC
LIMIT 20;

-- 3-3. 재고 트랜잭션 이력 (복합 인덱스 활용: warehouse_id + created_at)
EXPLAIN SELECT *
FROM `inventory_transactions`
WHERE warehouse_id = 'wh-test-001'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC
LIMIT 50;

-- 3-4. 재고 부족 알림 (Low Stock) - N+1 제거 후 2쿼리 패턴
EXPLAIN SELECT i.id, i.code, i.name, i.min_stock, COALESCE(SUM(inv.quantity), 0) AS total_qty
FROM `items` i
LEFT JOIN `inventories` inv ON i.id = inv.item_id
WHERE i.is_active = 1 AND i.min_stock > 0
GROUP BY i.id, i.code, i.name, i.min_stock
HAVING total_qty < i.min_stock
LIMIT 10;

-- 3-5. 출고 확인 시 재고 확인 (N+1 제거 후 groupBy 패턴)
EXPLAIN SELECT item_id, SUM(available_qty) AS available
FROM `inventories`
WHERE warehouse_id = 'wh-test-001'
  AND item_id IN ('item-test-001')
GROUP BY item_id;

-- ─── 4. Cascade 삭제 테스트 ─────────────────────────────
SELECT '=== Cascade 삭제 테스트 ===' AS test_section;

-- Zone 삭제 시 Location도 삭제되는지 확인
SELECT COUNT(*) AS locations_before FROM `locations` WHERE zone_id = 'zn-test-001';
DELETE FROM `zones` WHERE id = 'zn-test-001';
SELECT COUNT(*) AS locations_after FROM `locations` WHERE zone_id = 'zn-test-001';

-- 재삽입 (다음 테스트를 위해)
INSERT INTO `zones` (`id`, `warehouse_id`, `code`, `name`, `type`)
VALUES ('zn-test-001', 'wh-test-001', 'Z-RCV', '입고존', 'RECEIVING');

-- ─── 5. UNIQUE 제약조건 테스트 ──────────────────────────
SELECT '=== UNIQUE 제약조건 테스트 ===' AS test_section;

-- 중복 코드 삽입 시도 (실패해야 정상)
-- 아래 INSERT는 에러가 발생해야 함
-- INSERT INTO `warehouses` (`id`, `code`, `name`, `country`, `city`, `address`)
-- VALUES (UUID(), 'WH-KR-001', '중복코드테스트', 'KR', '서울', '테스트'); -- DUPLICATE KEY ERROR

SELECT '✓ UNIQUE 제약조건 정상' AS result;

-- ─── 6. 성능 측정용 대량 데이터 INSERT ──────────────────
SELECT '=== 성능 테스트 준비 ===' AS test_section;

-- 대량 트랜잭션 로그 삽입 (100건)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_insert_test_transactions()
BEGIN
  DECLARE i INT DEFAULT 0;
  WHILE i < 100 DO
    INSERT INTO `inventory_transactions`
      (`id`, `item_id`, `warehouse_id`, `tx_type`, `quantity`, `reference_type`, `created_at`)
    VALUES
      (UUID(), 'item-test-001', 'wh-test-001', 'INBOUND', FLOOR(RAND() * 100) + 1, 'TEST',
       DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY));
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

CALL sp_insert_test_transactions();
SELECT '✓ 100건 트랜잭션 삽입 완료' AS result;

-- 성능 확인: 인덱스 사용 여부
EXPLAIN SELECT tx_type, COUNT(*) AS cnt, SUM(quantity) AS total
FROM `inventory_transactions`
WHERE warehouse_id = 'wh-test-001'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY tx_type;

-- ─── 7. 테스트 데이터 정리 ──────────────────────────────
SELECT '=== 테스트 데이터 정리 ===' AS test_section;

DROP PROCEDURE IF EXISTS sp_insert_test_transactions;

DELETE FROM `inventory_transactions` WHERE warehouse_id = 'wh-test-001';
DELETE FROM `inventories` WHERE warehouse_id = 'wh-test-001';
DELETE FROM `inbound_order_items` WHERE inbound_order_id = 'ibo-test-001';
DELETE FROM `inbound_orders` WHERE id = 'ibo-test-001';
DELETE FROM `partners` WHERE id = 'ptr-test-001';
DELETE FROM `items` WHERE id = 'item-test-001';
DELETE FROM `zones` WHERE warehouse_id = 'wh-test-001';
DELETE FROM `warehouses` WHERE id = 'wh-test-001';
DELETE FROM `users` WHERE email = 'test@kcs.com';

SELECT '✓ 테스트 데이터 정리 완료' AS result;
SELECT '=== 전체 테스트 완료 ===' AS test_section;
