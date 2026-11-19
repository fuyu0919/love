import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// 生产域名
export default defineConfig({
  site: 'https://yujianxiaoquan.online',
  trailingSlash: 'ignore',
  // 公开页面保持静态预渲染；后台 /admin 标记 prerender=false 走服务端渲染
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  security: {
    // 允许这些域名作为请求 Host，否则 Node 适配器会回退到 localhost，导致表单 POST 被 CSRF 校验拒绝
    allowedDomains: [
      { hostname: 'yujianxiaoquan.online', protocol: 'https' },
      { hostname: 'www.yujianxiaoquan.online', protocol: 'https' },
      { hostname: 'localhost', protocol: 'http' },
      { hostname: '127.0.0.1', protocol: 'http' },
    ],
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
