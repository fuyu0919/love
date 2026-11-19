import type { PostInput } from './db';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parsePostForm(form: FormData): { input: PostInput; error?: string } {
  const title = String(form.get('title') ?? '').trim();
  const rawSlug = String(form.get('slug') ?? '').trim();
  const date = String(form.get('pub_date') ?? '').trim();
  const tags = String(form.get('tags') ?? '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const input: PostInput = {
    title,
    slug: slugify(rawSlug || title) || `post-${Date.now().toString(36)}`,
    summary: String(form.get('summary') ?? '').trim(),
    body: String(form.get('body') ?? ''),
    tags,
    featured: form.get('featured') === 'on',
    status: form.get('status') === 'draft' ? 'draft' : 'published',
    pub_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
  };

  return { input, error: title ? undefined : '标题不能为空' };
}
