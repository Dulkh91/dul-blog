import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/session';

function requiresAuthentication(request: Request, pathname: string, url: URL) {
  const method = request.method.toUpperCase();
  if (pathname.startsWith('/dashboard')) return true;
  if (pathname === '/api/posts/posts') {
    return method !== 'GET' || url.searchParams.has('id') || url.searchParams.get('includeDrafts') === 'true';
  }
  if (pathname === '/api/posts/delete') return true;
  if (pathname === '/api/category/category' || pathname === '/api/tag/tag') return method !== 'GET';
  return false;
}

function requiresAdmin(pathname: string) {
  return pathname === '/dashboard/add-users' || pathname.startsWith('/dashboard/add-users/');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, cookies } = context;
  if (!requiresAuthentication(request, url.pathname, url)) return next();

  try {
    const user = await getSessionUser(cookies);
    if (user) {
      if (requiresAdmin(url.pathname) && user.role !== 'ADMIN') {
        return context.redirect('/dashboard?error=admin_required', 302);
      }
      return next();
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
  }

  if (url.pathname.startsWith('/api/')) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const loginUrl = new URL('/login', url);
  loginUrl.searchParams.set('returnTo', `${url.pathname}${url.search}`);
  return context.redirect(loginUrl.toString(), 302);
});
