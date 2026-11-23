import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { createSession } from '../../../../lib/session';
import {
  getGoogleCredentials,
  getGoogleRedirectUri,
  getAllowedGoogleEmails,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  GOOGLE_RETURN_COOKIE,
} from '../../../../lib/oauth';

export const prerender = false;

interface GoogleTokens {
  access_token?: string;
  error?: string;
}

interface GoogleProfile {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const clearOAuthCookies = () => {
    cookies.delete(GOOGLE_STATE_COOKIE, { path: '/' });
    cookies.delete(GOOGLE_VERIFIER_COOKIE, { path: '/' });
    cookies.delete(GOOGLE_RETURN_COOKIE, { path: '/' });
  };
  const fail = (reason = 'google') => {
    clearOAuthCookies();
    return new Response(null, {
      status: 302,
      headers: { Location: new URL(`/login?error=${reason}`, url).toString() },
    });
  };

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const expectedState = cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const verifier = cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;
  if (url.searchParams.has('error')) return fail('provider');
  if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier) return fail('state');

  let stage = 'token';
  try {
    const { clientId, clientSecret } = getGoogleCredentials();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleRedirectUri(url),
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });
    const tokens = await tokenResponse.json() as GoogleTokens;
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Google token exchange failed.');

    stage = 'profile';
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json() as GoogleProfile;
    if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error('Google did not return a verified email address.');
    }

    stage = 'database';
    const email = profile.email.toLowerCase();
    const isAllowlisted = getAllowedGoogleEmails().includes(email);
    const user = await prisma.$transaction(async (tx) => {
      // Serialize first-login provisioning so only one concurrent login becomes the initial admin.
      await tx.authBootstrap.upsert({
        where: { id: 'google-login-bootstrap' },
        update: {},
        create: { id: 'google-login-bootstrap' },
      });
      await tx.$queryRaw`SELECT "id" FROM "AuthBootstrap" WHERE "id" = 'google-login-bootstrap' FOR UPDATE`;

      const existingGoogleUser = await tx.user.findUnique({ where: { googleId: profile.sub } });
      const existingEmailUser = existingGoogleUser ?? await tx.user.findUnique({ where: { email } });
      if (existingEmailUser) {
        return tx.user.update({
          where: { id: existingEmailUser.id },
          data: {
            email,
            googleId: profile.sub,
            name: profile.name ?? existingEmailUser.name,
            avatar: profile.picture ?? existingEmailUser.avatar,
          },
        });
      }

      if (!isAllowlisted) return null;

      const role = await tx.user.count() === 0 ? 'ADMIN' : 'EDITOR';
      return tx.user.create({
        data: {
          email,
          googleId: profile.sub,
          name: profile.name,
          avatar: profile.picture,
          role,
        },
      });
    });
    if (!user) return fail('not_allowed');

    stage = 'session';
    await createSession(user.id, cookies);
    const returnTo = cookies.get(GOOGLE_RETURN_COOKIE)?.value ?? '/dashboard';
    const returnUrl = new URL(returnTo, url.origin);
    clearOAuthCookies();
    const destination = returnUrl.origin === url.origin ? returnUrl : new URL('/dashboard', url);
    return new Response(null, {
      status: 302,
      headers: { Location: destination.toString() },
    });
  } catch (error) {
    console.error(`Google OAuth callback failed during ${stage}:`, error);
    return fail(stage);
  }
};
