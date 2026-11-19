#!/usr/bin/env bash
# 服务器端一键初始化（Ubuntu 22.04 / 24.04、Debian 12 通用）
# 用法：用 root 登录服务器后执行：bash init-server.sh
# 说明：备案通过后、域名解析到本机再跑最后一步 certbot

set -euo pipefail

DOMAIN="yujianxiaoquan.online"
APP="/var/www/${DOMAIN}"
EMAIL="1025490868@qq.com"

echo "==> 1/6 安装系统依赖"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx rsync certbot python3-certbot-nginx ufw curl ca-certificates

echo "==> 2/6 安装 Node.js 22"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node -v
npm -v

echo "==> 3/6 创建应用目录"
mkdir -p "${APP}/data" "${APP}/src/content/posts" "${APP}/src/server" "${APP}/scripts"
chown -R www-data:www-data "${APP}"

if [ ! -f "${APP}/.env" ] && [ -f "${APP}/.env.example" ]; then
  cp "${APP}/.env.example" "${APP}/.env"
fi

echo "==> 4/6 写入 Nginx 反向代理（先 HTTP，证书随后由 certbot 添加）"
cat > /etc/nginx/sites-available/${DOMAIN} <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name yujianxiaoquan.online www.yujianxiaoquan.online;

    charset utf-8;
    server_tokens off;
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> 5/6 注册 systemd 服务"
cat > /etc/systemd/system/yujianxiaoquan.service <<UNIT
[Unit]
Description=${DOMAIN} (Astro + Node)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${APP}
EnvironmentFile=${APP}/.env
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=4321
ExecStart=/usr/bin/node ${APP}/dist/server/entry.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable yujianxiaoquan

echo "==> 6/6 防火墙"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp  >/dev/null 2>&1 || true
  ufw allow 80/tcp  >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi
# 云厂商安全组需在控制台另外放行 80/443

echo ""
echo "初始化完成。接下来："
echo "  1) 在 ${APP}/.env 填写 ADMIN_PASSWORD 和 OSS_*（或先把本地 .env scp 上来）"
echo "  2) 确认 DNS 的 A 记录已指向本机：dig +short ${DOMAIN}"
echo "  3) 签发证书：certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --email ${EMAIL} --agree-tos --redirect"
echo "  4) 本地执行：bash deploy/deploy.sh"
echo ""
echo "应用目录：${APP}"
echo "服务名：yujianxiaoquan"
