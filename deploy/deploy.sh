#!/usr/bin/env bash
# 本地执行：构建并部署到服务器
# 用法：改下面两个变量后，bash deploy/deploy.sh

set -euo pipefail

# ===== 改这两行 =====
HOST="root@你的服务器公网IP"
APP="/var/www/yujianxiaoquan.online"
# ===================

cd "$(dirname "$0")/.."

echo "==> 本地构建"
npm run build

echo "==> 同步构建产物与运行所需文件"
rsync -az --delete dist/ "$HOST:$APP/dist/"
rsync -az package.json package-lock.json "$HOST:$APP/"
rsync -az --delete scripts/ "$HOST:$APP/scripts/"
rsync -az --delete src/server/ "$HOST:$APP/src/server/"
rsync -az --delete src/content/posts/ "$HOST:$APP/src/content/posts/"

echo "==> 服务器安装依赖并重启服务"
ssh "$HOST" bash -s <<EOF
set -euo pipefail
cd "$APP"

if [ ! -f .env ]; then
  echo "缺少 $APP/.env，请先按 .env.example 填好再部署"
  exit 1
fi

npm ci --omit=dev --no-audit --no-fund
mkdir -p data
node scripts/seed.mjs
chown -R www-data:www-data data
systemctl restart yujianxiaoquan
systemctl --no-pager --lines=0 status yujianxiaoquan || true
EOF

echo "==> 完成：https://yujianxiaoquan.online"
