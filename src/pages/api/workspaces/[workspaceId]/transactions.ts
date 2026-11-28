import type { APIRoute } from "astro";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const getTransactionCollection = (workspaceId: string) =>
  collection(db, "workspaces", workspaceId, "transactions");

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

function transactionFields(body: Record<string, unknown>) {
  // IDs and timestamps are managed by this API, not supplied by clients.
  const { id: _id, transactionId: _transactionId, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = body;
  return fields;
}

function firestoreFields(fields: Record<string, unknown>): Record<string, unknown> | null {
  if (!("occurredAt" in fields)) return fields;
  const value = fields.occurredAt;
  if (typeof value === "string" || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    return { ...fields, occurredAt: Timestamp.fromDate(date) };
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number(value.seconds);
    const nanoseconds = "nanoseconds" in value ? Number(value.nanoseconds) : 0;
    if (Number.isFinite(seconds) && Number.isFinite(nanoseconds)) {
      return { ...fields, occurredAt: new Timestamp(seconds, nanoseconds) };
    }
  }
  return null;
}

function timestampToIso(value: any) {
  return value?.toDate?.()?.toISOString?.() ?? value ?? null;
}

// GET /api/workspaces/:workspaceId/transactions
export const GET: APIRoute = async ({ params }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  try {
    const workspace = await getDoc(doc(db, "workspaces", workspaceId));
    if (!workspace.exists()) return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);

    const snapshot = await getDocs(getTransactionCollection(workspaceId));
    const transactions = snapshot.docs.map((transaction) => {
      const data = transaction.data();
      return {
        id: transaction.id,
        ...data,
        occurredAt: timestampToIso(data.occurredAt),
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    });
    return json({ transactions });
  } catch (error) {
    console.error("GET workspace transactions failed:", error);
    return json({ error: "មិនអាចទាញយក transactions ពី Firebase បានទេ។" }, 500);
  }
};

// POST /api/workspaces/:workspaceId/transactions
export const POST: APIRoute = async ({ params, request }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  const body = await parseBody(request);
  if (!body) return json({ error: "Request body ត្រូវតែជា JSON object ត្រឹមត្រូវ។" }, 400);
  const fields = firestoreFields(transactionFields(body));
  if (!fields) return json({ error: "occurredAt ត្រូវតែជាកាលបរិច្ឆេទត្រឹមត្រូវ។" }, 400);
  if (Object.keys(fields).length === 0) {
    return json({ error: "សូមផ្ញើទិន្នន័យ transaction យ៉ាងតិចមួយ field។" }, 400);
  }

  try {
    const workspace = await getDoc(doc(db, "workspaces", workspaceId));
    if (!workspace.exists()) return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);

    const now = new Date().toISOString();
    const transactionRef = await addDoc(getTransactionCollection(workspaceId), {
      ...fields,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return json({
      success: true,
      transaction: {
        id: transactionRef.id,
        ...transactionFields(body),
        createdAt: now,
        updatedAt: now,
      },
    }, 201);
  } catch (error) {
    console.error("POST workspace transaction failed:", error);
    return json({ error: "មិនអាចបង្កើត transaction ក្នុង Firebase បានទេ។" }, 500);
  }
};

// PUT /api/workspaces/:workspaceId/transactions  { "id": "...", ...fields }
export const PUT: APIRoute = async ({ params, request }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  const body = await parseBody(request);
  if (!body) return json({ error: "Request body ត្រូវតែជា JSON object ត្រឹមត្រូវ។" }, 400);
  const transactionId = typeof body.id === "string"
    ? body.id.trim()
    : typeof body.transactionId === "string" ? body.transactionId.trim() : "";
  if (!transactionId) return json({ error: "សូមផ្ញើ transaction id ក្នុង field id។" }, 400);

  const fields = firestoreFields(transactionFields(body));
  if (!fields) return json({ error: "occurredAt ត្រូវតែជាកាលបរិច្ឆេទត្រឹមត្រូវ។" }, 400);
  if (Object.keys(fields).length === 0) {
    return json({ error: "សូមផ្ញើ field យ៉ាងតិចមួយសម្រាប់កែប្រែ។" }, 400);
  }

  try {
    const workspace = await getDoc(doc(db, "workspaces", workspaceId));
    if (!workspace.exists()) return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);

    const transactionRef = doc(getTransactionCollection(workspaceId), transactionId);
    const current = await getDoc(transactionRef);
    if (!current.exists()) return json({ error: "រកមិនឃើញ transaction នេះទេ។" }, 404);

    await updateDoc(transactionRef, { ...fields, updatedAt: serverTimestamp() });
    return json({
      success: true,
      transaction: {
        id: transactionId,
        ...current.data(),
        ...transactionFields(body),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("PUT workspace transaction failed:", error);
    return json({ error: "មិនអាចកែប្រែ transaction ក្នុង Firebase បានទេ។" }, 500);
  }
};

// DELETE /api/workspaces/:workspaceId/transactions?id=<transactionId>
export const DELETE: APIRoute = async ({ params, request, url }) => {
  const workspaceId = params.workspaceId?.trim();
  if (!workspaceId) return json({ error: "សូមផ្ញើ workspaceId។" }, 400);

  let transactionId = url.searchParams.get("id")?.trim() ?? "";
  if (!transactionId) {
    const body = await parseBody(request);
    transactionId = typeof body?.id === "string"
      ? body.id.trim()
      : typeof body?.transactionId === "string" ? body.transactionId.trim() : "";
  }
  if (!transactionId) return json({ error: "សូមផ្ញើ transaction id ក្នុង query id ឬ body។" }, 400);

  try {
    const workspace = await getDoc(doc(db, "workspaces", workspaceId));
    if (!workspace.exists()) return json({ error: "រកមិនឃើញ workspace នេះទេ។" }, 404);

    const transactionRef = doc(getTransactionCollection(workspaceId), transactionId);
    const transaction = await getDoc(transactionRef);
    if (!transaction.exists()) return json({ error: "រកមិនឃើញ transaction នេះទេ។" }, 404);

    await deleteDoc(transactionRef);
    return json({ success: true, id: transactionId });
  } catch (error) {
    console.error("DELETE workspace transaction failed:", error);
    return json({ error: "មិនអាចលុប transaction ក្នុង Firebase បានទេ។" }, 500);
  }
};
