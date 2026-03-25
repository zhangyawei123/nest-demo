#!/bin/bash
set -e

echo "=========================================="
echo "  NestDemo 服务器初始化脚本"
echo "=========================================="

# ---- 系统更新 ----
echo "[1/8] 更新系统包..."
yum update -y || apt-get update -y

# 检测包管理器
if command -v yum &>/dev/null; then
  PKG="yum"
elif command -v apt-get &>/dev/null; then
  PKG="apt-get"
else
  echo "不支持的系统"; exit 1
fi

# ---- 安装基础工具 ----
echo "[2/8] 安装基础工具..."
$PKG install -y git curl wget vim

# ---- 安装 Node.js 20 ----
echo "[3/8] 安装 Node.js 20..."
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - 2>/dev/null || \
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  $PKG install -y nodejs
fi
echo "Node: $(node -v), NPM: $(npm -v)"

# ---- 安装 pnpm ----
echo "[4/8] 安装 pnpm..."
npm install -g pnpm

# ---- 安装 PM2 ----
echo "[5/8] 安装 PM2..."
npm install -g pm2

# ---- 安装 MySQL 8 ----
echo "[6/8] 安装 MySQL..."
if ! command -v mysql &>/dev/null; then
  if [ "$PKG" = "yum" ]; then
    # CentOS / RHEL / AliCloud
    rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-11.noarch.rpm 2>/dev/null || true
    yum install -y mysql-server --nogpgcheck
    systemctl start mysqld
    systemctl enable mysqld
    # 获取临时密码
    TEMP_PWD=$(grep 'temporary password' /var/log/mysqld.log 2>/dev/null | tail -1 | awk '{print $NF}')
    if [ -n "$TEMP_PWD" ]; then
      echo "============================================"
      echo "MySQL 临时密码: $TEMP_PWD"
      echo "请手动执行 mysql_secure_installation 修改密码"
      echo "============================================"
    fi
  else
    # Ubuntu / Debian
    $PKG install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
  fi
else
  echo "MySQL 已安装"
fi

# ---- 创建数据库 ----
echo "[7/8] 创建数据库..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS nest_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
echo "⚠️  如果 MySQL 有密码，请手动执行: mysql -u root -p -e \"CREATE DATABASE IF NOT EXISTS nest_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""

# ---- 安装 Nginx ----
echo "[8/8] 安装 Nginx..."
if ! command -v nginx &>/dev/null; then
  $PKG install -y nginx
fi
systemctl start nginx
systemctl enable nginx

# ---- 创建项目目录 ----
mkdir -p /var/www/nest-demo
mkdir -p /var/www/nest-demo-frontend

echo ""
echo "=========================================="
echo "  ✅ 服务器初始化完成！"
echo "=========================================="
echo "  Node:  $(node -v)"
echo "  pnpm:  $(pnpm -v)"
echo "  PM2:   $(pm2 -v)"
echo "  MySQL: $(mysql --version 2>/dev/null || echo '需要手动配置')"
echo "  Nginx: $(nginx -v 2>&1)"
echo "=========================================="
