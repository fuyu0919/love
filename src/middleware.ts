import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, getSessionAdmin } from './server/auth';

const LOGIN_PATH = '/admin/login';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
    return next();
  }

  const isLogin = pathname.replace(/\/$/, '') === LOGIN_PATH;
  const admin = getSessionAdmin(context.cookies.get(SESSION_COOKIE)?.value);
  context.locals.admin = admin;

  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = context.request.headers.get('origin');
    if (origin) {
      let originHost = '';
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = '';
      }
      if (originHost !== context.url.host) {
        return new Response('请求来源不合法', { status: 403 });
      }
    }
  }

  if (isLogin) {
    if (admin && method === 'GET') {
      return context.redirect('/admin');
    }
    return next();
  }

  if (!admin) {
    return context.redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }
  return next();
});
