import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { prisma } from './prisma';
import { cookieOptions, getGoogleCredentials, SESSION_COOKIE, SESSION_DURATION_SECONDS } from './oauth';

function sign(payload: string) {
  const { clientSecret } = getGoogleCredentials();
  return createHmac('sha256', clientSecret).update(`dul-blog-session:${payload}`).digest('base64url');
}

export async function createSession(userId: string, cookies: AstroCookies) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  })).toString('base64url');
  cookies.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, cookieOptions(SESSION_DURATION_SECONDS));
}

export async function getSessionUser(cookies: AstroCookies) {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expectedSignature = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId?: unknown;
      expiresAt?: unknown;
    };
    if (typeof session.userId !== 'string' || typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) {
      cookies.delete(SESSION_COOKIE, { path: '/' });
      return null;
    }

    return await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });
  } catch {
    cookies.delete(SESSION_COOKIE, { path: '/' });
    return null;
  }
}

export async function deleteSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
