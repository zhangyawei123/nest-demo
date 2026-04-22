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

# 需要从本地 .env 同步到服务器 .env 的变量白名单
# 其他变量（如 DB_PASSWORD 等）保持服务器原值不变
SYNC_ENV_KEYS=("AI_API_KEY")

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

# ---------- 同步 .env 白名单变量 ----------
if [ -f "$PROJECT_DIR/.env" ] && [ ${#SYNC_ENV_KEYS[@]} -gt 0 ]; then
  echo "🔑 同步 .env 白名单变量到服务器..."
  TMP_REMOTE_ENV="$(mktemp)"
  trap 'rm -f "$TMP_REMOTE_ENV" "$TMP_REMOTE_ENV.new"' EXIT

  # 下载远程 .env（若不存在则视为空）
  sshpass -e scp $SSH_OPTS "${SERVER_USER}@${SERVER_IP}:${REMOTE_PROJECT}/.env" "$TMP_REMOTE_ENV" >/dev/null 2>&1 || : > "$TMP_REMOTE_ENV"

  CHANGED=0
  for key in "${SYNC_ENV_KEYS[@]}"; do
    LOCAL_LINE=$(grep -E "^${key}=" "$PROJECT_DIR/.env" | head -n1 || true)
    if [ -z "$LOCAL_LINE" ]; then
      echo "   ⚠️  本地 .env 未找到 ${key}，跳过"
      continue
    fi
    grep -v -E "^${key}=" "$TMP_REMOTE_ENV" > "$TMP_REMOTE_ENV.new" || true
    echo "$LOCAL_LINE" >> "$TMP_REMOTE_ENV.new"
    mv "$TMP_REMOTE_ENV.new" "$TMP_REMOTE_ENV"
    echo "   ✓ ${key}"
    CHANGED=1
  done

  if [ "$CHANGED" = "1" ]; then
    sshpass -e scp $SSH_OPTS "$TMP_REMOTE_ENV" "${SERVER_USER}@${SERVER_IP}:${REMOTE_PROJECT}/.env" >/dev/null
  fi
fi

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
