import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const categorySchema = z.object({
  name: z.string().trim().min(1, 'ឈ្មោះ category មិនអាចទទេបានទេ។'),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(500).optional(),
  subcategories: z.array(z.string().trim().min(1)).max(30).default([]),
});

const deleteSchema = z.object({ id: z.string().uuid() });
const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'ឈ្មោះ category មិនអាចទទេបានទេ។'),
  subcategories: z.array(z.string().trim().min(1)).max(30).default([]),
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
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        tags: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } },
      },
      orderBy: { name: 'asc' },
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
  const subcategories = [...new Map(parsed.data.subcategories.map((item) => [item.toLocaleLowerCase(), item])).values()];
  const slug = createSlug(parsed.data.slug || name);
  if (!slug) return json({ error: 'មិនអាចបង្កើត slug ពីឈ្មោះ category នេះបានទេ។' }, 400);
  if (subcategories.some((item) => !createSlug(item))) {
    return json({ error: 'ឈ្មោះ subcategory មិនអាចបង្កើត slug បានទេ។' }, 400);
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        ...(description ? { description } : {}),
        ...(subcategories.length ? {
          tags: {
            connectOrCreate: subcategories.map((subName) => ({
              where: { name: subName },
              create: { name: subName, slug: createSlug(subName) },
            })),
          },
        } : {}),
      },
      include: { tags: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } } },
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

// PUT /api/category/category - update the category name and its tag subcategories
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

  const { id, name } = parsed.data;
  const subcategories = [...new Map(parsed.data.subcategories.map((item) => [item.toLocaleLowerCase(), item])).values()];
  const slug = createSlug(name);
  if (!slug || subcategories.some((item) => !createSlug(item))) {
    return json({ error: 'ឈ្មោះ category ឬ subcategory មិនអាចបង្កើត slug បានទេ។' }, 400);
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        tags: {
          set: [],
          connectOrCreate: subcategories.map((subName) => ({
            where: { name: subName },
            create: { name: subName, slug: createSlug(subName) },
          })),
        },
      },
      include: { tags: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } } },
    });
    return json(category);
  } catch (error) {
    if (isPrismaError(error, 'P2025')) return json({ error: 'រកមិនឃើញ category ឬ tag មួយចំនួនទេ។' }, 404);
    if (isPrismaError(error, 'P2002')) return json({ error: 'ឈ្មោះ ឬ slug category/tag នេះមានរួចហើយ។' }, 409);
    console.error('PUT /api/category/category failed:', error);
    return json({ error: 'មិនអាចកែ category បានទេ។' }, 500);
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
