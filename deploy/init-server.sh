#!/usr/bin/env bash
# 服务器端一键初始化（Ubuntu 22.04 / 24.04、Debian 12 通用）
# 用法：登录服务器后执行
#   curl 下载或 scp 上传本文件后：bash init-server.sh
# 注意：用 root 执行

set -euo pipefail

DOMAIN="yujianxiaoquan.online"
WEBROOT="/var/www/${DOMAIN}"
EMAIL="1025490868@qq.com"

echo "==> 1/5 更新软件源并安装依赖"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx rsync certbot python3-certbot-nginx ufw curl

echo "==> 2/5 创建站点目录"
mkdir -p "${WEBROOT}"
# 首次部署前放一个占位页，避免 Certbot 校验时报 404
if [ ! -f "${WEBROOT}/index.html" ]; then
  cat > "${WEBROOT}/index.html" <<'HTML'
<!doctype html><meta charset="utf-8"><title>站点准备中</title>
<body style="font-family:system-ui;text-align:center;padding:80px">
<h1>站点准备中</h1><p>正在等待部署。</p>
HTML
fi
chown -R www-data:www-data "${WEBROOT}"

echo "==> 3/5 写入 Nginx 配置"
cat > /etc/nginx/sites-available/${DOMAIN} <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name yujianxiaoquan.online www.yujianxiaoquan.online;

    root  /var/www/yujianxiaoquan.online;
    index index.html;

    charset utf-8;
    server_tokens off;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /images/ {
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    error_page 404 /404.html;
}
NGINX

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> 4/5 放行防火墙端口"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp  >/dev/null 2>&1 || true
  ufw allow 80/tcp  >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi
# 云厂商安全组需在控制台另外放行 80/443，脚本无法代劳

echo "==> 5/5 完成"
echo ""
echo "下一步（顺序不能反）："
echo "  1) 在域名 DNS 添加 A 记录指向本机 IP，等解析生效"
echo "     验证：dig +short ${DOMAIN} 应返回本机公网 IP"
echo "  2) 签证书：certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --email ${EMAIL} --agree-tos --redirect"
echo "  3) 本地执行：bash deploy/deploy.sh 上传站点"
echo ""
echo "站点根目录：${WEBROOT}"
echo "Nginx 配置：/etc/nginx/sites-available/${DOMAIN}"
