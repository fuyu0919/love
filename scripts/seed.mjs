// 初始化数据库：建表、创建管理员、导入现有 Markdown 日记
// 用法：npm run seed（可重复执行，不会覆盖已有数据）
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import matter from 'gray-matter';
import { SCHEMA_SQL } from '../src/server/schema.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// 读取 .env（已存在的环境变量优先）
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

const dbPath = resolve(root, process.env.DATABASE_PATH || 'data/site.db');
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(SCHEMA_SQL);

// 管理员
const adminCount = db.prepare('SELECT COUNT(*) AS n FROM admins').get().n;
if (adminCount === 0) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = Buffer.from(crypto.getRandomValues(new Uint8Array(9))).toString('base64url');
    console.log(`未设置 ADMIN_PASSWORD，已生成随机密码：${password}`);
  }
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
    username,
    bcrypt.hashSync(password, 12)
  );
  console.log(`已创建管理员：${username}`);
} else {
  console.log('管理员已存在，跳过');
}

// 导入 src/content/posts 下的 Markdown
const postsDir = join(root, 'src', 'content', 'posts');
const insert = db.prepare(
  `INSERT OR IGNORE INTO posts (slug, title, summary, body, tags, featured, status, pub_date)
   VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`
);
let imported = 0;
let skipped = 0;

if (existsSync(postsDir)) {
  for (const file of readdirSync(postsDir).filter((name) => name.endsWith('.md'))) {
    const raw = readFileSync(join(postsDir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, '');
    const title = String(data.title || slug);
    const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const date =
      data.pubDate instanceof Date
        ? data.pubDate.toISOString().slice(0, 10)
        : String(data.pubDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const text = content.trim();
    const summary = String(data.summary || text.replace(/\s+/g, ' ').slice(0, 80));

    const result = insert.run(
      slug,
      title,
      summary,
      text,
      JSON.stringify(tags),
      data.featured ? 1 : 0,
      date
    );
    if (result.changes > 0) {
      imported += 1;
    } else {
      skipped += 1;
    }
  }
}

console.log(`数据库：${dbPath}`);
console.log(`导入日记 ${imported} 篇，跳过已存在 ${skipped} 篇`);
