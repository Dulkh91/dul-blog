import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { createSession } from '../../../../lib/session';
import {
  getGoogleCredentials,
  getGoogleRedirectUri,
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
    return Response.redirect(new URL(`/login?error=${reason}`, url), 302);
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
    const existingGoogleUser = await prisma.user.findUnique({ where: { googleId: profile.sub } });
    const invitedUser = existingGoogleUser ?? await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) return fail('not_allowed');

    const user = await prisma.user.update({
      where: { id: invitedUser.id },
      data: {
        email,
        googleId: profile.sub,
        name: profile.name ?? invitedUser.name,
        avatar: profile.picture ?? invitedUser.avatar,
      },
    });

    stage = 'session';
    await createSession(user.id, cookies);
    const returnTo = cookies.get(GOOGLE_RETURN_COOKIE)?.value ?? '/dashboard';
    const returnUrl = new URL(returnTo, url.origin);
    clearOAuthCookies();
    return Response.redirect(returnUrl.origin === url.origin ? returnUrl : new URL('/dashboard', url), 302);
  } catch (error) {
    console.error(`Google OAuth callback failed during ${stage}:`, error);
    return fail(stage);
  }
};
