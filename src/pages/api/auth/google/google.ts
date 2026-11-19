import type { APIRoute } from 'astro';
import {
  cookieOptions,
  createCodeChallenge,
  createOAuthValue,
  getGoogleCredentials,
  getGoogleRedirectUri,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  GOOGLE_RETURN_COOKIE,
} from '../../../../lib/oauth';

export const prerender = false;

export const GET: APIRoute = ({ url, cookies }) => {
  try {
    const { clientId } = getGoogleCredentials();
    const state = createOAuthValue();
    const verifier = createOAuthValue();
    const redirectUri = getGoogleRedirectUri(url);
    const requestedReturnTo = url.searchParams.get('returnTo') ?? '/dashboard';
    const returnUrl = new URL(requestedReturnTo, url.origin);
    const returnTo = returnUrl.origin === url.origin && requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//')
      ? `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`
      : '/dashboard';

    cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions(600));
    cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, cookieOptions(600));
    cookies.set(GOOGLE_RETURN_COOKIE, returnTo, cookieOptions(600));

    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: createCodeChallenge(verifier),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString();

    return Response.redirect(authorizationUrl, 302);
  } catch (error) {
    console.error('Could not start Google OAuth:', error);
    return new Response('Google sign-in is not configured.', { status: 503 });
  }
};
