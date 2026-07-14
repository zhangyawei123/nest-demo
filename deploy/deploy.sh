#!/bin/bash
set -e

echo "=========================================="
echo "  NestDemo 部署脚本"
echo "=========================================="

PROJECT_DIR="/opt/nest-demo"
FRONTEND_DIR="/var/www/nest-demo-frontend"

# ---- 代码已通过 rsync 同步，无需 git pull ----
cd $PROJECT_DIR

# ---- 配置环境变量 ----
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "[*] 创建 .env 文件..."
  cp $PROJECT_DIR/deploy/env.production $PROJECT_DIR/.env
  echo "⚠️  请编辑 $PROJECT_DIR/.env 填入正确的配置"
fi

# ---- 后端部署 ----
echo "[2/5] 安装后端依赖并构建..."
cd $PROJECT_DIR
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

# ---- 京东趋势监控依赖与数据库迁移 ----
bash $PROJECT_DIR/deploy/install-chromium.sh
node $PROJECT_DIR/deploy/apply-jd-trend-migration.js

# ---- 前端部署 ----
echo "[3/5] 安装前端依赖并构建..."
cd $PROJECT_DIR/admin-frontend
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build-only
rm -rf $FRONTEND_DIR/*
cp -r dist/* $FRONTEND_DIR/

# ---- 配置 Nginx ----
echo "[4/5] 配置 Nginx..."
cp $PROJECT_DIR/deploy/nginx.conf /etc/nginx/conf.d/nest-demo.conf
# 移除默认配置避免冲突
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
nginx -t && systemctl reload nginx

# ---- 启动/重启后端 ----
echo "[5/5] 启动后端服务..."
cd $PROJECT_DIR
pm2 delete nest-demo 2>/dev/null || true
NODE_ENV=production pm2 start dist/main.js --name nest-demo --update-env
pm2 save

echo "[*] 健康检查..."
sleep 2
curl -fsS http://127.0.0.1:3000/ >/dev/null

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  前端: http://111.229.210.78"
echo "  后端: http://111.229.210.78/api"
echo "  Swagger: http://111.229.210.78/api-docs"
echo "=========================================="
