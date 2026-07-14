CREATE TABLE IF NOT EXISTS `recharge_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `price_cents` int NOT NULL,
  `points` int NOT NULL,
  `bonus_points` int NOT NULL DEFAULT 0,
  `enabled` tinyint NOT NULL DEFAULT 1,
  `sort` int NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_recharge_packages_enabled_sort` (`enabled`, `sort`, `price_cents`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recharge_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(40) NOT NULL,
  `user_id` int NOT NULL,
  `package_id` int DEFAULT NULL,
  `package_name` varchar(80) NOT NULL,
  `amount_cents` int NOT NULL,
  `points` int NOT NULL,
  `bonus_points` int NOT NULL DEFAULT 0,
  `total_points` int NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `payment_submitted_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `refunded_at` datetime DEFAULT NULL,
  `refund_requested_at` datetime DEFAULT NULL,
  `refund_reason` varchar(300) DEFAULT NULL,
  `refund_handled_at` datetime DEFAULT NULL,
  `refund_handled_by` int DEFAULT NULL,
  `refund_decision_remark` varchar(300) DEFAULT NULL,
  `confirmed_by` int DEFAULT NULL,
  `remark` varchar(200) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_recharge_orders_order_no` (`order_no`),
  KEY `idx_recharge_orders_user_id` (`user_id`),
  KEY `idx_recharge_orders_status` (`status`),
  KEY `idx_recharge_orders_created_at` (`created_at`),
  KEY `idx_recharge_orders_package_id` (`package_id`),
  CONSTRAINT `fk_recharge_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recharge_orders_package_id` FOREIGN KEY (`package_id`) REFERENCES `recharge_packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

INSERT INTO `recharge_packages`
  (`name`, `description`, `price_cents`, `points`, `bonus_points`, `enabled`, `sort`)
SELECT '体验包', '适合轻量体验 AI 聊天和生图', 990, 100, 0, 1, 10
WHERE NOT EXISTS (SELECT 1 FROM `recharge_packages` WHERE `name` = '体验包');

INSERT INTO `recharge_packages`
  (`name`, `description`, `price_cents`, `points`, `bonus_points`, `enabled`, `sort`)
SELECT '标准包', '更适合高频使用，赠送 50 积分', 2990, 300, 50, 1, 20
WHERE NOT EXISTS (SELECT 1 FROM `recharge_packages` WHERE `name` = '标准包');

INSERT INTO `recharge_packages`
  (`name`, `description`, `price_cents`, `points`, `bonus_points`, `enabled`, `sort`)
SELECT '进阶包', '适合批量生图和长对话，赠送 200 积分', 9990, 1000, 200, 1, 30
WHERE NOT EXISTS (SELECT 1 FROM `recharge_packages` WHERE `name` = '进阶包');
