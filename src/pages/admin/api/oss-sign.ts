import type { APIRoute } from 'astro';
import { createPostSignature } from '../../../server/oss';

export const prerender = false;

export const GET: APIRoute = () => {
  const data = createPostSignature();
  if (!data) {
    return new Response(JSON.stringify({ error: '未配置 OSS，请先在 .env 填写 OSS_* 变量' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
