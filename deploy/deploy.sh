#!/bin/bash
set -e

echo "=========================================="
echo "  NestDemo 部署脚本"
echo "=========================================="

PROJECT_DIR="/var/www/nest-demo"
FRONTEND_DIR="/var/www/nest-demo-frontend"
REPO_URL="https://github.com/zhangyawei123/nest-demo.git"

# ---- 拉取代码 ----
echo "[1/5] 拉取最新代码..."
if [ -d "$PROJECT_DIR/.git" ]; then
  cd $PROJECT_DIR
  git pull origin main
else
  rm -rf $PROJECT_DIR
  git clone $REPO_URL $PROJECT_DIR
  cd $PROJECT_DIR
fi

# ---- 配置环境变量 ----
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "[*] 创建 .env 文件..."
  cp $PROJECT_DIR/deploy/env.production $PROJECT_DIR/.env
  echo "⚠️  请编辑 /var/www/nest-demo/.env 填入正确的 DB_PASSWORD"
fi

# ---- 后端部署 ----
echo "[2/5] 安装后端依赖并构建..."
cd $PROJECT_DIR
pnpm install
pnpm run build

# ---- 前端部署 ----
echo "[3/5] 安装前端依赖并构建..."
cd $PROJECT_DIR/admin-frontend
pnpm install
pnpm run build-only
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
pm2 start dist/main.js --name nest-demo --env production
pm2 save

echo ""
echo "=========================================="
echo "  ✅ 部署完成！"
echo "  前端: http://120.48.191.112"
echo "  后端: http://120.48.191.112/api"
echo "  Swagger: http://120.48.191.112/api-docs"
echo "=========================================="
