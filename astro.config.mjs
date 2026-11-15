import { defineConfig } from 'astro/config';

// 生产域名
export default defineConfig({
  site: 'https://yujianxiaoquan.online',
  trailingSlash: 'ignore',
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
