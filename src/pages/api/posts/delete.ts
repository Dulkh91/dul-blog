import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const deleteSchema = z.object({
  id: z.string().uuid(),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const DELETE: APIRoute = async ({ request }) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body ត្រូវតែជា JSON ត្រឹមត្រូវ។' }, 400);
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'ត្រូវការ post id ត្រឹមត្រូវដើម្បីលុប។' }, 400);
  }

  try {
    await prisma.post.delete({ where: { id: parsed.data.id } });
    return json({ success: true, id: parsed.data.id });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return json({ error: 'រកមិនឃើញ post នេះទេ។' }, 404);
    }

    console.error('DELETE /api/delete failed:', error);
    return json({ error: 'មិនអាចលុប post បានទេ។' }, 500);
  }
};
