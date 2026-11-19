import Database from 'better-sqlite3';
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
