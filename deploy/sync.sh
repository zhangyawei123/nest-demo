#!/bin/bash
# ============================================================
# 本地 → 服务器 一键同步 & 部署脚本
# 用法: bash deploy/sync.sh
# 密码存在同目录 .server-password 文件中（已被 .gitignore 忽略）
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PASSWORD_FILE="$SCRIPT_DIR/.server-password"

SERVER_USER="root"
SERVER_IP="111.229.210.78"
REMOTE_PROJECT="/opt/nest-demo"
REMOTE_FRONTEND="/var/www/nest-demo-frontend"

# ---------- 读取密码 ----------
if [ ! -f "$PASSWORD_FILE" ]; then
  echo "❌ 密码文件不存在: $PASSWORD_FILE"
  echo "   请创建该文件并写入服务器密码（仅一行）"
  exit 1
fi
export SSHPASS="$(cat "$PASSWORD_FILE" | tr -d '\n')"

SSH_OPTS="-o StrictHostKeyChecking=no -o LogLevel=ERROR"
RSH="sshpass -e ssh $SSH_OPTS"

remote() {
  sshpass -e ssh $SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "$@"
}

# ---------- 同步后端源码 ----------
echo "📦 同步后端源码..."
sshpass -e rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .env --exclude uploads \
  -e "ssh $SSH_OPTS" \
  "$PROJECT_DIR/src/" "${SERVER_USER}@${SERVER_IP}:${REMOTE_PROJECT}/src/"

sshpass -e scp $SSH_OPTS \
  "$PROJECT_DIR/package.json" \
  "$PROJECT_DIR/tsconfig.json" \
  "$PROJECT_DIR/nest-cli.json" \
  "${SERVER_USER}@${SERVER_IP}:${REMOTE_PROJECT}/" >/dev/null

# ---------- 同步前端源码 ----------
echo "📦 同步前端源码..."
sshpass -e rsync -az --delete \
  --exclude node_modules --exclude dist \
  -e "ssh $SSH_OPTS" \
  "$PROJECT_DIR/admin-frontend/" "${SERVER_USER}@${SERVER_IP}:${REMOTE_PROJECT}/admin-frontend/"

# ---------- 远程构建 & 部署 ----------
echo "🔨 远程构建后端..."
remote "cd ${REMOTE_PROJECT} && npm install --silent --no-audit --no-fund && npm run build"

echo "🔨 远程构建前端..."
remote "cd ${REMOTE_PROJECT}/admin-frontend && npm install --silent --no-audit --no-fund && npm run build-only"

echo "🚀 部署前端静态文件..."
remote "rm -rf ${REMOTE_FRONTEND}/* && cp -r ${REMOTE_PROJECT}/admin-frontend/dist/* ${REMOTE_FRONTEND}/"

echo "🔄 重启后端服务..."
remote "pm2 restart nest-demo --update-env"

# ---------- 健康检查 ----------
echo "⏳ 等待服务启动..."
sleep 3
BACKEND=$(remote "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/auth/captcha" || echo "000")
FRONTEND=$(remote "curl -s -o /dev/null -w '%{http_code}' http://localhost:80" || echo "000")

echo ""
echo "============================================"
echo "  后端 API:  $BACKEND"
echo "  前端页面:  $FRONTEND"
if [ "$BACKEND" = "200" ] && [ "$FRONTEND" = "200" ]; then
  echo "  ✅ 部署成功！"
else
  echo "  ⚠️  请检查服务状态"
fi
echo "============================================"
