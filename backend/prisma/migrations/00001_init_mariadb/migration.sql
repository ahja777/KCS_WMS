-- ============================================================================
-- KCS WMS MariaDB Migration Script v1.0
-- ERD 기반 스키마: Global WMS + HILO ERD 분석 반영
-- Target: MariaDB 10.6+
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET CHARACTER SET utf8mb4;

-- ─── 1. Users ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`         VARCHAR(36) NOT NULL,
  `email`      VARCHAR(100) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `name`       VARCHAR(50) NOT NULL,
  `role`       ENUM('ADMIN','MANAGER','OPERATOR','VIEWER') NOT NULL DEFAULT 'OPERATOR',
  `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 2. Warehouses (ILDEPOT 참조) ──────────────────────
CREATE TABLE IF NOT EXISTS `warehouses` (
  `id`               VARCHAR(36) NOT NULL,
  `code`             VARCHAR(20) NOT NULL,
  `name`             VARCHAR(100) NOT NULL,
  `country`          VARCHAR(50) NOT NULL,
  `city`             VARCHAR(50) NOT NULL,
  `address`          VARCHAR(255) NOT NULL,
  `zip_code`         VARCHAR(20) DEFAULT NULL,
  `timezone`         VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `status`           ENUM('ACTIVE','INACTIVE','MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
  `temperature_type` ENUM('NORMAL','COLD','FROZEN') NOT NULL DEFAULT 'NORMAL',
  `is_bonded`        TINYINT(1) NOT NULL DEFAULT 0,
  `contact_name`     VARCHAR(50) DEFAULT NULL,
  `contact_phone`    VARCHAR(30) DEFAULT NULL,
  `contact_email`    VARCHAR(100) DEFAULT NULL,
  `latitude`         DOUBLE DEFAULT NULL,
  `longitude`        DOUBLE DEFAULT NULL,
  `notes`            TEXT DEFAULT NULL,
  `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouses_code` (`code`),
  KEY `idx_warehouses_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. Zones ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `zones` (
  `id`           VARCHAR(36) NOT NULL,
  `warehouse_id` VARCHAR(36) NOT NULL,
  `code`         VARCHAR(20) NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `type`         ENUM('RECEIVING','STORAGE','PICKING','PACKING','SHIPPING','QUARANTINE','RETURN') NOT NULL DEFAULT 'STORAGE',
  `description`  VARCHAR(255) DEFAULT NULL,
  `created_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_zones_warehouse_code` (`warehouse_id`, `code`),
  CONSTRAINT `fk_zones_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 4. Locations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `locations` (
  `id`         VARCHAR(36) NOT NULL,
  `zone_id`    VARCHAR(36) NOT NULL,
  `code`       VARCHAR(30) NOT NULL,
  `aisle`      VARCHAR(10) NOT NULL,
  `rack`       VARCHAR(10) NOT NULL,
  `level`      VARCHAR(10) NOT NULL,
  `bin`        VARCHAR(10) NOT NULL,
  `status`     ENUM('AVAILABLE','OCCUPIED','RESERVED','BLOCKED') NOT NULL DEFAULT 'AVAILABLE',
  `max_weight` DOUBLE DEFAULT NULL,
  `max_volume` DOUBLE DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_locations_zone_code` (`zone_id`, `code`),
  KEY `idx_locations_status` (`status`),
  CONSTRAINT `fk_locations_zone` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 5. Items (ILITEM + WMSMS030 참조) ─────────────────
CREATE TABLE IF NOT EXISTS `items` (
  `id`               VARCHAR(36) NOT NULL,
  `code`             VARCHAR(30) NOT NULL,
  `name`             VARCHAR(200) NOT NULL,
  `description`      TEXT DEFAULT NULL,
  `barcode`          VARCHAR(50) DEFAULT NULL,
  `category`         ENUM('GENERAL','ELECTRONICS','CLOTHING','FOOD','FRAGILE','HAZARDOUS','OVERSIZED') NOT NULL DEFAULT 'GENERAL',
  `uom`              ENUM('EA','BOX','PALLET','CASE','KG','LB') NOT NULL DEFAULT 'EA',
  `weight`           DOUBLE DEFAULT NULL,
  `length`           DOUBLE DEFAULT NULL,
  `width`            DOUBLE DEFAULT NULL,
  `height`           DOUBLE DEFAULT NULL,
  `min_stock`        INT NOT NULL DEFAULT 0,
  `max_stock`        INT DEFAULT NULL,
  `image_url`        VARCHAR(500) DEFAULT NULL,
  `is_active`        TINYINT(1) NOT NULL DEFAULT 1,
  `temperature_type` ENUM('NORMAL','COLD','FROZEN') NOT NULL DEFAULT 'NORMAL',
  `lot_control`      TINYINT(1) NOT NULL DEFAULT 0,
  `expiry_control`   TINYINT(1) NOT NULL DEFAULT 0,
  `expiry_days`      INT DEFAULT NULL,
  `storage_type`     VARCHAR(20) DEFAULT NULL,
  `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_items_code` (`code`),
  UNIQUE KEY `uk_items_barcode` (`barcode`),
  KEY `idx_items_name` (`name`(100)),
  KEY `idx_items_category` (`category`),
  KEY `idx_items_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 6. Partners (ILCARRIER + ILOWNER + ILCUSTOMER 참조) ─
CREATE TABLE IF NOT EXISTS `partners` (
  `id`            VARCHAR(36) NOT NULL,
  `code`          VARCHAR(20) NOT NULL,
  `name`          VARCHAR(100) NOT NULL,
  `type`          ENUM('SUPPLIER','CUSTOMER','CARRIER') NOT NULL,
  `contact_name`  VARCHAR(50) DEFAULT NULL,
  `contact_phone` VARCHAR(30) DEFAULT NULL,
  `contact_email` VARCHAR(100) DEFAULT NULL,
  `country`       VARCHAR(50) DEFAULT NULL,
  `city`          VARCHAR(50) DEFAULT NULL,
  `address`       VARCHAR(255) DEFAULT NULL,
  `business_no`   VARCHAR(30) DEFAULT NULL,
  `president`     VARCHAR(50) DEFAULT NULL,
  `notes`         TEXT DEFAULT NULL,
  `is_active`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_partners_code` (`code`),
  KEY `idx_partners_type` (`type`),
  KEY `idx_partners_name` (`name`),
  KEY `idx_partners_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 7. Inbound Orders (WMSOP010 + WMSOP040 참조) ──────
CREATE TABLE IF NOT EXISTS `inbound_orders` (
  `id`             VARCHAR(36) NOT NULL,
  `order_number`   VARCHAR(30) NOT NULL,
  `partner_id`     VARCHAR(36) NOT NULL,
  `warehouse_id`   VARCHAR(36) NOT NULL,
  `order_type`     ENUM('PURCHASE','RETURN_IN','TRANSFER_IN','PURCHASE_OUT','SALES','TRANSFER_OUT','RETURN_OUT') NOT NULL DEFAULT 'PURCHASE',
  `expected_date`  DATETIME(3) NOT NULL,
  `arrived_date`   DATETIME(3) DEFAULT NULL,
  `completed_date` DATETIME(3) DEFAULT NULL,
  `status`         ENUM('DRAFT','CONFIRMED','ARRIVED','RECEIVING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `notes`          TEXT DEFAULT NULL,
  `created_by`     VARCHAR(36) DEFAULT NULL,
  `created_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inbound_orders_number` (`order_number`),
  KEY `idx_inbound_status_wh` (`status`, `warehouse_id`),
  KEY `idx_inbound_warehouse` (`warehouse_id`),
  KEY `idx_inbound_partner` (`partner_id`),
  KEY `idx_inbound_created` (`created_at`),
  CONSTRAINT `fk_inbound_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inbound_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 8. Inbound Order Items (WMSOP041 참조) ─────────────
CREATE TABLE IF NOT EXISTS `inbound_order_items` (
  `id`               VARCHAR(36) NOT NULL,
  `inbound_order_id` VARCHAR(36) NOT NULL,
  `item_id`          VARCHAR(36) NOT NULL,
  `expected_qty`     INT NOT NULL,
  `received_qty`     INT NOT NULL DEFAULT 0,
  `damaged_qty`      INT NOT NULL DEFAULT 0,
  `lot_no`           VARCHAR(50) DEFAULT NULL,
  `expiry_date`      DATETIME(3) DEFAULT NULL,
  `notes`            TEXT DEFAULT NULL,
  `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_inbound_items_order` (`inbound_order_id`),
  KEY `idx_inbound_items_item` (`item_id`),
  CONSTRAINT `fk_inbound_items_order` FOREIGN KEY (`inbound_order_id`) REFERENCES `inbound_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inbound_items_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 9. Inbound Receipts ────────────────────────────────
CREATE TABLE IF NOT EXISTS `inbound_receipts` (
  `id`               VARCHAR(36) NOT NULL,
  `inbound_order_id` VARCHAR(36) NOT NULL,
  `received_by`      VARCHAR(36) NOT NULL,
  `received_date`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lot_no`           VARCHAR(50) DEFAULT NULL,
  `location_code`    VARCHAR(30) DEFAULT NULL,
  `notes`            TEXT DEFAULT NULL,
  `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_receipts_order` (`inbound_order_id`),
  CONSTRAINT `fk_receipts_order` FOREIGN KEY (`inbound_order_id`) REFERENCES `inbound_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 10. Outbound Orders (WMSOP050 참조) ────────────────
CREATE TABLE IF NOT EXISTS `outbound_orders` (
  `id`              VARCHAR(36) NOT NULL,
  `order_number`    VARCHAR(30) NOT NULL,
  `partner_id`      VARCHAR(36) NOT NULL,
  `warehouse_id`    VARCHAR(36) NOT NULL,
  `order_type`      ENUM('PURCHASE','RETURN_IN','TRANSFER_IN','PURCHASE_OUT','SALES','TRANSFER_OUT','RETURN_OUT') NOT NULL DEFAULT 'SALES',
  `ship_date`       DATETIME(3) DEFAULT NULL,
  `delivery_date`   DATETIME(3) DEFAULT NULL,
  `completed_date`  DATETIME(3) DEFAULT NULL,
  `status`          ENUM('DRAFT','CONFIRMED','PICKING','PACKING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `shipping_method` VARCHAR(50) DEFAULT NULL,
  `tracking_number` VARCHAR(100) DEFAULT NULL,
  `notes`           TEXT DEFAULT NULL,
  `created_by`      VARCHAR(36) DEFAULT NULL,
  `created_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbound_orders_number` (`order_number`),
  KEY `idx_outbound_status_wh` (`status`, `warehouse_id`),
  KEY `idx_outbound_warehouse` (`warehouse_id`),
  KEY `idx_outbound_partner` (`partner_id`),
  KEY `idx_outbound_created` (`created_at`),
  CONSTRAINT `fk_outbound_partner` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_outbound_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 11. Outbound Order Items ───────────────────────────
CREATE TABLE IF NOT EXISTS `outbound_order_items` (
  `id`                VARCHAR(36) NOT NULL,
  `outbound_order_id` VARCHAR(36) NOT NULL,
  `item_id`           VARCHAR(36) NOT NULL,
  `ordered_qty`       INT NOT NULL,
  `picked_qty`        INT NOT NULL DEFAULT 0,
  `packed_qty`        INT NOT NULL DEFAULT 0,
  `shipped_qty`       INT NOT NULL DEFAULT 0,
  `lot_no`            VARCHAR(50) DEFAULT NULL,
  `notes`             TEXT DEFAULT NULL,
  `created_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_outbound_items_order` (`outbound_order_id`),
  KEY `idx_outbound_items_item` (`item_id`),
  CONSTRAINT `fk_outbound_items_order` FOREIGN KEY (`outbound_order_id`) REFERENCES `outbound_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_outbound_items_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 12. Outbound Shipments ─────────────────────────────
CREATE TABLE IF NOT EXISTS `outbound_shipments` (
  `id`                VARCHAR(36) NOT NULL,
  `outbound_order_id` VARCHAR(36) NOT NULL,
  `shipped_by`        VARCHAR(36) NOT NULL,
  `shipped_date`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `carrier`           VARCHAR(100) DEFAULT NULL,
  `tracking_number`   VARCHAR(100) DEFAULT NULL,
  `weight`            DOUBLE DEFAULT NULL,
  `notes`             TEXT DEFAULT NULL,
  `created_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_shipments_order` (`outbound_order_id`),
  CONSTRAINT `fk_shipments_order` FOREIGN KEY (`outbound_order_id`) REFERENCES `outbound_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 13. Inventories (WMSST010 참조) ────────────────────
CREATE TABLE IF NOT EXISTS `inventories` (
  `id`            VARCHAR(36) NOT NULL,
  `item_id`       VARCHAR(36) NOT NULL,
  `warehouse_id`  VARCHAR(36) NOT NULL,
  `location_id`   VARCHAR(36) DEFAULT NULL,
  `lot_no`        VARCHAR(50) DEFAULT NULL,
  `quantity`      INT NOT NULL DEFAULT 0,
  `reserved_qty`  INT NOT NULL DEFAULT 0,
  `available_qty` INT NOT NULL DEFAULT 0,
  `expiry_date`   DATETIME(3) DEFAULT NULL,
  `inbound_date`  DATETIME(3) DEFAULT NULL,
  `created_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_composite` (`item_id`, `warehouse_id`, `location_id`, `lot_no`),
  KEY `idx_inventory_warehouse` (`warehouse_id`),
  KEY `idx_inventory_location` (`location_id`),
  KEY `idx_inventory_wh_item` (`warehouse_id`, `item_id`),
  CONSTRAINT `fk_inventory_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 14. Inventory Transactions (WMSST011 참조) ─────────
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id`             VARCHAR(36) NOT NULL,
  `item_id`        VARCHAR(36) NOT NULL,
  `warehouse_id`   VARCHAR(36) NOT NULL,
  `location_code`  VARCHAR(30) DEFAULT NULL,
  `lot_no`         VARCHAR(50) DEFAULT NULL,
  `tx_type`        ENUM('INBOUND','OUTBOUND','ADJUSTMENT_IN','ADJUSTMENT_OUT','TRANSFER','CYCLE_COUNT','RETURN') NOT NULL,
  `quantity`       INT NOT NULL,
  `reference_type` VARCHAR(30) DEFAULT NULL,
  `reference_id`   VARCHAR(36) DEFAULT NULL,
  `notes`          TEXT DEFAULT NULL,
  `performed_by`   VARCHAR(36) DEFAULT NULL,
  `created_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_tx_item` (`item_id`),
  KEY `idx_tx_warehouse` (`warehouse_id`),
  KEY `idx_tx_type` (`tx_type`),
  KEY `idx_tx_created` (`created_at`),
  KEY `idx_tx_wh_created` (`warehouse_id`, `created_at`),
  KEY `idx_tx_item_wh` (`item_id`, `warehouse_id`),
  KEY `idx_tx_ref` (`reference_type`, `reference_id`),
  CONSTRAINT `fk_tx_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 15. Stock Adjustments (WMSST050 참조) ──────────────
CREATE TABLE IF NOT EXISTS `stock_adjustments` (
  `id`            VARCHAR(36) NOT NULL,
  `warehouse_id`  VARCHAR(36) NOT NULL,
  `item_code`     VARCHAR(30) NOT NULL,
  `location_code` VARCHAR(30) DEFAULT NULL,
  `lot_no`        VARCHAR(50) DEFAULT NULL,
  `adjust_qty`    INT NOT NULL,
  `reason`        ENUM('DAMAGE','EXPIRY','LOST','FOUND','CORRECTION','OTHER') NOT NULL,
  `notes`         TEXT DEFAULT NULL,
  `performed_by`  VARCHAR(36) NOT NULL,
  `approved_by`   VARCHAR(36) DEFAULT NULL,
  `created_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_adj_warehouse` (`warehouse_id`),
  KEY `idx_adj_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 16. Cycle Counts (WMSST070 참조) ───────────────────
CREATE TABLE IF NOT EXISTS `cycle_counts` (
  `id`            VARCHAR(36) NOT NULL,
  `warehouse_id`  VARCHAR(36) NOT NULL,
  `location_code` VARCHAR(30) DEFAULT NULL,
  `item_code`     VARCHAR(30) DEFAULT NULL,
  `system_qty`    INT NOT NULL,
  `counted_qty`   INT DEFAULT NULL,
  `variance`      INT DEFAULT NULL,
  `status`        ENUM('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
  `counted_by`    VARCHAR(36) DEFAULT NULL,
  `counted_date`  DATETIME(3) DEFAULT NULL,
  `notes`         TEXT DEFAULT NULL,
  `created_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cc_wh_status` (`warehouse_id`, `status`),
  KEY `idx_cc_status` (`status`),
  KEY `idx_cc_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 17. Sales Channels (외부 채널 연동) ────────────────
CREATE TABLE IF NOT EXISTS `sales_channels` (
  `id`              VARCHAR(36) NOT NULL,
  `name`            VARCHAR(100) NOT NULL,
  `platform`        ENUM('COUPANG','NAVER','AMAZON','SHOPIFY','EBAY','RAKUTEN','LAZADA','SHOPEE','ELEVENTH_ST') NOT NULL,
  `seller_id`       VARCHAR(100) DEFAULT NULL,
  `warehouse_id`    VARCHAR(36) NOT NULL,
  `status`          ENUM('ACTIVE','INACTIVE','ERROR','PENDING') NOT NULL DEFAULT 'PENDING',
  `credentials`     JSON NOT NULL,
  `sync_enabled`    TINYINT(1) NOT NULL DEFAULT 1,
  `sync_interval`   INT NOT NULL DEFAULT 10,
  `last_sync_at`    DATETIME(3) DEFAULT NULL,
  `last_sync_error` TEXT DEFAULT NULL,
  `notes`           TEXT DEFAULT NULL,
  `created_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_platform_seller` (`platform`, `seller_id`),
  KEY `idx_channel_platform` (`platform`),
  KEY `idx_channel_status` (`status`),
  CONSTRAINT `fk_channel_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 18. Channel Orders (채널 주문) ─────────────────────
CREATE TABLE IF NOT EXISTS `channel_orders` (
  `id`                VARCHAR(36) NOT NULL,
  `channel_id`        VARCHAR(36) NOT NULL,
  `platform_order_id` VARCHAR(100) NOT NULL,
  `platform_order_no` VARCHAR(100) DEFAULT NULL,
  `status`            ENUM('NEW','SYNCED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURN_REQUESTED','RETURNED','ERROR') NOT NULL DEFAULT 'NEW',
  `order_date`        DATETIME(3) NOT NULL,
  `customer_name`     VARCHAR(100) DEFAULT NULL,
  `customer_phone`    VARCHAR(30) DEFAULT NULL,
  `shipping_address`  TEXT DEFAULT NULL,
  `shipping_zip_code` VARCHAR(20) DEFAULT NULL,
  `shipping_method`   VARCHAR(50) DEFAULT NULL,
  `total_amount`      DOUBLE DEFAULT NULL,
  `currency`          VARCHAR(10) DEFAULT NULL,
  `outbound_order_id` VARCHAR(36) DEFAULT NULL,
  `carrier`           VARCHAR(100) DEFAULT NULL,
  `tracking_number`   VARCHAR(100) DEFAULT NULL,
  `shipped_at`        DATETIME(3) DEFAULT NULL,
  `delivered_at`      DATETIME(3) DEFAULT NULL,
  `raw_data`          JSON DEFAULT NULL,
  `error_message`     TEXT DEFAULT NULL,
  `created_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_order` (`channel_id`, `platform_order_id`),
  KEY `idx_co_channel_status` (`channel_id`, `status`),
  KEY `idx_co_status` (`status`),
  KEY `idx_co_order_date` (`order_date`),
  KEY `idx_co_outbound` (`outbound_order_id`),
  CONSTRAINT `fk_co_channel` FOREIGN KEY (`channel_id`) REFERENCES `sales_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_co_outbound` FOREIGN KEY (`outbound_order_id`) REFERENCES `outbound_orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 19. Channel Order Items (채널 주문 아이템) ─────────
CREATE TABLE IF NOT EXISTS `channel_order_items` (
  `id`               VARCHAR(36) NOT NULL,
  `channel_order_id` VARCHAR(36) NOT NULL,
  `platform_item_id` VARCHAR(100) DEFAULT NULL,
  `platform_sku`     VARCHAR(100) DEFAULT NULL,
  `item_name`        VARCHAR(200) NOT NULL,
  `quantity`         INT NOT NULL,
  `unit_price`       DOUBLE DEFAULT NULL,
  `item_id`          VARCHAR(36) DEFAULT NULL,
  `created_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_coi_order` (`channel_order_id`),
  KEY `idx_coi_item` (`item_id`),
  CONSTRAINT `fk_coi_order` FOREIGN KEY (`channel_order_id`) REFERENCES `channel_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_coi_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 20. Channel Products (채널 상품 매핑) ──────────────
CREATE TABLE IF NOT EXISTS `channel_products` (
  `id`                  VARCHAR(36) NOT NULL,
  `channel_id`          VARCHAR(36) NOT NULL,
  `item_id`             VARCHAR(36) NOT NULL,
  `platform_product_id` VARCHAR(100) DEFAULT NULL,
  `platform_sku`        VARCHAR(100) DEFAULT NULL,
  `is_linked`           TINYINT(1) NOT NULL DEFAULT 1,
  `last_sync_at`        DATETIME(3) DEFAULT NULL,
  `created_at`          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cp_channel_item` (`channel_id`, `item_id`),
  UNIQUE KEY `uk_cp_channel_sku` (`channel_id`, `platform_sku`),
  KEY `idx_cp_channel` (`channel_id`),
  KEY `idx_cp_item` (`item_id`),
  CONSTRAINT `fk_cp_channel` FOREIGN KEY (`channel_id`) REFERENCES `sales_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cp_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 21. Channel Sync Logs (동기화 로그) ────────────────
CREATE TABLE IF NOT EXISTS `channel_sync_logs` (
  `id`           VARCHAR(36) NOT NULL,
  `channel_id`   VARCHAR(36) NOT NULL,
  `sync_type`    ENUM('ORDER_PULL','INVENTORY_PUSH','PRODUCT_SYNC','SHIPMENT_PUSH','RETURN_PULL') NOT NULL,
  `direction`    ENUM('INBOUND','OUTBOUND','BOTH') NOT NULL,
  `status`       VARCHAR(20) NOT NULL,
  `record_count` INT NOT NULL DEFAULT 0,
  `error_count`  INT NOT NULL DEFAULT 0,
  `error_detail` TEXT DEFAULT NULL,
  `started_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` DATETIME(3) DEFAULT NULL,
  `created_at`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_csl_channel_type` (`channel_id`, `sync_type`),
  KEY `idx_csl_channel_created` (`channel_id`, `created_at`),
  CONSTRAINT `fk_csl_channel` FOREIGN KEY (`channel_id`) REFERENCES `sales_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Verification: 테이블 생성 확인 (21개 테이블)
-- ============================================================================
SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;
