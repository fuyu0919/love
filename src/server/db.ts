import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SCHEMA_SQL } from './schema.mjs';

const dbPath = resolve(
  process.env.DATABASE_PATH ?? import.meta.env.DATABASE_PATH ?? 'data/site.db'
);
mkdirSync(dirname(dbPath), { recursive: true });

// 开发时模块会热重载，用 global 缓存避免重复打开连接
const globalRef = globalThis as unknown as { __siteDb?: Database.Database };

function open(): Database.Database {
  const database = new Database(dbPath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.exec(SCHEMA_SQL);
  database.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Math.floor(Date.now() / 1000));

  // 首次启动时用环境变量创建管理员，服务器部署时无需额外执行 seed
  const username = process.env.ADMIN_USERNAME ?? '';
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (username && password) {
    const count = (database.prepare('SELECT COUNT(*) AS n FROM admins').get() as { n: number }).n;
    if (count === 0) {
      database
        .prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
        .run(username, bcrypt.hashSync(password, 12));
    }
  }
  return database;
}

export const db = globalRef.__siteDb ?? (globalRef.__siteDb = open());

export interface Post {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string;
  featured: number;
  status: 'draft' | 'published';
  pub_date: string;
  created_at: string;
  updated_at: string;
}

export interface PostInput {
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published';
  pub_date: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export function listPosts(): Post[] {
  return db
    .prepare('SELECT * FROM posts ORDER BY featured DESC, pub_date DESC, id DESC')
    .all() as Post[];
}

export function getPost(id: number): Post | undefined {
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as Post | undefined;
}

function uniqueSlug(base: string, excludeId?: number): string {
  const clean = base.replace(/^-+|-+$/g, '') || `post-${Date.now().toString(36)}`;
  let slug = clean;
  let n = 2;
  while (
    db
      .prepare('SELECT id FROM posts WHERE slug = ? AND id IS NOT ?')
      .get(slug, excludeId ?? null)
  ) {
    slug = `${clean}-${n++}`;
  }
  return slug;
}

export function createPost(input: PostInput): number {
  const result = db
    .prepare(
      `INSERT INTO posts (slug, title, summary, body, tags, featured, status, pub_date)
       VALUES (@slug, @title, @summary, @body, @tags, @featured, @status, @pub_date)`
    )
    .run({
      slug: uniqueSlug(input.slug),
      title: input.title,
      summary: input.summary,
      body: input.body,
      tags: JSON.stringify(input.tags),
      featured: input.featured ? 1 : 0,
      status: input.status,
      pub_date: input.pub_date || today(),
    });
  return Number(result.lastInsertRowid);
}

export function updatePost(id: number, input: PostInput): void {
  db.prepare(
    `UPDATE posts SET slug = @slug, title = @title, summary = @summary, body = @body,
       tags = @tags, featured = @featured, status = @status, pub_date = @pub_date,
       updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    slug: uniqueSlug(input.slug, id),
    title: input.title,
    summary: input.summary,
    body: input.body,
    tags: JSON.stringify(input.tags),
    featured: input.featured ? 1 : 0,
    status: input.status,
    pub_date: input.pub_date || today(),
  });
}

export function deletePost(id: number): void {
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}

export function postStats() {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
        SUM(status = 'published') AS published,
        SUM(status = 'draft') AS drafts
       FROM posts`
    )
    .get() as { total: number; published: number | null; drafts: number | null };
  return {
    total: row.total,
    published: row.published ?? 0,
    drafts: row.drafts ?? 0,
  };
}

export function mediaStats() {
  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  return {
    photos: count('photos'),
    videos: count('videos'),
    timeline: count('timeline'),
  };
}

// ---------- 公开页面 ----------

export function publishedPosts(): Post[] {
  return db
    .prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY featured DESC, pub_date DESC, id DESC")
    .all() as Post[];
}

export function getPostBySlug(slug: string): Post | undefined {
  return db
    .prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .get(slug) as Post | undefined;
}

export function allTags(): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of publishedPosts()) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(post.tags);
    } catch {
      tags = [];
    }
    for (const tag of tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// ---------- 照片 / 视频 / 时间轴 ----------

export interface Photo {
  id: number;
  src: string;
  caption: string;
  sort: number;
}

export function listPhotos(): Photo[] {
  return db.prepare('SELECT id, src, caption, sort FROM photos ORDER BY sort ASC, id ASC').all() as Photo[];
}

export function addPhoto(src: string, caption = ''): number {
  const result = db.prepare('INSERT INTO photos (src, caption) VALUES (?, ?)').run(src, caption);
  return Number(result.lastInsertRowid);
}

export function updatePhotoCaption(id: number, caption: string): void {
  db.prepare('UPDATE photos SET caption = ? WHERE id = ?').run(caption, id);
}

export function deletePhoto(id: number): void {
  db.prepare('DELETE FROM photos WHERE id = ?').run(id);
}

export interface Video {
  id: number;
  title: string;
  src: string;
  poster: string;
  sort: number;
}

export function listVideos(): Video[] {
  return db
    .prepare('SELECT id, title, src, poster, sort FROM videos ORDER BY sort ASC, id ASC')
    .all() as Video[];
}

export function addVideo(title: string, src: string, poster = ''): number {
  const result = db.prepare('INSERT INTO videos (title, src, poster) VALUES (?, ?, ?)').run(title, src, poster);
  return Number(result.lastInsertRowid);
}

export function deleteVideo(id: number): void {
  db.prepare('DELETE FROM videos WHERE id = ?').run(id);
}

export interface TimelineItem {
  id: number;
  date: string;
  title: string;
  text: string;
  sort: number;
}

export function listTimeline(): TimelineItem[] {
  return db
    .prepare('SELECT id, date, title, text, sort FROM timeline ORDER BY date ASC, sort ASC, id ASC')
    .all() as TimelineItem[];
}

export function addTimeline(date: string, title: string, text = ''): number {
  const result = db.prepare('INSERT INTO timeline (date, title, text) VALUES (?, ?, ?)').run(date, title, text);
  return Number(result.lastInsertRowid);
}

export function deleteTimeline(id: number): void {
  db.prepare('DELETE FROM timeline WHERE id = ?').run(id);
}
