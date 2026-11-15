# 自己改站点：文件对应表

所有修改都在 `D:\work buddy缓存\Claw\site` 目录里。改完跑一次 `npm run build` 就能看到效果，或 `npm run dev` 边改边看。

---

## 1. 改个人信息（最常用）

文件：`src/consts.ts`

```ts
export const SITE = {
  name: '子諭',                    // 你的名字，显示在首页大标题和页脚
  title: '子諭的平凡日记',          // 站点名，显示在浏览器标题栏和左上角
  tagline: '读书 学习 去更远的地方', // 首页名字下面那行小字
  description: '子諭的个人网站：学习笔记、随笔与生活记录。', // 搜索结果里的描述
  avatar: '/images/111.jpg',        // 头像，换成 public/images 里任意一张
  email: '1025490868@qq.com',       // 关于页的邮箱
  github: 'https://github.com/Ziyu09',
};

export const INTRO = [
  '你好，我是子諭。',
  '这里是我的个人网站，记录学习笔记、技术积累和一些随想。读书，学习，去更远的地方。',
];
```

`INTRO` 数组里每一项就是首页的一段话，想加一段就加一行，想删就删那一行。注意每段用单引号包起来，末尾有逗号。

---

## 2. 改关于页

文件：`src/pages/about.astro`

`<div class="prose">` 里面就是正文，用 HTML 写：

- 段落：`<p>xxxxxxxx</p>`
- 列表：`<ul><li>条目</li></ul>`
- 链接：`<a href="https://...">文字</a>`
- 加粗：`<strong>文字</strong>`

---

## 3. 写新文章

在 `src/content/posts/` 下新建一个 `.md` 文件。

**文件名规则**：全小写英文 + 短横线，不要用中文、空格、括号。例如 `2026-review.md`。文件名会成为网址的一部分：`yujianxiaoquan.online/blog/2026-review/`

**文件内容**：

```markdown
---
title: "文章标题写这里"
pubDate: 2026-11-15
tags:
  - 随笔
  - 技术
featured: false
---

正文从这里开始，用 Markdown 写。

## 二级标题

普通段落。**加粗**，*斜体*，`行内代码`。

- 列表项一
- 列表项二

> 引用内容

代码块：

```javascript
console.log('hello');
```
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 文章标题，用双引号包起来 |
| `pubDate` | 是 | 日期，格式 `YYYY-MM-DD`，决定排序 |
| `tags` | 否 | 标签数组，每行一个，前面两个空格 + 短横线 |
| `featured` | 否 | 写 `true` 就置顶（文章列表里排最前，带「置顶」标记） |

---

## 4. 删文章 / 藏文章

直接删掉 `src/content/posts/` 里对应的 `.md` 文件即可，重新构建后自动消失。

想暂时藏起来又不想删，把文件移出这个目录（比如放到 `D:\blog-backup\`）。

---

## 5. 改顶部菜单

文件：`src/layouts/BaseLayout.astro`，找到这段：

```js
const nav = [
  { href: '/', label: '首页' },
  { href: '/blog/', label: '文章' },
  { href: '/tags/', label: '标签' },
  { href: '/about/', label: '关于' },
];
```

加一项就加一行；不想要「标签」页就把那行删掉。

---

## 6. 改主色调

文件：`src/styles/global.css`，开头部分：

```css
:root {
  --accent: #0f766e;  /* 主题色：深青色 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --accent: #2dd4bf;  /* 深色模式下的主题色，要亮一些 */
  }
}
```

两个值都要改，浅色模式用深色系、深色模式用浅色系，否则看不清。

---

## 7. 换头像

1. 把图片放进 `public/images/` 目录
2. 改 `src/consts.ts` 里的 `avatar: '/images/你的文件名.jpg'`

建议尺寸 400×400 以内，正方形。

---

## 8. 改完怎么发布

```bash
cd "D:\work buddy缓存\Claw\site"
npm run build
git add -A
git commit -m "更新内容"
git push
```

推上去之后 Cloudflare Pages 会自动重新构建部署，一到两分钟生效。

---

## 常见坑

- **文件名带中文或空格** → 网址会出现一长串 `%E4%B8%AA...`，难看且容易出错。务必用英文。
- **front-matter 格式错** → 构建直接报错。注意 `---` 必须单独占一行，冒号后面要有一个空格。
- **`tags` 写成 `tags: 随笔`** → 会报错，它必须是一行一个的数组格式。
- **日期写成 `2026/11/15`** → 报错。必须是 `2026-11-15`。
- **构建报错别慌** → 报错信息里会给出行号和文件路径，多半是上面某一条。
