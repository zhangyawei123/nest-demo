SET @add_points_column := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `points` int NOT NULL DEFAULT 0',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'points'
);
PREPARE add_points_column_stmt FROM @add_points_column;
EXECUTE add_points_column_stmt;
DEALLOCATE PREPARE add_points_column_stmt;

SET @add_makeup_chances_column := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `makeup_sign_in_chances` int NOT NULL DEFAULT 0',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'makeup_sign_in_chances'
);
PREPARE add_makeup_chances_column_stmt FROM @add_makeup_chances_column;
EXECUTE add_makeup_chances_column_stmt;
DEALLOCATE PREPARE add_makeup_chances_column_stmt;

CREATE TABLE IF NOT EXISTS `daily_sign_ins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `sign_date` date NOT NULL,
  `points` int NOT NULL DEFAULT 2,
  `is_makeup` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_daily_sign_in_user_date` (`user_id`, `sign_date`),
  KEY `idx_daily_sign_in_user_id` (`user_id`),
  KEY `idx_daily_sign_in_sign_date` (`sign_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @add_is_makeup_column := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `daily_sign_ins` ADD COLUMN `is_makeup` tinyint(1) NOT NULL DEFAULT 0',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'daily_sign_ins'
    AND COLUMN_NAME = 'is_makeup'
);
PREPARE add_is_makeup_column_stmt FROM @add_is_makeup_column;
EXECUTE add_is_makeup_column_stmt;
DEALLOCATE PREPARE add_is_makeup_column_stmt;

CREATE TABLE IF NOT EXISTS `point_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amount` int NOT NULL,
  `balance_after` int NOT NULL,
  `type` varchar(20) NOT NULL,
  `scene` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_point_logs_user_id` (`user_id`),
  KEY `idx_point_logs_scene` (`scene`),
  KEY `idx_point_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE `users`
SET `points` = 1000
WHERE `username` = 'admin'
  AND `points` < 1000;
