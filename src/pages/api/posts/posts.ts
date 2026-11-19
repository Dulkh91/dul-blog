import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

export const prerender = false;

const excerptLength = 160;

function getPlainText(content: string) {
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function createExcerpt(content: string) {
  const characters = Array.from(getPlainText(content));
  return characters.length > excerptLength
    ? `${characters.slice(0, excerptLength).join('')}…`
    : characters.join('');
}

const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim(),
  slug: z.string().trim().min(1, 'Slug មិនអាចទទេបានទេ។'),
  content: z.string(),
  categoryId: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().optional(),
  ),
  tagIds: z.array(z.string()).default([]),
  published: z.boolean().default(false),
}).superRefine((post, context) => {
  const plainContent = getPlainText(post.content);
  if (post.published && !post.title) {
    context.addIssue({ code: 'custom', path: ['title'], message: 'ចំណងជើងមិនអាចទទេបានទេ។' });
  }
  if (post.published && !plainContent) {
    context.addIssue({ code: 'custom', path: ['content'], message: 'ខ្លឹមសារមិនអាចទទេបានទេ។' });
  }
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function isPrismaError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

// GET /api/posts?page=1&limit=10&category=slug&tag=slug&q=term&includeDrafts=true
export const GET: APIRoute = async ({ url }) => {
  const postId = url.searchParams.get('id');
  if (postId) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: { select: { name: true, email: true } },
          category: true,
          tags: true,
        },
      });
      return post ? json({ post }) : json({ error: 'រកមិនឃើញអត្ថបទនេះទេ។' }, 404);
    } catch (error) {
      console.error('GET /api/posts?id=... failed:', error);
      return json({ error: 'មិនអាចទាញយកអត្ថបទនេះបានទេ។' }, 500);
    }
  }

  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 6);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return json({ error: 'page ត្រូវតែចាប់ពី 1 និង limit ត្រូវនៅចន្លោះ 1 ដល់ 100។' }, 400);
  }

  const includeDrafts = url.searchParams.get('includeDrafts') === 'true';
  const where: any = includeDrafts ? {} : { published: true };
  const category = url.searchParams.get('category');
  const tag = url.searchParams.get('tag');
  const query = url.searchParams.get('q')?.trim();
  if (category) where.category = { slug: category };
  if (tag) where.tags = { some: { slug: tag } };
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { excerpt: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
      { author: { is: { name: { contains: query, mode: 'insensitive' } } } },
      { category: { is: { name: { contains: query, mode: 'insensitive' } } } },
    ];
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          published: true,
          featured: true,
          authorId: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true, email: true } },
          category: true,
          tags: true,
          _count: { select: { tags: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    const missingExcerptIds = posts.filter((post) => post.excerpt === null).map((post) => post.id);
    const postsWithoutExcerpt = missingExcerptIds.length
      ? await prisma.post.findMany({
          where: { id: { in: missingExcerptIds } },
          select: { id: true, content: true },
        })
      : [];
    const contentById = new Map(postsWithoutExcerpt.map((post) => [post.id, post.content]));
    const postsWithExcerpt = posts.map((post) => ({
      ...post,
      excerpt: post.excerpt ?? createExcerpt(contentById.get(post.id) ?? ''),
    }));

    return json({
      posts: postsWithExcerpt,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/posts failed:', error);
    return json({ error: 'មិនអាចទាញយកអត្ថបទពី database បានទេ។' }, 500);
  }
};

// POST /api/posts
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body ត្រូវតែជា JSON ត្រឹមត្រូវ។' }, 400);
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues.map((issue) => issue.message) }, 400);
  }

  const { id = randomUUID(), title, slug, content, categoryId, tagIds, published } = parsed.data;

  try {
    // Static author for now; create the record automatically on first post.
    const author = await prisma.user.upsert({
      where: { email: 'dul@blog.local' },
      update: { name: 'dul' },
      create: { name: 'dul', email: 'dul@blog.local' },
      select: { id: true },
    });

    const postFields = { title, slug, content, excerpt: createExcerpt(content), published };

    const post = await prisma.post.upsert({
      where: { id },
      create: {
        id,
        ...postFields,
        author: { connect: { id: author.id } },
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        tags: { connect: tagIds.map((tagId) => ({ id: tagId })) },
      },
      update: {
        ...postFields,
        ...(categoryId ? { category: { connect: { id: categoryId } } } : { category: { disconnect: true } }),
        tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: true,
      },
    });

    return json(post, 200);
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      return json({ error: 'Slug នេះមានរួចហើយ។ សូមកែចំណងជើង។' }, 409);
    }
    if (isPrismaError(error, 'P2003') || isPrismaError(error, 'P2025')) {
      return json({ error: 'Category ឬ tag ដែលបានជ្រើសមិនមានក្នុង database ទេ។' }, 400);
    }
    console.error('POST /api/posts failed:', error);
    return json({ error: 'មិនអាចបង្កើតអត្ថបទបានទេ។ សូមពិនិត្យ database connection។' }, 500);
  }
};




// PUT /api/posts - update an existing post by id
export const PUT: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body ត្រូវតែជា JSON ត្រឹមត្រូវ។' }, 400);
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues.map((issue) => issue.message) }, 400);
  }

  const { id, title, slug, content, categoryId, tagIds, published } = parsed.data;
  if (!id) return json({ error: 'ត្រូវការ post id ដើម្បី update។' }, 400);

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt: createExcerpt(content),
        published,
        ...(categoryId ? { category: { connect: { id: categoryId } } } : { category: { disconnect: true } }),
        tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: true,
      },
    });

    return json(post);
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      return json({ error: 'រកមិនឃើញអត្ថបទដែលត្រូវ update ទេ។' }, 404);
    }
    if (isPrismaError(error, 'P2002')) {
      return json({ error: 'Slug នេះមានរួចហើយ។ សូមកែចំណងជើង។' }, 409);
    }
    if (isPrismaError(error, 'P2003')) {
      return json({ error: 'Category ឬ tag ដែលបានជ្រើសមិនមានក្នុង database ទេ។' }, 400);
    }
    console.error('PUT /api/posts failed:', error);
    return json({ error: 'មិនអាច update អត្ថបទបានទេ។' }, 500);
  }
};
