import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// 生产域名
export default defineConfig({
  site: 'https://yujianxiaoquan.online',
  trailingSlash: 'ignore',
  // 公开页面保持静态预渲染；后台 /admin 标记 prerender=false 走服务端渲染
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
