SET @add_payment_proof_url := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `recharge_orders` ADD COLUMN `payment_proof_url` varchar(500) DEFAULT NULL AFTER `paid_at`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_orders' AND COLUMN_NAME = 'payment_proof_url'
);
PREPARE stmt FROM @add_payment_proof_url; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_payment_submitted_at := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `recharge_orders` ADD COLUMN `payment_submitted_at` datetime DEFAULT NULL AFTER `payment_proof_url`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_orders' AND COLUMN_NAME = 'payment_submitted_at'
);
PREPARE stmt FROM @add_payment_submitted_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_refund_requested_at := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `recharge_orders` ADD COLUMN `refund_requested_at` datetime DEFAULT NULL AFTER `refunded_at`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_orders' AND COLUMN_NAME = 'refund_requested_at'
);
PREPARE stmt FROM @add_refund_requested_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_refund_reason := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `recharge_orders` ADD COLUMN `refund_reason` varchar(300) DEFAULT NULL AFTER `refund_requested_at`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_orders' AND COLUMN_NAME = 'refund_reason'
);
PREPARE stmt FROM @add_refund_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_refund_handled_at := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `recharge_orders` ADD COLUMN `refund_handled_at` datetime DEFAULT NULL AFTER `refund_reason`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_orders' AND COLUMN_NAME = 'refund_handled_at'
);
PREPARE stmt FROM @add_refund_handled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_refund_handled_by := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `recharge_orders` ADD COLUMN `refund_handled_by` int DEFAULT NULL AFTER `refund_handled_at`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_orders' AND COLUMN_NAME = 'refund_handled_by'
);
PREPARE stmt FROM @add_refund_handled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_refund_decision_remark := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `recharge_orders` ADD COLUMN `refund_decision_remark` varchar(300) DEFAULT NULL AFTER `refund_handled_by`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_orders' AND COLUMN_NAME = 'refund_decision_remark'
);
PREPARE stmt FROM @add_refund_decision_remark; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `recharge_order_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `actor_id` int DEFAULT NULL,
  `actor_type` varchar(20) NOT NULL,
  `action` varchar(40) NOT NULL,
  `from_status` varchar(20) DEFAULT NULL,
  `to_status` varchar(20) DEFAULT NULL,
  `detail` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_recharge_order_events_order_id` (`order_id`),
  CONSTRAINT `fk_recharge_order_events_order_id` FOREIGN KEY (`order_id`) REFERENCES `recharge_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `recharge_order_events`
  (`order_id`, `actor_id`, `actor_type`, `action`, `from_status`, `to_status`, `detail`, `created_at`)
SELECT
  orders.`id`, NULL, 'system', 'legacy_import', NULL, orders.`status`, '历史订单迁移基线', orders.`created_at`
FROM `recharge_orders` orders
WHERE NOT EXISTS (
  SELECT 1 FROM `recharge_order_events` events WHERE events.`order_id` = orders.`id`
);
