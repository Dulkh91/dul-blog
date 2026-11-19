import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const tagSchema = z.object({
  name: z.string().trim().min(1, 'ឈ្មោះ tag មិនអាចទទេបានទេ។'),
  slug: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
});
const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'ឈ្មោះ tag មិនអាចទទេបានទេ។'),
});

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
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    return json({ tags });
  } catch (error) {
    console.error('GET /api/tag/tag failed:', error);
    return json({ error: 'មិនអាចទាញយក tag បានទេ។' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body ត្រូវតែជា JSON ត្រឹមត្រូវ។' }, 400);
  }

  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues.map((issue) => issue.message) }, 400);
  }

  const { name, categoryId } = parsed.data;
  const slug = createSlug(parsed.data.slug || name);
  if (!slug) return json({ error: 'មិនអាចបង្កើត slug ពីឈ្មោះ tag នេះបានទេ។' }, 400);

  try {
    const tag = categoryId
      ? await prisma.tag.upsert({
          where: { name },
          update: { categories: { connect: { id: categoryId } } },
          create: { name, slug, categories: { connect: { id: categoryId } } },
        })
      : await prisma.tag.create({ data: { name, slug } });
    return json(tag, 201);
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      return json({ error: 'ឈ្មោះ ឬ slug tag នេះមានរួចហើយ។' }, 409);
    }
    if (isPrismaError(error, 'P2003') || isPrismaError(error, 'P2025')) {
      return json({ error: 'Category ដែលបានជ្រើសមិនមានក្នុង database ទេ។' }, 400);
    }
    console.error('POST /api/tag/tag failed:', error);
    return json({ error: 'មិនអាចបង្កើត tag បានទេ។' }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body ត្រូវតែជា JSON ត្រឹមត្រូវ។' }, 400);
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues.map((issue) => issue.message) }, 400);
  }

  const slug = createSlug(parsed.data.name);
  if (!slug) return json({ error: 'មិនអាចបង្កើត slug ពីឈ្មោះ tag នេះបានទេ។' }, 400);

  try {
    const tag = await prisma.tag.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name, slug },
      select: { id: true, name: true, slug: true },
    });
    return json(tag);
  } catch (error) {
    if (isPrismaError(error, 'P2025')) return json({ error: 'រកមិនឃើញ tag នេះទេ។' }, 404);
    if (isPrismaError(error, 'P2002')) return json({ error: 'ឈ្មោះ ឬ slug tag នេះមានរួចហើយ។' }, 409);
    console.error('PUT /api/tag/tag failed:', error);
    return json({ error: 'មិនអាចកែ tag បានទេ។' }, 500);
  }
};
