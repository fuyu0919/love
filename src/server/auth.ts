import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';

export const SESSION_COOKIE = 'sid';
export const SESSION_TTL = 7 * 24 * 60 * 60; // 7 天

export interface Admin {
  id: number;
  username: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyLogin(username: string, password: string): Admin | null {
  const row = db
    .prepare('SELECT id, username, password_hash FROM admins WHERE username = ?')
    .get(username.trim()) as (Admin & { password_hash: string }) | undefined;
  if (!row) return null;
  return bcrypt.compareSync(password, row.password_hash)
    ? { id: row.id, username: row.username }
    : null;
}

export function createSession(adminId: number): { token: string; maxAge: number } {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL;
  db.prepare('INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)').run(
    sha256(token),
    adminId,
    expiresAt
  );
  return { token, maxAge: SESSION_TTL };
}

export function getSessionAdmin(token: string | undefined): Admin | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT a.id, a.username
       FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(sha256(token), Math.floor(Date.now() / 1000)) as Admin | undefined;
  return row ?? null;
}

export function destroySession(token: string | undefined): void {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function isSecureRequest(request: Request): boolean {
  return (
    new URL(request.url).protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https'
  );
}

// ---- 登录限流：同一 IP 15 分钟内最多 5 次失败 ----
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; first: number }>();

export function loginBlocked(ip: string): boolean {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordLoginFailure(ip: string): void {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    failures.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearLoginFailures(ip: string): void {
  failures.delete(ip);
}
