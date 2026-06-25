-- 创建生图记录表
CREATE TABLE IF NOT EXISTS `draw_generations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `model` varchar(100) NOT NULL,
  `prompt` text NOT NULL,
  `image` json DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `response_format` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `request_body` json NOT NULL,
  `response_body` json DEFAULT NULL,
  `generated_urls` json DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;