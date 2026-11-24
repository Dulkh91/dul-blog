import type { APIRoute } from "astro";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const getCategoryCollection = (workspaceId: string) =>
  collection(db, "workspaces", workspaceId, "categories");

async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function getCategoryName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function timestampToIso(value: any) {
  return value?.toDate?.()?.toISOString?.() ?? value ?? null;
}

async function workspaceExists(workspaceId: string) {
  const workspace = await getDoc(doc(db, "workspaces", workspaceId));
  return workspace.exists();
}

// GET /api/workspaces/:workspaceId/category
export const GET: APIRoute = async ({ params }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  try {
    if (!(await workspaceExists(workspaceId))) {
      return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);
    }

    const snapshot = await getDocs(getCategoryCollection(workspaceId));
    const categories = snapshot.docs.map((category) => {
      const data = category.data();
      return {
        id: category.id,
        ...data,
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    });

    return json({ categories });
  } catch (cause) {
    console.error("GET workspace categories failed:", cause);
    return json({ error: "មិនអាចទាញយក categories ពី Firebase បានទេ។" }, 500);
  }
};

// POST /api/workspaces/:workspaceId/category  { "name": "Food" }
export const POST: APIRoute = async ({ params, request }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  const body = await parseBody(request);
  if (!body) return json({ error: "Request body ត្រូវតែជា JSON object ត្រឹមត្រូវ។" }, 400);
  const name = getCategoryName(body.name);
  if (!name) return json({ error: "សូមបញ្ចូលឈ្មោះ category។" }, 400);

  try {
    if (!(await workspaceExists(workspaceId))) {
      return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);
    }

    const now = new Date().toISOString();
    const categoryRef = await addDoc(getCategoryCollection(workspaceId), {
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return json({
      success: true,
      category: { id: categoryRef.id, name, createdAt: now, updatedAt: now },
    }, 201);
  } catch (cause) {
    console.error("POST workspace category failed:", cause);
    return json({ error: "មិនអាចបង្កើត category ក្នុង Firebase បានទេ។" }, 500);
  }
};

// PUT /api/workspaces/:workspaceId/category  { "id": "...", "name": "Food" }
export const PUT: APIRoute = async ({ params, request }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  const body = await parseBody(request);
  if (!body) return json({ error: "Request body ត្រូវតែជា JSON object ត្រឹមត្រូវ។" }, 400);
  const categoryId = typeof body.id === "string" ? body.id.trim() : "";
  const name = getCategoryName(body.name);
  if (!categoryId) return json({ error: "សូមផ្ញើ category id ក្នុង field id។" }, 400);
  if (!name) return json({ error: "សូមបញ្ចូលឈ្មោះ category។" }, 400);

  try {
    if (!(await workspaceExists(workspaceId))) {
      return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);
    }

    const categoryRef = doc(getCategoryCollection(workspaceId), categoryId);
    if (!(await getDoc(categoryRef)).exists()) {
      return json({ error: "រកមិនឃើញ category នេះទេ។" }, 404);
    }

    await updateDoc(categoryRef, { name, updatedAt: serverTimestamp() });
    return json({ success: true, category: { id: categoryId, name, updatedAt: new Date().toISOString() } });
  } catch (cause) {
    console.error("PUT workspace category failed:", cause);
    return json({ error: "មិនអាចកែប្រែ category ក្នុង Firebase បានទេ។" }, 500);
  }
};

// DELETE /api/workspaces/:workspaceId/category?id=<categoryId>
export const DELETE: APIRoute = async ({ params, request, url }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  let categoryId = url.searchParams.get("id")?.trim() ?? "";
  if (!categoryId) {
    const body = await parseBody(request);
    categoryId = typeof body?.id === "string" ? body.id.trim() : "";
  }
  if (!categoryId) {
    return json({ error: "សូមផ្ញើ category id ក្នុង query id ឬ body។" }, 400);
  }

  try {
    if (!(await workspaceExists(workspaceId))) {
      return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);
    }

    const categoryRef = doc(getCategoryCollection(workspaceId), categoryId);
    if (!(await getDoc(categoryRef)).exists()) {
      return json({ error: "រកមិនឃើញ category នេះទេ។" }, 404);
    }

    await deleteDoc(categoryRef);
    return json({ success: true, id: categoryId });
  } catch (cause) {
    console.error("DELETE workspace category failed:", cause);
    return json({ error: "មិនអាចលុប category ក្នុង Firebase បានទេ។" }, 500);
  }
};
