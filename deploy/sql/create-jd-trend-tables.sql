CREATE TABLE IF NOT EXISTS `jd_trend_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sku` varchar(30) NOT NULL,
  `url` varchar(500) NOT NULL,
  `name` varchar(300) DEFAULT NULL,
  `enabled` tinyint NOT NULL DEFAULT 1,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_jd_trend_products_sku` (`sku`),
  KEY `idx_jd_trend_products_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `jd_trend_snapshots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `sku` varchar(30) NOT NULL,
  `snapshotDate` date NOT NULL,
  `snapshotSlot` varchar(2) NOT NULL DEFAULT '00',
  `capturedAt` datetime NOT NULL,
  `productUrl` varchar(500) NOT NULL,
  `title` varchar(500) NOT NULL DEFAULT '',
  `price` decimal(12,2) DEFAULT NULL,
  `commentCount` bigint DEFAULT NULL,
  `shop` varchar(300) NOT NULL DEFAULT '',
  `stockText` varchar(300) NOT NULL DEFAULT '',
  `rankName` varchar(200) NOT NULL DEFAULT '',
  `rankPosition` int DEFAULT NULL,
  `rankText` varchar(300) NOT NULL DEFAULT '',
  `pageStatus` varchar(30) NOT NULL DEFAULT 'ok',
  `error` varchar(1000) NOT NULL DEFAULT '',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_jd_trend_snapshots_sku_date_slot` (`sku`, `snapshotDate`, `snapshotSlot`),
  KEY `idx_jd_trend_snapshots_date` (`snapshotDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `jd_trend_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reportDate` date NOT NULL,
  `status` varchar(30) NOT NULL,
  `productCount` int NOT NULL DEFAULT 0,
  `successCount` int NOT NULL DEFAULT 0,
  `cookieStatus` varchar(30) NOT NULL DEFAULT 'missing',
  `collectionSlot` varchar(20) NOT NULL DEFAULT '',
  `reportData` longtext NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_jd_trend_reports_date` (`reportDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `menus` (`name`, `path`, `component`, `icon`, `sort`, `visible`, `parentId`, `createdAt`, `updatedAt`)
SELECT '京东趋势监控', '/jd-trends', 'jd-trend/JdTrendView', 'TrendCharts', 85, 1, NULL, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM `menus` WHERE `path` = '/jd-trends');

INSERT IGNORE INTO `role_menus` (`rolesId`, `menusId`)
SELECT roles.`id`, menus.`id`
FROM `roles` roles
JOIN `menus` menus ON menus.`path` = '/jd-trends'
WHERE roles.`name` = 'admin';

SET @add_snapshot_slot := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `jd_trend_snapshots` ADD COLUMN `snapshotSlot` varchar(2) NOT NULL DEFAULT ''00'' AFTER `snapshotDate`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jd_trend_snapshots' AND COLUMN_NAME = 'snapshotSlot'
);
PREPARE stmt FROM @add_snapshot_slot; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_old_snapshot_index := (
  SELECT IF(COUNT(*) > 0,
    'ALTER TABLE `jd_trend_snapshots` DROP INDEX `idx_jd_trend_snapshots_sku_date`',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jd_trend_snapshots' AND INDEX_NAME = 'idx_jd_trend_snapshots_sku_date'
);
PREPARE stmt FROM @drop_old_snapshot_index; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_snapshot_slot_index := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `jd_trend_snapshots` ADD UNIQUE KEY `idx_jd_trend_snapshots_sku_date_slot` (`sku`, `snapshotDate`, `snapshotSlot`)',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jd_trend_snapshots' AND INDEX_NAME = 'idx_jd_trend_snapshots_sku_date_slot'
);
PREPARE stmt FROM @add_snapshot_slot_index; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_collection_slot := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `jd_trend_reports` ADD COLUMN `collectionSlot` varchar(20) NOT NULL DEFAULT '''' AFTER `cookieStatus`',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jd_trend_reports' AND COLUMN_NAME = 'collectionSlot'
);
PREPARE stmt FROM @add_collection_slot; EXECUTE stmt; DEALLOCATE PREPARE stmt;
