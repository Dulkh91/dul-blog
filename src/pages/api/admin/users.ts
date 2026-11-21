import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  Response.json(data, { status });

function isPrismaError(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export const PUT: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  if (!body || typeof body !== 'object') return json({ error: 'Invalid request body.' }, 400);
  const input = body as Record<string, unknown>;
  const id = typeof input.id === 'string' ? input.id : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const role = input.role;

  if (!id) return json({ error: 'User ID is required.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'សូមបញ្ចូលអ៊ីមែលឲ្យបានត្រឹមត្រូវ។' }, 400);
  if (role !== 'ADMIN' && role !== 'EDITOR') return json({ error: 'សូមជ្រើសរើស role ត្រឹមត្រូវ។' }, 400);

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return json({ error: 'រកមិនឃើញអ្នកប្រើនេះទេ។' }, 404);

    if (existing.googleId && email !== existing.email.toLowerCase()) {
      return json({ error: 'មិនអាចកែអ៊ីមែលដែលបានភ្ជាប់ Google រួចទេ។' }, 409);
    }

    if (existing.role === 'ADMIN' && role === 'EDITOR') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) return json({ error: 'ត្រូវមាន Admin យ៉ាងតិចម្នាក់។' }, 409);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { email, name: name || null, role },
      select: { id: true, email: true, name: true, role: true },
    });
    return json({ user });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) return json({ error: 'អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ។' }, 409);
    console.error('PUT /api/admin/users failed:', error);
    return json({ error: 'មិនអាចកែអ្នកប្រើបានទេ។' }, 500);
  }
};
