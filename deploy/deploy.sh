#!/usr/bin/env bash
# 本地执行：构建并同步到服务器
# 用法：改下面两个变量后，bash deploy/deploy.sh

set -euo pipefail

# ===== 改这两行 =====
HOST="root@你的服务器公网IP"
TARGET="/var/www/yujianxiaoquan.online"
# ===================

cd "$(dirname "$0")/.."

echo "==> 构建"
npm run build

echo "==> 同步到 $HOST:$TARGET"
rsync -avz --delete --exclude '.user.ini' dist/ "$HOST:$TARGET/"

echo "==> 修正权限并重载 Nginx"
ssh "$HOST" "chown -R www-data:www-data $TARGET && nginx -t && systemctl reload nginx"

echo "==> 完成：https://yujianxiaoquan.online"
