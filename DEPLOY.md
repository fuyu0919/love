# 部署指引 · yujianxiaoquan.online

代码已配置好生产域名。剩余的是**托管平台 + DNS 解析**，需要你在阿里云和托管平台后台操作。

---

## 前置：先确认域名状态

在阿里云「域名控制台」检查三件事：

1. **实名认证是否通过**（国内注册的域名，未实名认证会被注册局暂停解析，表现就是查不到任何记录）
2. 域名状态是否为 `正常 / ok`，不是 `serverHold`
3. 域名是否已续费、未过期

当前实测：`yujianxiaoquan.online` 在阿里云 DNS（223.5.5.5）和 Google DNS（8.8.8.8）均返回 NXDOMAIN，即注册局没有委派。**域名没激活之前，任何解析配置都不会生效。**

---

## 方案 A：Cloudflare Pages（推荐）

免备案、免费、自动 HTTPS，构建产物直接上传 CDN。国内访问速度一般，但稳定可用。

1. 代码推到 GitHub（私有仓库也可以）
2. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git → 选仓库
3. 构建配置：
   - Framework preset: `Astro`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node 版本：环境变量加 `NODE_VERSION=22`
4. 部署成功后得到临时域名 `xxx.pages.dev`，先访问确认正常
5. Pages 项目 → Custom domains → Add a custom domain → 填 `yujianxiaoquan.online`，再添加 `www.yujianxiaoquan.online`

### DNS 配置（二选一）

**方式一：把 NS 托管给 Cloudflare（最省事，推荐）**

阿里云域名控制台 → 域名列表 → 管理 → DNS 修改 → 改为自定义 DNS，填 Cloudflare 分配的两个地址（形如 `xxx.ns.cloudflare.com`）。

改完等 10 分钟到 24 小时生效，Cloudflare 会自动创建指向 Pages 的记录，HTTPS 也会自动签发。

**方式二：不动 NS，在阿里云加 CNAME**

阿里云 → 云解析 DNS → 域名 → 解析设置 → 添加记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| CNAME | `@` | `你的项目名.pages.dev` | 600 |
| CNAME | `www` | `你的项目名.pages.dev` | 600 |

注意：根域名 `@` 用 CNAME 后，不能再保留同名的 MX / TXT 记录（会影响企业邮箱）。有邮件需求就走方式一。

---

## 方案 B：GitHub Pages

已包含 `.github/workflows/deploy.yml`，推送即自动构建部署。

1. 新建仓库（如 `site`），推代码上去，分支用 `main`
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**
3. 推送后 Actions 会自动跑 → 构建 → 部署
4. Settings → Pages → Custom domain 填 `yujianxiaoquan.online`，保存（仓库里已有 `public/CNAME`，构建后会带过去）
5. 阿里云云解析添加记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 600 |
| A | `@` | `185.199.109.153` | 600 |
| A | `@` | `185.199.110.153` | 600 |
| A | `@` | `185.199.111.153` | 600 |
| CNAME | `www` | `ziyu09.github.io` | 600 |

6. 回 GitHub Pages 勾选 **Enforce HTTPS**（证书签发可能等几分钟到几小时）

缺点：国内访问 GitHub Pages 时快时慢，不稳定。

---

## 方案 C：阿里云 OSS + CDN（国内最快，但必须备案）

1. 创建 OSS Bucket，读写权限设为「公共读」，开启静态网站托管（默认首页 `index.html`，默认 404 页 `404.html`）
2. 上传 `dist/` 全部文件
3. 绑定自定义域名到 Bucket，走阿里云 CDN 加速
4. **前提：域名必须完成 ICP 备案。** `.online` 后缀能否备案，以阿里云备案系统的后缀校验结果为准；未备案的域名无法解析到中国大陆节点
5. 成本：OSS 存储 + CDN 流量，个人站一年几十元级别

---

## 本地开发常用命令

```bash
cd D:\work buddy缓存\Claw\site
npm run dev      # 本地开发，热更新，默认 4321 端口
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 新增文章

在 `src/content/posts/` 下建 `.md` 文件，文件名用英文短横线格式（如 `my-new-post.md`），头部写：

```yaml
---
title: "文章标题"
pubDate: 2026-11-15
tags:
  - 随笔
featured: false
---
```

正文用 Markdown 写。保存后重新构建即可，无需改任何代码。

## 改个人信息

编辑 `src/consts.ts`：站名、副标题、简介、邮箱、GitHub、头像路径都在这里。关于页文案在 `src/pages/about.astro`。
