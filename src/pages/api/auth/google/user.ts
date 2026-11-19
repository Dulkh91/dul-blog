import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/session';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const user = await getSessionUser(cookies);
    return Response.json({ user }, { status: user ? 200 : 401 });
  } catch (error) {
    console.error('Could not read authenticated user:', error);
    return Response.json({ error: 'Could not read the current session.' }, { status: 500 });
  }
};
