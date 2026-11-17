import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const categorySchema = z.object({
  name: z.string().trim().min(1, 'ឈ្មោះ category មិនអាចទទេបានទេ។'),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(500).optional(),
});

const deleteSchema = z.object({ id: z.string().uuid() });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function isPrismaError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

function createSlug(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}



export const GET: APIRoute = async () => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
    return categories ? json({ categories }) : json({ error: 'រកមិនឃើញអត្ថបទនេះទេ។' }, 404);
  } catch (error) {
    console.error('Failed to fetch category', error);
    return json({ error: 'មិនអាចទាញយកអត្ថបទនេះបានទេ។' }, 500);
  }
};





// POST /api/category/category
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body ត្រូវតែជា JSON ត្រឹមត្រូវ។' }, 400);
  }

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues.map((issue) => issue.message) }, 400);
  }

  const { name, description } = parsed.data;
  const slug = createSlug(parsed.data.slug || name);
  if (!slug) return json({ error: 'មិនអាចបង្កើត slug ពីឈ្មោះ category នេះបានទេ។' }, 400);

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        ...(description ? { description } : {}),
      },
    });
    return json(category, 201);
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      return json({ error: 'ឈ្មោះ ឬ slug category នេះមានរួចហើយ។' }, 409);
    }
    console.error('POST /api/category/category failed:', error);
    return json({ error: 'មិនអាចបង្កើត category បានទេ។' }, 500);
  }
};

// DELETE /api/category/category with JSON body: { id }
export const DELETE: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body ត្រូវតែជា JSON ត្រឹមត្រូវ។' }, 400);
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'ត្រូវការ category id ត្រឹមត្រូវដើម្បីលុប។' }, 400);
  }

  try {
    await prisma.category.delete({ where: { id: parsed.data.id } });
    return json({ success: true, id: parsed.data.id });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return json({ error: 'រកមិនឃើញ category នេះទេ។' }, 404);
    }
    if (isPrismaError(error, 'P2003')) {
      return json({ error: 'មិនអាចលុប category នេះបានទេ ព្រោះវាត្រូវបានប្រើដោយ post មួយចំនួន។' }, 409);
    }
    console.error('DELETE /api/category/category failed:', error);
    return json({ error: 'មិនអាចលុប category បានទេ។' }, 500);
  }
};
