import { createHash, randomBytes } from 'node:crypto';

export const GOOGLE_STATE_COOKIE = 'google_oauth_state';
export const GOOGLE_VERIFIER_COOKIE = 'google_oauth_verifier';
export const GOOGLE_RETURN_COOKIE = 'google_oauth_return_to';
export const SESSION_COOKIE = 'session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

const isProduction = import.meta.env.PROD;

type OAuthEnvName = 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'GOOGLE_REDIRECT_URI';

function envValue(name: OAuthEnvName) {
  // Keep these references static so Vite/Astro can load values from .env.
  switch (name) {
    case 'GOOGLE_CLIENT_ID':
      return import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    case 'GOOGLE_CLIENT_SECRET':
      return import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    case 'GOOGLE_REDIRECT_URI':
      return import.meta.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;
  }
}

export function getGoogleCredentials() {
  const clientId = envValue('GOOGLE_CLIENT_ID');
  const clientSecret = envValue('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials are not configured.');
  return { clientId, clientSecret };
}

export function getGoogleRedirectUri(requestUrl: URL) {
  return envValue('GOOGLE_REDIRECT_URI') || new URL('/api/auth/google/callback', requestUrl.origin).toString();
}

export function createOAuthValue() {
  return randomBytes(32).toString('base64url');
}

export function createCodeChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
