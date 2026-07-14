#!/bin/bash
set -e

if command -v google-chrome >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1 || command -v chromium-browser >/dev/null 2>&1; then
  exit 0
fi

echo "安装京东趋势采集所需的 Chromium..."
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y chromium || apt-get install -y chromium-browser
elif command -v yum >/dev/null 2>&1; then
  yum install -y chromium
else
  echo "无法自动安装 Chromium，请手动安装并设置 JD_CHROME_EXECUTABLE"
  exit 1
fi
