import type { APIRoute } from 'astro';
import { deleteSession } from '../../../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    await deleteSession(cookies);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Could not end session:', error);
    return Response.json({ error: 'Could not end the current session.' }, { status: 500 });
  }
};
